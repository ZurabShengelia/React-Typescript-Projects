import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AuthUser, AuthResponseBody } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'https://react-typescript-projects.onrender.com';

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  register: (username: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useState(() => {
    try {
      const raw = localStorage.getItem('nocturne_auth');
      if (raw) {
        const parsed = JSON.parse(raw) as { token?: string; user?: AuthUser };
        if (parsed?.token && parsed?.user) {
          setToken(parsed.token);
          setUser(parsed.user);
        }
      }
    } catch (err) {
    }
  });

  const handleAuthResponse = useCallback((data: AuthResponseBody) => {
    setToken(data.token);
    setUser(data.user);
    try {
      localStorage.setItem('nocturne_auth', JSON.stringify({ token: data.token, user: data.user }));
    } catch (err) {
    }
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      handleAuthResponse(data as AuthResponseBody);
    },
    [handleAuthResponse]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      handleAuthResponse(data as AuthResponseBody);
    },
    [handleAuthResponse]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem('nocturne_auth');
      localStorage.removeItem('nocturne_lastRoom');
    } catch (err) {
    }
  }, []);

  const value: AuthContextValue = {
    token,
    user,
    isAuthenticated: Boolean(token && user),
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
