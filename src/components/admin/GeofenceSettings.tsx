import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { AttendanceLocation } from '../../types';
import { getDeviceCurrentLocation } from '../../utils/geo';
import { ChurchMap } from '../common/ChurchMap';
import {
  Compass,
  Edit2,
  MapPin,
  Plus,
  Save,
  Trash2,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

export const GeofenceSettings: React.FC = () => {
  const { locations, addLocation, updateLocation, deleteLocation } = useAttendance();

  const [selectedLocId, setSelectedLocId] = useState<string>(locations[0]?.id || '');
  const [isEditing, setIsEditing] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMsg, setGpsMsg] = useState<string | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<AttendanceLocation | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number>(-2.97342);
  const [longitude, setLongitude] = useState<number>(119.89785);
  const [radiusMeters, setRadiusMeters] = useState<number>(100);

  const selectedLoc = locations.find((l) => l.id === selectedLocId) || locations[0];

  const handleSelectLocation = (loc: AttendanceLocation) => {
    setSelectedLocId(loc.id);
    setName(loc.name);
    setAddress(loc.address);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setRadiusMeters(loc.radiusMeters);
    setIsEditing(false);
  };

  const handleStartAdd = () => {
    setIsEditing(true);
    setSelectedLocId('');
    setName('Gedung / Unit Pelayanan Baru');
    setAddress('Alamat gedung gereja...');
    setLatitude(selectedLoc ? selectedLoc.latitude + 0.001 : -2.97342);
    setLongitude(selectedLoc ? selectedLoc.longitude + 0.001 : 119.89785);
    setRadiusMeters(100);
  };

  const handleFetchAdminLocation = async () => {
    setGpsLoading(true);
    setGpsMsg(null);
    try {
      const pos = await getDeviceCurrentLocation();
      setLatitude(pos.latitude);
      setLongitude(pos.longitude);
      setGpsMsg(`Berhasil membaca GPS perangkat admin: ${pos.latitude.toFixed(6)}, ${pos.longitude.toFixed(6)}`);
    } catch (err: any) {
      setGpsMsg(`Gagal membaca lokasi: ${err.message}`);
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (selectedLocId) {
      // Update
      updateLocation(selectedLocId, {
        name,
        address,
        latitude,
        longitude,
        radiusMeters,
      });
      setIsEditing(false);
    } else {
      // Create new
      addLocation({
        name,
        address,
        latitude,
        longitude,
        radiusMeters,
        isActive: true,
        isMainOffice: false,
      });
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-400" />
            <span>Pengaturan Titik GPS & Radius Geofencing</span>
          </h2>
          <p className="text-xs text-slate-400">
            Tentukan koordinat pusat kantor gereja dan batas toleransi jarak presensi bagi pegawai.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Lokasi Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Location List */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Daftar Lokasi Gereja ({locations.length})
          </p>
          <div className="space-y-2">
            {locations.map((loc) => {
              const isSelected = (selectedLoc?.id === loc.id && !isEditing) || (selectedLocId === loc.id);
              return (
                <div
                  key={loc.id}
                  onClick={() => handleSelectLocation(loc)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs">{loc.name}</span>
                        {loc.isMainOffice && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500 text-slate-950">
                            Pusat
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{loc.address}</p>
                      <p className="text-[10px] font-mono text-amber-400">
                        Radius: {loc.radiusMeters} meter • ({loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)})
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectLocation(loc);
                          setIsEditing(true);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        title="Edit Lokasi"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!loc.isMainOffice && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingLocation(loc);
                          }}
                          className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-slate-800 transition cursor-pointer"
                          title="Hapus Lokasi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Map and Geofence Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Interactive Leaflet Map */}
          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">
                Peta Geofence Interaktif ({name || selectedLoc?.name})
              </span>
              <span className="text-[11px] text-amber-400">
                Lingkaran Kuning = Radius Presensi ({isEditing ? radiusMeters : selectedLoc?.radiusMeters}m)
              </span>
            </div>

            <ChurchMap
              centerLat={isEditing ? latitude : selectedLoc?.latitude || -2.97342}
              centerLng={isEditing ? longitude : selectedLoc?.longitude || 119.89785}
              radiusMeters={isEditing ? radiusMeters : selectedLoc?.radiusMeters || 100}
              churchName={name || selectedLoc?.name}
              isEditable={isEditing}
              onPositionChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
              className="h-72 w-full"
            />
          </div>

          {/* Form when editing or viewing */}
          {isEditing ? (
            <form onSubmit={handleSave} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-sm">
                  {selectedLocId ? 'Edit Lokasi Presensi' : 'Tambah Titik Lokasi Presensi Baru'}
                </span>
                <button
                  type="button"
                  onClick={handleFetchAdminLocation}
                  disabled={gpsLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold transition cursor-pointer"
                >
                  <Compass className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                  <span>Gunakan Lokasi Perangkat Saya</span>
                </button>
              </div>

              {gpsMsg && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-amber-500/30 text-amber-300 text-[11px]">
                  {gpsMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nama Lokasi</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Gedung Gereja Pusat"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Radius Presensi (Meter)</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    required
                    value={radiusMeters}
                    onChange={(e) => setRadiusMeters(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Alamat jalan, kelurahan, kecamatan..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Latitude (Lintang)</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Longitude (Bujur)</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Pengaturan Lokasi</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
              <div className="space-y-1">
                <p className="font-bold text-white text-sm">{selectedLoc?.name}</p>
                <p className="text-slate-400">{selectedLoc?.address}</p>
                <p className="font-mono text-amber-400">
                  Koordinat: {selectedLoc?.latitude}, {selectedLoc?.longitude} • Radius: {selectedLoc?.radiusMeters} meter
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (selectedLoc) handleSelectLocation(selectedLoc);
                  setIsEditing(true);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold transition"
              >
                Ubah Lokasi Ini
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Konfirmasi Hapus Lokasi */}
      <ConfirmModal
        isOpen={!!deletingLocation}
        title="Hapus Titik Lokasi Presensi?"
        message={`Apakah Anda yakin ingin menghapus lokasi "${deletingLocation?.name}"? Lokasi ini tidak akan lagi tersedia untuk validasi radius pegawai.`}
        confirmLabel="Ya, Hapus Lokasi"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={() => {
          if (deletingLocation) {
            deleteLocation(deletingLocation.id);
            if (selectedLocId === deletingLocation.id) {
              setSelectedLocId(locations[0]?.id || '');
            }
            setActionToast(`Lokasi "${deletingLocation.name}" berhasil dihapus!`);
            setDeletingLocation(null);
            setTimeout(() => setActionToast(null), 3000);
          }
        }}
        onCancel={() => setDeletingLocation(null)}
      />

      {/* Action Toast Notification */}
      {actionToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionToast}</span>
        </div>
      )}
    </div>
  );
};
