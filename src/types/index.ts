export type UserRole = 'SUPER_ADMIN' | 'CHURCH_ADMIN' | 'UNIT_HEAD' | 'EMPLOYEE';

export interface UserProfile {
  id: string;
  nip: string; // Nomor Induk Pegawai Gereja
  name: string;
  email: string;
  role: UserRole;
  department: string;
  position: string;
  avatar: string;
  phone: string;
  assignedLocationIds: string[]; // ID lokasi yang diizinkan
  isActive: boolean;
  joinedAt: string;
}

export interface WorkUnit {
  id: string;
  name: string;
  code: string;
  headName: string;
  description: string;
}

export interface AttendanceLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number; // radius validasi geofence (contoh: 100m)
  isActive: boolean;
  isMainOffice?: boolean;
}

export type TimezoneOption = 'Asia/Makassar' | 'Asia/Jakarta' | 'Asia/Jayapura';
export type TimezoneLabel = 'WITA' | 'WIB' | 'WIT';

export interface AttendanceSchedule {
  id: string;
  name: string;
  timezone: TimezoneOption;
  timezoneLabel: TimezoneLabel;
  // Sesi Pagi
  morningStart: string; // "07:00"
  morningTarget: string; // "08:00" batas jam masuk normal
  morningEnd: string; // "10:00" batas akhir presensi pagi
  morningToleranceMinutes: number; // 15 menit toleransi
  // Sesi Siang / Sore
  afternoonStart: string; // "14:00"
  afternoonTarget: string; // "16:30" atau "17:00" jam selesai kerja
  afternoonEnd: string; // "19:00" batas akhir presensi sore
  afternoonToleranceMinutes: number; // 15 menit toleransi
  workDays: number[]; // 1: Sen, 2: Sel, 3: Rab, 4: Kam, 5: Jum, 6: Sab, 0: Min
}

export type SessionType = 'MORNING' | 'AFTERNOON';

export type AttendanceStatus =
  | 'ON_TIME'
  | 'LATE'
  | 'OUTSIDE_RADIUS'
  | 'PENDING_REVIEW'
  | 'REJECTED';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNip: string;
  department: string;
  workDate: string; // "YYYY-MM-DD"
  sessionType: SessionType;
  timestamp: string; // UTC ISO string
  localTimeStr: string; // "07:54:12 WITA"
  latitude: number;
  longitude: number;
  gpsAccuracy: number; // meter
  distanceMeters: number; // jarak dari titik pusat lokasi dalam meter
  locationId: string;
  locationName: string;
  photoUrl: string; // base64 selfie data
  status: AttendanceStatus;
  latenessMinutes?: number;
  rejectionReason?: string;
  deviceInfo: string;
  isVerified: boolean;
  verifiedBy?: string;
  notes?: string;
}

export type LeaveType = 'SAKIT' | 'IZIN' | 'CUTI' | 'TUGAS_LUAR';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  attachmentUrl?: string;
  status: LeaveStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface AttendanceCorrection {
  id: string;
  employeeId: string;
  employeeName: string;
  workDate: string;
  sessionType: SessionType;
  reason: string;
  evidenceUrl?: string;
  status: LeaveStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export type OvertimeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface OvertimeRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  workDate: string;
  startTime: string; // e.g. "17:00"
  endTime: string; // e.g. "20:00"
  durationHours: number; // e.g. 3.0
  reason: string;
  status: OvertimeStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  ipAddress?: string;
}

export interface AppSettings {
  churchName: string;
  churchSubtitle: string;
  churchAddress: string;
  churchContact: string;
  churchEmail: string;
  logoUrl?: string;
  appUrl: string; // Default host URL
  timezone: TimezoneOption;
  timezoneLabel: TimezoneLabel;
  adminPin?: string; // Secure PIN for accessing Admin Portal
}
