import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { SimulationBanner } from '../components/common/SimulationBanner';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { useAuth } from '../contexts/AuthContext';

export const UserLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080909] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#A5AAA5] font-semibold">Loading secure vault session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#080909] text-white pb-16 lg:pb-0">
      <SimulationBanner />
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <MobileBottomNav />
      <Footer />
    </div>
  );
};
