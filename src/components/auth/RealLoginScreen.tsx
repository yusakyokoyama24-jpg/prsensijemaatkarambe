import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { TorajaHeaderStrip } from '../common/TorajaMotif';
import {
  ShieldCheck,
  User,
  KeyRound,
  LogIn,
  AlertCircle,
  Search,
  Building2,
  CheckCircle2,
} from 'lucide-react';

export const RealLoginScreen: React.FC = () => {
  const { users, login, loginByNip, settings } = useAttendance();
  const [activeTab, setActiveTab] = useState<'nip' | 'directory'>('nip');
  const [nipInput, setNipInput] = useState('');
  const [searchDirectory, setSearchDirectory] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleNipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nipInput.trim()) {
      setError('Silakan masukkan NIP atau Email resmi Anda.');
      return;
    }

    const success = loginByNip(nipInput.trim());
    if (!success) {
      setError('NIP atau Email tidak terdaftar dalam database kepegawaian gereja.');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchDirectory) return true;
    const q = searchDirectory.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.nip.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q) ||
      u.position.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-slate-100 flex flex-col justify-between">
      <TorajaHeaderStrip />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div
          className="w-full max-w-md bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl animate-fade-in"
          style={{
            boxShadow:
              '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(245, 158, 11, 0.1)',
          }}
        >
          {/* Header with Church Sacred Crimson & Gold Accent */}
          <div className="bg-gradient-to-r from-red-900 via-rose-800 to-amber-900 p-6 text-center text-white border-b border-rose-500/30">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-950 border-2 border-amber-400 p-1 flex items-center justify-center shadow-xl mb-3 ring-4 ring-amber-500/20">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.churchName}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-2xl font-black text-amber-400">✝</span>
              )}
            </div>
            <h1 className="text-base font-black tracking-wide text-white uppercase drop-shadow">
              {settings.churchName}
            </h1>
            <p className="text-xs text-amber-200/90 font-medium mt-0.5">
              {settings.churchSubtitle}
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/40 border border-amber-400/30 text-[10px] text-amber-300 font-bold mt-3">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Sistem Presensi & Kepegawaian Resmi</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-950/60 border-b border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('nip');
                setError(null);
              }}
              className={`py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'nip'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Masuk via NIP</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('directory');
                setError(null);
              }}
              className={`py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'directory'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Daftar Pegawai</span>
            </button>
          </div>

          {/* Tab 1: Form NIP */}
          {activeTab === 'nip' && (
            <form onSubmit={handleNipSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nomor Induk Pegawai (NIP) atau Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={nipInput}
                    onChange={(e) => {
                      setNipInput(e.target.value);
                      setError(null);
                    }}
                    placeholder="Contoh: PGR-2021-099 atau email Anda"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 shadow-inner"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Gunakan NIP yang telah didaftarkan oleh Majelis / Tata Usaha Gereja.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/60 border border-rose-700 text-rose-300 text-xs font-semibold animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:brightness-110 active:scale-98 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                <span>Masuk ke Akun Saya</span>
              </button>
            </form>
          )}

          {/* Tab 2: Direktori Pegawai */}
          {activeTab === 'directory' && (
            <div className="p-6 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchDirectory}
                  onChange={(e) => setSearchDirectory(e.target.value)}
                  placeholder="Cari nama, NIP, atau unit kerja..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {filteredUsers.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400">
                    Pegawai tidak ditemukan.
                  </p>
                ) : (
                  filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => login(u.id)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800/80 hover:border-amber-500/40 text-left transition cursor-pointer group"
                    >
                      <img
                        src={u.avatar}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-700 group-hover:ring-amber-400 shrink-0"
                      />
                      <div className="truncate flex-1">
                        <p className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                          {u.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {u.nip} • {u.position} ({u.department})
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                        Pilih
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Footer Card */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 text-center text-[11px] text-slate-400">
            <span>Butuh bantuan akun? Hubungi Sekretariat: </span>
            <strong className="text-slate-300">{settings.churchContact}</strong>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        <p className="text-[11px]">
          © {new Date().getFullYear()} {settings.churchName}. Hak Cipta Dilindungi.
        </p>
      </footer>
    </div>
  );
};
