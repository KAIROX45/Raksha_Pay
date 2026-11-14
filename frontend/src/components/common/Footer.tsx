import React from 'react';
import { ShieldCheck, Lock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#080909] border-t border-[#D4AF37]/20 pt-14 pb-16 text-[#A5AAA5] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Column 1: Brand */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#121414] border border-[#D4AF37]/40 flex items-center justify-center shadow-glow-gold">
                <ShieldCheck className="w-5 h-5 text-[#F5D78E]" />
              </div>
              <span className="font-extrabold text-lg text-white">
                Raksha<span className="text-gold-gradient font-black">Pay</span>
              </span>
            </div>
            <p className="text-[#A5AAA5] max-w-sm leading-relaxed">
              AI-Powered Smart Payment Security & Fraud Prevention Platform.
              Combining machine learning, multi-orbital fraud defense, and Google Gemini AI
              to detect fraud, stop social engineering, and protect simulated digital payment transactions.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-[#F5D78E] font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>Simulated UPI Protocol • Double-Entry ACID Ledger</span>
            </div>
          </div>

          {/* Column 2: Platform Links */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-widest text-[11px] mb-3">
              Platform Features
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/app/send-money" className="hover:text-[#F5D78E] transition-colors">
                  Simulated Payment Transfer
                </Link>
              </li>
              <li>
                <Link to="/app/recipient-check" className="hover:text-[#F5D78E] transition-colors">
                  Recipient Risk Verification
                </Link>
              </li>
              <li>
                <Link to="/app/scam-analyzer" className="hover:text-[#F5D78E] transition-colors">
                  Gemini Scam Message Analyzer
                </Link>
              </li>
              <li>
                <Link to="/app/assistant" className="hover:text-[#F5D78E] transition-colors">
                  AI Security Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Administration & Governance */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-widest text-[11px] mb-3">
              Governance & SOC
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/admin/login" className="hover:text-[#F5D78E] transition-colors flex items-center gap-1">
                  SOC Admin Portal
                  <ExternalLink className="w-3 h-3 text-[#D4AF37]" />
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-[#F5D78E] transition-colors">
                  Zero-Trust Architecture
                </a>
              </li>
              <li>
                <span className="text-[#A5AAA5]/60">3D Luxury Black & Gold Release</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px]">
          <p className="text-[#A5AAA5]/60 text-center md:text-left">
            IMPORTANT DISCLAIMER: RakshaPay is a financial technology research & cybersecurity demonstration simulation.
            It does NOT process real Indian Rupee currency or connect to actual NPCI / bank UPI networks.
            All balances, ledger entries, and accounts are synthetic for safety education.
          </p>
          <div className="text-[#A5AAA5]/80 whitespace-nowrap font-medium">
            © {new Date().getFullYear()} RakshaPay. Pay Smart. Stay Protected.
          </div>
        </div>
      </div>
    </footer>
  );
};
