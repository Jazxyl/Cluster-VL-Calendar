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

// Appends a new row using a {headerName: value} object rather than a fixed
// column order — looks up each header's position, creating that column if
// it doesn't exist yet (e.g. a brand new "Status" column on first use).
function appendRowByHeaders(sheet, dataObj) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var newRowIndex = sheet.getLastRow() + 1;
  Object.keys(dataObj).forEach(function (key) {
    var colIndex = headers.indexOf(key);
    if (colIndex === -1) {
      colIndex = headers.length;
      sheet.getRange(1, colIndex + 1).setValue(key);
      headers.push(key);
    }
    sheet.getRange(newRowIndex, colIndex + 1).setValue(dataObj[key]);
  });
}

// Finds every row matching ALL of matchCriteria (case-insensitive, trimmed,
// empty criteria are skipped rather than required to match empty) and
// updates it with the given {headerName: value} pairs — creating any target
// column that doesn't exist yet. Never deletes or shifts rows, only writes
// into existing ones, so there's no risk of row-index corruption.
function findAndUpdateRow(sheet, matchCriteria, updates) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var data = sheet.getDataRange().getValues();

  var matchCols = [];
  Object.keys(matchCriteria).forEach(function (key) {
    var val = String(matchCriteria[key] || '').trim().toLowerCase();
    if (val) matchCols.push({ col: headers.indexOf(key), value: val });
  });
  if (matchCols.length === 0) return; // no real criteria — refuse to touch anything

  for (var i = 1; i < data.length; i++) {
    var isMatch = matchCols.every(function (m) {
      return m.col !== -1 && String(data[i][m.col] || '').trim().toLowerCase() === m.value;
    });
    if (isMatch) {
      Object.keys(updates).forEach(function (key) {
        var colIndex = headers.indexOf(key);
        if (colIndex === -1) {
          colIndex = headers.length;
          sheet.getRange(1, colIndex + 1).setValue(key);
          headers.push(key);
        }
        sheet.getRange(i + 1, colIndex + 1).setValue(updates[key]);
      });
    }
  }
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
    } else if (data.type === 'AprCompletion') {
      var aprCompletionsSheet = getOrCreateSheet(ss, 'AprCompletions', ['Timestamp', 'Name', 'TL', 'OccurrenceDate', 'HubspotLink', 'ScreenshotLink']);
      var aprScreenshotUrl = saveScreenshot(data.screenshot);
      aprCompletionsSheet.appendRow([
        new Date(),
        data.name || '',
        data.tl || '',
        data.occurrenceDate || '',
        data.hubspotLink || '',
        aprScreenshotUrl
      ]);
    } else if (data.type === 'EOWr') {
      var eowrSheet = getOrCreateSheet(ss, 'EOWr', ['Timestamp', 'TL', 'WeekStart', 'SheetLink']);
      eowrSheet.appendRow([
        new Date(),
        data.tl || '',
        data.weekStart || '',
        data.sheetLink || ''
      ]);
    } else if (data.type === 'TownHallNomination') {
      var nominationsSheet = getOrCreateSheet(ss, 'TownHallNominations', ['Timestamp', 'TL', 'Agent', 'Client', 'Reason', 'Month', 'RecordingLink']);
      nominationsSheet.appendRow([
        new Date(),
        data.tl || '',
        data.agent || '',
        data.client || '',
        data.reason || '',
        data.month || '',
        data.recordingLink || ''
      ]);
    } else if (data.type === 'ExpansionBonus') {
      var ebSheet = getOrCreateSheet(ss, 'ExpansionBonus', ['Timestamp', 'TL', 'Agent', 'Client', 'StartDate', 'HubspotLink']);
      ebSheet.appendRow([
        data.timestamp || new Date().toISOString(),
        data.tl || '',
        data.agent || '',
        data.client || '',
        data.startDate || '',
        data.hubspotLink || ''
      ]);
    } else if (data.type === 'ExpansionBonusCompletion') {
      var ebCompletionsSheet = getOrCreateSheet(ss, 'ExpansionBonusCompletions', ['Timestamp', 'OriginalTimestamp', 'ProcessedBy', 'Notes']);
      ebCompletionsSheet.appendRow([
        new Date(),
        data.originalTimestamp || '',
        data.processedBy || '',
        data.notes || ''
      ]);
    } else if (data.type === 'CoachingCompliance') {
      var coachingSheet = getOrCreateSheet(ss, 'CoachingCompliance', ['Timestamp', 'TL', 'Agent', 'Type', 'FathomLink']);
      coachingSheet.appendRow([
        new Date(),
        data.tl || '',
        data.agent || '',
        data.coachingType || '',
        data.fathomLink || ''
      ]);
    } else if (data.type === 'AddAgent') {
      var aprsSheetForAdd = ss.getSheetByName('APRs');
      appendRowByHeaders(aprsSheetForAdd, {
        'Name': data.name || '',
        'Date': data.date || '',
        'TL': data.tl || '',
        'Hubstaff ID': data.hubstaffId || '',
        'Status': 'Active'
      });
    } else if (data.type === 'UpdateAgentStatus') {
      var aprsSheetForUpdate = ss.getSheetByName('APRs');
      findAndUpdateRow(
        aprsSheetForUpdate,
        { 'Name': data.name || '', 'TL': data.tl || '', 'Hubstaff ID': data.hubstaffId || '' },
        { 'Status': data.status || 'Active' }
      );
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
