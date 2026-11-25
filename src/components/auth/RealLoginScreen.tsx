import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { FaceRecognitionResult } from '../../types';
import { TorajaHeaderStrip } from '../common/TorajaMotif';
import {
  ShieldCheck,
  User,
  KeyRound,
  LogIn,
  AlertCircle,
  Search,
  CheckCircle2,
  Users,
  Smartphone,
  Camera,
  Sparkles,
  RefreshCw,
  Scan,
} from 'lucide-react';

export const RealLoginScreen: React.FC = () => {
  const { users, login, loginByNip, settings, recognizeFace } = useAttendance();
  const [activeTab, setActiveTab] = useState<'directory' | 'face' | 'nip'>('directory');
  const [faceAnalyzing, setFaceAnalyzing] = useState(false);
  const [faceRecognizedUser, setFaceRecognizedUser] = useState<FaceRecognitionResult | null>(null);
  const [faceCamError, setFaceCamError] = useState<string | null>(null);
  const [faceCamActive, setFaceCamActive] = useState(false);
  const faceVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const faceStreamRef = React.useRef<MediaStream | null>(null);
  const faceFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [nipInput, setNipInput] = useState('');
  const [searchDirectory, setSearchDirectory] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);

  const startFaceCamera = async () => {
    setFaceCamError(null);
    setFaceRecognizedUser(null);
    try {
      if (faceStreamRef.current) {
        faceStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      faceStreamRef.current = mediaStream;
      if (faceVideoRef.current) {
        faceVideoRef.current.srcObject = mediaStream;
      }
      setFaceCamActive(true);
    } catch (err: any) {
      console.warn('Face camera error:', err);
      setFaceCamError('Kamera tidak dapat diakses secara otomatis. Silakan gunakan tombol Ambil Foto File di bawah.');
      setFaceCamActive(false);
    }
  };

  const stopFaceCamera = () => {
    if (faceStreamRef.current) {
      faceStreamRef.current.getTracks().forEach((t) => t.stop());
      faceStreamRef.current = null;
    }
    setFaceCamActive(false);
  };

  React.useEffect(() => {
    if (activeTab === 'face') {
      startFaceCamera();
    } else {
      stopFaceCamera();
    }
    return () => {
      stopFaceCamera();
    };
  }, [activeTab]);

  const captureAndRecognize = async () => {
    if (!faceVideoRef.current) return;
    const video = faceVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    processFaceRecognition(dataUrl);
  };

  const handleFaceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      processFaceRecognition(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const processFaceRecognition = async (dataUrl: string) => {
    setFaceAnalyzing(true);
    setFaceCamError(null);
    try {
      const result = await recognizeFace(dataUrl);
      setFaceRecognizedUser(result);
      if (result.matched && result.employee) {
        const empId = result.employee.id;
        setTimeout(() => {
          login(empId);
        }, 1500);
      } else {
        setFaceCamError('Wajah belum dapat dicocokkan dengan pegawai terdaftar. Coba posisikan wajah di tengah atau pilih nama dari daftar.');
      }
    } catch (err: any) {
      setFaceCamError('Gagal memproses pemindaian biometrik.');
    } finally {
      setFaceAnalyzing(false);
    }
  };

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

  const unitsList = [
    { id: 'ALL', label: 'Semua' },
    { id: 'PMG', label: 'PMG' },
    { id: 'Ketua Bidang', label: 'Ketua Bidang' },
    { id: 'Sekretariat', label: 'Tata Usaha' },
    { id: 'Musik', label: 'Liturgi & Musik' },
    { id: 'Koster', label: 'Koster' },
    { id: 'Multimedia', label: 'Multimedia' },
    { id: 'Diakonia', label: 'Diakonia' },
  ];

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchDirectory ||
      u.name.toLowerCase().includes(searchDirectory.toLowerCase()) ||
      u.nip.toLowerCase().includes(searchDirectory.toLowerCase()) ||
      u.department.toLowerCase().includes(searchDirectory.toLowerCase()) ||
      u.position.toLowerCase().includes(searchDirectory.toLowerCase());

    const matchesUnit =
      selectedUnit === 'ALL' ||
      u.department.toLowerCase().includes(selectedUnit.toLowerCase());

    return matchesSearch && matchesUnit;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-slate-100 flex flex-col justify-between">
      <TorajaHeaderStrip />

      <div className="flex-1 flex items-center justify-center p-3 sm:p-6">
        <div
          className="w-full max-w-lg bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl animate-fade-in"
          style={{
            boxShadow:
              '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(245, 158, 11, 0.1)',
          }}
        >
          {/* Header with Church Sacred Crimson & Gold Accent */}
          <div className="bg-gradient-to-r from-red-900 via-rose-800 to-amber-900 p-5 sm:p-6 text-center text-white border-b border-rose-500/30">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-950 border-2 border-amber-400 p-1 flex items-center justify-center shadow-xl mb-2.5 ring-4 ring-amber-500/20">
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
            <h1 className="text-base sm:text-lg font-black tracking-wide text-white uppercase drop-shadow">
              {settings.churchName}
            </h1>
            <p className="text-xs text-amber-200/90 font-medium mt-0.5">
              {settings.churchSubtitle}
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/50 border border-amber-400/30 text-[10px] text-amber-300 font-bold mt-2.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Silakan Pilih Nama Anda untuk Melakukan Presensi</span>
            </div>
          </div>

          {/* Navigation Tabs (3 Opsi: 1-Klik, Scan Wajah AI, NIP) */}
          <div className="grid grid-cols-3 p-1.5 bg-slate-950/70 border-b border-slate-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('directory');
                setError(null);
              }}
              className={`py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'directory'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Pilih Nama</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('face');
                setError(null);
              }}
              className={`py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'face'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-black'
                  : 'text-emerald-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Scan Wajah AI</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('nip');
                setError(null);
              }}
              className={`py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'nip'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Ketik NIP</span>
            </button>
          </div>

          {/* Tab 1 (Default): 1-Tap Employee Selection */}
          {activeTab === 'directory' && (
            <div className="p-4 sm:p-6 space-y-3.5">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchDirectory}
                  onChange={(e) => setSearchDirectory(e.target.value)}
                  placeholder="Ketik nama Anda atau unit kerja..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 shadow-inner"
                />
              </div>

              {/* Unit Filter Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                {unitsList.map((unit) => (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => setSelectedUnit(unit.id)}
                    className={`px-2.5 py-1 rounded-xl whitespace-nowrap font-semibold transition cursor-pointer ${
                      selectedUnit === unit.id
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {unit.label}
                  </button>
                ))}
              </div>

              {/* Employees List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-slate-950/40 rounded-2xl border border-slate-800">
                    <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">
                      Nama pegawai "{searchDirectory}" tidak ditemukan.
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Pastikan ejaan benar atau hubungi administrator untuk mendaftarkan nama Anda.
                    </p>
                  </div>
                ) : (
                  filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => login(u.id)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-left transition cursor-pointer group active:scale-99 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={u.avatar}
                          alt=""
                          className="w-11 h-11 rounded-xl object-cover ring-2 ring-slate-700 group-hover:ring-amber-400 shrink-0"
                        />
                        <div className="truncate">
                          <p className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 truncate">
                            {u.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {u.position}
                          </p>
                          <p className="text-[10px] text-amber-400/80 font-medium truncate">
                            NIP: {u.nip} • {u.department}
                          </p>
                        </div>
                      </div>
                      <div className="pl-2 shrink-0">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md group-hover:brightness-110">
                          <span>Pilih Saya</span>
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Device Memory Note */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                <Smartphone className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  Nama yang Anda pilih akan diingat di HP ini. Anda bisa mengganti nama kapan saja jika HP digunakan bersama.
                </span>
              </div>
            </div>
          )}

                    {/* Tab 2: AI Face Recognition Biometric Scan */}
          {activeTab === 'face' && (
            <div className="p-4 sm:p-6 space-y-4">
              <input
                type="file"
                ref={faceFileInputRef}
                accept="image/*"
                capture="user"
                onChange={handleFaceFileUpload}
                className="hidden"
              />

              <div className="relative aspect-square max-w-[260px] mx-auto rounded-3xl overflow-hidden bg-slate-950 border-2 border-emerald-500/40 shadow-2xl flex items-center justify-center">
                <video
                  ref={faceVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />

                {/* Face Scanning Animation Overlay */}
                <div className="absolute inset-4 border-2 border-dashed border-emerald-400/60 rounded-full pointer-events-none flex items-center justify-center">
                  <span className="text-[10px] text-emerald-300 font-bold bg-black/60 px-2 py-0.5 rounded-full">
                    Arahkan Wajah ke Sini
                  </span>
                </div>

                {faceAnalyzing && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
                    <div className="relative w-16 h-16 mb-2 flex items-center justify-center">
                      <div className="absolute inset-0 border-2 border-emerald-400 rounded-full animate-ping opacity-60"></div>
                      <div className="absolute inset-2 border-2 border-dashed border-amber-400 rounded-full animate-spin"></div>
                      <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" />
                    </div>
                    <p className="text-xs font-black text-white">Mengenali Wajah...</p>
                    <p className="text-[10px] text-emerald-300 mt-0.5">Membandingkan dengan database pegawai</p>
                  </div>
                )}

                {/* Success Recognition Overlay */}
                {faceRecognizedUser && faceRecognizedUser.matched && faceRecognizedUser.employee && (
                  <div className="absolute inset-0 bg-emerald-950/95 backdrop-blur-md p-4 flex flex-col items-center justify-center text-center animate-fade-in">
                    <img
                      src={faceRecognizedUser.employee.avatar}
                      alt=""
                      className="w-16 h-16 rounded-2xl object-cover ring-4 ring-emerald-400 mb-2 shadow-xl"
                    />
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40 mb-1">
                      Kecocokan: {faceRecognizedUser.confidence}%
                    </span>
                    <h3 className="text-sm font-black text-white">
                      {faceRecognizedUser.employee.name}
                    </h3>
                    <p className="text-[11px] text-emerald-200">
                      {faceRecognizedUser.employee.position}
                    </p>
                    <p className="text-[10px] text-emerald-400 mt-2 font-semibold">
                      ✓ Wajah Dikenali! Mengalihkan ke presensi...
                    </p>
                  </div>
                )}
              </div>

              {faceCamError && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{faceCamError}</span>
                </div>
              )}

              {/* Controls */}
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={faceAnalyzing || !faceCamActive}
                  onClick={captureAndRecognize}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:brightness-110 active:scale-98 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4 stroke-[2.5]" />
                  <span>Pindai Wajah Saya Sekarang</span>
                </button>

                <div className="flex items-center justify-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => faceFileInputRef.current?.click()}
                    className="text-slate-400 hover:text-amber-400 underline text-[11px] font-semibold cursor-pointer"
                  >
                    Gunakan Kamera Ponsel / Upload Foto
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={startFaceCamera}
                    className="text-slate-400 hover:text-white text-[11px] font-semibold cursor-pointer"
                  >
                    Aktifkan Ulang Kamera
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Manual NIP / Email Input */}
          {activeTab === 'nip' && (
            <form onSubmit={handleNipSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nomor Induk Pegawai (NIP) atau Email Resmi
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

          {/* Footer Card */}
          <div className="p-3.5 bg-slate-950/80 border-t border-slate-800/80 text-center text-[11px] text-slate-400">
            <span>Perlu bantuan atau belum terdaftar? Hubungi Sekretariat: </span>
            <strong className="text-slate-300">{settings.churchContact}</strong>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-3 text-center text-xs text-slate-500">
        <p className="text-[11px]">
          © {new Date().getFullYear()} {settings.churchName}. Sistem Presensi Real-Time.
        </p>
      </footer>
    </div>
  );
};
