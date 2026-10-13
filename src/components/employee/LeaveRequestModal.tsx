import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { LeaveType } from '../../types';
import { getCurrentDateStr } from '../../utils/time';
import { Calendar, FileText, Send, X } from 'lucide-react';

export const LeaveRequestModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, schedule, createLeaveRequest } = useAttendance();

  const [type, setType] = useState<LeaveType>('IZIN');
  const [startDate, setStartDate] = useState(getCurrentDateStr(schedule.timezone));
  const [endDate, setEndDate] = useState(getCurrentDateStr(schedule.timezone));
  const [reason, setReason] = useState('');
  const [attachmentNote, setAttachmentNote] = useState('');

  if (!isOpen || !currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    createLeaveRequest({
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      department: currentUser.department,
      type,
      startDate,
      endDate,
      reason,
      attachmentUrl: attachmentNote ? `Surat Keterangan: ${attachmentNote}` : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto no-print">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 p-6 my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Pengajuan Izin / Cuti / Sakit</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Jenis Pengajuan</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as LeaveType)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="IZIN">Izin Tidak Masuk Kantor</option>
              <option value="SAKIT">Sakit (Istirahat Dokter)</option>
              <option value="CUTI">Cuti Tahunan Pegawai</option>
              <option value="TUGAS_LUAR">Tugas Luar / Dinas Jemaat</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Mulai Tanggal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Sampai Tanggal</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Alasan / Keterangan</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Jelaskan keperluan atau keterangan medis secara jelas..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Catatan Lampiran / Surat Bukti</label>
            <input
              type="text"
              value={attachmentNote}
              onChange={(e) => setAttachmentNote(e.target.value)}
              placeholder="Cth: Surat dokter RS Elim Rantepao No. 412"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Kirim Pengajuan ke Admin Gereja</span>
          </button>
        </form>
      </div>
    </div>
  );
};
