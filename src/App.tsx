import React, { useEffect, useState } from 'react';
import { AttendanceProvider, useAttendance } from './context/AttendanceContext';
import { Navbar } from './components/Navbar';
import { OfflineBanner } from './components/OfflineBanner';
import { EmployeeDashboard } from './components/employee/EmployeeDashboard';
import { AdminPortal } from './components/admin/AdminPortal';
import { AdminPinModal } from './components/common/AdminPinModal';
import { Shield, User, Smartphone, Users } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activePortal, setActivePortal, currentUser, login, users, settings, showPinModal, closePinModal, isAdminUnlocked } = useAttendance();
  const [showDemoSelector, setShowDemoSelector] = useState(false);

  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'CHURCH_ADMIN' || currentUser?.role === 'UNIT_HEAD';

  // Sync URL hash / pathname on load (e.g. /admin vs /pegawai)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (path.includes('admin') || search.includes('portal=admin')) {
        if (isAdmin && isAdminUnlocked) {
          setActivePortal('ADMIN');
        } else {
          setActivePortal('EMPLOYEE');
        }
      } else if (path.includes('pegawai') || search.includes('portal=employee')) {
        setActivePortal('EMPLOYEE');
      }
    }
  }, [setActivePortal, isAdmin, isAdminUnlocked]);

  useEffect(() => {
    if (activePortal === 'ADMIN' && !isAdmin) {
      setActivePortal('EMPLOYEE');
    }
  }, [activePortal, isAdmin, setActivePortal]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-slate-100 flex flex-col">
      {/* Offline Connectivity Banner */}
      <OfflineBanner />

      {/* Main Church Header & Navigation */}
      <Navbar onOpenDemoModal={() => setShowDemoSelector(true)} />

      {/* Content Area */}
      <main className="flex-1">
        {activePortal === 'EMPLOYEE' ? <EmployeeDashboard /> : <AdminPortal />}
      </main>

      {/* Quick Demo Switcher Floating Bar (Fixed at bottom right, hidden during print) */}
      <div className="fixed bottom-4 right-4 z-30 no-print flex items-center gap-2">
        <button
          onClick={() => setShowDemoSelector(!showDemoSelector)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-amber-500/40 text-amber-300 hover:bg-slate-800 text-xs font-bold shadow-xl backdrop-blur-md transition cursor-pointer"
        >
          <Users className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Ganti Akun Demo:</span>
          <span className="font-semibold text-white truncate max-w-[120px]">
            {currentUser?.name?.split(' ')[0]}
          </span>
        </button>

        {showDemoSelector && (
          <div className="absolute bottom-12 right-0 w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-3 text-slate-200 z-40 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Pilih Akun Demo Simulasi
              </span>
              <button
                onClick={() => setShowDemoSelector(false)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1 max-h-64 overflow-y-auto">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    login(u.id);
                    if (u.role === 'SUPER_ADMIN' || u.role === 'CHURCH_ADMIN') {
                      setActivePortal('ADMIN');
                    } else {
                      setActivePortal('EMPLOYEE');
                    }
                    setShowDemoSelector(false);
                  }}
                  className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-xs transition cursor-pointer ${
                    u.id === currentUser?.id
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <img
                    src={u.avatar}
                    alt=""
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700 shrink-0"
                  />
                  <div className="truncate">
                    <p className="truncate font-semibold text-white">{u.name}</p>
                    <p className="text-[10px] text-amber-400/90 truncate">
                      {u.role === 'SUPER_ADMIN'
                        ? 'Super Admin'
                        : u.role === 'CHURCH_ADMIN'
                        ? 'Admin Gereja'
                        : u.role === 'UNIT_HEAD'
                        ? 'Kepala Unit'
                        : 'Pegawai'}{' '}
                      • {u.department}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Admin PIN Verification Modal */}
      <AdminPinModal
        isOpen={showPinModal}
        onClose={closePinModal}
      />

      {/* Footer */}
      <footer className="no-print bg-blue-950/80 py-6 text-center text-xs text-slate-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">✝</span>
            <span className="font-semibold text-slate-400">{settings.churchName}</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Sistem Presensi Pegawai Berbasis GPS Geofencing, MediaDevices Selfie Camera & Progressive Web App (PWA).
          </p>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Sinkronisasi Real-Time Aktif
            </span>
            <span>v2.4.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AttendanceProvider>
      <MainLayout />
    </AttendanceProvider>
  );
}
