import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { AppDistribution } from './AppDistribution';
import { AuditLogsView } from './AuditLogsView';
import { EmployeeManagement } from './EmployeeManagement';
import { GeofenceSettings } from './GeofenceSettings';
import { LeaveApproval } from './LeaveApproval';
import { LiveAttendanceMonitor } from './LiveAttendanceMonitor';
import { ReportsView } from './ReportsView';
import { ScheduleSettings } from './ScheduleSettings';
import { SqlSchemaModal } from './SqlSchemaModal';
import { ChangePinModal } from './ChangePinModal';
import {
  Clock,
  Database,
  FileSpreadsheet,
  FileText,
  MapPin,
  QrCode,
  Shield,
  ShieldAlert,
  Users,
  Activity,
  Layers,
  Lock,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

type AdminTab =
  | 'MONITOR'
  | 'GEOFENCE'
  | 'SCHEDULE'
  | 'EMPLOYEES'
  | 'APPROVALS'
  | 'REPORTS'
  | 'DISTRIBUTION'
  | 'AUDIT';

export const AdminPortal: React.FC = () => {
  const { currentUser, login, users, isAdminUnlocked, lockAdminPortal, openPinModal } = useAttendance();
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('MONITOR');
  const [showSqlModal, setShowSqlModal] = useState(false);

  const isAdmin =
    currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.role === 'CHURCH_ADMIN' ||
    currentUser?.role === 'UNIT_HEAD';

  if (!isAdminUnlocked) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-4 shadow-lg shadow-rose-950/40">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Portal Admin Terkunci</h2>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Portal administrasi dilindungi PIN keamanan untuk menjaga kerahasiaan data jemaat & pegawai.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={openPinModal}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-bold text-xs shadow-lg shadow-rose-900/40 hover:brightness-110 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>Buka Kunci Portal Admin</span>
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Akses Khusus Pengurus & Admin Gereja</h2>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Akun saat ini ({currentUser?.name}) memiliki peran Pegawai. Untuk mengakses dashboard admin gereja, silakan beralih ke akun administrator di bawah ini.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={() => login('usr-admin-2')}
            className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition cursor-pointer"
          >
            Masuk sebagai Martha, S.Kom (Admin Gereja)
          </button>
          <button
            onClick={() => login('usr-admin-1')}
            className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs hover:bg-slate-700 transition cursor-pointer"
          >
            Masuk sebagai Pdt. Markus Sampe (Super Admin)
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'MONITOR', label: 'Monitoring Real-Time', icon: Activity, activeBg: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-lg shadow-blue-900/40 border border-blue-400/40', inactiveBg: 'bg-blue-950/40 text-blue-300 border-blue-900/50 hover:bg-blue-900/60' },
    { id: 'GEOFENCE', label: 'Lokasi & Geofence', icon: MapPin, activeBg: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg shadow-emerald-900/40 border border-emerald-400/40', inactiveBg: 'bg-emerald-950/40 text-emerald-300 border-emerald-900/50 hover:bg-emerald-900/60' },
    { id: 'SCHEDULE', label: 'Jadwal & Toleransi', icon: Clock, activeBg: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-300/50', inactiveBg: 'bg-amber-950/40 text-amber-300 border-amber-900/50 hover:bg-amber-900/60' },
    { id: 'EMPLOYEES', label: 'Data Pegawai', icon: Users, activeBg: 'bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 text-white shadow-lg shadow-purple-900/40 border border-purple-400/40', inactiveBg: 'bg-purple-950/40 text-purple-300 border-purple-900/50 hover:bg-purple-900/60' },
    { id: 'APPROVALS', label: 'Izin & Koreksi', icon: FileText, activeBg: 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white shadow-lg shadow-rose-900/40 border border-rose-400/40', inactiveBg: 'bg-rose-950/40 text-rose-300 border-rose-900/50 hover:bg-rose-900/60' },
    { id: 'REPORTS', label: 'Laporan & Ekspor', icon: FileSpreadsheet, activeBg: 'bg-gradient-to-r from-cyan-600 via-sky-600 to-cyan-700 text-white shadow-lg shadow-cyan-900/40 border border-cyan-400/40', inactiveBg: 'bg-cyan-950/40 text-cyan-300 border-cyan-900/50 hover:bg-cyan-900/60' },
    { id: 'DISTRIBUTION', label: 'Distribusi URL & QR', icon: QrCode, activeBg: 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-fuchsia-700 text-white shadow-lg shadow-fuchsia-900/40 border border-fuchsia-400/40', inactiveBg: 'bg-fuchsia-950/40 text-fuchsia-300 border-fuchsia-900/50 hover:bg-fuchsia-900/60' },
    { id: 'AUDIT', label: 'Audit Log & Info', icon: Shield, activeBg: 'bg-gradient-to-r from-yellow-700 via-amber-800 to-amber-900 text-amber-200 shadow-lg shadow-amber-950/40 border border-amber-500/40', inactiveBg: 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner with SQL Button */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 border border-blue-400/30 flex items-center justify-center text-white shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <span>Portal Administrator & Manajemen Presensi</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {currentUser?.role}
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Pengelolaan kehadiran pegawai, validasi radius geofence, dan penerbitan laporan.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Ubah PIN Button */}
          <button
            onClick={() => setShowChangePinModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs border border-amber-500/30 transition cursor-pointer"
            title="Ubah PIN Keamanan Portal Admin"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Ubah PIN</span>
          </button>

          {/* Kunci Portal Button */}
          <button
            onClick={lockAdminPortal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 font-semibold text-xs border border-rose-500/40 transition cursor-pointer"
            title="Kunci kembali portal admin"
          >
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>Kunci Portal</span>
          </button>

          {/* Database Schema Button */}
          <button
            onClick={() => setShowSqlModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
          >
            <Database className="w-4 h-4" />
            <span>Skema SQL Database</span>
          </button>
        </div>
      </div>

      {/* Admin Horizontal Tabs with Varied, Artistic & Luxurious Colors */}
      <div className="no-print flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800/80">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as AdminTab)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                isActive ? item.activeBg : item.inactiveBg
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Change PIN Modal */}
      <ChangePinModal
        isOpen={showChangePinModal}
        onClose={() => setShowChangePinModal(false)}
        onSuccessToast={(msg) => {
          setToastMsg(msg);
          setTimeout(() => setToastMsg(null), 3500);
        }}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Tab Contents */}
      <div>
        {activeTab === 'MONITOR' && <LiveAttendanceMonitor />}
        {activeTab === 'GEOFENCE' && <GeofenceSettings />}
        {activeTab === 'SCHEDULE' && <ScheduleSettings />}
        {activeTab === 'EMPLOYEES' && <EmployeeManagement />}
        {activeTab === 'APPROVALS' && <LeaveApproval />}
        {activeTab === 'REPORTS' && <ReportsView />}
        {activeTab === 'DISTRIBUTION' && <AppDistribution />}
        {activeTab === 'AUDIT' && <AuditLogsView />}
      </div>

      {/* PostgreSQL / Supabase Schema Modal */}
      <SqlSchemaModal
        isOpen={showSqlModal}
        onClose={() => setShowSqlModal(false)}
      />
    </div>
  );
};
