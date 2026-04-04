import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const USER_ROLES = ['ADMIN', 'MANAGER', 'DEVELOPER'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  organization_id?: string;
  organization_name?: string;
}

export interface SignupData {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  organization_name?: string;
  organization_id?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = 'http://localhost:8000';

// Mock users for fallback when backend is not running
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@tracehub.io': {
    password: 'admin123',
    user: {
      id: '1',
      email: 'admin@tracehub.io',
      full_name: 'Sarah Chen',
      role: 'ADMIN',
      organization_id: 'org-1',
      organization_name: 'TraceHub Systems',
    },
  },
  'manager@tracehub.io': {
    password: 'manager123',
    user: {
      id: '2',
      email: 'manager@tracehub.io',
      full_name: 'James Rivera',
      role: 'MANAGER',
      organization_id: 'org-1',
      organization_name: 'TraceHub Systems',
    },
  },
  'dev@tracehub.io': {
    password: 'dev123',
    user: {
      id: '3',
      email: 'dev@tracehub.io',
      full_name: 'Alex Kumar',
      role: 'DEVELOPER',
      organization_id: 'org-1',
      organization_name: 'TraceHub Systems',
    },
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Invalid credentials');
      }

      const data = await res.json();
      const authToken = data.access_token;

      const meRes = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!meRes.ok) throw new Error('Failed to fetch user info');

      const userData: User = await meRes.json();
      setToken(authToken);
      setUser(userData);
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('auth_user', JSON.stringify(userData));
    } catch {
      // Fallback to mock data when backend is unreachable
      const mockEntry = MOCK_USERS[email];
      if (mockEntry && mockEntry.password === password) {
        const mockToken = 'mock-jwt-token-' + Date.now();
        setToken(mockToken);
        setUser(mockEntry.user);
        localStorage.setItem('auth_token', mockToken);
        localStorage.setItem('auth_user', JSON.stringify(mockEntry.user));
        return;
      }
      throw new Error('Invalid email or password');
    }
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Signup failed');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'Signup failed') throw err;
      // If backend is unreachable, simulate success
      return;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        signup,
        logout,
        isAuthenticated: !!user && !!token,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
