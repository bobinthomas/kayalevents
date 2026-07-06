// ─────────────────────────────────────────────────────────────────────────────
// Kayal Events — #KayalReelFest Reel Contest Backend
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

function generateEntryId() {
  return CONFIG.CODE_PREFIX + "-" + randomAlpha(8);
}

function isPastDeadline() {
  return new Date() > new Date(CONFIG.ENTRY_CLOSE_UTC);
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
  if (mime === "video/quicktime") return "mov";
  return "mp4";
}

// ── Resource bootstrap ───────────────────────────────────────────────────────

// Run this ONCE from the Apps Script IDE, then paste IDs into Config.gs.
// eslint-disable-next-line no-unused-vars
function bootstrapResources() {
  if (!CONFIG.SHEET_ID) {
    var ss = SpreadsheetApp.create("Kayal Events Reel Contest Entries");
    var entries = ss.getSheets()[0];
    entries.setName("Entries");
    entries.appendRow(ENTRIES_HEADERS);
    entries.setFrozenRows(1);

    var judging = ss.insertSheet("Judging");
    judging.appendRow(JUDGING_HEADERS);
    judging.setFrozenRows(1);

    Logger.log("SHEET_ID: " + ss.getId());
  }
  if (!CONFIG.DRIVE_PARENT_FOLDER) {
    var folder = DriveApp.createFolder("Reel Contest");
    Logger.log("DRIVE_PARENT_FOLDER: " + folder.getId());
  }
}

// ── Sheet ─────────────────────────────────────────────────────────────────────

var ENTRIES_HEADERS = [
  "submitted_at",
  "entry_id",
  "full_name",
  "email",
  "phone",
  "state",
  "voucher_eligible",
  "team",
  "description",
  "video_type",
  "video_url",
  "tcs_accepted",
  "status",
];

var JUDGING_HEADERS = [
  "entry_id",
  "team",
  "name",
  "judge1_creativity",
  "judge1_execution",
  "judge1_entertainment",
  "judge1_theme_fit",
  "judge1_weighted",
  "judge2_creativity",
  "judge2_execution",
  "judge2_entertainment",
  "judge2_theme_fit",
  "judge2_weighted",
  "judge3_creativity",
  "judge3_execution",
  "judge3_entertainment",
  "judge3_theme_fit",
  "judge3_weighted",
  "total_avg",
  "rank",
];

// Rubric weights — published in the T&Cs. Keep in sync with reel-contest-terms.
var RUBRIC_WEIGHTS = {
  creativity: 0.4,
  execution: 0.3,
  entertainment: 0.2,
  theme_fit: 0.1,
};

function getSpreadsheet() {
  if (CONFIG.SHEET_ID) return SpreadsheetApp.openById(CONFIG.SHEET_ID);

  var props = PropertiesService.getScriptProperties();
  var cachedId = props.getProperty("auto_sheet_id");
  if (cachedId) return SpreadsheetApp.openById(cachedId);

  var ss = SpreadsheetApp.create("Kayal Events Reel Contest Entries");
  props.setProperty("auto_sheet_id", ss.getId());
  Logger.log("Created Sheet: " + ss.getId() + " — add to Config.SHEET_ID");
  return ss;
}

