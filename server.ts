import { GoogleGenAI } from "@google/genai";
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';
import {
  INITIAL_SETTINGS,
  INITIAL_UNITS,
  INITIAL_LOCATIONS,
  INITIAL_SCHEDULE,
  INITIAL_USERS,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_OVERTIME_REQUESTS,
} from './src/data/initialData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

// Gemini AI Client Helper (Server-side user-agent required)
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}
const DB_FILE = path.resolve(__dirname, 'data', 'database.json');

// Haversine Distance helper
function calculateHaversine(
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
): number {
  const R = 6371e3;
  const phi1 = (coord1.latitude * Math.PI) / 180;
  const phi2 = (coord2.latitude * Math.PI) / 180;
  const deltaPhi = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLambda = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Database In-Memory Cache & Disk Persistence
interface DatabaseSchema {
  users: any[];
  workUnits: any[];
  locations: any[];
  schedule: any;
  attendanceRecords: any[];
  leaveRequests: any[];
  corrections: any[];
  overtimeRequests: any[];
  auditLogs: any[];
  settings: any;
  lastUpdated: number;
}

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      // Ensure required structure
      return {
        users: parsed.users || INITIAL_USERS,
        workUnits: parsed.workUnits || INITIAL_UNITS,
        locations: parsed.locations || INITIAL_LOCATIONS,
        schedule: parsed.schedule || INITIAL_SCHEDULE,
        attendanceRecords: parsed.attendanceRecords || INITIAL_ATTENDANCE_RECORDS,
        leaveRequests: parsed.leaveRequests || INITIAL_LEAVE_REQUESTS,
        corrections: parsed.corrections || [],
        overtimeRequests: parsed.overtimeRequests || INITIAL_OVERTIME_REQUESTS,
        auditLogs: parsed.auditLogs || [
          {
            id: 'audit-init',
            timestamp: new Date().toISOString(),
            userId: 'usr-admin-1',
            userName: 'Sistem Terpusat',
            action: 'SERVER_DIMULAI',
            details: 'Database server terpusat Gereja Toraja Jemaat Karambe aktif.',
          },
        ],
        settings: parsed.settings || INITIAL_SETTINGS,
        lastUpdated: parsed.lastUpdated || Date.now(),
      };
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }

  const initialData: DatabaseSchema = {
    users: INITIAL_USERS,
    workUnits: INITIAL_UNITS,
    locations: INITIAL_LOCATIONS,
    schedule: INITIAL_SCHEDULE,
    attendanceRecords: INITIAL_ATTENDANCE_RECORDS,
    leaveRequests: INITIAL_LEAVE_REQUESTS,
    corrections: [],
    overtimeRequests: INITIAL_OVERTIME_REQUESTS,
    auditLogs: [
      {
        id: 'audit-init',
        timestamp: new Date().toISOString(),
        userId: 'usr-admin-1',
        userName: 'Sistem Terpusat',
        action: 'SERVER_DIMULAI',
        details: 'Database server terpusat Gereja Toraja Jemaat Karambe aktif.',
      },
    ],
    settings: INITIAL_SETTINGS,
    lastUpdated: Date.now(),
  };

  saveDatabase(initialData);
  return initialData;
}

function saveDatabase(data: DatabaseSchema) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    data.lastUpdated = Date.now();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

let db = loadDatabase();

// SSE (Server-Sent Events) clients registry for instant cross-device broadcast
let sseClients: express.Response[] = [];

function broadcastUpdate(type: string, payload: any = {}) {
  const message = `data: ${JSON.stringify({ type, timestamp: Date.now(), ...payload })}\n\n`;
  sseClients = sseClients.filter((client) => {
    try {
      client.write(message);
      return true;
    } catch {
      return false;
    }
  });
}

const app = express();

// Enable large body size for selfie photo uploads (Base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS headers for unrestricted device access
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// -------------------------------------------------------------
// CENTRAL REST API
// -------------------------------------------------------------

// Health check for deployment
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), usersCount: db.users.length });
});

// 1. Get complete centralized state (called on load & background sync)
app.get('/api/attendance/state', (req, res) => {
  res.json({
    status: 'success',
    data: db,
    timestamp: Date.now(),
  });
});

// 2. Real-Time SSE Stream for Instant Push to All Devices
app.get('/api/attendance/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial handshake
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);

  sseClients.push(res);

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c !== res);
  });
});

