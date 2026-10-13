import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { AttendanceRecord, SessionType } from '../../types';
import { formatIndonesianDate } from '../../utils/time';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  MapPin,
  Search,
  Eye,
  X,
  AlertCircle,
} from 'lucide-react';

export const AttendanceHistory: React.FC = () => {
  const { currentUser, attendanceRecords, leaveRequests, corrections, overtimeRequests, schedule } = useAttendance();

  const [activeTab, setActiveTab] = useState<'ATTENDANCE' | 'LEAVE' | 'CORRECTIONS' | 'OVERTIME'>('ATTENDANCE');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [filterSession, setFilterSession] = useState<'ALL' | SessionType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter records for this employee
  const myRecords = attendanceRecords
    .filter((r) => r.employeeId === currentUser?.id)
    .filter((r) => {
      if (filterSession !== 'ALL' && r.sessionType !== filterSession) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          r.workDate.includes(q) ||
          r.localTimeStr.toLowerCase().includes(q) ||
          r.locationName.toLowerCase().includes(q)
        );
      }
      return true;
    });

  const myLeaves = leaveRequests.filter((l) => l.employeeId === currentUser?.id);
  const myCorrections = corrections.filter((c) => c.employeeId === currentUser?.id);
  const myOvertime = overtimeRequests.filter((o) => o.employeeId === currentUser?.id);

  return (
    <div className="space-y-4">
      {/* Sub tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs flex-wrap">
        <button
          onClick={() => setActiveTab('ATTENDANCE')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'ATTENDANCE'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Riwayat Presensi ({myRecords.length})
        </button>
        <button
          onClick={() => setActiveTab('LEAVE')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'LEAVE'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Izin & Cuti ({myLeaves.length})
        </button>
        <button
          onClick={() => setActiveTab('CORRECTIONS')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'CORRECTIONS'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Koreksi Presensi ({myCorrections.length})
        </button>
        <button
          onClick={() => setActiveTab('OVERTIME')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'OVERTIME'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Lembur ({myOvertime.length})
        </button>
      </div>

      {/* ATTENDANCE TAB */}
      {activeTab === 'ATTENDANCE' && (
        <div className="space-y-3">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-between text-xs">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Cari tanggal (YYYY-MM-DD)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-slate-400">Sesi:</span>
              <select
                value={filterSession}
                onChange={(e) => setFilterSession(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">Semua Sesi</option>
                <option value="MORNING">Pagi Saja</option>
                <option value="AFTERNOON">Siang/Sore Saja</option>
              </select>
            </div>
          </div>

          {/* Records List */}
          {myRecords.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800/80 text-slate-400 text-xs">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p>Belum ada catatan presensi yang sesuai.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex items-start gap-3"
                >
                  <img
                    src={rec.photoUrl}
                    alt="Selfie"
                    className="w-16 h-16 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-white truncate">
                        {formatIndonesianDate(rec.workDate, schedule.timezone)}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          rec.status === 'ON_TIME'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : rec.status === 'LATE'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {rec.status === 'ON_TIME'
                          ? 'Tepat Waktu'
                          : rec.status === 'LATE'
                          ? `Terlambat ${rec.latenessMinutes}m`
                          : 'Di Luar Area'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <span className="font-semibold text-amber-400">
                        {rec.sessionType === 'MORNING' ? 'Sesi Pagi' : 'Sesi Siang/Sore'}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-slate-300">{rec.localTimeStr}</span>
                    </div>

                    <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-400/80 shrink-0" />
                      <span className="truncate">{rec.locationName}</span>
                      <span className="text-slate-500 font-mono">({Math.round(rec.distanceMeters)}m)</span>
                    </p>

                    <div className="pt-1 flex items-center justify-end">
                      <button
                        onClick={() => setSelectedRecord(rec)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Lihat Bukti</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LEAVE TAB */}
      {activeTab === 'LEAVE' && (
        <div className="space-y-3">
          {myLeaves.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800/80 text-slate-400 text-xs">
              <p>Belum ada riwayat pengajuan izin atau cuti.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myLeaves.map((l) => (
                <div
                  key={l.id}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">
                      {l.type === 'IZIN'
                        ? 'Izin Tidak Masuk'
                        : l.type === 'SAKIT'
                        ? 'Sakit'
                        : l.type === 'CUTI'
                        ? 'Cuti Pegawai'
                        : 'Tugas Luar'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        l.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : l.status === 'REJECTED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {l.status === 'APPROVED'
                        ? 'Disetujui'
                        : l.status === 'REJECTED'
                        ? 'Ditolak'
                        : 'Menunggu Persetujuan'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Periode: {l.startDate} s/d {l.endDate}
                  </p>
                  <p className="text-slate-300">{l.reason}</p>
                  {l.adminNotes && (
                    <p className="text-[11px] text-amber-300/90 bg-slate-950 p-2 rounded-lg">
                      Catatan Admin: {l.adminNotes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CORRECTIONS TAB */}
      {activeTab === 'CORRECTIONS' && (
        <div className="space-y-3">
          {myCorrections.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800/80 text-slate-400 text-xs">
              <p>Belum ada pengajuan koreksi presensi.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myCorrections.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">
                      Koreksi: {c.workDate} ({c.sessionType})
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : c.status === 'REJECTED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {c.status === 'APPROVED'
                        ? 'Disetujui'
                        : c.status === 'REJECTED'
                        ? 'Ditolak'
                        : 'Menunggu Persetujuan'}
                    </span>
                  </div>
                  <p className="text-slate-300">{c.reason}</p>
                  {c.adminNotes && (
                    <p className="text-[11px] text-amber-300/90 bg-slate-950 p-2 rounded-lg">
                      Catatan Admin: {c.adminNotes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* OVERTIME TAB */}
      {activeTab === 'OVERTIME' && (
        <div className="space-y-3">
          {myOvertime.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800/80 text-slate-400 text-xs">
              <p>Belum ada riwayat pengajuan jam lembur (overtime).</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myOvertime.map((o) => (
                <div
                  key={o.id}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Lembur: {o.workDate} ({o.startTime} - {o.endTime} • {o.durationHours} Jam)</span>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        o.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : o.status === 'REJECTED'
                          ? 'bg-rose-500/20 text-rose-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {o.status === 'APPROVED'
                        ? 'Disetujui'
                        : o.status === 'REJECTED'
                        ? 'Ditolak'
                        : 'Menunggu Persetujuan'}
                    </span>
                  </div>
                  <p className="text-slate-300"><strong>Alasan:</strong> {o.reason}</p>
                  {o.adminNotes && (
                    <p className="text-[11px] text-amber-300/90 bg-slate-950 p-2 rounded-lg">
                      Catatan Admin: {o.adminNotes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto no-print">
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 text-slate-100 my-auto space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-amber-400 uppercase">
                Detail Bukti Presensi
              </span>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <img
              src={selectedRecord.photoUrl}
              alt="Bukti Selfie"
              className="w-full aspect-square rounded-xl object-cover ring-1 ring-slate-700"
            />

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Pegawai:</span>
                <span className="font-bold text-white">{selectedRecord.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tanggal:</span>
                <span className="font-medium text-slate-200">{selectedRecord.workDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Waktu Presensi:</span>
                <span className="font-mono text-amber-400">{selectedRecord.localTimeStr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Jarak dari Titik Pusat:</span>
                <span className="font-mono text-slate-200">
                  {Math.round(selectedRecord.distanceMeters)} meter
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Akurasi GPS:</span>
                <span className="font-mono text-slate-200">±{selectedRecord.gpsAccuracy} meter</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lokasi Gereja:</span>
                <span className="text-slate-200">{selectedRecord.locationName}</span>
              </div>
              {selectedRecord.notes && (
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <span className="text-slate-500 block">Catatan:</span>
                  {selectedRecord.notes}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedRecord(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
