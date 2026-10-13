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
  const { currentUser, login, users } = useAttendance();
  const [activeTab, setActiveTab] = useState<AdminTab>('MONITOR');
  const [showSqlModal, setShowSqlModal] = useState(false);

  const isAdmin =
    currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.role === 'CHURCH_ADMIN' ||
    currentUser?.role === 'UNIT_HEAD';

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
    { id: 'MONITOR', label: 'Monitoring Real-Time', icon: Activity },
    { id: 'GEOFENCE', label: 'Lokasi & Geofence', icon: MapPin },
    { id: 'SCHEDULE', label: 'Jadwal & Toleransi', icon: Clock },
    { id: 'EMPLOYEES', label: 'Data Pegawai', icon: Users },
    { id: 'APPROVALS', label: 'Izin & Koreksi', icon: FileText },
    { id: 'REPORTS', label: 'Laporan & Ekspor', icon: FileSpreadsheet },
    { id: 'DISTRIBUTION', label: 'Distribusi URL & QR', icon: QrCode },
    { id: 'AUDIT', label: 'Audit Log & Info', icon: Shield },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner with SQL Button */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
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

        {/* Database Schema Button */}
        <button
          onClick={() => setShowSqlModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-400 border border-amber-500/30 font-semibold text-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Database className="w-4 h-4" />
          <span>Skema SQL Database</span>
        </button>
      </div>

      {/* Admin Horizontal Tabs */}
      <div className="no-print flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800/80">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as AdminTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800/60 hover:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

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
