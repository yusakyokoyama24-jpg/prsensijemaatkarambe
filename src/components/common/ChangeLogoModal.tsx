import React, { useEffect, useRef, useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import {
  Camera,
  Check,
  CheckCircle2,
  Image as ImageIcon,
  RotateCcw,
  Upload,
  X,
  Sparkles,
  Trash2,
  RefreshCw,
} from 'lucide-react';

interface ChangeLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Built-in presets for Gereja Toraja Jemaat Karambe
export const CHURCH_LOGO_PRESETS = [
  {
    id: 'gt-official',
    title: 'Lambang Gereja Toraja Resmi',
    description: 'Logo Salib Emas, Alkitab Terbuka & Atap Tongkonan Toraja',
    svgUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23991b1b"/><stop offset="50%" stop-color="%231e1b4b"/><stop offset="100%" stop-color="%230f172a"/></linearGradient><linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23fef08a"/><stop offset="50%" stop-color="%23eab308"/><stop offset="100%" stop-color="%23ca8a04"/></linearGradient></defs><circle cx="100" cy="100" r="94" fill="url(%23bg)" stroke="url(%23gold)" stroke-width="4"/><path d="M45,130 Q100,165 155,130 Q100,150 45,130 Z" fill="url(%23gold)"/><path d="M55,95 Q100,60 145,95 L140,105 Q100,75 60,105 Z" fill="%23f8fafc" opacity="0.9"/><rect x="94" y="35" width="12" height="95" rx="3" fill="url(%23gold)"/><rect x="72" y="60" width="56" height="12" rx="3" fill="url(%23gold)"/><path d="M85,120 L100,108 L115,120 L115,128 L100,118 L85,128 Z" fill="%23f8fafc"/><circle cx="100" cy="40" r="4" fill="%23fef08a"/><text x="100" y="180" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23fef08a" text-anchor="middle" letter-spacing="1">GEREJA TORAJA</text></svg>`,
  },
  {
    id: 'karambe-sanctuary',
    title: 'Gedung Gereja Jemaat Karambe',
    description: 'Menara Salib Marun & Arsitektur Jemaat Karambe',
    svgUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%23991b1b"/><stop offset="50%" stop-color="%23b45309"/><stop offset="100%" stop-color="%230f172a"/></linearGradient><linearGradient id="roof" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23b91c1c"/><stop offset="100%" stop-color="%23991b1b"/></linearGradient></defs><circle cx="100" cy="100" r="94" fill="url(%23sky)" stroke="%23fbbf24" stroke-width="4"/><path d="M100,35 L40,110 L160,110 Z" fill="url(%23roof)"/><rect x="60" y="105" width="80" height="60" fill="%23f8fafc"/><rect x="42" y="65" width="24" height="100" fill="%23831843" rx="2"/><rect x="52" y="78" width="4" height="22" fill="%23ffffff"/><rect x="46" y="85" width="16" height="4" fill="%23ffffff"/><circle cx="100" cy="85" r="14" fill="%231e293b" stroke="%23fbbf24" stroke-width="2"/><text x="100" y="89" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23fbbf24" text-anchor="middle">✝</text><text x="100" y="182" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23ffffff" text-anchor="middle">JEMAAT KARAMBE</text></svg>`,
  },
  {
    id: 'gold-cross',
    title: 'Salib Emas Khidmat',
    description: 'Emblem Salib Klasik bersinar dalam lingkaran emas',
    svgUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23fef08a"/><stop offset="50%" stop-color="%23f59e0b"/><stop offset="100%" stop-color="%23b45309"/></linearGradient></defs><circle cx="100" cy="100" r="94" fill="%230f172a" stroke="url(%23gold)" stroke-width="5"/><rect x="92" y="35" width="16" height="120" rx="4" fill="url(%23gold)"/><rect x="60" y="65" width="80" height="16" rx="4" fill="url(%23gold)"/><circle cx="100" cy="100" r="28" fill="none" stroke="url(%23gold)" stroke-width="3" stroke-dasharray="3,3"/><text x="100" y="178" font-family="sans-serif" font-size="11" font-weight="bold" fill="url(%23gold)" text-anchor="middle" letter-spacing="2">KARAMBE</text></svg>`,
  },
  {
    id: 'tongkonan-cross',
    title: 'Tongkonan & Pelayanan Toraja',
    description: 'Perpaduan Salib Kasih dan Atap Rumah Adat Tongkonan',
    svgUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><linearGradient id="bgToraja" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%237f1d1d"/><stop offset="50%" stop-color="%231e1b4b"/><stop offset="100%" stop-color="%230f172a"/></linearGradient></defs><circle cx="100" cy="100" r="94" fill="url(%23bgToraja)" stroke="%23f59e0b" stroke-width="4"/><path d="M25,85 Q100,150 175,85 Q100,120 25,85 Z" fill="%23b45309"/><path d="M40,75 Q100,135 160,75 L155,70 Q100,125 45,70 Z" fill="%23f59e0b"/><rect x="94" y="25" width="12" height="130" rx="3" fill="%23ffffff"/><rect x="65" y="55" width="70" height="12" rx="3" fill="%23ffffff"/><text x="100" y="180" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23fcd34d" text-anchor="middle">JEMAAT KARAMBE</text></svg>`,
  },
];

export const ChangeLogoModal: React.FC<ChangeLogoModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useAttendance();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [selectedLogo, setSelectedLogo] = useState<string>(settings.logoUrl || CHURCH_LOGO_PRESETS[0].svgUrl);
  const [urlInput, setUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'CAMERA' | 'PRESETS' | 'URL'>('UPLOAD');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedLogo(settings.logoUrl || CHURCH_LOGO_PRESETS[0].svgUrl);
      setSaveSuccess(false);
      setCameraError(null);
    } else {
      stopCamera();
    }
  }, [isOpen, settings.logoUrl]);

  // Clean up camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (activeTab === 'CAMERA' && isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab, isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      try {
        // Fallback to any camera
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
      } catch (fallbackErr: any) {
        setCameraError('Tidak dapat mengakses kamera perangkat. Harap izinkan akses kamera atau gunakan upload file.');
        setCameraActive(false);
      }
    }
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth || 300, video.videoHeight || 300);
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const startX = (video.videoWidth - size) / 2;
      const startY = (video.videoHeight - size) / 2;
      ctx.drawImage(video, startX, startY, size, size, 0, 0, 256, 256);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedLogo(dataUrl);
      stopCamera();
      setActiveTab('UPLOAD');
    }
  };

  // Handle local file upload with canvas downscaling (prevents localStorage quota issues)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar yang valid (PNG, JPG, JPEG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      // If SVG, use directly
      if (file.type.includes('svg')) {
        setSelectedLogo(rawDataUrl);
        return;
      }

      // If raster image (JPEG/PNG/WebP), downscale to max 300x300 for crisp & lightweight storage
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 300;
        let w = img.width;
        let h = img.height;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressedDataUrl = canvas.toDataURL('image/png');
          setSelectedLogo(compressedDataUrl);
        } else {
          setSelectedLogo(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      setSelectedLogo(urlInput.trim());
      setUrlInput('');
    }
  };

  const handleSave = () => {
    updateSettings({
      logoUrl: selectedLogo,
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const handleResetDefault = () => {
    const defaultLogo = CHURCH_LOGO_PRESETS[0].svgUrl;
    setSelectedLogo(defaultLogo);
    updateSettings({
      logoUrl: defaultLogo,
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto no-print animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100 my-auto space-y-5 ring-1 ring-white/10">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Ganti Logo Gereja Toraja Jemaat Karambo
              </h3>
              <p className="text-xs text-slate-400">
                Pilih atau unggah logo kustom di samping nama gereja.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Section */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-900 border-2 border-amber-500/60 shadow-lg flex items-center justify-center shrink-0 p-1">
            {selectedLogo ? (
              <img
                src={selectedLogo}
                alt="Pratinjau Logo"
                className="w-full h-full object-contain rounded-xl"
              />
            ) : (
              <span className="text-2xl font-black text-amber-400">✝</span>
            )}
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
              Pratinjau Tampilan Header & Dokumen
            </span>
            <p className="text-sm font-bold text-white leading-tight truncate">
              {settings.churchName}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {settings.churchSubtitle}
            </p>
          </div>
        </div>

        {/* Option Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 text-xs overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('UPLOAD')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'UPLOAD'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white bg-slate-800/80'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CAMERA')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'CAMERA'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white bg-slate-800/80'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Foto Kamera</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PRESETS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'PRESETS'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white bg-slate-800/80'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pilihan Logo Toraja</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('URL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'URL'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white bg-slate-800/80'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Tautan URL</span>
          </button>
        </div>

        {/* Tab 1: File Upload */}
        {activeTab === 'UPLOAD' && (
          <div className="space-y-3 text-xs">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-2xl text-center space-y-2 cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">
                Klik di Sini untuk Memilih File Gambar Logo
              </p>
              <p className="text-slate-400 text-xs">
                Mendukung PNG transparan, JPG, JPEG, SVG, atau WebP dari galeri HP atau komputer.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Camera Photo Mode */}
        {activeTab === 'CAMERA' && (
          <div className="space-y-3 text-xs">
            {cameraError ? (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-center">
                <p>{cameraError}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-rose-800 text-white font-bold"
                >
                  Coba Akses Lagi
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <div className="relative w-64 h-64 mx-auto rounded-2xl overflow-hidden bg-black border border-slate-700 ring-2 ring-amber-500/40">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border-2 border-amber-400/50 rounded-2xl pointer-events-none m-4" />
                </div>
                <button
                  type="button"
                  onClick={captureCameraPhoto}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition cursor-pointer shadow-lg"
                >
                  Ambil Foto Logo Ini
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Preset Logos */}
        {activeTab === 'PRESETS' && (
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CHURCH_LOGO_PRESETS.map((preset) => {
                const isSelected = selectedLogo === preset.svgUrl;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedLogo(preset.svgUrl)}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 shadow-md ring-1 ring-amber-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                      <img src={preset.svgUrl} alt={preset.title} className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white text-xs leading-tight">{preset.title}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{preset.description}</p>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1 mt-1">
                          <Check className="w-3 h-3" /> Dipilih
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: URL Input */}
        {activeTab === 'URL' && (
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Masukkan URL Tautan Gambar Logo
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/logo-karambo.png"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold cursor-pointer"
                >
                  Terapkan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={handleResetDefault}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-white text-xs transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kembalikan Logo Awal</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition cursor-pointer shadow-lg shadow-amber-500/20"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Logo Berhasil Disimpan!</span>
                </>
              ) : (
                <span>Simpan Logo Baru</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
