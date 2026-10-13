import * as XLSX from 'xlsx';
import { AttendanceRecord, UserProfile } from '../types';

export function exportAttendanceToExcel(
  records: AttendanceRecord[],
  employees: UserProfile[],
  filterTitle: string = 'Semua Periode'
) {
  // 1. Data Detail Transaksi
  const dataRows = records.map((rec, index) => {
    let statusText = 'Tepat Waktu';
    if (rec.status === 'LATE') statusText = `Terlambat (${rec.latenessMinutes || 0} menit)`;
    else if (rec.status === 'OUTSIDE_RADIUS') statusText = 'Di Luar Radius Area';
    else if (rec.status === 'PENDING_REVIEW') statusText = 'Perlu Pemeriksaan Admin';
    else if (rec.status === 'REJECTED') statusText = 'Ditolak';

    return {
      'No.': index + 1,
      'Tanggal': rec.workDate,
      'Sesi': rec.sessionType === 'MORNING' ? 'Pagi (Mulai Tugas)' : 'Siang/Sore (Selesai Tugas)',
      'NIP': rec.employeeNip,
      'Nama Pegawai': rec.employeeName,
      'Unit Kerja': rec.department,
      'Jam Presensi': rec.localTimeStr,
      'Status': statusText,
      'Jarak dari Gereja': `${Math.round(rec.distanceMeters)} m`,
      'Akurasi GPS': `±${rec.gpsAccuracy} m`,
      'Titik Lokasi': rec.locationName,
      'Catatan': rec.notes || (rec.rejectionReason ? `Ditolak: ${rec.rejectionReason}` : '-'),
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(dataRows);

  // Set column widths for clean readability
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // Tanggal
    { wch: 25 }, // Sesi
    { wch: 14 }, // NIP
    { wch: 26 }, // Nama
    { wch: 26 }, // Unit
    { wch: 18 }, // Jam
    { wch: 25 }, // Status
    { wch: 18 }, // Jarak
    { wch: 14 }, // Akurasi
    { wch: 28 }, // Titik
    { wch: 32 }, // Catatan
  ];

  // 2. Ringkasan Statistik Sheet
  const totalRecords = records.length;
  const onTimeCount = records.filter(r => r.status === 'ON_TIME').length;
  const lateCount = records.filter(r => r.status === 'LATE').length;
  const outsideCount = records.filter(r => r.status === 'OUTSIDE_RADIUS').length;
  const pendingCount = records.filter(r => r.status === 'PENDING_REVIEW').length;

  const summaryRows = [
    { 'Parameter Evaluasi Kehadiran': 'Periode Laporan', 'Nilai': filterTitle },
    { 'Parameter Evaluasi Kehadiran': 'Tanggal Cetak Laporan', 'Nilai': new Date().toLocaleDateString('id-ID') },
    { 'Parameter Evaluasi Kehadiran': 'Total Pegawai Terdaftar', 'Nilai': employees.length },
    { 'Parameter Evaluasi Kehadiran': 'Total Catatan Presensi', 'Nilai': totalRecords },
    { 'Parameter Evaluasi Kehadiran': 'Presensi Tepat Waktu', 'Nilai': onTimeCount },
    { 'Parameter Evaluasi Kehadiran': 'Presensi Terlambat', 'Nilai': lateCount },
    { 'Parameter Evaluasi Kehadiran': 'Presensi Di Luar Radius Geofence', 'Nilai': outsideCount },
    { 'Parameter Evaluasi Kehadiran': 'Presensi Memerlukan Peninjauan', 'Nilai': pendingCount },
    {
      'Parameter Evaluasi Kehadiran': 'Persentase Ketepatan Waktu',
      'Nilai': totalRecords > 0 ? `${Math.round((onTimeCount / totalRecords) * 100)}%` : '0%',
    },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 35 }, { wch: 25 }];

  // 3. Create Workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Presensi');
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan Statistik');

  const fileName = `Laporan_Presensi_Pegawai_Gereja_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportMonthlySalaryRecapToExcel(
  records: AttendanceRecord[],
  employees: UserProfile[],
  monthTitle: string = 'Bulan Berjalan'
) {
  const employeeMap = new Map<string, {
    nip: string;
    name: string;
    department: string;
    position: string;
    onTime: number;
    late: number;
    outside: number;
    totalLatenessMinutes: number;
    totalPresent: number;
  }>();

  employees.forEach(emp => {
    employeeMap.set(emp.id, {
      nip: emp.nip,
      name: emp.name,
      department: emp.department,
      position: emp.position || 'Pegawai',
      onTime: 0,
      late: 0,
      outside: 0,
      totalLatenessMinutes: 0,
      totalPresent: 0,
    });
  });

  records.forEach(r => {
    let empStats = employeeMap.get(r.employeeId);
    if (!empStats) {
      empStats = {
        nip: r.employeeNip,
        name: r.employeeName,
        department: r.department,
        position: 'Pegawai',
        onTime: 0,
        late: 0,
        outside: 0,
        totalLatenessMinutes: 0,
        totalPresent: 0,
      };
      employeeMap.set(r.employeeId, empStats);
    }
    empStats.totalPresent += 1;
    if (r.status === 'ON_TIME') {
      empStats.onTime += 1;
    } else if (r.status === 'LATE') {
      empStats.late += 1;
      empStats.totalLatenessMinutes += (r.latenessMinutes || 0);
    } else if (r.status === 'OUTSIDE_RADIUS') {
      empStats.outside += 1;
    }
  });

  const recapRows = Array.from(employeeMap.values()).map((stat, idx) => {
    const baseAllowance = 1500000;
    const deduction = stat.late * 15000 + stat.outside * 50000;
    const finalAllowance = Math.max(0, baseAllowance - deduction);

    return {
      'No.': idx + 1,
      'NIP': stat.nip,
      'Nama Pegawai': stat.name,
      'Jabatan': stat.position,
      'Unit Pelayanan': stat.department,
      'Total Kehadiran': stat.totalPresent,
      'Tepat Waktu': stat.onTime,
      'Terlambat': stat.late,
      'Total Menit Terlambat': stat.totalLatenessMinutes,
      'Di Luar Radius': stat.outside,
      'Estimasi Tunjangan (Rp)': finalAllowance,
      'Status Rekapitulasi': stat.late > 5 ? 'Perlu Evaluasi' : 'Baik',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(recapRows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 26 },
    { wch: 20 },
    { wch: 24 },
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
    { wch: 20 },
    { wch: 16 },
    { wch: 26 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Gaji & Kehadiran Bulanan');

  const fileName = `Rekap_Gaji_Dan_Presensi_Bulanan_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

