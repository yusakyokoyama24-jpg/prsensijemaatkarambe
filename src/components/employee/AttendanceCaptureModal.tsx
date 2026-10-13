import React, { useEffect, useRef, useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { AttendanceLocation, SessionType } from '../../types';
import { calculateHaversineDistance, formatDistance, getDeviceCurrentLocation } from '../../utils/geo';
import { ChurchMap } from '../common/ChurchMap';
import confetti from 'canvas-confetti';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronRight,
  Compass,
  MapPin,
  RefreshCw,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react';

interface AttendanceCaptureModalProps {
  sessionType: SessionType;
  isOpen: boolean;
  onClose: () => void;
}

export const AttendanceCaptureModal: React.FC<AttendanceCaptureModalProps> = ({
  sessionType,
  isOpen,
  onClose,
}) => {
  const { currentUser, locations, schedule, submitAttendance, settings } = useAttendance();

  // Steps: 1 = GPS & Geofence, 2 = Selfie Camera, 3 = Confirmation / Receipt
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // GPS state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [targetLocation, setTargetLocation] = useState<AttendanceLocation | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);

  // Outside radius special request state
  const [isOutside, setIsOutside] = useState(false);
  const [outsideReason, setOutsideReason] = useState('');
  const [requestOutsideReview, setRequestOutsideReview] = useState(false);

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successRecord, setSuccessRecord] = useState<any | null>(null);

  // Initialize target church location
  useEffect(() => {
    if (locations.length > 0) {
      const main = locations.find((l) => l.isMainOffice && l.isActive) || locations[0];
      setTargetLocation(main);
    }
  }, [locations]);

  // Handle modal open: reset and auto-fetch GPS
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setGpsError(null);
      setPhotoBase64(null);
      setSuccessRecord(null);
      setSubmitError(null);
      setRequestOutsideReview(false);
      setOutsideReason('');
      handleFetchGps();
    } else {
      stopCamera();
    }
  }, [isOpen]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  // Start webcam when entering step 2
  useEffect(() => {
    if (step === 2 && !photoBase64) {
      startCamera();
    } else if (step !== 2) {
      stopCamera();
    }
  }, [step, photoBase64]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Selfie front camera
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });
      setStream(mediaStream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError(
        'Kamera perangkat tidak dapat diakses atau izin ditolak. Anda dapat menggunakan tombol simulasi selfie di bawah untuk pengujian.'
      );
    }
  };

  const takeSelfieSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror image for natural selfie feel
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Overlay timestamp & church watermark on photo
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`✝ ${settings.churchName}`, 15, canvas.height - 22);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.fillText(
      new Date().toLocaleString('id-ID', { timeZone: schedule.timezone }),
      15,
      canvas.height - 8
    );

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPhotoBase64(dataUrl);
    stopCamera();
  };

  // Simulation selfie for browser/desktop testing without front camera
  const handleSimulateSelfie = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 480, 480);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 480, 480);

    // Face avatar illustration
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(240, 190, 80, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(240, 400, 150, Math.PI, Math.PI * 2);
    ctx.fill();

    // Verified badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 420, 480, 60);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`PRESENSI SELFIE: ${currentUser?.name}`, 20, 445);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText(`${settings.churchName} • GPS VALID`, 20, 465);

    setPhotoBase64(canvas.toDataURL('image/jpeg', 0.85));
    stopCamera();
  };

  const handleFetchGps = async () => {
    setGpsLoading(true);
    setGpsError(null);
    try {
      const res = await getDeviceCurrentLocation();
      setGpsCoords(res);

      if (targetLocation) {
        const dist = calculateHaversineDistance(
          { latitude: res.latitude, longitude: res.longitude },
          { latitude: targetLocation.latitude, longitude: targetLocation.longitude }
        );
        setDistanceMeters(dist);
        setIsOutside(dist > targetLocation.radiusMeters);
      }
    } catch (err: any) {
      console.warn('Real GPS failed, using office proximity fallback:', err.message);
      setGpsError(err.message);
    } finally {
      setGpsLoading(false);
    }
  };

  // Helper to simulate positioning right at the church (for testing)
  const handleSimulateAtChurch = () => {
    if (!targetLocation) return;
    const simCoords = {
      latitude: targetLocation.latitude + 0.0001, // ~11 meters away
      longitude: targetLocation.longitude + 0.0001,
      accuracy: 5,
    };
    setGpsCoords(simCoords);
    const dist = calculateHaversineDistance(
      { latitude: simCoords.latitude, longitude: simCoords.longitude },
      { latitude: targetLocation.latitude, longitude: targetLocation.longitude }
    );
    setDistanceMeters(dist);
    setIsOutside(false);
    setGpsError(null);
  };

  // Helper to simulate positioning far from church (to test geofence rejection)
  const handleSimulateFarAway = () => {
    if (!targetLocation) return;
    const simCoords = {
      latitude: targetLocation.latitude + 0.008, // ~900 meters away
      longitude: targetLocation.longitude + 0.008,
      accuracy: 10,
    };
    setGpsCoords(simCoords);
    const dist = calculateHaversineDistance(
      { latitude: simCoords.latitude, longitude: simCoords.longitude },
      { latitude: targetLocation.latitude, longitude: targetLocation.longitude }
    );
    setDistanceMeters(dist);
    setIsOutside(true);
    setGpsError(null);
  };

  const handleFinalSubmit = async () => {
    if (!currentUser || !gpsCoords || !photoBase64) return;
    setSubmitting(true);
    setSubmitError(null);

    const result = await submitAttendance({
      employeeId: currentUser.id,
      sessionType,
      coords: gpsCoords,
      photoBase64,
      locationId: targetLocation?.id,
      forceOutsideReview: requestOutsideReview,
      outsideReason,
    });

    setSubmitting(false);

    if (result.success && result.record) {
      setSuccessRecord(result.record);
      setStep(3);
      // Trigger joyful confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#3b82f6', '#10b981'],
        });
      } catch (e) {
        // Confetti fallback
      }
    } else {
      setSubmitError(result.error || 'Terjadi kesalahan saat memvalidasi presensi.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fade-in no-print">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Presensi {sessionType === 'MORNING' ? 'Pagi (Mulai Tugas)' : 'Siang/Sore (Selesai Tugas)'}
              </h2>
              <p className="text-xs text-slate-400">
                {currentUser?.name} • NIP: {currentUser?.nip}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-950/40 border-b border-slate-800/60 text-xs">
          <div
            className={`flex items-center gap-1.5 ${
              step >= 1 ? 'text-amber-400 font-bold' : 'text-slate-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center border text-[11px] border-current">
              1
            </span>
            <span>Validasi GPS</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600" />
          <div
            className={`flex items-center gap-1.5 ${
              step >= 2 ? 'text-amber-400 font-bold' : 'text-slate-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center border text-[11px] border-current">
              2
            </span>
            <span>Selfie Wajah</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600" />
          <div
            className={`flex items-center gap-1.5 ${
              step >= 3 ? 'text-emerald-400 font-bold' : 'text-slate-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center border text-[11px] border-current">
              3
            </span>
            <span>Bukti Presensi</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* STEP 1: GPS & GEOFENCING VALIDATION */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Target Location Card */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Titik Presensi Resmi
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                    Radius Maks: {targetLocation?.radiusMeters || 100} m
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-white">{targetLocation?.name}</p>
                    <p className="text-xs text-slate-400">{targetLocation?.address}</p>
                  </div>
                </div>
              </div>

              {/* GPS Status Box */}
              {gpsLoading ? (
                <div className="flex flex-col items-center justify-center py-8 bg-slate-950/40 rounded-xl border border-slate-800 text-center">
                  <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mb-3" />
                  <p className="text-sm font-semibold text-white">Membaca Koordinat GPS Perangkat...</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Pastikan GPS HP Anda aktif dan izin lokasi diizinkan.
                  </p>
                </div>
              ) : gpsCoords && distanceMeters !== null ? (
                <div className="space-y-3">
                  <div
                    className={`p-4 rounded-xl border ${
                      isOutside
                        ? 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                        : 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isOutside ? (
                        <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-bold">
                          {isOutside ? 'DI LUAR AREA RADIUS GEREJA' : 'LOKASI VALID DI DALAM RADIUS'}
                        </p>
                        <p className="text-xs opacity-90 mt-0.5">
                          Jarak Anda saat ini: <strong>{formatDistance(distanceMeters)}</strong> dari kantor gereja (Batas: {targetLocation?.radiusMeters}m). Akurasi GPS: ±{gpsCoords.accuracy}m.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Leaflet Map Preview */}
                  {targetLocation && (
                    <div className="rounded-xl overflow-hidden border border-slate-800 shadow-md">
                      <ChurchMap
                        centerLat={targetLocation.latitude}
                        centerLng={targetLocation.longitude}
                        radiusMeters={targetLocation.radiusMeters}
                        userCoords={gpsCoords}
                        churchName={targetLocation.name}
                        className="h-44 w-full"
                      />
                    </div>
                  )}

                  {/* Outside Radius Warning & Special Justification Form */}
                  {isOutside && (
                    <div className="p-3.5 bg-amber-950/20 border border-amber-800/50 rounded-xl text-xs space-y-2">
                      <p className="font-semibold text-amber-300">
                        Peringatan: Tombol presensi normal dinonaktifkan di luar area.
                      </p>
                      <p className="text-slate-300">
                        Silakan mendekat ke area kantor gereja, atau ajukan izin khusus jika Anda sedang bertugas luar / dinas jemaat.
                      </p>

                      <label className="flex items-center gap-2 pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={requestOutsideReview}
                          onChange={(e) => setRequestOutsideReview(e.target.checked)}
                          className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-slate-200 font-medium">
                          Ajukan presensi khusus di luar area (perlu persetujuan admin)
                        </span>
                      </label>

                      {requestOutsideReview && (
                        <input
                          type="text"
                          value={outsideReason}
                          onChange={(e) => setOutsideReason(e.target.value)}
                          placeholder="Tulis alasan (cth: Melayani sakramen di rumah sakit / dinas sinode)"
                          className="w-full mt-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center space-y-3">
                  <Compass className="w-8 h-8 text-amber-400 mx-auto opacity-70" />
                  <p className="text-xs text-slate-300">
                    Sistem perlu membaca koordinat GPS perangkat untuk memvalidasi posisi Anda di gereja.
                  </p>
                  {gpsError && (
                    <p className="text-xs text-rose-400 bg-rose-950/30 p-2 rounded-lg border border-rose-900">
                      {gpsError}
                    </p>
                  )}
                  <button
                    onClick={handleFetchGps}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition cursor-pointer"
                  >
                    Ambil Lokasi Saya Sekarang
                  </button>
                </div>
              )}

              {/* Dev / Simulation Quick Helpers for testing inside and outside radius */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Simulasi Lokasi (Pengujian):</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSimulateAtChurch}
                    className="px-2.5 py-1 rounded bg-slate-800 text-emerald-400 hover:bg-slate-700 transition"
                  >
                    ✓ Di Gereja (11m)
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulateFarAway}
                    className="px-2.5 py-1 rounded bg-slate-800 text-rose-400 hover:bg-slate-700 transition"
                  >
                    ✗ Di Luar Area (900m)
                  </button>
                </div>
              </div>

              {/* Next Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={!gpsCoords || (isOutside && (!requestOutsideReview || !outsideReason.trim()))}
                  onClick={() => setStep(2)}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition cursor-pointer ${
                    !gpsCoords || (isOutside && (!requestOutsideReview || !outsideReason.trim()))
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20'
                  }`}
                >
                  <span>Lanjut ke Ambil Foto Selfie</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: LIVE SELFIE CAMERA */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Camera Container */}
              <div className="relative aspect-square w-full max-w-[340px] mx-auto rounded-2xl overflow-hidden bg-slate-950 border-2 border-amber-500/40 shadow-inner flex items-center justify-center">
                {photoBase64 ? (
                  /* Captured Photo Preview */
                  <div className="relative w-full h-full">
                    <img
                      src={photoBase64}
                      alt="Pratinjau Selfie"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-emerald-500/80 text-white text-[10px] font-bold tracking-wide uppercase backdrop-blur-sm">
                      ✓ Foto Siap Dikirim
                    </div>
                  </div>
                ) : (
                  /* Live Camera Video */
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover -scale-x-100"
                    />

                    {/* Camera Active Indicator Light */}
                    {cameraActive && (
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-emerald-500/40 text-[10px] text-emerald-400 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>Kamera Aktif</span>
                      </div>
                    )}

                    {/* Face Guide Oval */}
                    <div className="absolute inset-8 border-2 border-dashed border-amber-400/60 rounded-full pointer-events-none flex items-center justify-center">
                      <span className="text-[11px] text-amber-300/80 bg-black/40 px-2 py-0.5 rounded-full">
                        Posisikan Wajah di Sini
                      </span>
                    </div>

                    {cameraError && (
                      <div className="absolute inset-0 bg-slate-950/90 p-4 flex flex-col items-center justify-center text-center">
                        <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
                        <p className="text-xs text-slate-300 leading-relaxed mb-3">
                          {cameraError}
                        </p>
                        <button
                          type="button"
                          onClick={handleSimulateSelfie}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition"
                        >
                          Gunakan Foto Simulasi Pegawai
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex items-center justify-center gap-3">
                {photoBase64 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoBase64(null);
                      startCamera();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Ambil Ulang Foto</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={takeSelfieSnapshot}
                      disabled={!cameraActive}
                      className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-95 transition cursor-pointer disabled:opacity-50"
                    >
                      <Camera className="w-5 h-5" />
                      <span>Ambil Selfie</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSimulateSelfie}
                      title="Gunakan simulasi jika webcam perangkat tidak tersedia"
                      className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-xs hover:text-white hover:bg-slate-700 transition"
                    >
                      Simulasi Selfie
                    </button>
                  </>
                )}
              </div>

              {/* Error Message if submit fails */}
              {submitError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
                >
                  Kembali ke GPS
                </button>

                <button
                  type="button"
                  disabled={!photoBase64 || submitting}
                  onClick={handleFinalSubmit}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition cursor-pointer ${
                    !photoBase64 || submitting
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
                  }`}
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Memvalidasi ke Server...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        Kirim Presensi {sessionType === 'MORNING' ? 'Pagi' : 'Siang/Sore'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DIGITAL VERIFICATION RECEIPT */}
          {step === 3 && successRecord && (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">
                  Presensi Berhasil Dicatat!
                </h3>
                <p className="text-xs text-slate-400">
                  Data kehadiran Anda telah diverifikasi oleh server secara real-time.
                </p>
              </div>

              {/* Digital Card Receipt */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left space-y-3 shadow-inner">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="" className="w-5 h-5 object-contain rounded-md" />
                    ) : (
                      <span className="text-base text-amber-400 font-bold">✝</span>
                    )}
                    <span className="text-xs font-bold text-slate-300 uppercase">
                      BUKTI KEHADIRAN DIGITAL
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      successRecord.status === 'ON_TIME'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : successRecord.status === 'LATE'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    }`}
                  >
                    {successRecord.status === 'ON_TIME'
                      ? 'Tepat Waktu'
                      : successRecord.status === 'LATE'
                      ? `Terlambat (${successRecord.latenessMinutes}m)`
                      : 'Menunggu Pemeriksaan'}
                  </span>
                </div>

                <div className="flex gap-3">
                  <img
                    src={successRecord.photoUrl}
                    alt="Selfie"
                    className="w-20 h-20 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
                  />
                  <div className="text-xs space-y-1 truncate">
                    <p className="font-bold text-white truncate">{successRecord.employeeName}</p>
                    <p className="text-slate-400 text-[11px]">NIP: {successRecord.employeeNip}</p>
                    <p className="text-slate-400 text-[11px] truncate">{successRecord.department}</p>
                    <p className="text-amber-400 font-mono text-[11px] font-semibold">
                      {successRecord.localTimeStr}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Titik Lokasi:</span>
                    <span className="text-slate-200 font-medium truncate max-w-[180px]">
                      {successRecord.locationName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jarak Geodesik:</span>
                    <span className="text-slate-200 font-medium font-mono">
                      {Math.round(successRecord.distanceMeters)} meter (Akurasi: ±{successRecord.gpsAccuracy}m)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kode Transaksi:</span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {successRecord.id}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 transition cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
