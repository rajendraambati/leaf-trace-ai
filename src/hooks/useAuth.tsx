import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithPhone: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
  userRole: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .limit(1);
      
      if (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
        return;
      }
      
      // Get the first role if multiple exist
      setUserRole(data?.[0]?.role ?? null);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Signed in successfully",
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Account created successfully",
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signInWithPhone = async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const verifyPhoneOtp = async (phone: string, token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Phone number verified successfully!",
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null);
      setSession(null);
      setUserRole(null);
      
      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      // Navigate to auth page even if there's a session error
      // (user might already be logged out)
      navigate('/auth');
      
      if (error) {
        // Only show error if it's not a session-related issue
        if (!error.message.includes('session')) {
          console.error('Sign out error:', error);
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Signed out successfully",
        });
      }
    } catch (error: any) {
      // Clear state and navigate even on error
      setUser(null);
      setSession(null);
      setUserRole(null);
      navigate('/auth');
      
      console.error('Sign out error:', error);
      toast({
        title: "Signed out",
        description: "You have been signed out",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signInWithPhone, verifyPhoneOtp, signOut, userRole }}>
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
