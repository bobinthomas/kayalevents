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
  "dancer_email",
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
    if (page === "pass") return servePassPage((e.parameter && e.parameter.id) || "", token);
    if (page === "passes") return serveAllPassesPage(token);
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

  var required = ["dancerFirstName", "dancerLastName", "contactNumber", "dancerEmail", "signatureFullName", "signatureDate"];
  for (var i = 0; i < required.length; i++) {
    if (!body[required[i]]) return jsonErr("Missing field: " + required[i]);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(body.dancerEmail)) {
    return jsonErr("Please enter a valid email address.");
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
    body.dancerEmail,
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
    "<p><strong>Email:</strong> " + escHtml(body.dancerEmail) + "</p>",
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
    to: body.dancerEmail,
    subject: subject,
    htmlBody: html,
    name: "Kayal Events",
    replyTo: CONFIG.OWNER_EMAIL,
  });
}

function sendStatusUpdateEmail(row, status) {
  if (!row.dancer_email) return; // rows created before the email field existed

  var subject;
  var bodyLines;

  if (status === "Approved") {
    subject = CONFIG.CAMPAIGN_NAME + " — you're accredited!";
    bodyLines = [
      "<p>Hi " + escHtml(row.dancer_first_name) + ",</p>",
      "<p>Good news — your registration (<strong>" + row.registration_id + "</strong>) has been " +
        "<strong>approved</strong>. You're accredited for backstage and performer-only areas.</p>",
      "<p>Bring photo ID matching what you submitted when you check in at the venue.</p>",
      "<p>See you at the event!<br>The Kayal Events team</p>",
    ];
  } else if (status === "Rejected") {
    subject = CONFIG.CAMPAIGN_NAME + " — registration update";
    bodyLines = [
      "<p>Hi " + escHtml(row.dancer_first_name) + ",</p>",
      "<p>Your registration (<strong>" + row.registration_id + "</strong>) was not approved for " +
        "backstage accreditation this time.</p>",
      "<p>If you think this is a mistake, email <a href='mailto:" + CONFIG.OWNER_EMAIL + "'>" +
        CONFIG.OWNER_EMAIL + "</a> and include your reference number.</p>",
      "<p>The Kayal Events team</p>",
    ];
  } else {
    return; // no email on reset-to-Pending
  }

  MailApp.sendEmail({
    to: row.dancer_email,
    subject: subject,
    htmlBody: bodyLines.join("\n"),
    name: "Kayal Events",
    replyTo: CONFIG.OWNER_EMAIL,
  });
}

// ── Backstage pass (phase 2) ────────────────────────────────────────────────────

// Drive file IDs are always a run of 25+ URL-safe characters — safe to pull out
// of whatever URL shape file.getUrl() returns without depending on that shape.
function extractDriveFileId(url) {
  var m = String(url || "").match(/[-\w]{25,}/);
  return m ? m[0] : "";
}

// Embeds the photo as a base64 data URI rather than linking to Drive directly —
// works regardless of the file's sharing settings, since the script reads it as
// the owner, and keeps no Drive links exposed on the printed pass.
function getImageDataUri(driveUrl) {
  var id = extractDriveFileId(driveUrl);
  if (!id) return "";
  try {
    var blob = DriveApp.getFileById(id).getBlob();
    var base64 = Utilities.base64Encode(blob.getBytes());
    return "data:" + blob.getContentType() + ";base64," + base64;
  } catch (e) {
    return "";
  }
}

function getRowByRegistrationId(registrationId) {
  var sheet = getSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  var data = sheet.getRange(2, 1, lastRow - 1, SHEET_HEADERS.length).getValues();
  for (var i = 0; i < data.length; i++) {
    var row = {};
    SHEET_HEADERS.forEach(function (key, j) {
      row[key] = data[i][j] instanceof Date ? data[i][j].toISOString() : String(data[i][j] || "");
    });
    if (row.registration_id === registrationId) return row;
  }
  return null;
}

function getApprovedRows() {
  var sheet = getSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, SHEET_HEADERS.length).getValues();
  var rows = [];
  data.forEach(function (values) {
    var row = {};
    SHEET_HEADERS.forEach(function (key, j) {
      row[key] = values[j] instanceof Date ? values[j].toISOString() : String(values[j] || "");
    });
    if (row.status === "Approved") rows.push(row);
  });
  return rows;
}

// QR payload is deliberately just the registration ID (prefixed so a stray
// scan is identifiable) — the future check-in scanner looks this up against
// the Sheet rather than trusting anything else encoded in the QR itself.
function buildPassQrSvg(registrationId) {
  var qr = qrcode(0, "M");
  qr.addData("KAYAL-PASS:" + registrationId);
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 4, scalable: true });
}

