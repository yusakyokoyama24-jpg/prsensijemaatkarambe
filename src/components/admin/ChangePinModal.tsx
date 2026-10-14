import React, { useState } from "react";
import { KeyRound, X, Check, AlertCircle, Eye, EyeOff, Shield } from "lucide-react";
import { useAttendance } from "../../context/AttendanceContext";

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast,
}) => {
  const { settings, updateAdminPin } = useAttendance();
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPin = settings.adminPin || "2026";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (oldPin.trim() !== currentPin) {
      setError("PIN Lama tidak sesuai!");
      return;
    }

    if (newPin.length < 4 || newPin.length > 8) {
      setError("PIN Baru harus 4 sampai 8 digit angka!");
      return;
    }

    if (newPin !== confirmPin) {
      setError("Konfirmasi PIN Baru tidak cocok!");
      return;
    }

    updateAdminPin(newPin.trim());
    if (onSuccessToast) {
      onSuccessToast("PIN Akses Portal Admin berhasil diperbarui!");
    }
    setOldPin("");
    setNewPin("");
    setConfirmPin("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 via-rose-800 to-amber-900 px-6 py-4 flex items-center justify-between text-white border-b border-rose-500/30">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-amber-300 stroke-[2.5]" />
            <h2 className="font-black text-sm uppercase tracking-wide">Ubah PIN Admin</h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-full bg-slate-950/20 hover:bg-slate-950/40 text-rose-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">PIN Lama (Saat ini)</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              maxLength={8}
              value={oldPin}
              onChange={(e) => {
                setError(null);
                setOldPin(e.target.value.replace(/\D/g, ""));
              }}
              placeholder="Masukkan PIN keamanan saat ini"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">PIN Baru (4-8 Digit Angka)</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              maxLength={8}
              value={newPin}
              onChange={(e) => {
                setError(null);
                setNewPin(e.target.value.replace(/\D/g, ""));
              }}
              placeholder="Ketik 4-8 digit angka PIN baru"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Ulangi PIN Baru</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              maxLength={8}
              value={confirmPin}
              onChange={(e) => {
                setError(null);
                setConfirmPin(e.target.value.replace(/\D/g, ""));
              }}
              placeholder="Ketik ulang PIN baru"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="flex items-center gap-1.5 hover:text-white cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPassword ? "Sembunyikan Digit" : "Tampilkan Digit"}</span>
            </button>
            <span className="text-slate-500 font-medium">Kerahasiaan Terjamin</span>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-rose-950/60 border border-rose-700 text-rose-300 font-semibold animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:brightness-110 active:scale-98 text-white font-bold transition cursor-pointer"
            >
              Simpan PIN Baru
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
