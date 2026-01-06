import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  sendOTP: (email: string, type: 'login' | 'password_reset') => Promise<{ error: Error | null }>;
  verifyOTP: (email: string, code: string, type: 'login' | 'password_reset') => Promise<{ error: Error | null; actionLink?: string }>;
  resetPasswordWithCode: (email: string, newPassword: string) => Promise<{ error: Error | null }>;
  sendLoginNotification: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    
    return { error: error as Error | null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    return { error: error as Error | null };
  };

  const sendOTP = async (email: string, type: 'login' | 'password_reset') => {
    try {
      const response = await supabase.functions.invoke('send-otp', {
        body: { email, type },
      });

      if (response.error) {
        return { error: new Error(response.error.message || 'Failed to send code') };
      }

      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Failed to send code') };
    }
  };

  const verifyOTP = async (email: string, code: string, type: 'login' | 'password_reset') => {
    try {
      const response = await supabase.functions.invoke('verify-otp', {
        body: { email, code, type },
      });

      if (response.error) {
        return { error: new Error(response.error.message || 'Invalid or expired code') };
      }

      const data = response.data;

      if (data.error) {
        return { error: new Error(data.error) };
      }

      // For login, use the magic link to sign in
      if (type === 'login' && data.actionLink) {
        // Extract token from action link and verify
        const url = new URL(data.actionLink);
        const token = url.searchParams.get('token');
        const tokenType = url.searchParams.get('type') || 'magiclink';

        if (token) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: tokenType as any,
          });

          if (verifyError) {
            return { error: verifyError as Error };
          }
        }
      }

      return { error: null, actionLink: data.actionLink };
    } catch (err: any) {
      return { error: new Error(err.message || 'Failed to verify code') };
    }
  };

  const resetPasswordWithCode = async (email: string, newPassword: string) => {
    try {
      const response = await supabase.functions.invoke('reset-password', {
        body: { email, newPassword },
      });

      if (response.error) {
        return { error: new Error(response.error.message || 'Failed to reset password') };
      }

      const data = response.data;

      if (data.error) {
        return { error: new Error(data.error) };
      }

      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Failed to reset password') };
    }
  };

  const sendLoginNotification = async (email: string) => {
    try {
      await supabase.functions.invoke('send-login-notification', {
        body: { email, userAgent: navigator.userAgent },
      });
    } catch (err) {
      console.error('Failed to send login notification:', err);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signUp, 
      signIn, 
      signOut, 
      resetPassword,
      updatePassword,
      sendOTP,
      verifyOTP,
      resetPasswordWithCode,
      sendLoginNotification,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