var ICON_CALENDAR_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<rect x="3" y="5" width="18" height="16" rx="2"></rect>' +
  '<line x1="16" y1="3" x2="16" y2="7"></line>' +
  '<line x1="8" y1="3" x2="8" y2="7"></line>' +
  '<line x1="3" y1="10" x2="21" y2="10"></line>' +
  '</svg>';

var ICON_PIN_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M12 22s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z"></path>' +
  '<circle cx="12" cy="10" r="2.5"></circle>' +
  '</svg>';

function renderBadgeHtml(row) {
  var photoUri = getImageDataUri(row.close_up_photo_url);
  var qrSvg = buildPassQrSvg(row.registration_id);
  var fullName = row.dancer_first_name + ' ' + row.dancer_last_name;

  return [
    '<div class="ticket">',
    '  <div class="ticket-logo">' + KAYAL_LOGO_SVG + '<span class="ticket-logo-reg">&reg;</span></div>',
    '  <div class="ticket-event-title">' + escHtml(CONFIG.EVENT_TITLE) + '</div>',
    '  <div class="ticket-event-subtitle">' + escHtml(CONFIG.EVENT_SUBTITLE) + '</div>',
    photoUri
      ? '  <img class="ticket-photo" src="' + photoUri + '" alt="">'
      : '  <div class="ticket-photo ticket-photo-placeholder"></div>',
    '  <div class="ticket-role-pill">PERFORMER</div>',
    '  <div class="ticket-name">' + escHtml(fullName) + '</div>',
    '  <div class="ticket-hr"></div>',
    '  <div class="ticket-info-row">',
    '    <span class="ticket-icon">' + ICON_CALENDAR_SVG + '</span>',
    '    <div>',
    '      <div class="ticket-info-label">Date</div>',
    '      <div class="ticket-info-value">' + escHtml(CONFIG.EVENT_DATE_DISPLAY) + '</div>',
    '    </div>',
    '  </div>',
    '  <div class="ticket-info-row">',
    '    <span class="ticket-icon">' + ICON_PIN_SVG + '</span>',
    '    <div>',
    '      <div class="ticket-info-label">Venue</div>',
    '      <div class="ticket-info-value">' + escHtml(CONFIG.EVENT_VENUE) + '</div>',
    '    </div>',
    '  </div>',
    '  <div class="ticket-perforation"></div>',
    '  <div class="ticket-footer">',
    '    <div class="ticket-footer-left">',
    '      <div class="ticket-info-label">Gate Access ID</div>',
    '      <div class="ticket-id">' + escHtml(row.registration_id) + '</div>',
    '      <div class="ticket-disclaimer">Present this credential at performer check-in desk. Non-transferable.</div>',
    '    </div>',
    '    <div class="ticket-qr">',
    '      ' + qrSvg,
    '      <div class="ticket-qr-id">' + escHtml(row.registration_id) + '</div>',
    '    </div>',
    '  </div>',
    '</div>',
  ].join('\n');
}

