import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, KeyRound, ArrowRight, ArrowLeft, RotateCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import { PeachButton } from '../../components/common/PeachButton';

export const VerifyOTPPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const phone = searchParams.get('phone') || '+919876543210';
  const fullName = searchParams.get('name') || undefined;

  const [otp, setOtp] = useState('123456');
  const [countdown, setCountdown] = useState(45);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { verifyOTP, sendOTP } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp || otp.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOTP(phone, otp, fullName);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Incorrect or expired verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await sendOTP(phone);
      setCountdown(45);
      setError(null);
    } catch (err: any) {
      setError('Failed to resend code. Please wait.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#121414] flex items-center justify-center border border-[#D4AF37]/50 shadow-glow-gold mx-auto">
            <KeyRound className="w-8 h-8 text-[#F5D78E]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Verify Mobile Number
          </h2>
          <p className="text-xs sm:text-sm text-[#A5AAA5]">
            One-time secure verification code dispatched to{' '}
            <span className="font-mono text-[#F5D78E] font-bold">{phone}</span>
          </p>
        </div>

        <GlassCard className="space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/35 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Development helper banner */}
          <div className="p-3.5 rounded-2xl bg-[#080909] border border-[#D4AF37]/30 flex items-center justify-between text-xs">
            <span className="text-[#A5AAA5]">Simulated Demo OTP:</span>
            <button
              type="button"
              onClick={() => setOtp('123456')}
              className="font-mono font-bold text-[#F5D78E] bg-[#D4AF37]/20 px-3 py-1 rounded-xl border border-[#D4AF37]/40 hover:bg-[#D4AF37]/30 transition-all shadow-sm"
            >
              Autofill 123456
            </button>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-[#A5AAA5] mb-2 uppercase tracking-wider text-center">
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center tracking-[0.5em] font-mono text-2xl py-3.5 bg-[#080909] border border-[#D4AF37]/40 rounded-2xl text-[#F5D78E] placeholder-[#A5AAA5]/40 focus:outline-none focus:border-[#F5D78E] focus:shadow-glow-gold transition-all font-black"
                autoFocus
                required
              />
            </div>

            <PeachButton
              type="submit"
              fullWidth
              isLoading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Verify & Launch Vault
            </PeachButton>
          </form>

          <div className="flex items-center justify-between text-xs pt-2">
            <Link
              to="/login"
              className="text-[#A5AAA5] hover:text-white flex items-center gap-1.5 transition-colors font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Change Number
            </Link>

            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0}
              className={`flex items-center gap-1.5 font-semibold ${
                countdown > 0 ? 'text-[#A5AAA5]/50 cursor-not-allowed' : 'text-[#F5D78E] hover:underline'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend OTP'}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
