import { createClient } from '@supabase/supabase-js';

// 🧭 Detect Bolt or local preview environment
const isBolt =
  typeof window !== "undefined" && window.location.host.includes("bolt");
const isLocal =
  typeof window !== "undefined" &&
  (window.location.host.includes("localhost") ||
    window.location.host.includes("127.0.0.1"));

// 🧠 Real Supabase credentials (used ONLY in Bolt or local dev)
const REAL_SUPABASE_URL = "https://hiefmgtlazspyhspzbjl.supabase.co";
const REAL_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpZWZtZ3RsYXpzcHloc3B6YmpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyOTk2MTQsImV4cCI6MjA3Njg3NTYxNH0.3vpLCExHHB6bHf7pw6uIh1LqKWHjzO6-Te2Lz49-FKc";

// 🌍 Production environment variables (used on Vercel)
const ENV_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ENV_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 🧩 Choose which to use
const supabaseUrl =
  (isBolt || isLocal) ? REAL_SUPABASE_URL : ENV_SUPABASE_URL;
const supabaseAnonKey =
  (isBolt || isLocal) ? REAL_SUPABASE_ANON_KEY : ENV_SUPABASE_ANON_KEY;

// 🧾 Log current state (safe, no secrets)
console.log("🔍 [SURGLY] Environment Check:");
console.log("   Detected Bolt:", isBolt);
console.log("   Detected Localhost:", isLocal);
console.log("   Using URL:", supabaseUrl);
console.log("   Project ID:", supabaseUrl?.split("//")[1]?.split(".")[0]);

// ✅ Create client
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

// 🩺 Verify connection to correct project
if (supabaseUrl?.includes("hiefmgtlazspyhspzbjl")) {
  console.log("✅ Connected to the correct Supabase project: hiefmgtlazspyhspzbjl");
} else {
  console.warn("⚠️ WARNING: Not connected to expected project (hiefmgtlazspyhspzbjl)");
  console.warn("   Current URL:", supabaseUrl);
}
