import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../lib/api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username_or_email: string, password: string) => Promise<void>;
  logout: () => void;
  quickSwitchDemoUser: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const profile = await authApi.getCurrentUser();
          setUser(profile);
          localStorage.setItem('user', JSON.stringify(profile));
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username_or_email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login({ username_or_email, password });
      setToken(res.access_token);
      setUser(res.user);
      localStorage.setItem('token', res.access_token);
      localStorage.setItem('user', JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const quickSwitchDemoUser = async (targetRole: UserRole) => {
    const creds: Record<UserRole, { u: string; p: string }> = {
      SUPER_ADMIN: { u: 'admin', p: 'admin123' },
      WARDEN: { u: 'warden', p: 'warden123' },
      ACCOUNTANT: { u: 'accountant', p: 'accountant123' },
      SECURITY: { u: 'security', p: 'security123' },
      MAINTENANCE: { u: 'maintenance', p: 'tech123' },
      STUDENT: { u: 'aarav', p: 'student123' },
    };
    const cred = creds[targetRole];
    if (cred) {
      await login(cred.u, cred.p);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        quickSwitchDemoUser
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
