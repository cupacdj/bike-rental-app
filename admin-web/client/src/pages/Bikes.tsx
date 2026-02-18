import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bike,
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  X,
  Check,
  AlertCircle,
  Loader2,
  LucideIcon,
  Map,
  QrCode,
  Download,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { bikesApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import type {
  Bike as BikeType,
  BikeType as BikeTypeEnum,
  BikeStatus,
  BikeFormData,
  BikeFormErrors,
} from "../types";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface BikeTypeInfo {
  value: BikeTypeEnum;
  label: string;
  color: string;
}

interface BikeStatusInfo {
  value: BikeStatus;
  label: string;
  color: string;
  icon: LucideIcon;
}

const BIKE_TYPES: BikeTypeInfo[] = [
  { value: "CITY", label: "Gradski", color: "#10b981" },
  { value: "E-BIKE", label: "Električni", color: "#6366f1" },
  { value: "MTB", label: "Brdski (MTB)", color: "#f59e0b" },
];

const BIKE_STATUSES: BikeStatusInfo[] = [
  { value: "available", label: "Dostupan", color: "#10b981", icon: Check },
  { value: "rented", label: "Iznajmljen", color: "#6366f1", icon: Bike },
  {
    value: "maintenance",
    label: "Održavanje",
    color: "#f59e0b",
    icon: AlertCircle,
  },
  { value: "disabled", label: "Isključen", color: "#ef4444", icon: X },
];

function StatusBadge({ status }: { status: BikeStatus }): JSX.Element {
  const statusInfo =
    BIKE_STATUSES.find((s) => s.value === status) || BIKE_STATUSES[0];
  const Icon = statusInfo.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        background: `${statusInfo.color}15`,
        color: statusInfo.color,
      }}
    >
      <Icon size={12} />
      {statusInfo.label}
    </span>
  );
}

function TypeBadge({ type }: { type: BikeTypeEnum }): JSX.Element {
  const typeInfo = BIKE_TYPES.find((t) => t.value === type) || BIKE_TYPES[0];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        background: `${typeInfo.color}15`,
        color: typeInfo.color,
      }}
    >
      {typeInfo.label}
    </span>
  );
}

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

