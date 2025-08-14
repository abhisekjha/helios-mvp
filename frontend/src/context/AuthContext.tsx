'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { login as apiLogin } from '@/api/auth';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';

interface User {
  email: string;
  full_name: string;
  role: 'director' | 'manager';
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (formData: FormData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const response = await axiosInstance.get('/api/v1/users/me');
          if (response.status === 200) {
            const userData = response.data;
            setUser(userData);
          } else {
            logout();
          }
        } catch (error) {
          console.error('Failed to fetch user', error);
          logout();
        }
      }
    };
    fetchUser();
  }, [token, router]);

  const login = async (formData: FormData) => {
    const { access_token } = await apiLogin(formData);
    setToken(access_token);
    localStorage.setItem('token', access_token);
    router.push('/');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    router.push('/login');
  };

  const value = { user, token, login, logout, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}