var BADGE_STYLE = [
  '<style>',
  '  @page { margin: 8mm; }',
  '  * { box-sizing: border-box; }',
  '  body { margin: 0; font-family: Arial, Helvetica, sans-serif; background: #d8d8d8; }',
  '  .toolbar { padding: 12px; text-align: center; }',
  '  .toolbar button { font-size: 14px; padding: 8px 20px; cursor: pointer; }',
  '  .sheet { display: flex; flex-wrap: wrap; gap: 6mm; justify-content: center; padding: 6mm; }',
  '  .ticket {',
  '    width: 100mm;',
  '    border-radius: 6mm;',
  '    background: #0b0e14; color: #f5f2ea;',
  '    padding: 6mm; display: flex; flex-direction: column; align-items: center;',
  '    position: relative;',
  '    page-break-inside: avoid; overflow: hidden;',
  '  }',
  '  .ticket-logo { width: 32mm; flex-shrink: 0; position: relative; }',
  '  .ticket-logo svg { width: 100%; height: auto; display: block; }',
  '  .ticket-logo-reg { position: absolute; left: 87%; top: 40%; font-size: 3.5pt; color: #8b93a3; }',
  '  .ticket-event-title { margin-top: 2mm; font-size: 11pt; font-weight: 700; text-align: center; }',
  '  .ticket-event-subtitle { font-size: 8pt; color: #8b93a3; text-align: center; margin-top: 0.5mm; }',
  '  .ticket-photo, .ticket-photo-placeholder { width: 34mm; height: 34mm; object-fit: cover; border-radius: 3mm; margin-top: 3mm; flex-shrink: 0; }',
  '  .ticket-photo-placeholder { background: #1b2028; }',
  '  .ticket-role-pill { margin-top: 3mm; border: 0.4mm solid #f2a71b; color: #f2a71b; border-radius: 5mm; padding: 1mm 4mm; font-size: 8pt; font-weight: 700; letter-spacing: 1.5pt; }',
  '  .ticket-name { margin-top: 2mm; font-size: 16pt; font-weight: 800; text-transform: uppercase; text-align: center; line-height: 1.1; }',
  '  .ticket-hr { width: 100%; height: 1px; background: rgba(245,242,234,0.15); margin-top: 3mm; }',
  '  .ticket-info-row { width: 100%; display: flex; align-items: center; gap: 3mm; margin-top: 3mm; }',
  '  .ticket-icon { width: 4.5mm; height: 4.5mm; color: #f2a71b; flex-shrink: 0; }',
  '  .ticket-icon svg { width: 100%; height: 100%; }',
  '  .ticket-info-label { font-size: 6.5pt; text-transform: uppercase; letter-spacing: 0.5pt; color: #8b93a3; }',
  '  .ticket-info-value { font-size: 9pt; font-weight: 700; margin-top: 0.3mm; }',
  '  .ticket-perforation { width: 100%; border-top: 1px dashed rgba(245,242,234,0.3); margin-top: 4mm; position: relative; }',
  '  .ticket-perforation::before, .ticket-perforation::after {',
  '    content: ""; position: absolute; top: -2.5mm; width: 5mm; height: 5mm; border-radius: 50%; background: #d8d8d8;',
  '  }',
  '  .ticket-perforation::before { left: -8.5mm; }',
  '  .ticket-perforation::after { right: -8.5mm; }',
  '  .ticket-footer { width: 100%; display: flex; align-items: flex-end; justify-content: space-between; margin-top: 4mm; gap: 3mm; }',
  '  .ticket-footer-left { min-width: 0; }',
  '  .ticket-id { font-family: monospace; font-size: 11pt; font-weight: 700; margin-top: 0.5mm; }',
  '  .ticket-disclaimer { font-size: 6pt; color: #8b93a3; margin-top: 1.5mm; line-height: 1.3; max-width: 55mm; }',
  '  .ticket-qr { background: #fff; border-radius: 2mm; padding: 1.5mm; flex-shrink: 0; text-align: center; }',
  '  .ticket-qr svg { width: 20mm; height: 20mm; display: block; }',
  '  .ticket-qr-id { font-family: monospace; font-size: 5pt; color: #333; margin-top: 0.5mm; }',
  '  @media print { .toolbar { display: none; } body { background: #fff; } .ticket-perforation::before, .ticket-perforation::after { background: #fff; } }',
  '</style>',
].join('\n');

function servePassPage(registrationId, token) {
  if (!token || token !== CONFIG.ADMIN_TOKEN) {
    return HtmlService.createHtmlOutput('<p>Access denied.</p>');
  }

  var row = getRowByRegistrationId(registrationId);
  if (!row) {
    return HtmlService.createHtmlOutput('<p>Registration not found.</p>');
  }
  if (row.status !== 'Approved') {
    return HtmlService.createHtmlOutput(
      '<p>This registration is not yet approved (status: ' + escHtml(row.status) + '). Approve it first.</p>'
    );
  }

  var html = [
    "<!DOCTYPE html><html><head><meta charset='UTF-8'>",
    BADGE_STYLE,
    '</head><body>',
    "<div class='toolbar'><button onclick='window.print()'>Print</button></div>",
    "<div class='sheet'>",
    renderBadgeHtml(row),
    '</div>',
    '</body></html>',
  ].join('\n');

  return HtmlService.createHtmlOutput(html).setTitle('Pass — ' + row.dancer_first_name + ' ' + row.dancer_last_name);
}

function serveAllPassesPage(token) {
  if (!token || token !== CONFIG.ADMIN_TOKEN) {
    return HtmlService.createHtmlOutput('<p>Access denied.</p>');
  }

  var rows = getApprovedRows();

  var badgesHtml = rows.length
    ? rows.map(renderBadgeHtml).join('\n')
    : "<p style='padding:20px'>No approved registrations yet.</p>";

  var html = [
    "<!DOCTYPE html><html><head><meta charset='UTF-8'>",
    BADGE_STYLE,
    '</head><body>',
    "<div class='toolbar'><button onclick='window.print()'>Print all (" + rows.length + ')</button></div>',
    "<div class='sheet'>",
    badgesHtml,
    '</div>',
    '</body></html>',
  ].join('\n');

  return HtmlService.createHtmlOutput(html).setTitle('All Approved Passes — Kayal Events');
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
  tmpl.scriptUrl = ScriptApp.getService().getUrl();
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

  try {
    var rowValues = sheet.getRange(rowIndex, 1, 1, SHEET_HEADERS.length).getValues()[0];
    var row = {};
    SHEET_HEADERS.forEach(function (key, i) {
      row[key] = rowValues[i] instanceof Date ? rowValues[i].toISOString() : String(rowValues[i] || "");
    });
    sendStatusUpdateEmail(row, status);
  } catch (e) {
    Logger.log("Status email error: " + e.message);
  }

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
