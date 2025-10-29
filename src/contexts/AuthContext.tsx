import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

interface ExtendedUser extends User {
  is_active?: boolean;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    // 🧭 Detect if running inside Bolt or local dev
    const isBolt =
      typeof window !== "undefined" && window.location.host.includes("bolt");
    const isLocal =
      typeof window !== "undefined" &&
      (window.location.host.includes("localhost") ||
        window.location.host.includes("127.0.0.1"));

    // 🚨 TEMPORARY DEV BYPASS
    if (isBolt || isLocal) {
      console.warn("🧑‍💻 DEV MODE: Auto-login as admin user (bypass auth)");
      setUser({
        id: "bolt-dev-admin",
        email: "ironzola@gmail.com",
        role: "authenticated",
        is_active: true,
      } as ExtendedUser);
      setIsDevMode(true);
      setLoading(false);
      return; // Skip Supabase auth listener in dev
    }

    // ✅ Normal Supabase Auth Flow (used in production)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const extendedUser = await fetchUserProfile(session.user);
        setUser(extendedUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const extendedUser = await fetchUserProfile(session.user);
        setUser(extendedUser);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchUserProfile(user: User): Promise<ExtendedUser> {
    try {
      const { data } = await supabase
        .from("users")
        .select("is_active")
        .eq("id", user.id)
        .maybeSingle();

      return {
        ...user,
        is_active: data?.is_active ?? true,
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return { ...user, is_active: true };
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) throw error;
  };

  return (
    <>
      {/* 🧱 Dev Mode Banner */}
      {isDevMode && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            background: "linear-gradient(90deg, #FF6B6B, #FFD93D)",
            color: "#000",
            textAlign: "center",
            padding: "6px 0",
            fontWeight: "bold",
            zIndex: 9999,
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          }}
        >
          ⚙️ SURGLY DEV MODE ACTIVE — Auto-logged in as admin (ironzola@gmail.com)
        </div>
      )}

      <AuthContext.Provider
        value={{ user, loading, signIn, signUp, signOut, signInWithGoogle }}
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
