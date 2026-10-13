import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-rose-600 px-4 py-2 text-xs md:text-sm font-semibold text-white shadow-lg animate-pulse">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        Koneksi Internet Terputus. Presensi baru memerlukan jaringan aktif untuk validasi server dan penyimpanan transaksi GPS & foto.
      </span>
    </div>
  );
};
