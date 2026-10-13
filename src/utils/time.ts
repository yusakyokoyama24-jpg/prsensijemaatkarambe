import { AttendanceSchedule, AttendanceStatus, SessionType, TimezoneOption } from '../types';

/**
 * Returns current date string formatted as YYYY-MM-DD in the given timezone
 */
export function getCurrentDateStr(timezone: TimezoneOption = 'Asia/Makassar'): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now);
}

/**
 * Returns current formatted time in given timezone (e.g., "08:15:20 WITA")
 */
export function getCurrentTimeStr(
  timezone: TimezoneOption = 'Asia/Makassar',
  tzLabel: string = 'WITA'
): string {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return `${timeStr} ${tzLabel}`;
}

/**
 * Returns full Indonesian day and date, e.g. "Senin, 13 Oktober 2026"
 */
export function formatIndonesianDate(
  dateStr?: string,
  timezone: TimezoneOption = 'Asia/Makassar'
): string {
  const dateObj = dateStr ? new Date(`${dateStr}T12:00:00Z`) : new Date();
  return dateObj.toLocaleDateString('id-ID', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Parses "HH:mm" string into minutes from midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Returns current time as minutes from midnight in the given timezone
 */
export function getCurrentMinutesInTimezone(timezone: TimezoneOption): number {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-GB', {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
  return timeStringToMinutes(timeStr);
}

/**
 * Evaluates whether an attendance attempt is on time, late, or out of schedule.
 */
export function evaluateAttendanceTime(
  session: SessionType,
  schedule: AttendanceSchedule
): {
  status: AttendanceStatus;
  latenessMinutes: number;
  message: string;
} {
  const currentMinutes = getCurrentMinutesInTimezone(schedule.timezone);

  if (session === 'MORNING') {
    const targetMinutes = timeStringToMinutes(schedule.morningTarget);
    const toleranceLimit = targetMinutes + schedule.morningToleranceMinutes;

    if (currentMinutes <= toleranceLimit) {
      return {
        status: 'ON_TIME',
        latenessMinutes: 0,
        message: 'Presensi Pagi Tepat Waktu',
      };
    } else {
      const lateMins = currentMinutes - targetMinutes;
      return {
        status: 'LATE',
        latenessMinutes: lateMins,
        message: `Terlambat ${lateMins} menit dari batas ${schedule.morningTarget} ${schedule.timezoneLabel}`,
      };
    }
  } else {
    // AFTERNOON session
    const targetMinutes = timeStringToMinutes(schedule.afternoonTarget);

    if (currentMinutes >= targetMinutes) {
      return {
        status: 'ON_TIME',
        latenessMinutes: 0,
        message: 'Presensi Selesai Tugas Tepat Waktu',
      };
    } else {
      const earlyMins = targetMinutes - currentMinutes;
      return {
        status: 'ON_TIME', // Masih tercatat selesai, namun dengan catatan pulang lebih awal
        latenessMinutes: 0,
        message: `Pulang lebih awal ${earlyMins} menit sebelum ${schedule.afternoonTarget} ${schedule.timezoneLabel}`,
      };
    }
  }
}

/**
 * Determines which session is currently active or recommended
 */
export function getRecommendedSession(schedule: AttendanceSchedule): SessionType {
  const currentMinutes = getCurrentMinutesInTimezone(schedule.timezone);
  const afternoonStartMinutes = timeStringToMinutes(schedule.afternoonStart);
  return currentMinutes >= afternoonStartMinutes ? 'AFTERNOON' : 'MORNING';
}
