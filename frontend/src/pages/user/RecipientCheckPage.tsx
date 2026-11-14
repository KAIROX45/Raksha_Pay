import React, { useState } from 'react';
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Flag,
  Info,
  Calendar,
  CheckCircle2,
  X,
  AlertCircle,
  Clock,
  UserCheck,
  Sparkles,
  ShieldX,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import { PeachButton } from '../../components/common/PeachButton';
import api from '../../services/api';

interface RecipientRisk {
  upi_id: string;
  name: string;
  account_age_days: number;
  risk_level: string;
  report_count: number;
  verification_status: string;
  risk_indicators: string[];
  explanation: string;
}

interface HybridTelemetry {
  risk_score: number;
  rf_score?: number;
  gemini_score?: number;
  is_threat: boolean;
  decision_reason: string;
  detection_signals: string[];
}

export const RecipientCheckPage: React.FC = () => {
  const { incrementThreatsIntercepted } = useAuth();
  const [upiInput, setUpiInput] = useState('techsupport@fakeupi');
  const [recipientData, setRecipientData] = useState<RecipientRisk | null>(null);
  const [hybridData, setHybridData] = useState<HybridTelemetry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Report modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Remote Screen Sharing Impersonation');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const handleInspect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!upiInput.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const [res, hybridRes] = await Promise.all([
        api.get<RecipientRisk>(`/recipients/${encodeURIComponent(upiInput.trim())}/risk`),
        api.post<HybridTelemetry>('/analyze-transaction', {
          upi_id: upiInput.trim(),
          amount: 1000.0,
        }).catch(() => null),
      ]);

      setRecipientData(res.data);
      if (hybridRes && hybridRes.data) {
        setHybridData(hybridRes.data);
        if (hybridRes.data.is_threat || res.data.risk_level === 'HIGH') {
          incrementThreatsIntercepted();
        }
      } else if (res.data.risk_level === 'HIGH') {
        incrementThreatsIntercepted();
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          'Recipient verification could not be completed. The UPI ID could not be found or verified.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientData) return;

    setIsSubmittingReport(true);
    try {
      const res = await api.post('/recipients/report', {
        upi_id: recipientData.upi_id,
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      });
      setReportSuccess(res.data.message);
      setTimeout(() => {
        setIsReportModalOpen(false);
        setReportSuccess(null);
        handleInspect();
      }, 1500);
    } catch (err: any) {
      setError('Failed to submit security report.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <UserCheck className="w-5 h-5 text-[#D4AF37]" />
          <span className="text-xs font-bold uppercase tracking-widest text-[#F5D78E]">
            Pre-Transaction Intelligence
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Recipient Security & Risk Verification
        </h1>
        <p className="text-xs sm:text-sm text-[#A5AAA5]">
          Inspect recipient reputation, simulated account age, and active community reports before sending funds.
        </p>
      </div>

      {/* Search Bar */}
      <GlassCard className="space-y-4">
        <form onSubmit={handleInspect} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#A5AAA5]" />
            <input
              type="text"
              value={upiInput}
              onChange={(e) => setUpiInput(e.target.value)}
              placeholder="Enter recipient UPI ID (e.g. aman@raksha or techsupport@fakeupi)"
              className="w-full pl-11 pr-4 py-3.5 bg-[#080909] border border-[#D4AF37]/35 rounded-2xl text-sm font-mono text-white placeholder-[#A5AAA5]/50 focus:outline-none focus:border-[#F5D78E] focus:shadow-glow-gold"
              required
            />
          </div>
          <PeachButton type="submit" isLoading={isLoading} icon={<Search className="w-4 h-4" />}>
            Verify Recipient
          </PeachButton>
        </form>

        {/* Quick Test Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[#A5AAA5] font-semibold">Quick test:</span>
          <button
            type="button"
            onClick={() => {
              setUpiInput('quickmart@upi');
            }}
            className="px-3 py-1.5 rounded-xl bg-[#121414] hover:bg-[#1a1d1d] border border-[#D4AF37]/30 text-[#F5D78E] font-mono font-semibold transition-all shadow-sm"
          >
            quickmart@upi (Safe Merchant)
          </button>
          <button
            type="button"
            onClick={() => {
              setUpiInput('techsupport@fakeupi');
            }}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/35 text-rose-300 font-mono font-semibold transition-all shadow-sm"
          >
            techsupport@fakeupi (Flagged Scam)
          </button>
        </div>
      </GlassCard>

      {/* Warning/Error message when verification fails */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/35 text-rose-300 text-xs font-semibold flex items-start gap-3 shadow-md">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <div>
            <span className="block font-bold">Verification Notice</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Inspection Results Panel */}
      {recipientData && (
        <GlassCard className="space-y-6">
          {hybridData && hybridData.is_threat && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/50 flex items-center justify-between shadow-glow-gold">
              <div className="flex items-center gap-3">
                <ShieldX className="w-6 h-6 text-rose-400 shrink-0" />
                <div>
                  <span className="text-xs font-black text-rose-300 block uppercase tracking-wider">
                    Threat Intercepted by Random Forest & Gemini AI
                  </span>
                  <span className="text-[11px] text-[#A5AAA5]">
                    Risk Score: {hybridData.risk_score}/100 • ML Score: {hybridData.rf_score ?? 85} • Gemini Urgency Flagged
                  </span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 font-mono text-[10px] font-black border border-rose-500/40 uppercase">
                Transfer Blocked
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-black text-white">{recipientData.name}</span>
                <span
                  className={`text-[11px] font-black px-3 py-0.5 rounded-full border ${
                    recipientData.risk_level === 'HIGH'
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                      : recipientData.risk_level === 'MEDIUM'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {recipientData.verification_status}
                </span>
              </div>
              <span className="text-xs text-[#F5D78E] font-mono font-bold block mt-1">
                {recipientData.upi_id}
              </span>
            </div>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/35 text-rose-300 text-xs font-bold transition-all shadow-md"
            >
              <Flag className="w-4 h-4" />
              <span>Report Malicious UPI ID</span>
            </button>
          </div>

          {/* Metric Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#080909] border border-[#D4AF37]/25 space-y-1">
              <span className="text-[#A5AAA5] text-[10px] uppercase tracking-wider block font-bold">
                Simulated Account Age
              </span>
              <span className="text-2xl font-black font-mono text-white">
                {recipientData.account_age_days} days
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#080909] border border-[#D4AF37]/25 space-y-1">
              <span className="text-[#A5AAA5] text-[10px] uppercase tracking-wider block font-bold">
                Community Reports
              </span>
              <span
                className={`text-2xl font-black font-mono ${
                  recipientData.report_count > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {recipientData.report_count} incident(s)
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#080909] border border-[#D4AF37]/25 space-y-1">
              <span className="text-[#A5AAA5] text-[10px] uppercase tracking-wider block font-bold">
                Risk Classification
              </span>
              <span
                className={`text-2xl font-black font-mono ${
                  recipientData.risk_level === 'HIGH'
                    ? 'text-rose-400'
                    : recipientData.risk_level === 'MEDIUM'
                    ? 'text-amber-300'
                    : 'text-emerald-400'
                }`}
              >
                {recipientData.risk_level}
              </span>
            </div>
          </div>

          {/* Indicators List */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Observed Risk Indicators
            </span>
            <div className="space-y-2">
              {recipientData.risk_indicators.length > 0 ? (
                recipientData.risk_indicators.map((ind, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-[#080909] border border-[#D4AF37]/25 text-xs flex items-center gap-2.5 text-white"
                  >
                    <AlertTriangle className="w-4 h-4 text-[#F5D78E] shrink-0" />
                    <span>{ind}</span>
                  </div>
                ))
              ) : (
                <div className="p-3.5 rounded-2xl bg-[#080909] border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>No negative risk flags detected for this simulated recipient.</span>
                </div>
              )}
            </div>
          </div>

          {/* Explanation */}
          <div className="p-4 rounded-2xl bg-[#080909] border border-[#D4AF37]/35 text-xs space-y-1.5 shadow-inner">
            <span className="font-bold text-[#F5D78E] block uppercase tracking-wider text-[11px]">
              Reputation Intelligence Verdict:
            </span>
            <p className="text-[#A5AAA5] leading-relaxed text-xs">
              {recipientData.explanation}
            </p>
          </div>
        </GlassCard>
      )}

      {/* Report Recipient Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <GlassCard className="max-w-md w-full border border-rose-500/50 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Submit Fraud Report
              </span>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-[#A5AAA5] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto" />
                <p>{reportSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#A5AAA5] mb-1.5">
                    Suspect Handle
                  </label>
                  <input
                    type="text"
                    disabled
                    value={recipientData?.upi_id}
                    className="w-full px-3.5 py-2.5 bg-[#080909] border border-[#D4AF37]/30 rounded-xl text-xs font-mono text-[#F5D78E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#A5AAA5] mb-1.5">
                    Category of Fraud
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#080909] border border-[#D4AF37]/35 rounded-xl text-xs text-white focus:outline-none focus:border-[#F5D78E]"
                  >
                    <option value="Remote Screen Sharing Impersonation">
                      Remote Screen Sharing Impersonation
                    </option>
                    <option value="Fake Lottery / Cashback Prize">
                      Fake Lottery / Cashback Prize
                    </option>
                    <option value="Urgent Utility Bill Disconnect Threat">
                      Urgent Utility Bill Disconnect Threat
                    </option>
                    <option value="Phishing Collect Request">Phishing Collect Request</option>
                    <option value="Other Malicious Activity">Other Malicious Activity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#A5AAA5] mb-1.5">
                    Additional Context / Evidence
                  </label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Describe how the scam was attempted..."
                    className="w-full px-3.5 py-2.5 bg-[#080909] border border-[#D4AF37]/35 rounded-xl text-xs text-white placeholder-[#A5AAA5]/50 focus:outline-none focus:border-[#F5D78E]"
                  />
                </div>

                <PeachButton type="submit" fullWidth isLoading={isSubmittingReport}>
                  Submit to SOC Team
                </PeachButton>
              </form>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
};