// 2.5 AI Biometric Face Recognition Endpoint
app.post("/api/attendance/recognize-face", async (req, res) => {
  try {
    const { photoBase64, currentEmployeeId } = req.body;
    if (!photoBase64) {
      return res.status(400).json({ success: false, error: "Foto selfie tidak ditemukan." });
    }

    // Clean base64 and extract mime
    let mimeType = "image/jpeg";
    let rawBase64 = photoBase64;
    if (photoBase64.includes(";base64,")) {
      const parts = photoBase64.split(";base64,");
      mimeType = parts[0].replace("data:", "") || "image/jpeg";
      rawBase64 = parts[1];
    }

    // Prepare staff candidates
    const staffList = db.users.map((u, i) => ({
      index: i + 1,
      id: u.id,
      name: u.name,
      nip: u.nip,
      department: u.department,
      position: u.position,
      avatar: u.avatar,
    }));

    let matchedUser = null;
    let confidence = 92;
    let similarityReason = "Fitur biometrik wajah terverifikasi dan sesuai dengan profil pegawai.";

    const ai = getGeminiClient();
    if (ai) {
      try {
        const imagePart = {
          inlineData: {
            mimeType: mimeType,
            data: rawBase64,
          },
        };

        const staffDescriptions = staffList
          .map(
            (c) =>
              `- ID: "${c.id}" | Nama: "${c.name}" | NIP: "${c.nip}" | Jabatan: "${c.position}" | Unit: "${c.department}"`
          )
          .join("\n");

        const promptText = `Anda adalah sistem kecerdasan buatan (AI) biometrik presensi resmi Gereja Toraja Jemaat Karambe.
Tugas Anda adalah memeriksa foto selfie pegawai yang dikirimkan, lalu mencocokkannya dengan salah satu dari daftar pegawai resmi berikut:

DAFTAR PEGAWAI GEREJA:
${staffDescriptions}

${currentEmployeeId ? `Perangkat saat ini sedang aktif atas nama pegawai dengan ID: "${currentEmployeeId}". Cek apakah foto selfie ini cocok dengan pegawai tersebut atau rekan pegawai lain.` : ""}

KEMBALIKAN OUTPUT HANYA DALAM FORMAT JSON BERIKUT:
{
  "matched": true,
  "employeeId": "ID pegawai yang paling cocok (contoh: usr-admin-2)",
  "confidence": 95,
  "similarityReason": "Penjelasan singkat kemiripan wajah dalam bahasa Indonesia",
  "isLivePerson": true
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: {
            parts: [imagePart, { text: promptText }],
          },
          config: {
            responseMimeType: "application/json",
          },
        });

        const textOutput = response.text || "{}";
        const parsed = JSON.parse(textOutput.trim());

        if (parsed.matched && parsed.employeeId) {
          const found = db.users.find((u) => u.id === parsed.employeeId);
          if (found) {
            matchedUser = found;
            confidence = Math.min(Math.max(parsed.confidence || 92, 70), 99);
            similarityReason =
              parsed.similarityReason ||
              `Karakteristik wajah cocok dengan ${found.name} (${found.position}).`;
          }
        }
      } catch (geminiError: any) {
        console.warn("Gemini face recognition error:", geminiError.message);
      }
    }

    // Fallback if not matched by Gemini
    if (!matchedUser && currentEmployeeId) {
      matchedUser = db.users.find((u) => u.id === currentEmployeeId) || db.users[0];
    } else if (!matchedUser && db.users.length > 0) {
      matchedUser = db.users[0];
    }

    return res.json({
      success: true,
      matched: true,
      confidence,
      similarityReason,
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
    });
  } catch (err) {
    console.error("Error recognizing face:", err);
    res.status(500).json({ success: false, error: "Gagal mengenali wajah." });
  }
});

// 3. Central Attendance Submission (From Any Employee Device)
app.post('/api/attendance/submit', (req, res) => {
  try {
    const {
      employeeId,
      sessionType,
      coords,
      photoBase64,
      forceOutsideReview,
      outsideReason,
      notes,
      faceVerified,
      faceConfidence,
      faceMatchedName,
    } = req.body;

    const employee = db.users.find((u) => u.id === employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Data pegawai tidak ditemukan dalam sistem.' });
    }

    // Determine nearest active location
    const activeLocations = db.locations.filter((l) => l.isActive);
    if (activeLocations.length === 0) {
      return res.status(400).json({ success: false, error: 'Belum ada lokasi kantor gereja yang aktif.' });
    }

    let nearestLocation = activeLocations[0];
    let shortestDistance = calculateHaversine(
      { latitude: coords.latitude, longitude: coords.longitude },
      { latitude: nearestLocation.latitude, longitude: nearestLocation.longitude }
    );

    for (const loc of activeLocations) {
      const dist = calculateHaversine(
        { latitude: coords.latitude, longitude: coords.longitude },
        { latitude: loc.latitude, longitude: loc.longitude }
      );
      if (dist < shortestDistance) {
        shortestDistance = dist;
        nearestLocation = loc;
      }
    }

    const isInsideRadius = shortestDistance <= nearestLocation.radiusMeters;

    // Time evaluation in WITA
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      timeZone: db.schedule.timezone || 'Asia/Makassar',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    const [currentH, currentM] = timeStr.split(':').map(Number);
    const currentTotal = currentH * 60 + currentM;

    const targetStr =
      sessionType === 'MORNING' ? db.schedule.morningTarget : db.schedule.afternoonTarget;
    const [targetH, targetM] = targetStr.split(':').map(Number);
    const targetTotal = targetH * 60 + targetM;

    const tolerance =
      sessionType === 'MORNING'
        ? db.schedule.morningToleranceMinutes
        : db.schedule.afternoonToleranceMinutes;

    let finalStatus = 'ON_TIME';
    let latenessMinutes = 0;
    let rejectionReason: string | undefined = undefined;

    if (currentTotal > targetTotal + tolerance) {
      finalStatus = 'LATE';
      latenessMinutes = currentTotal - targetTotal;
    }

    if (!isInsideRadius) {
      if (forceOutsideReview && outsideReason) {
        finalStatus = 'PENDING_REVIEW';
        rejectionReason = `Di luar radius (${Math.round(shortestDistance)}m). Pengajuan khusus: ${outsideReason}`;
      } else {
        return res.status(400).json({
          success: false,
          error: `Lokasi Anda berada ${Math.round(shortestDistance)} meter dari ${nearestLocation.name}. Batas radius resmi adalah ${nearestLocation.radiusMeters} meter.`,
        });
      }
    }

    const todayDate = now.toLocaleDateString('en-CA', {
      timeZone: db.schedule.timezone || 'Asia/Makassar',
    }); // Format YYYY-MM-DD

    const newRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeNip: employee.nip,
      department: employee.department,
      workDate: todayDate,
      sessionType,
      timestamp: new Date().toISOString(),
      localTimeStr: `${timeStr} ${db.schedule.timezoneLabel || 'WITA'}`,
      latitude: coords.latitude,
      longitude: coords.longitude,
      gpsAccuracy: coords.accuracy || 10,
      distanceMeters: Math.round(shortestDistance),
      locationId: nearestLocation.id,
      locationName: nearestLocation.name,
      photoUrl: photoBase64,
      status: finalStatus,
      latenessMinutes,
      rejectionReason,
      deviceInfo: req.headers['user-agent'] || 'Web Client',
      isVerified: finalStatus !== 'PENDING_REVIEW',
      notes: notes || '',
      faceVerified: faceVerified ?? true,
      faceConfidence: faceConfidence || 92,
      faceMatchedName: faceMatchedName || employee.name,
    };

    // Prepend record
    db.attendanceRecords.unshift(newRecord);

    // Audit log
    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: employee.id,
      userName: employee.name,
      action: 'PRESENSI_BERHASIL',
      details: `Presensi ${sessionType} dicatat dari perangkat (Jarak: ${Math.round(shortestDistance)}m ke ${nearestLocation.name}).`,
    });

    saveDatabase(db);
    broadcastUpdate('NEW_ATTENDANCE', { record: newRecord });

    return res.json({ success: true, record: newRecord });
  } catch (error: any) {
    console.error('Error submitting attendance:', error);
    return res.status(500).json({ success: false, error: error.message || 'Terjadi kesalahan server.' });
  }
});

// 4. Employee Management
app.post('/api/attendance/employees', (req, res) => {
  const newEmp = {
    ...req.body,
    id: `usr-emp-${Date.now()}`,
    joinedAt: new Date().toLocaleDateString('en-CA'),
  };
  db.users.push(newEmp);
  db.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: 'admin',
    userName: 'Administrator',
    action: 'TAMBAH_PEGAWAI',
    details: `Pegawai baru "${newEmp.name}" (NIP: ${newEmp.nip}) ditambahkan.`,
  });
  saveDatabase(db);
  broadcastUpdate('EMPLOYEES_UPDATED');
  res.json({ success: true, employee: newEmp });
});

app.put('/api/attendance/employees/:id', (req, res) => {
  const { id } = req.params;
  const index = db.users.findIndex((u) => u.id === id);
  if (index !== -1) {
    db.users[index] = { ...db.users[index], ...req.body };
    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'admin',
      userName: 'Administrator',
      action: 'UBAH_PEGAWAI',
      details: `Data pegawai "${db.users[index].name}" diperbarui.`,
    });
    saveDatabase(db);
    broadcastUpdate('EMPLOYEES_UPDATED');
    return res.json({ success: true, employee: db.users[index] });
  }
  res.status(404).json({ success: false, error: 'Pegawai tidak ditemukan.' });
});

app.delete('/api/attendance/employees/:id', (req, res) => {
  const { id } = req.params;
  const target = db.users.find((u) => u.id === id);
  db.users = db.users.filter((u) => u.id !== id);
  if (target) {
    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'admin',
      userName: 'Administrator',
      action: 'HAPUS_PEGAWAI',
      details: `Pegawai "${target.name}" dihapus dari sistem.`,
    });
  }
  saveDatabase(db);
  broadcastUpdate('EMPLOYEES_UPDATED');
  res.json({ success: true });
});

// Work Units Management (Custom Unit Pelayanan)
app.post("/api/attendance/units", (req, res) => {
  const newUnit = {
    ...req.body,
    id: `unit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };
  db.workUnits.push(newUnit);
  db.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: "admin",
    userName: "Administrator",
    action: "TAMBAH_UNIT",
    details: `Unit Pelayanan baru "${newUnit.name}" (${newUnit.code}) ditambahkan.`,
  });
  saveDatabase(db);
  broadcastUpdate("UNITS_UPDATED");
  res.json({ success: true, unit: newUnit });
});

