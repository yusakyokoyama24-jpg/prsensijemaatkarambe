import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { Shield, Search, Clock, FileText, CheckCircle2, Camera, Upload, Trash2 } from 'lucide-react';
import { ChangeLogoModal } from '../common/ChangeLogoModal';
import { ConfirmModal } from '../common/ConfirmModal';

export const AuditLogsView: React.FC = () => {
  const {
    auditLogs,
    settings,
    updateSettings,
    resetToDefaultData,
    clearAttendanceRecords,
    clearAuditLogs,
  } = useAttendance();

  const [search, setSearch] = useState('');
  const [churchName, setChurchName] = useState(settings.churchName);
  const [churchSubtitle, setChurchSubtitle] = useState(settings.churchSubtitle);
  const [churchAddress, setChurchAddress] = useState(settings.churchAddress);
  const [savedSettings, setSavedSettings] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);

  // Deletion modals state
  const [showResetModal, setShowResetModal] = useState(false);
  const [showClearRecordsModal, setShowClearRecordsModal] = useState(false);
  const [showClearLogsModal, setShowClearLogsModal] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const filteredLogs = auditLogs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q)
    );
  });

  const handleSaveChurchInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      churchName,
      churchSubtitle,
      churchAddress,
    });
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Church Organization Settings */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <span>Identitas & Logo Resmi Gereja</span>
          </h3>
          <button
            type="button"
            onClick={() => setShowLogoModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-bold transition cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Ganti Logo Gereja</span>
          </button>
        </div>

        {/* Logo Preview and Quick Change Card */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              onClick={() => setShowLogoModal(true)}
              className="relative w-16 h-16 rounded-2xl bg-slate-900 border-2 border-amber-500/50 p-1 flex items-center justify-center shrink-0 cursor-pointer shadow-md hover:border-amber-400 transition group"
              title="Klik untuk mengganti logo"
            >
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.churchName}
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <span className="text-2xl font-black text-amber-400">✝</span>
              )}
              <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <Camera className="w-4 h-4 text-amber-400" />
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-white">Logo Aktif Gereja</p>
              <p className="text-[11px] text-slate-400">
                Tampil di samping nama <strong>Gereja Toraja Jemaat Karambo</strong>, header aplikasi, poster presensi A4, dan cetak laporan resmi.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowLogoModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition cursor-pointer shrink-0"
          >
            Ganti / Upload Logo
          </button>
        </div>

        <form onSubmit={handleSaveChurchInfo} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Nama Resmi Gereja</label>
            <input
              type="text"
              required
              value={churchName}
              onChange={(e) => setChurchName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Klasis / Sinode / Wilayah</label>
              <input
                type="text"
                required
                value={churchSubtitle}
                onChange={(e) => setChurchSubtitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Alamat Gedung & Kantor</label>
              <input
                type="text"
                required
                value={churchAddress}
                onChange={(e) => setChurchAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedSettings ? (
              <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Identitas gereja berhasil disimpan!</span>
              </span>
            ) : <span />}

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition cursor-pointer"
            >
              Simpan Identitas Gereja
            </button>
          </div>
        </form>
      </div>

      {/* Security Audit Logs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span>Audit Log Keamanan & Aktivitas Sistem</span>
            </h3>
            <p className="text-xs text-slate-400">
              Merekam setiap login, transaksi presensi, perubahan jadwal, dan persetujuan izin secara transparan.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Cari aksi atau nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Pengguna</th>
                  <th className="py-3 px-4">Tindakan (Action)</th>
                  <th className="py-3 px-4">Rincian Aktivitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-white font-sans font-semibold">
                      {log.userName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Data Deletion & Management Danger Zone */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Manajemen Penghapusan & Reset Data</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Reset Total ke Bawaan */}
            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 flex flex-col justify-between space-y-3 text-xs">
              <div>
                <p className="font-bold text-rose-300">Reset Semua Data ke Awal</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Menghapus seluruh modifikasi browser lokal dan memulihkan data pegawai, jadwal, serta lokasi awal Gereja Toraja Jemaat Karambo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition cursor-pointer shadow-md shadow-rose-950/40"
              >
                Reset Data Bawaan
              </button>
            </div>

            {/* 2. Kosongkan Riwayat Presensi Saja */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-amber-900/40 flex flex-col justify-between space-y-3 text-xs">
              <div>
                <p className="font-bold text-amber-300">Kosongkan Riwayat Presensi</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Menghapus semua transaksi kehadiran presensi pagi & sore (data pegawai dan pengaturan tetap aman).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowClearRecordsModal(true)}
                className="w-full py-2.5 rounded-xl bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-slate-950 font-bold transition cursor-pointer border border-amber-600/40"
              >
                Hapus Semua Presensi
              </button>
            </div>

            {/* 3. Bersihkan Audit Log */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-3 text-xs">
              <div>
                <p className="font-bold text-slate-300">Bersihkan Audit Log</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Mengosongkan daftar log catatan aktivitas keamanan sistem sebelumnya.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowClearLogsModal(true)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer border border-slate-700"
              >
                Bersihkan Log
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Ganti Logo Gereja */}
      <ChangeLogoModal
        isOpen={showLogoModal}
        onClose={() => setShowLogoModal(false)}
      />

      {/* Confirmation Modals for Deletion Actions */}
      <ConfirmModal
        isOpen={showResetModal}
        title="Reset Seluruh Data Aplikasi?"
        message="Tindakan ini akan mengembalikan semua data pegawai, unit kerja, jadwal presensi, dan pengaturan ke data bawaan pabrik Gereja Toraja Jemaat Karambo. Data lokal yang diubah akan dihapus."
        confirmLabel="Ya, Reset Semua Data"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={() => {
          resetToDefaultData();
          setShowResetModal(false);
          setActionToast('Seluruh data aplikasi berhasil di-reset ke nilai awal!');
          setTimeout(() => setActionToast(null), 3500);
        }}
        onCancel={() => setShowResetModal(false)}
      />

      <ConfirmModal
        isOpen={showClearRecordsModal}
        title="Hapus Semua Riwayat Presensi?"
        message="Seluruh transaksi presensi kehadiran (pagi dan sore) yang tersimpan akan dikosongkan. Data akun pegawai dan jadwal tidak akan terhapus."
        confirmLabel="Ya, Kosongkan Presensi"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={() => {
          clearAttendanceRecords();
          setShowClearRecordsModal(false);
          setActionToast('Seluruh data riwayat presensi berhasil dikosongkan!');
          setTimeout(() => setActionToast(null), 3500);
        }}
        onCancel={() => setShowClearRecordsModal(false)}
      />

      <ConfirmModal
        isOpen={showClearLogsModal}
        title="Bersihkan Riwayat Audit Log?"
        message="Semua rekaman aktivitas sebelumnya dalam audit log akan dihapus."
        confirmLabel="Ya, Bersihkan Log"
        cancelLabel="Batal"
        isDestructive={false}
        onConfirm={() => {
          clearAuditLogs();
          setShowClearLogsModal(false);
          setActionToast('Audit log berhasil dibersihkan!');
          setTimeout(() => setActionToast(null), 3500);
        }}
        onCancel={() => setShowClearLogsModal(false)}
      />

      {/* Action Toast Notification */}
      {actionToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionToast}</span>
        </div>
      )}
    </div>
  );
};
