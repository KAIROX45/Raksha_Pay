import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Phone, ArrowRight, Info, Shield, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import { PeachButton } from '../../components/common/PeachButton';

export const LoginPage: React.FC = () => {
  const [phone, setPhone] = useState('+919876543210');
  const [fullName, setFullName] = useState('Rohit Sharma');
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { sendOTP } = useAuth();
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone || phone.length < 10) {
      setError('Please enter a valid mobile number with country code (e.g. +919876543210)');
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendOTP(phone);
      navigate(
        `/verify-otp?phone=${encodeURIComponent(phone)}${
          isNewUser ? `&name=${encodeURIComponent(fullName)}` : ''
        }`
      );
    } catch (err: any) {
      const serverMsg = err.response?.data?.detail;
      setError(
        serverMsg || err.message || 'Failed to dispatch verification OTP. Please check your network and mobile number.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoCustomer = () => {
    setPhone('+919876543210');
    setFullName('Rohit Sharma');
    setIsNewUser(false);
  };

  const setDemoPeer = () => {
    setPhone('+919876543211');
    setFullName('Aman Gupta');
    setIsNewUser(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#121414] flex items-center justify-center border border-[#D4AF37]/50 shadow-glow-gold mx-auto">
            <ShieldCheck className="w-8 h-8 text-[#F5D78E]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Sign in to Raksha<span className="text-gold-gradient">Pay</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#A5AAA5]">
            Enter your mobile number to access the 3D payment security demo platform.
          </p>
        </div>

        {/* Form Card */}
        <GlassCard className="space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/35 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSendOTP} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#A5AAA5] mb-2 uppercase tracking-wider">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#A5AAA5]">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full pl-11 pr-4 py-3.5 bg-[#080909] border border-[#D4AF37]/35 rounded-2xl text-sm font-mono text-white placeholder-[#A5AAA5]/50 focus:outline-none focus:border-[#F5D78E] focus:shadow-glow-gold transition-all"
                  required
                />
              </div>
            </div>

            {isNewUser && (
              <div>
                <label className="block text-xs font-bold text-[#A5AAA5] mb-2 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rohit Sharma"
                  className="w-full px-4 py-3.5 bg-[#080909] border border-[#D4AF37]/35 rounded-2xl text-sm text-white placeholder-[#A5AAA5]/50 focus:outline-none focus:border-[#F5D78E] focus:shadow-glow-gold transition-all"
                  required
                />
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setIsNewUser(!isNewUser)}
                className="text-[#F5D78E] hover:underline font-semibold"
              >
                {isNewUser ? 'Already registered? Sign in' : 'First time? Register new account'}
              </button>
            </div>

            <PeachButton
              type="submit"
              fullWidth
              isLoading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Send Verification OTP
            </PeachButton>
          </form>

          {/* Quick Demo Pre-sets */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <span className="text-[11px] font-bold text-[#A5AAA5] uppercase tracking-wider block">
              Quick Demo Accounts (Demo OTP: 123456)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={setDemoCustomer}
                className="p-3 rounded-2xl bg-[#080909] hover:bg-[#1a1d1d] border border-[#D4AF37]/30 text-left transition-all shadow-sm"
              >
                <span className="text-xs font-bold text-white block">Rohit Sharma</span>
                <span className="text-[10px] text-[#F5D78E] font-mono block font-bold">
                  ₹50,000 Wallet
                </span>
              </button>
              <button
                type="button"
                onClick={setDemoPeer}
                className="p-3 rounded-2xl bg-[#080909] hover:bg-[#1a1d1d] border border-[#D4AF37]/30 text-left transition-all shadow-sm"
              >
                <span className="text-xs font-bold text-white block">Aman Gupta</span>
                <span className="text-[10px] text-[#F5D78E] font-mono block font-bold">
                  ₹25,000 Wallet
                </span>
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Footer Admin Link */}
        <div className="text-center">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-2 text-xs text-[#A5AAA5] hover:text-[#F5D78E] transition-colors"
          >
            <Shield className="w-4 h-4 text-[#D4AF37]" />
            <span>Are you a fraud investigator? Access SOC Admin Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
