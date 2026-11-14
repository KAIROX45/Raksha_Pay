import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Send, ShieldCheck, QrCode, History, Bot } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const navItems = [
    { to: '/app/dashboard', label: 'Dashboard', icon: Home },
    { to: '/app/send-money', label: 'Send', icon: Send },
    { to: '/app/recipient-check', label: 'Verify', icon: ShieldCheck },
    { to: '/app/qr-scanner', label: 'QR Scan', icon: QrCode },
    { to: '/app/assistant', label: 'AI Bot', icon: Bot },
    { to: '/app/transactions', label: 'History', icon: History },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080909]/95 backdrop-blur-xl border-t border-[#D4AF37]/25 px-2 py-2">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-[#F5D78E] font-bold drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]'
                    : 'text-[#A5AAA5] hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
