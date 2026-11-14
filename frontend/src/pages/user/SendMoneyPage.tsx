import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Send,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Search,
  Sparkles,
  Lock,
  CheckCircle2,
  X,
  KeyRound,
  ShieldX,
  Building2,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import { PeachButton } from '../../components/common/PeachButton';
import { RiskGauge } from '../../components/common/RiskGauge';
import api from '../../services/api';

interface SuggestedRecipient {
  id: string;
  upi_id: string;
  name: string;
  risk_level: string;
  verification_status: string;
  report_count: number;
}

interface VerifiedRecipientData {
  upi_id: string;
  name: string;
  bank_name: string;
  verification_status: string;
  risk_level: string;
  report_count: number;
  explanation?: string;
  is_registered?: boolean;
}

interface HybridAnalysisResult {
  risk_score: number;
  risk_category: string;
  recommended_action: string;
  is_threat: boolean;
  rf_score?: number;
  gemini_score?: number;
  rule_score: number;
  model_version: string;
  gemini_model: string;
  detection_signals: string[];
  decision_reason: string;
  gemini_analysis?: {
    risk_assessment: string;
    risk_score: number;
    urgency_detected: boolean;
    phishing_detected: boolean;
    suspicious_phrases: string[];
    explanation: string;
    safety_recommendations: string[];
    model_used: string;
  };
  structured_features?: {
    amount: number;
    amount_deviation: number;
    odd_hours: boolean;
    new_recipient_flag: boolean;
    recipient_risk_flag: boolean;
    hour_of_day: number;
  };
}

