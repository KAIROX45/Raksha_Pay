import React, { useState } from 'react';
import { QrCode, Copy, Check, Share2, ShieldCheck, AlertCircle, Info, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import { PeachButton } from '../../components/common/PeachButton';

export const ReceiveMoneyPage: React.FC = () => {
  const { user, account } = useAuth();
  const [copied, setCopied] = useState(false);

  const upiId = account?.upi_id || 'rohit@raksha';

  const copyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-md mx-auto py-6 space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black text-white">Receive Money</h1>
        <p className="text-xs text-[#A5AAA5]">
          Share your simulated UPI ID or QR code to receive instant test transfers into your vault.
        </p>
      </div>

      <GlassCard className="p-8 space-y-6 text-center shadow-glow-gold">
        {/* User Handle Header */}
        <div>
          <span className="text-base font-extrabold text-white block">{user?.full_name}</span>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#080909] border border-[#D4AF37]/35 font-mono text-xs text-[#F5D78E] mt-1.5">
            <span>{upiId}</span>
            <button onClick={copyUPI} className="hover:text-white" title="Copy UPI ID">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Simulated QR Code Canvas Visual */}
        <div className="p-6 rounded-3xl bg-white w-56 h-56 mx-auto flex flex-col items-center justify-center shadow-glow-gold relative border-2 border-[#D4AF37]/50">
          <QrCode className="w-44 h-44 text-[#080909]" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-11 h-11 rounded-xl bg-[#080909] flex items-center justify-center border-2 border-[#D4AF37] shadow-lg">
              <ShieldCheck className="w-6 h-6 text-[#F5D78E]" />
            </div>
          </div>
        </div>

        {/* Security Alert: Never enter PIN to receive */}
        <div className="p-4 rounded-2xl bg-[#080909] border border-[#D4AF37]/30 text-amber-300 text-xs text-left flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#F5D78E]" />
          <div className="space-y-1">
            <span className="font-bold text-[#F5D78E] block uppercase tracking-wider text-[11px]">
              Golden Security Principle:
            </span>
            <span className="text-[#A5AAA5] text-[11px] leading-relaxed block">
              You NEVER need to enter your UPI PIN or approve a request to receive money.
              If someone sends you a collect link claiming it is a refund or prize, decline it immediately!
            </span>
          </div>
        </div>

        {/* Copy Action Button */}
        <PeachButton fullWidth onClick={copyUPI} icon={<Copy className="w-4 h-4" />}>
          {copied ? 'UPI ID Copied to Clipboard!' : 'Copy Simulated UPI ID'}
        </PeachButton>
      </GlassCard>
    </div>
  );
};
