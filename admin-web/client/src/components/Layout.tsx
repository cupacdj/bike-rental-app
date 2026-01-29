import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Bike, 
  Clock, 
  AlertTriangle, 
  LogOut, 
  Menu, 
  ChevronRight,
  LucideIcon,
  ParkingSquare,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { LayoutProps, SidebarProps } from '../types';

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: LayoutDashboard, label: 'Kontrolna tabla' },
  { path: '/bikes', icon: Bike, label: 'Bicikli' },
  { path: '/parking-zones', icon: ParkingSquare, label: 'Parking zone' },
  { path: '/rentals', icon: Clock, label: 'Iznajmljivanja' },
  { path: '/issues', icon: AlertTriangle, label: 'Prijavljeni problemi' },
  { path: '/settings', icon: Settings, label: 'Podešavanja' },
];

function Sidebar({ isOpen, onClose }: SidebarProps): JSX.Element {
  const location = useLocation();
  const { admin, logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-72 bg-slate-900 border-r border-slate-700
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Bike size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white">Bike Rental</h1>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-all duration-200
                      ${isActive 
                        ? 'bg-indigo-500/10 text-indigo-400' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <ChevronRight size={16} className="ml-auto" />
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {admin?.firstName?.[0]}{admin?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">
                {admin?.firstName} {admin?.lastName}
              </p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
              bg-slate-800 text-slate-300 hover:bg-red-500/10 hover:text-red-400
              transition-all duration-200"
          >
            <LogOut size={18} />
            <span className="font-medium">Odjavi se</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function Layout({ children }: LayoutProps): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-dark)' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content wrapper - add left margin on large screens to account for fixed sidebar */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-72">
        {/* Mobile header - visible only on small screens */}
        <header className="lg:hidden sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-700 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-800 transition"
            >
              <Menu size={24} className="text-slate-300" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Bike size={18} className="text-white" />
              </div>
              <span className="font-semibold text-white">Bike Rental Admin</span>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
