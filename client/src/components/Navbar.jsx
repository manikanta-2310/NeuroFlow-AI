import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { api } from '../api';
import {
  Sparkles,
  LayoutDashboard,
  FolderKanban,
  LogOut,
  User,
  Database,
  Sun,
  Moon,
} from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.health
      .check()
      .then(setHealth)
      .catch(() => {});
    const interval = setInterval(() => {
      api.health
        .check()
        .then(setHealth)
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#121829]/95 backdrop-blur-xl shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 py-2.5">
          {/* Brand Logo & Section Navigation */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-600 dark:text-indigo-300 group-hover:border-indigo-500 transition-colors shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                  NeuroFlow
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                  AI
                </span>
              </div>
            </Link>

            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>

            {/* Navigation Links */}
            <div className="flex items-center gap-1.5">
              <Link
                to="/"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive('/')
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-500/30 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                Dashboard
              </Link>
              <Link
                to="/workspaces"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive('/workspaces')
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-500/30 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                Workspaces
              </Link>
            </div>
          </div>

          {/* Right Header: System Status, Theme Toggle & User Actions */}
          <div className="flex items-center gap-3">
            {/* System Status Indicators */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#182137] border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 font-mono">
              <div className="flex items-center gap-1.5" title={`Database: ${health?.storage?.mode || 'loading'}`}>
                <Database className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span className="uppercase text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                  {health?.storage?.mode || 'syncing'}
                </span>
              </div>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <div className="flex items-center gap-1.5" title={health?.ai?.ollamaConnected ? 'Ollama Online' : 'Fallback Engine Active'}>
                <span
                  className={`w-2 h-2 rounded-full ${
                    health?.ai?.ollamaConnected
                      ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                      : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
                  }`}
                />
                <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                  {health?.ai?.ollamaConnected ? 'Ollama' : 'Fallback'}
                </span>
              </div>
            </div>

            {/* Light / Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all shadow-xs"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 animate-fade-in" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 animate-fade-in" />
              )}
            </button>

            {/* User Profile / Logout */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-600/30 border border-indigo-300 dark:border-indigo-500/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden md:inline">
                  {user?.name || 'User'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
