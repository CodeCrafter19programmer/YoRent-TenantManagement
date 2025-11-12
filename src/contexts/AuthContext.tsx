import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: 'admin' | 'tenant' | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'tenant' | null>((localStorage.getItem('yorent_role') as 'admin' | 'tenant' | null) ?? null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@yorent.com').toLowerCase();
    const computeRoleFromEmail = (email: string) => (email?.toLowerCase() === adminEmail ? 'admin' : 'tenant');
    const upsertUserRole = async (userId: string, role: 'admin' | 'tenant') => {
      try {
        await supabase.from('user_roles').upsert({ user_id: userId, role }, { onConflict: 'user_id' });
        localStorage.setItem('yorent_role', role);
      } catch {}
    };
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const role = computeRoleFromEmail(session.user.email || '');
        setUserRole(role as 'admin' | 'tenant');
        localStorage.setItem('yorent_role', role);
        setLoading(false);
        upsertUserRole(session.user.id, role as 'admin' | 'tenant');
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_OUT') {
        setUserRole(null);
        localStorage.removeItem('yorent_role');
        setLoading(false);
        return;
      }
      
      if (session?.user) {
        const role = (session.user.email || '').toLowerCase() === (import.meta.env.VITE_ADMIN_EMAIL || 'admin@yorent.com').toLowerCase() ? 'admin' : 'tenant';
        setUserRole(role as 'admin' | 'tenant');
        localStorage.setItem('yorent_role', role);
        setLoading(false);
        try { await supabase.from('user_roles').upsert({ user_id: session.user.id, role }, { onConflict: 'user_id' }); } catch {}
      } else {
        setUserRole(null);
        localStorage.removeItem('yorent_role');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!result.error && result.data.user && result.data.session) {
        // Automatically determine role based on email
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@yorent.com';
        const role = email.toLowerCase() === adminEmail.toLowerCase() ? 'admin' : 'tenant';
        
        // Set all states immediately to prevent spinner issues
        setUser(result.data.user);
        setSession(result.data.session);
        setUserRole(role);
        localStorage.setItem('yorent_role', role);
        setLoading(false);
        
        // Upsert the role in background (fire and forget)
        (async () => {
          try {
            await supabase.from('user_roles').upsert(
              { user_id: result.data.user.id, role },
              { onConflict: 'user_id' }
            );
          } catch {}
        })();
      }
      return { error: result.error };
    } catch (err: any) {
      console.error('Sign-in exception:', err);
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (!error && data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
      });

      // Automatically determine role based on email
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@yorent.com';
      const role = email.toLowerCase() === adminEmail.toLowerCase() ? 'admin' : 'tenant';

      // Assign the role
      await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: role,
      });
    }

    return { error };
  };

  const signOut = async () => {
    try {
      setLoading(true);
      localStorage.removeItem('yorent_role');
      setUserRole(null);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    userRole,
    loading,
    signIn,
    signOut,
    signUp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
