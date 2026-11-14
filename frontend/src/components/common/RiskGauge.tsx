import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

interface RiskGaugeProps {
  score: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
  showCategory?: boolean;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  size = 'md',
  showCategory = true,
}) => {
  const normalized = Math.max(0, Math.min(100, score));

  // Determine category & colors based on luxury gold aesthetic
  let category = 'LOW RISK';
  let color = '#F5D78E'; // champagne gold
  let bgGlow = 'rgba(245, 215, 142, 0.25)';
  let Icon = ShieldCheck;
  let statusText = 'Safe to Proceed';

  if (normalized >= 70) {
    category = 'CRITICAL / HIGH RISK';
    color = '#F43F5E'; // rose crimson
    bgGlow = 'rgba(244, 63, 94, 0.25)';
    Icon = ShieldAlert;
    statusText = 'Blocked for Safety';
  } else if (normalized >= 30) {
    category = 'MEDIUM RISK';
    color = '#FBBF24'; // amber gold
    bgGlow = 'rgba(251, 191, 36, 0.25)';
    Icon = AlertTriangle;
    statusText = 'Verification Needed';
  }

  // Dimensions
  const dim = size === 'sm' ? 88 : size === 'lg' ? 170 : 130;
  const strokeWidth = size === 'sm' ? 7 : size === 'lg' ? 12 : 9;
  const radius = (dim - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: dim, height: dim }}>
        {/* Glow backdrop */}
        <div
          className="absolute inset-0 rounded-full blur-xl transition-all duration-700"
          style={{ background: bgGlow }}
        />
        <svg width={dim} height={dim} className="rotate-[-90deg]">
          {/* Track */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            stroke="rgba(212, 175, 55, 0.2)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Value Arc */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-mono font-black leading-none drop-shadow-md ${
              size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-2xl'
            }`}
            style={{ color }}
          >
            {normalized}
          </span>
          <span className="text-[10px] text-[#A5AAA5] uppercase font-bold tracking-wider mt-1">
            / 100
          </span>
        </div>
      </div>

      {showCategory && (
        <div
          className="mt-3.5 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border border-white/10 shadow-lg"
          style={{ background: bgGlow, color }}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{category} • {statusText}</span>
        </div>
      )}
    </div>
  );
};
