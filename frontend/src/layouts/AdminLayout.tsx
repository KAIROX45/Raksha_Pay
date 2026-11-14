import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  Receipt,
  Users,
  ScrollText,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Lock,
  Activity,
  Flame,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SimulationBanner } from '../components/common/SimulationBanner';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080909] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin/dashboard', label: 'SOC Overview', icon: LayoutDashboard },
    { to: '/admin/transactions', label: 'Transaction Monitor', icon: Receipt },
    { to: '/admin/fraud', label: 'Fraud Investigations', icon: Flame },
    { to: '/admin/users', label: 'User Directory', icon: Users },
    { to: '/admin/audit-logs', label: 'Immutable Audit Trail', icon: ScrollText },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-[#080909] text-white">
      <SimulationBanner />

      <div className="flex-1 flex">
        {/* Persistent Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-[#121414] border-r border-[#D4AF37]/25 p-5 shadow-2xl">
          {/* SOC Header */}
          <div className="flex items-center gap-3 mb-8 pb-5 border-b border-white/10">
            <div className="w-10 h-10 rounded-2xl bg-[#080909] flex items-center justify-center border border-[#D4AF37]/50 shadow-glow-gold">
              <ShieldAlert className="w-5 h-5 text-[#F5D78E]" />
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-white block">
                RakshaPay <span className="text-[#F5D78E]">SOC</span>
              </span>
              <span className="text-[10px] text-[#A5AAA5] uppercase tracking-wider block font-bold">
                Security Ops Center
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    active
                      ? 'gold-button shadow-glow-gold'
                      : 'text-[#A5AAA5] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-[#080909]' : 'text-[#D4AF37]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Admin User Info & Signout */}
          <div className="pt-5 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white truncate max-w-[130px]">
                  {user.full_name}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  SOC Analyst Level 3
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-[#A5AAA5] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Logout from SOC"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
            <Link
              to="/app/dashboard"
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#080909] text-[#A5AAA5] hover:text-[#F5D78E] text-[11px] font-bold border border-[#D4AF37]/30 transition-all"
            >
              <span>Switch to User Portal</span>
              <ExternalLink className="w-3 h-3 text-[#D4AF37]" />
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile SOC Topbar */}
          <div className="lg:hidden h-14 bg-[#121414] border-b border-[#D4AF37]/25 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#F5D78E]" />
              <span className="font-bold text-sm text-white">
                RakshaPay <span className="text-[#F5D78E]">SOC</span>
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#A5AAA5] hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-[#121414] border-b border-[#D4AF37]/30 p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                      isActive(item.to) ? 'gold-button shadow-glow-gold' : 'text-[#A5AAA5]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <div className="pt-2 border-t border-white/10 flex justify-between">
                <Link
                  to="/app/dashboard"
                  className="text-xs text-[#F5D78E] font-bold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  User Portal
                </Link>
                <button onClick={handleLogout} className="text-xs text-rose-400 font-bold">
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* Body */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
