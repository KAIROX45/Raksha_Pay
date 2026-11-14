import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Download,
  ArrowLeft,
  Share2,
  Copy,
  Sparkles,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GlassCard } from '../../components/common/GlassCard';
import { PeachButton } from '../../components/common/PeachButton';
import api from '../../services/api';

export const PaymentResultPage: React.FC = () => {
  const { ref } = useParams<{ ref: string }>();
  const location = useLocation();
  const [transaction, setTransaction] = useState<any>(location.state?.transaction || null);
  const [isLoading, setIsLoading] = useState(!location.state?.transaction);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!transaction && ref) {
      api.get(`/transactions/${ref}/receipt`)
        .then((res) => {
          setTransaction(res.data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load transaction receipt:', err);
          setIsLoading(false);
        });
    }
  }, [ref, transaction]);

  useEffect(() => {
    if (transaction?.status === 'APPROVED') {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#F5D78E', '#FFFFFF'],
      });
    }
  }, [transaction]);

  const copyRef = () => {
    if (transaction?.transaction_ref) {
      navigator.clipboard.writeText(transaction.transaction_ref);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadReceipt = () => {
    if (!transaction) return;
    const content = `================================================
RAKSHAPAY 3D LUXURY FINTECH RECEIPT
Tagline: Pay Smart. Stay Protected.
================================================
Transaction Ref : ${transaction.transaction_ref}
Date / Time     : ${new Date(transaction.created_at || transaction.date_time).toLocaleString()}
Status          : ${transaction.status}
Amount          : INR ${transaction.amount_rupees?.toFixed(2)}
Sender UPI      : ${transaction.sender_upi_id}
Recipient UPI   : ${transaction.recipient_upi_id} (${transaction.recipient_name})
Recipient Bank  : ${transaction.recipient_bank || 'Simulated Partner Bank'}
Risk Score      : ${transaction.risk_score} / 100 (${transaction.risk_category})
Decision Reason : ${transaction.decision_reason || 'Verified'}
Ledger Verified : ${transaction.ledger_verified ? 'YES (Double-Entry ACID Balanced)' : 'NO'}
------------------------------------------------
SIMULATED UPI TRANSACTION - DEMONSTRATION ONLY
================================================`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${transaction.transaction_ref}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-white">Transaction Not Found</h2>
        <p className="text-xs text-[#A5AAA5]">Could not find record for reference: {ref}</p>
        <Link to="/app/dashboard">
          <PeachButton>Return to Dashboard</PeachButton>
        </Link>
      </div>
    );
  }

  const isApproved = transaction.status === 'APPROVED';
  const isBlocked = transaction.status === 'BLOCKED';
  const isPending = transaction.status === 'PENDING';

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-10 space-y-6">
      {/* Receipt Card */}
      <GlassCard className="p-8 sm:p-10 space-y-8 relative overflow-hidden text-center shadow-glow-gold">
        {/* Animated Status Icon */}
        <div className="flex justify-center">
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center border transition-transform duration-500 scale-100 ${
              isApproved
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-lg'
                : isBlocked
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-lg'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-lg'
            }`}
          >
            {isApproved ? (
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            ) : isBlocked ? (
              <ShieldAlert className="w-10 h-10" />
            ) : (
              <AlertTriangle className="w-10 h-10" />
            )}
          </div>
        </div>

        {/* Status Headline */}
        <div className="space-y-1">
          <span
            className={`text-xs font-black uppercase tracking-widest px-3.5 py-1 rounded-full border inline-block ${
              isApproved
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : isBlocked
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
            }`}
          >
            {isApproved ? 'Payment Successful' : isBlocked ? 'Payment Blocked by AI' : 'Payment Held Pending'}
          </span>
          <div className="pt-3">
            <span className="text-4xl sm:text-5xl font-mono font-black text-white tracking-tight block">
              ₹{transaction.amount_rupees?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-xs text-[#A5AAA5]">
            to <strong className="text-white">{transaction.recipient_name}</strong> ({transaction.recipient_upi_id})
          </span>
        </div>

        {/* Transaction Telemetry Breakdown */}
        <div className="bg-[#080909] rounded-2xl p-4 sm:p-5 border border-[#D4AF37]/25 space-y-3 text-left text-xs">
          <div className="flex justify-between items-center pb-2.5 border-b border-white/10">
            <span className="text-[#A5AAA5]">Transaction ID</span>
            <div className="flex items-center gap-1.5 font-mono text-[#F5D78E] font-bold">
              <span>{transaction.transaction_ref}</span>
              <button
                onClick={copyRef}
                className="hover:text-white p-1 rounded transition-colors"
                title="Copy ID"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              {copied && <span className="text-[10px] text-emerald-400">Copied!</span>}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#A5AAA5]">Recipient</span>
            <span className="text-white font-medium text-right font-mono">
              {transaction.recipient_name}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#A5AAA5]">Recipient UPI ID</span>
            <span className="text-[#F5D78E] font-mono text-right">
              {transaction.recipient_upi_id}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#A5AAA5]">Recipient Bank</span>
            <span className="text-white font-medium text-right">
              {transaction.recipient_bank || 'HDFC Bank'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#A5AAA5]">AI Risk Assessment</span>
            <span
              className={`font-black ${
                transaction.risk_score >= 70
                  ? 'text-rose-400'
                  : transaction.risk_score >= 30
                  ? 'text-amber-300'
                  : 'text-emerald-400'
              }`}
            >
              Score: {transaction.risk_score}/100 ({transaction.risk_category})
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#A5AAA5]">Double-Entry Settlement</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              {transaction.ledger_verified ? 'Atomic Balance Committed' : 'Zero Funds Moved'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#A5AAA5]">Timestamp</span>
            <span className="text-white font-mono">
              {new Date(transaction.created_at || transaction.date_time).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Gemini Explanation Banner */}
        {transaction.ai_explanation && (
          <div className="p-4 rounded-2xl bg-[#080909] border border-[#D4AF37]/35 text-left text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-[#F5D78E] font-bold text-xs">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>Google Gemini AI Analysis:</span>
            </div>
            <p className="text-[#A5AAA5] text-xs leading-relaxed whitespace-pre-line">
              {transaction.ai_explanation}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <PeachButton onClick={handleDownloadReceipt} variant="secondary" icon={<Download className="w-4 h-4" />}>
            Download Receipt
          </PeachButton>

          <Link to="/app/dashboard" className="w-full">
            <PeachButton fullWidth icon={<ArrowLeft className="w-4 h-4" />}>
              Dashboard
            </PeachButton>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
};
