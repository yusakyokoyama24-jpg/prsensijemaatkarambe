import React, { useEffect } from 'react';
import { AttendanceProvider, useAttendance } from './context/AttendanceContext';
import { Navbar } from './components/Navbar';
import { OfflineBanner } from './components/OfflineBanner';
import { EmployeeDashboard } from './components/employee/EmployeeDashboard';
import { AdminPortal } from './components/admin/AdminPortal';
import { AdminPinModal } from './components/common/AdminPinModal';
import { RealLoginScreen } from './components/auth/RealLoginScreen';

const MainLayout: React.FC = () => {
  const {
    activePortal,
    setActivePortal,
    currentUser,
    settings,
    showPinModal,
    closePinModal,
    isAdminUnlocked,
  } = useAttendance();

  const isAdmin =
    currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.role === 'CHURCH_ADMIN' ||
    currentUser?.role === 'UNIT_HEAD';

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

  // If not logged in, render the official church login screen
  if (!currentUser) {
    return <RealLoginScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-slate-100 flex flex-col">
      {/* Offline Connectivity Banner */}
      <OfflineBanner />

      {/* Main Church Header & Navigation */}
      <Navbar />

      {/* Content Area */}
      <main className="flex-1">
        {activePortal === 'EMPLOYEE' ? <EmployeeDashboard /> : <AdminPortal />}
      </main>

      {/* Admin PIN Verification Modal */}
      <AdminPinModal isOpen={showPinModal} onClose={closePinModal} />

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
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 font-mono">v2.4.0</span>
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
