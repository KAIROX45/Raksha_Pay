import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface User {
  id: string;
  phone: string;
  full_name: string;
  email?: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  is_demo: boolean;
  created_at?: string;
}

export interface Account {
  id: string;
  user_id: string;
  upi_id: string;
  account_number: string;
  ifsc_code: string;
  balance_paise: number;
  balance_rupees: number;
  currency: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  account: Account | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  threatsInterceptedCount: number;
  incrementThreatsIntercepted: () => void;
  sendOTP: (phone: string) => Promise<{ success: boolean; message: string; is_development_fallback?: boolean; dev_otp?: string }>;
  verifyOTP: (phone: string, otp: string, fullName?: string) => Promise<void>;
  adminLogin: (phone: string, password: string) => Promise<void>;
  refreshAccount: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('rakshapay_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [threatsInterceptedCount, setThreatsInterceptedCount] = useState<number>(() => {
    const saved = localStorage.getItem('rakshapay_threats_count');
    return saved ? parseInt(saved, 10) : 0;
  });

  const incrementThreatsIntercepted = () => {
    setThreatsInterceptedCount((prev) => {
      const next = prev + 1;
      localStorage.setItem('rakshapay_threats_count', next.toString());
      return next;
    });
  };

  const fetchProfileAndAccount = async () => {
    try {
      const [userRes, accRes] = await Promise.all([
        api.get<User>('/auth/me'),
        api.get<Account>('/accounts/me').catch(() => null),
      ]);
      setUser(userRes.data);
      if (accRes && accRes.data) {
        setAccount(accRes.data);
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfileAndAccount();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const refreshAccount = async () => {
    try {
      const accRes = await api.get<Account>('/accounts/me');
      setAccount(accRes.data);
    } catch (err) {
      console.error('Failed to refresh balance:', err);
    }
  };

  const sendOTP = async (phone: string) => {
    const res = await api.post('/auth/send-otp', { phone });
    return res.data;
  };

  const verifyOTP = async (phone: string, otp: string, fullName?: string) => {
    const res = await api.post('/auth/verify-otp', {
      phone,
      otp,
      full_name: fullName,
    });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('rakshapay_token', access_token);
    setToken(access_token);
    setUser(userData);
    await fetchProfileAndAccount();
  };

  const adminLogin = async (phone: string, password: string) => {
    const res = await api.post('/auth/admin/login', {
      phone,
      password,
    });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('rakshapay_token', access_token);
    setToken(access_token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('rakshapay_token');
    setToken(null);
    setUser(null);
    setAccount(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        account,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isLoading,
        threatsInterceptedCount,
        incrementThreatsIntercepted,
        sendOTP,
        verifyOTP,
        adminLogin,
        refreshAccount,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
