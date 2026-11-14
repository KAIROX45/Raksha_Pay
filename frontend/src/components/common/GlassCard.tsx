import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glow = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`glass-card rounded-3xl p-6 sm:p-7 transition-all duration-300 ${
        glow
          ? 'border-[#D4AF37] shadow-glow-gold'
          : 'border-[#D4AF37]/25 hover:border-[#D4AF37]/60 hover:shadow-glow-gold'
      } ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
