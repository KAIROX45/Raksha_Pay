import React from 'react';
import { Info, ShieldAlert } from 'lucide-react';

export const SimulationBanner: React.FC = () => {
  return (
    <div className="bg-[#121414]/90 border-b border-[#D4AF37]/20 text-[#A5AAA5] text-xs py-2 px-4 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse" />
          <span className="font-extrabold text-[#F5D78E] uppercase tracking-wider text-[11px]">
            Simulated Sandbox Mode
          </span>
          <span className="hidden sm:inline text-[#A5AAA5]/40">|</span>
          <span className="hidden sm:inline text-[#A5AAA5]">
            All UPI transactions and balances are safely simulated for AI defense demonstration.
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#F5D78E] font-bold">
          <Info className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Demo OTP: 123456</span>
        </div>
      </div>
    </div>
  );
};
