import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ExtendedUser {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.warn("🚨 AUTH DISABLED — Auto-login as Admin");

    // Simulate logged-in admin
    const adminUser: ExtendedUser = {
      id: "temporary-admin",
      email: "ironzola@gmail.com",
      role: "admin",
      is_active: true,
      subscription_tier: "pro",
    };

    setUser(adminUser);
    setLoading(false);
  }, []);

  // Dummy auth functions (do nothing)
  const signIn = async () => {};
  const signUp = async () => {};
  const signOut = async () => {};
  const signInWithGoogle = async () => {};

  return (
    <>
      {/* 🔧 Banner */}
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
