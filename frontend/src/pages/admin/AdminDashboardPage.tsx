import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Activity,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Shield,
  Lock,
} from 'lucide-react';
import { GlassCard } from '../../components/common/GlassCard';
import api from '../../services/api';

interface OverviewStats {
  total_users: number;
  total_transactions: number;
  approved_transactions: number;
  pending_transactions: number;
  blocked_transactions: number;
  failed_transactions: number;
  total_simulated_volume_rupees: number;
  total_fraud_alerts: number;
  unresolved_alerts: number;
  system_status: string;
}

interface FraudAlertItem {
  id: string;
  transaction_id?: string;
  user_name?: string;
  user_phone?: string;
  risk_score: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  signals: string[];
  explanation: string;
  status: string;
  created_at: string;
}

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [alerts, setAlerts] = useState<FraudAlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSOCData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, alertsRes] = await Promise.all([
        api.get<OverviewStats>('/admin/overview'),
        api.get<FraudAlertItem[]>('/admin/fraud-alerts?limit=5'),
      ]);
      setStats(statsRes.data);
      setAlerts(alertsRes.data);
    } catch (err) {
      console.error('Failed to load SOC overview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSOCData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#F5D78E] uppercase tracking-widest block">
            Security Operations Center (SOC)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Threat & Transaction Telemetry
          </h1>
          <p className="text-xs text-[#A5AAA5] mt-0.5">
            Real-time calculations computed strictly from PostgreSQL database ledger and fraud logs.
          </p>
        </div>

        <button
          onClick={fetchSOCData}
          className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-[#121414] border border-[#D4AF37]/35 text-xs text-white hover:text-[#F5D78E] hover:border-[#D4AF37] flex items-center gap-2 shadow-glow-gold transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <GlassCard className="p-5 space-y-2">
          <div className="flex items-center justify-between text-[#A5AAA5]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-[#F5D78E]" />
          </div>
          <span className="text-2xl sm:text-3xl font-mono font-black text-white block">
            {stats?.total_users ?? 0}
          </span>
          <span className="text-[10px] text-[#A5AAA5] block font-semibold">Registered Accounts</span>
        </GlassCard>

        <GlassCard className="p-5 space-y-2">
          <div className="flex items-center justify-between text-[#A5AAA5]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tx Attempts</span>
            <Receipt className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-mono font-black text-white block">
            {stats?.total_transactions ?? 0}
          </span>
          <span className="text-[10px] text-emerald-400 block font-semibold">
            {stats?.approved_transactions ?? 0} Approved Transfers
          </span>
        </GlassCard>

        <GlassCard className="p-5 space-y-2 bg-rose-500/5 border-rose-500/30">
          <div className="flex items-center justify-between text-rose-300">
            <span className="text-[11px] font-bold uppercase tracking-wider">Blocked Threats</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-mono font-black text-rose-400 block">
            {stats?.blocked_transactions ?? 0}
          </span>
          <span className="text-[10px] text-rose-300 block font-semibold">
            {stats?.pending_transactions ?? 0} Pending Verification
          </span>
        </GlassCard>

        <GlassCard className="p-5 space-y-2">
          <div className="flex items-center justify-between text-[#A5AAA5]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Simulated Volume</span>
            <TrendingUp className="w-4 h-4 text-[#F5D78E]" />
          </div>
          <span className="text-2xl sm:text-3xl font-mono font-black text-[#F5D78E] block">
            ₹{(stats?.total_simulated_volume_rupees ?? 0).toLocaleString('en-IN', {
              maximumFractionDigits: 0,
            })}
          </span>
          <span className="text-[10px] text-[#A5AAA5] block font-semibold">ACID Settled Total</span>
        </GlassCard>
      </div>

      {/* Active Fraud Alerts Section */}
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-400 animate-pulse" />
            <h2 className="text-base font-bold text-white">Active Fraud Incidents</h2>
          </div>
          <Link
            to="/admin/fraud"
            className="text-xs font-bold text-[#F5D78E] hover:underline flex items-center gap-1"
          >
            <span>Investigation Room</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#A5AAA5]">
            No unresolved fraud alerts currently recorded in database.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-white/5 px-3 rounded-2xl transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : alert.severity === 'HIGH'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {alert.severity} • RISK {alert.risk_score}/100
                    </span>
                    <span className="text-xs text-[#A5AAA5] font-mono">{alert.status}</span>
                  </div>
                  <span className="text-xs font-bold text-white block">
                    {alert.explanation}
                  </span>
                  <span className="text-[11px] text-[#A5AAA5] block">
                    Target: {alert.user_name || 'Customer'} ({alert.user_phone || 'Simulated User'})
                  </span>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <Link
                    to="/admin/fraud"
                    className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-200 text-xs font-bold transition-all"
                  >
                    Investigate
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};
