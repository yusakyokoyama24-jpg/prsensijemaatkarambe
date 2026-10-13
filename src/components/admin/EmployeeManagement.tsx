import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { UserProfile, UserRole } from '../../types';
import {
  CheckCircle2,
  Edit2,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react';

import { ConfirmModal } from '../common/ConfirmModal';

export const EmployeeManagement: React.FC = () => {
  const { users, workUnits, locations, addEmployee, updateEmployee, deleteEmployee } =
    useAttendance();

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterUnit, setFilterUnit] = useState('ALL');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('EMPLOYEE');
  const [department, setDepartment] = useState(workUnits[0]?.name || 'PMG (Pengurus Majelis Gereja)');
  const [position, setPosition] = useState('');
  const [avatar, setAvatar] = useState(
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  );

  const filteredUsers = users.filter((u) => {
    if (filterRole !== 'ALL' && u.role !== filterRole) return false;
    if (filterUnit !== 'ALL' && u.department !== filterUnit) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.nip.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q) ||
        u.position.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    setIsAdding(true);
    setEditingUser(null);
    setName('');
    setNip(`PGR-2026-${String(users.length + 1).padStart(3, '0')}`);
    setEmail(`pegawai${users.length + 1}@gereja.id`);
    setPhone('0812-');
    setRole('EMPLOYEE');
    setDepartment(workUnits[0]?.name || 'Sekretariat & Tata Usaha');
    setPosition('Staf Pelayanan');
  };

  const handleOpenEdit = (u: UserProfile) => {
    setEditingUser(u);
    setIsAdding(false);
    setName(u.name);
    setNip(u.nip);
    setEmail(u.email);
    setPhone(u.phone);
    setRole(u.role);
    setDepartment(u.department);
    setPosition(u.position);
    setAvatar(u.avatar);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nip.trim()) return;

    if (editingUser) {
      updateEmployee(editingUser.id, {
        name,
        nip,
        email,
        phone,
        role,
        department,
        position,
        avatar,
      });
      setEditingUser(null);
    } else if (isAdding) {
      addEmployee({
        name,
        nip,
        email,
        phone,
        role,
        department,
        position,
        avatar,
        assignedLocationIds: locations.map((l) => l.id),
        isActive: true,
      });
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span>Manajemen Akun & Data Pegawai Gereja</span>
          </h2>
          <p className="text-xs text-slate-400">
            Kelola data pegawai, hak akses, NIP gereja, dan unit kerja pelayanan.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pegawai Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Peran:</span>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Semua Peran</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="CHURCH_ADMIN">Admin Gereja</option>
              <option value="UNIT_HEAD">Kepala Unit</option>
              <option value="EMPLOYEE">Pegawai</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Unit:</span>
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Semua Unit Pelayanan</option>
              {workUnits.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Cari nama, NIP, unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Employee Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Pegawai & NIP</th>
                <th className="py-3 px-4">Unit Kerja</th>
                <th className="py-3 px-4">Jabatan</th>
                <th className="py-3 px-4">Hak Akses (Role)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar}
                        alt=""
                        className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700"
                      />
                      <div>
                        <p className="font-bold text-white">{u.name}</p>
                        <p className="text-[11px] font-mono text-amber-400">NIP: {u.nip}</p>
                        <p className="text-[10px] text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-slate-300">{u.department}</td>

                  <td className="py-3 px-4 text-slate-300 font-medium">{u.position}</td>

                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.role === 'SUPER_ADMIN'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : u.role === 'CHURCH_ADMIN'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : u.role === 'UNIT_HEAD'
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => updateEmployee(u.id, { isActive: !u.isActive })}
                      className="cursor-pointer"
                    >
                      {u.isActive ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                          <UserX className="w-3.5 h-3.5" />
                          <span>Nonaktif</span>
                        </span>
                      )}
                    </button>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        title="Edit Pegawai"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingUser(u)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-slate-800 transition cursor-pointer"
                        title="Hapus Pegawai"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(isAdding || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto no-print">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100 my-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingUser ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
              </h3>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingUser(null);
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Yohanes Banne, S.E"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">NIP Gereja</label>
                  <input
                    type="text"
                    required
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Hak Akses (Role)</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="EMPLOYEE">Pegawai</option>
                    <option value="UNIT_HEAD">Kepala Unit</option>
                    <option value="CHURCH_ADMIN">Admin Gereja</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Unit Pelayanan</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  >
                    {workUnits.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Jabatan</label>
                  <input
                    type="text"
                    required
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Contoh: Ketua PMG / Ketua Bidang I"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                  {/* Quick suggestion pills */}
                  {department.includes('PMG') && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['Ketua PMG', 'Sekretaris PMG', 'Bendahara PMG', 'Anggota PMG'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPosition(p)}
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-amber-300 transition"
                        >
                          + {p}
                        </button>
                      ))}
                    </div>
                  )}
                  {department.includes('Ketua Bidang') && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[
                        'Ketua Bidang I (PWGT/PPGT/SMGT)',
                        'Ketua Bidang II (Ibadah & Liturgi)',
                        'Ketua Bidang III (Diakonia)',
                        'Ketua Bidang IV (Sarana & Prasarana)',
                      ].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPosition(p)}
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-amber-300 transition"
                        >
                          + {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nomor WhatsApp / HP</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Foto Avatar URL</label>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition"
                >
                  Simpan Data Pegawai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Pegawai */}
      <ConfirmModal
        isOpen={!!deletingUser}
        title="Hapus Akun Pegawai?"
        message={`Apakah Anda yakin ingin menghapus data pegawai "${deletingUser?.name}" (NIP: ${deletingUser?.nip})? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus Pegawai"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={() => {
          if (deletingUser) {
            deleteEmployee(deletingUser.id);
            setActionToast(`Data pegawai "${deletingUser.name}" berhasil dihapus!`);
            setDeletingUser(null);
            setTimeout(() => setActionToast(null), 3000);
          }
        }}
        onCancel={() => setDeletingUser(null)}
      />

      {/* Toast Notification */}
      {actionToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionToast}</span>
        </div>
      )}
    </div>
  );
};
