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

  // Routes that don't require authentication and shouldn't show auth errors
  const publicRoutes = [
    '/reset-password',
    '/forgot-password',
    '/login',
    '/signup',
    '/',
    '/privacy',
    '/terms',
    '/verify-email'
  ];

  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // If this is a public route we can skip attempting to fetch/refresh the session entirely.
    if (isPublicRoute) {
      setLoading(false);
      setSession(null);
      setUser(null);
      return; // <-- do NOT call supabase.auth.getUser() on public pages
    }

    const fetchInitialSession = async () => {
      try {
        // Get the authenticated user (secure)
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          // Only log auth errors for protected routes
          if (!isPublicRoute) {
            console.error('Auth error:', error);
          }
          setSession(null);
          setUser(null);
        } else {
          // Create a minimal session object from user data
          const session = user ? {
            user,
            access_token: '', // Not needed for client-side usage
            refresh_token: '', // Not needed for client-side usage
            expires_in: 0,
            expires_at: 0,
            token_type: 'bearer'
          } : null;
          setSession(session);
          setUser(user);
        }
      } catch (error) {
        // Only log errors for protected routes
        if (!isPublicRoute) {
          console.error('Error fetching initial session:', error);
        }
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    }
    
    fetchInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: any, session: Session | null) => {
        // Only log auth state changes for non-public routes to reduce noise
        if (!isPublicRoute) {
          console.log(`Auth state change event: ${event}`);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, pathname, isPublicRoute]);

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