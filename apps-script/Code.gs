// Paste this into Extensions > Apps Script on your Google Sheet.
// Requires two tabs: "TeamLeads" (header: Name) and "Filings" (header row below).

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
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
