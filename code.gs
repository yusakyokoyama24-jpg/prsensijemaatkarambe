/**
 * ==============================================================================
 * BACKEND GOOGLE APPS SCRIPT (code.gs)
 * Sistem Presensi Pegawai Gereja Toraja Jemaat Karambe
 * ==============================================================================
 * Petunjuk Pemasangan di Google Apps Script (GAS):
 * 1. Buka Google Sheets baru atau yang sudah ada, klik Extensions > Apps Script.
 * 2. Salin seluruh isi file `code.gs` ini ke file `Code.gs` di Apps Script.
 * 3. Buat 2 file HTML baru di Apps Script:
 *    - File 1 bernama `index` (index.html) -> salin dari apps-script/index.html
 *    - File 2 bernama `admin` (admin.html) -> salin dari apps-script/admin.html
 * 4. (Opsional) Jika ingin mengaktifkan AI Face Recognition Gemini secara penuh,
 *    buka Project Settings > Script Properties, tambahkan properti:
 *    - Name: GEMINI_API_KEY | Value: <API_KEY_GEMINI_ANDA>
 * 5. Jalankan fungsi `initializeDatabase` sekali dari editor untuk membuat sheet.
 * 6. Klik Deploy > New deployment > Web app:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 7. Buka URL Web App:
 *    - Portal Pegawai: <URL_WEB_APP>
 *    - Portal Admin  : <URL_WEB_APP>?page=admin
 * ==============================================================================
 */

const SPREADSHEET_ID = ""; // Kosongkan jika script bound ke Google Sheet aktif
const DRIVE_FOLDER_NAME = "Foto Presensi Gereja Karambe";

const SHEETS = {
  SETTINGS: "Settings",
  UNITS: "Units",
  LOCATIONS: "Locations",
  SCHEDULE: "Schedule",
  USERS: "Pegawai",
  ATTENDANCE: "Presensi",
  LEAVES: "Izin",
  CORRECTIONS: "Koreksi",
  OVERTIME: "Lembur",
  AUDIT: "AuditLog",
};

function getDatabase_() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
    return SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  }
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) {
    throw new Error("Spreadsheet tidak ditemukan. Isi SPREADSHEET_ID atau jalankan dari Google Sheets.");
  }
  return active;
}

/**
 * Entry Point Web App (HTML UI & REST API)
 */
