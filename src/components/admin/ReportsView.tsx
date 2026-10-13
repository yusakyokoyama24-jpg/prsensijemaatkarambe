import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { exportAttendanceToExcel, exportMonthlySalaryRecapToExcel } from '../../utils/export';
import { getCurrentDateStr } from '../../utils/time';
import { AttendanceRecord } from '../../types';
import {
  Calendar,
  Download,
  FileSpreadsheet,
  Filter,
  Printer,
  Search,
  CheckCircle2,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

export const ReportsView: React.FC = () => {
  const {
    attendanceRecords,
    users,
    workUnits,
    settings,
    schedule,
    deleteAttendanceRecord,
  } = useAttendance();

  const [startDate, setStartDate] = useState(getCurrentDateStr(schedule.timezone));
  const [endDate, setEndDate] = useState(getCurrentDateStr(schedule.timezone));
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deletingRecord, setDeletingRecord] = useState<AttendanceRecord | null>(null);
  const [showClearFilteredModal, setShowClearFilteredModal] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Filter records
  const filteredRecords = attendanceRecords.filter((r) => {
    if (r.workDate < startDate || r.workDate > endDate) return false;
    if (departmentFilter !== 'ALL' && r.department !== departmentFilter) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    return true;
  });

  const total = filteredRecords.length;
  const onTime = filteredRecords.filter((r) => r.status === 'ON_TIME').length;
  const late = filteredRecords.filter((r) => r.status === 'LATE').length;
  const outside = filteredRecords.filter((r) => r.status === 'OUTSIDE_RADIUS').length;

  const handleExportExcel = () => {
    exportAttendanceToExcel(
      filteredRecords,
      users,
      `Periode: ${startDate} s/d ${endDate}`
    );
  };

  const handleExportSalaryRecap = () => {
    exportMonthlySalaryRecapToExcel(
      filteredRecords,
      users,
      `Periode: ${startDate} s/d ${endDate}`
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBatchDeleteFiltered = () => {
    filteredRecords.forEach((r) => deleteAttendanceRecord(r.id));
    setShowClearFilteredModal(false);
    setActionToast(`Berhasil menghapus ${filteredRecords.length} catatan presensi terpilih!`);
    setTimeout(() => setActionToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Printable Official Church Letterhead (only visible when printing) */}
      <div className="print-only p-6 border-b-2 border-slate-900 mb-6 text-center text-slate-900">
        <div className="flex items-center justify-center gap-4 mb-2">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.churchName}
              className="w-14 h-14 object-contain rounded-lg"
            />
          ) : (
            <span className="text-4xl font-black">✝</span>
          )}
          <div>
            <h1 className="text-xl font-black tracking-wide uppercase">{settings.churchName}</h1>
            <p className="text-xs font-semibold">{settings.churchSubtitle}</p>
            <p className="text-[11px] text-slate-600">{settings.churchAddress}</p>
          </div>
        </div>
        <div className="border-t-2 border-slate-900 pt-2 mt-2">
          <h2 className="text-sm font-bold uppercase tracking-wider">
            LAPORAN REKAPITULASI PRESENSI PEGAWAI GEREJA
          </h2>
          <p className="text-xs text-slate-600">
            Periode: {startDate} s/d {endDate} • Dicetak pada: {new Date().toLocaleDateString('id-ID')}
          </p>
        </div>
      </div>

      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-400" />
            <span>Laporan & Rekapitulasi Presensi Pegawai</span>
          </h2>
          <p className="text-xs text-slate-400">
            Filter kehadiran, unduh laporan dalam format Excel (.xlsx), atau cetak format resmi gereja.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {filteredRecords.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearFilteredModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 text-rose-300 font-bold text-xs transition cursor-pointer shadow-sm"
              title="Hapus semua catatan yang saat ini terfilter"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Data Terfilter ({filteredRecords.length})</span>
            </button>
          )}

          <button
            onClick={handleExportSalaryRecap}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer shadow-md"
            title="Ekspor rekapitulasi kehadiran dan estimasi tunjangan/gaji pegawai"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Rekap Gaji Bulanan (.xlsx)</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer border border-slate-700"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="no-print p-4 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-slate-400 font-semibold mb-1">Mulai Tanggal</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 font-semibold mb-1">Sampai Tanggal</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 font-semibold mb-1">Unit Pelayanan</label>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Semua Unit</option>
            {workUnits.map((u) => (
              <option key={u.id} value={u.name}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 font-semibold mb-1">Status Kehadiran</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="ON_TIME">Tepat Waktu</option>
            <option value="LATE">Terlambat</option>
            <option value="OUTSIDE_RADIUS">Di Luar Area Radius</option>
          </select>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-slate-400">Total Transaksi</p>
          <p className="text-lg font-bold text-white mt-0.5">{total}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900 border border-emerald-900/60">
          <p className="text-emerald-400">Tepat Waktu</p>
          <p className="text-lg font-bold text-emerald-400 mt-0.5">{onTime}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900 border border-amber-900/60">
          <p className="text-amber-400">Terlambat</p>
          <p className="text-lg font-bold text-amber-400 mt-0.5">{late}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900 border border-rose-900/60">
          <p className="text-rose-400">Di Luar Radius</p>
          <p className="text-lg font-bold text-rose-400 mt-0.5">{outside}</p>
        </div>
      </div>

      {/* Report Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Sesi</th>
                <th className="py-3 px-4">Nama Pegawai & NIP</th>
                <th className="py-3 px-4">Unit Kerja</th>
                <th className="py-3 px-4">Waktu Presensi</th>
                <th className="py-3 px-4">Jarak & Akurasi GPS</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Tidak ada catatan presensi pada rentang tanggal yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-slate-300">{r.workDate}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-amber-400">
                        {r.sessionType === 'MORNING' ? 'Pagi (Mulai)' : 'Sore (Selesai)'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-white">{r.employeeName}</p>
                      <p className="text-[10px] font-mono text-slate-400">{r.employeeNip}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{r.department}</td>
                    <td className="py-3 px-4 font-mono text-white">{r.localTimeStr}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {Math.round(r.distanceMeters)}m (±{r.gpsAccuracy}m)
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.status === 'ON_TIME'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : r.status === 'LATE'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {r.status === 'ON_TIME'
                          ? 'Tepat Waktu'
                          : r.status === 'LATE'
                          ? `Terlambat (${r.latenessMinutes}m)`
                          : 'Di Luar Radius'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center no-print">
                      <button
                        type="button"
                        onClick={() => setDeletingRecord(r)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-950/60 transition cursor-pointer"
                        title="Hapus data presensi ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Konfirmasi Hapus Satu Catatan */}
      <ConfirmModal
        isOpen={!!deletingRecord}
        title="Hapus Catatan Presensi?"
        message={`Apakah Anda yakin ingin menghapus data presensi ${deletingRecord?.sessionType === 'MORNING' ? 'Pagi' : 'Sore'} milik ${deletingRecord?.employeeName} pada tanggal ${deletingRecord?.workDate}?`}
        confirmLabel="Ya, Hapus Data"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={() => {
          if (deletingRecord) {
            deleteAttendanceRecord(deletingRecord.id);
            setDeletingRecord(null);
            setActionToast('Catatan presensi berhasil dihapus!');
            setTimeout(() => setActionToast(null), 3000);
          }
        }}
        onCancel={() => setDeletingRecord(null)}
      />

      {/* Modal Konfirmasi Hapus Semua Data Terfilter */}
      <ConfirmModal
        isOpen={showClearFilteredModal}
        title="Hapus Semua Data Presensi Terfilter?"
        message={`Tindakan ini akan menghapus ${filteredRecords.length} catatan presensi dari rentang ${startDate} s/d ${endDate}. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus Semua"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={handleBatchDeleteFiltered}
        onCancel={() => setShowClearFilteredModal(false)}
      />

      {/* Toast Notification */}
      {actionToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionToast}</span>
        </div>
      )}
    </div>
  );
};
