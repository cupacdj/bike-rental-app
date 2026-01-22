import React, { useState, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Search, 
  User,
  Bike,
  X,
  Image,
  Eye,
  MessageSquare,
  Wrench,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Check,
  LucideIcon
} from 'lucide-react';
import { issuesApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import type { Issue, IssueStatus } from '../types';

interface IssueStatusInfo {
  value: IssueStatus;
  label: string;
  color: string;
  icon: LucideIcon;
}

const ISSUE_STATUSES: IssueStatusInfo[] = [
  { value: 'open', label: 'Otvoreno', color: '#f59e0b', icon: AlertTriangle },
  { value: 'in-progress', label: 'U obradi', color: '#6366f1', icon: Clock },
  { value: 'resolved', label: 'Rešeno', color: '#10b981', icon: CheckCircle },
  { value: 'rejected', label: 'Odbijeno', color: '#ef4444', icon: XCircle },
];

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

function StatusBadge({ status }: { status: IssueStatus }): JSX.Element {
  const statusInfo = ISSUE_STATUSES.find(s => s.value === status) || ISSUE_STATUSES[0];
  const Icon = statusInfo.icon;
  return (
    <span 
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ 
        background: `${statusInfo.color}15`,
        color: statusInfo.color
      }}
    >
      <Icon size={12} />
      {statusInfo.label}
    </span>
  );
}