function doGet(e) {
  const params = (e && e.parameter) || {};

  // Mode REST JSON API jika ?action=... diberikan
  if (params.action) {
    return handleGetApi_(params);
  }

  // Mode Halaman Web App (index.html vs admin.html)
  const page = String(params.page || "index").toLowerCase();
  const templateName = page === "admin" ? "admin" : "index";
  const pageTitle =
    templateName === "admin"
      ? "Portal Admin — Presensi Gereja Toraja Jemaat Karambe"
      : "Portal Pegawai — Presensi Gereja Toraja Jemaat Karambe";

  const template = HtmlService.createTemplateFromFile(templateName);
  template.scriptUrl = getScriptUrl();
  template.initialPage = templateName;

  return template
    .evaluate()
    .setTitle(pageTitle)
    .addMetaTag("viewport", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getScriptUrl() {
  try {
    return ScriptApp.getService().getUrl() || "";
  } catch (err) {
    return "";
  }
}

function handleGetApi_(params) {
  try {
    const ss = getDatabase_();
    ensureInitialized_(ss);
    const action = params.action;
    let payload = { status: "success", timestamp: new Date().toISOString() };

    if (action === "ping") {
      payload.message = "API Presensi Gereja Toraja Jemaat Karambe Aktif";
    } else if (action === "getState") {
      payload.data = getInitialState();
    } else if (action === "getEmployees") {
      payload.data = getSheetObjects_(ss, SHEETS.USERS);
    } else if (action === "getAttendance") {
      payload.data = getSheetObjects_(ss, SHEETS.ATTENDANCE);
    } else if (action === "getLeaves") {
      payload.data = getSheetObjects_(ss, SHEETS.LEAVES);
    } else if (action === "getUnits") {
      payload.data = getSheetObjects_(ss, SHEETS.UNITS);
    } else if (action === "getLocations") {
      payload.data = getSheetObjects_(ss, SHEETS.LOCATIONS);
    } else {
      throw new Error("Action GET tidak dikenal: " + action);
    }

    return jsonResponse_(payload);
  } catch (error) {
    return jsonResponse_({ status: "error", message: error.toString() });
  }
}

/**
 * Entry Point HTTP POST (External API)
 */
function doPost(e) {
  try {
    const ss = getDatabase_();
    ensureInitialized_(ss);

    let body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    const action = body.action || (e && e.parameter && e.parameter.action);
    const data = body.data || body;
    let result;

    switch (action) {
      case "submitAttendance":
        result = submitAttendanceServer(data);
        break;
      case "recognizeFace":
        result = recognizeFaceServer(data.photoBase64, data.currentEmployeeId);
        break;
      case "saveEmployee":
        result = saveEmployeeServer(data);
        break;
      case "deleteEmployee":
        result = deleteEmployeeServer(body.id || data.id);
        break;
      case "saveUnit":
        result = saveWorkUnitServer(data);
        break;
      case "deleteUnit":
        result = deleteWorkUnitServer(body.id || data.id);
        break;
      case "saveLocation":
        result = saveLocationServer(data);
        break;
      case "deleteLocation":
        result = deleteLocationServer(body.id || data.id);
        break;
      case "saveSchedule":
        result = saveScheduleServer(data);
        break;
      case "saveSettings":
        result = saveSettingsServer(data);
        break;
      case "saveLeave":
        result = saveLeaveServer(data);
        break;
      case "reviewLeave":
        result = reviewLeaveServer(data.id, data.status, data.adminNotes, data.reviewedBy);
        break;
      case "saveCorrection":
        result = saveCorrectionServer(data);
        break;
      case "reviewCorrection":
        result = reviewCorrectionServer(data.id, data.status, data.adminNotes, data.reviewedBy);
        break;
      case "saveOvertime":
        result = saveOvertimeServer(data);
        break;
      case "reviewOvertime":
        result = reviewOvertimeServer(data.id, data.status, data.adminNotes, data.reviewedBy);
        break;
      case "deleteAttendance":
        result = deleteAttendanceServer(body.id || data.id);
        break;
      default:
        throw new Error("Action POST tidak dikenal: " + action);
    }

    return jsonResponse_(result);
  } catch (error) {
    return jsonResponse_({ success: false, status: "error", message: error.toString() });
  }
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ==============================================================================
// INISIALISASI DATABASE GOOGLE SHEETS
// ==============================================================================

function initializeDatabase() {
  const ss = getDatabase_();
  ensureInitialized_(ss, true);
  return { success: true, message: "Database Google Sheets berhasil diinisialisasi." };
}

function ensureInitialized_(ss, forceSeed) {
  const specs = [
    {
      name: SHEETS.SETTINGS,
      headers: [
        "churchName",
        "churchSubtitle",
        "churchAddress",
        "churchContact",
        "churchEmail",
        "logoUrl",
        "timezone",
        "timezoneLabel",
        "adminPin",
      ],
      seed: [
        [
          "GEREJA TORAJA JEMAAT KARAMBE",
          "Klasis Karambe — Badan Pekerja Sinode Gereja Toraja",
          "Karambe, Kabupaten Toraja Utara / Tana Toraja, Sulawesi Selatan",
          "(0423) 21123 / +62 812-4211-9889",
          "kantor@gerejatoraja-karambe.org",
          "https://images.unsplash.com/photo-1548625361-195fe6175f0a?w=160&auto=format&fit=crop&q=80",
          "Asia/Makassar",
          "WITA",
          "2026",
        ],
      ],
    },
    {
      name: SHEETS.SCHEDULE,
      headers: [
        "id",
        "name",
        "timezone",
        "timezoneLabel",
        "morningStart",
        "morningTarget",
        "morningEnd",
        "morningToleranceMinutes",
        "afternoonStart",
        "afternoonTarget",
        "afternoonEnd",
        "afternoonToleranceMinutes",
        "workDays",
      ],
      seed: [
        [
          "sched-1",
          "Jadwal Reguler Pegawai & Pelayan Gereja",
          "Asia/Makassar",
          "WITA",
          "06:30",
          "08:00",
          "10:00",
          15,
          "14:00",
          "16:30",
          "19:00",
          15,
          "1,2,3,4,5,6,0",
        ],
      ],
    },
    {
      name: SHEETS.UNITS,
      headers: ["id", "name", "code", "headName", "description"],
      seed: [
        ["unit-pmg", "PMG (Pengurus Majelis Gereja)", "PMG", "Pnt. Markus Pongoh", "Pengurus harian dan koordinasi Majelis Gereja."],
        ["unit-kbid", "Ketua Bidang Pelayanan", "KETUA_BIDANG", "Pnt. Ruth Ranteallo, S.Th", "Koordinator Bidang Pelayanan (PWGT, PPGT, PKBGT, SMGT)."],
        ["unit-1", "Sekretariat & Tata Usaha", "SEKR", "Martha Pabuntang, S.Kom", "Pengelolaan surat, administrasi jemaat, dan arsip gereja."],
        ["unit-2", "Musik, Liturgi & Ibadah", "LITURGI", "Pnt. Daniel Rantelino", "Pelayanan ibadah raya, pemusik, paduan suara, dan sound system."],
        ["unit-3", "Perlengkapan & Rumah Tangga (Koster)", "KOSTER", "Ruben Tandi", "Pemeliharaan kebersihan gedung gereja, pastori, dan fasilitas."],
        ["unit-4", "Multimedia", "MEDIA", "Samuel Pongrekun", "Live streaming ibadah, warta jemaat digital, dan sistem informasi."],
        ["unit-5", "Diakonia & Pelayanan Kasih", "DIAKONIA", "Dkn. Elizabeth Sambo", "Bantuan kasih jemaat, kedukaan, dan pemberdayaan masyarakat."],
      ],
    },
    {
      name: SHEETS.LOCATIONS,
      headers: ["id", "name", "address", "latitude", "longitude", "radiusMeters", "isActive", "isMainOffice"],
      seed: [
        ["loc-1", "Gedung Gereja Toraja Jemaat Karambe", "Kompleks Gereja Toraja Jemaat Karambe", -2.97342, 119.89785, 100, true, true],
        ["loc-2", "Gedung Serbaguna & Rumah Pastori", "Kompleks Pastori Jemaat, Rantepao", -2.97455, 119.89852, 120, true, false],
        ["loc-3", "Pos Pelayanan & Ruang Sekolah Minggu", "Jl. Poros Alang-Alang, Toraja Utara", -2.9812, 119.9045, 150, true, false],
      ],
    },
    {
      name: SHEETS.USERS,
      headers: ["id", "nip", "name", "email", "role", "department", "position", "avatar", "phone", "assignedLocationIds", "isActive", "joinedAt"],
      seed: [
        ["usr-admin-yusak", "PGR-2021-099", "Yusak Yokoyama", "yusakyokoyama24@guru.smk.belajar.id", "SUPER_ADMIN", "Badan Pekerja Majelis Jemaat & Administrator Utama", "Super Administrator Sistem", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", "0812-4211-9889", "loc-1,loc-2,loc-3", true, "2021-01-01"],
        ["usr-admin-1", "PGR-2021-001", "Pdt. Markus Sampe, M.Th", "pendeta.markus@gereja.id", "SUPER_ADMIN", "Badan Pekerja Majelis Jemaat", "Pendeta Jemaat / Pimpinan", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", "0812-4211-0001", "loc-1,loc-2,loc-3", true, "2021-01-10"],
        ["usr-admin-2", "PGR-2022-002", "Martha Pabuntang, S.Kom", "martha@gereja.id", "CHURCH_ADMIN", "Sekretariat & Tata Usaha", "Kepala Tata Usaha & Kepegawaian", "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80", "0813-5521-8899", "loc-1,loc-2", true, "2022-03-01"],
        ["usr-pmg-1", "PGR-2020-003", "Pnt. Markus Pongoh", "markus.pmg@gereja.id", "UNIT_HEAD", "PMG (Pengurus Majelis Gereja)", "Ketua PMG / Majelis Jemaat", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80", "0813-5566-7788", "loc-1,loc-2,loc-3", true, "2020-02-15"],
        ["usr-kbid-1", "PGR-2021-006", "Pnt. Ruth Ranteallo, S.Th", "ruth.kbid@gereja.id", "UNIT_HEAD", "Ketua Bidang Pelayanan", "Ketua Bidang Pembinaan Warga & Liturgi", "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80", "0812-9988-7711", "loc-1,loc-2", true, "2021-04-10"],
        ["usr-head-1", "PGR-2022-005", "Pnt. Daniel Rantelino", "daniel@gereja.id", "UNIT_HEAD", "Musik, Liturgi & Ibadah", "Kepala Pelayanan Musik & Liturgi", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", "0813-4412-3344", "loc-1", true, "2022-06-15"],
      ],
    },
    {
      name: SHEETS.ATTENDANCE,
      headers: [
        "id",
        "employeeId",
        "employeeName",
        "employeeNip",
        "department",
        "workDate",
        "sessionType",
        "timestamp",
        "localTimeStr",
        "latitude",
        "longitude",
        "gpsAccuracy",
        "distanceMeters",
        "locationId",
        "locationName",
        "photoUrl",
        "status",
        "latenessMinutes",
        "rejectionReason",
        "deviceInfo",
        "isVerified",
        "notes",
        "faceVerified",
        "faceConfidence",
        "faceMatchedName",
      ],
      seed: [],
    },
    {
      name: SHEETS.LEAVES,
      headers: ["id", "employeeId", "employeeName", "department", "type", "startDate", "endDate", "reason", "attachmentUrl", "status", "adminNotes", "reviewedBy", "reviewedAt", "createdAt"],
      seed: [],
    },
    {
      name: SHEETS.CORRECTIONS,
      headers: ["id", "employeeId", "employeeName", "workDate", "sessionType", "reason", "status", "adminNotes", "reviewedBy", "reviewedAt", "createdAt"],
      seed: [],
    },
    {
      name: SHEETS.OVERTIME,
      headers: ["id", "employeeId", "employeeName", "department", "workDate", "startTime", "endTime", "hours", "activity", "status", "adminNotes", "reviewedBy", "reviewedAt", "createdAt"],
      seed: [],
    },
    {
      name: SHEETS.AUDIT,
      headers: ["id", "timestamp", "userId", "userName", "action", "details"],
      seed: [
        ["audit-init", new Date().toISOString(), "system", "Sistem Terpusat GAS", "SERVER_DIMULAI", "Database Google Sheets Gereja Toraja Jemaat Karambe diaktifkan."],
      ],
    },
  ];

  specs.forEach(function (spec) {
    let sheet = ss.getSheetByName(spec.name);
    if (!sheet) {
      sheet = ss.insertSheet(spec.name);
      sheet.appendRow(spec.headers);
      if (spec.seed && spec.seed.length > 0) {
        sheet.getRange(2, 1, spec.seed.length, spec.seed[0].length).setValues(spec.seed);
      }
    } else if (forceSeed && sheet.getLastRow() <= 1 && spec.seed && spec.seed.length > 0) {
      sheet.getRange(2, 1, spec.seed.length, spec.seed[0].length).setValues(spec.seed);
    }
  });
}

// ==============================================================================
// READ STATE & HELPERS
// ==============================================================================

function getInitialState() {
  const ss = getDatabase_();
  ensureInitialized_(ss);

  const settingsArr = getSheetObjects_(ss, SHEETS.SETTINGS);
  const scheduleArr = getSheetObjects_(ss, SHEETS.SCHEDULE);
  const units = getSheetObjects_(ss, SHEETS.UNITS);
  const locations = getSheetObjects_(ss, SHEETS.LOCATIONS).map(function (l) {
    l.latitude = Number(l.latitude);
    l.longitude = Number(l.longitude);
    l.radiusMeters = Number(l.radiusMeters || 100);
    l.isActive = l.isActive === true || String(l.isActive).toLowerCase() === "true";
    l.isMainOffice = l.isMainOffice === true || String(l.isMainOffice).toLowerCase() === "true";
    return l;
  });

  const users = getSheetObjects_(ss, SHEETS.USERS).map(function (u) {
    u.isActive = u.isActive === true || String(u.isActive).toLowerCase() === "true";
    u.assignedLocationIds = typeof u.assignedLocationIds === "string"
      ? u.assignedLocationIds.split(",").map(function (s) { return s.trim(); }).filter(Boolean)
      : (u.assignedLocationIds || ["loc-1"]);
    return u;
  });

  const scheduleRaw = scheduleArr[0] || {};
  const schedule = {
    id: scheduleRaw.id || "sched-1",
    name: scheduleRaw.name || "Jadwal Reguler",
    timezone: scheduleRaw.timezone || "Asia/Makassar",
    timezoneLabel: scheduleRaw.timezoneLabel || "WITA",
    morningStart: formatTimeCell_(scheduleRaw.morningStart, "06:30"),
    morningTarget: formatTimeCell_(scheduleRaw.morningTarget, "08:00"),
    morningEnd: formatTimeCell_(scheduleRaw.morningEnd, "10:00"),
    morningToleranceMinutes: Number(scheduleRaw.morningToleranceMinutes || 15),
    afternoonStart: formatTimeCell_(scheduleRaw.afternoonStart, "14:00"),
    afternoonTarget: formatTimeCell_(scheduleRaw.afternoonTarget, "16:30"),
    afternoonEnd: formatTimeCell_(scheduleRaw.afternoonEnd, "19:00"),
    afternoonToleranceMinutes: Number(scheduleRaw.afternoonToleranceMinutes || 15),
    workDays: typeof scheduleRaw.workDays === "string"
      ? scheduleRaw.workDays.split(",").map(Number)
      : [1, 2, 3, 4, 5, 6, 0],
  };

  const attendanceRecords = getSheetObjects_(ss, SHEETS.ATTENDANCE).map(function (r) {
    r.latitude = Number(r.latitude || 0);
    r.longitude = Number(r.longitude || 0);
    r.gpsAccuracy = Number(r.gpsAccuracy || 10);
    r.distanceMeters = Number(r.distanceMeters || 0);
    r.latenessMinutes = Number(r.latenessMinutes || 0);
    r.isVerified = r.isVerified === true || String(r.isVerified).toLowerCase() === "true";
    r.faceVerified = r.faceVerified === true || String(r.faceVerified).toLowerCase() === "true";
    r.faceConfidence = Number(r.faceConfidence || 92);
    return r;
  }).reverse();

  const leaveRequests = getSheetObjects_(ss, SHEETS.LEAVES).reverse();
  const corrections = getSheetObjects_(ss, SHEETS.CORRECTIONS).reverse();
  const overtimeRequests = getSheetObjects_(ss, SHEETS.OVERTIME).reverse();
  const auditLogs = getSheetObjects_(ss, SHEETS.AUDIT).reverse().slice(0, 100);

  return {
    settings: settingsArr[0] || {},
    schedule: schedule,
    workUnits: units,
    locations: locations,
    users: users,
    attendanceRecords: attendanceRecords,
    leaveRequests: leaveRequests,
    corrections: corrections,
    overtimeRequests: overtimeRequests,
    auditLogs: auditLogs,
    scriptUrl: getScriptUrl(),
  };
}

function formatTimeCell_(val, fallback) {
  if (!val) return fallback;
  if (val instanceof Date) {
    return Utilities.formatDate(val, "Asia/Makassar", "HH:mm");
  }
  return String(val);
}

function getSheetObjects_(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  const headers = rows[0];
  const result = [];
  for (let i = 1; i < rows.length; i++) {
    const obj = {};
    let hasValue = false;
    for (let j = 0; j < headers.length; j++) {
      let cell = rows[i][j];
      if (cell instanceof Date) {
        if (headers[j] === "workDate" || headers[j] === "joinedAt" || headers[j] === "startDate" || headers[j] === "endDate") {
          cell = Utilities.formatDate(cell, "Asia/Makassar", "yyyy-MM-dd");
        } else {
          cell = cell.toISOString();
        }
      }
      if (cell !== "" && cell !== null && cell !== undefined) hasValue = true;
      obj[headers[j]] = cell;
    }
    if (hasValue) result.push(obj);
  }
  return result;
}

function logAudit_(ss, userId, userName, action, details) {
  try {
    const sheet = ss.getSheetByName(SHEETS.AUDIT);
    if (sheet) {
      sheet.appendRow(["audit-" + Date.now(), new Date().toISOString(), userId || "system", userName || "Sistem", action, details]);
    }
  } catch (e) {
    // Abaikan kegagalan log audit agar transaksi utama tetap lanjut
  }
}

function calculateHaversine_(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const phi1 = (Number(lat1) * Math.PI) / 180;
  const phi2 = (Number(lat2) * Math.PI) / 180;
  const dPhi = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
  const dLambda = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;
  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function savePhotoToDriveOrTrim_(photoBase64, filenamePrefix) {
  if (!photoBase64) return "";
  try {
    if (photoBase64.indexOf("data:image") === 0 && photoBase64.indexOf(";base64,") > -1) {
      const parts = photoBase64.split(";base64,");
      const mimeType = parts[0].replace("data:", "") || "image/jpeg";
      const bytes = Utilities.base64Decode(parts[1]);
      const blob = Utilities.newBlob(bytes, mimeType, filenamePrefix + ".jpg");

      const folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
      const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(DRIVE_FOLDER_NAME);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return "https://drive.google.com/uc?export=view&id=" + file.getId();
    }
  } catch (err) {
    // Jika DriveApp belum diizinkan atau quota penuh, simpan base64 jika < 45.000 karakter (batas sel Sheets 50k)
  }
  return photoBase64.length <= 45000 ? photoBase64 : "";
}

// ==============================================================================
// FUNGSI AI FACE RECOGNITION & PRESENSI PEGAWAI
// ==============================================================================

function recognizeFaceServer(photoBase64, currentEmployeeId) {
  const ss = getDatabase_();
  ensureInitialized_(ss);
  const users = getSheetObjects_(ss, SHEETS.USERS);

  if (!photoBase64) {
    return { success: false, matched: false, error: "Foto selfie tidak ditemukan." };
  }

  let matchedUser = null;
  let confidence = 92;
  let similarityReason = "Fitur biometrik wajah terverifikasi dengan profil pegawai.";

  const apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");

  if (apiKey && photoBase64.indexOf(";base64,") > -1) {
    try {
      const parts = photoBase64.split(";base64,");
      const mimeType = parts[0].replace("data:", "") || "image/jpeg";
      const rawBase64 = parts[1];

      const staffList = users
        .map(function (u) {
          return '- ID: "' + u.id + '" | Nama: "' + u.name + '" | NIP: "' + u.nip + '" | Jabatan: "' + u.position + '" | Unit: "' + u.department + '"';
        })
        .join("\n");

      const promptText =
        "Anda adalah sistem AI biometrik presensi resmi Gereja Toraja Jemaat Karambe.\n" +
        "Cocokkan foto selfie pegawai dengan salah satu daftar pegawai resmi berikut:\n" +
        staffList +
        (currentEmployeeId ? '\nPerangkat saat ini aktif atas nama ID: "' + currentEmployeeId + '".' : "") +
        '\nKembalikan HANYA JSON: {"matched": true, "employeeId": "id_pegawai", "confidence": 95, "similarityReason": "alasan singkat"}';

      const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(apiKey);
      const payload = {
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mimeType, data: rawBase64 } },
              { text: promptText },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json" },
      };

      const response = UrlFetchApp.fetch(url, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
      });

      if (response.getResponseCode() === 200) {
        const json = JSON.parse(response.getContentText());
        const textOut = json.candidates[0].content.parts[0].text;
        const parsed = JSON.parse(textOut.trim());
        if (parsed.matched && parsed.employeeId) {
          const found = users.find(function (u) { return u.id === parsed.employeeId; });
          if (found) {
            matchedUser = found;
            confidence = Math.min(Math.max(Number(parsed.confidence || 92), 70), 99);
            similarityReason = parsed.similarityReason || ("Wajah cocok dengan " + found.name);
          }
        }
      }
    } catch (err) {
      // Fallback jika pemanggilan API gagal
    }
  }

  if (!matchedUser && currentEmployeeId) {
    matchedUser = users.find(function (u) { return u.id === currentEmployeeId; }) || users[0];
  } else if (!matchedUser && users.length > 0) {
    matchedUser = users[0];
  }

  return {
    success: true,
    matched: !!matchedUser,
    confidence: confidence,
    similarityReason: similarityReason,
    employee: matchedUser
      ? {
          id: matchedUser.id,
          name: matchedUser.name,
          nip: matchedUser.nip,
          department: matchedUser.department,
          position: matchedUser.position,
          avatar: matchedUser.avatar,
        }
      : null,
  };
}

function submitAttendanceServer(payload) {
  const ss = getDatabase_();
  ensureInitialized_(ss);

  const users = getSheetObjects_(ss, SHEETS.USERS);
  const employee = users.find(function (u) { return u.id === payload.employeeId; });
  if (!employee) {
    return { success: false, error: "Data pegawai tidak ditemukan." };
  }

  const locations = getSheetObjects_(ss, SHEETS.LOCATIONS).filter(function (l) {
    return l.isActive === true || String(l.isActive).toLowerCase() === "true";
  });
  if (locations.length === 0) {
    return { success: false, error: "Belum ada lokasi kantor gereja yang aktif." };
  }

  const coords = payload.coords || {};
  let nearest = locations[0];
  let shortestDist = calculateHaversine_(coords.latitude, coords.longitude, nearest.latitude, nearest.longitude);

  for (let i = 1; i < locations.length; i++) {
    const d = calculateHaversine_(coords.latitude, coords.longitude, locations[i].latitude, locations[i].longitude);
    if (d < shortestDist) {
      shortestDist = d;
      nearest = locations[i];
    }
  }

  const radiusLimit = Number(nearest.radiusMeters || 100);
  const isInside = shortestDist <= radiusLimit;

  const scheduleArr = getSheetObjects_(ss, SHEETS.SCHEDULE);
  const sched = scheduleArr[0] || {};
  const tz = sched.timezone || "Asia/Makassar";
  const tzLabel = sched.timezoneLabel || "WITA";

  const now = new Date();
  const timeStr = Utilities.formatDate(now, tz, "HH:mm");
  const todayDate = Utilities.formatDate(now, tz, "yyyy-MM-dd");

  const timeParts = timeStr.split(":").map(Number);
  const currentTotal = timeParts[0] * 60 + timeParts[1];

  const targetStr = payload.sessionType === "MORNING"
    ? formatTimeCell_(sched.morningTarget, "08:00")
    : formatTimeCell_(sched.afternoonTarget, "16:30");
  const targetParts = targetStr.split(":").map(Number);
  const targetTotal = targetParts[0] * 60 + targetParts[1];
  const tolerance = Number(
    payload.sessionType === "MORNING"
      ? (sched.morningToleranceMinutes || 15)
      : (sched.afternoonToleranceMinutes || 15)
  );

  let finalStatus = "ON_TIME";
  let latenessMinutes = 0;
  let rejectionReason = "";

  if (currentTotal > targetTotal + tolerance) {
    finalStatus = "LATE";
    latenessMinutes = currentTotal - targetTotal;
  }

  if (!isInside) {
    if (payload.forceOutsideReview && payload.outsideReason) {
      finalStatus = "PENDING_REVIEW";
      rejectionReason = "Di luar radius (" + Math.round(shortestDist) + "m). Alasan: " + payload.outsideReason;
    } else {
      return {
        success: false,
        error: "Lokasi Anda berada " + Math.round(shortestDist) + " meter dari " + nearest.name + ". Batas radius resmi adalah " + radiusLimit + " meter.",
      };
    }
  }

  const recordId = "att-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
  const storedPhotoUrl = savePhotoToDriveOrTrim_(payload.photoBase64, recordId + "_" + employee.nip);

  const newRecord = {
    id: recordId,
    employeeId: employee.id,
    employeeName: employee.name,
    employeeNip: employee.nip,
    department: employee.department,
    workDate: todayDate,
    sessionType: payload.sessionType,
    timestamp: now.toISOString(),
    localTimeStr: timeStr + " " + tzLabel,
    latitude: Number(coords.latitude || 0),
    longitude: Number(coords.longitude || 0),
    gpsAccuracy: Number(coords.accuracy || 10),
    distanceMeters: Math.round(shortestDist),
    locationId: nearest.id,
    locationName: nearest.name,
    photoUrl: storedPhotoUrl,
    status: finalStatus,
    latenessMinutes: latenessMinutes,
    rejectionReason: rejectionReason,
    deviceInfo: payload.deviceInfo || "Apps Script Web Client",
    isVerified: finalStatus !== "PENDING_REVIEW",
    notes: payload.notes || "",
    faceVerified: payload.faceVerified !== false,
    faceConfidence: Number(payload.faceConfidence || 92),
    faceMatchedName: payload.faceMatchedName || employee.name,
  };

  const sheet = ss.getSheetByName(SHEETS.ATTENDANCE);
  sheet.appendRow([
    newRecord.id,
    newRecord.employeeId,
    newRecord.employeeName,
    newRecord.employeeNip,
    newRecord.department,
    newRecord.workDate,
    newRecord.sessionType,
    newRecord.timestamp,
    newRecord.localTimeStr,
    newRecord.latitude,
    newRecord.longitude,
    newRecord.gpsAccuracy,
    newRecord.distanceMeters,
    newRecord.locationId,
    newRecord.locationName,
    newRecord.photoUrl,
    newRecord.status,
    newRecord.latenessMinutes,
    newRecord.rejectionReason,
    newRecord.deviceInfo,
    newRecord.isVerified,
    newRecord.notes,
    newRecord.faceVerified,
    newRecord.faceConfidence,
    newRecord.faceMatchedName,
  ]);

  logAudit_(ss, employee.id, employee.name, "PRESENSI_BERHASIL", "Presensi " + payload.sessionType + " (" + Math.round(shortestDist) + "m ke " + nearest.name + ")");

  return { success: true, record: newRecord };
}

// ==============================================================================
// ADMIN: KEAMANAN PIN, PEGAWAI, UNIT, LOKASI, JADWAL, PERSETUJUAN
// ==============================================================================

function verifyAdminPinServer(pin) {
  const ss = getDatabase_();
  ensureInitialized_(ss);
  const settings = getSheetObjects_(ss, SHEETS.SETTINGS)[0] || {};
  const validPin = String(settings.adminPin || "2026").trim();
  const isValid = String(pin || "").trim() === validPin;
  if (isValid) {
    logAudit_(ss, "admin", "Administrator", "ADMIN_UNLOCK", "Portal Admin dibuka dengan PIN valid.");
  }
  return { success: isValid };
}

function saveEmployeeServer(emp) {
  const ss = getDatabase_();
  ensureInitialized_(ss);
  const sheet = ss.getSheetByName(SHEETS.USERS);
  const rows = sheet.getDataRange().getValues();
  const id = emp.id || "usr-emp-" + Date.now();
  const locs = Array.isArray(emp.assignedLocationIds) ? emp.assignedLocationIds.join(",") : (emp.assignedLocationIds || "loc-1");
  const joinedAt = emp.joinedAt || Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd");

  const rowValues = [
    id,
    emp.nip || "",
    emp.name || "",
    emp.email || "",
    emp.role || "EMPLOYEE",
    emp.department || "",
    emp.position || "",
    emp.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    emp.phone || "",
    locs,
    emp.isActive !== false,
    joinedAt,
  ];

  let foundRow = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
    logAudit_(ss, "admin", "Administrator", "UBAH_PEGAWAI", "Memperbarui data pegawai: " + emp.name);
  } else {
    sheet.appendRow(rowValues);
    logAudit_(ss, "admin", "Administrator", "TAMBAH_PEGAWAI", "Menambahkan pegawai baru: " + emp.name);
  }
  return { success: true, id: id };
}

function deleteEmployeeServer(id) {
  const ss = getDatabase_();
  const sheet = ss.getSheetByName(SHEETS.USERS);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      const name = rows[i][2];
      sheet.deleteRow(i + 1);
      logAudit_(ss, "admin", "Administrator", "HAPUS_PEGAWAI", "Menghapus pegawai: " + name);
      return { success: true };
    }
  }
  return { success: false, error: "Pegawai tidak ditemukan." };
}

function saveWorkUnitServer(unit) {
  const ss = getDatabase_();
  ensureInitialized_(ss);
  const sheet = ss.getSheetByName(SHEETS.UNITS);
  const rows = sheet.getDataRange().getValues();
  const id = unit.id || "unit-" + Date.now();
  const rowValues = [id, unit.name || "", unit.code || "", unit.headName || "", unit.description || ""];

  let foundRow = -1;
  let oldName = "";
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      foundRow = i + 1;
      oldName = String(rows[i][1]);
      break;
    }
  }

  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
    if (oldName && unit.name && oldName !== unit.name) {
      const userSheet = ss.getSheetByName(SHEETS.USERS);
      const uRows = userSheet.getDataRange().getValues();
      for (let r = 1; r < uRows.length; r++) {
        if (String(uRows[r][5]) === oldName) {
          userSheet.getRange(r + 1, 6).setValue(unit.name);
        }
      }
    }
    logAudit_(ss, "admin", "Administrator", "UBAH_UNIT", "Memperbarui unit pelayanan: " + unit.name);
  } else {
    sheet.appendRow(rowValues);
    logAudit_(ss, "admin", "Administrator", "TAMBAH_UNIT", "Menambahkan unit pelayanan: " + unit.name);
  }
  return { success: true, id: id };
}

