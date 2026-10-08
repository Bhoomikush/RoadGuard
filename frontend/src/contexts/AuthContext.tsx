import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: 'user' | 'authority' | null;
  loading: boolean;
  signIn: typeof supabase.auth.signInWithPassword;
  signUp: typeof supabase.auth.signUp;
  signOut: typeof supabase.auth.signOut;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  loading: true,
  signIn: async (credentials) => supabase.auth.signInWithPassword(credentials),
  signUp: async (credentials) => supabase.auth.signUp(credentials),
  signOut: async () => supabase.auth.signOut(),
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'user' | 'authority' | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string | undefined) => {
    if (!userId) {
      setRole(null);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching user role:', error);
        setRole('user');
        return;
      }
      
      setRole(data?.role as 'user' | 'authority' ?? 'user');
    } catch (error) {
      console.error('Unexpected error fetching user role:', error);
      setRole('user');
    }
  };

  useEffect(() => {
    let mounted = true;
    let currentUserForRole: string | null = null;

    const handleSession = async (session: Session | null) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const userId = session.user.id;
        // Skip duplicate fetches if we already fetched/are fetching for this exact user
        if (currentUserForRole !== userId) {
          currentUserForRole = userId;
          await fetchUserRole(userId);
        }
      } else {
        currentUserForRole = null;
        setRole(null);
      }
      
      if (mounted) setLoading(false);
    };

    // Get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      role, 
      loading,
      signIn: async (credentials) => supabase.auth.signInWithPassword(credentials),
      signUp: async (credentials) => supabase.auth.signUp(credentials),
      signOut: async () => supabase.auth.signOut(),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
