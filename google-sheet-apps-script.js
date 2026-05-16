const SPREADSHEET_ID = "1OZXrRErFXd7UhtuG42J5yXMso30VSvmFD2lT-vYPK4E";
const SHEET_NAME = "Sheet1";

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, message: "REYVO sheet webhook is live." }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const data = JSON.parse((e.postData && e.postData.contents) || "{}");

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Created At", "Form Type", "Name", "Contact", "Email", "Phone", "Role", "Message", "Count"]);
    }

    sheet.appendRow([
      data.created_at || new Date().toISOString(),
      data.form_type || "",
      data.name || "",
      data.contact || "",
      data.email || "",
      data.phone || "",
      data.role || "",
      data.message || "",
      data.count || "",
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