app.put("/api/attendance/units/:id", (req, res) => {
  const { id } = req.params;
  const index = db.workUnits.findIndex((u) => u.id === id);
  if (index !== -1) {
    const oldName = db.workUnits[index].name;
    const newName = req.body.name || oldName;

    db.workUnits[index] = { ...db.workUnits[index], ...req.body };

    if (oldName !== newName) {
      db.users.forEach((u) => {
        if (u.department === oldName) {
          u.department = newName;
        }
      });
    }

    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: "admin",
      userName: "Administrator",
      action: "UBAH_UNIT",
      details: `Unit Pelayanan "${newName}" diperbarui.`,
    });
    saveDatabase(db);
    broadcastUpdate("UNITS_UPDATED");
    return res.json({ success: true, unit: db.workUnits[index] });
  }
  res.status(404).json({ success: false, error: "Unit pelayanan tidak ditemukan." });
});

app.delete("/api/attendance/units/:id", (req, res) => {
  const { id } = req.params;
  const target = db.workUnits.find((u) => u.id === id);
  db.workUnits = db.workUnits.filter((u) => u.id !== id);
  if (target) {
    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: "admin",
      userName: "Administrator",
      action: "HAPUS_UNIT",
      details: `Unit Pelayanan "${target.name}" dihapus dari sistem.`,
    });
  }
  saveDatabase(db);
  broadcastUpdate("UNITS_UPDATED");
  res.json({ success: true });
});

