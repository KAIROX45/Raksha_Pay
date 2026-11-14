import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Send,
  QrCode,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  History,
  TrendingUp,
  PlusCircle,
  Sparkles,
  ChevronRight,
  RefreshCw,
  CreditCard,
  Lock,
  FileCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import api from '../../services/api';

interface RecentTransaction {
  id: string;
  transaction_ref: string;
  recipient_upi_id: string;
  recipient_name: string;
  amount_rupees: number;
  status: 'APPROVED' | 'PENDING' | 'BLOCKED' | 'FAILED';
  risk_score: number;
  created_at: string;
  note?: string;
}

interface WalletSummary {
  available_balance_paise: number;
  available_balance_rupees: number;
  total_transactions: number;
  approved_transfers: number;
  blocked_transfers: number;
  pending_transfers: number;
  threats_intercepted: number;
  weekly_analytics: Array<{ day: string; date: string; income: number; expense: number }>;
  weekly_anomaly_index: {
    status: string;
    std_dev_rupees: number;
    mean_expense_rupees: number;
    z_score: number;
    message: string;
  };
}

export const DashboardPage: React.FC = () => {
  const { user, account, refreshAccount, threatsInterceptedCount } = useAuth();
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupSuccessMessage, setTopupSuccessMessage] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      await refreshAccount();
      const [txRes, summaryRes] = await Promise.all([
        api.get<RecentTransaction[]>('/transactions?limit=6'),
        api.get<WalletSummary>('/wallet/summary').catch(() => null),
      ]);
      setTransactions(txRes.data);
      if (summaryRes && summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleTopup = async () => {
    setTopupLoading(true);
    setTopupSuccessMessage(null);
    try {
      // Hits double-entry minting endpoint /wallet/topup
      const res = await api.post('/wallet/topup', { amount_rupees: 10000 });
      setTopupSuccessMessage(res.data.message || '+ ₹10,000 Minted Successfully');
      await fetchDashboardData();
      setTimeout(() => setTopupSuccessMessage(null), 3500);
    } catch (err: any) {
      console.error('Topup failed:', err);
    } finally {
      setTopupLoading(false);
    }
  };

  // 7-Day Income and Expense Analytics Chart Data (Dynamic Double-Entry Aggregation)
  const defaultAnalyticsData = [
    { day: 'Mon', expense: 1200, income: 5000 },
    { day: 'Tue', expense: 2800, income: 1500 },
    { day: 'Wed', expense: 950, income: 8000 },
    { day: 'Thu', expense: 4200, income: 2000 },
    { day: 'Fri', expense: 1900, income: 12000 },
    { day: 'Sat', expense: 5800, income: 3000 },
    { day: 'Sun', expense: 1500, income: 4500 },
  ];

  const financialAnalyticsData =
    summary?.weekly_analytics && summary.weekly_analytics.some((d) => d.income > 0 || d.expense > 0)
      ? summary.weekly_analytics
      : defaultAnalyticsData;

  const totalTransactionsCount = summary?.total_transactions ?? transactions.length;
  const approvedCount = summary?.approved_transfers ?? transactions.filter((t) => t.status === 'APPROVED').length;
  const blockedCount =
    (summary?.threats_intercepted ?? transactions.filter((t) => t.status === 'BLOCKED').length) +
    threatsInterceptedCount;

  const displayBalanceRupees = summary?.available_balance_rupees ?? (account?.balance_rupees ?? 0);
  const displayBalancePaise = summary?.available_balance_paise ?? (account?.balance_paise ?? 0);

  return (
    <div className="space-y-8">
      {/* 1. Header Greeting & Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#A5AAA5] uppercase tracking-widest block">
            Executive Security Portfolio
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {user?.full_name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-[#F5D78E] font-mono font-bold">{account?.upi_id}</span>
            <span className="text-[#A5AAA5]">•</span>
            <span className="text-[11px] text-[#A5AAA5]">Simulated Bank IFSC: {account?.ifsc_code}</span>
          </div>
        </div>

        {/* AI Defense Status Pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className="p-3 rounded-2xl bg-[#121414] border border-[#D4AF37]/30 text-[#A5AAA5] hover:text-[#F5D78E] hover:border-[#D4AF37] transition-all shadow-glow-gold"
            title="Refresh Portfolio & Balances"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#121414] border border-[#D4AF37]/40 shadow-glow-gold">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#D4AF37]/20 to-[#F5D78E]/30 flex items-center justify-center border border-[#D4AF37]/50">
              <ShieldCheck className="w-5 h-5 text-[#F5D78E]" />
            </div>
            <div>
              <span className="text-xs font-black text-white block leading-none">
                AI Defense Online
              </span>
              <span className="text-[10px] text-[#F5D78E] font-semibold">
                Random Forest & Gemini Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Telemetry & Statistics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#121414] rounded-2xl p-4 border border-[#D4AF37]/20 shadow-md">
          <span className="text-[11px] font-bold text-[#A5AAA5] uppercase tracking-wider block">
            Available Balance
          </span>
          <span className="text-lg sm:text-xl font-mono font-black text-[#F5D78E] mt-1 block">
            ₹{displayBalanceRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">
            ● 100% Unencumbered
          </span>
        </div>

        <div className="bg-[#121414] rounded-2xl p-4 border border-[#D4AF37]/20 shadow-md">
          <span className="text-[11px] font-bold text-[#A5AAA5] uppercase tracking-wider block">
            Total Transactions
          </span>
          <span className="text-lg sm:text-xl font-mono font-black text-white mt-1 block">
            {totalTransactionsCount} Records
          </span>
          <span className="text-[10px] text-[#A5AAA5] font-semibold mt-1 block">
            Double-Entry Verified
          </span>
        </div>

        <div className="bg-[#121414] rounded-2xl p-4 border border-[#D4AF37]/20 shadow-md">
          <span className="text-[11px] font-bold text-[#A5AAA5] uppercase tracking-wider block">
            Approved Transfers
          </span>
          <span className="text-lg sm:text-xl font-mono font-black text-emerald-400 mt-1 block">
            {approvedCount} Completed
          </span>
          <span className="text-[10px] text-emerald-400/80 font-semibold mt-1 block">
            Zero Chargebacks
          </span>
        </div>

        <div className="bg-[#121414] rounded-2xl p-4 border border-[#D4AF37]/20 shadow-md">
          <span className="text-[11px] font-bold text-[#A5AAA5] uppercase tracking-wider block">
            Threats Intercepted
          </span>
          <span className="text-lg sm:text-xl font-mono font-black text-rose-400 mt-1 block">
            {blockedCount} Scams Blocked
          </span>
          <span className="text-[10px] text-rose-400/80 font-semibold mt-1 block">
            Simulated Funds Saved
          </span>
        </div>
      </div>

      {topupSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-glow-gold animate-fade-in">
          <span>{topupSuccessMessage}</span>
          <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest">
            ACID Double-Entry Settled
          </span>
        </div>
      )}

      {/* 3. Main Wallet Hero Card & Financial Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Wallet Balance Luxury Card */}
        <div className="lg:col-span-7 bg-gradient-to-br from-[#121414] via-[#1a1c1a] to-[#080909] rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/45 relative overflow-hidden shadow-glow-gold flex flex-col justify-between min-h-[250px]">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-56 h-56 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-[#F5D78E]" />
              </div>
              <span className="text-xs font-bold text-[#A5AAA5] uppercase tracking-wider">
                Simulated Reserve Vault
              </span>
            </div>
            <button
              onClick={handleTopup}
              disabled={topupLoading}
              className="text-xs font-bold text-[#080909] bg-gradient-to-r from-[#F5D78E] to-[#D4AF37] px-3.5 py-1.5 rounded-xl hover:shadow-glow-gold transition-all"
            >
              {topupLoading ? 'Processing...' : '+ ₹10,000 Demo'}
            </button>
          </div>

          <div className="my-6 z-10">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-[#D4AF37]">INR</span>
              <span className="text-4xl sm:text-5xl font-mono font-black text-white tracking-tight">
                ₹{displayBalanceRupees.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <span className="text-xs text-[#A5AAA5] mt-1.5 block">
              Double-Entry Ledger Integrity: {displayBalancePaise.toLocaleString()} Paise
            </span>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#D4AF37]/20 z-10">
            <Link
              to="/app/send-money"
              className="gold-button py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-glow-gold"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Money</span>
            </Link>
            <Link
              to="/app/receive-money"
              className="bg-[#121414] hover:bg-[#1f2222] border border-[#D4AF37]/30 text-[#F5D78E] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Receive / QR</span>
            </Link>
            <Link
              to="/app/recipient-check"
              className="bg-[#121414] hover:bg-[#1f2222] border border-[#D4AF37]/30 text-[#A5AAA5] hover:text-white py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Verify UPI</span>
            </Link>
          </div>
        </div>

        {/* Income & Expense Financial Analytics Card */}
        <div className="lg:col-span-5 bg-[#121414] rounded-3xl p-6 sm:p-7 border border-[#D4AF37]/30 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#F5D78E]" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Financial Analytics
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-[#F5D78E]">
                <span className="w-2 h-2 rounded-full bg-[#F5D78E]" />
                Income
              </span>
              <span className="flex items-center gap-1 text-[#A5AAA5]">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                Expense
              </span>
            </div>
          </div>

          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialAnalyticsData}>
                <defs>
                  <linearGradient id="goldGradientIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F5D78E" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#F5D78E" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="goldGradientExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#A5AAA5" fontSize={10} tickLine={false} />
                <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#080909',
                    borderColor: 'rgba(212, 175, 55, 0.4)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#FFFFFF',
                  }}
                  formatter={(val: any, name: any) => [`₹${val}`, name === 'income' ? 'Simulated Income' : 'Expense']}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#F5D78E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#goldGradientIncome)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#D4AF37"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#goldGradientExpense)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#A5AAA5]">
            <div className="flex items-center gap-1.5">
              <span>Weekly Anomaly Index:</span>
              <span
                className={`font-black text-xs px-2 py-0.5 rounded-lg border ${
                  summary?.weekly_anomaly_index?.status === 'Optimal'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                    : summary?.weekly_anomaly_index?.status === 'Moderate Variance'
                    ? 'text-[#F5D78E] bg-[#D4AF37]/10 border-[#D4AF37]/30'
                    : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                }`}
                title={summary?.weekly_anomaly_index?.message || 'Spending within normal variance'}
              >
                {summary?.weekly_anomaly_index?.status || 'Optimal'}
              </span>
            </div>
            <Link to="/app/transactions" className="text-[#D4AF37] hover:text-[#F5D78E] font-bold flex items-center gap-1">
              <span>View Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. AI Security Tools Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#080909] border border-[#D4AF37]/40 flex items-center justify-center shadow-glow-gold">
                <Sparkles className="w-5 h-5 text-[#F5D78E]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Scam Message & Link Analyzer</h3>
                <span className="text-[10px] text-[#D4AF37] font-semibold">Gemini Multi-Modal Engine</span>
              </div>
            </div>
            <Link
              to="/app/scam-analyzer"
              className="text-xs font-bold text-[#F5D78E] hover:underline flex items-center gap-1"
            >
              <span>Scan Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="text-xs text-[#A5AAA5] leading-relaxed">
            Received a suspicious SMS, APK download link, or refund collect request?
            Our Gemini AI scans for social engineering cues and dangerous URLs immediately.
          </p>
        </GlassCard>

        <GlassCard className="space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#080909] border border-[#D4AF37]/40 flex items-center justify-center shadow-glow-gold">
                <ShieldCheck className="w-5 h-5 text-[#F5D78E]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">AI Financial Assistant</h3>
                <span className="text-[10px] text-[#D4AF37] font-semibold">24/7 Security Advisory</span>
              </div>
            </div>
            <Link
              to="/app/assistant"
              className="text-xs font-bold text-[#F5D78E] hover:underline flex items-center gap-1"
            >
              <span>Chat Advisor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="text-xs text-[#A5AAA5] leading-relaxed">
            Have questions about UPI QR codes, suspicious collect notifications, or fraud prevention best practices?
            Ask our intelligent assistant anytime.
          </p>
        </GlassCard>
      </div>

      {/* 5. Recent Transactions Activity List */}
      <div className="bg-[#121414] rounded-3xl p-6 sm:p-7 border border-[#D4AF37]/30 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-base font-black text-white">Recent Ledger Transactions</h3>
            <span className="text-xs text-[#A5AAA5]">Live ACID records, recipient risk scores & settlement status</span>
          </div>
          <Link
            to="/app/transactions"
            className="text-xs font-bold text-[#F5D78E] hover:underline flex items-center gap-1"
          >
            <span>Full History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#080909] border border-[#D4AF37]/30 flex items-center justify-center mx-auto text-[#A5AAA5]">
              <History className="w-6 h-6" />
            </div>
            <p className="text-xs text-[#A5AAA5]">No simulated transactions recorded in this session.</p>
            <Link to="/app/send-money">
              <button className="gold-button px-5 py-2.5 rounded-xl text-xs font-bold shadow-glow-gold">
                Send First Payment
              </button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {transactions.map((tx) => {
              const isApproved = tx.status === 'APPROVED';
              const isBlocked = tx.status === 'BLOCKED';
              const isPending = tx.status === 'PENDING';

              return (
                <div
                  key={tx.id}
                  className="py-3.5 flex items-center justify-between hover:bg-white/5 px-3 rounded-2xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                        isApproved
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : isBlocked
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {isApproved ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : isBlocked ? (
                        <ShieldAlert className="w-5 h-5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <span className="text-sm font-bold text-white block">
                        {tx.recipient_name}
                      </span>
                      <span className="text-[11px] text-[#A5AAA5] font-mono block">
                        {tx.recipient_upi_id}
                      </span>
                      {tx.note && (
                        <span className="text-[10px] text-[#A5AAA5]/80 block truncate max-w-[200px]">
                          "{tx.note}"
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-mono text-sm font-black block ${
                        isBlocked ? 'line-through text-[#A5AAA5]' : 'text-white'
                      }`}
                    >
                      ₹{tx.amount_rupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block mt-0.5 border ${
                        isApproved
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : isBlocked
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {tx.status} • Risk: {tx.risk_score}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
