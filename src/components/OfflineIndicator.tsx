import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-2xl bg-amber-500/95 border border-amber-300 px-4 py-2.5 text-xs font-black text-slate-950 shadow-2xl backdrop-blur-md animate-bounce"
    >
      <WifiOff className="w-4 h-4 text-slate-950 shrink-0" />
      <span>Mode Offline — Presensi tetap dapat dicatat & akan disinkronkan otomatis saat online.</span>
    </div>
  );
};