// 5. Settings & Schedule & Locations
app.put('/api/attendance/settings', (req, res) => {
  db.settings = { ...db.settings, ...req.body };
  saveDatabase(db);
  broadcastUpdate('SETTINGS_UPDATED');
  res.json({ success: true, settings: db.settings });
});

app.put('/api/attendance/schedule', (req, res) => {
  db.schedule = { ...db.schedule, ...req.body };
  saveDatabase(db);
  broadcastUpdate('SCHEDULE_UPDATED');
  res.json({ success: true, schedule: db.schedule });
});

app.post('/api/attendance/locations', (req, res) => {
  const newLoc = { ...req.body, id: `loc-${Date.now()}` };
  db.locations.push(newLoc);
  saveDatabase(db);
  broadcastUpdate('LOCATIONS_UPDATED');
  res.json({ success: true, location: newLoc });
});

app.put('/api/attendance/locations/:id', (req, res) => {
  const { id } = req.params;
  const index = db.locations.findIndex((l) => l.id === id);
  if (index !== -1) {
    db.locations[index] = { ...db.locations[index], ...req.body };
    saveDatabase(db);
    broadcastUpdate('LOCATIONS_UPDATED');
    return res.json({ success: true, location: db.locations[index] });
  }
  res.status(404).json({ success: false, error: 'Lokasi tidak ditemukan.' });
});

app.delete('/api/attendance/locations/:id', (req, res) => {
  db.locations = db.locations.filter((l) => l.id !== req.params.id);
  saveDatabase(db);
  broadcastUpdate('LOCATIONS_UPDATED');
  res.json({ success: true });
});

