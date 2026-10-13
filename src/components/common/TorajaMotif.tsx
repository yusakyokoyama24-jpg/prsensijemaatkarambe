import React from 'react';

/**
 * Authentic Toraja Woodcarving Motifs (Pa'ssura Toraja):
 * - Pa'barre Allo (Matahari / Radiant Sun): Simbol kemuliaan Allah dan terang kasih Kristus
 * - Pa'teddong (Tanduk Kerbau / Buffalo Horn): Simbol kemakmuran, kekuatan, dan keteguhan iman
 * - Pa'doti Langi' (Bintang di Langit): Simbol sukacita surgawi dan pengharapan
 */

export const TorajaHeaderStrip: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`w-full overflow-hidden relative select-none ${className}`}>
      {/* Torajan Pa'ssura Pattern Strip */}
      <svg
        className="w-full h-3 sm:h-3.5 block"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1200 24"
      >
        <defs>
          <pattern id="torajaPattern" width="60" height="24" patternUnits="userSpaceOnUse">
            {/* Background Red */}
            <rect width="60" height="24" fill="#991b1b" />
            {/* Dark contrast bands */}
            <rect x="0" y="0" width="60" height="3" fill="#090d16" />
            <rect x="0" y="21" width="60" height="3" fill="#090d16" />
            {/* Pa'teddong Chevron / Horn (Yellow Gold) */}
            <path d="M0,12 L15,3 L30,12 L45,3 L60,12 L45,21 L30,12 L15,21 Z" fill="#f59e0b" />
            {/* Center diamond white */}
            <polygon points="30,6 36,12 30,18 24,12" fill="#ffffff" />
            {/* Inner Black Dot / Accent */}
            <circle cx="30" cy="12" r="2.5" fill="#090d16" />
            {/* Side diamonds */}
            <polygon points="0,6 6,12 0,18" fill="#fef08a" />
            <polygon points="60,6 60,18 54,12" fill="#fef08a" />
            {/* Fine white line accents */}
            <line x1="15" y1="3" x2="30" y2="12" stroke="#ffffff" strokeWidth="1" />
            <line x1="30" y1="12" x2="45" y2="3" stroke="#ffffff" strokeWidth="1" />
            <line x1="15" y1="21" x2="30" y2="12" stroke="#ffffff" strokeWidth="1" />
            <line x1="30" y1="12" x2="45" y2="21" stroke="#ffffff" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1200" height="24" fill="url(#torajaPattern)" />
      </svg>
    </div>
  );
};

export const TorajaChurchBanner: React.FC<{
  churchName?: string;
  subtitle?: string;
  badge?: string;
}> = ({
  churchName = 'GEREJA TORAJA JEMAAT KARAMBE',
  subtitle = 'Klasis Karambe — Badan Pekerja Sinode Gereja Toraja',
  badge = 'Salama\' Sipatu Karuruyan',
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border-2 border-amber-500/30 p-5 sm:p-6 shadow-2xl">
      {/* Decorative Toraja Motif Accent in background */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-end pr-4">
        <svg viewBox="0 0 200 200" className="w-64 h-64 text-amber-400" fill="currentColor">
          <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="12,12" />
          <path d="M100,20 L120,80 L180,100 L120,120 L100,180 L80,120 L20,100 L80,80 Z" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md">
              Toraja Church Template
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {badge}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 tracking-wide">
            {churchName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            {subtitle}
          </p>
          <p className="text-[11px] text-amber-300/80 italic">
            "Mendengarkan Firman, Setia Melayani, dan Bersukacita dalam Persekutuan Kasih Kristus"
          </p>
        </div>

        {/* Vibrant color indicators of Toraja Culture */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-600 shadow-sm shadow-red-500/50" title="Maro (Merah Toraja)" />
            <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" title="Kuning Emas (Berkat)" />
            <span className="w-3 h-3 rounded-full bg-white shadow-sm shadow-white/50" title="Putih (Kekudusan)" />
            <span className="w-3 h-3 rounded-full bg-slate-950 border border-slate-700 shadow-sm" title="Hitam (Keteguhan)" />
          </div>
          <span className="text-[11px] font-bold text-amber-400">
            Jemaat Karambe
          </span>
        </div>
      </div>
    </div>
  );
};
