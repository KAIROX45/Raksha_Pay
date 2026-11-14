import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Zap,
  Cpu,
  Sparkles,
  ArrowRight,
  Lock,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  FileCheck,
  ChevronRight,
  Shield,
  Layers,
  Activity,
  Bot,
} from 'lucide-react';
import { ThreeHeroVisual } from '../../components/common/ThreeHeroVisual';
import { GlassCard } from '../../components/common/GlassCard';
import { PeachButton } from '../../components/common/PeachButton';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-24 py-6 md:py-12 overflow-hidden">
      {/* 1. ADVANCED 3D HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Content with Framer Motion */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="lg:col-span-7 space-y-6 text-center lg:text-left z-10"
          >
            {/* Luxury Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#121414] border border-[#D4AF37]/40 text-xs font-bold text-[#F5D78E] shadow-glow-gold">
              <Sparkles className="w-4 h-4 text-[#D4AF37] animate-pulse" />
              <span>3D AI-Powered UPI Payment Security Platform</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
              The Next Evolution of{' '}
              <span className="text-gold-gradient text-glow-gold">
                Smart Payment Security
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-[#A5AAA5] max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              RakshaPay combines real-time Scikit-Learn machine learning, multi-orbital fraud defense,
              and Google Gemini AI to analyze simulated payment transactions, verify recipients,
              and intercept scams before funds leave your wallet.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link to="/login">
                <PeachButton icon={<ArrowRight className="w-4 h-4" />}>
                  Launch Demo Wallet
                </PeachButton>
              </Link>
              <a href="#how-it-works">
                <button className="px-6 py-3.5 rounded-2xl bg-[#121414] border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:shadow-glow-gold text-[#F5D78E] text-sm font-bold transition-all">
                  Explore Architecture
                </button>
              </a>
            </div>

            {/* Quick Live Telemetry Indicators */}
            <div className="pt-6 border-t border-[#D4AF37]/20 grid grid-cols-3 gap-4 text-center lg:text-left">
              <div className="bg-[#121414]/60 p-3 rounded-2xl border border-[#D4AF37]/15">
                <span className="font-mono text-xl sm:text-2xl font-black text-[#F5D78E] block">
                  &lt; 50ms
                </span>
                <span className="text-[11px] text-[#A5AAA5] font-medium">Hybrid AI Evaluation</span>
              </div>
              <div className="bg-[#121414]/60 p-3 rounded-2xl border border-[#D4AF37]/15">
                <span className="font-mono text-xl sm:text-2xl font-black text-[#D4AF37] block">
                  100% ACID
                </span>
                <span className="text-[11px] text-[#A5AAA5] font-medium">Double-Entry Ledger</span>
              </div>
              <div className="bg-[#121414]/60 p-3 rounded-2xl border border-[#D4AF37]/15">
                <span className="font-mono text-xl sm:text-2xl font-black text-[#FFFFFF] block">
                  Gemini AI
                </span>
                <span className="text-[11px] text-[#A5AAA5] font-medium">Scam Explanations</span>
              </div>
            </div>
          </motion.div>

          {/* Right 3D Interactive Hero Sphere */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="lg:col-span-5 flex items-center justify-center relative"
          >
            <div className="w-full relative">
              {/* Golden Ambient Blur Glow */}
              <div className="absolute inset-0 bg-[#D4AF37]/15 blur-3xl rounded-full pointer-events-none" />
              <ThreeHeroVisual />
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. HOW RAKSHAPAY WORKS (ZERO-TRUST PIPELINE) */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
            Intelligent Defense Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Zero-Trust Payment Lifecycle
          </h2>
          <p className="text-[#A5AAA5] text-sm sm:text-base">
            Every transaction is scrutinized through a defense-in-depth pipeline before a single
            simulated rupee is committed to the ledger.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="space-y-4 relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-[#080909] border border-[#D4AF37]/40 flex items-center justify-center text-[#F5D78E] font-extrabold font-mono text-lg shadow-glow-gold group-hover:scale-105 transition-transform">
              01
            </div>
            <h3 className="text-base font-extrabold text-white">Idempotency & Check</h3>
            <p className="text-xs text-[#A5AAA5] leading-relaxed">
              Prevents duplicate submissions, validates active sender and simulated recipient existence,
              and verifies balance in integer paise.
            </p>
          </GlassCard>

          <GlassCard className="space-y-4 relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-[#080909] border border-[#D4AF37]/40 flex items-center justify-center text-[#F5D78E] font-extrabold font-mono text-lg shadow-glow-gold group-hover:scale-105 transition-transform">
              02
            </div>
            <h3 className="text-base font-extrabold text-white">Hybrid Fraud Engine</h3>
            <p className="text-xs text-[#A5AAA5] leading-relaxed">
              Extracts 8 telemetry features, evaluates 7 rule algorithms, and runs Scikit-Learn
              Random Forest probability inference.
            </p>
          </GlassCard>

          <GlassCard className="space-y-4 relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-[#080909] border border-[#D4AF37]/40 flex items-center justify-center text-[#F5D78E] font-extrabold font-mono text-lg shadow-glow-gold group-hover:scale-105 transition-transform">
              03
            </div>
            <h3 className="text-base font-extrabold text-white">Threshold Gate</h3>
            <p className="text-xs text-[#A5AAA5] leading-relaxed">
              Deterministic 3-tier boundary: Low Risk (&lt;30, Approved), Medium (30-69, Verification Held),
              High Risk (&ge;70, Auto-Blocked).
            </p>
          </GlassCard>

          <GlassCard className="space-y-4 relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-[#080909] border border-[#D4AF37]/40 flex items-center justify-center text-[#F5D78E] font-extrabold font-mono text-lg shadow-glow-gold group-hover:scale-105 transition-transform">
              04
            </div>
            <h3 className="text-base font-extrabold text-white">Double-Entry Settle</h3>
            <p className="text-xs text-[#A5AAA5] leading-relaxed">
              Approved funds trigger atomic debits and credits in the double-entry database ledger.
              Blocked transactions move zero funds.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* 3. CORE INNOVATION: FRAUD DETECTION & GEMINI */}
      <section id="fraud-ai" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#121414] rounded-3xl p-8 sm:p-12 border border-[#D4AF37]/35 relative overflow-hidden shadow-2xl">
          {/* Subtle gold radial background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 blur-3xl pointer-events-none rounded-full" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-xs font-bold text-[#F5D78E]">
                <Cpu className="w-4 h-4 text-[#D4AF37]" />
                <span>Multi-Layered Intelligence</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                Deterministic Security Meets Generative AI
              </h2>
              <p className="text-sm text-[#A5AAA5] leading-relaxed">
                Traditional banking rules miss nuanced social engineering, while pure LLMs hallucinate.
                RakshaPay uses a bulletproof three-tier separation of concerns:
              </p>
              <ul className="space-y-4 text-xs sm:text-sm text-white">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#F5D78E] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#F5D78E]">Rule-Based Engine:</strong> Enforces velocity ceilings,
                    impersonation penalties, and recipient blacklist integrity.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#F5D78E] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#F5D78E]">Scikit-Learn Classifier:</strong> Computes continuous
                    behavioral anomaly probability across historical spending patterns.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#F5D78E] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#F5D78E]">Google Gemini API:</strong> Translates raw telemetry into
                    plain-English risk breakdowns and scans untrusted texts for phishing.
                  </span>
                </li>
              </ul>
            </div>

            {/* Interactive Threat Interception Preview */}
            <div className="bg-[#080909] rounded-3xl p-6 sm:p-7 border border-[#D4AF37]/35 space-y-4 shadow-glow-gold">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#F5D78E] animate-pulse" />
                  <span className="text-xs font-bold text-[#A5AAA5] uppercase tracking-wider">
                    Live Threat Interception
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/40 text-[11px] font-black">
                  BLOCKED (Risk: 88/100)
                </span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#A5AAA5]">Simulated Recipient</span>
                  <span className="font-mono text-white font-bold">techsupport@fakeupi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A5AAA5]">Transfer Amount</span>
                  <span className="font-mono text-[#F5D78E] font-black text-sm">₹35,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A5AAA5]">Primary Signals</span>
                  <span className="text-rose-300 font-semibold text-right">Blacklisted Scam • High Velocity</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#121414] border border-[#D4AF37]/30 text-xs space-y-2">
                <div className="flex items-center gap-2 text-[#F5D78E] font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span>Gemini Security Advice:</span>
                </div>
                <p className="text-[#A5AAA5] text-xs leading-relaxed">
                  "This recipient was flagged in multiple remote screen-sharing fraud reports.
                  Do NOT share any PIN. RakshaPay automatically prevented funds from leaving your simulated wallet."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. KEY FEATURES GRID */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
          <h2 className="text-3xl font-black text-white">
            Engineered for Complete Protection
          </h2>
          <p className="text-[#A5AAA5] text-sm">
            Everything you need to simulate, inspect, and prevent digital payments fraud.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#080909] border border-[#D4AF37]/40 flex items-center justify-center text-[#F5D78E] shadow-glow-gold">
              <Search className="w-6 h-6 text-[#F5D78E]" />
            </div>
            <h3 className="text-lg font-bold text-white">Recipient Verification</h3>
            <p className="text-xs text-[#A5AAA5] leading-relaxed">
              Inspect any UPI handle's reputation, simulated account age, and active community
              flags before initiating any transaction.
            </p>
          </GlassCard>

          <GlassCard className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#080909] border border-[#D4AF37]/40 flex items-center justify-center text-[#F5D78E] shadow-glow-gold">
              <Sparkles className="w-6 h-6 text-[#F5D78E]" />
            </div>
            <h3 className="text-lg font-bold text-white">Scam Message Analyzer</h3>
            <p className="text-xs text-[#A5AAA5] leading-relaxed">
              Paste suspicious SMS texts, lottery notices, or APK download links. Gemini AI detects
              phishing keywords and impersonation attempts instantly.
            </p>
          </GlassCard>

          <GlassCard className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#080909] border border-[#D4AF37]/40 flex items-center justify-center text-[#F5D78E] shadow-glow-gold">
              <Bot className="w-6 h-6 text-[#F5D78E]" />
            </div>
            <h3 className="text-lg font-bold text-white">AI Financial Assistant</h3>
            <p className="text-xs text-[#A5AAA5] leading-relaxed">
              Get 24/7 conversational cybersecurity guidance, explain complex fraud alerts,
              and receive step-by-step UPI safety recommendations.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* 5. CTA SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#121414] via-[#1a1c1a] to-[#121414] rounded-3xl p-8 sm:p-14 border border-[#D4AF37]/40 text-center space-y-6 shadow-glow-gold relative overflow-hidden">
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Experience Next-Gen Payment Security
          </h2>
          <p className="text-[#A5AAA5] max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Log in to the pre-funded customer demo wallet with ₹50,000 simulated balance
            or access the SOC Security Operations Center for fraud analysts.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/login">
              <PeachButton icon={<ArrowRight className="w-4 h-4" />}>
                Launch User Portal
              </PeachButton>
            </Link>
            <Link to="/admin/login">
              <button className="px-6 py-3.5 rounded-2xl bg-[#080909] border border-[#D4AF37]/50 text-[#F5D78E] hover:bg-[#D4AF37]/15 text-sm font-bold transition-all shadow-glow-gold">
                Enter SOC Admin Portal
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