interface BikeModalProps {
  bike: BikeType | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

function BikeModal({
  bike,
  isOpen,
  onClose,
  onSave,
}: BikeModalProps): JSX.Element | null {
  const [form, setForm] = useState<BikeFormData>({
    label: "",
    type: "CITY",
    pricePerHour: "",
    lat: "",
    lng: "",
    status: "available",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<BikeFormErrors>({});
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (bike) {
      setForm({
        label: bike.label || "",
        type: bike.type || "CITY",
        pricePerHour: bike.pricePerHour?.toString() || "",
        lat: bike.lat?.toString() || "",
        lng: bike.lng?.toString() || "",
        status: bike.status || "available",
      });
    } else {
      setForm({
        label: "",
        type: "CITY",
        pricePerHour: "",
        lat: "",
        lng: "",
        status: "available",
      });
    }
    setErrors({});
  }, [bike, isOpen]);

  const validate = (): boolean => {
    const newErrors: BikeFormErrors = {};
    if (!form.label.trim()) newErrors.label = "Oznaka je obavezna";
    if (!form.pricePerHour || parseFloat(form.pricePerHour) <= 0) {
      newErrors.pricePerHour = "Cena mora biti pozitivna";
    }
    if (!form.lat || parseFloat(form.lat) < -90 || parseFloat(form.lat) > 90) {
      newErrors.lat = "Nevalidna geografska širina (-90 do 90)";
    }
    if (
      !form.lng ||
      parseFloat(form.lng) < -180 ||
      parseFloat(form.lng) > 180
    ) {
      newErrors.lng = "Nevalidna geografska dužina (-180 do 180)";
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
        label: form.label.trim(),
        type: form.type,
        pricePerHour: parseFloat(form.pricePerHour),
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        status: form.status,
      };

      if (bike) {
        await bikesApi.update(bike.id, data);
        showSuccess("Bicikl je uspešno izmenjen");
      } else {
        await bikesApi.create(data);
        showSuccess("Bicikl je uspešno dodat");
      }
      onSave();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Greška";
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
            {bike ? "Izmeni bicikl" : "Dodaj novi bicikl"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Label */}
          <div>
            <label className="label">Oznaka bicikla *</label>
            <input
              type="text"
              value={form.label}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setForm({ ...form, label: e.target.value })
              }
              className={`input ${errors.label ? "border-red-500" : ""}`}
              placeholder="npr. BG-011"
            />
            {errors.label && (
              <p className="text-red-400 text-xs mt-1">{errors.label}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="label">Tip bicikla</label>
            <select
              value={form.type}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setForm({ ...form, type: e.target.value as BikeTypeEnum })
              }
              className="select"
            >
              {BIKE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="label">Cena po satu (RSD) *</label>
            <div className="relative">
              <input
                type="number"
                value={form.pricePerHour}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, pricePerHour: e.target.value })
                }
                className={`input pl-11 ${errors.pricePerHour ? "border-red-500" : ""}`}
                placeholder="120"
                min="0"
                step="10"
              />
            </div>
            {errors.pricePerHour && (
              <p className="text-red-400 text-xs mt-1">{errors.pricePerHour}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="label flex items-center gap-2">
              <Map size={16} />
              Lokacija bicikla *{" "}
              <span className="text-slate-500 font-normal">
                (kliknite na mapu)
              </span>
            </label>

            {/* Map Picker */}
            <div
              className="rounded-xl overflow-hidden border border-slate-700 mb-3"
              style={{ height: "350px" }}
            >
              <MapContainer
                center={[
                  form.lat ? parseFloat(form.lat) : 44.8166,
                  form.lng ? parseFloat(form.lng) : 20.4602,
                ]}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPicker
                  onLocationSelect={(lat, lng) => {
                    setForm({
                      ...form,
                      lat: lat.toFixed(6),
                      lng: lng.toFixed(6),
                    });
                  }}
                />
                {form.lat && form.lng && (
                  <Marker
                    position={[parseFloat(form.lat), parseFloat(form.lng)]}
                  />
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
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, lat: e.target.value })
                  }
                  className={`input ${errors.lat ? "border-red-500" : ""}`}
                  placeholder="44.8166"
                  step="0.000001"
                />
                {errors.lat && (
                  <p className="text-red-400 text-xs mt-1">{errors.lat}</p>
                )}
              </div>
              <div>
                <label className="label text-xs">Geografska dužina</label>
                <input
                  type="number"
                  value={form.lng}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, lng: e.target.value })
                  }
                  className={`input ${errors.lng ? "border-red-500" : ""}`}
                  placeholder="20.4602"
                  step="0.000001"
                />
                {errors.lng && (
                  <p className="text-red-400 text-xs mt-1">{errors.lng}</p>
                )}
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="label">Status</label>
            <select
              value={form.status}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setForm({ ...form, status: e.target.value as BikeStatus })
              }
              className="select"
            >
              {BIKE_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* QR Code Preview (only for existing bikes) */}
          {bike && (
            <div>
              <label className="label flex items-center gap-2">
                <QrCode size={16} />
                QR kod bicikla
              </label>
              <div className="flex items-center gap-4">
                <div className="w-32 h-32 rounded-xl border border-slate-700 overflow-hidden bg-white flex items-center justify-center">
                  <img
                    src={`/api/bikes/${bike.id}/qr`}
                    alt={`QR kod za ${bike.label}`}
                    className="w-28 h-28 object-contain"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <a
                    href={`/api/bikes/${bike.id}/qr`}
                    download={`${bike.label}-qr.png`}
                    className="btn btn-secondary text-sm"
                  >
                    <Download size={16} />
                    Preuzmi QR
                  </a>
                  <p className="text-xs text-slate-500">
                    Štampajte i zalepite na bicikl
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Otkaži
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sačuvaj
                </>
              ) : (
                <>
                  <Check size={18} />
                  {bike ? "Sačuvaj izmene" : "Dodaj bicikl"}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

interface StatusChangeModalProps {
  bike: BikeType | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

function StatusChangeModal({
  bike,
  isOpen,
  onClose,
  onSave,
}: StatusChangeModalProps): JSX.Element | null {
  const [status, setStatus] = useState<BikeStatus>(bike?.status || "available");
  const [loading, setLoading] = useState<boolean>(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (bike) setStatus(bike.status);
  }, [bike]);

  const handleSubmit = async (): Promise<void> => {
    if (!bike) return;
    setLoading(true);
    try {
      await bikesApi.updateStatus(bike.id, status);
      showSuccess("Status bicikla je uspešno promenjen");
      onSave();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Greška";
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !bike) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="modal w-full max-w-md"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            Promeni status bicikla
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <p className="text-slate-400 mb-4">
          Bicikl: <span className="text-white font-medium">{bike.label}</span>
        </p>

        <div className="space-y-2 mb-6">
          {BIKE_STATUSES.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  status === s.value
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-slate-700 hover:border-slate-600 bg-slate-800/50"
                }`}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${s.color}15` }}
                >
                  <Icon size={20} style={{ color: s.color }} />
                </div>
                <span
                  className={
                    status === s.value ? "text-white" : "text-slate-300"
                  }
                >
                  {s.label}
                </span>
                {status === s.value && (
                  <Check size={18} className="ml-auto text-indigo-400" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn btn-secondary flex-1">
            Otkaži
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn-primary flex-1"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Check size={18} />
            )}
            Potvrdi
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  bike: BikeType | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteConfirmModal({
  bike,
  isOpen,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps): JSX.Element | null {
  const [loading, setLoading] = useState<boolean>(false);
  const { showSuccess, showError } = useToast();

  const handleDelete = async (): Promise<void> => {
    if (!bike) return;
    setLoading(true);
    try {
      await bikesApi.delete(bike.id);
      showSuccess("Bicikl je uspešno obrisan");
      onConfirm();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Greška";
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !bike) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="modal w-full max-w-md text-center"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={32} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Obriši bicikl?</h2>
        <p className="text-slate-400 mb-6">
          Da li ste sigurni da želite da obrišete bicikl{" "}
          <span className="text-white font-medium">{bike.label}</span>? Ova
          akcija se ne može poništiti.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn btn-secondary flex-1">
            Otkaži
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="btn btn-danger flex-1"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Trash2 size={18} />
            )}
            Obriši
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Bikes(): JSX.Element {
  const [bikes, setBikes] = useState<BikeType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [statusModalOpen, setStatusModalOpen] = useState<boolean>(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [selectedBike, setSelectedBike] = useState<BikeType | null>(null);
  const { showError } = useToast();

  useEffect(() => {
    loadBikes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBikes = async (): Promise<void> => {
    try {
      const data = await bikesApi.getAll();
      setBikes(data);
    } catch (error) {
      showError("Greška pri učitavanju bicikala");
    } finally {
      setLoading(false);
    }
  };

  const filteredBikes = bikes.filter((bike) => {
    const matchesSearch =
      bike.label.toLowerCase().includes(search.toLowerCase()) ||
      bike.id.toLowerCase().includes(search.toLowerCase());
    const matchesType = !filterType || bike.type === filterType;
    const matchesStatus = !filterStatus || bike.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const openEditModal = (bike: BikeType): void => {
    setSelectedBike(bike);
    setModalOpen(true);
  };

  const openAddModal = (): void => {
    setSelectedBike(null);
    setModalOpen(true);
  };

  const openStatusModal = (bike: BikeType): void => {
    setSelectedBike(bike);
    setStatusModalOpen(true);
  };

  const openDeleteModal = (bike: BikeType): void => {
    setSelectedBike(bike);
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Bicikli</h1>
          <p className="text-slate-400 mt-1">Upravljanje flotom bicikala</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={18} />
          Dodaj bicikl
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSearch(e.target.value)
              }
              className="input !pl-11"
              placeholder="Pretraži po oznaci ili ID-u..."
            />
          </div>
          <div className="flex gap-4">
            <select
              value={filterType}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setFilterType(e.target.value)
              }
              className="select w-40"
            >
              <option value="">Svi tipovi</option>
              {BIKE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setFilterStatus(e.target.value)
              }
              className="select w-40"
            >
              <option value="">Svi statusi</option>
              {BIKE_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-lg" />
            ))}
          </div>
        </div>
      ) : filteredBikes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card text-center py-12"
        >
          <Bike size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {bikes.length === 0
              ? "Nema bicikala u sistemu"
              : "Nema rezultata pretrage"}
          </h3>
          <p className="text-slate-400 mb-6">
            {bikes.length === 0
              ? "Dodajte prvi bicikl da biste počeli sa radom"
              : "Pokušajte sa drugim kriterijumima pretrage"}
          </p>
          {bikes.length === 0 && (
            <button onClick={openAddModal} className="btn btn-primary">
              <Plus size={18} />
              Dodaj bicikl
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="table-container"
        >
          <table>
            <thead>
              <tr>
                <th>Oznaka</th>
                <th>Tip</th>
                <th>Cena/sat</th>
                <th>Lokacija</th>
                <th>Status</th>
                <th>QR Kod</th>
                <th className="text-right">Akcije</th>
              </tr>
            </thead>
            <tbody>
              {filteredBikes.map((bike, index) => (
                <motion.tr
                  key={bike.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <Bike size={20} className="text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{bike.label}</p>
                        <p className="text-xs text-slate-500">{bike.id}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <TypeBadge type={bike.type} />
                  </td>
                  <td className="text-white font-medium">
                    {bike.pricePerHour} RSD
                  </td>
                  <td>
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin size={14} />
                      <span className="text-sm">
                        {bike.lat.toFixed(4)}, {bike.lng.toFixed(4)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <button onClick={() => openStatusModal(bike)}>
                      <StatusBadge status={bike.status} />
                    </button>
                  </td>
                  <td>
                    <a
                      href={`/api/bikes/${bike.id}/qr`}
                      download={`${bike.label}-qr.png`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition text-xs font-medium"
                      title="Preuzmi QR kod"
                    >
                      <QrCode size={14} />
                      <Download size={12} />
                    </a>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(bike)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition"
                        title="Izmeni"
                      >
                        <Edit2 size={16} className="text-slate-400" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(bike)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition"
                        title="Obriši"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {BIKE_STATUSES.map((status) => {
          const count = bikes.filter((b) => b.status === status.value).length;
          const Icon = status.icon;
          return (
            <div key={status.value} className="card py-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${status.color}15` }}
                >
                  <Icon size={20} style={{ color: status.color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className="text-xs text-slate-400">{status.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modalOpen && (
          <BikeModal
            bike={selectedBike}
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSave={loadBikes}
          />
        )}
        {statusModalOpen && (
          <StatusChangeModal
            bike={selectedBike}
            isOpen={statusModalOpen}
            onClose={() => setStatusModalOpen(false)}
            onSave={loadBikes}
          />
        )}
        {deleteModalOpen && (
          <DeleteConfirmModal
            bike={selectedBike}
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onConfirm={loadBikes}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Bikes;
