import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ParkingSquare,
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  MapPin,
  X,
  Check,
  Loader2,
  Map,
  Circle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle as LeafletCircle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { parkingZonesApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import type { ParkingZone, ParkingZoneFormData, ParkingZoneFormErrors } from '../types';

// Fix for default marker icon in Leaflet with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom parking icon
const parkingIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Map click handler component
interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

function LocationPicker({ onLocationSelect }: LocationPickerProps): null {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to recenter map when location changes
interface MapCenterProps {
  lat: number;
  lng: number;
}

function MapCenter({ lat, lng }: MapCenterProps): null {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
}

interface ZoneModalProps {
  zone: ParkingZone | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

function ZoneModal({ zone, isOpen, onClose, onSave }: ZoneModalProps): JSX.Element | null {
  const [form, setForm] = useState<ParkingZoneFormData>({
    name: '',
    lat: '',
    lng: '',
    radiusMeters: '100'
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<ParkingZoneFormErrors>({});
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (zone) {
      setForm({
        name: zone.name || '',
        lat: zone.lat?.toString() || '',
        lng: zone.lng?.toString() || '',
        radiusMeters: zone.radiusMeters?.toString() || '100'
      });
    } else {
      setForm({
        name: '',
        lat: '',
        lng: '',
        radiusMeters: '100'
      });
    }
    setErrors({});
  }, [zone, isOpen]);

  const validate = (): boolean => {
    const newErrors: ParkingZoneFormErrors = {};
    if (!form.name.trim()) newErrors.name = 'Naziv je obavezan';
    if (!form.lat || parseFloat(form.lat) < -90 || parseFloat(form.lat) > 90) {
      newErrors.lat = 'Nevalidna geografska širina (-90 do 90)';
    }
    if (!form.lng || parseFloat(form.lng) < -180 || parseFloat(form.lng) > 180) {
      newErrors.lng = 'Nevalidna geografska dužina (-180 do 180)';
    }
    const radius = parseInt(form.radiusMeters, 10);
    if (!form.radiusMeters || radius <= 0 || radius > 1000) {
      newErrors.radiusMeters = 'Radijus mora biti između 1 i 1000 metara';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const data = {
        name: form.name.trim(),
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        radiusMeters: parseInt(form.radiusMeters, 10)
      };

      if (zone) {
        await parkingZonesApi.update(zone.id, data);
        showSuccess('Parking zona je uspešno izmenjena');
      } else {
        await parkingZonesApi.create(data);
        showSuccess('Parking zona je uspešno dodata');
      }
      onSave();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Greška';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentLat = form.lat ? parseFloat(form.lat) : 44.8166;
  const currentLng = form.lng ? parseFloat(form.lng) : 20.4602;
  const currentRadius = form.radiusMeters ? parseInt(form.radiusMeters, 10) : 100;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="modal w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {zone ? 'Izmeni parking zonu' : 'Dodaj novu parking zonu'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="label">Naziv parking zone *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })}
              className={`input ${errors.name ? 'border-red-500' : ''}`}
              placeholder="npr. Trg Republike"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Location */}
          <div>
            <label className="label flex items-center gap-2">
              <Map size={16} />
              Lokacija * <span className="text-slate-500 font-normal">(kliknite na mapu)</span>
            </label>
            
            {/* Map Picker */}
            <div className="rounded-xl overflow-hidden border border-slate-700 mb-3" style={{ height: '250px' }}>
              <MapContainer
                center={[currentLat, currentLng]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPicker 
                  onLocationSelect={(lat, lng) => {
                    setForm({ ...form, lat: lat.toFixed(6), lng: lng.toFixed(6) });
                  }} 
                />
                {form.lat && form.lng && (
                  <>
                    <MapCenter lat={parseFloat(form.lat)} lng={parseFloat(form.lng)} />
                    <Marker position={[parseFloat(form.lat), parseFloat(form.lng)]} icon={parkingIcon} />
                    <LeafletCircle
                      center={[parseFloat(form.lat), parseFloat(form.lng)]}
                      radius={currentRadius}
                      pathOptions={{
                        color: '#6366f1',
                        fillColor: '#6366f1',
                        fillOpacity: 0.2
                      }}
                    />
                  </>
                )}
              </MapContainer>
            </div>

            {/* Coordinate inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label text-xs">Geografska širina</label>
                <input
                  type="number"
                  value={form.lat}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, lat: e.target.value })}
                  className={`input ${errors.lat ? 'border-red-500' : ''}`}
                  placeholder="44.8166"
                  step="0.000001"
                />
                {errors.lat && <p className="text-red-400 text-xs mt-1">{errors.lat}</p>}
              </div>
              <div>
                <label className="label text-xs">Geografska dužina</label>
                <input
                  type="number"
                  value={form.lng}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, lng: e.target.value })}
                  className={`input ${errors.lng ? 'border-red-500' : ''}`}
                  placeholder="20.4602"
                  step="0.000001"
                />
                {errors.lng && <p className="text-red-400 text-xs mt-1">{errors.lng}</p>}
              </div>
            </div>
          </div>

          {/* Radius */}
          <div>
            <label className="label flex items-center gap-2">
              <Circle size={16} />
              Radijus zone (metara) *
            </label>
            <input
              type="number"
              value={form.radiusMeters}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, radiusMeters: e.target.value })}
              className={`input ${errors.radiusMeters ? 'border-red-500' : ''}`}
              placeholder="100"
              min="1"
              max="1000"
              step="10"
            />
            {errors.radiusMeters && <p className="text-red-400 text-xs mt-1">{errors.radiusMeters}</p>}
            <p className="text-slate-500 text-xs mt-1">
              Preporučeno: 100-300m za manje zone, 300-500m za veće zone
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Otkaži
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sačuvaj
                </>
              ) : (
                <>
                  <Check size={18} />
                  {zone ? 'Sačuvaj izmene' : 'Dodaj zonu'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

interface DeleteModalProps {
  zone: ParkingZone | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

function DeleteModal({ zone, isOpen, onClose, onConfirm, loading }: DeleteModalProps): JSX.Element | null {
  if (!isOpen || !zone) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="modal max-w-md"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="text-red-400" size={24} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Obriši parking zonu</h3>
          <p className="text-slate-400 mb-6">
            Da li ste sigurni da želite da obrišete parking zonu <span className="text-white font-medium">"{zone.name}"</span>?
            Ova akcija je nepovratna.
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-secondary flex-1">
              Otkaži
            </button>
            <button 
              onClick={onConfirm} 
              disabled={loading}
              className="btn bg-red-500 hover:bg-red-600 text-white flex-1"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              Obriši
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ParkingZones(): JSX.Element {
  const [zones, setZones] = useState<ParkingZone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [selectedZone, setSelectedZone] = useState<ParkingZone | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const { showSuccess, showError } = useToast();

  const fetchZones = React.useCallback(async (): Promise<void> => {
    try {
      const data = await parkingZonesApi.getAll();
      setZones(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Greška pri učitavanju';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handleDelete = async (): Promise<void> => {
    if (!selectedZone) return;
    setDeleteLoading(true);
    try {
      await parkingZonesApi.delete(selectedZone.id);
      showSuccess('Parking zona je uspešno obrisana');
      setDeleteModalOpen(false);
      setSelectedZone(null);
      fetchZones();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Greška';
      showError(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredZones = zones.filter(zone =>
    zone.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Parking zone</h1>
          <p className="text-slate-400 mt-1">Upravljajte parking zonama za vraćanje bicikala</p>
        </div>
        <button
          onClick={() => { setSelectedZone(null); setModalOpen(true); }}
          className="btn btn-primary"
        >
          <Plus size={18} />
          Dodaj zonu
        </button>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Pretraži po nazivu..."
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="input pl-11 w-full"
            />
          </div>
        </div>

        {/* Stats Card */}
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <ParkingSquare className="text-indigo-400" size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{zones.length}</p>
            <p className="text-xs text-slate-400">Ukupno zona</p>
          </div>
        </div>
      </div>

      {/* Map Overview */}
      <div className="card p-4">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Map size={20} className="text-indigo-400" />
          Pregled svih zona
        </h2>
        <div className="rounded-xl overflow-hidden border border-slate-700" style={{ height: '350px' }}>
          <MapContainer
            center={[44.8166, 20.4602]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {zones.map(zone => (
              <React.Fragment key={zone.id}>
                <Marker position={[zone.lat, zone.lng]} icon={parkingIcon} />
                <LeafletCircle
                  center={[zone.lat, zone.lng]}
                  radius={zone.radiusMeters}
                  pathOptions={{
                    color: '#6366f1',
                    fillColor: '#6366f1',
                    fillOpacity: 0.2
                  }}
                />
              </React.Fragment>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Zones List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-indigo-400" size={32} />
          </div>
        ) : filteredZones.length === 0 ? (
          <div className="text-center py-12">
            <ParkingSquare className="mx-auto text-slate-600 mb-4" size={48} />
            <h3 className="text-lg font-medium text-white mb-1">
              {searchTerm ? 'Nema rezultata' : 'Nema parking zona'}
            </h3>
            <p className="text-slate-400">
              {searchTerm 
                ? 'Pokušajte sa drugim pojmom za pretragu' 
                : 'Kliknite "Dodaj zonu" da dodate prvu parking zonu'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Naziv</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Lokacija</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Radijus</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">Akcije</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredZones.map((zone, index) => (
                    <motion.tr
                      key={zone.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-slate-700/50 hover:bg-slate-800/50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                            <ParkingSquare className="text-indigo-400" size={20} />
                          </div>
                          <span className="font-medium text-white">{zone.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <MapPin size={14} />
                          <span>{zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400">
                          <Circle size={12} />
                          {zone.radiusMeters}m
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSelectedZone(zone); setModalOpen(true); }}
                            className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-white"
                            title="Izmeni"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => { setSelectedZone(zone); setDeleteModalOpen(true); }}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition text-slate-400 hover:text-red-400"
                            title="Obriši"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modalOpen && (
          <ZoneModal
            zone={selectedZone}
            isOpen={modalOpen}
            onClose={() => { setModalOpen(false); setSelectedZone(null); }}
            onSave={fetchZones}
          />
        )}
        {deleteModalOpen && (
          <DeleteModal
            zone={selectedZone}
            isOpen={deleteModalOpen}
            onClose={() => { setDeleteModalOpen(false); setSelectedZone(null); }}
            onConfirm={handleDelete}
            loading={deleteLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
