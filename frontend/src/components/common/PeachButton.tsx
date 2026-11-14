import React from 'react';

interface PeachButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const PeachButton: React.FC<PeachButtonProps> = ({
  children,
  isLoading = false,
  variant = 'primary',
  fullWidth = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-bold rounded-2xl px-6 py-3.5 text-sm transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:transform-none cursor-pointer';

  const variants = {
    primary: 'gold-button shadow-glow-gold',
    secondary:
      'bg-[#121414] hover:bg-[#1a1d1d] text-[#F5D78E] border border-[#D4AF37]/40 shadow-glow-gold hover:border-[#D4AF37]',
    outline:
      'border border-[#D4AF37]/50 text-[#F5D78E] hover:bg-[#D4AF37]/15 hover:border-[#F5D78E]',
    danger:
      'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/40',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          Analyzing...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          {icon}
          {children}
        </span>
      )}
    </button>
  );
};

export const GoldButton = PeachButton;
