/**
 * ==============================================================================
 * BACKEND GOOGLE APPS SCRIPT (code.gs)
 * Aplikasi Presensi & Portal Kepegawaian Gereja Toraja Jemaat Karambe
 * ==============================================================================
 * Petunjuk Penggunaan di Google Apps Script (GAS):
 * 1. Buka Google Sheets yang terhubung dengan database Anda.
 * 2. Klik menu "Extensions" > "Apps Script".
 * 3. Buat file baru bernama `code.gs` (atau ganti isi `Code.gs` bawaan) dengan kode ini.
 * 4. Atur SPREADSHEET_ID di bawah (atau gunakan SpreadsheetApp.getActiveSpreadsheet()).
 * 5. Deploy sebagai Web App (Publish > Deploy as web app):
 *    - Execute as: Me (Email Anda)
 *    - Who has access: Anyone (Siapa saja, termasuk anonim)
 * 6. Salin URL Web App dan gunakan sebagai Endpoint API di aplikasi web Anda.
 * ==============================================================================
 */

// Ganti dengan ID Spreadsheet Anda jika berdiri sendiri, atau gunakan active spreadsheet
const SPREADSHEET_ID = ""; // Kosongkan jika script terikat (bound) langsung ke Google Sheet

function getDatabase_() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  try {
    const ss = getDatabase_();
    const action = e && e.parameter && e.parameter.action ? e.parameter.action : "ping";
    
    let result = { status: "success", message: "API Portal Kepegawaian Jemaat Karambe Aktif" };

    if (action === "getEmployees") {
      result.data = getSheetData_(ss, "Pegawai");
    } else if (action === "getAttendance") {
      result.data = getSheetData_(ss, "Presensi");
    } else if (action === "getLeaves") {
      result.data = getSheetData_(ss, "Izin");
    } else if (action === "ping") {
      result.timestamp = new Date().toISOString();
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle HTTP POST Requests
 */
function doPost(e) {
  try {
    const ss = getDatabase_();
    let body = {};
    
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    const action = body.action || (e && e.parameter && e.parameter.action);
    let result = { status: "success" };

    if (action === "saveEmployee") {
      result = saveEmployee_(ss, body.data);
    } else if (action === "recordAttendance") {
      result = recordAttendance_(ss, body.data);
    } else if (action === "saveLeave") {
      result = saveLeave_(ss, body.data);
    } else if (action === "deleteEmployee") {
      result = deleteEmployee_(ss, body.id);
    } else {
      throw new Error("Action tidak dikenal: " + action);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Helper: Ambil seluruh data dari sheet sebagai array of objects
 */
function getSheetData_(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    // Buat sheet otomatis jika belum ada dengan header default
    sheet = ss.insertSheet(sheetName);
    if (sheetName === "Pegawai") {
      sheet.appendRow(["id", "nama", "email", "unitKerja", "jabatan", "telepon", "status", "fotoUrl"]);
    } else if (sheetName === "Presensi") {
      sheet.appendRow(["id", "pegawaiId", "nama", "tanggal", "jamMasuk", "jamPulang", "status", "latitude", "longitude", "fotoSelfieUrl", "keterangan"]);
    } else if (sheetName === "Izin") {
      sheet.appendRow(["id", "pegawaiId", "nama", "jenis", "tanggalMulai", "tanggalSelesai", "alasan", "status", "lampiranUrl"]);
    }
    return [];
  }

  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  const headers = rows[0];
  const data = [];

  for (let i = 1; i < rows.length; i++) {
    let obj = {};
    for (let j = 0; j < headers.length; j++) {
      let key = headers[j];
      // Normalisasi key menjadi camelCase jika diperlukan
      obj[key] = rows[i][j];
    }
    data.push(obj);
  }

  return data;
}

/**
 * Helper: Simpan atau Perbarui Data Pegawai
 */
function saveEmployee_(ss, employeeData) {
  let sheet = ss.getSheetByName("Pegawai");
  if (!sheet) {
    sheet = ss.insertSheet("Pegawai");
    sheet.appendRow(["id", "nama", "email", "unitKerja", "jabatan", "telepon", "status", "fotoUrl"]);
  }

  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  
  // Cari apakah id sudah ada
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(employeeData.id)) {
      rowIndex = i + 1; // 1-indexed for sheet
      break;
    }
  }

  const rowValues = [
    employeeData.id || "EMP-" + Date.now(),
    employeeData.nama || "",
    employeeData.email || "",
    employeeData.unitKerja || "Multimedia",
    employeeData.jabatan || "",
    employeeData.telepon || "",
    employeeData.status || "Aktif",
    employeeData.fotoUrl || ""
  ];

  if (rowIndex > 0) {
    // Update
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    // Insert baru
    sheet.appendRow(rowValues);
  }

  return { status: "success", message: "Data pegawai berhasil disimpan", data: employeeData };
}

/**
 * Helper: Catat Presensi
 */
function recordAttendance_(ss, attendanceData) {
  let sheet = ss.getSheetByName("Presensi");
  if (!sheet) {
    sheet = ss.insertSheet("Presensi");
    sheet.appendRow(["id", "pegawaiId", "nama", "tanggal", "jamMasuk", "jamPulang", "status", "latitude", "longitude", "fotoSelfieUrl", "keterangan"]);
  }

  const rowValues = [
    attendanceData.id || "ATT-" + Date.now(),
    attendanceData.pegawaiId || "",
    attendanceData.nama || "",
    attendanceData.tanggal || new Date().toISOString().split('T')[0],
    attendanceData.jamMasuk || "",
    attendanceData.jamPulang || "",
    attendanceData.status || "Hadir",
    attendanceData.latitude || "",
    attendanceData.longitude || "",
    attendanceData.fotoSelfieUrl || "",
    attendanceData.keterangan || ""
  ];

  sheet.appendRow(rowValues);
  return { status: "success", message: "Presensi berhasil dicatat", data: attendanceData };
}

/**
 * Helper: Simpan Pengajuan Izin / Cuti
 */
function saveLeave_(ss, leaveData) {
  let sheet = ss.getSheetByName("Izin");
  if (!sheet) {
    sheet = ss.insertSheet("Izin");
    sheet.appendRow(["id", "pegawaiId", "nama", "jenis", "tanggalMulai", "tanggalSelesai", "alasan", "status", "lampiranUrl"]);
  }

  const rowValues = [
    leaveData.id || "LV-" + Date.now(),
    leaveData.pegawaiId || "",
    leaveData.nama || "",
    leaveData.jenis || "Izin",
    leaveData.tanggalMulai || "",
    leaveData.tanggalSelesai || "",
    leaveData.alasan || "",
    leaveData.status || "Pending",
    leaveData.lampiranUrl || ""
  ];

  sheet.appendRow(rowValues);
  return { status: "success", message: "Pengajuan izin berhasil disimpan", data: leaveData };
}

/**
 * Helper: Hapus Pegawai
 */
function deleteEmployee_(ss, id) {
  let sheet = ss.getSheetByName("Pegawai");
  if (!sheet) return { status: "error", message: "Sheet Pegawai tidak ditemukan" };

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { status: "success", message: "Pegawai berhasil dihapus" };
    }
  }

  return { status: "error", message: "Pegawai dengan ID tersebut tidak ditemukan" };
}
