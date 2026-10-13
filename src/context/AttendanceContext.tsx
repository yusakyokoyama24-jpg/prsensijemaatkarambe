import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AppSettings,
  AttendanceCorrection,
  AttendanceLocation,
  AttendanceRecord,
  AttendanceSchedule,
  AttendanceStatus,
  AuditLog,
  LeaveRequest,
  OvertimeRequest,
  SessionType,
  UserProfile,
  WorkUnit,
} from '../types';
import {
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_LOCATIONS,
  INITIAL_OVERTIME_REQUESTS,
  INITIAL_SCHEDULE,
  INITIAL_SETTINGS,
  INITIAL_UNITS,
  INITIAL_USERS,
} from '../data/initialData';
import { calculateHaversineDistance } from '../utils/geo';
import {
  evaluateAttendanceTime,
  getCurrentDateStr,
  getCurrentTimeStr,
} from '../utils/time';

interface SubmitAttendancePayload {
  employeeId: string;
  sessionType: SessionType;
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  photoBase64: string;
  locationId?: string;
  notes?: string;
  forceOutsideReview?: boolean;
  outsideReason?: string;
}

interface AttendanceContextType {
  currentUser: UserProfile | null;
  activePortal: 'EMPLOYEE' | 'ADMIN';
  users: UserProfile[];
  workUnits: WorkUnit[];
  locations: AttendanceLocation[];
  schedule: AttendanceSchedule;
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  corrections: AttendanceCorrection[];
  overtimeRequests: OvertimeRequest[];
  auditLogs: AuditLog[];
  settings: AppSettings;

  // Portal & Auth actions
  login: (userId: string) => void;
  loginByNip: (nipOrEmail: string) => boolean;
  logout: () => void;
  setActivePortal: (portal: 'EMPLOYEE' | 'ADMIN') => void;

  // Attendance actions
  submitAttendance: (
    payload: SubmitAttendancePayload
  ) => Promise<{ success: boolean; record?: AttendanceRecord; error?: string }>;
  getTodayRecord: (
    employeeId: string,
    session: SessionType
  ) => AttendanceRecord | undefined;

  // Admin management actions
  addEmployee: (employee: Omit<UserProfile, 'id' | 'joinedAt'>) => void;
  updateEmployee: (id: string, updates: Partial<UserProfile>) => void;
  deleteEmployee: (id: string) => void;

  addLocation: (loc: Omit<AttendanceLocation, 'id'>) => void;
  updateLocation: (id: string, updates: Partial<AttendanceLocation>) => void;
  deleteLocation: (id: string) => void;

  updateSchedule: (schedule: AttendanceSchedule) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Leave, Correction & Overtime
  createLeaveRequest: (
    req: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>
  ) => void;
  reviewLeaveRequest: (
    id: string,
    status: 'APPROVED' | 'REJECTED',
    adminNotes?: string
  ) => void;
  createCorrection: (
    req: Omit<AttendanceCorrection, 'id' | 'status' | 'createdAt'>
  ) => void;
  reviewCorrection: (
    id: string,
    status: 'APPROVED' | 'REJECTED',
    adminNotes?: string
  ) => void;
  createOvertimeRequest: (
    req: Omit<OvertimeRequest, 'id' | 'status' | 'createdAt'>
  ) => void;
  reviewOvertimeRequest: (
    id: string,
    status: 'APPROVED' | 'REJECTED',
    adminNotes?: string
  ) => void;

