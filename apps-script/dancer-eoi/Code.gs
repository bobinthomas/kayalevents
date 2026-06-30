// ─────────────────────────────────────────────────────────────────────────────
// Kayal Events — Dancer EOI Backend
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

function generateSubmissionId() {
  return "KE-" + randomAlpha(8);
}

function isPastDeadline() {
  return new Date() > new Date(CONFIG.DEADLINE_UTC);
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

// ── Resource bootstrap ───────────────────────────────────────────────────────

// Run this ONCE from the Apps Script IDE, then paste IDs into Config.gs.
// eslint-disable-next-line no-unused-vars
function bootstrapResources() {
  if (!CONFIG.SHEET_ID) {
    var ss = SpreadsheetApp.create("Kayal Events EOI Submissions");
    Logger.log("SHEET_ID: " + ss.getId());
  }
}

// ── Sheet ─────────────────────────────────────────────────────────────────────

var SHEET_HEADERS = [
  "submitted_at",
  "submission_id",
  "group_name",
  "profile_about",
  "achievements",
  "num_performers",
  "contact_name",
  "contact_email",
  "contact_phone",
  "link_instagram",
  "link_youtube",
  "link_other",
  "declaration_checked",
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
      ss = SpreadsheetApp.create("Kayal Events EOI Submissions");
      props.setProperty("auto_sheet_id", ss.getId());
      Logger.log("Created Sheet: " + ss.getId() + " — add to Config.SHEET_ID");
    }
  }

  var sheet = ss.getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHEET_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
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
    return jsonOk({ status: "ok", service: "Kayal Events EOI" });
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
    deadline: CONFIG.DEADLINE_UTC,
    deadlineDisplay: CONFIG.DEADLINE_DISPLAY,
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

    return jsonErr("Unknown action.");
  } catch (err) {
    return jsonErr(err.message);
  }
}

// ── Full submission ───────────────────────────────────────────────────────────

function handleSubmit(body) {
  // 1. Generate submissionId if not provided
  if (!body.submissionId) {
    body.submissionId = generateSubmissionId();
  }

  // 2. Deadline
  if (isPastDeadline()) return jsonErr("Applications are now closed.");

  // 3. Required fields
  var required = [
    "groupName",
    "profileAbout",
    "achievements",
    "numPerformers",
    "contactName",
    "contactEmail",
    "contactPhone",
  ];
  for (var i = 0; i < required.length; i++) {
    if (!body[required[i]]) {
      return jsonErr("Missing field: " + required[i]);
    }
  }

  if (!body.linkInstagram && !body.linkYoutube && !body.linkOther) {
    return jsonErr("At least one performance link is required.");
  }

  if (!body.declarationChecked) {
    return jsonErr("Declaration must be checked.");
  }

  // 4. Append Sheet row
  var sheet = getSheet();
  var now = new Date().toISOString();

  sheet.appendRow([
    now,
    body.submissionId,
    body.groupName,
    body.profileAbout,
    body.achievements,
    body.numPerformers,
    body.contactName,
    body.contactEmail,
    body.contactPhone,
    body.linkInstagram || "",
    body.linkYoutube || "",
    body.linkOther || "",
    body.declarationChecked ? "YES" : "NO",
    "Pending",
    "",
    "",
    "",
  ]);

  // 5. Emails
  try {
    sendPanelAlert(body);
    sendApplicantConfirmation(
      body.contactEmail,
      body.contactName,
      body.groupName,
      body.submissionId
    );
  } catch (e) {
    Logger.log("Email error: " + e.message);
  }

  return jsonOk({ submissionId: body.submissionId, success: true });
}

// ── Emails ────────────────────────────────────────────────────────────────────