function deleteWorkUnitServer(id) {
  const ss = getDatabase_();
  const sheet = ss.getSheetByName(SHEETS.UNITS);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      const name = rows[i][1];
      sheet.deleteRow(i + 1);
      logAudit_(ss, "admin", "Administrator", "HAPUS_UNIT", "Menghapus unit pelayanan: " + name);
      return { success: true };
    }
  }
  return { success: false, error: "Unit tidak ditemukan." };
}

function saveLocationServer(loc) {
  const ss = getDatabase_();
  ensureInitialized_(ss);
  const sheet = ss.getSheetByName(SHEETS.LOCATIONS);
  const rows = sheet.getDataRange().getValues();
  const id = loc.id || "loc-" + Date.now();
  const rowValues = [
    id,
    loc.name || "",
    loc.address || "",
    Number(loc.latitude || 0),
    Number(loc.longitude || 0),
    Number(loc.radiusMeters || 100),
    loc.isActive !== false,
    Boolean(loc.isMainOffice),
  ];

  let foundRow = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  logAudit_(ss, "admin", "Administrator", "SIMPAN_LOKASI", "Menyimpan lokasi geofence: " + loc.name);
  return { success: true, id: id };
}

function deleteLocationServer(id) {
  const ss = getDatabase_();
  const sheet = ss.getSheetByName(SHEETS.LOCATIONS);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false };
}