function getEntriesSheet() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("Entries") || ss.getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(ENTRIES_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getJudgingSheet() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("Judging");
  if (!sheet) sheet = ss.insertSheet("Judging");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(JUDGING_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Seeds a Judging row for a new entry and wires up the weighted-score/average/rank
// formulas so the sheet is a live, self-updating leaderboard as judges fill in raw
// scores — see JUDGING_HEADERS for the column layout this assumes.
function seedJudgingRow(entryId, team, name) {
  var sheet = getJudgingSheet();
  sheet.appendRow([entryId, team, name]);
  var row = sheet.getLastRow();
  var w = RUBRIC_WEIGHTS;

  function weightedFormula(range) {
    return (
      "=IF(COUNT(" + range.raw + ")=4, " +
      range.creativity + "*" + w.creativity + "+" +
      range.execution + "*" + w.execution + "+" +
      range.entertainment + "*" + w.entertainment + "+" +
      range.themeFit + "*" + w.theme_fit + ", \"\")"
    );
  }

  sheet.getRange(row, 8).setFormula(
    weightedFormula({
      raw: "D" + row + ":G" + row,
      creativity: "D" + row,
      execution: "E" + row,
      entertainment: "F" + row,
      themeFit: "G" + row,
    })
  );
  sheet.getRange(row, 13).setFormula(
    weightedFormula({
      raw: "I" + row + ":L" + row,
      creativity: "I" + row,
      execution: "J" + row,
      entertainment: "K" + row,
      themeFit: "L" + row,
    })
  );
  sheet.getRange(row, 18).setFormula(
    weightedFormula({
      raw: "N" + row + ":Q" + row,
      creativity: "N" + row,
      execution: "O" + row,
      entertainment: "P" + row,
      themeFit: "Q" + row,
    })
  );
  sheet.getRange(row, 19).setFormula(
    "=IFERROR(AVERAGE(H" + row + ",M" + row + ",R" + row + "), \"\")"
  );
  sheet.getRange(row, 20).setFormula(
    "=IFERROR(RANK(S" + row + ", S$2:S$1000, 0), \"\")"
  );
}

function getDriveFolder() {
  if (CONFIG.DRIVE_PARENT_FOLDER) return DriveApp.getFolderById(CONFIG.DRIVE_PARENT_FOLDER);

  var props = PropertiesService.getScriptProperties();
  var cachedId = props.getProperty("auto_drive_folder_id");
  if (cachedId) return DriveApp.getFolderById(cachedId);

  var folder = DriveApp.createFolder("Reel Contest");
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
    return jsonOk({ status: "ok", service: "Kayal Events Reel Contest" });
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
    deadline: CONFIG.ENTRY_CLOSE_UTC,
    deadlineDisplay: CONFIG.ENTRY_CLOSE_DISPLAY,
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

function handleSubmit(body) {
  if (isPastDeadline()) return jsonErr("Entries are now closed.");

  var freshnessError = verifyFreshnessToken(body);
  if (freshnessError) return jsonErr(freshnessError);

  var required = ["fullName", "email", "phone", "state", "team"];
  for (var i = 0; i < required.length; i++) {
    if (!body[required[i]]) return jsonErr("Missing field: " + required[i]);
  }

  if (CONFIG.TEAMS.indexOf(body.team) === -1) return jsonErr("Invalid team.");
  if (CONFIG.AU_STATES.indexOf(body.state) === -1) return jsonErr("Invalid state.");
  if (!body.tcsAccepted) return jsonErr("Terms & Conditions must be accepted.");

  var hasFile = Boolean(body.videoBase64);
  var hasLink = Boolean(body.driveLink);
  if (hasFile === hasLink) {
    return jsonErr("Provide either a video file or a Google Drive link — not both.");
  }

  var entryId = generateEntryId();
  var videoType = hasFile ? "file" : "drive_link";
  var videoUrl = "";

  if (hasFile) {
    if (CONFIG.VIDEO_ALLOWED_MIME.indexOf(body.videoMimeType) === -1) {
      return jsonErr("Video must be MP4 or MOV.");
    }

    var bytes = Utilities.base64Decode(body.videoBase64);
    if (bytes.length > CONFIG.VIDEO_MAX_BYTES) {
      return jsonErr("Video file is larger than " + CONFIG.VIDEO_MAX_MB + "MB.");
    }

    var teamFolder = getOrCreateSubfolder(getDriveFolder(), body.team);
    var ext = extensionForMime(body.videoMimeType);
    var fileName = entryId + "_" + body.fullName.replace(/[^\w\- ]/g, "").trim() + "." + ext;
    var blob = Utilities.newBlob(bytes, body.videoMimeType, fileName);
    var file = teamFolder.createFile(blob);
    videoUrl = file.getUrl();
  } else {
    if (!/drive\.google\.com/i.test(body.driveLink)) {
      return jsonErr("Drive link must be a drive.google.com share link.");
    }
    videoUrl = body.driveLink;
  }

  var voucherEligible = body.state !== CONFIG.VOUCHER_INELIGIBLE_STATE;
  var now = new Date().toISOString();

  getEntriesSheet().appendRow([
    now,
    entryId,
    body.fullName,
    body.email,
    body.phone,
    body.state,
    voucherEligible ? "TRUE" : "FALSE",
    body.team,
    body.description || "",
    videoType,
    videoUrl,
    "YES",
    "Pending",
  ]);

  seedJudgingRow(entryId, body.team, body.fullName);

  try {
    sendPanelAlert(body, entryId, videoType, videoUrl, voucherEligible);
    sendEntrantConfirmation(body.email, body.fullName, entryId);
  } catch (e) {
    Logger.log("Email error: " + e.message);
  }

  return jsonOk({ entryId: entryId, success: true });
}

// ── Emails ────────────────────────────────────────────────────────────────────

function sendPanelAlert(body, entryId, videoType, videoUrl, voucherEligible) {
  var adminUrl = ScriptApp.getService().getUrl() + "?page=admin&token=" + CONFIG.ADMIN_TOKEN;
  var subject = "[" + CONFIG.CAMPAIGN_NAME + "] New entry — " + body.fullName + " (" + body.team + ")";

  var html = [
    "<h2>New entry — " + escHtml(body.fullName) + "</h2>",
    "<p><strong>Ref:</strong> " + entryId + "</p>",
    "<p><strong>Submitted:</strong> " + new Date().toLocaleString("en-AU") + "</p>",
    "<hr>",
    "<p><strong>Team:</strong> " + escHtml(body.team) + "</p>",
    "<p><strong>State:</strong> " + escHtml(body.state) +
      (voucherEligible ? " (voucher-eligible)" : " (NSW — not voucher-eligible)") + "</p>",
    "<p><strong>Contact:</strong> " + escHtml(body.email) + " | " + escHtml(body.phone) + "</p>",
    body.description ? "<p><strong>Description:</strong><br>" + escHtml(body.description) + "</p>" : "",
    "<p><strong>Video (" + videoType + "):</strong> <a href=\"" + videoUrl + "\">" + videoUrl + "</a></p>",
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

function sendEntrantConfirmation(email, name, entryId) {
  var subject = CONFIG.CAMPAIGN_NAME + " — entry received";

  var html = [
    "<p>Hi " + escHtml(name) + ",</p>",
    "<p>Thanks for entering <strong>" + CONFIG.CAMPAIGN_NAME + "</strong> ahead of <strong>" +
      CONFIG.EVENT_NAME + "</strong>.</p>",
    "<p>Your entry reference is <strong>" + entryId + "</strong>.</p>",
    "<p>Our judging panel will score all entries after the deadline of <strong>" +
      CONFIG.ENTRY_CLOSE_DISPLAY + "</strong>. Winners will be announced " +
      CONFIG.WINNER_ANNOUNCE_DISPLAY + " on our official Instagram and Facebook pages.</p>",
    "<p>If you have a question, email <a href='mailto:" + CONFIG.OWNER_EMAIL + "'>" +
      CONFIG.OWNER_EMAIL + "</a> and include your reference number.</p>",
    "<p>Good luck!<br>The Kayal Events team</p>",
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
        "</body></html>"
    )
      .setTitle("Access denied — " + CONFIG.CAMPAIGN_NAME)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
  }

  var tmpl = HtmlService.createTemplateFromFile("Admin");
  tmpl.adminToken = token;
  return tmpl
    .evaluate()
    .setTitle(CONFIG.CAMPAIGN_NAME + " — Entries — Kayal Events")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

// ── Admin server-side functions (called from Admin.html via google.script.run) ─

// eslint-disable-next-line no-unused-vars
function getSubmissions(token) {
  requirePanel(token);
  var sheet = getEntriesSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, ENTRIES_HEADERS.length).getValues();
  return data.map(function (row) {
    var obj = {};
    ENTRIES_HEADERS.forEach(function (key, i) {
      obj[key] = row[i] instanceof Date ? row[i].toISOString() : String(row[i] || "");
    });
    return obj;
  });
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
