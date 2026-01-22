import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Bike, 
  Clock, 
  AlertTriangle, 
  Users, 
  DollarSign,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Wrench,
  LucideIcon
} from 'lucide-react';
import { statsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { DashboardStats } from '../types';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: string;
  color: string;
  delay: number;
}

function StatCard({ icon: Icon, label, value, subValue, trend, color, delay }: StatCardProps): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="stat-card card"
    >
      <div className="flex items-start justify-between mb-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15` }}
        >
          <Icon size={24} style={{ color }} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-emerald-400 text-sm">
            <TrendingUp size={16} />
            {trend}
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-slate-400 text-sm">{label}</p>
      {subValue && (
        <p className="text-slate-500 text-xs mt-1">{subValue}</p>
      )}
    </motion.div>
  );
}

interface BikeStatusData {
  available: number;
  rented: number;
  maintenance: number;
  disabled: number;
}

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

function BikeStatusChart({ data }: { data: BikeStatusData }): JSX.Element {
  const chartData: ChartDataItem[] = [
    { name: 'Dostupni', value: data.available, color: '#10b981' },
    { name: 'Iznajmljeni', value: data.rented, color: '#6366f1' },
    { name: 'Održavanje', value: data.maintenance, color: '#f59e0b' },
    { name: 'Isključeni', value: data.disabled, color: '#ef4444' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="card"
    >
      <h3 className="text-lg font-semibold text-white mb-6">Status bicikala</h3>
      <div className="flex items-center">
        <div className="w-48 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-3 ml-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ background: item.color }}
              />
              <span className="text-slate-400 text-sm flex-1">{item.name}</span>
              <span className="text-white font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

interface QuickAction {
  label: string;
  icon: LucideIcon;
  path: string;
  color: string;
}

function QuickActions(): JSX.Element {
  const actions: QuickAction[] = [
    { label: 'Dodaj bicikl', icon: Bike, path: '/bikes', color: '#6366f1' },
    { label: 'Pregledaj iznajmljivanja', icon: Clock, path: '/rentals', color: '#10b981' },
    { label: 'Prijavljeni problemi', icon: AlertTriangle, path: '/issues', color: '#f59e0b' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="card"
    >
      <h3 className="text-lg font-semibold text-white mb-4">Brze akcije</h3>
      <div className="space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={index}
              to={action.path}
              className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-all group"
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: `${action.color}15` }}
              >
                <Icon size={20} style={{ color: action.color }} />
              </div>
              <span className="flex-1 text-slate-300 group-hover:text-white transition">
                {action.label}
              </span>
              <ArrowRight size={18} className="text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}

function Dashboard(): JSX.Element {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { showError } = useToast();

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStats = async (): Promise<void> => {
    try {
      const data = await statsApi.getDashboard();
      setStats(data);
    } catch (error) {
      showError('Greška pri učitavanju statistike');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton h-12 w-12 rounded-xl mb-4" />
              <div className="skeleton h-8 w-24 mb-2" />
              <div className="skeleton h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return <></>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Kontrolna tabla</h1>
          <p className="text-slate-400 mt-1">Pregled stanja sistema za iznajmljivanje bicikala</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          icon={Bike}
          label="Ukupno bicikala"
          value={stats.bikes.total}
          subValue={`${stats.bikes.available} dostupno`}
          color="#6366f1"
          delay={0}
        />
        <StatCard
          icon={Clock}
          label="Iznajmljivanja"
          value={stats.rentals.total}
          subValue={`${stats.rentals.active} aktivno`}
          color="#10b981"
          delay={0.1}
        />
        <StatCard
          icon={DollarSign}
          label="Ukupan prihod"
          value={`${stats.rentals.revenue.toLocaleString()} RSD`}
          color="#f59e0b"
          delay={0.2}
        />
        <StatCard
          icon={AlertTriangle}
          label="Otvoreni problemi"
          value={stats.issues.open}
          subValue={`od ${stats.issues.total} ukupno`}
          color="#ef4444"
          delay={0.3}
        />
      </div>

      {/* Charts and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BikeStatusChart data={stats.bikes} />
        <QuickActions />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="text-emerald-400" size={24} />
            <h3 className="font-semibold text-white">Dostupni bicikli</h3>
          </div>
          <p className="text-3xl font-bold text-emerald-400 mb-2">{stats.bikes.available}</p>
          <p className="text-slate-400 text-sm">Spremni za iznajmljivanje</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <Wrench className="text-amber-400" size={24} />
            <h3 className="font-semibold text-white">U održavanju</h3>
          </div>
          <p className="text-3xl font-bold text-amber-400 mb-2">{stats.bikes.maintenance}</p>
          <p className="text-slate-400 text-sm">Bicikli na servisu</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <Users className="text-indigo-400" size={24} />
            <h3 className="font-semibold text-white">Registrovani korisnici</h3>
          </div>
          <p className="text-3xl font-bold text-indigo-400 mb-2">{stats.users.total}</p>
          <p className="text-slate-400 text-sm">Aktivnih naloga</p>
        </motion.div>
      </div>
    </div>
  );
}

export default Dashboard;
