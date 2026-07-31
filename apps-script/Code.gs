// Paste this into Extensions > Apps Script on your Google Sheet.
// Requires tabs: "TeamLeads" (header: Name), "Filings" (headers below), and
// "EOD" (headers: Timestamp, Lead, Date, ClientCalls, Coachings, FathomLink,
// TicketMonitoring, HubspotScreenshot, AttendanceScreenshot).
// Screenshots are saved into a Drive folder named "Cluster Joe EOD Screenshots"
// (created automatically the first time), then linked from the EOD sheet row.
// Any error is also logged into an "Errors" tab (auto-created) so failures
// are visible even when Apps Script's own execution log doesn't show detail.

var EOD_SCREENSHOT_FOLDER_NAME = 'Cluster Joe EOD Screenshots';

function getOrCreateFolder(name) {
  var folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(name);
}

function getOrCreateSheet(ss, name, headerRow) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headerRow) sheet.appendRow(headerRow);
  }
  return sheet;
}

function saveScreenshot(fileObj) {
  if (!fileObj || !fileObj.data) return '';
  var folder = getOrCreateFolder(EOD_SCREENSHOT_FOLDER_NAME);
  var bytes = Utilities.base64Decode(fileObj.data);
  var blob = Utilities.newBlob(bytes, fileObj.mimeType || 'image/png', fileObj.name || 'screenshot.png');
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function doGet(e) {
  var action = e.parameter.action;
  if (action === 'meetings') {
    return getMeetingsJson();
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'unknown action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

var APP_TIMEZONE = 'America/Los_Angeles';

function formatEventDate(d) {
  return Utilities.formatDate(d, APP_TIMEZONE, 'yyyy-MM-dd');
}
function formatEventTime(d) {
  return Utilities.formatDate(d, APP_TIMEZONE, 'h:mm a');
}

// Reads the next ~45 days from the default calendar (the account this script
// is deployed under). Cluster Huddle: exact title match, next 2 occurrences
// (it happens twice a week). Townhall: title just needs to CONTAIN "Town Hall"
// since the real titles include the month, e.g. "August 2026 Town Hall".
function getMeetingsJson() {
  try {
    var cal = CalendarApp.getDefaultCalendar();
    var now = new Date();
    var future = new Date();
    future.setDate(future.getDate() + 45);
    var events = cal.getEvents(now, future);

    var huddles = [];
    var townhall = null;

    for (var i = 0; i < events.length; i++) {
      var ev = events[i];
      var title = ev.getTitle();
      var titleLower = title.toLowerCase();

      if (titleLower === 'cluster huddle' && huddles.length < 2) {
        huddles.push({
          date: formatEventDate(ev.getStartTime()),
          time: formatEventTime(ev.getStartTime())
        });
      } else if (titleLower.indexOf('town hall') !== -1 && !townhall) {
        townhall = {
          date: formatEventDate(ev.getStartTime()),
          time: formatEventTime(ev.getStartTime()),
          title: title
        };
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true, huddles: huddles, townhall: townhall }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.type === 'Lead') {
      var leadsSheet = ss.getSheetByName('TeamLeads');
      leadsSheet.appendRow([data.name || '']);
    } else if (data.type === 'Filing') {
      var filingsSheet = ss.getSheetByName('Filings');
      filingsSheet.appendRow([
        new Date(),
        data.lead || '',
        data.start || '',
        data.end || '',
        data.status || '',
        data.filedOn || '',
        data.noticeGiven || '',
        data.requiredNotice || '',
        data.duration || '',
        data.note || ''
      ]);
    } else if (data.type === 'EOD') {
      var eodSheet = ss.getSheetByName('EOD');
      var hubspotUrl = saveScreenshot(data.hubspotFile);
      var attendanceUrl = saveScreenshot(data.attendanceFile);
      eodSheet.appendRow([
        new Date(),
        data.lead || '',
        data.date || '',
        data.clientCalls || '',
        data.coachings || '',
        data.fathomLink || '',
        data.ticketMonitoring || '',
        hubspotUrl,
        attendanceUrl
      ]);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    var errorSheet = getOrCreateSheet(ss, 'Errors', ['Timestamp', 'Message', 'Stack']);
    errorSheet.appendRow([new Date(), err.message || String(err), err.stack || '']);
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
