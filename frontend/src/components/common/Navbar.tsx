import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Wallet,
  LogOut,
  User,
  Sparkles,
  Shield,
  ArrowUpRight,
  Send,
  History,
  CheckCircle2,
  Bot,
  QrCode,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const { user, account, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080909]/90 backdrop-blur-xl border-b border-[#D4AF37]/20 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo with Luxury Gold Accent */}
        <Link
          to={isAuthenticated ? '/app/dashboard' : '/'}
          className="flex items-center gap-3 group"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#121414] via-[#1a1c1a] to-[#D4AF37]/30 flex items-center justify-center border border-[#D4AF37]/40 shadow-glow-gold group-hover:scale-105 transition-all">
            <ShieldCheck className="w-6 h-6 text-[#F5D78E] drop-shadow-[0_0_8px_rgba(212,175,55,0.7)]" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-[#F5D78E] transition-colors">
              Raksha<span className="text-gold-gradient font-black">Pay</span>
            </span>
            <span className="text-[10px] text-[#A5AAA5] uppercase tracking-wider font-semibold -mt-1 hidden sm:block">
              3D AI Payment Security
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        {isAuthenticated ? (
          <nav className="hidden lg:flex items-center gap-1 bg-[#121414]/90 px-3 py-2 rounded-2xl border border-[#D4AF37]/25 shadow-lg">
            <Link
              to="/app/dashboard"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive('/app/dashboard')
                  ? 'gold-button shadow-glow-gold'
                  : 'text-[#A5AAA5] hover:text-white hover:bg-white/5'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/app/send-money"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isActive('/app/send-money')
                  ? 'gold-button shadow-glow-gold'
                  : 'text-[#A5AAA5] hover:text-white hover:bg-white/5'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              Send Money
            </Link>
            <Link
              to="/app/recipient-check"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isActive('/app/recipient-check')
                  ? 'gold-button shadow-glow-gold'
                  : 'text-[#A5AAA5] hover:text-white hover:bg-white/5'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verify Recipient
            </Link>
            <Link
              to="/app/qr-scanner"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isActive('/app/qr-scanner')
                  ? 'gold-button shadow-glow-gold'
                  : 'text-[#A5AAA5] hover:text-[#F5D78E] hover:bg-white/5'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-[#F5D78E]" />
              QR Scanner
            </Link>
            <Link
              to="/app/assistant"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isActive('/app/assistant')
                  ? 'gold-button shadow-glow-gold'
                  : 'text-[#A5AAA5] hover:text-white hover:bg-white/5'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-[#F5D78E]" />
              AI Assistant
            </Link>
            <Link
              to="/app/transactions"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isActive('/app/transactions')
                  ? 'gold-button shadow-glow-gold'
                  : 'text-[#A5AAA5] hover:text-white hover:bg-white/5'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              History
            </Link>
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-8 text-sm text-[#A5AAA5] font-medium">
            <a href="#how-it-works" className="hover:text-[#F5D78E] transition-colors">
              How It Works
            </a>
            <a href="#fraud-ai" className="hover:text-[#F5D78E] transition-colors">
              AI Security Sphere
            </a>
            <a href="#features" className="hover:text-[#F5D78E] transition-colors">
              Features
            </a>
            <Link
              to="/admin/login"
              className="text-[#D4AF37] hover:text-[#F5D78E] transition-colors flex items-center gap-1.5 font-semibold"
            >
              <Shield className="w-4 h-4 text-[#D4AF37]" />
              SOC Admin
            </Link>
          </nav>
        )}

        {/* Right Section: Balance & Auth Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Luxury Gold Wallet Pill */}
              <div className="hidden sm:flex items-center gap-2.5 bg-[#121414] border border-[#D4AF37]/35 px-4 py-2 rounded-2xl shadow-glow-gold">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#D4AF37]/20 to-[#F5D78E]/30 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-[#F5D78E]" />
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-[#A5AAA5] uppercase font-bold tracking-wider leading-none">
                    Wallet Balance
                  </span>
                  <span className="font-mono text-sm font-extrabold text-[#F5D78E]">
                    ₹{(account?.balance_rupees ?? 0).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* SOC Admin Link (if admin) */}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="px-3 py-2 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#F5D78E] text-xs font-bold flex items-center gap-1.5 hover:bg-[#D4AF37]/25 transition-all shadow-glow-gold"
                >
                  <Shield className="w-3.5 h-3.5" />
                  SOC Portal
                </Link>
              )}

              {/* User Profile */}
              <Link
                to="/app/profile"
                className="w-10 h-10 rounded-xl bg-[#121414] border border-[#D4AF37]/30 flex items-center justify-center text-white hover:border-[#D4AF37] hover:shadow-glow-gold transition-all"
                title="User Profile"
              >
                <User className="w-4 h-4 text-[#F5D78E]" />
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-10 h-10 rounded-xl bg-[#121414] border border-white/10 flex items-center justify-center text-[#A5AAA5] hover:text-rose-400 hover:border-rose-400/40 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:text-[#F5D78E] transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className="gold-button px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-glow-gold"
              >
                Launch Platform
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
