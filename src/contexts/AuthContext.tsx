import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../lib/supabase";

interface ExtendedUser {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  is_admin?: boolean;
  subscription_tier?: string;
}

interface AuthContextType {
  user: ExtendedUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEV_MODE = true; // Set to false for production

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEV_MODE) {
      // Dev mode: auto-login as admin
      console.warn("🚨 AUTH DISABLED — Auto-login as Admin");

      const adminUser: ExtendedUser = {
        id: "temporary-admin",
        email: "ironzola@gmail.com",
        role: "admin",
        is_active: true,
        is_admin: true,
        subscription_tier: "pro",
      };

      setUser(adminUser);
      setLoading(false);
    } else {
      // Production mode: use real Supabase auth
      initializeAuth();
    }
  }, []);

  async function initializeAuth() {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        await loadUserProfile(session.user.id, session.user.email || '');
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            await loadUserProfile(session.user.id, session.user.email || '');
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
        }
      );

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadUserProfile(userId: string, email: string) {
    try {
      // Fetch user profile from Supabase including admin status
      const { data, error } = await supabase
        .from('users')
        .select('is_active, is_admin, subscription_tier')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Failed to load user profile:', error);
      }

      // Create extended user object with profile data
      const extendedUser: ExtendedUser = {
        id: userId,
        email: email,
        role: data?.is_admin ? 'admin' : 'user',
        is_active: data?.is_active ?? true,
        is_admin: data?.is_admin ?? false,
        subscription_tier: data?.subscription_tier || 'Free',
      };

      setUser(extendedUser);
    } catch (error) {
      console.error('Failed to load user profile:', error);

      // Fallback: create basic user object without profile data
      setUser({
        id: userId,
        email: email,
        role: 'user',
        is_active: true,
        is_admin: false,
        subscription_tier: 'Free',
      });
    }
  }

  async function signIn(email: string, password: string) {
    if (DEV_MODE) return;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      await loadUserProfile(data.user.id, data.user.email || '');
    }
  }

  async function signUp(email: string, password: string) {
    if (DEV_MODE) return;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      await loadUserProfile(data.user.id, data.user.email || '');
    }
  }

  async function signOut() {
    if (DEV_MODE) {
      setUser(null);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setUser(null);
  }

  async function signInWithGoogle() {
    if (DEV_MODE) return;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) throw error;
  }

  return (
    <>
      {DEV_MODE && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            background: "linear-gradient(90deg, #6EE7B7, #3B82F6)",
            color: "#000",
            textAlign: "center",
            padding: "6px 0",
            fontWeight: "bold",
            zIndex: 9999,
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          }}
        >
          🧑‍💻 SURGLY DEV MODE — AUTH DISABLED | Logged in as Admin (ironzola@gmail.com)
        </div>
      )}

      <AuthContext.Provider
        value={{
          user,
          loading,
          signIn,
          signUp,
          signOut,
          signInWithGoogle,
        }}
      >
        {children}
      </AuthContext.Provider>
    </>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
