import React, { useState, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Search, 
  User,
  Bike,
  MapPin,
  DollarSign,
  X,
  Image,
  Eye,
  CheckCircle,
  PlayCircle
} from 'lucide-react';
import { rentalsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import type { Rental, RentalStatus } from '../types';

function formatDate(timestamp: number | undefined): string {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleString('sr-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDuration(startAt: number | undefined, endAt: number | undefined): string {
  if (!startAt) return '-';
  const end = endAt || Date.now();
  const diff = end - startAt;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}

function StatusBadge({ status }: { status: RentalStatus }): JSX.Element {
  const isActive = status === 'active';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      isActive 
        ? 'bg-indigo-500/15 text-indigo-400' 
        : 'bg-emerald-500/15 text-emerald-400'
    }`}>
      {isActive ? <PlayCircle size={12} /> : <CheckCircle size={12} />}
      {isActive ? 'Aktivno' : 'Završeno'}
    </span>
  );
}

interface RentalDetailsModalProps {
  rental: Rental | null;
  isOpen: boolean;
  onClose: () => void;
}

function RentalDetailsModal({ rental, isOpen, onClose }: RentalDetailsModalProps): JSX.Element | null {
  if (!isOpen || !rental) return null;

  const duration = rental.endAt 
    ? formatDuration(rental.startAt, rental.endAt)
    : formatDuration(rental.startAt, undefined);

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
          <h2 className="text-xl font-bold text-white">Detalji iznajmljivanja</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-4">
            <StatusBadge status={rental.status} />
            <span className="text-slate-400 text-sm">ID: {rental.id}</span>
          </div>

          {/* User Info */}
          <div className="card bg-slate-800/50">
            <div className="flex items-center gap-3 mb-4">
              <User size={20} className="text-indigo-400" />
              <h3 className="font-semibold text-white">Korisnik</h3>
            </div>
            {rental.user ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Ime i prezime</p>
                  <p className="text-white">{rental.user.firstName} {rental.user.lastName}</p>
                </div>
                <div>
                  <p className="text-slate-400">Korisničko ime</p>
                  <p className="text-white">@{rental.user.username}</p>
                </div>
                <div>
                  <p className="text-slate-400">Email</p>
                  <p className="text-white">{rental.user.email}</p>
                </div>
                <div>
                  <p className="text-slate-400">Telefon</p>
                  <p className="text-white">{rental.user.phone}</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-400">Podaci o korisniku nisu dostupni</p>
            )}
          </div>

          {/* Bike Info */}
          <div className="card bg-slate-800/50">
            <div className="flex items-center gap-3 mb-4">
              <Bike size={20} className="text-emerald-400" />
              <h3 className="font-semibold text-white">Bicikl</h3>
            </div>
            {rental.bike ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Oznaka</p>
                  <p className="text-white">{rental.bike.label}</p>
                </div>
                <div>
                  <p className="text-slate-400">Tip</p>
                  <p className="text-white">{rental.bike.type}</p>
                </div>
                <div>
                  <p className="text-slate-400">Cena po satu</p>
                  <p className="text-white">{rental.bike.pricePerHour} RSD</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-400">Podaci o biciklu nisu dostupni</p>
            )}
          </div>

          {/* Time Info */}
          <div className="card bg-slate-800/50">
            <div className="flex items-center gap-3 mb-4">
              <Clock size={20} className="text-amber-400" />
              <h3 className="font-semibold text-white">Vremenske informacije</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Početak</p>
                <p className="text-white">{formatDate(rental.startAt)}</p>
              </div>
              <div>
                <p className="text-slate-400">Završetak</p>
                <p className="text-white">{rental.endAt ? formatDate(rental.endAt) : 'U toku'}</p>
              </div>
              <div>
                <p className="text-slate-400">Trajanje</p>
                <p className="text-white">{duration}</p>
              </div>
              <div>
                <p className="text-slate-400">Ukupna cena</p>
                <p className="text-white font-semibold">
                  {rental.totalPrice ? `${rental.totalPrice.toLocaleString()} RSD` : 'Nije obračunato'}
                </p>
              </div>
            </div>
          </div>

          {/* Location Info */}
          {(rental.startLat || rental.endLat) && (
            <div className="card bg-slate-800/50">
              <div className="flex items-center gap-3 mb-4">
                <MapPin size={20} className="text-rose-400" />
                <h3 className="font-semibold text-white">Lokacije</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {rental.startLat && rental.startLng && (
                  <div>
                    <p className="text-slate-400">Početna lokacija</p>
                    <p className="text-white">{rental.startLat.toFixed(4)}, {rental.startLng.toFixed(4)}</p>
                  </div>
                )}
                {rental.endLat && rental.endLng && (
                  <div>
                    <p className="text-slate-400">Krajnja lokacija</p>
                    <p className="text-white">{rental.endLat.toFixed(4)}, {rental.endLng.toFixed(4)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Return Photo */}
          {rental.returnPhotoUri && (
            <div className="card bg-slate-800/50">
              <div className="flex items-center gap-3 mb-4">
                <Image size={20} className="text-cyan-400" />
                <h3 className="font-semibold text-white">Fotografija pri vraćanju</h3>
              </div>
              <div className="rounded-lg overflow-hidden bg-slate-900">
                <img
                  src={rental.returnPhotoUri}
                  alt="Fotografija pri vraćanju"
                  className="w-full max-h-80 object-contain"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      target.parentElement.innerHTML = '<p class="text-slate-400 text-center py-8">Fotografija nije dostupna</p>';
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-700">
          <button onClick={onClose} className="btn btn-secondary w-full">
            Zatvori
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Rentals(): JSX.Element {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const { showError } = useToast();

  useEffect(() => {
    loadRentals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRentals = async (): Promise<void> => {
    try {
      const data = await rentalsApi.getAll();
      setRentals(data);
    } catch (error) {
      showError('Greška pri učitavanju iznajmljivanja');
    } finally {
      setLoading(false);
    }
  };

  const filteredRentals = rentals.filter(rental => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      rental.id.toLowerCase().includes(searchLower) ||
      rental.user?.username?.toLowerCase().includes(searchLower) ||
      rental.user?.firstName?.toLowerCase().includes(searchLower) ||
      rental.user?.lastName?.toLowerCase().includes(searchLower) ||
      rental.bike?.label?.toLowerCase().includes(searchLower);
    const matchesStatus = !filterStatus || rental.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const openDetails = (rental: Rental): void => {
    setSelectedRental(rental);
    setDetailsOpen(true);
  };

  const activeCount = rentals.filter(r => r.status === 'active').length;
  const finishedCount = rentals.filter(r => r.status === 'finished').length;
  const totalRevenue = rentals
    .filter(r => r.status === 'finished' && r.totalPrice)
    .reduce((sum, r) => sum + (r.totalPrice || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Iznajmljivanja</h1>
        <p className="text-slate-400 mt-1">Pregled svih iznajmljivanja u sistemu</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/15 flex items-center justify-center">
              <PlayCircle size={20} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{activeCount}</p>
              <p className="text-xs text-slate-400">Aktivna iznajmljivanja</p>
            </div>
          </div>
        </div>
        <div className="card py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{finishedCount}</p>
              <p className="text-xs text-slate-400">Završena iznajmljivanja</p>
            </div>
          </div>
        </div>
        <div className="card py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <DollarSign size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalRevenue.toLocaleString()} RSD</p>
              <p className="text-xs text-slate-400">Ukupan prihod</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="input pl-11"
              placeholder="Pretraži po korisniku, biciklu..."
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
            className="select w-48"
          >
            <option value="">Svi statusi</option>
            <option value="active">Aktivna</option>
            <option value="finished">Završena</option>
          </select>
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
      ) : filteredRentals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card text-center py-12"
        >
          <Clock size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {rentals.length === 0 ? 'Nema iznajmljivanja u sistemu' : 'Nema rezultata pretrage'}
          </h3>
          <p className="text-slate-400">
            {rentals.length === 0 
              ? 'Iznajmljivanja će se pojaviti kada korisnici počnu da koriste sistem'
              : 'Pokušajte sa drugim kriterijumima pretrage'}
          </p>
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
                <th>Korisnik</th>
                <th>Bicikl</th>
                <th>Početak</th>
                <th>Trajanje</th>
                <th>Cena</th>
                <th>Status</th>
                <th className="text-right">Akcije</th>
              </tr>
            </thead>
            <tbody>
              {filteredRentals.map((rental, index) => (
                <motion.tr
                  key={rental.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {rental.user?.firstName?.[0]}{rental.user?.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {rental.user ? `${rental.user.firstName} ${rental.user.lastName}` : 'Nepoznat'}
                        </p>
                        <p className="text-xs text-slate-500">
                          @{rental.user?.username || '-'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Bike size={16} className="text-slate-400" />
                      <span className="text-white">{rental.bike?.label || '-'}</span>
                    </div>
                  </td>
                  <td className="text-slate-300 text-sm">
                    {formatDate(rental.startAt)}
                  </td>
                  <td className="text-slate-300">
                    {formatDuration(rental.startAt, rental.endAt)}
                  </td>
                  <td className="text-white font-medium">
                    {rental.totalPrice ? `${rental.totalPrice.toLocaleString()} RSD` : '-'}
                  </td>
                  <td>
                    <StatusBadge status={rental.status} />
                  </td>
                  <td>
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => openDetails(rental)}
                        className="btn btn-ghost btn-sm"
                      >
                        <Eye size={16} />
                        Detalji
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Details Modal */}
      <AnimatePresence>
        {detailsOpen && (
          <RentalDetailsModal
            rental={selectedRental}
            isOpen={detailsOpen}
            onClose={() => setDetailsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Rentals;