interface IssueDetailsModalProps {
  issue: Issue | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

function IssueDetailsModal({ issue, isOpen, onClose, onSave }: IssueDetailsModalProps): JSX.Element | null {
  const [status, setStatus] = useState<IssueStatus>(issue?.status || 'open');
  const [adminNote, setAdminNote] = useState<string>(issue?.adminNote || '');
  const [bikeAction, setBikeAction] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (issue) {
      setStatus(issue.status || 'open');
      setAdminNote(issue.adminNote || '');
      setBikeAction('');
    }
  }, [issue]);

  const handleSave = async (): Promise<void> => {
    if (!issue) return;
    setLoading(true);
    try {
      await issuesApi.update(issue.id, {
        status,
        adminNote: adminNote.trim(),
        bikeAction: bikeAction || undefined
      });
      showSuccess('Prijava je uspešno ažurirana');
      onSave();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Greška';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !issue) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="modal w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Detalji prijave problema</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Info */}
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="card bg-slate-800/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Informacije o prijavi</h3>
                <StatusBadge status={issue.status || 'open'} />
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">ID prijave</span>
                  <span className="text-white font-mono">{issue.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Datum prijave</span>
                  <span className="text-white">{formatDate(issue.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="card bg-slate-800/50">
              <div className="flex items-center gap-3 mb-4">
                <User size={18} className="text-indigo-400" />
                <h3 className="font-semibold text-white">Korisnik</h3>
              </div>
              {issue.user ? (
                <div className="space-y-2 text-sm">
                  <p className="text-white">
                    {issue.user.firstName} {issue.user.lastName}
                  </p>
                  <p className="text-slate-400">@{issue.user.username}</p>
                  {issue.user.email && (
                    <p className="text-slate-400">{issue.user.email}</p>
                  )}
                  {issue.user.phone && (
                    <p className="text-slate-400">{issue.user.phone}</p>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Podaci nisu dostupni</p>
              )}
            </div>

            {/* Bike Info */}
            {issue.bike && (
              <div className="card bg-slate-800/50">
                <div className="flex items-center gap-3 mb-4">
                  <Bike size={18} className="text-emerald-400" />
                  <h3 className="font-semibold text-white">Prijavljeni bicikl</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Oznaka</span>
                    <span className="text-white">{issue.bike.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tip</span>
                    <span className="text-white">{issue.bike.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Trenutni status</span>
                    <span className={`
                      ${issue.bike.status === 'available' ? 'text-emerald-400' : ''}
                      ${issue.bike.status === 'rented' ? 'text-indigo-400' : ''}
                      ${issue.bike.status === 'maintenance' ? 'text-amber-400' : ''}
                      ${issue.bike.status === 'disabled' ? 'text-red-400' : ''}
                    `}>
                      {issue.bike.status === 'available' && 'Dostupan'}
                      {issue.bike.status === 'rented' && 'Iznajmljen'}
                      {issue.bike.status === 'maintenance' && 'Održavanje'}
                      {issue.bike.status === 'disabled' && 'Isključen'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="card bg-slate-800/50">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare size={18} className="text-amber-400" />
                <h3 className="font-semibold text-white">Opis problema</h3>
              </div>
              <p className="text-slate-300 text-sm whitespace-pre-wrap">
                {issue.description || 'Nema opisa'}
              </p>
            </div>
          </div>

          {/* Right Column - Photo & Actions */}
          <div className="space-y-4">
            {/* Photo */}
            <div className="card bg-slate-800/50">
              <div className="flex items-center gap-3 mb-4">
                <Image size={18} className="text-cyan-400" />
                <h3 className="font-semibold text-white">Fotografija</h3>
              </div>
              {issue.photoUri ? (
                <div className="rounded-lg overflow-hidden bg-slate-900">
                  <img
                    src={issue.photoUri}
                    alt="Fotografija problema"
                    className="w-full max-h-64 object-contain"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      if (target.nextSibling && target.nextSibling instanceof HTMLElement) {
                        target.nextSibling.style.display = 'block';
                      }
                    }}
                  />
                  <p className="text-slate-400 text-center py-8 hidden">
                    Fotografija nije dostupna
                  </p>
                </div>
              ) : (
                <div className="rounded-lg bg-slate-900 py-8 text-center">
                  <Image size={32} className="mx-auto text-slate-600 mb-2" />
                  <p className="text-slate-400 text-sm">Bez fotografije</p>
                </div>
              )}
            </div>

            {/* Admin Actions */}
            <div className="card bg-slate-800/50">
              <h3 className="font-semibold text-white mb-4">Obrada prijave</h3>
              
              {/* Status Selection */}
              <div className="mb-4">
                <label className="label">Status prijave</label>
                <div className="grid grid-cols-2 gap-2">
                  {ISSUE_STATUSES.map(s => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.value}
                        onClick={() => setStatus(s.value)}
                        className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                          status === s.value 
                            ? 'border-indigo-500 bg-indigo-500/10' 
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <Icon size={16} style={{ color: s.color }} />
                        <span className={`text-sm ${status === s.value ? 'text-white' : 'text-slate-400'}`}>
                          {s.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bike Action */}
              {issue.bike && (
                <div className="mb-4">
                  <label className="label">Akcija nad biciklom (opciono)</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setBikeAction(bikeAction === 'maintenance' ? '' : 'maintenance')}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        bikeAction === 'maintenance' 
                          ? 'border-amber-500 bg-amber-500/10' 
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <Wrench size={18} className="text-amber-400" />
                      <span className={bikeAction === 'maintenance' ? 'text-white' : 'text-slate-400'}>
                        Pošalji na održavanje
                      </span>
                      {bikeAction === 'maintenance' && <Check size={16} className="ml-auto text-amber-400" />}
                    </button>
                    <button
                      onClick={() => setBikeAction(bikeAction === 'disable' ? '' : 'disable')}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        bikeAction === 'disable' 
                          ? 'border-red-500 bg-red-500/10' 
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <Ban size={18} className="text-red-400" />
                      <span className={bikeAction === 'disable' ? 'text-white' : 'text-slate-400'}>
                        Privremeno isključi
                      </span>
                      {bikeAction === 'disable' && <Check size={16} className="ml-auto text-red-400" />}
                    </button>
                    <button
                      onClick={() => setBikeAction(bikeAction === 'available' ? '' : 'available')}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        bikeAction === 'available' 
                          ? 'border-emerald-500 bg-emerald-500/10' 
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <CheckCircle size={18} className="text-emerald-400" />
                      <span className={bikeAction === 'available' ? 'text-white' : 'text-slate-400'}>
                        Označi kao dostupan
                      </span>
                      {bikeAction === 'available' && <Check size={16} className="ml-auto text-emerald-400" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Admin Note */}
              <div className="mb-4">
                <label className="label">Napomena administratora</label>
                <textarea
                  value={adminNote}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAdminNote(e.target.value)}
                  className="input min-h-[100px] resize-none"
                  placeholder="Unesite napomenu o obradi prijave..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-slate-700">
          <button onClick={onClose} className="btn btn-secondary flex-1">
            Otkaži
          </button>
          <button onClick={handleSave} disabled={loading} className="btn btn-primary flex-1">
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Čuvanje...
              </>
            ) : (
              <>
                <Check size={18} />
                Sačuvaj izmene
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Issues(): JSX.Element {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const { showError } = useToast();

  useEffect(() => {
    loadIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadIssues = async (): Promise<void> => {
    try {
      const data = await issuesApi.getAll();
      setIssues(data);
    } catch (error) {
      showError('Greška pri učitavanju prijava');
    } finally {
      setLoading(false);
    }
  };

  const filteredIssues = issues.filter(issue => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      issue.id.toLowerCase().includes(searchLower) ||
      issue.description?.toLowerCase().includes(searchLower) ||
      issue.user?.username?.toLowerCase().includes(searchLower) ||
      issue.bike?.label?.toLowerCase().includes(searchLower);
    const matchesStatus = !filterStatus || (issue.status || 'open') === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const openDetails = (issue: Issue): void => {
    setSelectedIssue(issue);
    setDetailsOpen(true);
  };

  const openCount = issues.filter(i => !i.status || i.status === 'open').length;
  const inProgressCount = issues.filter(i => i.status === 'in-progress').length;
  const resolvedCount = issues.filter(i => i.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Prijavljeni problemi</h1>
        <p className="text-slate-400 mt-1">Pregled i obrada prijava korisnika</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <AlertTriangle size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{openCount}</p>
              <p className="text-xs text-slate-400">Otvorene prijave</p>
            </div>
          </div>
        </div>
        <div className="card py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/15 flex items-center justify-center">
              <Clock size={20} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{inProgressCount}</p>
              <p className="text-xs text-slate-400">U obradi</p>
            </div>
          </div>
        </div>
        <div className="card py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{resolvedCount}</p>
              <p className="text-xs text-slate-400">Rešene prijave</p>
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
              placeholder="Pretraži po opisu, korisniku, biciklu..."
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
            className="select w-48"
          >
            <option value="">Svi statusi</option>
            {ISSUE_STATUSES.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
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
      ) : filteredIssues.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card text-center py-12"
        >
          <AlertTriangle size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {issues.length === 0 ? 'Nema prijavljenih problema' : 'Nema rezultata pretrage'}
          </h3>
          <p className="text-slate-400">
            {issues.length === 0 
              ? 'Trenutno nema prijava problema od korisnika'
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
                <th>Opis</th>
                <th>Datum</th>
                <th>Status</th>
                <th className="text-right">Akcije</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.map((issue, index) => (
                <motion.tr
                  key={issue.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`${(!issue.status || issue.status === 'open') ? 'border-l-2 border-l-amber-500' : ''}`}
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {issue.user?.firstName?.[0]}{issue.user?.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {issue.user ? `${issue.user.firstName} ${issue.user.lastName}` : 'Nepoznat'}
                        </p>
                        <p className="text-xs text-slate-500">
                          @{issue.user?.username || '-'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    {issue.bike ? (
                      <div className="flex items-center gap-2">
                        <Bike size={16} className="text-slate-400" />
                        <span className="text-white">{issue.bike.label}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td>
                    <p className="text-slate-300 text-sm truncate max-w-[200px]">
                      {issue.description || 'Bez opisa'}
                    </p>
                  </td>
                  <td className="text-slate-300 text-sm">
                    {formatDate(issue.createdAt)}
                  </td>
                  <td>
                    <StatusBadge status={issue.status || 'open'} />
                  </td>
                  <td>
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => openDetails(issue)}
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
          <IssueDetailsModal
            issue={selectedIssue}
            isOpen={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            onSave={loadIssues}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Issues;
