import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Phone, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import { PeachButton } from '../../components/common/PeachButton';

export const AdminLoginPage: React.FC = () => {
  const [phone, setPhone] = useState('+919999900000');
  const [password, setPassword] = useState('Admin@Raksha2026');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await adminLogin(phone, password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid administrative credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setPhone('+919999900000');
    setPassword('Admin@Raksha2026');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#121414] flex items-center justify-center border border-[#D4AF37]/50 mx-auto shadow-glow-gold">
            <ShieldAlert className="w-8 h-8 text-[#F5D78E]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            SOC Operations Center
          </h2>
          <p className="text-xs sm:text-sm text-[#A5AAA5]">
            Restricted administrative portal for fraud analysts & security operations.
          </p>
        </div>

        <GlassCard className="border border-[#D4AF37]/35 space-y-6 shadow-glow-gold">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/35 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Demo Admin Helper */}
          <div className="p-3.5 rounded-2xl bg-[#080909] border border-[#D4AF37]/30 flex items-center justify-between text-xs">
            <span className="text-[#A5AAA5]">Demo SOC Admin:</span>
            <button
              type="button"
              onClick={handleFillDemoAdmin}
              className="text-[#F5D78E] font-mono font-bold underline hover:text-white"
            >
              Autofill Credentials
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#A5AAA5] mb-2 uppercase tracking-wider">
                Admin Mobile Identifier
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#A5AAA5]">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919999900000"
                  className="w-full pl-11 pr-4 py-3.5 bg-[#080909] border border-[#D4AF37]/35 rounded-2xl text-sm font-mono text-white placeholder-[#A5AAA5]/50 focus:outline-none focus:border-[#F5D78E] focus:shadow-glow-gold transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A5AAA5] mb-2 uppercase tracking-wider">
                Administrator Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#A5AAA5]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-11 pr-4 py-3.5 bg-[#080909] border border-[#D4AF37]/35 rounded-2xl text-sm text-white placeholder-[#A5AAA5]/50 focus:outline-none focus:border-[#F5D78E] focus:shadow-glow-gold transition-all"
                  required
                />
              </div>
            </div>

            <PeachButton
              type="submit"
              fullWidth
              isLoading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Authenticate & Enter SOC
            </PeachButton>
          </form>

          <div className="pt-2 text-center">
            <Link
              to="/login"
              className="text-xs text-[#A5AAA5] hover:text-[#F5D78E] flex items-center justify-center gap-1.5 transition-colors font-semibold"
            >
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>Back to Customer Wallet Login</span>
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
