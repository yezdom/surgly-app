import { createClient } from '@supabase/supabase-js';

// ╔═══════════════════════════════════════════════════════════════════╗
// ║  CORRECT DATABASE CREDENTIALS - HARDCODED TO BYPASS BOLT SECRETS  ║
// ╚═══════════════════════════════════════════════════════════════════╝
const CORRECT_SUPABASE_URL = "https://hiefmgtlazspyhspzbjl.supabase.co";
const CORRECT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpZWZtZ3RsYXpzcHloc3B6YmpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyOTk2MTQsImV4cCI6MjA3Njg3NTYxNH0.3vpLCExHHB6bHf7pw6uIh1LqKWHjzO6-Te2Lz49-FKc";

// Check environment variables
const ENV_URL = import.meta.env.VITE_SUPABASE_URL;
const ENV_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Determine environment
const isProduction = typeof window !== "undefined" &&
  window.location.hostname === "surgly.app";

// ╔═══════════════════════════════════════════════════════════════════╗
// ║  LOGIC: Use env vars ONLY in production, hardcoded everywhere else ║
// ╚═══════════════════════════════════════════════════════════════════╝
let supabaseUrl: string;
let supabaseAnonKey: string;

if (isProduction && ENV_URL && !ENV_URL.includes("xsxabdojiokotjpofnlx")) {
  // Production with correct env vars
  supabaseUrl = ENV_URL;
  supabaseAnonKey = ENV_KEY!;
  console.log("🌍 [SURGLY] Using PRODUCTION environment variables");
} else {
  // Everywhere else: Bolt, localhost, or wrong env vars
  supabaseUrl = CORRECT_SUPABASE_URL;
  supabaseAnonKey = CORRECT_SUPABASE_ANON_KEY;
  console.log("🔧 [SURGLY] Using HARDCODED credentials (bypassing Bolt secrets)");
}

// Log for debugging
console.log("🔍 [SURGLY] Database Configuration:");
console.log("   Environment:", isProduction ? "Production" : "Development");
console.log("   Project ID:", supabaseUrl.split("//")[1]?.split(".")[0]);
console.log("   Hostname:", typeof window !== "undefined" ? window.location.hostname : "SSR");

// ✅ Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 🩺 Verify we're using the correct database
if (supabaseUrl.includes("hiefmgtlazspyhspzbjl")) {
  console.log("✅ Connected to CORRECT database: hiefmgtlazspyhspzbjl");
} else {
  console.error("❌ WRONG DATABASE DETECTED!");
  console.error("   Current:", supabaseUrl);
  console.error("   Expected: https://hiefmgtlazspyhspzbjl.supabase.co");
  console.error("   This should NEVER happen with hardcoded credentials!");
}
