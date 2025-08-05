import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../service/api';
import { logger } from '../utils/logger';

interface User {
  username: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {
    throw new Error('AuthContext not initialized');
  },
  logout: async () => {
    throw new Error('AuthContext not initialized');
  },
};

export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const loadUser = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const isAuthenticated = await authAPI.isAuthenticated();
        
        if (isAuthenticated) {
          const currentUser = await authAPI.getCurrentUser();
          if (currentUser) {
            setUser(currentUser as User);
          }
        }
      } catch (error) {
        logger.error('Error loading user', { error });
        // Clear any invalid stored data
        await authAPI.logout();
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Call the actual API for authentication
      const response = await authAPI.login(username, password);
      
      if (response.success && response.user) {
        const userData: User = response.user as User;
        setUser(userData);
        logger.info('Login successful', { username });
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      logger.error('Login error', { error, username });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authAPI.logout();
      setUser(null);
      logger.info('Logout successful');
    } catch (error) {
      logger.error('Logout error', { error });
      // Even if logout API fails, clear local state
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};