function sendPanelAlert(body) {
  var adminUrl = ScriptApp.getService().getUrl() + "?page=admin&token=" + CONFIG.ADMIN_TOKEN;
  var subject =
    "[EOI] " + body.groupName + " — " + body.numPerformers + " performers";

  var html = [
    "<h2>New EOI — " + escHtml(body.groupName) + "</h2>",
    "<p><strong>Ref:</strong> " + body.submissionId + "</p>",
    "<p><strong>Submitted:</strong> " + new Date().toLocaleString("en-AU") + "</p>",
    "<hr>",
    "<p><strong>Group:</strong> " + escHtml(body.groupName) + "</p>",
    "<p><strong>Performers:</strong> " + body.numPerformers + "</p>",
    "<p><strong>About:</strong><br>" + escHtml(body.profileAbout) + "</p>",
    "<p><strong>Achievements:</strong><br>" + escHtml(body.achievements) + "</p>",
    "<hr>",
    "<p><strong>Contact:</strong> " +
      escHtml(body.contactName) +
      " | " +
      escHtml(body.contactEmail) +
      " | " +
      escHtml(body.contactPhone) +
      "</p>",
    body.linkInstagram
      ? '<p><strong>Instagram:</strong> <a href="' +
        body.linkInstagram +
        '">' +
        body.linkInstagram +
        "</a></p>"
      : "",
    body.linkYoutube
      ? '<p><strong>YouTube:</strong> <a href="' +
        body.linkYoutube +
        '">' +
        body.linkYoutube +
        "</a></p>"
      : "",
    body.linkOther
      ? '<p><strong>Other:</strong> <a href="' +
        body.linkOther +
        '">' +
        body.linkOther +
        "</a></p>"
      : "",
    "<hr>",
    '<p><a href="' + adminUrl + '">Open admin dashboard</a></p>',
  ].join("\n");

  MailApp.sendEmail({
    to: CONFIG.OWNER_EMAIL,
    subject: subject,
    htmlBody: html,
    name: "Kayal Events EOI",
  });
}

function sendApplicantConfirmation(email, name, groupName, submissionId) {
  var subject = "Application received — " + groupName;

  var html = [
    "<p>Hi " + escHtml(name) + ",</p>",
    "<p>Thank you for applying to perform at <strong>" +
      CONFIG.EVENT_NAME +
      "</strong>.</p>",
    "<p>We have received your application for <strong>" +
      escHtml(groupName) +
      "</strong>.</p>",
    "<p>Your reference number is <strong>" + submissionId + "</strong>.</p>",
    "<p>The selection panel will review all applications after the deadline of <strong>" +
      CONFIG.DEADLINE_DISPLAY +
      "</strong>. We will contact shortlisted groups by email.</p>",
    "<p>If you have a question, email <a href='mailto:" +
      CONFIG.OWNER_EMAIL +
      "'>" +
      CONFIG.OWNER_EMAIL +
      "</a> and include your reference number.</p>",
    "<p>Good luck,<br>The Kayal Events team</p>",
  ].join("\n");

  MailApp.sendEmail({
    to: email,
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
        "<p>Contact the event organiser for the admin panel URL.</p>" +
        "</body></html>"
    )
      .setTitle("Access denied — Kayal Events EOI")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
  }

  var tmpl = HtmlService.createTemplateFromFile("Admin");
  tmpl.adminToken = token;
  return tmpl
    .evaluate()
    .setTitle("EOI Panel — Kayal Events")
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
function updateSubmission(submissionId, status, reviewerNotes, token) {
  requirePanel(token);

  var validStatuses = ["Pending", "Shortlisted", "Rejected"];
  if (validStatuses.indexOf(status) === -1) throw new Error("Invalid status.");

  var sheet = getSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error("No submissions found.");

  var idCol = SHEET_HEADERS.indexOf("submission_id") + 1;
  var statusCol = SHEET_HEADERS.indexOf("status") + 1;
  var notesCol = SHEET_HEADERS.indexOf("reviewer_notes") + 1;
  var reviewedByCol = SHEET_HEADERS.indexOf("reviewed_by") + 1;
  var reviewedAtCol = SHEET_HEADERS.indexOf("reviewed_at") + 1;

  var ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  var rowIndex = -1;
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === submissionId) {
      rowIndex = i + 2;
      break;
    }
  }

  if (rowIndex === -1) throw new Error("Submission not found: " + submissionId);

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

// ── Utility ───────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
