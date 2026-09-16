function doGet(e) {
  var action = e.parameter.action;
  if (action === 'meetings') {
    try {
      var now = new Date();
      var future = new Date();
      future.setDate(future.getDate() + 21);
      var events = CalendarApp.getDefaultCalendar().getEvents(now, future);
      var huddles = [];
      var townhall = null;
      events.forEach(function (ev) {
        var title = ev.getTitle();
        if (title === 'Cluster Huddle' && huddles.length < 2) {
          huddles.push({ date: Utilities.formatDate(ev.getStartTime(), 'America/Los_Angeles', 'MMM d'), time: Utilities.formatDate(ev.getStartTime(), 'America/Los_Angeles', 'h:mm a') });
        }
        if (title.indexOf('Town Hall') !== -1 && !townhall) {
          townhall = { date: Utilities.formatDate(ev.getStartTime(), 'America/Los_Angeles', 'MMM d'), time: Utilities.formatDate(ev.getStartTime(), 'America/Los_Angeles', 'h:mm a') };
        }
      });
      return ContentService.createTextOutput(JSON.stringify({ ok: true, huddles: huddles, townhall: townhall })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, huddles: [], townhall: null })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: false })).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(ss, name, headerRow) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headerRow) sheet.appendRow(headerRow);
  }
  return sheet;
}

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

