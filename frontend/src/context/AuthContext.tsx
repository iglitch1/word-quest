import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [progress, setProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('wordquest_token');
    if (storedToken) {
      setToken(storedToken);
      refreshUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = async (currentToken?: string) => {
    const tokenToUse = currentToken || token;
    if (!tokenToUse) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Map display_name to displayName for consistency
        const user = {
          ...data.user,
          displayName: data.user.display_name || data.user.displayName,
        };
        setUser(user);
        setProgress(data.progress);
      } else {
        // Token invalid, clear it
        localStorage.removeItem('wordquest_token');
        setToken(null);
        setUser(null);
        setProgress(null);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      localStorage.removeItem('wordquest_token');
      setToken(null);
      setUser(null);
      setProgress(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      localStorage.setItem('wordquest_token', data.token);
      setToken(data.token);
      // Map display_name to displayName for consistency
      const user = {
        ...data.user,
        displayName: data.user.display_name || data.user.displayName,
      };
      setUser(user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (username: string, displayName: string, password: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          displayName,
          password,
          role: 'player',
        }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();
      localStorage.setItem('wordquest_token', data.token);
      setToken(data.token);
      // Map display_name to displayName for consistency
      const user = {
        ...data.user,
        displayName: data.user.display_name || data.user.displayName,
      };
      setUser(user);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('wordquest_token');
    setToken(null);
    setUser(null);
    setProgress(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 to-blue-500">
        <div className="text-center">
          <div className="text-6xl mb-4">✨</div>
          <div className="text-white text-xl font-bold">Loading Word Quest...</div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, progress, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