export const SendMoneyPage: React.FC = () => {
  const { account, refreshAccount, incrementThreatsIntercepted } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const stateUpi = (location.state as any)?.recipient_upi_id;
  const stateAmount = (location.state as any)?.amount_rupees;
  const stateNote = (location.state as any)?.note;

  // Recipient input & verification states
  const [recipientUpi, setRecipientUpi] = useState(stateUpi || 'debabratadas7557@okhdfcbank');
  const [verifiedRecipient, setVerifiedRecipient] = useState<VerifiedRecipientData | null>(null);
  const [isVerifyingRecipient, setIsVerifyingRecipient] = useState(false);
  const [recipientVerificationError, setRecipientVerificationError] = useState<string | null>(null);
  const [recipientVerificationSuccess, setRecipientVerificationSuccess] = useState<string | null>(null);

  // Amount & Note states
  const [amountRupees, setAmountRupees] = useState(stateAmount ? stateAmount.toString() : '500');
  const [note, setNote] = useState(stateNote || 'Demo transfer');
  const [suggestedRecipients, setSuggestedRecipients] = useState<SuggestedRecipient[]>([]);

  // Pre-check risk preview state
  const [riskPreview, setRiskPreview] = useState<{
    risk_score: number;
    risk_category: string;
    detection_signals: string[];
    explanation: string;
    rf_score?: number;
    gemini_score?: number;
  } | null>(null);

  const [isCheckingRisk, setIsCheckingRisk] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP Step & Threat Interception States
  const [isEvaluatingRisk, setIsEvaluatingRisk] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState('123456');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [interceptedThreat, setInterceptedThreat] = useState<HybridAnalysisResult | null>(null);
  const [clearedAnalysis, setClearedAnalysis] = useState<HybridAnalysisResult | null>(null);

  // Function to verify recipient against simulated directory
  const handleVerifyRecipient = async (overrideUpi?: string) => {
    const rawUpi = overrideUpi !== undefined ? overrideUpi : recipientUpi;
    const targetUpi = (rawUpi || '').trim().toLowerCase();

    if (!targetUpi) {
      setRecipientVerificationError('Please enter a recipient UPI ID to verify.');
      setVerifiedRecipient(null);
      setRecipientVerificationSuccess(null);
      return;
    }

    setIsVerifyingRecipient(true);
    setRecipientVerificationError(null);
    setRecipientVerificationSuccess(null);
    setError(null);

    try {
      const res = await api.get<VerifiedRecipientData>(`/recipients/${encodeURIComponent(targetUpi)}/verify`);
      setVerifiedRecipient({
        upi_id: res.data.upi_id,
        name: res.data.name,
        bank_name: res.data.bank_name || 'Simulated Partner Bank',
        verification_status: res.data.verification_status,
        risk_level: res.data.risk_level,
        report_count: res.data.report_count ?? 0,
      });
      setRecipientVerificationSuccess('Recipient Verified Successfully');
      setRecipientVerificationError(null);
    } catch (err: any) {
      setVerifiedRecipient(null);
      setRecipientVerificationSuccess(null);
      const detailMsg =
        err.response?.data?.detail ||
        `Recipient UPI ID '${targetUpi}' does not exist in the simulated RakshaPay directory.`;
      setRecipientVerificationError(detailMsg);
    } finally {
      setIsVerifyingRecipient(false);
    }
  };

  useEffect(() => {
    // Fetch suggested recipients directory
    api.get<SuggestedRecipient[]>('/recipients/suggested')
      .then((res) => setSuggestedRecipients(res.data))
      .catch((err) => console.error('Failed to load recipients:', err));

    // Auto-verify initial demo recipient on mount
    const initialUpi = stateUpi || 'debabratadas7557@okhdfcbank';
    handleVerifyRecipient(initialUpi);
  }, []);

  const handlePrecheckRisk = async () => {
    if (!recipientUpi.trim()) {
      setError('Please enter and verify recipient UPI ID first.');
      return;
    }
    const amt = parseFloat(amountRupees);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setIsCheckingRisk(true);
    setError(null);
    try {
      const res = await api.post<HybridAnalysisResult>('/analyze-transaction', {
        upi_id: recipientUpi.trim().toLowerCase(),
        amount: amt,
        note: note.trim() || undefined,
        timestamp: new Date().toISOString(),
      });
      setRiskPreview({
        risk_score: res.data.risk_score,
        risk_category: res.data.risk_category,
        detection_signals: res.data.detection_signals,
        explanation: res.data.decision_reason,
        rf_score: res.data.rf_score,
        gemini_score: res.data.gemini_score,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Pre-check risk analysis failed.');
    } finally {
      setIsCheckingRisk(false);
    }
  };

  // Step 1: Pre-Submission Scam Check before allowing OTP step
  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOtpError(null);

    // Validate recipient verification
    if (!verifiedRecipient) {
      setError('Recipient must be verified before proceeding. Please click "Verify Recipient".');
      return;
    }

    // Validate amount
    const amt = parseFloat(amountRupees);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid transfer amount greater than ₹0.');
      return;
    }

    if (account && amt > account.balance_rupees) {
      setError(
        `Insufficient funds. Available balance: ₹${account.balance_rupees.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        })}, required: ₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      );
      return;
    }

    setIsEvaluatingRisk(true);
    try {
      // Trigger live hybrid Random Forest & Gemini AI defense check
      const res = await api.post<HybridAnalysisResult>('/analyze-transaction', {
        upi_id: verifiedRecipient.upi_id,
        amount: amt,
        note: note.trim() || undefined,
        timestamp: new Date().toISOString(),
      });

      const analysis = res.data;
      setRiskPreview({
        risk_score: analysis.risk_score,
        risk_category: analysis.risk_category,
        detection_signals: analysis.detection_signals,
        explanation: analysis.decision_reason,
        rf_score: analysis.rf_score,
        gemini_score: analysis.gemini_score,
      });

      if (analysis.is_threat || analysis.risk_category === 'HIGH' || analysis.risk_score >= 70) {
        // THREAT INTERCEPTED! Lock OTP step, display Threat Intercepted Modal & dynamically increment counter
        incrementThreatsIntercepted();
        setInterceptedThreat(analysis);
        setShowOtpModal(false);
      } else {
        // AI CLEARANCE GRANTED: Open OTP Step
        setClearedAnalysis(analysis);
        setShowOtpModal(true);
        setOtpValue('123456'); // Keep demo OTP 123456 working in sandbox mode
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to complete pre-payment AI risk scan.');
    } finally {
      setIsEvaluatingRisk(false);
    }
  };

  // Step 2: Final OTP Authorization & Payment Execution
  const handleConfirmOtpPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate payment execution

    if (!otpValue.trim()) {
      setOtpError('Please enter the 6-digit transaction authorization OTP.');
      return;
    }

    // Verify OTP before executing payment (preserve demo OTP 123456)
    if (otpValue.trim() !== '123456') {
      setOtpError('Invalid OTP. In sandbox demo mode, enter demo OTP 123456.');
      return;
    }

    if (!verifiedRecipient) {
      setOtpError('Recipient verification missing. Please re-verify recipient.');
      return;
    }

    const amt = parseFloat(amountRupees);
    setIsSubmitting(true);
    setOtpError(null);

    try {
      const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const res = await api.post('/transactions/initiate', {
        recipient_upi_id: verifiedRecipient.upi_id,
        amount_rupees: amt,
        idempotency_key: idempotencyKey,
        note: note.trim() || undefined,
      });

      await refreshAccount();
      setShowOtpModal(false);
      navigate(`/app/payment-result/${res.data.transaction_ref}`, {
        state: { transaction: res.data },
      });
    } catch (err: any) {
      setOtpError(err.response?.data?.detail || 'Transaction processing failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectRecipient = (r: SuggestedRecipient) => {
    setRecipientUpi(r.upi_id);
    setRiskPreview(null);
    setInterceptedThreat(null);
    // Auto-verify chosen recipient
    handleVerifyRecipient(r.upi_id);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Send className="w-5 h-5 text-[#D4AF37]" />
          <span className="text-xs font-bold uppercase tracking-widest text-[#F5D78E]">
            Secure Simulated Transfer
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Send Protected Payment
        </h1>
        <p className="text-xs sm:text-sm text-[#A5AAA5]">
          Simulate an instantaneous UPI transfer backed by Scikit-Learn Random Forest and Gemini AI multi-modal scam defense.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Card */}
        <div className="lg:col-span-7 space-y-6">
          <GlassCard className="space-y-6">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/35 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleInitiateTransfer} className="space-y-5">
              {/* Step 1: Recipient UPI ID & Verification */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-[#A5AAA5] uppercase tracking-wider">
                  Recipient Simulated UPI ID
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#A5AAA5]">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={recipientUpi}
                      onChange={(e) => {
                        setRecipientUpi(e.target.value);
                        setVerifiedRecipient(null);
                        setRecipientVerificationSuccess(null);
                        setRecipientVerificationError(null);
                        setRiskPreview(null);
                        setInterceptedThreat(null);
                      }}
                      placeholder="e.g. debabratadas7557@okhdfcbank or aman@raksha"
                      className="w-full pl-11 pr-4 py-3.5 bg-[#080909] border border-[#D4AF37]/35 rounded-2xl text-sm font-mono text-white placeholder-[#A5AAA5]/50 focus:outline-none focus:border-[#F5D78E] focus:shadow-glow-gold transition-all"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVerifyRecipient()}
                    disabled={isVerifyingRecipient}
                    className="px-5 py-3.5 rounded-2xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/50 text-xs font-bold text-[#F5D78E] transition-all flex items-center justify-center gap-2 shrink-0 shadow-sm disabled:opacity-50"
                  >
                    <UserCheck className="w-4 h-4 text-[#D4AF37]" />
                    <span>{isVerifyingRecipient ? 'Verifying...' : 'Verify Recipient'}</span>
                  </button>
                </div>

                {/* Verification Error */}
                {recipientVerificationError && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/35 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{recipientVerificationError}</span>
                  </div>
                )}

                {/* Step 2: Green "Recipient Verified Successfully" Box */}
                {verifiedRecipient && recipientVerificationSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/35 space-y-3 animate-fade-in shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                          Recipient Verified Successfully
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                        {verifiedRecipient.verification_status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-xl bg-[#080909]/80 border border-emerald-500/20">
                        <span className="text-[10px] text-[#A5AAA5] uppercase block font-semibold mb-0.5">
                          Recipient Name
                        </span>
                        <span className="font-bold text-white text-xs block truncate">
                          {verifiedRecipient.name}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#080909]/80 border border-emerald-500/20">
                        <span className="text-[10px] text-[#A5AAA5] uppercase block font-semibold mb-0.5">
                          UPI ID
                        </span>
                        <span className="font-mono font-bold text-[#F5D78E] text-[11px] block truncate">
                          {verifiedRecipient.upi_id}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#080909]/80 border border-emerald-500/20">
                        <span className="text-[10px] text-[#A5AAA5] uppercase block font-semibold mb-0.5 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-emerald-400" />
                          Bank
                        </span>
                        <span className="font-bold text-white text-xs block truncate">
                          {verifiedRecipient.bank_name}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Amount in Rupees */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#A5AAA5] uppercase tracking-wider">
                    Amount (INR)
                  </label>
                  <span className="text-xs font-mono text-[#F5D78E] font-bold">
                    Available: ₹{(account?.balance_rupees ?? 0).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center font-black text-xl text-[#F5D78E] pointer-events-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={amountRupees}
                    onChange={(e) => {
                      setAmountRupees(e.target.value);
                      setRiskPreview(null);
                      setInterceptedThreat(null);
                    }}
                    placeholder="500.00"
                    className="w-full pl-10 pr-4 py-3.5 bg-[#080909] border border-[#D4AF37]/35 rounded-2xl text-lg font-mono font-black text-white placeholder-[#A5AAA5]/50 focus:outline-none focus:border-[#F5D78E] focus:shadow-glow-gold transition-all"
                    required
                  />
                </div>

                {/* Quick Selection Chips */}
                <div className="flex items-center gap-2 mt-2.5">
                  {[100, 500, 2000, 35000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setAmountRupees(amt.toString());
                        setRiskPreview(null);
                        setInterceptedThreat(null);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#080909] hover:bg-[#121414] border border-[#D4AF37]/30 text-xs font-mono font-bold text-[#A5AAA5] hover:text-[#F5D78E] transition-all"
                    >
                      ₹{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note / Purpose */}
              <div>
                <label className="block text-xs font-bold text-[#A5AAA5] mb-2 uppercase tracking-wider">
                  Transfer Note / Purpose (Optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Dinner bill, electricity bill urgent, or lucky draw claim"
                  className="w-full px-4 py-3 bg-[#080909] border border-[#D4AF37]/35 rounded-2xl text-xs text-white placeholder-[#A5AAA5]/50 focus:outline-none focus:border-[#F5D78E] transition-colors"
                />
              </div>

              {/* Step 4 Action Buttons */}
              <div className="space-y-3 pt-2">
                <PeachButton
                  type="submit"
                  fullWidth
                  isLoading={isEvaluatingRisk}
                  icon={<Send className="w-4 h-4" />}
                >
                  Pay Now (AI Security Check & Verify OTP)
                </PeachButton>

                <button
                  type="button"
                  onClick={handlePrecheckRisk}
                  disabled={isCheckingRisk}
                  className="w-full py-3 rounded-2xl border border-[#D4AF37]/40 text-xs font-bold text-[#F5D78E] hover:bg-[#D4AF37]/15 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span>
                    {isCheckingRisk ? 'Evaluating Random Forest & Gemini Matrix...' : 'Run Pre-Payment Risk Assessment'}
                  </span>
                </button>
              </div>
            </form>
          </GlassCard>

          {/* Quick Recipient Directory Chooser */}
          <GlassCard className="space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Test Simulation Directory
            </span>
            <div className="space-y-2">
              {suggestedRecipients.map((r) => {
                const isHighRisk = r.risk_level === 'HIGH';
                return (
                  <button
                    key={r.upi_id}
                    type="button"
                    onClick={() => selectRecipient(r)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      recipientUpi.toLowerCase() === r.upi_id.toLowerCase()
                        ? 'bg-[#121414] border-[#D4AF37] shadow-glow-gold'
                        : 'bg-[#080909] border-white/10 hover:border-[#D4AF37]/40'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">{r.name}</span>
                      <span className="text-[11px] font-mono text-[#A5AAA5] block">{r.upi_id}</span>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        isHighRisk
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {isHighRisk ? 'Flagged Scam' : 'Verified'}
                    </span>
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* Live Risk Telemetry Preview Panel */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Real-Time Risk Telemetry
              </span>
              <span className="text-[10px] text-[#F5D78E] font-bold uppercase tracking-wider">
                Random Forest & Gemini
              </span>
            </div>

            {riskPreview ? (
              <div className="space-y-5">
                <RiskGauge score={riskPreview.risk_score} size="lg" />

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-[#080909] border border-[#D4AF37]/30">
                    <span className="text-[10px] text-[#A5AAA5] uppercase block font-semibold">Random Forest Score</span>
                    <span className="text-sm font-black text-white font-mono">{riskPreview.rf_score ?? 15}/100</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#080909] border border-[#D4AF37]/30">
                    <span className="text-[10px] text-[#A5AAA5] uppercase block font-semibold">Gemini NLP Score</span>
                    <span className="text-sm font-black text-[#F5D78E] font-mono">{riskPreview.gemini_score ?? 10}/100</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#080909] border border-[#D4AF37]/25 space-y-2 text-xs">
                  <span className="font-bold text-[#A5AAA5] uppercase text-[10px] block tracking-wider">
                    Detected Threat Signals
                  </span>
                  {riskPreview.detection_signals.length > 0 ? (
                    <ul className="space-y-1.5">
                      {riskPreview.detection_signals.map((sig, i) => (
                        <li key={i} className="text-rose-300 text-xs flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                          <span>{sig}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-emerald-400 text-xs flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Zero anomalous signals detected. Normal spending pattern.</span>
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-[#121414] border border-[#D4AF37]/35 text-xs">
                  <span className="font-bold text-white block mb-1">Engine Decision Preview:</span>
                  <p className="text-[#A5AAA5] text-xs leading-relaxed">
                    {riskPreview.explanation}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-14 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#080909] border border-[#D4AF37]/35 flex items-center justify-center mx-auto text-[#F5D78E] shadow-glow-gold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <p className="text-xs text-[#A5AAA5] max-w-xs mx-auto">
                  Click "Run Pre-Payment Risk Assessment" or "Pay Now" to inspect the hybrid rule, Random Forest probability, and Gemini social engineering breakdown.
                </p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* THREAT INTERCEPTED MODAL (Blocks Final OTP Authorization) */}
      {interceptedThreat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#121414] border border-rose-500/60 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative overflow-hidden animate-scale-in">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-glow-gold">
                  <ShieldX className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block">
                    AI Defense Interception
                  </span>
                  <h3 className="text-lg font-black text-white">Payment Scam Intercepted</h3>
                </div>
              </div>
              <button
                onClick={() => setInterceptedThreat(null)}
                className="p-1 rounded-xl text-[#A5AAA5] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#080909] border border-rose-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Composite Threat Score:</span>
                <span className="font-mono text-base font-black text-rose-400">
                  {interceptedThreat.risk_score}/100 (HIGH RISK)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-white/5">
                <div>
                  <span className="text-[#A5AAA5] block">Random Forest ML:</span>
                  <span className="font-bold text-white font-mono">{interceptedThreat.rf_score ?? 85}/100</span>
                </div>
                <div>
                  <span className="text-[#A5AAA5] block">Gemini NLP Urgency:</span>
                  <span className="font-bold text-[#F5D78E] font-mono">{interceptedThreat.gemini_score ?? 90}/100</span>
                </div>
              </div>
            </div>

            {/* Signals */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#A5AAA5] uppercase tracking-wider block">
                Flagged Scam Vectors:
              </span>
              <ul className="space-y-1.5 text-xs text-rose-300">
                {interceptedThreat.detection_signals.map((sig, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>{sig}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Gemini Breakdown */}
            {interceptedThreat.gemini_analysis && (
              <div className="p-3.5 rounded-2xl bg-[#080909]/80 border border-[#D4AF37]/20 text-xs space-y-1">
                <span className="text-[10px] font-bold text-[#F5D78E] uppercase tracking-wider block">
                  Gemini AI Social Engineering Intelligence:
                </span>
                <p className="text-[#A5AAA5] leading-relaxed">
                  {interceptedThreat.gemini_analysis.explanation}
                </p>
              </div>
            )}

            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2.5 text-xs text-rose-300">
              <Lock className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Final OTP authorization locked. Zero funds were deducted from your wallet.</span>
            </div>

            <button
              onClick={() => setInterceptedThreat(null)}
              className="w-full py-3.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-white text-xs font-extrabold uppercase tracking-wider transition-all"
            >
              Acknowledge & Abort Transfer
            </button>
          </div>
        </div>
      )}

      {/* Step 5: FINAL TRANSACTION OTP AUTHORIZATION MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#121414] border border-[#D4AF37]/50 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-glow-gold relative overflow-hidden animate-scale-in">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#F5D78E]">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#F5D78E] uppercase tracking-widest block">
                    Zero-Trust Authorization
                  </span>
                  <h3 className="text-lg font-black text-white">Enter Transaction OTP</h3>
                </div>
              </div>
              <button
                onClick={() => setShowOtpModal(false)}
                className="p-1 rounded-xl text-[#A5AAA5] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Defense Clearance Badge */}
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>AI Clearance: Random Forest & Gemini verified safe (Risk: {clearedAnalysis?.risk_score ?? 12}/100).</span>
            </div>

            {/* Transfer Summary */}
            <div className="p-4 rounded-2xl bg-[#080909] border border-[#D4AF37]/25 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#A5AAA5]">Recipient:</span>
                <span className="font-bold text-white font-mono">
                  {verifiedRecipient?.name} ({verifiedRecipient?.upi_id})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#A5AAA5]">Bank:</span>
                <span className="font-medium text-[#F5D78E]">
                  {verifiedRecipient?.bank_name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#A5AAA5]">Amount:</span>
                <span className="font-mono font-black text-base text-[#F5D78E]">
                  ₹{parseFloat(amountRupees || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#A5AAA5] pt-1 border-t border-white/5">
                <span>Ledger Units:</span>
                <span className="font-mono">{(parseFloat(amountRupees || '0') * 100).toLocaleString()} Paise</span>
              </div>
            </div>

            {otpError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {otpError}
              </div>
            )}

            <form onSubmit={handleConfirmOtpPayment} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#A5AAA5] uppercase tracking-wider">
                    6-Digit Authorization OTP
                  </label>
                  <button
                    type="button"
                    onClick={() => setOtpValue('123456')}
                    className="text-[10px] text-[#D4AF37] hover:underline font-mono font-bold"
                  >
                    Use Demo OTP (123456)
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.5em] font-mono text-xl font-black py-3.5 bg-[#080909] border border-[#D4AF37]/40 rounded-2xl text-white focus:outline-none focus:border-[#F5D78E] focus:shadow-glow-gold"
                  autoFocus
                  required
                />
              </div>

              <PeachButton
                type="submit"
                fullWidth
                isLoading={isSubmitting}
                icon={<Lock className="w-4 h-4" />}
              >
                Confirm & Execute Transfer
              </PeachButton>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