function findAndUpdateRow(sheet, matchCriteria, updates) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var data = sheet.getDataRange().getValues();
  var matchCols = [];
  Object.keys(matchCriteria).forEach(function (key) {
    var val = String(matchCriteria[key] || '').trim().toLowerCase();
    if (val) matchCols.push({ col: headers.indexOf(key), value: val });
  });
  if (matchCols.length === 0) return;
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

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.type === 'Lead') {
      var leadsSheet = getOrCreateSheet(ss, 'TeamLeads', ['Name']);
      leadsSheet.appendRow([data.name || '']);
    } else if (data.type === 'Filing') {
      var filingsSheet = getOrCreateSheet(ss, 'Filings', ['Timestamp', 'Lead', 'Start', 'End', 'Status', 'FiledOn', 'NoticeGivenDays', 'RequiredNoticeDays', 'DurationBusinessDays', 'Note']);
      filingsSheet.appendRow([new Date(), data.lead || '', data.start || '', data.end || '', data.status || '', data.filedOn || '', data.noticeGiven || '', data.requiredNotice || '', data.duration || '', data.note || '']);
    } else if (data.type === 'EOD') {
      var eodSheet = getOrCreateSheet(ss, 'EOD', ['Timestamp', 'Lead', 'Date', 'ClientCalls', 'Coachings', 'FathomLink', 'TicketMonitoring', 'HubspotScreenshot', 'AttendanceScreenshot']);
      var hubspotUrl = '';
      var attendanceUrl = '';
      if (data.hubspotFile && data.hubspotFile.data) {
        var folder = DriveApp.getFoldersByName('Cluster Joe EOD Screenshots').hasNext() ? DriveApp.getFoldersByName('Cluster Joe EOD Screenshots').next() : DriveApp.createFolder('Cluster Joe EOD Screenshots');
        var hsBlob = Utilities.newBlob(Utilities.base64Decode(data.hubspotFile.data), data.hubspotFile.mimeType, data.hubspotFile.name);
        var hsFile = folder.createFile(hsBlob);
        hsFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        hubspotUrl = hsFile.getUrl();
      }
      if (data.attendanceFile && data.attendanceFile.data) {
        var folder2 = DriveApp.getFoldersByName('Cluster Joe EOD Screenshots').hasNext() ? DriveApp.getFoldersByName('Cluster Joe EOD Screenshots').next() : DriveApp.createFolder('Cluster Joe EOD Screenshots');
        var atBlob = Utilities.newBlob(Utilities.base64Decode(data.attendanceFile.data), data.attendanceFile.mimeType, data.attendanceFile.name);
        var atFile = folder2.createFile(atBlob);
        atFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        attendanceUrl = atFile.getUrl();
      }
      eodSheet.appendRow([new Date(), data.lead || '', data.date || '', data.clientCalls || '', data.coachings || '', data.fathomLink || '', data.ticketMonitoring || '', hubspotUrl, attendanceUrl]);
    } else if (data.type === 'AprCompletion') {
      var aprCompletionsSheet = getOrCreateSheet(ss, 'AprCompletions', ['Timestamp', 'Name', 'TL', 'OccurrenceDate', 'HubspotLink', 'ScreenshotLink']);
      var screenshotUrl = '';
      if (data.screenshot && data.screenshot.data) {
        var aprFolder = DriveApp.getFoldersByName('Cluster Joe APR Screenshots').hasNext() ? DriveApp.getFoldersByName('Cluster Joe APR Screenshots').next() : DriveApp.createFolder('Cluster Joe APR Screenshots');
        var aprBlob = Utilities.newBlob(Utilities.base64Decode(data.screenshot.data), data.screenshot.mimeType, data.screenshot.name);
        var aprFile = aprFolder.createFile(aprBlob);
        aprFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        screenshotUrl = aprFile.getUrl();
      }
      aprCompletionsSheet.appendRow([new Date(), data.name || '', data.tl || '', data.occurrenceDate || '', data.hubspotLink || '', screenshotUrl]);
    } else if (data.type === 'EOWr') {
      var eowrSheet = getOrCreateSheet(ss, 'EOWr', ['Timestamp', 'TL', 'WeekStart', 'SheetLink']);
      eowrSheet.appendRow([new Date(), data.tl || '', data.weekStart || '', data.sheetLink || '']);
    } else if (data.type === 'TownHallNomination') {
      var nominationsSheet = getOrCreateSheet(ss, 'TownHallNominations', ['Timestamp', 'TL', 'Agent', 'Client', 'Reason', 'Month', 'RecordingLink']);
      nominationsSheet.appendRow([new Date(), data.tl || '', data.agent || '', data.client || '', data.reason || '', data.month || '', data.recordingLink || '']);
    } else if (data.type === 'ExpansionBonus') {
      var ebSheet = getOrCreateSheet(ss, 'ExpansionBonus', ['Timestamp', 'TL', 'Agent', 'Client', 'StartDate', 'HubspotLink']);
      ebSheet.appendRow([data.timestamp || new Date().toISOString(), data.tl || '', data.agent || '', data.client || '', data.startDate || '', data.hubspotLink || '']);
    } else if (data.type === 'ExpansionBonusCompletion') {
      var ebCompletionsSheet = getOrCreateSheet(ss, 'ExpansionBonusCompletions', ['Timestamp', 'OriginalTimestamp', 'ProcessedBy', 'Notes', 'Status']);
      ebCompletionsSheet.appendRow([new Date(), data.originalTimestamp || '', data.processedBy || '', data.notes || '', data.status || 'Approved']);
    } else if (data.type === 'CoachingCompliance') {
      var coachingSheet = getOrCreateSheet(ss, 'CoachingCompliance', ['Timestamp', 'TL', 'Agent', 'Type', 'FathomLink']);
      coachingSheet.appendRow([new Date(), data.tl || '', data.agent || '', data.coachingType || '', data.fathomLink || '']);
    } else if (data.type === 'AddAgent') {
      var aprsSheetForAdd = ss.getSheetByName('APRs');
      appendRowByHeaders(aprsSheetForAdd, { 'Name': data.name || '', 'Date': data.date || '', 'TL': data.tl || '', 'Hubstaff ID': data.hubstaffId || '', 'Status': 'Active' });
    } else if (data.type === 'UpdateAgentStatus') {
      var aprsSheetForUpdate = ss.getSheetByName('APRs');
      findAndUpdateRow(aprsSheetForUpdate, { 'Name': data.name || '', 'TL': data.tl || '', 'Hubstaff ID': data.hubstaffId || '' }, { 'Status': data.status || 'Active' });
    } else if (data.type === 'EditAgent') {
      var aprsSheetForEdit = ss.getSheetByName('APRs');
      findAndUpdateRow(aprsSheetForEdit, { 'Name': data.originalName || '', 'TL': data.tl || '', 'Hubstaff ID': data.originalHubstaffId || '' }, { 'Name': data.newName || '', 'Hubstaff ID': data.newHubstaffId || '', 'Date': data.newDate || '' });
    } else if (data.type === 'AddMemo') {
      var memosSheet = getOrCreateSheet(ss, 'EMemos', ['Timestamp', 'Title', 'Link', 'DatePosted']);
      memosSheet.appendRow([new Date(), data.title || '', data.link || '', data.datePosted || '']);
    } else if (data.type === 'ConfirmMemo') {
      var memoConfirmationsSheet = getOrCreateSheet(ss, 'EMemoConfirmations', ['Timestamp', 'TL', 'MemoTitle']);
      memoConfirmationsSheet.appendRow([new Date(), data.tl || '', data.memoTitle || '']);
    } else if (data.type === 'AddLink') {
      var linksSheet = getOrCreateSheet(ss, 'ClusterLinks', ['Timestamp', 'Name', 'URL', 'Description']);
      linksSheet.appendRow([new Date(), data.name || '', data.url || '', data.description || '']);
    } else if (data.type === 'EditNomination') {
      var nominationsSheetForEdit = ss.getSheetByName('TownHallNominations');
      findAndUpdateRow(nominationsSheetForEdit, { 'TL': data.tl || '', 'Month': data.month || '' }, { 'Agent': data.agent || '', 'Client': data.client || '', 'Reason': data.reason || '', 'RecordingLink': data.recordingLink || '' });
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    var errorSheet = getOrCreateSheet(ss, 'Errors', ['Timestamp', 'Message', 'Stack']);
    errorSheet.appendRow([new Date(), err.message, err.stack]);
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}
