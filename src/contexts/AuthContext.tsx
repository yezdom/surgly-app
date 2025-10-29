import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

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

  useEffect(() => {
    // 🧭 Detect if running inside Bolt or local development
    const isBolt =
      typeof window !== "undefined" && window.location.host.includes("bolt");
    const isLocal =
      typeof window !== "undefined" &&
      (window.location.host.includes("localhost") || window.location.host.includes("127.0.0.1"));

    // 🚨 TEMPORARY DEV BYPASS
    if (isBolt || isLocal) {
      console.warn("🧑‍💻 DEV MODE: Auto-login as admin user (bypass auth)");
      setUser({
        id: "bolt-dev-admin",
        email: "ironzola@gmail.com",
        role: "authenticated",
        is_active: true,
      } as ExtendedUser);
      setLoading(false);
      return; // Skip Supabase auth listener in Bolt/local
    }

    // ✅ Normal Supabase Auth Flow (used in production)
    supabase.auth.getSession().then(async
