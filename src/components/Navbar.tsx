import React, { useEffect, useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { getCurrentTimeStr } from '../utils/time';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Clock,
  LogOut,
  Shield,
  Smartphone,
  User,
  Users,
  ChevronDown,
  Building2,
  Camera,
  Lock,
} from 'lucide-react';
import { ChangeLogoModal } from './common/ChangeLogoModal';
import { TorajaHeaderStrip } from './common/TorajaMotif';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    activePortal,
    setActivePortal,
    logout,
    settings,
    schedule,
    users,
    login,
    requestAdminAccess,
    isAdminUnlocked,
  } = useAttendance();

  const [timeStr, setTimeStr] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      setTimeStr(getCurrentTimeStr(schedule.timezone, schedule.timezoneLabel));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [schedule.timezone, schedule.timezoneLabel]);

  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'CHURCH_ADMIN' || currentUser?.role === 'UNIT_HEAD';

  return (
    <>
      <header className="sticky top-0 z-40 bg-blue-950/95 backdrop-blur-md no-print shadow-xl">
        {/* Authentic Toraja Woodcarving Pattern Band at Top */}
        <TorajaHeaderStrip />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand & Church Title with Custom Changeable Logo */}
            <div className="flex items-center gap-3">
              <div
                onClick={() => setShowLogoModal(true)}
                className="group relative w-12 h-12 rounded-full bg-gradient-to-tr from-slate-950 via-slate-900 to-amber-950 border-2 border-amber-400 p-1 flex items-center justify-center shadow-xl shadow-amber-950/50 shrink-0 cursor-pointer hover:border-amber-300 hover:scale-110 transition-all duration-300 ring-4 ring-amber-500/20"
                style={{
                  boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.4), inset 0 -3px 6px rgba(0, 0, 0, 0.8)'
                }}
                title="Klik untuk mengganti logo Gereja Toraja Jemaat Karambe"
              >
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={settings.churchName}
                    className="w-full h-full object-cover rounded-full shadow-inner"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-400 via-amber-600 to-yellow-700 flex items-center justify-center shadow-inner">
                    <span className="text-xl font-black text-slate-950 drop-shadow">✝</span>
                  </div>
                )}

                {/* Subtle 3D glossy light highlight overlay */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/10 to-white/30 pointer-events-none" />

                {/* Camera/edit badge */}
                <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-amber-400 border-2 border-slate-950 flex items-center justify-center text-slate-950 shadow-md">
                  <Camera className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base tracking-wide text-white">
                    {settings.churchName}
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {schedule.timezoneLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-[11px] text-slate-400 truncate max-w-[190px] sm:max-w-xs">
                    {settings.churchSubtitle}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowLogoModal(true)}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 shrink-0 cursor-pointer"
                  >
                    Ganti Logo
                  </button>
                </div>
              </div>
            </div>

          {/* Center: Live Clock & Portal Tabs */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-amber-300">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{timeStr || 'Memuat jam...'}</span>
            </div>

            {/* Portal Switcher Buttons with Luxurious Artistic Gradients */}
            <div className="flex items-center p-1.5 rounded-2xl bg-slate-950/90 border border-amber-500/40 shadow-2xl">
              <button
                onClick={() => setActivePortal('EMPLOYEE')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  activePortal === 'EMPLOYEE'
                    ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/40 border border-amber-200/50 scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Portal Pegawai</span>
              </button>

              <button
                onClick={() => {
                  requestAdminAccess();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  activePortal === 'ADMIN'
                    ? 'bg-gradient-to-r from-red-600 via-rose-600 to-purple-700 text-white shadow-lg shadow-red-900/50 border border-rose-400/50 scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Portal Admin</span>
              </button>
            </div>
          </div>

          {/* Right side: PWA Button & User Avatar */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <PWAInstallButton variant="nav" />
            </div>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-amber-500/50"
                  />
                  <div className="text-left hidden lg:block pr-1">
                    <p className="text-xs font-bold text-slate-200 leading-tight truncate max-w-[120px]">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-amber-400 leading-tight">
                      {currentUser.role === 'SUPER_ADMIN'
                        ? 'Super Admin'
                        : currentUser.role === 'CHURCH_ADMIN'
                        ? 'Admin Gereja'
                        : currentUser.role === 'UNIT_HEAD'
                        ? 'Kepala Unit'
                        : 'Pegawai'}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 text-slate-200"
                    onMouseLeave={() => setShowUserMenu(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                      <p className="text-xs font-bold text-white">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-400">{currentUser.department}</p>
                    </div>

                    {/* Switch portal inside dropdown for mobile */}
                    <div className="md:hidden py-1 border-b border-slate-800/80 mb-1">
                      <button
                        onClick={() => {
                          if (activePortal === 'EMPLOYEE') {
                            requestAdminAccess();
                          } else {
                            setActivePortal('EMPLOYEE');
                          }
                          setShowUserMenu(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-lg hover:bg-slate-800 text-slate-300"
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          Ganti ke {activePortal === 'EMPLOYEE' ? 'Portal Admin' : 'Portal Pegawai'}
                        </span>
                      </button>
                    </div>

                    {/* Account Details */}
                    <div className="px-3 py-2 bg-slate-950/60 rounded-xl mb-2 text-[11px] space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>NIP:</span>
                        <span className="text-white font-mono font-bold">{currentUser.nip}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Jabatan:</span>
                        <span className="text-amber-300 font-semibold truncate max-w-[130px]">{currentUser.position}</span>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-slate-800">
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar Akun</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => logout()}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition cursor-pointer"
              >
                Masuk ke Akun
              </button>
            )}
          </div>
        </div>

        {/* Mobile Subheader Navigation for Portals */}
        <div className="md:hidden flex items-center justify-between py-2 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-amber-400 text-[11px]">
            <Clock className="w-3 h-3" />
            <span>{timeStr}</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-amber-500/30">
            <button
              onClick={() => setActivePortal('EMPLOYEE')}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition ${
                activePortal === 'EMPLOYEE'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pegawai
            </button>
            <button
              onClick={() => requestAdminAccess()}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition ${
                activePortal === 'ADMIN'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </header>

      {/* Modal Ganti Logo Gereja */}
      <ChangeLogoModal
        isOpen={showLogoModal}
        onClose={() => setShowLogoModal(false)}
      />
    </>
  );
};
