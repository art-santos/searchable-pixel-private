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

  // Initial session load + Listener
  useEffect(() => {
    if (!supabase) {
        console.error("AuthContext: Supabase client not available on mount.");
        setLoading(false);
      return;
    }

    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      console.log("Initial session fetched:", session);
    }).catch((error) => {
      console.error("Error fetching initial session:", error);
        setLoading(false);
    });

    // Set up the auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Auth state change event: ${event}`, session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Simplified navigation logic
      setTimeout(() => {
          if (event === 'SIGNED_IN' && session?.user) {
          // If signed in and on the login page, redirect to dashboard
          if (pathname === '/login') {
            console.log('SIGNED_IN on login page, redirecting to dashboard');
            router.push('/dashboard');
            }
          } else if (event === 'SIGNED_OUT') {
          // If signed out, redirect to landing page
          console.log('SIGNED_OUT, redirecting to landing page');
          router.push('/');
          }
      }, 0);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, router, pathname]);

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