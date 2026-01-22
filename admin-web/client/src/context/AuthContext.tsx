import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import type { Admin, AuthContextType, LoginResponse } from '../types';

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('adminToken');
    const savedAdmin = localStorage.getItem('adminInfo');
    
    if (token && savedAdmin) {
      try {
        setAdmin(JSON.parse(savedAdmin));
      } catch (e) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminInfo');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.post<LoginResponse>('/api/admin/login', { username, password });
      if (response.success && response.admin && response.token) {
        localStorage.setItem('adminToken', response.token);
        localStorage.setItem('adminInfo', JSON.stringify(response.admin));
        setAdmin(response.admin);
        return { success: true };
      }
      return { success: false, error: response.error || 'Greška pri prijavi' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Greška pri prijavi';
      return { success: false, error: errorMessage };
    }
  };

  const logout = (): void => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{
      admin,
      isAuthenticated: !!admin,
      loading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
