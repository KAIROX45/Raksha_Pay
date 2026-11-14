import React, { useState, useEffect } from 'react';
import {
  Search,
  Receipt,
  ArrowUpRight,
  ShieldAlert,
  AlertTriangle,
  X,
  Filter,
  Eye,
} from 'lucide-react';
import { GlassCard } from '../../components/common/GlassCard';
import { PeachButton } from '../../components/common/PeachButton';
import api from '../../services/api';

interface AdminTx {
  id: string;
  transaction_ref: string;
  sender_account_id: string;
  recipient_upi_id: string;
  recipient_name: string;
  amount_rupees: number;
  status: 'APPROVED' | 'PENDING' | 'BLOCKED' | 'FAILED';
  risk_score: number;
  risk_category: string;
  decision_reason?: string;
  risk_signals?: string[];
  note?: string;
  idempotency_key: string;
  created_at: string;
}

export const AdminTransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<AdminTx[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTx, setSelectedTx] = useState<AdminTx | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (filter !== 'ALL') params.status = filter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.get<AdminTx[]>('/admin/transactions', { params });
      setTransactions(res.data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#D1E8E2] tracking-tight">
          Transaction Monitoring
        </h1>
        <p className="text-xs sm:text-sm text-raksha-muted">
          Real-time oversight over all simulated transactions across the platform.
        </p>
      </div>

      {/* Search & Filter Header */}
      <GlassCard className="border border-primary/40 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearch} className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-raksha-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ref ID, recipient handle..."
              className="w-full pl-10 pr-4 py-2 bg-[#1E2421] border border-primary/40 rounded-xl text-xs text-[#D1E8E2] placeholder-raksha-dim focus:outline-none focus:border-accent"
            />
          </form>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {['ALL', 'APPROVED', 'PENDING', 'BLOCKED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  filter === st
                    ? 'bg-primary text-[#D1E8E2] border border-primary-light/40 shadow-glow-teal'
                    : 'bg-[#1E2421] text-raksha-muted hover:text-[#D1E8E2]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="border border-primary/40 p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-accent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-20 text-center text-xs text-raksha-muted">
            No transactions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1E2421] border-b border-primary/30 text-raksha-muted uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Ref ID</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Amount (INR)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/20">
                {transactions.map((tx) => {
                  const isApproved = tx.status === 'APPROVED';
                  const isBlocked = tx.status === 'BLOCKED';
                  const isPending = tx.status === 'PENDING';

                  return (
                    <tr key={tx.id} className="hover:bg-[#242C28] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-accent">
                        {tx.transaction_ref}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#D1E8E2] block">{tx.recipient_name}</span>
                        <span className="font-mono text-[11px] text-raksha-muted block">{tx.recipient_upi_id}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#D1E8E2]">
                        ₹{tx.amount_rupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                            isApproved
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isBlocked
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-mono font-bold ${
                            tx.risk_score >= 70
                              ? 'text-rose-400'
                              : tx.risk_score >= 30
                              ? 'text-amber-300'
                              : 'text-emerald-400'
                          }`}
                        >
                          {tx.risk_score} / 100
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-raksha-muted text-[11px]">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="px-2.5 py-1 rounded-lg bg-primary/30 hover:bg-primary/50 text-[#D1E8E2] text-xs transition-colors"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Inspect Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="max-w-lg w-full border border-primary/50 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-primary/30">
              <span className="text-xs font-bold text-accent uppercase">
                SOC Transaction Audit
              </span>
              <button onClick={() => setSelectedTx(null)} className="text-raksha-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#1E2421] rounded-2xl p-4 border border-primary/30 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-raksha-muted">Transaction ID:</span>
                <span className="font-mono text-accent">{selectedTx.transaction_ref}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-raksha-muted">Amount:</span>
                <span className="font-mono font-bold text-[#D1E8E2]">
                  ₹{selectedTx.amount_rupees.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-raksha-muted">Recipient:</span>
                <span className="text-[#D1E8E2]">{selectedTx.recipient_name} ({selectedTx.recipient_upi_id})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-raksha-muted">Status:</span>
                <span className="font-bold text-[#D1E8E2]">{selectedTx.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-raksha-muted">Idempotency Key:</span>
                <span className="font-mono text-raksha-dim">{selectedTx.idempotency_key}</span>
              </div>
            </div>

            {selectedTx.decision_reason && (
              <div className="p-3.5 rounded-xl bg-primary/20 border border-primary/40 text-xs space-y-1">
                <span className="font-bold text-accent block">Decision Rationale:</span>
                <p className="text-raksha-muted text-[11px] leading-relaxed">
                  {selectedTx.decision_reason}
                </p>
              </div>
            )}

            <PeachButton fullWidth onClick={() => setSelectedTx(null)}>
              Close Inspector
            </PeachButton>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