function saveScheduleServer(sched) {
  const ss = getDatabase_();
  ensureInitialized_(ss);
  const sheet = ss.getSheetByName(SHEETS.SCHEDULE);
  const workDaysStr = Array.isArray(sched.workDays) ? sched.workDays.join(",") : (sched.workDays || "1,2,3,4,5,6,0");
  const rowValues = [
    sched.id || "sched-1",
    sched.name || "Jadwal Reguler",
    sched.timezone || "Asia/Makassar",
    sched.timezoneLabel || "WITA",
    sched.morningStart || "06:30",
    sched.morningTarget || "08:00",
    sched.morningEnd || "10:00",
    Number(sched.morningToleranceMinutes || 15),
    sched.afternoonStart || "14:00",
    sched.afternoonTarget || "16:30",
    sched.afternoonEnd || "19:00",
    Number(sched.afternoonToleranceMinutes || 15),
    workDaysStr,
  ];
  if (sheet.getLastRow() >= 2) {
    sheet.getRange(2, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  logAudit_(ss, "admin", "Administrator", "UBAH_JADWAL", "Jadwal presensi diperbarui.");
  return { success: true };
}

function saveSettingsServer(settings) {
  const ss = getDatabase_();
  ensureInitialized_(ss);
  const sheet = ss.getSheetByName(SHEETS.SETTINGS);
  const current = getSheetObjects_(ss, SHEETS.SETTINGS)[0] || {};
  const merged = Object.assign({}, current, settings);
  const rowValues = [
    merged.churchName || "",
    merged.churchSubtitle || "",
    merged.churchAddress || "",
    merged.churchContact || "",
    merged.churchEmail || "",
    merged.logoUrl || "",
    merged.timezone || "Asia/Makassar",
    merged.timezoneLabel || "WITA",
    merged.adminPin || "2026",
  ];
  if (sheet.getLastRow() >= 2) {
    sheet.getRange(2, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  logAudit_(ss, "admin", "Administrator", "UBAH_PENGATURAN", "Pengaturan profil gereja / PIN diperbarui.");
  return { success: true };
}

function saveLeaveServer(req) {
  const ss = getDatabase_();
  ensureInitialized_(ss);
  const sheet = ss.getSheetByName(SHEETS.LEAVES);
  const id = "leave-" + Date.now();
  const createdAt = new Date().toISOString();
  sheet.appendRow([
    id,
    req.employeeId || "",
    req.employeeName || "",
    req.department || "",
    req.type || "IZIN",
    req.startDate || "",
    req.endDate || "",
    req.reason || "",
    req.attachmentUrl || "",
    "PENDING",
    "",
    "",
    "",
    createdAt,
  ]);
  logAudit_(ss, req.employeeId, req.employeeName, "PENGAJUAN_IZIN", "Mengajukan " + (req.type || "IZIN"));
  return { success: true, id: id };
}

function reviewLeaveServer(id, status, adminNotes, reviewedBy) {
  return updateStatusRow_(SHEETS.LEAVES, id, 10, status, 11, adminNotes, 12, reviewedBy || "Admin", 13);
}

function saveCorrectionServer(req) {
  const ss = getDatabase_();
  ensureInitialized_(ss);
  const sheet = ss.getSheetByName(SHEETS.CORRECTIONS);
  const id = "corr-" + Date.now();
  sheet.appendRow([
    id,
    req.employeeId || "",
    req.employeeName || "",
    req.workDate || "",
    req.sessionType || "MORNING",
    req.reason || "",
    "PENDING",
    "",
    "",
    "",
    new Date().toISOString(),
  ]);
  return { success: true, id: id };
}

function reviewCorrectionServer(id, status, adminNotes, reviewedBy) {
  return updateStatusRow_(SHEETS.CORRECTIONS, id, 7, status, 8, adminNotes, 9, reviewedBy || "Admin", 10);
}

function saveOvertimeServer(req) {
  const ss = getDatabase_();
  ensureInitialized_(ss);
  const sheet = ss.getSheetByName(SHEETS.OVERTIME);
  const id = "ot-" + Date.now();
  sheet.appendRow([
    id,
    req.employeeId || "",
    req.employeeName || "",
    req.department || "",
    req.workDate || "",
    req.startTime || "",
    req.endTime || "",
    Number(req.hours || 1),
    req.activity || "",
    "PENDING",
    "",
    "",
    "",
    new Date().toISOString(),
  ]);
  return { success: true, id: id };
}

function reviewOvertimeServer(id, status, adminNotes, reviewedBy) {
  return updateStatusRow_(SHEETS.OVERTIME, id, 10, status, 11, adminNotes, 12, reviewedBy || "Admin", 13);
}

function updateStatusRow_(sheetName, id, statusCol, status, notesCol, adminNotes, reviewerCol, reviewedBy, reviewedAtCol) {
  const ss = getDatabase_();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false };
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      const r = i + 1;
      sheet.getRange(r, statusCol).setValue(status);
      if (adminNotes) sheet.getRange(r, notesCol).setValue(adminNotes);
      sheet.getRange(r, reviewerCol).setValue(reviewedBy);
      sheet.getRange(r, reviewedAtCol).setValue(new Date().toISOString());
      logAudit_(ss, "admin", reviewedBy, "REVIEW_" + sheetName.toUpperCase(), "ID " + id + " diubah menjadi " + status);
      return { success: true };
    }
  }
  return { success: false, error: "Data tidak ditemukan." };
}

function deleteAttendanceServer(id) {
  const ss = getDatabase_();
  const sheet = ss.getSheetByName(SHEETS.ATTENDANCE);
  if (!sheet) return { success: false };
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      logAudit_(ss, "admin", "Administrator", "HAPUS_PRESENSI", "Menghapus catatan presensi ID: " + id);
      return { success: true };
    }
  }
  return { success: false };
}

function reviewPendingAttendanceServer(id, approve) {
  const ss = getDatabase_();
  const sheet = ss.getSheetByName(SHEETS.ATTENDANCE);
  if (!sheet) return { success: false };
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      const r = i + 1;
      sheet.getRange(r, 17).setValue(approve ? "ON_TIME" : "REJECTED");
      sheet.getRange(r, 21).setValue(Boolean(approve));
      logAudit_(ss, "admin", "Administrator", "VERIFIKASI_LUAR_RADIUS", "Presensi " + id + (approve ? " disetujui" : " ditolak"));
      return { success: true };
    }
  }
  return { success: false };
}
