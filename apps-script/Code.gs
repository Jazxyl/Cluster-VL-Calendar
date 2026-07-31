// Paste this into Extensions > Apps Script on your Google Sheet.
// Requires tabs: "TeamLeads" (header: Name), "Filings" (headers below), and
// "EOD" (headers: Timestamp, Date, ClientCalls, Coachings, FathomLink,
// TicketMonitoring, HubspotScreenshot, AttendanceScreenshot).
// Screenshots are saved into a Drive folder named "Cluster Joe EOD Screenshots"
// (created automatically the first time), then linked from the EOD sheet row.

var EOD_SCREENSHOT_FOLDER_NAME = 'Cluster Joe EOD Screenshots';

function getOrCreateFolder(name) {
  var folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(name);
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

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();

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
}
