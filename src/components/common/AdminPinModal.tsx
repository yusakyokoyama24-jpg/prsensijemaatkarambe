import React, { useState, useEffect } from "react";
import { Lock, KeyRound, X, Check, AlertCircle, Eye, EyeOff, ShieldCheck, ShieldAlert } from "lucide-react";
import { useAttendance } from "../../context/AttendanceContext";

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { verifyAdminPin, settings, currentUser } = useAttendance();
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setError(null);
      setShake(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: any;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (lockoutTimer > 0) {
      setError(`Terlalu banyak percobaan salah. Silakan tunggu ${lockoutTimer} detik.`);
      return;
    }
    if (!pin.trim()) {
      setError("Silakan masukkan PIN rahasia.");
      triggerShake();
      return;
    }

    const isValid = verifyAdminPin(pin.trim());
    if (isValid) {
      setError(null);
      setFailedAttempts(0);
      if (onSuccess) onSuccess();
      onClose();
    } else {
      const nextFailed = failedAttempts + 1;
      setFailedAttempts(nextFailed);
      triggerShake();
      setPin("");
      if (nextFailed >= 5) {
        setLockoutTimer(60);
        setError("Akses terkunci sementara selama 60 detik karena 5x salah input.");
      } else {
        setError(`PIN salah! Percobaan ${nextFailed} dari 5.`);
      }
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 8) {
      setError(null);
      setPin((prev) => prev + num);
    }
  };

  const handleBackspace = () => {
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setError(null);
    setPin("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div
        className={`bg-slate-900 border border-slate-700/80 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-transform ${
          shake ? "animate-bounce" : ""
        }`}
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 35px rgba(239, 68, 68, 0.15)",
        }}
      >
        {/* Header with Church Sacred Crimson & Gold Accent */}
        <div className="bg-gradient-to-r from-red-900 via-rose-800 to-amber-900 px-6 py-5 flex items-center justify-between text-white border-b border-rose-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-inner">
              <Lock className="w-5 h-5 text-amber-300 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-black text-sm uppercase tracking-wide text-white">
                Akses Portal Admin
              </h2>
              <p className="text-[10px] text-amber-200/80 font-medium">
                Gereja Toraja Jemaat Karambe
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-full bg-slate-950/20 hover:bg-slate-950/40 text-rose-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="text-center space-y-1">
            <p className="text-xs text-slate-300 font-medium">
              Masukkan PIN keamanan administrator untuk membuka panel pengelolaan data & presensi.
            </p>
          </div>

          {/* PIN Dots Display */}
          <div className="flex items-center justify-center gap-3 py-2">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    isFilled
                      ? "bg-amber-400 border-amber-300 scale-110 shadow-lg shadow-amber-500/50"
                      : "border-slate-600 bg-slate-800/60"
                  }`}
                />
              );
            })}
          </div>

          {/* Direct Input Field with Eye Toggle */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4 text-amber-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                autoFocus
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setError(null);
                  setPin(e.target.value.replace(/\D/g, ""));
                }}
                placeholder="Masukkan PIN"
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-amber-500 transition shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-semibold animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Numeric Keypad for Mobile / Quick Tap */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  className="py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white font-mono font-bold text-base transition border border-slate-700/60 cursor-pointer shadow"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="py-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 font-bold text-xs transition cursor-pointer"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress("0")}
                className="py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white font-mono font-bold text-base transition border border-slate-700/60 cursor-pointer shadow"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="py-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-300 font-bold text-xs transition cursor-pointer flex items-center justify-center"
              >
                ⌫
              </button>
            </div>

            {/* Confidential Security Notice */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-[11px] text-slate-400 font-medium leading-tight">
                Kerahasiaan Terjamin: PIN ini hanya dimiliki dan diketahui oleh Administrator Resmi Gereja.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:brightness-110 active:scale-98 text-white font-black text-xs shadow-lg shadow-rose-900/40 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Buka Portal Admin</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
