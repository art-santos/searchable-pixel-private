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

    const initializeAuth = async () => {
      try {
        // First, get the session from storage (cookies)
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting initial session:', sessionError);
          setSession(null);
          setUser(null);
        } else {
          // Set the session and user from the stored session
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          // Only log when we actually have a session
          if (initialSession) {
            console.log('✅ Auth session restored successfully');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    
    initializeAuth();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Auth state change event: ${event}`);
        
        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            setSession(session);
            setUser(session?.user ?? null);
            console.log('✅ User signed in or token refreshed');
            break;
          case 'SIGNED_OUT':
            setSession(null);
            setUser(null);
            console.log('✅ User signed out');
            break;
          case 'USER_UPDATED':
            if (session) {
              setSession(session);
              setUser(session.user);
              console.log('✅ User updated');
            }
            break;
          default:
            // For other events, just update the state
            setSession(session);
            setUser(session?.user ?? null);
        }
        
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