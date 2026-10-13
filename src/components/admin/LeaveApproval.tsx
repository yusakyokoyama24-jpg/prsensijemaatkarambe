import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { Check, CheckCircle2, FileText, X, AlertCircle, Clock } from 'lucide-react';

export const LeaveApproval: React.FC = () => {
  const {
    leaveRequests,
    corrections,
    overtimeRequests,
    reviewLeaveRequest,
    reviewCorrection,
    reviewOvertimeRequest,
  } = useAttendance();

  const [activeTab, setActiveTab] = useState<'LEAVE' | 'CORRECTIONS' | 'OVERTIME'>('LEAVE');
  const [adminNotes, setAdminNotes] = useState<{ [id: string]: string }>({});

  const handleLeaveDecision = (id: string, status: 'APPROVED' | 'REJECTED') => {
    reviewLeaveRequest(id, status, adminNotes[id]);
  };

  const handleCorrectionDecision = (id: string, status: 'APPROVED' | 'REJECTED') => {
    reviewCorrection(id, status, adminNotes[id]);
  };

  const handleOvertimeDecision = (id: string, status: 'APPROVED' | 'REJECTED') => {
    reviewOvertimeRequest(id, status, adminNotes[id]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-400" />
          <span>Verifikasi Izin, Cuti, Koreksi & Lembur Pegawai</span>
        </h2>
        <p className="text-xs text-slate-400">
          Tinjau permohonan ketidakhadiran, tugas luar dinas jemaat, pengajuan koreksi, dan jam kerja tambahan (overtime).
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs flex-wrap">
        <button
          onClick={() => setActiveTab('LEAVE')}
          className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
            activeTab === 'LEAVE'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          Pengajuan Izin & Cuti ({leaveRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('CORRECTIONS')}
          className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
            activeTab === 'CORRECTIONS'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          Pengajuan Koreksi Presensi ({corrections.length})
        </button>
        <button
          onClick={() => setActiveTab('OVERTIME')}
          className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
            activeTab === 'OVERTIME'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          Pengajuan Lembur / Overtime ({overtimeRequests.length})
        </button>
      </div>

      {activeTab === 'LEAVE' ? (
        <div className="space-y-3">
          {leaveRequests.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              Tidak ada pengajuan izin atau cuti yang perlu ditinjau.
            </div>
          ) : (
            leaveRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{req.employeeName}</span>
                      <span className="text-[11px] text-amber-400">({req.department})</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {req.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Periode: <strong>{req.startDate} s/d {req.endDate}</strong>
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      req.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : req.status === 'REJECTED'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {req.status === 'APPROVED'
                      ? '✓ Disetujui'
                      : req.status === 'REJECTED'
                      ? '✗ Ditolak'
                      : 'Menunggu Persetujuan'}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-slate-300">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                    Alasan / Keterangan:
                  </span>
                  {req.reason}
                  {req.attachmentUrl && (
                    <p className="mt-1 text-[11px] text-amber-400/90 font-medium">
                      Lampiran: {req.attachmentUrl}
                    </p>
                  )}
                </div>

                {req.status === 'PENDING' ? (
                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Catatan admin (opsional)..."
                      value={adminNotes[req.id] || ''}
                      onChange={(e) =>
                        setAdminNotes({ ...adminNotes, [req.id]: e.target.value })
                      }
                      className="w-full sm:flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleLeaveDecision(req.id, 'APPROVED')}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Setujui</span>
                      </button>
                      <button
                        onClick={() => handleLeaveDecision(req.id, 'REJECTED')}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>Tolak</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  req.adminNotes && (
                    <p className="text-[11px] text-slate-400">
                      Catatan Peninjauan: {req.adminNotes} (oleh {req.reviewedBy})
                    </p>
                  )
                )}
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'CORRECTIONS' ? (
        <div className="space-y-3">
          {corrections.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              Tidak ada permohonan koreksi presensi.
            </div>
          ) : (
            corrections.map((corr) => (
              <div
                key={corr.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{corr.employeeName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Sesi {corr.sessionType} ({corr.workDate})
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      corr.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : corr.status === 'REJECTED'
                        ? 'bg-rose-500/20 text-rose-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {corr.status}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                    Alasan Koreksi:
                  </span>
                  {corr.reason}
                </div>

                {corr.status === 'PENDING' && (
                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Catatan admin (opsional)..."
                      value={adminNotes[corr.id] || ''}
                      onChange={(e) =>
                        setAdminNotes({ ...adminNotes, [corr.id]: e.target.value })
                      }
                      className="w-full sm:flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleCorrectionDecision(corr.id, 'APPROVED')}
                        className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold transition cursor-pointer"
                      >
                        Setujui Koreksi
                      </button>
                      <button
                        onClick={() => handleCorrectionDecision(corr.id, 'REJECTED')}
                        className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold transition cursor-pointer"
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* OVERTIME APPROVAL TAB */
        <div className="space-y-3">
          {overtimeRequests.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              Tidak ada permohonan lembur (overtime) pegawai.
            </div>
          ) : (
            overtimeRequests.map((ovt) => (
              <div
                key={ovt.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{ovt.employeeName}</span>
                      <span className="text-[11px] text-amber-400">({ovt.department})</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{ovt.durationHours} Jam ({ovt.startTime} - {ovt.endTime})</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Tanggal Lembur: <strong>{ovt.workDate}</strong>
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      ovt.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : ovt.status === 'REJECTED'
                        ? 'bg-rose-500/20 text-rose-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {ovt.status === 'APPROVED'
                      ? '✓ Disetujui'
                      : ovt.status === 'REJECTED'
                      ? '✗ Ditolak'
                      : 'Menunggu Persetujuan'}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                    Alasan / Tugas Lembur:
                  </span>
                  {ovt.reason}
                </div>

                {ovt.status === 'PENDING' ? (
                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Catatan admin (opsional)..."
                      value={adminNotes[ovt.id] || ''}
                      onChange={(e) =>
                        setAdminNotes({ ...adminNotes, [ovt.id]: e.target.value })
                      }
                      className="w-full sm:flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleOvertimeDecision(ovt.id, 'APPROVED')}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Setujui</span>
                      </button>
                      <button
                        onClick={() => handleOvertimeDecision(ovt.id, 'REJECTED')}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>Tolak</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  ovt.adminNotes && (
                    <p className="text-[11px] text-slate-400">
                      Catatan Peninjauan: {ovt.adminNotes} (oleh {ovt.reviewedBy})
                    </p>
                  )
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
