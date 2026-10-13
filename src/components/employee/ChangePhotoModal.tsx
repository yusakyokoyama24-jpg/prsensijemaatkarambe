import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { X, Upload, Image as ImageIcon, CheckCircle2, User } from 'lucide-react';

interface ChangePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
];

export const ChangePhotoModal: React.FC<ChangePhotoModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateEmployee } = useAttendance();
  const [photoUrl, setPhotoUrl] = useState(currentUser?.avatar || '');
  const [uploadError, setUploadError] = useState('');

  if (!isOpen || !currentUser) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setUploadError('Ukuran file terlalu besar (maksimal 2MB).');
        return;
      }
      setUploadError('');
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!photoUrl.trim()) {
      setUploadError('URL foto atau gambar tidak boleh kosong.');
      return;
    }
    updateEmployee(currentUser.id, { avatar: photoUrl });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 p-6 shadow-2xl border border-amber-500/30 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Ganti Foto Profil Custom</h3>
              <p className="text-xs text-slate-400">Unggah foto baru atau pilih dari galeri</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Preview */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative">
            <img
              src={photoUrl || currentUser.avatar}
              alt="Preview"
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-amber-400/80 shadow-xl"
            />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-slate-950">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
            </span>
          </div>
          <span className="text-xs font-semibold text-amber-300 mt-2">{currentUser.name}</span>
        </div>

        {/* Upload Options */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Unggah Gambar dari Perangkat
            </label>
            <label className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-2xl bg-slate-900/90 border-2 border-dashed border-amber-500/40 hover:border-amber-400 text-amber-300 text-xs font-bold transition cursor-pointer shadow-inner">
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Pilih Berkas Foto (JPG, PNG)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Atau Masukkan URL Gambar
            </label>
            <div className="relative">
              <ImageIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://example.com/foto.jpg"
                className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Preset Samples */}
          <div>
            <span className="block text-[11px] font-bold text-slate-400 mb-1.5">
              Atau Pilih Avatar Profesional:
            </span>
            <div className="grid grid-cols-6 gap-2">
              {SAMPLE_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPhotoUrl(url)}
                  className={`relative rounded-xl overflow-hidden ring-2 transition cursor-pointer ${
                    photoUrl === url ? 'ring-amber-400 scale-105' : 'ring-slate-700 hover:ring-slate-500'
                  }`}
                >
                  <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-10 object-cover" />
                </button>
              ))}
            </div>
          </div>

          {uploadError && (
            <p className="text-xs text-rose-400 font-semibold bg-rose-950/40 p-2 rounded-xl border border-rose-500/30">
              {uploadError}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            Simpan Perubahan Foto
          </button>
        </div>
      </div>
    </div>
  );
};
