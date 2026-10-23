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
  updateCredentials: (params: {
    newUsername: string;
    newName?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  isLiveSupabase: boolean;
}

const AUTH_STORAGE_KEY = 'edupark_admin_session_v1';
const CREDENTIALS_STORAGE_KEY = 'edupark_admin_credentials_v1';

export function getActiveCredentials(): { username: string; password: string; name: string; email: string } {
  try {
    const raw = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.username && parsed.password) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading stored admin credentials', e);
  }

  return {
    username: import.meta.env.VITE_ADMIN_DEFAULT_USERNAME || 'admin',
    password: import.meta.env.VITE_ADMIN_DEFAULT_PASSWORD || 'edupark@admin2025',
    name: 'Campus Administrator',
    email: 'admin@edupark.edu'
  };
}

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
        try {
          const emailToUse = cleanId.includes('@') ? cleanId : `${cleanId}@edupark.edu`;
          const { data, error } = await supabase.auth.signInWithPassword({
            email: emailToUse,
            password: password,
          });

          if (!error && data?.user) {
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
        } catch (supabaseErr) {
          console.warn('Supabase auth notice (falling back to active admin credentials):', supabaseErr);
        }
      }

      // 2. Active Admin Credentials (configurable via Settings)
      const creds = getActiveCredentials();
      const isUsernameMatch =
        cleanId.toLowerCase() === creds.username.toLowerCase() ||
        cleanId.toLowerCase() === `${creds.username}@edupark.edu`.toLowerCase() ||
        cleanId.toLowerCase() === creds.email?.toLowerCase();

      if (isUsernameMatch && password === creds.password) {
        const adminUser: AdminUser = {
          id: 'admin-local-1',
          username: creds.username,
          email: creds.email || `${creds.username}@edupark.edu`,
          role: 'admin',
          name: creds.name || 'Campus Administrator',
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

  const updateCredentials = async (params: {
    newUsername: string;
    newName?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const trimmedUser = params.newUsername.trim();
    if (!trimmedUser) {
      return { success: false, error: 'Username cannot be blank.' };
    }

    const currentCreds = getActiveCredentials();

    // Verify current password when changing password
    if (params.newPassword) {
      if (!params.currentPassword) {
        return { success: false, error: 'Current password is required to change password.' };
      }
      if (params.currentPassword !== currentCreds.password) {
        return { success: false, error: 'Current password does not match.' };
      }
      if (params.newPassword.length < 6) {
        return { success: false, error: 'New password must be at least 6 characters long.' };
      }
    }

    // Attempt Supabase Auth update if signed in
    if (isLive && supabase) {
      try {
        const updatePayload: any = {
          data: {
            name: params.newName || trimmedUser,
            username: trimmedUser,
          }
        };
        if (params.newPassword) {
          updatePayload.password = params.newPassword;
        }
        await supabase.auth.updateUser(updatePayload);
      } catch (err) {
        console.warn('Supabase auth updateUser notice (fallback to local state):', err);
      }
    }

    // Persist new credentials locally
    const updatedCreds = {
      username: trimmedUser,
      name: params.newName?.trim() || currentCreds.name,
      email: `${trimmedUser}@edupark.edu`,
      password: params.newPassword || currentCreds.password,
    };

    localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(updatedCreds));

    // Update active session user immediately
    const updatedUser: AdminUser = {
      id: user?.id || 'admin-local-1',
      username: trimmedUser,
      name: updatedCreds.name,
      email: updatedCreds.email,
      role: 'admin',
    };

    setUser(updatedUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));

    return { success: true };
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
        updateCredentials,
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
