import React, { useEffect, useRef, useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import QRCode from 'qrcode';
import {
  Copy,
  Download,
  ExternalLink,
  Printer,
  QrCode,
  Share2,
  Check,
  Smartphone,
  ShieldCheck,
  Camera,
  MapPin,
  Sparkles,
} from 'lucide-react';

export const AppDistribution: React.FC = () => {
  const { settings, setActivePortal } = useAttendance();

  // Employee Portal URL
  const staffAppUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/pegawai`
    : `${settings.appUrl}/pegawai`;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const posterCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [copied, setCopied] = useState(false);
  const [customUrl, setCustomUrl] = useState(staffAppUrl);
  const [qrGenerated, setQrGenerated] = useState(false);

  useEffect(() => {
    generateQRCodes(customUrl);
  }, [customUrl]);

  const generateQRCodes = async (url: string) => {
    try {
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, url, {
          width: 260,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        });
      }

      if (posterCanvasRef.current) {
        await QRCode.toCanvas(posterCanvasRef.current, url, {
          width: 320,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        });
      }
      setQrGenerated(true);
    } catch (err) {
      console.error('QR code generation error:', err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenStaffApp = () => {
    setActivePortal('EMPLOYEE');
  };

  const handleShareUrl = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Presensi Pegawai — ${settings.churchName}`,
          text: `Silakan akses Portal Presensi Pegawai Gereja melalui link berikut:`,
          url: customUrl,
        });
      } catch (err) {
        console.log('Share dismissed');
      }
    } else {
      handleCopy();
    }
  };

  const handleDownloadQrPng = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `QR_Presensi_${settings.churchName.replace(/\s+/g, '_')}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handlePrintPoster = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* ============================================================== */}
      {/* PRINT-ONLY OFFICIAL A4 CHURCH POSTER */}
      {/* ============================================================== */}
      <div className="print-only p-8 text-center bg-white text-slate-900 border-8 border-double border-slate-900 min-h-[90vh] flex flex-col justify-between">
        {/* Header */}
        <div>
          <div className="flex items-center justify-center gap-4 mb-2">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.churchName}
                className="w-16 h-16 object-contain rounded-xl"
              />
            ) : (
              <span className="text-5xl font-black text-slate-900">✝</span>
            )}
            <div className="text-left">
              <h1 className="text-2xl font-black tracking-wide uppercase leading-tight">
                {settings.churchName}
              </h1>
              <p className="text-sm font-bold text-slate-700">{settings.churchSubtitle}</p>
              <p className="text-xs text-slate-600">{settings.churchAddress}</p>
            </div>
          </div>
          <div className="w-full h-1 bg-slate-900 my-4" />
          <h2 className="text-2xl font-black tracking-wider uppercase text-slate-950">
            POSTER PRESENSI RESMI PEGAWAI GEREJA
          </h2>
          <p className="text-sm font-semibold text-slate-700 mt-1">
            Sistem Kehadiran Digital Berbasis GPS Geofencing & Foto Selfie
          </p>
        </div>

        {/* Center: Large QR Code */}
        <div className="my-6 flex flex-col items-center justify-center">
          <div className="p-4 bg-white border-4 border-slate-900 rounded-3xl shadow-xl">
            <canvas ref={posterCanvasRef} />
          </div>
          <p className="font-mono text-sm font-bold text-slate-900 mt-3 bg-slate-100 px-4 py-1 rounded-full border border-slate-300">
            {customUrl}
          </p>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            Pindai QR Code di atas menggunakan kamera HP Anda untuk membuka aplikasi.
          </p>
        </div>

        {/* 4 Steps Instructions */}
        <div className="grid grid-cols-4 gap-3 text-left my-4">
          <div className="p-3 border-2 border-slate-900 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center mb-1">
              1
            </div>
            <p className="font-bold text-xs">Pindai QR</p>
            <p className="text-[11px] text-slate-600">Buka kamera HP atau browser Safari / Chrome.</p>
          </div>

          <div className="p-3 border-2 border-slate-900 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center mb-1">
              2
            </div>
            <p className="font-bold text-xs">Masuk Akun</p>
            <p className="text-[11px] text-slate-600">Gunakan akun pribadi dan NIP terdaftar.</p>
          </div>

          <div className="p-3 border-2 border-slate-900 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center mb-1">
              3
            </div>
            <p className="font-bold text-xs">Cek GPS</p>
            <p className="text-[11px] text-slate-600">Pastikan Anda berada di area radius gereja.</p>
          </div>

          <div className="p-3 border-2 border-slate-900 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center mb-1">
              4
            </div>
            <p className="font-bold text-xs">Selfie & Kirim</p>
            <p className="text-[11px] text-slate-600">Ambil foto selfie langsung di depan gedung.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-slate-900 pt-3 text-xs text-slate-600 flex justify-between items-center">
          <span>Badan Pekerja Majelis Jemaat / Sekretariat Gereja</span>
          <span>Dapat dipasang di Layar Utama HP (Progressive Web App)</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SCREEN UI FOR ADMIN DISTRIBUTION */}
      {/* ============================================================== */}
      <div className="no-print space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <span>Distribusi Aplikasi Pegawai & Generator QR Code</span>
          </h2>
          <p className="text-xs text-slate-400">
            Bagikan link portal presensi kepada seluruh pegawai gereja atau cetak poster resmi untuk ditempel di papan pengumuman/pintu kantor gereja.
          </p>
        </div>

        {/* Top Cards: URL Generator */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm">
              Alamat URL Portal Pegawai
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              Aktif & Siap Dibagikan
            </span>
          </div>

          {/* URL Input with Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Salin URL */}
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Tersalin!' : 'Salin URL'}</span>
              </button>

              {/* Buka Aplikasi Pegawai */}
              <button
                type="button"
                onClick={handleOpenStaffApp}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer border border-slate-700"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka Aplikasi</span>
              </button>

              {/* Bagikan URL */}
              <button
                type="button"
                onClick={handleShareUrl}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs transition cursor-pointer border border-slate-700"
                title="Bagikan melalui WhatsApp / Aplikasi HP"
              >
                <Share2 className="w-4 h-4" />
                <span className="sm:hidden">Bagikan</span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            *Setiap pegawai yang membuka URL ini akan langsung diarahkan ke portal presensi dan dapat memasang aplikasi ke layar utama HP mereka (PWA).
          </p>
        </div>

        {/* Bottom Split: QR Code Preview + Print Poster */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* QR Code Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-sm">
              QR Code Portal Presensi Pegawai
            </h3>
            <p className="text-xs text-slate-400 max-w-xs">
              Pegawai cukup memindai QR Code ini menggunakan kamera HP untuk membuka sistem presensi.
            </p>

            {/* QR Code Canvas */}
            <div className="p-3 bg-white rounded-2xl shadow-xl ring-4 ring-amber-500/20">
              <canvas ref={canvasRef} className="rounded-lg" />
            </div>

            <div className="flex items-center gap-2 w-full pt-2">
              <button
                type="button"
                onClick={handleDownloadQrPng}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs transition cursor-pointer border border-slate-700"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Gambar QR (PNG)</span>
              </button>

              <button
                type="button"
                onClick={handlePrintPoster}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer border border-slate-700"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak QR Code</span>
              </button>
            </div>
          </div>

          {/* Official A4 Poster Preview Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Printer className="w-5 h-5" />
                <span>Poster Presensi Siap Cetak (Ukuran A4)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Poster resmi dengan kop surat gereja, QR Code resolusi tinggi, dan 4 petunjuk penggunaan selfie & GPS untuk ditempel di pintu masuk kantor gereja atau meja sekretariat.
              </p>

              {/* Poster Miniature Preview */}
              <div className="p-4 rounded-xl bg-white text-slate-950 border border-slate-300 space-y-2 text-center text-[10px] select-none opacity-90 shadow-inner">
                <div className="font-black text-xs uppercase tracking-wide">
                  ✝ {settings.churchName}
                </div>
                <div className="font-bold text-[9px] text-slate-600">
                  {settings.churchSubtitle}
                </div>
                <div className="py-2 flex justify-center">
                  <div className="w-16 h-16 bg-slate-900 rounded-lg flex items-center justify-center text-white text-[9px] font-mono">
                    [ QR CODE ]
                  </div>
                </div>
                <p className="font-bold text-[10px] text-amber-700">
                  1. Scan QR • 2. Login • 3. Cek GPS • 4. Selfie
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePrintPoster}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Unduh Poster A4 Gereja (PDF)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
