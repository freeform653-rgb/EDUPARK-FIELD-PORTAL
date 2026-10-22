// Authentication Context for Edupark Field Portal Admin Portal
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'admin';
  name: string;
}

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLiveSupabase: boolean;
}

const AUTH_STORAGE_KEY = 'edupark_admin_session_v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isLive = isSupabaseConfigured();

  // Load active session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        if (isLive && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser({
              id: session.user.id,
              username: session.user.email?.split('@')[0] || 'admin',
              email: session.user.email || 'admin@edupark.edu',
              role: 'admin',
              name: session.user.user_metadata?.name || 'Administrator',
            });
            setIsLoading(false);
            return;
          }
        }

        // Check local storage session
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.role === 'admin') {
            setUser(parsed);
          }
        }
      } catch (err) {
        console.error('Error verifying admin session', err);
      } finally {
        setIsLoading(false);
      }
    }

    checkSession();
  }, [isLive]);

  const login = async (usernameOrEmail: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanId = usernameOrEmail.trim();
    if (!cleanId) return { success: false, error: 'Username or email is required.' };
    if (!password) return { success: false, error: 'Password is required.' };

    try {
      // 1. Try Supabase Auth if configured
      if (isLive && supabase) {
        const emailToUse = cleanId.includes('@') ? cleanId : `${cleanId}@edupark.edu`;
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password: password,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          const adminUser: AdminUser = {
            id: data.user.id,
            username: cleanId,
            email: data.user.email || `${cleanId}@edupark.edu`,
            role: 'admin',
            name: data.user.user_metadata?.name || 'Administrator',
          };
          setUser(adminUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
          return { success: true };
        }
      }

      // 2. Default Configured Admin Credentials
      const configuredUser = import.meta.env.VITE_ADMIN_DEFAULT_USERNAME || 'admin';
      const configuredPass = import.meta.env.VITE_ADMIN_DEFAULT_PASSWORD || 'edupark@admin2025';

      if (
        (cleanId.toLowerCase() === configuredUser.toLowerCase() ||
         cleanId.toLowerCase() === `${configuredUser}@edupark.edu`.toLowerCase()) &&
        password === configuredPass
      ) {
        const adminUser: AdminUser = {
          id: 'admin-local-1',
          username: configuredUser,
          email: `${configuredUser}@edupark.edu`,
          role: 'admin',
          name: 'Campus Field Administrator',
        };
        setUser(adminUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
        return { success: true };
      }

      return {
        success: false,
        error: 'Invalid administrator credentials. Access restricted to authorized campus staff.',
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected authentication error occurred.' };
    }
  };

  const logout = async (): Promise<void> => {
    if (isLive && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Supabase signOut error', err);
      }
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        isLiveSupabase: isLive,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
