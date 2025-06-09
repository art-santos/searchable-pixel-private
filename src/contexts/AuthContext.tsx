"use client";

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { SupabaseClient, User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

type AuthContextType = {
  supabase: SupabaseClient | null;
  user: User | null;
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const fetchInitialSession = async () => {
      try {
        // Get the authenticated user (secure)
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Auth error:', error);
          setSession(null);
          setUser(null);
        } else {
          // If we have a user, get the session
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);
          setUser(user);
        }
      } catch (error) {
        console.error('Error fetching initial session:', error);
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    }
    
    fetchInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`Auth state change event: ${event}`);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const value = {
    supabase,
    user,
    session,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 