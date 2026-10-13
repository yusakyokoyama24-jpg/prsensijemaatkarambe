import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { SessionType } from '../../types';
import { formatIndonesianDate, getCurrentDateStr } from '../../utils/time';
import { AttendanceCaptureModal } from './AttendanceCaptureModal';
import { AttendanceHistory } from './AttendanceHistory';
import { CorrectionRequestModal } from './CorrectionRequestModal';
import { LeaveRequestModal } from './LeaveRequestModal';
import { ChangePhotoModal } from './ChangePhotoModal';
import { OvertimeRequestModal } from './OvertimeRequestModal';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  FileText,
  MapPin,
  Shield,
  Smartphone,
  Sun,
  Sunset,
  User,
  AlertTriangle,
  Sparkles,
  Camera,
  Compass,
  RefreshCw,
} from 'lucide-react';

import { TorajaChurchBanner } from '../common/TorajaMotif';
import { ChurchMap } from '../common/ChurchMap';
import { calculateHaversineDistance, formatDistance, getDeviceCurrentLocation } from '../../utils/geo';

export const EmployeeDashboard: React.FC = () => {
  const { currentUser, schedule, getTodayRecord, settings, locations } = useAttendance();

  const [activeTab, setActiveTab] = useState<'HOME' | 'HISTORY'>('HOME');
  const [captureSession, setCaptureSession] = useState<SessionType | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showOvertimeModal, setShowOvertimeModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-4">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Silakan Masuk ke Akun Pegawai</h2>
        <p className="text-xs text-slate-400 mt-2">
          Pilih salah satu profil pegawai di sudut kanan atas untuk mulai menggunakan portal presensi.
        </p>
      </div>
    );
  }

  const todayStr = getCurrentDateStr(schedule.timezone);
  const morningRecord = getTodayRecord(currentUser.id, 'MORNING');
  const afternoonRecord = getTodayRecord(currentUser.id, 'AFTERNOON');

  const mainLocation = locations.find((l) => l.isActive) || locations[0];

  const [gpsLoading, setGpsLoading] = React.useState(false);
  const [userCoords, setUserCoords] = React.useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [gpsError, setGpsError] = React.useState<string | null>(null);
  const [distanceMeters, setDistanceMeters] = React.useState<number | null>(null);

  React.useEffect(() => {
    handleFetchLiveGps();
  }, [mainLocation?.id]);

  const handleFetchLiveGps = async () => {
    setGpsLoading(true);
    setGpsError(null);
    try {
      const res = await getDeviceCurrentLocation();
      setUserCoords(res);
      if (mainLocation) {
        const dist = calculateHaversineDistance(
          { latitude: res.latitude, longitude: res.longitude },
          { latitude: mainLocation.latitude, longitude: mainLocation.longitude }
        );
        setDistanceMeters(dist);
      }
    } catch (err: any) {
      console.warn('Live GPS fetch error:', err);
      setGpsError(err.message);
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSimulateAtChurch = () => {
    if (!mainLocation) return;
    const sim = { latitude: mainLocation.latitude + 0.0001, longitude: mainLocation.longitude + 0.0001, accuracy: 5 };
    setUserCoords(sim);
    setDistanceMeters(calculateHaversineDistance(sim, mainLocation));
    setGpsError(null);
  };

  const handleSimulateFar = () => {
    if (!mainLocation) return;
    const sim = { latitude: mainLocation.latitude + 0.008, longitude: mainLocation.longitude + 0.008, accuracy: 10 };
    setUserCoords(sim);
    setDistanceMeters(calculateHaversineDistance(sim, mainLocation));
    setGpsError(null);
  };

  const isPMG = currentUser.department?.includes('PMG');
  const isKetuaBidang = currentUser.department?.includes('Ketua Bidang');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Toraja Church Template Full-Colour Hero Banner */}
      <TorajaChurchBanner
        churchName={settings.churchName}
        subtitle={settings.churchSubtitle}
        badge="Presensi Pegawai & Pelayan Jemaat"
      />

      {/* Employee Profile Header Card with Toraja Sacred Accents - Borderless / Brighter Full-Colour */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-900/60 via-slate-900/90 to-amber-900/60 p-6 sm:p-7 shadow-2xl shadow-amber-950/20">
        {/* Subtle background church emblem */}
        <div className="absolute -right-8 -bottom-10 opacity-10 pointer-events-none select-none">
          <span className="text-[180px] font-black text-amber-400">✝</span>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => setShowPhotoModal(true)} title="Klik untuk ganti foto profil">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-amber-400 shadow-xl shrink-0 group-hover:brightness-110 transition"
              />
              <div className="absolute inset-0 rounded-2xl bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <Camera className="w-6 h-6 text-amber-300 drop-shadow" />
              </div>
              <span
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center shadow"
                title="Akun Aktif"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  {currentUser.name}
                </h1>
                {isPMG && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-sm">
                    PMG
                  </span>
                )}
                {isKetuaBidang && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-sm">
                    Ketua Bidang
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-amber-300">
                {currentUser.position}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span className="font-medium text-slate-400">Unit Pelayanan:</span>
                <span className="font-bold text-white bg-slate-950/60 px-2 py-0.5 rounded-md">
                  {currentUser.department}
                </span>
                <button
                  onClick={() => setShowPhotoModal(true)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline font-semibold ml-1 cursor-pointer"
                >
                  Ubah Foto
                </button>
              </div>
              </div>
            </div>

          {/* Today's date pill */}
          <div className="bg-slate-950/80 rounded-2xl p-4 text-left sm:text-right shrink-0 shadow-lg">
            <div className="flex items-center sm:justify-end gap-1.5 text-amber-300 text-xs font-black">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{formatIndonesianDate(todayStr, schedule.timezone)}</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              Zona Waktu: <strong className="text-amber-400 font-bold">{schedule.timezoneLabel} (Waktu Lokal)</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs with Varied, Artistic & Luxurious Gradients */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('HOME')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'HOME'
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-200/50 scale-105'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Presensi Hari Ini</span>
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'HISTORY'
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg shadow-emerald-900/40 border border-emerald-400/50 scale-105'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Riwayat & Pengajuan</span>
          </button>
        </div>

        {/* Quick action navigation buttons with varied artistic luxurious gradients */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOvertimeModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-900/80 to-violet-900/80 border border-purple-700/60 hover:border-purple-500 text-purple-200 hover:text-white text-xs font-bold shadow-md shadow-purple-950/40 transition cursor-pointer"
            title="Ajukan Lembur Kerja"
          >
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Ajukan</span> Lembur
          </button>

          <button
            onClick={() => setShowLeaveModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-900/80 to-red-900/80 border border-rose-700/60 hover:border-rose-500 text-rose-200 hover:text-white text-xs font-bold shadow-md shadow-rose-950/40 transition cursor-pointer"
            title="Ajukan Izin atau Cuti"
          >
            <FileText className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Ajukan</span> Izin/Cuti
          </button>

          <button
            onClick={() => setShowCorrectionModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-900/80 to-sky-900/80 border border-cyan-700/60 hover:border-cyan-500 text-cyan-200 hover:text-white text-xs font-bold shadow-md shadow-cyan-950/40 transition cursor-pointer"
            title="Koreksi Catatan Presensi"
          >
            <Edit3 className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Koreksi Presensi</span>
          </button>
        </div>
      </div>

      {activeTab === 'HOME' ? (
        <div className="space-y-6">
          {/* REAL-TIME LEAFLET MAP VISUAL CARD */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Peta Real-Time & Validasi Geofence Lokasi Anda
                  </h3>
                  <p className="text-xs text-slate-400">
                    Menampilkan posisi GPS perangkat Anda secara real-time terhadap titik pusat gereja.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleFetchLiveGps}
                  disabled={gpsLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition cursor-pointer shadow"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                  <span>Perbarui GPS</span>
                </button>
              </div>
            </div>

            {/* GPS Status / Distance alert */}
            {userCoords && distanceMeters !== null && mainLocation && (
              <div
                className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                  distanceMeters <= mainLocation.radiusMeters
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                    : 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {distanceMeters <= mainLocation.radiusMeters ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  )}
                  <div>
                    <p className="font-bold">
                      {distanceMeters <= mainLocation.radiusMeters
                        ? 'Anda berada di DALAM area radius presensi gereja'
                        : 'Anda berada di LUAR area radius presensi gereja'}
                    </p>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      Jarak dari {mainLocation.name}: <strong>{formatDistance(distanceMeters)}</strong> (Batas: {mainLocation.radiusMeters}m). Akurasi GPS: ±{userCoords.accuracy}m.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {gpsError && (
              <div className="p-3 bg-rose-950/40 border border-rose-900 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{gpsError} (Gunakan simulasi lokasi di bawah jika diperlukan)</span>
              </div>
            )}

            {/* Leaflet Map */}
            {mainLocation && (
              <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-md">
                <ChurchMap
                  centerLat={mainLocation.latitude}
                  centerLng={mainLocation.longitude}
                  radiusMeters={mainLocation.radiusMeters}
                  userCoords={userCoords || undefined}
                  churchName={mainLocation.name}
                  className="h-64 sm:h-72 w-full"
                />
              </div>
            )}

            {/* Simulation Quick Toolbar */}
            <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400 gap-2">
              <span className="font-semibold text-slate-300">Simulasi Posisi GPS (Pengujian):</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSimulateAtChurch}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-400 hover:bg-slate-700 transition font-medium cursor-pointer"
                >
                  ✓ Di Dalam Area (11m)
                </button>
                <button
                  type="button"
                  onClick={handleSimulateFar}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-rose-400 hover:bg-slate-700 transition font-medium cursor-pointer"
                >
                  ✗ Di Luar Area (900m)
                </button>
              </div>
            </div>
          </div>

          {/* TWO DAILY ATTENDANCE SESSION CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. MORNING SESSION CARD */}
            <div
              className={`rounded-3xl p-5 sm:p-6 border-2 transition flex flex-col justify-between ${
                morningRecord
                  ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-teal-950/30 border-emerald-500/60 shadow-xl shadow-emerald-950/30'
                  : 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-orange-950/30 border-amber-500/50 shadow-xl shadow-amber-950/20 hover:border-amber-400'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center justify-center">
                      <Sun className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-white">Presensi Pagi</h2>
                      <p className="text-xs text-amber-300/90 font-medium">Mulai Jam Pelayanan</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[11px] font-black px-3 py-1 rounded-full shadow-sm ${
                      morningRecord
                        ? morningRecord.status === 'ON_TIME'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : morningRecord.status === 'LATE'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {morningRecord
                      ? morningRecord.status === 'ON_TIME'
                        ? '✓ Tepat Waktu'
                        : morningRecord.status === 'LATE'
                        ? `Terlambat (${morningRecord.latenessMinutes}m)`
                        : 'Di Luar Area'
                      : 'Belum Presensi'}
                  </span>
                </div>

                {/* Schedule details */}
                <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Masuk:</span>
                    <span className="font-bold text-amber-300 font-mono">
                      {schedule.morningTarget} {schedule.timezoneLabel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Toleransi Keterlambatan:</span>
                    <span className="text-slate-200 font-mono">
                      {schedule.morningToleranceMinutes} menit
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Batas Waktu Pagi:</span>
                    <span className="text-slate-300 font-mono">
                      {schedule.morningEnd} {schedule.timezoneLabel}
                    </span>
                  </div>
                </div>

                {/* If already submitted */}
                {morningRecord && (
                  <div className="flex items-center gap-3 bg-emerald-950/40 border border-emerald-800/80 p-3 rounded-xl text-xs shadow">
                    <img
                      src={morningRecord.photoUrl}
                      alt="Selfie"
                      className="w-12 h-12 rounded-lg object-cover ring-2 ring-emerald-400 shrink-0"
                    />
                    <div className="text-[11px] space-y-0.5">
                      <p className="font-bold text-emerald-300">
                        Tercatat: {morningRecord.localTimeStr}
                      </p>
                      <p className="text-slate-300">
                        Jarak GPS: {Math.round(morningRecord.distanceMeters)}m dari gereja
                      </p>
                      <p className="text-slate-400 font-mono truncate max-w-[170px]">
                        ID: {morningRecord.id}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-4">
                {morningRecord ? (
                  <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-950/50 border border-emerald-700 text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Presensi Pagi Telah Terverifikasi</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setCaptureSession('MORNING')}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 hover:brightness-110 active:scale-98 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sun className="w-4 h-4 stroke-[2.5]" />
                    <span>Ambil Presensi Pagi (GPS + Selfie)</span>
                  </button>
                )}
              </div>
            </div>

            {/* 2. AFTERNOON SESSION CARD */}
            <div
              className={`rounded-3xl p-5 sm:p-6 border-2 transition flex flex-col justify-between ${
                afternoonRecord
                  ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-teal-950/30 border-emerald-500/60 shadow-xl shadow-emerald-950/30'
                  : 'bg-gradient-to-br from-indigo-950/40 via-slate-900 to-purple-950/30 border-indigo-500/50 shadow-xl shadow-indigo-950/20 hover:border-indigo-400'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/20 flex items-center justify-center">
                      <Sunset className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-white">Presensi Siang / Sore</h2>
                      <p className="text-xs text-indigo-300 font-medium">Selesai Jam Pelayanan</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[11px] font-black px-3 py-1 rounded-full shadow-sm ${
                      afternoonRecord
                        ? afternoonRecord.status === 'ON_TIME'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    }`}
                  >
                    {afternoonRecord ? '✓ Selesai Tugas' : 'Belum Presensi'}
                  </span>
                </div>

                {/* Schedule details */}
                <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mulai Presensi Sore:</span>
                    <span className="font-bold text-indigo-300 font-mono">
                      {schedule.afternoonStart} {schedule.timezoneLabel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Selesai Tugas:</span>
                    <span className="font-bold text-indigo-300 font-mono">
                      {schedule.afternoonTarget} {schedule.timezoneLabel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Batas Akhir Sore:</span>
                    <span className="text-slate-300 font-mono">
                      {schedule.afternoonEnd} {schedule.timezoneLabel}
                    </span>
                  </div>
                </div>

                {/* If already submitted */}
                {afternoonRecord && (
                  <div className="flex items-center gap-3 bg-emerald-950/40 border border-emerald-800/80 p-3 rounded-xl text-xs shadow">
                    <img
                      src={afternoonRecord.photoUrl}
                      alt="Selfie"
                      className="w-12 h-12 rounded-lg object-cover ring-2 ring-emerald-400 shrink-0"
                    />
                    <div className="text-[11px] space-y-0.5">
                      <p className="font-bold text-emerald-300">
                        Tercatat: {afternoonRecord.localTimeStr}
                      </p>
                      <p className="text-slate-300">
                        Jarak GPS: {Math.round(afternoonRecord.distanceMeters)}m dari gereja
                      </p>
                      <p className="text-slate-400 font-mono truncate max-w-[170px]">
                        ID: {afternoonRecord.id}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-4">
                {afternoonRecord ? (
                  <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-950/50 border border-emerald-700 text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Presensi Sore Telah Terverifikasi</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setCaptureSession('AFTERNOON')}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 text-white font-black text-sm shadow-xl shadow-purple-500/25 hover:brightness-110 active:scale-98 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sunset className="w-4 h-4 stroke-[2.5]" />
                    <span>Ambil Presensi Sore (GPS + Selfie)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Guidelines Box */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Ketentuan Presensi Pegawai Gereja
            </h3>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>
                Presensi wajib dilakukan di dalam area radius <strong>{mainLocation?.radiusMeters} meter</strong> dari kantor/gedung gereja.
              </li>
              <li>
                Foto selfie diambil secara langsung melalui kamera depan aplikasi (bukan unggahan galeri).
              </li>
              <li>
                Sistem secara otomatis mencegah pengiriman presensi ganda pada tanggal dan sesi yang sama.
              </li>
              <li>
                Jika Anda memiliki tugas luar atau dinas jemaat, gunakan menu <strong>"Ajukan Izin / Cuti"</strong> terlebih dahulu.
              </li>
            </ul>
          </div>
        </div>
      ) : (
        /* History & Requests Tab */
        <AttendanceHistory />
      )}

      {/* Attendance Capture Modal */}
      {captureSession && (
        <AttendanceCaptureModal
          sessionType={captureSession}
          isOpen={!!captureSession}
          onClose={() => setCaptureSession(null)}
        />
      )}

      {/* Leave Request Modal */}
      <LeaveRequestModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
      />

      {/* Correction Modal */}
      <CorrectionRequestModal
        isOpen={showCorrectionModal}
        onClose={() => setShowCorrectionModal(false)}
      />

      {/* Overtime Modal */}
      <OvertimeRequestModal
        isOpen={showOvertimeModal}
        onClose={() => setShowOvertimeModal(false)}
      />

      {/* Change Photo Modal */}
      <ChangePhotoModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
      />
    </div>
  );
};
