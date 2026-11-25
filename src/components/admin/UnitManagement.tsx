import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { WorkUnit } from '../../types';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

export const UnitManagement: React.FC = () => {
  const { workUnits, users, addWorkUnit, updateWorkUnit, deleteWorkUnit } =
    useAttendance();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<WorkUnit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<WorkUnit | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [headName, setHeadName] = useState('');
  const [description, setDescription] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openAddModal = () => {
    setName('');
    setCode('');
    setHeadName('');
    setDescription('');
    setErrorMsg(null);
    setShowAddModal(true);
  };

  const openEditModal = (unit: WorkUnit) => {
    setEditingUnit(unit);
    setName(unit.name);
    setCode(unit.code);
    setHeadName(unit.headName);
    setDescription(unit.description);
    setErrorMsg(null);
  };

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !code.trim()) {
      setErrorMsg('Nama unit dan kode singkat wajib diisi.');
      return;
    }

    try {
      if (editingUnit) {
        await updateWorkUnit(editingUnit.id, {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          headName: headName.trim(),
          description: description.trim(),
        });
        showToast(`Unit pelayanan "${name.trim()}" berhasil diperbarui!`);
        setEditingUnit(null);
      } else {
        await addWorkUnit({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          headName: headName.trim() || 'Belum Ditentukan',
          description: description.trim() || 'Unit pelayanan gereja.',
        });
        showToast(`Unit pelayanan "${name.trim()}" berhasil ditambahkan & tersimpan permanen!`);
        setShowAddModal(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan data unit pelayanan.');
    }
  };

  const handleDeleteUnit = async () => {
    if (!deletingUnit) return;
    try {
      await deleteWorkUnit(deletingUnit.id);
      showToast(`Unit "${deletingUnit.name}" berhasil dihapus.`);
      setDeletingUnit(null);
    } catch (err: any) {
      showToast('Gagal menghapus unit pelayanan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <span>Manajemen Unit Pelayanan Gereja (Custom Unit)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Tambah, ubah, atau sesuaikan unit dan seksi pelayanan jemaat. Seluruh perubahan otomatis tersimpan permanen di server terpusat.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:brightness-110 active:scale-98 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Tambah Unit Pelayanan Baru</span>
        </button>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Unit Terdaftar</p>
            <p className="text-lg font-bold text-white">{workUnits.length} Unit</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Pegawai & Pelayan</p>
            <p className="text-lg font-bold text-white">{users.length} Orang</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Status Sinkronisasi</p>
            <p className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Database Server Aktif
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Work Units */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workUnits.map((unit) => {
          const assignedEmployees = users.filter((u) => u.department === unit.name);

          return (
            <div
              key={unit.id}
              className="rounded-2xl p-5 bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition flex flex-col justify-between shadow-md space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {unit.code}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(unit)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition cursor-pointer"
                      title="Edit Unit Pelayanan"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingUnit(unit)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Hapus Unit Pelayanan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white mb-1">{unit.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  {unit.description || 'Tidak ada deskripsi.'}
                </p>

                <div className="flex items-center gap-2 text-[11px] text-slate-300 bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800/80">
                  <Briefcase className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">
                    Koordinator: <strong className="text-white">{unit.headName}</strong>
                  </span>
                </div>
              </div>

              {/* Assigned Employees List Preview */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>{assignedEmployees.length} Pegawai Terdaftar</span>
                </span>
                {assignedEmployees.length > 0 && (
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {assignedEmployees.slice(0, 3).map((emp) => (
                      <img
                        key={emp.id}
                        src={emp.avatar}
                        alt=""
                        title={emp.name}
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-800"
                      />
                    ))}
                    {assignedEmployees.length > 3 && (
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-[9px] font-bold text-amber-300 flex items-center justify-center ring-1 ring-slate-700">
                        +{assignedEmployees.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add or Edit Work Unit */}
      {(showAddModal || editingUnit) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>{editingUnit ? 'Edit Unit Pelayanan' : 'Tambah Unit Pelayanan Baru'}</span>
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingUnit(null);
                }}
                className="text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Unit / Seksi Pelayanan *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Seksi Pemuda / PPGT, Tim Diakonia, dsb."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kode Singkat *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Contoh: PPGT, PWGT, KOSTER, MEDIA"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs uppercase focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Koordinator / Kepala Unit
                </label>
                <input
                  type="text"
                  value={headName}
                  onChange={(e) => setHeadName(e.target.value)}
                  placeholder="Contoh: Pnt. Daniel Rantelino / Martha Pabuntang"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Deskripsi / Lingkup Tugas
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsi tugas dan tanggung jawab pelayanan..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingUnit(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition cursor-pointer shadow-md"
                >
                  {editingUnit ? 'Simpan Perubahan' : 'Simpan Permanen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deletingUnit)}
        title="Hapus Unit Pelayanan?"
        message={`Apakah Anda yakin ingin menghapus unit "${deletingUnit?.name}"? Pegawai yang sebelumnya di unit ini perlu dialihkan ke unit lain.`}
        confirmLabel="Ya, Hapus Unit"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={handleDeleteUnit}
        onCancel={() => setDeletingUnit(null)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
