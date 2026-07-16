// ─────────────────────────────────────────────────────────────────────────────
// Kayal Events — Dance Team Performer Registration Backend
// Google Apps Script web app
// ─────────────────────────────────────────────────────────────────────────────

// ── Helpers ──────────────────────────────────────────────────────────────────

function randomAlpha(len) {
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars (0,O,1,I)
  var result = "";
  for (var i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function hmacHex(message) {
  var sigBytes = Utilities.computeHmacSha256Signature(
    message,
    CONFIG.HMAC_SECRET
  );
  return sigBytes
    .map(function (b) {
      return ("0" + (b & 0xff).toString(16)).slice(-2);
    })
    .join("");
}

function generateRegistrationId() {
  return CONFIG.CODE_PREFIX + "-" + randomAlpha(8);
}

function isPastClose() {
  return CONFIG.CLOSE_UTC && new Date() > new Date(CONFIG.CLOSE_UTC);
}

function jsonOk(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function jsonErr(msg) {
  return ContentService.createTextOutput(
    JSON.stringify({ error: msg })
  ).setMimeType(ContentService.MimeType.JSON);
}

function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function extensionForMime(mime) {
  if (mime === "image/png") return "png";
  if (mime === "application/pdf") return "pdf";
  return "jpg";
}

// ── Resource bootstrap ───────────────────────────────────────────────────────

// Run this ONCE from the Apps Script IDE, then paste IDs into Config.gs.
// eslint-disable-next-line no-unused-vars
function bootstrapResources() {
  if (!CONFIG.SHEET_ID) {
    var ss = SpreadsheetApp.create("Kayal Events Dance Team Registrations");
    var sheet = ss.getSheets()[0];
    sheet.setName("Registrations");
    sheet.appendRow(SHEET_HEADERS);
    sheet.setFrozenRows(1);
    Logger.log("SHEET_ID: " + ss.getId());
  }
  if (!CONFIG.DRIVE_PARENT_FOLDER) {
    var folder = DriveApp.createFolder("Dance Team Registrations");
    Logger.log("DRIVE_PARENT_FOLDER: " + folder.getId());
  }
}

// ── Sheet ─────────────────────────────────────────────────────────────────────

var SHEET_HEADERS = [
  "submitted_at",
  "registration_id",
  "dancer_first_name",
  "dancer_last_name",
  "contact_number",
  "full_length_photo_url",
  "close_up_photo_url",
  "id_proof_url",
  "tcs_accepted",
  "signature_full_name",
  "signature_date",
  "status",
  "reviewer_notes",
  "reviewed_by",
  "reviewed_at",
];

function getSheet() {
  var ss;
  if (CONFIG.SHEET_ID) {
    ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  } else {
    var props = PropertiesService.getScriptProperties();
    var cachedId = props.getProperty("auto_sheet_id");
    if (cachedId) {
      ss = SpreadsheetApp.openById(cachedId);
    } else {
      ss = SpreadsheetApp.create("Kayal Events Dance Team Registrations");
      props.setProperty("auto_sheet_id", ss.getId());
      Logger.log("Created Sheet: " + ss.getId() + " — add to Config.SHEET_ID");
    }
  }

  var sheet = ss.getSheetByName("Registrations") || ss.getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHEET_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getDriveFolder() {
  if (CONFIG.DRIVE_PARENT_FOLDER) return DriveApp.getFolderById(CONFIG.DRIVE_PARENT_FOLDER);

  var props = PropertiesService.getScriptProperties();
  var cachedId = props.getProperty("auto_drive_folder_id");
  if (cachedId) return DriveApp.getFolderById(cachedId);

  var folder = DriveApp.createFolder("Dance Team Registrations");
  props.setProperty("auto_drive_folder_id", folder.getId());
  Logger.log("Created Drive folder: " + folder.getId() + " — add to Config.DRIVE_PARENT_FOLDER");
  return folder;
}

function getOrCreateSubfolder(parent, name) {
  var existing = parent.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return parent.createFolder(name);
}

// ── doGet ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
function doGet(e) {
  var action = (e.parameter && e.parameter.action) || "";
  var page = (e.parameter && e.parameter.page) || "";
  var token = (e.parameter && e.parameter.token) || "";

  try {
    if (action === "issueCode") return handleIssueCode();
    if (page === "admin") return serveAdminPage(token);
    return jsonOk({ status: "ok", service: "Kayal Events Dance Team Registration" });
  } catch (err) {
    return jsonErr(err.message);
  }
}

function handleIssueCode() {
  var code = CONFIG.CODE_PREFIX + "-" + randomAlpha(3);
  var issuedAt = new Date().toISOString();
  var token = hmacHex(code + "|" + issuedAt);

  return jsonOk({
    code: code,
    issuedAt: issuedAt,
    token: token,
    deadline: CONFIG.CLOSE_UTC || null,
    deadlineDisplay: CONFIG.CLOSE_DISPLAY || null,
    serverTime: new Date().toISOString(),
  });
}

// ── doPost ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action || "";

    if (action === "submit") return handleSubmit(body);

    // Admin HTTP endpoints (token validated inside each handler via requirePanel)
    if (action === "adminGetSubmissions") return jsonOk(getSubmissions(body.token));
    if (action === "adminUpdateSubmission")
      return jsonOk(updateSubmission(body.registrationId, body.status, body.reviewerNotes, body.token));
    if (action === "adminGetReviewerEmail") return jsonOk({ email: getReviewerEmail(body.token) });

    return jsonErr("Unknown action.");
  } catch (err) {
    return jsonErr(err.message);
  }
}

// ── Freshness token ───────────────────────────────────────────────────────────

function verifyFreshnessToken(body) {
  if (!body.freshnessCode || !body.issuedAt || !body.codeToken) {
    return "Your form session is missing. Please refresh and try again.";
  }

  var expected = hmacHex(body.freshnessCode + "|" + body.issuedAt);
  if (expected !== body.codeToken) {
    return "Your form session could not be verified. Please refresh and try again.";
  }

  var issuedMs = new Date(body.issuedAt).getTime();
  var ageMinutes = (Date.now() - issuedMs) / 60000;
  if (isNaN(issuedMs) || ageMinutes < 0 || ageMinutes > CONFIG.CODE_TTL_MINUTES) {
    return "Your form session has expired. Please refresh and try again.";
  }

  return null; // valid
}

// ── Full submission ───────────────────────────────────────────────────────────

var PHOTO_FIELDS = [
  { key: "fullLengthPhoto", label: "Full-Length Photo", column: "full_length_photo_url", mime: "PHOTO_ALLOWED_MIME", maxMb: "PHOTO_MAX_MB" },
  { key: "closeUpPhoto", label: "Close-Up Photo", column: "close_up_photo_url", mime: "PHOTO_ALLOWED_MIME", maxMb: "PHOTO_MAX_MB" },
  { key: "idProof", label: "ID Proof", column: "id_proof_url", mime: "ID_ALLOWED_MIME", maxMb: "PHOTO_MAX_MB" },
];

function handleSubmit(body) {
  if (isPastClose()) return jsonErr("Registration is now closed.");

  var freshnessError = verifyFreshnessToken(body);
  if (freshnessError) return jsonErr(freshnessError);

  var required = ["dancerFirstName", "dancerLastName", "contactNumber", "signatureFullName", "signatureDate"];
  for (var i = 0; i < required.length; i++) {
    if (!body[required[i]]) return jsonErr("Missing field: " + required[i]);
  }

  if (!body.tcsAccepted) return jsonErr("Terms & Conditions must be accepted.");
  if (!body.agreeAndSubmit) return jsonErr("You must check \"I Agree and Submit\" to register.");

  var fileUrls = {};
  for (var f = 0; f < PHOTO_FIELDS.length; f++) {
    var field = PHOTO_FIELDS[f];
    var base64Key = field.key + "Base64";
    var mimeKey = field.key + "MimeType";

    if (!body[base64Key] || !body[mimeKey]) {
      return jsonErr("Missing file: " + field.label);
    }
    if (CONFIG[field.mime].indexOf(body[mimeKey]) === -1) {
      return jsonErr(field.label + " must be a JPEG or PNG" + (field.key === "idProof" ? " image, or a PDF." : " image."));
    }

    var bytes = Utilities.base64Decode(body[base64Key]);
    if (bytes.length > CONFIG[field.maxMb] * 1024 * 1024) {
      return jsonErr(field.label + " is larger than " + CONFIG[field.maxMb] + "MB.");
    }

    fileUrls[field.key] = { bytes: bytes, mime: body[mimeKey] };
  }

  var registrationId = generateRegistrationId();
  var lastNameSafe = body.dancerLastName.replace(/[^\w\- ]/g, "").trim();
  var subfolder = getOrCreateSubfolder(getDriveFolder(), registrationId + "_" + lastNameSafe);

  var savedUrls = {};
  for (var g = 0; g < PHOTO_FIELDS.length; g++) {
    var field2 = PHOTO_FIELDS[g];
    var fileData = fileUrls[field2.key];
    var ext = extensionForMime(fileData.mime);
    var fileName = field2.key.replace(/([A-Z])/g, "-$1").toLowerCase() + "." + ext;
    var blob = Utilities.newBlob(fileData.bytes, fileData.mime, fileName);
    var file = subfolder.createFile(blob);
    savedUrls[field2.key] = file.getUrl();
  }

  var now = new Date().toISOString();

  getSheet().appendRow([
    now,
    registrationId,
    body.dancerFirstName,
    body.dancerLastName,
    body.contactNumber,
    savedUrls.fullLengthPhoto,
    savedUrls.closeUpPhoto,
    savedUrls.idProof,
    "YES",
    body.signatureFullName,
    body.signatureDate,
    "Pending",
    "",
    "",
    "",
  ]);

  try {
    sendPanelAlert(body, registrationId, savedUrls);
    sendRegistrantConfirmation(body, registrationId);
  } catch (e) {
    Logger.log("Email error: " + e.message);
  }

  return jsonOk({ registrationId: registrationId, success: true });
}

// ── Emails ────────────────────────────────────────────────────────────────────

function sendPanelAlert(body, registrationId, savedUrls) {
  var adminUrl = ScriptApp.getService().getUrl() + "?page=admin&token=" + CONFIG.ADMIN_TOKEN;
  var dancerName = body.dancerFirstName + " " + body.dancerLastName;
  var subject = "[Dance Team Registration] " + dancerName;

  var html = [
    "<h2>New registration — " + escHtml(dancerName) + "</h2>",
    "<p><strong>Ref:</strong> " + registrationId + "</p>",
    "<p><strong>Submitted:</strong> " + new Date().toLocaleString("en-AU") + "</p>",
    "<hr>",
    "<p><strong>Contact number:</strong> " + escHtml(body.contactNumber) + "</p>",
    "<p><strong>Full-length photo:</strong> <a href=\"" + savedUrls.fullLengthPhoto + "\">view</a></p>",
    "<p><strong>Close-up photo:</strong> <a href=\"" + savedUrls.closeUpPhoto + "\">view</a></p>",
    "<p><strong>ID proof:</strong> <a href=\"" + savedUrls.idProof + "\">view</a></p>",
    "<hr>",
    "<p><a href=\"" + adminUrl + "\">Open admin dashboard</a></p>",
  ].join("\n");

  MailApp.sendEmail({
    to: CONFIG.OWNER_EMAIL,
    subject: subject,
    htmlBody: html,
    name: CONFIG.CAMPAIGN_NAME + " — Kayal Events",
  });
}

function sendRegistrantConfirmation(body, registrationId) {
  var subject = CONFIG.CAMPAIGN_NAME + " — registration received";

  var html = [
    "<p>Hi " + escHtml(body.dancerFirstName) + ",</p>",
    "<p>Thanks for registering with <strong>" + CONFIG.CAMPAIGN_NAME + "</strong>.</p>",
    "<p>Your registration reference is <strong>" + registrationId + "</strong>.</p>",
    "<p>Backstage accreditation is only granted after Kayal Events reviews and approves your registration. We'll be in touch if we need anything further.</p>",
    "<p>If you have a question, email <a href='mailto:" + CONFIG.OWNER_EMAIL + "'>" +
      CONFIG.OWNER_EMAIL + "</a> and include your reference number.</p>",
    "<p>See you at the event!<br>The Kayal Events team</p>",
  ].join("\n");

  MailApp.sendEmail({
    to: CONFIG.OWNER_EMAIL, // registrant email not collected on this form — internal-only confirmation loop
    subject: subject,
    htmlBody: html,
    name: "Kayal Events",
    replyTo: CONFIG.OWNER_EMAIL,
  });
}

// ── Admin page ────────────────────────────────────────────────────────────────

function serveAdminPage(token) {
  if (!token || token !== CONFIG.ADMIN_TOKEN) {
    return HtmlService.createHtmlOutput(
      "<!DOCTYPE html><html><body style='font-family:sans-serif;padding:40px'>" +
        "<h2>Access denied</h2>" +
        "<p>Invalid or missing admin token.</p>" +
        "</body></html>"
    )
      .setTitle("Access denied — " + CONFIG.CAMPAIGN_NAME)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
  }

  var tmpl = HtmlService.createTemplateFromFile("Admin");
  tmpl.adminToken = token;
  return tmpl
    .evaluate()
    .setTitle(CONFIG.CAMPAIGN_NAME + " — Kayal Events")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

// ── Admin server-side functions (called from Admin.html via google.script.run) ─

// eslint-disable-next-line no-unused-vars
function getSubmissions(token) {
  requirePanel(token);
  var sheet = getSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, SHEET_HEADERS.length).getValues();
  return data.map(function (row) {
    var obj = {};
    SHEET_HEADERS.forEach(function (key, i) {
      obj[key] = row[i] instanceof Date ? row[i].toISOString() : String(row[i] || "");
    });
    return obj;
  });
}

// eslint-disable-next-line no-unused-vars
function updateSubmission(registrationId, status, reviewerNotes, token) {
  requirePanel(token);

  var validStatuses = ["Pending", "Approved", "Rejected"];
  if (validStatuses.indexOf(status) === -1) throw new Error("Invalid status.");

  var sheet = getSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error("No submissions found.");

  var idCol = SHEET_HEADERS.indexOf("registration_id") + 1;
  var statusCol = SHEET_HEADERS.indexOf("status") + 1;
  var notesCol = SHEET_HEADERS.indexOf("reviewer_notes") + 1;
  var reviewedByCol = SHEET_HEADERS.indexOf("reviewed_by") + 1;
  var reviewedAtCol = SHEET_HEADERS.indexOf("reviewed_at") + 1;

  var ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  var rowIndex = -1;
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === registrationId) {
      rowIndex = i + 2;
      break;
    }
  }

  if (rowIndex === -1) throw new Error("Registration not found: " + registrationId);

  var reviewer = CONFIG.OWNER_EMAIL;
  var now = new Date().toISOString();

  sheet.getRange(rowIndex, statusCol).setValue(status);
  sheet.getRange(rowIndex, notesCol).setValue(reviewerNotes || "");
  sheet.getRange(rowIndex, reviewedByCol).setValue(reviewer);
  sheet.getRange(rowIndex, reviewedAtCol).setValue(now);

  return { ok: true };
}

// eslint-disable-next-line no-unused-vars
function getReviewerEmail(token) {
  requirePanel(token);
  return CONFIG.OWNER_EMAIL;
}

function requirePanel(token) {
  if (!token || token !== CONFIG.ADMIN_TOKEN) {
    throw new Error("Access denied.");
  }
}