  deleteAttendanceRecord: (id: string) => void;
  deleteAttendanceRecordsByDate: (date: string) => void;
  clearAttendanceRecords: () => void;
  clearAuditLogs: () => void;
  resetToDefaultData: () => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'church_attendance_state_v2';

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Load state from local storage or defaults
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_users`);
    if (saved) {
      const parsed: UserProfile[] = JSON.parse(saved);
      const hasYusak = parsed.some((u) => u.name?.includes('Yusak') || u.id === 'usr-admin-yusak');
      const hasPMG = parsed.some((u) => u.department?.includes('PMG'));
      const hasKbid = parsed.some((u) => u.department?.includes('Ketua Bidang'));
      if (!hasYusak || !hasPMG || !hasKbid) {
        const missing = INITIAL_USERS.filter((init) => !parsed.some((p) => p.id === init.id));
        return [...parsed, ...missing];
      }
      return parsed;
    }
    return INITIAL_USERS;
  });

  const [workUnits, setWorkUnits] = useState<WorkUnit[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_units`);
    if (saved) {
      const parsed: WorkUnit[] = JSON.parse(saved);
      const hasPMG = parsed.some((u) => u.name?.includes('PMG'));
      const hasKbid = parsed.some((u) => u.name?.includes('Ketua Bidang'));
      if (!hasPMG || !hasKbid) {
        const missing = INITIAL_UNITS.filter(
          (init) => !parsed.some((p) => p.name === init.name || p.code === init.code)
        );
        return [...missing, ...parsed];
      }
      return parsed;
    }
    return INITIAL_UNITS;
  });

  const [locations, setLocations] = useState<AttendanceLocation[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_locs`);
    return saved ? JSON.parse(saved) : INITIAL_LOCATIONS;
  });

  const [schedule, setSchedule] = useState<AttendanceSchedule>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_sched`);
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULE;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(
    () => {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_records`);
      return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE_RECORDS;
    }
  );

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_leaves`);
    return saved ? JSON.parse(saved) : INITIAL_LEAVE_REQUESTS;
  });

  const [corrections, setCorrections] = useState<AttendanceCorrection[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_corrections`);
    return saved ? JSON.parse(saved) : [];
  });

  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_overtime`);
    return saved ? JSON.parse(saved) : INITIAL_OVERTIME_REQUESTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_audit`);
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'audit-init',
            timestamp: new Date().toISOString(),
            userId: 'usr-admin-1',
            userName: 'Pdt. Markus Sampe, M.Th',
            action: 'SISTEM_DIMULAI',
            details: 'Sistem Presensi Pegawai Gereja siap digunakan.',
          },
        ];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_settings`);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure appUrl matches window.location.origin
      if (typeof window !== 'undefined' && (!parsed.appUrl || parsed.appUrl.includes('localhost'))) {
        parsed.appUrl = window.location.origin;
      }
      if (
        parsed.churchName &&
        (parsed.churchName.includes('RANTEPAO') || parsed.churchName.includes('KARAMBO'))
      ) {
        parsed.churchName = INITIAL_SETTINGS.churchName;
        parsed.churchSubtitle = INITIAL_SETTINGS.churchSubtitle;
        parsed.churchAddress = INITIAL_SETTINGS.churchAddress;
      }
      if (!parsed.logoUrl) {
        parsed.logoUrl = INITIAL_SETTINGS.logoUrl;
      }
      return parsed;
    }
    const initial = { ...INITIAL_SETTINGS };
    if (typeof window !== 'undefined') {
      initial.appUrl = window.location.origin;
    }
    return initial;
  });

  // Current logged in user (default to Yusak Yokoyama as admin)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return users.find((u) => u.id === 'usr-admin-yusak' || u.name?.includes('Yusak')) || users.find((u) => u.role === 'SUPER_ADMIN') || users[0] || null;
  });

  // Active portal view ('EMPLOYEE' or 'ADMIN') - default to ADMIN for Yusak Yokoyama
  const [activePortal, setActivePortal] = useState<'EMPLOYEE' | 'ADMIN'>('ADMIN');

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_users`, JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_units`, JSON.stringify(workUnits));
  }, [workUnits]);
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_locs`, JSON.stringify(locations));
  }, [locations]);
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_sched`, JSON.stringify(schedule));
  }, [schedule]);
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_records`, JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_leaves`, JSON.stringify(leaveRequests));
  }, [leaveRequests]);
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_corrections`, JSON.stringify(corrections));
  }, [corrections]);
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_overtime`, JSON.stringify(overtimeRequests));
  }, [overtimeRequests]);
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_audit`, JSON.stringify(auditLogs));
  }, [auditLogs]);
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_settings`, JSON.stringify(settings));
  }, [settings]);

  const logAudit = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'Sistem',
      action,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 99)]);
  };

  const login = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      if (user.role === 'SUPER_ADMIN' || user.role === 'CHURCH_ADMIN') {
        // Automatically default admin to Admin Portal if desired
      }
      logAudit('LOGIN_USER', `Pengguna ${user.name} (${user.role}) berhasil masuk.`);
    }
  };

  const loginByNip = (nipOrEmail: string): boolean => {
    const trimmed = nipOrEmail.trim().toLowerCase();
    const user = users.find(
      (u) =>
        u.nip.toLowerCase() === trimmed ||
        u.email.toLowerCase() === trimmed ||
        u.name.toLowerCase().includes(trimmed)
    );
    if (user) {
      setCurrentUser(user);
      logAudit('LOGIN_USER', `Pengguna ${user.name} berhasil login via kredensial.`);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      logAudit('LOGOUT_USER', `Pengguna ${currentUser.name} keluar.`);
    }
    setCurrentUser(null);
  };

  const getTodayRecord = (employeeId: string, session: SessionType) => {
    const today = getCurrentDateStr(schedule.timezone);
    return attendanceRecords.find(
      (r) =>
        r.employeeId === employeeId &&
        r.workDate === today &&
        r.sessionType === session
    );
  };

  /**
   * Server-authoritative attendance validation & submission
   */
  const submitAttendance = async (
    payload: SubmitAttendancePayload
  ): Promise<{ success: boolean; record?: AttendanceRecord; error?: string }> => {
    const { employeeId, sessionType, coords, photoBase64, forceOutsideReview, outsideReason } =
      payload;
    const employee = users.find((u) => u.id === employeeId);
    if (!employee) {
      return { success: false, error: 'Data pegawai tidak ditemukan dalam sistem.' };
    }

    const today = getCurrentDateStr(schedule.timezone);

    // 1. DUPLICATION CHECK (Critical constraint)
    const existing = attendanceRecords.find(
      (r) =>
        r.employeeId === employeeId &&
        r.workDate === today &&
        r.sessionType === sessionType
    );
    if (existing) {
      return {
        success: false,
        error: `Anda sudah mengirim presensi ${
          sessionType === 'MORNING' ? 'Pagi' : 'Siang/Sore'
        } hari ini pada pukul ${existing.localTimeStr}. Duplikasi presensi ditolak.`,
      };
    }

    // 2. GEOFENCE CALCULATION
    // Find closest permitted church location
    const activeLocations = locations.filter((l) => l.isActive);
    if (activeLocations.length === 0) {
      return { success: false, error: 'Tidak ada titik lokasi gereja aktif yang dikonfigurasi.' };
    }

    let nearestLocation = activeLocations[0];
    let shortestDistance = calculateHaversineDistance(
      { latitude: coords.latitude, longitude: coords.longitude },
      { latitude: nearestLocation.latitude, longitude: nearestLocation.longitude }
    );

    for (const loc of activeLocations) {
      const dist = calculateHaversineDistance(
        { latitude: coords.latitude, longitude: coords.longitude },
        { latitude: loc.latitude, longitude: loc.longitude }
      );
      if (dist < shortestDistance) {
        shortestDistance = dist;
        nearestLocation = loc;
      }
    }

    const isInsideRadius = shortestDistance <= nearestLocation.radiusMeters;

    // Evaluate time status
    const timeEvaluation = evaluateAttendanceTime(sessionType, schedule);

    let finalStatus: AttendanceStatus = timeEvaluation.status;
    let rejectionReason: string | undefined = undefined;

    if (!isInsideRadius) {
      if (forceOutsideReview && outsideReason) {
        // Submitted with special request justification for admin review
        finalStatus = 'PENDING_REVIEW';
        rejectionReason = `Di luar radius (${Math.round(
          shortestDistance
        )}m). Pengajuan khusus: ${outsideReason}`;
      } else {
        // Normal submission blocked outside radius
        return {
          success: false,
          error: `Lokasi Anda berada ${Math.round(
            shortestDistance
          )} meter dari ${nearestLocation.name}. Batas radius resmi adalah ${
            nearestLocation.radiusMeters
          } meter. Tombol presensi dinonaktifkan di luar area.`,
        };
      }
    }

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeNip: employee.nip,
      department: employee.department,
      workDate: today,
      sessionType,
      timestamp: new Date().toISOString(),
      localTimeStr: getCurrentTimeStr(schedule.timezone, schedule.timezoneLabel),
      latitude: coords.latitude,
      longitude: coords.longitude,
      gpsAccuracy: coords.accuracy,
      distanceMeters: shortestDistance,
      locationId: nearestLocation.id,
      locationName: nearestLocation.name,
      photoUrl: photoBase64,
      status: finalStatus,
      latenessMinutes: timeEvaluation.latenessMinutes,
      rejectionReason,
      deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Browser',
      isVerified: finalStatus !== 'PENDING_REVIEW',
      notes: payload.notes || timeEvaluation.message,
    };

    setAttendanceRecords((prev) => [newRecord, ...prev]);

    logAudit(
      'PRESENSI_BERHASIL',
      `Pegawai ${employee.name} mencatat presensi ${sessionType} (Status: ${finalStatus}, Jarak: ${Math.round(
        shortestDistance
      )}m ke ${nearestLocation.name}).`
    );

    return { success: true, record: newRecord };
  };

  const addEmployee = (empData: Omit<UserProfile, 'id' | 'joinedAt'>) => {
    const newEmp: UserProfile = {
      ...empData,
      id: `usr-emp-${Date.now()}`,
      joinedAt: getCurrentDateStr(schedule.timezone),
    };
    setUsers((prev) => [...prev, newEmp]);
    logAudit('TAMBAH_PEGAWAI', `Pegawai baru ${newEmp.name} (NIP: ${newEmp.nip}) ditambahkan.`);
  };

  const updateEmployee = (id: string, updates: Partial<UserProfile>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
    );
    if (currentUser?.id === id) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));
    }
    logAudit('UBAH_PEGAWAI', `Data pegawai ID ${id} diperbarui.`);
  };

  const deleteEmployee = (id: string) => {
    const emp = users.find((u) => u.id === id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (currentUser?.id === id) {
      const remaining = users.filter((u) => u.id !== id);
      setCurrentUser(remaining[0] || null);
    }
    logAudit('HAPUS_PEGAWAI', `Pegawai ${emp?.name || id} dihapus dari sistem.`);
  };

  const addLocation = (locData: Omit<AttendanceLocation, 'id'>) => {
    const newLoc: AttendanceLocation = {
      ...locData,
      id: `loc-${Date.now()}`,
    };
    setLocations((prev) => [...prev, newLoc]);
    logAudit('TAMBAH_LOKASI', `Lokasi presensi baru "${newLoc.name}" ditambahkan (Radius: ${newLoc.radiusMeters}m).`);
  };

  const updateLocation = (id: string, updates: Partial<AttendanceLocation>) => {
    setLocations((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
    logAudit('UBAH_LOKASI', `Lokasi presensi ID ${id} diperbarui.`);
  };

  const deleteLocation = (id: string) => {
    const loc = locations.find((l) => l.id === id);
    setLocations((prev) => prev.filter((l) => l.id !== id));
    logAudit('HAPUS_LOKASI', `Lokasi presensi "${loc?.name || id}" dihapus.`);
  };

  const updateSchedule = (newSched: AttendanceSchedule) => {
    setSchedule(newSched);
    logAudit(
      'UBAH_JADWAL',
      `Jadwal presensi diperbarui: Pagi ${newSched.morningTarget} (+${newSched.morningToleranceMinutes}m), Sore ${newSched.afternoonTarget}.`
    );
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    logAudit('UBAH_PENGATURAN', 'Pengaturan informasi gereja diperbarui.');
  };

  const createLeaveRequest = (reqData: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>) => {
    const newReq: LeaveRequest = {
      ...reqData,
      id: `leave-${Date.now()}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    setLeaveRequests((prev) => [newReq, ...prev]);
    logAudit('AJUKAN_IZIN', `Pengajuan ${reqData.type} oleh ${reqData.employeeName} dibuat.`);
  };

  const reviewLeaveRequest = (id: string, status: 'APPROVED' | 'REJECTED', adminNotes?: string) => {
    setLeaveRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              adminNotes,
              reviewedBy: currentUser?.name || 'Admin',
              reviewedAt: new Date().toISOString(),
            }
          : r
      )
    );
    logAudit('TINJAU_IZIN', `Pengajuan izin ${id} diputuskan: ${status}.`);
  };

  const createCorrection = (reqData: Omit<AttendanceCorrection, 'id' | 'status' | 'createdAt'>) => {
    const newCorr: AttendanceCorrection = {
      ...reqData,
      id: `corr-${Date.now()}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    setCorrections((prev) => [newCorr, ...prev]);
    logAudit('AJUKAN_KOREKSI', `Pengajuan koreksi presensi oleh ${reqData.employeeName} dibuat.`);
  };

  const reviewCorrection = (id: string, status: 'APPROVED' | 'REJECTED', adminNotes?: string) => {
    setCorrections((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status,
              adminNotes,
              reviewedBy: currentUser?.name || 'Admin',
              reviewedAt: new Date().toISOString(),
            }
          : c
      )
    );
    logAudit('TINJAU_KOREKSI', `Pengajuan koreksi ${id} diputuskan: ${status}.`);
  };

  const createOvertimeRequest = (reqData: Omit<OvertimeRequest, 'id' | 'status' | 'createdAt'>) => {
    const newOvt: OvertimeRequest = {
      ...reqData,
      id: `ovt-${Date.now()}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    setOvertimeRequests((prev) => [newOvt, ...prev]);
    logAudit('AJUKAN_LEMBUR', `Pengajuan lembur (${reqData.durationHours} jam) oleh ${reqData.employeeName} dibuat.`);
  };

  const reviewOvertimeRequest = (id: string, status: 'APPROVED' | 'REJECTED', adminNotes?: string) => {
    setOvertimeRequests((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status,
              adminNotes,
              reviewedBy: currentUser?.name || 'Admin',
              reviewedAt: new Date().toISOString(),
            }
          : o
      )
    );
    logAudit('TINJAU_LEMBUR', `Pengajuan lembur ${id} diputuskan: ${status}.`);
  };

  const deleteAttendanceRecord = (id: string) => {
    setAttendanceRecords((prev) => prev.filter((r) => r.id !== id));
    logAudit('HAPUS_PRESENSI', `Catatan transaksi presensi ID ${id} dihapus oleh admin.`);
  };

  const deleteAttendanceRecordsByDate = (date: string) => {
    setAttendanceRecords((prev) => prev.filter((r) => r.workDate !== date));
    logAudit('HAPUS_PRESENSI_HARIAN', `Seluruh data transaksi presensi tanggal ${date} dihapus.`);
  };

  const clearAttendanceRecords = () => {
    setAttendanceRecords([]);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_records`);
    logAudit('BERSIHKAN_PRESENSI', 'Seluruh riwayat transaksi presensi pegawai dikosongkan.');
  };

  const clearAuditLogs = () => {
    const initLog: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'Admin',
      action: 'LOG_DIKOSONGKAN',
      details: 'Audit log sebelumnya telah dibersihkan oleh administrator.',
    };
    setAuditLogs([initLog]);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_audit`);
  };

  const resetToDefaultData = () => {
    // Explicitly wipe all keys
    try {
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_users`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_units`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_locs`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_sched`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_records`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_leaves`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_corrections`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_audit`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_settings`);
      localStorage.clear();
    } catch (e) {
      console.warn('LocalStorage clear error:', e);
    }

    setUsers(INITIAL_USERS);
    setWorkUnits(INITIAL_UNITS);
    setLocations(INITIAL_LOCATIONS);
    setSchedule(INITIAL_SCHEDULE);
    setAttendanceRecords(INITIAL_ATTENDANCE_RECORDS);
    setLeaveRequests(INITIAL_LEAVE_REQUESTS);
    setCorrections([]);
    setOvertimeRequests(INITIAL_OVERTIME_REQUESTS);
    setSettings({ ...INITIAL_SETTINGS, appUrl: typeof window !== 'undefined' ? window.location.origin : 'https://presensi-gereja.org' });
    setCurrentUser(INITIAL_USERS[3]);

    const resetAuditLog: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: INITIAL_USERS[0].id,
      userName: INITIAL_USERS[0].name,
      action: 'RESET_DATA_TOTAL',
      details: 'Seluruh data aplikasi di-reset ke nilai bawaan pabrik Gereja Toraja Jemaat Karambo.',
    };
    setAuditLogs([resetAuditLog]);
  };

  return (
    <AttendanceContext.Provider
      value={{
        currentUser,
        activePortal,
        users,
        workUnits,
        locations,
        schedule,
        attendanceRecords,
        leaveRequests,
        corrections,
        overtimeRequests,
        auditLogs,
        settings,

        login,
        loginByNip,
        logout,
        setActivePortal,

        submitAttendance,
        getTodayRecord,

        addEmployee,
        updateEmployee,
        deleteEmployee,

        addLocation,
        updateLocation,
        deleteLocation,

        updateSchedule,
        updateSettings,

        createLeaveRequest,
        reviewLeaveRequest,
        createCorrection,
        reviewCorrection,
        createOvertimeRequest,
        reviewOvertimeRequest,

        deleteAttendanceRecord,
        deleteAttendanceRecordsByDate,
        clearAttendanceRecords,
        clearAuditLogs,
        resetToDefaultData,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