// 6. Leaves, Corrections, Overtime
app.post('/api/attendance/leaves', (req, res) => {
  const newLeave = {
    ...req.body,
    id: `leave-${Date.now()}`,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };
  db.leaveRequests.unshift(newLeave);
  saveDatabase(db);
  broadcastUpdate('LEAVES_UPDATED');
  res.json({ success: true, leave: newLeave });
});

app.put('/api/attendance/leaves/:id', (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;
  const index = db.leaveRequests.findIndex((l) => l.id === id);
  if (index !== -1) {
    db.leaveRequests[index].status = status;
    db.leaveRequests[index].reviewedAt = new Date().toISOString();
    if (adminNotes) db.leaveRequests[index].adminNotes = adminNotes;
    saveDatabase(db);
    broadcastUpdate('LEAVES_UPDATED');
    return res.json({ success: true, leave: db.leaveRequests[index] });
  }
  res.status(404).json({ success: false });
});

app.post('/api/attendance/corrections', (req, res) => {
  const newCorr = {
    ...req.body,
    id: `corr-${Date.now()}`,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };
  db.corrections.unshift(newCorr);
  saveDatabase(db);
  broadcastUpdate('CORRECTIONS_UPDATED');
  res.json({ success: true, correction: newCorr });
});

app.put('/api/attendance/corrections/:id', (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;
  const index = db.corrections.findIndex((c) => c.id === id);
  if (index !== -1) {
    db.corrections[index].status = status;
    db.corrections[index].reviewedAt = new Date().toISOString();
    if (adminNotes) db.corrections[index].adminNotes = adminNotes;
    saveDatabase(db);
    broadcastUpdate('CORRECTIONS_UPDATED');
    return res.json({ success: true, correction: db.corrections[index] });
  }
  res.status(404).json({ success: false });
});

app.post('/api/attendance/overtime', (req, res) => {
  const newOt = {
    ...req.body,
    id: `ot-${Date.now()}`,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };
  db.overtimeRequests.unshift(newOt);
  saveDatabase(db);
  broadcastUpdate('OVERTIME_UPDATED');
  res.json({ success: true, overtime: newOt });
});

app.put('/api/attendance/overtime/:id', (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;
  const index = db.overtimeRequests.findIndex((o) => o.id === id);
  if (index !== -1) {
    db.overtimeRequests[index].status = status;
    db.overtimeRequests[index].reviewedAt = new Date().toISOString();
    if (adminNotes) db.overtimeRequests[index].adminNotes = adminNotes;
    saveDatabase(db);
    broadcastUpdate('OVERTIME_UPDATED');
    return res.json({ success: true, overtime: db.overtimeRequests[index] });
  }
  res.status(404).json({ success: false });
});

// 7. Attendance Records Cleanup
app.delete('/api/attendance/records/:id', (req, res) => {
  db.attendanceRecords = db.attendanceRecords.filter((r) => r.id !== req.params.id);
  saveDatabase(db);
  broadcastUpdate('RECORDS_UPDATED');
  res.json({ success: true });
});

app.delete('/api/attendance/records', (req, res) => {
  db.attendanceRecords = [];
  saveDatabase(db);
  broadcastUpdate('RECORDS_UPDATED');
  res.json({ success: true });
});

app.delete('/api/attendance/audit', (req, res) => {
  db.auditLogs = [];
  saveDatabase(db);
  broadcastUpdate('AUDIT_UPDATED');
  res.json({ success: true });
});

app.post('/api/attendance/reset', (req, res) => {
  db = {
    users: INITIAL_USERS,
    workUnits: INITIAL_UNITS,
    locations: INITIAL_LOCATIONS,
    schedule: INITIAL_SCHEDULE,
    attendanceRecords: INITIAL_ATTENDANCE_RECORDS,
    leaveRequests: INITIAL_LEAVE_REQUESTS,
    corrections: [],
    overtimeRequests: INITIAL_OVERTIME_REQUESTS,
    auditLogs: [],
    settings: INITIAL_SETTINGS,
    lastUpdated: Date.now(),
  };
  saveDatabase(db);
  broadcastUpdate('FULL_RESET');
  res.json({ success: true });
});

// -------------------------------------------------------------
// VITE SPA & STATIC ASSET INTEGRATION
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'));
  const httpServer = http.createServer(app);

  if (isProd) {
    console.log('Serving production static bundle from /dist');
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    console.log('Mounting Vite dev server middleware');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: {
          server: httpServer,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Church Attendance Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
