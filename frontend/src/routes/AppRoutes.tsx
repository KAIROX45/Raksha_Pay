import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from '../layouts/PublicLayout';
import { UserLayout } from '../layouts/UserLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Public Pages
import { LandingPage } from '../pages/public/LandingPage';
import { LoginPage } from '../pages/public/LoginPage';
import { VerifyOTPPage } from '../pages/public/VerifyOTPPage';
import { AdminLoginPage } from '../pages/public/AdminLoginPage';

// User Pages
import { DashboardPage } from '../pages/user/DashboardPage';
import { SendMoneyPage } from '../pages/user/SendMoneyPage';
import { PaymentResultPage } from '../pages/user/PaymentResultPage';
import { ReceiveMoneyPage } from '../pages/user/ReceiveMoneyPage';
import { TransactionHistoryPage } from '../pages/user/TransactionHistoryPage';
import { RecipientCheckPage } from '../pages/user/RecipientCheckPage';
import { QRScannerPage } from '../pages/user/QRScannerPage';
import { ScamAnalyzerPage } from '../pages/user/ScamAnalyzerPage';
import { AIAssistantPage } from '../pages/user/AIAssistantPage';
import { ProfilePage } from '../pages/user/ProfilePage';

// Admin Pages
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminTransactionsPage } from '../pages/admin/AdminTransactionsPage';
import { AdminFraudPage } from '../pages/admin/AdminFraudPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminAuditLogsPage } from '../pages/admin/AdminAuditLogsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-otp" element={<VerifyOTPPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
      </Route>

      {/* Authenticated User Portal */}
      <Route path="/app" element={<UserLayout />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="send-money" element={<SendMoneyPage />} />
        <Route path="payment-result/:ref" element={<PaymentResultPage />} />
        <Route path="receive-money" element={<ReceiveMoneyPage />} />
        <Route path="transactions" element={<TransactionHistoryPage />} />
        <Route path="recipient-check" element={<RecipientCheckPage />} />
        <Route path="qr-scanner" element={<QRScannerPage />} />
        <Route path="scam-analyzer" element={<ScamAnalyzerPage />} />
        <Route path="assistant" element={<AIAssistantPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route index element={<Navigate to="/app/dashboard" replace />} />
      </Route>

      {/* Authenticated Admin Portal */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="transactions" element={<AdminTransactionsPage />} />
        <Route path="fraud" element={<AdminFraudPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
