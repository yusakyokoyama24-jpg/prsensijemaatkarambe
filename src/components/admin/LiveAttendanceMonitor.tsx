import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { AttendanceRecord, SessionType } from '../../types';
import { getCurrentDateStr } from '../../utils/time';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  MapPin,
  Search,
  Users,
  X,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

export const LiveAttendanceMonitor: React.FC = () => {
  const {
    users,
    workUnits,
    attendanceRecords,
    leaveRequests,
    schedule,
    locations,
    deleteAttendanceRecord,
    deleteAttendanceRecordsByDate,
  } = useAttendance();

  const [filterDate, setFilterDate] = useState(getCurrentDateStr(schedule.timezone));
  const [filterUnit, setFilterUnit] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<AttendanceRecord | null>(null);
  const [showClearDateModal, setShowClearDateModal] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Active employees
  const activeEmployees = users.filter((u) => u.isActive);

  // Filter records by date
  const recordsOnDate = attendanceRecords.filter((r) => r.workDate === filterDate);

  // Daily stats calculations
  const totalEmployees = activeEmployees.length;
  const morningPresensiCount = recordsOnDate.filter((r) => r.sessionType === 'MORNING').length;
  const afternoonPresensiCount = recordsOnDate.filter((r) => r.sessionType === 'AFTERNOON').length;
  const lateCount = recordsOnDate.filter((r) => r.status === 'LATE').length;
  const outsideCount = recordsOnDate.filter((r) => r.status === 'OUTSIDE_RADIUS').length;
  const pendingCount = recordsOnDate.filter((r) => r.status === 'PENDING_REVIEW').length;
  const leaveCount = leaveRequests.filter(
    (l) => l.startDate <= filterDate && l.endDate >= filterDate && l.status === 'APPROVED'
  ).length;

  const attendancePercent =
    totalEmployees > 0 ? Math.round((morningPresensiCount / totalEmployees) * 100) : 0;

  // Filtered employees for table
  const displayedEmployees = activeEmployees
    .filter((emp) => {
      if (filterUnit !== 'ALL' && emp.department !== filterUnit) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          emp.name.toLowerCase().includes(q) ||
          emp.nip.toLowerCase().includes(q) ||
          emp.department.toLowerCase().includes(q)
        );
      }
      return true;
    });

  return (
    <div className="space-y-6">
      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Pegawai */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-[11px] text-slate-400 font-medium truncate">Total Pegawai</p>
          <p className="text-xl font-bold text-white mt-1">{totalEmployees}</p>
          <span className="text-[10px] text-slate-500">Pegawai Aktif</span>
        </div>

        {/* Hadir Pagi */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-emerald-900/50">
          <p className="text-[11px] text-emerald-400 font-medium truncate">Presensi Pagi</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{morningPresensiCount}</p>
          <span className="text-[10px] text-slate-500">Sesi Masuk</span>
        </div>

        {/* Hadir Sore */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-emerald-900/50">
          <p className="text-[11px] text-emerald-400 font-medium truncate">Presensi Sore</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{afternoonPresensiCount}</p>
          <span className="text-[10px] text-slate-500">Selesai Tugas</span>
        </div>

        {/* Terlambat */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-amber-900/50">
          <p className="text-[11px] text-amber-400 font-medium truncate">Terlambat</p>
          <p className="text-xl font-bold text-amber-400 mt-1">{lateCount}</p>
          <span className="text-[10px] text-slate-500">&gt; Batas Toleransi</span>
        </div>

        {/* Di Luar Area */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-rose-900/50">
          <p className="text-[11px] text-rose-400 font-medium truncate">Di Luar Area</p>
          <p className="text-xl font-bold text-rose-400 mt-1">{outsideCount + pendingCount}</p>
          <span className="text-[10px] text-slate-500">&gt; Radius Gereja</span>
        </div>

        {/* Izin / Cuti */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-sky-900/50">
          <p className="text-[11px] text-sky-400 font-medium truncate">Izin / Cuti</p>
          <p className="text-xl font-bold text-sky-400 mt-1">{leaveCount}</p>
          <span className="text-[10px] text-slate-500">Disetujui</span>
        </div>

        {/* Tingkat Kehadiran */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-amber-500/30 bg-gradient-to-br from-slate-900 to-amber-950/20">
          <p className="text-[11px] text-amber-400 font-medium truncate">Kehadiran Pagi</p>
          <p className="text-xl font-black text-amber-400 mt-1">{attendancePercent}%</p>
          <span className="text-[10px] text-slate-400">Persentase</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
            />
          </div>

          {/* Unit Filter */}
          <select
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Semua Unit Kerja</option>
            {workUnits.map((u) => (
              <option key={u.id} value={u.name}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Clear Daily Records Button */}
          {recordsOnDate.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearDateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 text-rose-300 font-semibold transition cursor-pointer"
              title={`Hapus semua data presensi pada tanggal ${filterDate}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Presensi Tanggal Ini ({recordsOnDate.length})</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Cari nama atau NIP pegawai..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Live Monitoring Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Pegawai</th>
                <th className="py-3 px-4">Unit Pelayanan</th>
                <th className="py-3 px-4">Presensi Pagi (Masuk)</th>
                <th className="py-3 px-4">Presensi Sore (Selesai)</th>
                <th className="py-3 px-4">Status Kehadiran</th>
                <th className="py-3 px-4 text-center">Aksi & Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayedEmployees.map((emp) => {
                const morningRec = recordsOnDate.find(
                  (r) => r.employeeId === emp.id && r.sessionType === 'MORNING'
                );
                const afternoonRec = recordsOnDate.find(
                  (r) => r.employeeId === emp.id && r.sessionType === 'AFTERNOON'
                );
                const leaveRec = leaveRequests.find(
                  (l) =>
                    l.employeeId === emp.id &&
                    l.startDate <= filterDate &&
                    l.endDate >= filterDate &&
                    l.status === 'APPROVED'
                );

                return (
                  <tr key={emp.id} className="hover:bg-slate-800/40 transition">
                    {/* Employee Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatar}
                          alt=""
                          className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-700"
                        />
                        <div>
                          <p className="font-bold text-white">{emp.name}</p>
                          <p className="text-[11px] font-mono text-slate-400">NIP: {emp.nip}</p>
                          <p className="text-[10px] text-slate-500">{emp.position}</p>
                        </div>
                      </div>
                    </td>

                    {/* Work Unit */}
                    <td className="py-3 px-4 text-slate-300">
                      <span className="font-medium">{emp.department}</span>
                    </td>

                    {/* Morning Session */}
                    <td className="py-3 px-4">
                      {morningRec ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-mono text-white">
                            <Clock className="w-3 h-3 text-emerald-400" />
                            <span>{morningRec.localTimeStr}</span>
                          </div>
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              morningRec.status === 'ON_TIME'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : morningRec.status === 'LATE'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {morningRec.status === 'ON_TIME'
                              ? 'Tepat Waktu'
                              : morningRec.status === 'LATE'
                              ? `Terlambat ${morningRec.latenessMinutes}m`
                              : 'Di Luar Area'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Belum Presensi</span>
                      )}
                    </td>

                    {/* Afternoon Session */}
                    <td className="py-3 px-4">
                      {afternoonRec ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-mono text-white">
                            <Clock className="w-3 h-3 text-emerald-400" />
                            <span>{afternoonRec.localTimeStr}</span>
                          </div>
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Selesai Tugas
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Belum Presensi</span>
                      )}
                    </td>

                    {/* Summary Status */}
                    <td className="py-3 px-4">
                      {leaveRec ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
                          {leaveRec.type} Disetujui
                        </span>
                      ) : morningRec && afternoonRec ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Lengkap (Pagi & Sore)
                        </span>
                      ) : morningRec ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Hadir Pagi
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          Belum Hadir
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      {morningRec || afternoonRec ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedRecord(morningRec || afternoonRec || null)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                            title="Lihat bukti selfie dan GPS"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Detail</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingRecord(morningRec || afternoonRec || null)}
                            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/80 text-rose-300 hover:text-white transition cursor-pointer"
                            title="Hapus data transaksi presensi pegawai ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Detail Modal (Selfie & GPS Details) */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto no-print"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedRecord(null);
          }}
        >
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100 my-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Bukti Presensi & Audit Geofence</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selfie Image */}
            <div className="relative aspect-square max-w-[260px] mx-auto rounded-xl overflow-hidden ring-2 ring-amber-500/40">
              <img
                src={selectedRecord.photoUrl}
                alt="Selfie"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-black/75 px-2.5 py-1 rounded-lg text-[10px] text-amber-300 font-mono">
                {selectedRecord.localTimeStr} • ±{selectedRecord.gpsAccuracy}m GPS
              </div>
            </div>

            {/* Details Table */}
            <div className="space-y-2 text-xs bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Pegawai:</span>
                <span className="font-bold text-white">{selectedRecord.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">NIP / Unit:</span>
                <span className="text-slate-300">
                  {selectedRecord.employeeNip} ({selectedRecord.department})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sesi Presensi:</span>
                <span className="font-semibold text-amber-400">
                  {selectedRecord.sessionType === 'MORNING' ? 'Pagi (Mulai Tugas)' : 'Siang/Sore (Selesai)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Koordinat GPS:</span>
                <span className="font-mono text-slate-200">
                  {selectedRecord.latitude.toFixed(5)}, {selectedRecord.longitude.toFixed(5)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Jarak dari Titik Pusat:</span>
                <span className="font-mono text-slate-200 font-bold">
                  {Math.round(selectedRecord.distanceMeters)} meter
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Titik Lokasi Resmi:</span>
                <span className="text-slate-300">{selectedRecord.locationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status Validasi:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    selectedRecord.status === 'ON_TIME'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : selectedRecord.status === 'LATE'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {selectedRecord.status}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 truncate">
                Perangkat: {selectedRecord.deviceInfo}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingRecord(selectedRecord)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 text-rose-300 font-semibold text-xs transition cursor-pointer"
                title="Hapus data transaksi presensi ini"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Data</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Satu Transaksi Presensi */}
      <ConfirmModal
        isOpen={!!deletingRecord}
        title="Hapus Data Transaksi Presensi?"
        message={`Apakah Anda yakin ingin menghapus data presensi ${deletingRecord?.sessionType === 'MORNING' ? 'Pagi' : 'Sore'} milik ${deletingRecord?.employeeName} pada tanggal ${deletingRecord?.workDate}? Data transaksi ini akan dihapus dari sistem.`}
        confirmLabel="Ya, Hapus Presensi"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={() => {
          if (deletingRecord) {
            deleteAttendanceRecord(deletingRecord.id);
            setDeletingRecord(null);
            setSelectedRecord(null);
            setActionToast('Data presensi berhasil dihapus!');
            setTimeout(() => setActionToast(null), 3000);
          }
        }}
        onCancel={() => setDeletingRecord(null)}
      />

      {/* Modal Konfirmasi Hapus Seluruh Presensi Tanggal Ini */}
      <ConfirmModal
        isOpen={showClearDateModal}
        title={`Hapus Semua Presensi Tanggal ${filterDate}?`}
        message={`Tindakan ini akan menghapus seluruh (${recordsOnDate.length}) catatan transaksi presensi pada tanggal ${filterDate}. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus Presensi Tanggal Ini"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={() => {
          deleteAttendanceRecordsByDate(filterDate);
          setShowClearDateModal(false);
          setActionToast(`Seluruh presensi tanggal ${filterDate} berhasil dihapus!`);
          setTimeout(() => setActionToast(null), 3000);
        }}
        onCancel={() => setShowClearDateModal(false)}
      />

      {/* Action Toast Notification */}
      {actionToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionToast}</span>
        </div>
      )}
    </div>
  );
};
