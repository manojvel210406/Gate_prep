import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, BookOpen, BarChart3, ClipboardCheck,
  Bot, Layers, AlertCircle, RefreshCw, User,
  LogOut, Menu, X, Zap, Flame, Star,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/study', icon: BookOpen, label: 'Study Tracker' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/test', icon: ClipboardCheck, label: 'Mock Test' },
  { to: '/mentor', icon: Bot, label: 'AI Mentor' },
  { to: '/subjects', icon: Layers, label: 'Subjects' },
  { to: '/errors', icon: AlertCircle, label: 'Error Log' },
  { to: '/revision', icon: RefreshCw, label: 'Revision' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const rankColors = {
    'Apprentice': 'text-gray-500',
    'Scholar': 'text-blue-600',
    'Engineer': 'text-emerald-600',
    'Expert': 'text-violet-600',
    'Master': 'text-gold-500',
    'GATE Champion': 'text-gold-400',
  };

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-white border-r border-gray-100 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-800 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <div className="font-display font-bold text-primary-800 text-sm leading-tight">GATE EEE</div>
              <div className="text-xs text-gray-400 font-body">Intelligent Prep</div>
            </div>
          </div>
        </div>

        {/* User card */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-800 to-primary-500 rounded-xl flex items-center justify-center text-white font-bold text-sm font-display">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-800 truncate font-display">{user?.name}</div>
              <div className={`text-xs font-medium flex items-center gap-1 ${rankColors[user?.rank] || 'text-gray-500'}`}>
                <Star className="w-3 h-3" /> {user?.rank}
              </div>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400 font-body">XP</span>
              <span className="text-xs font-mono text-primary-800 font-medium">{user?.xp?.toLocaleString()}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-800 to-gold-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (user?.xp % 1000) / 10)}%` }}
              />
            </div>
          </div>

          {/* Streak */}
          {user?.currentStreak > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-orange-500 font-medium">
              <Flame className="w-3.5 h-3.5 fire-icon" />
              <span>{user.currentStreak}-day streak</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom: Health Score + Logout */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-body">Health Score</span>
            <span className={`text-sm font-bold font-display ${user?.healthScore >= 70 ? 'text-emerald-600' : user?.healthScore >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
              {user?.healthScore ?? '—'}/100
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                user?.healthScore >= 70 ? 'bg-emerald-500' :
                user?.healthScore >= 40 ? 'bg-amber-500' : 'bg-red-400'
              }`}
              style={{ width: `${user?.healthScore ?? 0}%` }}
            />
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-primary-800" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-800 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-gold-400" />
            </div>
            <span className="font-display font-bold text-primary-800 text-sm">GATE EEE</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
