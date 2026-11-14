import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpRight,
  ShieldAlert,
  AlertTriangle,
  Download,
  Calendar,
  X,
  Copy,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { GlassCard } from '../../components/common/GlassCard';
import { PeachButton } from '../../components/common/PeachButton';
import api from '../../services/api';

interface TransactionItem {
  id: string;
  transaction_ref: string;
  recipient_upi_id: string;
  recipient_name: string;
  amount_rupees: number;
  status: 'APPROVED' | 'PENDING' | 'BLOCKED' | 'FAILED';
  risk_score: number;
  risk_category: string;
  decision_reason?: string;
  risk_signals?: string[];
  note?: string;
  created_at: string;
}

export const TransactionHistoryPage: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (filter !== 'ALL') params.status = filter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.get<TransactionItem[]>('/transactions', { params });
      setTransactions(res.data);
    } catch (err) {
      console.error('Failed to load transaction history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  const handleDownloadReceipt = (tx: TransactionItem) => {
    const content = `================================================
RAKSHAPAY SIMULATED PAYMENT RECEIPT
Tagline: Pay Smart. Stay Protected.
================================================
Transaction Ref : ${tx.transaction_ref}
Date / Time     : ${new Date(tx.created_at).toLocaleString()}
Status          : ${tx.status}
Amount          : INR ${tx.amount_rupees?.toFixed(2)}
Recipient UPI   : ${tx.recipient_upi_id} (${tx.recipient_name})
Risk Score      : ${tx.risk_score} / 100 (${tx.risk_category})
Decision Reason : ${tx.decision_reason || 'Verified'}
Note            : ${tx.note || 'N/A'}
------------------------------------------------
SIMULATED UPI TRANSACTION - DEMONSTRATION ONLY
================================================`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${tx.transaction_ref}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Receipt className="w-5 h-5 text-[#D4AF37]" />
          <span className="text-xs font-bold uppercase tracking-widest text-[#F5D78E]">
            Immutable Ledger Records
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Transaction History & Receipts
        </h1>
        <p className="text-xs sm:text-sm text-[#A5AAA5]">
          Inspect all simulated payment debits, risk classifications, and downloadable compliance receipts.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <GlassCard className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A5AAA5]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, recipient, note..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#080909] border border-[#D4AF37]/30 rounded-xl text-xs text-white placeholder-[#A5AAA5]/50 focus:outline-none focus:border-[#F5D78E] focus:shadow-glow-gold"
            />
          </form>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {['ALL', 'APPROVED', 'PENDING', 'BLOCKED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  filter === st
                    ? 'gold-button shadow-glow-gold'
                    : 'bg-[#080909] text-[#A5AAA5] hover:text-white border border-white/5'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Transactions List */}
      <GlassCard className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Receipt className="w-12 h-12 text-[#A5AAA5] mx-auto opacity-50" />
            <p className="text-xs text-[#A5AAA5]">No transactions found matching the filter criteria.</p>
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
                  onClick={() => setSelectedTx(tx)}
                  className="p-4 sm:p-5 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
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
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {tx.recipient_name}
                        </span>
                        <span className="text-[10px] text-[#A5AAA5] font-mono hidden sm:inline">
                          ({tx.recipient_upi_id})
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#F5D78E] block mt-0.5 font-bold">
                        {tx.transaction_ref}
                      </span>
                      <span className="text-[10px] text-[#A5AAA5] block">
                        {new Date(tx.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-mono text-sm sm:text-base font-black block ${
                        isBlocked ? 'line-through text-[#A5AAA5]' : 'text-white'
                      }`}
                    >
                      ₹{tx.amount_rupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block mt-1 border ${
                        isApproved
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                          : isBlocked
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
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
      </GlassCard>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <GlassCard className="max-w-lg w-full border border-[#D4AF37]/50 p-6 sm:p-7 space-y-6 relative max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-[#F5D78E]">
                Transaction Inspector & Receipt
              </span>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-[#A5AAA5] hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-1">
              <span className="text-3xl font-mono font-black text-white block">
                ₹{selectedTx.amount_rupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-[#A5AAA5]">
                to {selectedTx.recipient_name} ({selectedTx.recipient_upi_id})
              </span>
            </div>

            <div className="bg-[#080909] rounded-2xl p-4 sm:p-5 border border-[#D4AF37]/25 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#A5AAA5]">Reference ID</span>
                <span className="font-mono text-[#F5D78E] font-bold">{selectedTx.transaction_ref}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A5AAA5]">Status</span>
                <span className="font-bold text-white">{selectedTx.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A5AAA5]">Risk Score</span>
                <span className="font-bold text-[#F5D78E]">
                  {selectedTx.risk_score} / 100 ({selectedTx.risk_category})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A5AAA5]">Timestamp</span>
                <span className="text-white font-mono">
                  {new Date(selectedTx.created_at).toLocaleString()}
                </span>
              </div>
              {selectedTx.note && (
                <div className="flex justify-between">
                  <span className="text-[#A5AAA5]">Remark</span>
                  <span className="text-white">"{selectedTx.note}"</span>
                </div>
              )}
            </div>

            {selectedTx.decision_reason && (
              <div className="p-4 rounded-2xl bg-[#080909] border border-[#D4AF37]/35 text-xs space-y-1">
                <span className="font-bold text-[#F5D78E] block uppercase tracking-wider text-[11px]">
                  Fraud Engine Assessment:
                </span>
                <p className="text-[#A5AAA5] text-xs leading-relaxed">
                  {selectedTx.decision_reason}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <PeachButton
                variant="secondary"
                onClick={() => handleDownloadReceipt(selectedTx)}
                icon={<Download className="w-4 h-4" />}
              >
                Download Receipt
              </PeachButton>
              <PeachButton onClick={() => setSelectedTx(null)}>
                Close Inspector
              </PeachButton>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
