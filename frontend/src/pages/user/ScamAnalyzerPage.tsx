import React, { useState } from 'react';
import {
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ArrowRight,
  ShieldCheck,
  FileText,
  Link2,
  MessageSquare,
  QrCode,
} from 'lucide-react';
import { GlassCard } from '../../components/common/GlassCard';
import { PeachButton } from '../../components/common/PeachButton';
import { RiskGauge } from '../../components/common/RiskGauge';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

interface ScamAnalysis {
  risk_assessment: 'HIGH_RISK' | 'SUSPICIOUS' | 'LIKELY_SAFE';
  risk_score: number;
  suspicious_phrases: string[];
  explanation: string;
  safety_recommendations: string[];
  model_used: string;
}

export const ScamAnalyzerPage: React.FC = () => {
  const { incrementThreatsIntercepted } = useAuth();
  const [activeTab, setActiveTab] = useState<'SMS' | 'UPI' | 'LINK'>('SMS');
  const [inputText, setInputText] = useState(
    'DEAR CUSTOMER, YOUR ELECTRICITY POWER WILL BE DISCONNECTED TONIGHT AT 9:30 PM FROM ELECTRICITY OFFICE BECAUSE YOUR PREVIOUS MONTH BILL WAS NOT UPDATED. PLEASE IMMEDIATELY CONTACT OUR OFFICER AT 9876543210 AND PAY VIA UPI OR DOWNLOAD QUICK SUPPORT APP TO AVOID DISCONNECTION.'
  );
  const [analysis, setAnalysis] = useState<ScamAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sampleScams = [
    {
      type: 'SMS',
      title: 'Electricity Disconnection Threat',
      text: 'DEAR CUSTOMER, YOUR ELECTRICITY POWER WILL BE DISCONNECTED TONIGHT AT 9:30 PM FROM ELECTRICITY OFFICE BECAUSE YOUR PREVIOUS MONTH BILL WAS NOT UPDATED. PLEASE IMMEDIATELY CONTACT OUR OFFICER AT 9876543210 AND PAY VIA UPI OR DOWNLOAD QUICK SUPPORT APP TO AVOID DISCONNECTION.',
    },
    {
      type: 'UPI',
      title: 'Festival Lucky Draw "Enter PIN to Receive"',
      text: 'CONGRATULATIONS! Your mobile number won 1st prize ₹25,000 in Festival Lucky Draw. To receive instant money in your bank account, accept this collect request and enter your 6-digit UPI PIN.',
    },
    {
      type: 'LINK',
      title: 'Urgent KYC Block & APK Download Link',
      text: 'URGENT: Your Bank Account has been BLOCKED due to expired PAN KYC. Install AnyDesk or TeamViewer APK immediately from http://bank-kyc-verify-portal.in to unfreeze your balance.',
    },
    {
      type: 'SMS',
      title: 'Legitimate Payment Receipt',
      text: 'Paid Rs. 450.00 to Artisan Coffee House on 14 Nov 2026. UPI Ref 329048192019. Your account balance is updated.',
    },
  ];

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post<ScamAnalysis>('/ai/analyze-scam', {
        message_text: inputText.trim(),
      });
      setAnalysis(res.data);
      if (res.data.risk_assessment === 'HIGH_RISK' || res.data.risk_score >= 70) {
        incrementThreatsIntercepted();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-5 h-5 text-[#D4AF37]" />
          <span className="text-xs font-bold uppercase tracking-widest text-[#F5D78E]">
            Google Gemini Multi-Modal Engine
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          AI Scam Detection & Prevention
        </h1>
        <p className="text-xs sm:text-sm text-[#A5AAA5]">
          Analyze suspicious SMS messages, UPI payment collect requests, and phishing links before interacting with them.
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex items-center gap-2 bg-[#121414] p-1.5 rounded-2xl border border-[#D4AF37]/30 max-w-md">
        <button
          type="button"
          onClick={() => {
            setActiveTab('SMS');
            setInputText(sampleScams[0].text);
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'SMS'
              ? 'gold-button shadow-glow-gold'
              : 'text-[#A5AAA5] hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          SMS Alert
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('UPI');
            setInputText(sampleScams[1].text);
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'UPI'
              ? 'gold-button shadow-glow-gold'
              : 'text-[#A5AAA5] hover:text-white'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          UPI Request
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('LINK');
            setInputText(sampleScams[2].text);
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'LINK'
              ? 'gold-button shadow-glow-gold'
              : 'text-[#A5AAA5] hover:text-white'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          Link / URL
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Panel */}
        <div className="lg:col-span-7 space-y-6">
          <GlassCard className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleAnalyze} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#A5AAA5] mb-2 uppercase tracking-wider">
                  Suspicious Message or URL Payload
                </label>
                <textarea
                  rows={6}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste SMS text, collect request note, or URL here..."
                  className="w-full p-4 bg-[#080909] border border-[#D4AF37]/35 rounded-2xl text-xs text-white placeholder-[#A5AAA5]/50 focus:outline-none focus:border-[#F5D78E] focus:shadow-glow-gold font-mono leading-relaxed"
                  required
                />
              </div>

              <PeachButton
                type="submit"
                fullWidth
                isLoading={isLoading}
                icon={<Sparkles className="w-4 h-4" />}
              >
                Scan with Google Gemini AI
              </PeachButton>
            </form>
          </GlassCard>

          {/* Preset Sample Threats */}
          <GlassCard className="space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Quick Test Threat Scenarios
            </span>
            <div className="space-y-2">
              {sampleScams.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputText(s.text);
                    setActiveTab(s.type as any);
                  }}
                  className="w-full p-3.5 rounded-2xl bg-[#080909] hover:bg-white/5 border border-[#D4AF37]/25 text-left transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#D4AF37]/20 text-[#F5D78E] font-bold">
                      {s.type}
                    </span>
                    <span className="text-xs font-bold text-white group-hover:text-[#F5D78E] transition-colors">
                      {s.title}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#D4AF37] font-semibold underline group-hover:text-[#F5D78E]">
                    Load
                  </span>
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Threat Verdict
              </span>
              {analysis && (
                <span className="text-[10px] text-[#F5D78E] font-mono font-bold">
                  {analysis.model_used}
                </span>
              )}
            </div>

            {analysis ? (
              <div className="space-y-5">
                <RiskGauge score={analysis.risk_score} size="lg" />

                {/* Phishing Signals Detected */}
                {analysis.suspicious_phrases.length > 0 && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                    <span className="text-xs font-bold text-rose-300 block">
                      Detected Phishing Triggers:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.suspicious_phrases.map((phrase, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-200 text-[11px] font-mono font-semibold"
                        >
                          {phrase}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Explanation */}
                <div className="p-4 rounded-2xl bg-[#080909] border border-[#D4AF37]/30 text-xs space-y-2 shadow-inner">
                  <span className="font-bold text-[#F5D78E] block uppercase tracking-wider text-[11px]">
                    Gemini Risk Assessment:
                  </span>
                  <p className="text-[#A5AAA5] text-xs leading-relaxed">
                    {analysis.explanation}
                  </p>
                </div>

                {/* Safety Recommendations */}
                <div className="p-4 rounded-2xl bg-[#121414] border border-[#D4AF37]/40 text-xs space-y-2.5">
                  <span className="font-bold text-emerald-400 block uppercase tracking-wider text-[11px]">
                    Protective Recommendations:
                  </span>
                  <ul className="space-y-2">
                    {analysis.safety_recommendations.map((rec, i) => (
                      <li key={i} className="text-[#A5AAA5] text-xs flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#080909] border border-[#D4AF37]/35 flex items-center justify-center mx-auto text-[#F5D78E] shadow-glow-gold">
                  <Sparkles className="w-7 h-7" />
                </div>
                <p className="text-xs text-[#A5AAA5] max-w-xs mx-auto">
                  Paste suspicious text or select one of the test threat scenarios to see Gemini's live evaluation.
                </p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
