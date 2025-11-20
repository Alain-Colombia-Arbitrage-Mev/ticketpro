import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabase/client';
import { api, User } from '../utils/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    const startTime = Date.now();
    try {
      console.log('🔄 Fetching user profile...');
      const { user: userProfile } = await api.getProfile();
      setUser(userProfile);
      const elapsed = Date.now() - startTime;
      console.log(`✅ User profile set in ${elapsed}ms`);
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    await fetchUserProfile();
  };

  useEffect(() => {
    // Check active sessions
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          api.setAccessToken(session.access_token);
          await fetchUserProfile();
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.access_token) {
          api.setAccessToken(session.access_token);
          await fetchUserProfile();
        } else {
          api.setAccessToken(null);
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.session?.access_token) {
      api.setAccessToken(data.session.access_token);
      await fetchUserProfile();
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    // Create user on server
    await api.signup(email, password, name);

    // Sign in immediately
    await signIn(email, password);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    api.setAccessToken(null);
    setUser(null);
  };

  const sendMagicLink = async (email: string) => {
    await api.sendMagicLink(email);
  };

  const forgotPassword = async (email: string) => {
    await api.forgotPassword(email);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshUser, sendMagicLink, forgotPassword }}>
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
