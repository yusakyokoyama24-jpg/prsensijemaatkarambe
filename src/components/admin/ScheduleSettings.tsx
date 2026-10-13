import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { AttendanceSchedule, TimezoneOption, TimezoneLabel } from '../../types';
import { Clock, Globe, Save, CheckCircle2 } from 'lucide-react';

export const ScheduleSettings: React.FC = () => {
  const { schedule, updateSchedule } = useAttendance();

  const [form, setForm] = useState<AttendanceSchedule>({ ...schedule });
  const [savedMsg, setSavedMsg] = useState(false);

  const handleTimezoneChange = (tz: TimezoneOption) => {
    let label: TimezoneLabel = 'WITA';
    if (tz === 'Asia/Jakarta') label = 'WIB';
    if (tz === 'Asia/Jayapura') label = 'WIT';

    setForm({
      ...form,
      timezone: tz,
      timezoneLabel: label,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchedule(form);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" />
          <span>Pengaturan Jam Kerja & Batas Presensi</span>
        </h2>
        <p className="text-xs text-slate-400">
          Atur jam masuk, jam pulang, toleransi keterlambatan, dan zona waktu operasional gereja.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Timezone Configuration */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Globe className="w-4 h-4 text-amber-400" />
            <span>Zona Waktu Wilayah Pelayanan Gereja</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { tz: 'Asia/Makassar', label: 'WITA (Sulawesi / Bali / NTT)', code: 'WITA' },
              { tz: 'Asia/Jakarta', label: 'WIB (Jawa / Sumatera / Kalbar)', code: 'WIB' },
              { tz: 'Asia/Jayapura', label: 'WIT (Maluku / Papua)', code: 'WIT' },
            ].map((item) => (
              <label
                key={item.tz}
                onClick={() => handleTimezoneChange(item.tz as TimezoneOption)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition text-xs ${
                  form.timezone === item.tz
                    ? 'bg-amber-500/10 border-amber-500 text-white font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>{item.label}</span>
                <span className="font-mono text-amber-400 font-bold">{item.code}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Morning Session Settings */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-sm">Sesi 1: Presensi Pagi (Mulai Tugas)</h3>
              <p className="text-xs text-slate-400">Batas toleransi menentukan status Tepat Waktu atau Terlambat.</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold">
              Pagi Hari
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Mulai Dibuka</label>
              <input
                type="time"
                value={form.morningStart}
                onChange={(e) => setForm({ ...form, morningStart: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Target Masuk Normal</label>
              <input
                type="time"
                value={form.morningTarget}
                onChange={(e) => setForm({ ...form, morningTarget: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Toleransi (Menit)</label>
              <input
                type="number"
                min="0"
                max="60"
                value={form.morningToleranceMinutes}
                onChange={(e) => setForm({ ...form, morningToleranceMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Batas Akhir Sesi Pagi</label>
              <input
                type="time"
                value={form.morningEnd}
                onChange={(e) => setForm({ ...form, morningEnd: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Afternoon Session Settings */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-sm">Sesi 2: Presensi Siang / Sore (Selesai Tugas)</h3>
              <p className="text-xs text-slate-400">Pencatatan jam selesai kerja pegawai gereja.</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold">
              Sore Hari
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Mulai Dibuka</label>
              <input
                type="time"
                value={form.afternoonStart}
                onChange={(e) => setForm({ ...form, afternoonStart: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Target Selesai Tugas</label>
              <input
                type="time"
                value={form.afternoonTarget}
                onChange={(e) => setForm({ ...form, afternoonTarget: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Toleransi (Menit)</label>
              <input
                type="number"
                min="0"
                max="60"
                value={form.afternoonToleranceMinutes}
                onChange={(e) => setForm({ ...form, afternoonToleranceMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Batas Akhir Sesi Sore</label>
              <input
                type="time"
                value={form.afternoonEnd}
                onChange={(e) => setForm({ ...form, afternoonEnd: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          {savedMsg ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Jadwal presensi berhasil disimpan!</span>
            </span>
          ) : <span />}

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan Jadwal</span>
          </button>
        </div>
      </form>
    </div>
  );
};
