import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { SessionType } from '../../types';
import { getCurrentDateStr } from '../../utils/time';
import { Edit3, Send, X } from 'lucide-react';

export const CorrectionRequestModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { currentUser, schedule, createCorrection } = useAttendance();

  const [sessionType, setSessionType] = useState<SessionType>('MORNING');
  const [workDate, setWorkDate] = useState(getCurrentDateStr(schedule.timezone));
  const [reason, setReason] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');

  if (!isOpen || !currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    createCorrection({
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      workDate,
      sessionType,
      reason,
      evidenceUrl: evidenceNote ? `Catatan Bukti: ${evidenceNote}` : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto no-print">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 p-6 my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Pengajuan Koreksi Presensi</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-400 leading-relaxed">
          Gunakan formulir ini jika terjadi kendala teknis (mati lampu, gangguan GPS darurat, atau dinas luar mendadak) agar kehadiran Anda dapat diverifikasi admin tanpa merusak audit log asli.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tanggal Tugas</label>
              <input
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Sesi Presensi</label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value as SessionType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="MORNING">Pagi (Mulai Kerja)</option>
                <option value="AFTERNOON">Siang/Sore (Selesai Kerja)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Alasan Koreksi</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Mengantar dokumen ke kantor sinode jam 08:00 atas perintah majelis..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Bukti Pendukung</label>
            <input
              type="text"
              value={evidenceNote}
              onChange={(e) => setEvidenceNote(e.target.value)}
              placeholder="Cth: Disaksikan oleh Pnt. Daniel Rantelino"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Kirim Pengajuan Koreksi</span>
          </button>
        </form>
      </div>
    </div>
  );
};
