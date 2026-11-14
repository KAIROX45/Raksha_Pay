import React, { useState } from 'react';
import { User, Phone, Wallet, ShieldCheck, PlusCircle, LogOut, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import { PeachButton } from '../../components/common/PeachButton';
import api from '../../services/api';

export const ProfilePage: React.FC = () => {
  const { user, account, refreshAccount, logout } = useAuth();
  const [isTopupLoading, setIsTopupLoading] = useState(false);
  const [topupMessage, setTopupMessage] = useState<string | null>(null);

  const handleTopup = async () => {
    setIsTopupLoading(true);
    setTopupMessage(null);
    try {
      const res = await api.post('/accounts/topup-demo', { amount_rupees: 10000 });
      await refreshAccount();
      setTopupMessage(res.data.message);
      setTimeout(() => setTopupMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed topup:', err);
    } finally {
      setIsTopupLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <User className="w-5 h-5 text-[#D4AF37]" />
          <span className="text-xs font-bold uppercase tracking-widest text-[#F5D78E]">
            Executive Identity
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Wallet & Security Profile
        </h1>
        <p className="text-xs sm:text-sm text-[#A5AAA5]">
          Inspect your simulated account credentials, double-entry balance, and protection status.
        </p>
      </div>

      <GlassCard className="space-y-6 shadow-glow-gold">
        <div className="flex items-center gap-4 pb-4 border-b border-white/10">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#121414] via-[#1a1c1a] to-[#D4AF37]/30 flex items-center justify-center border-2 border-[#D4AF37]/50 text-[#F5D78E] font-black text-2xl shadow-glow-gold">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-black text-white">{user?.full_name}</h2>
            <span className="text-xs font-mono text-[#F5D78E] font-bold">{account?.upi_id}</span>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-black uppercase">
                {user?.status || 'ACTIVE'}
              </span>
              <span className="text-[10px] text-[#A5AAA5] font-semibold">
                Role: {user?.role.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Account Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#080909] border border-[#D4AF37]/25 space-y-1">
            <span className="text-[#A5AAA5] text-[10px] uppercase font-bold tracking-wider">
              Registered Mobile
            </span>
            <span className="font-mono text-white font-bold block">{user?.phone}</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#080909] border border-[#D4AF37]/25 space-y-1">
            <span className="text-[#A5AAA5] text-[10px] uppercase font-bold tracking-wider">
              Virtual Account Number
            </span>
            <span className="font-mono text-white font-bold block">{account?.account_number}</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#080909] border border-[#D4AF37]/25 space-y-1">
            <span className="text-[#A5AAA5] text-[10px] uppercase font-bold tracking-wider">
              Bank IFSC Code
            </span>
            <span className="font-mono text-white font-bold block">{account?.ifsc_code}</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#080909] border border-[#D4AF37]/25 space-y-1">
            <span className="text-[#A5AAA5] text-[10px] uppercase font-bold tracking-wider">
              Vault Balance
            </span>
            <span className="font-mono text-[#F5D78E] font-black text-base block">
              ₹{(account?.balance_rupees ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Top-up Demo Balance */}
        <div className="p-5 rounded-3xl bg-[#080909] border border-[#D4AF37]/35 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Wallet className="w-5 h-5 text-[#F5D78E]" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Simulated Liquidity Injection
              </span>
            </div>
            <button
              onClick={handleTopup}
              disabled={isTopupLoading}
              className="gold-button px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-glow-gold"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isTopupLoading ? 'Adding...' : 'Add ₹10,000 Demo'}</span>
            </button>
          </div>
          <p className="text-xs text-[#A5AAA5] leading-relaxed">
            Inject simulated demo funds to test high-velocity transactions, threshold limits, and zero-trust safeguards.
          </p>
          {topupMessage && (
            <div className="text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{topupMessage}</span>
            </div>
          )}
        </div>

        {/* Security Parameters */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <span className="text-xs font-bold text-white uppercase tracking-wider block">
            Security Engine Status
          </span>
          <div className="p-3.5 rounded-2xl bg-[#080909] border border-[#D4AF37]/25 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#F5D78E]" />
              <span className="text-white font-bold">Hybrid AI Fraud Detection & Double-Entry Ledger</span>
            </div>
            <span className="text-emerald-400 font-black text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              ACTIVE
            </span>
          </div>
        </div>

        {/* Sign Out */}
        <div className="pt-2">
          <button
            onClick={logout}
            className="w-full py-3 rounded-2xl border border-rose-500/40 text-rose-300 hover:bg-rose-500/15 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Wallet</span>
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
