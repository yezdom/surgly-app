import { createClient } from '@supabase/supabase-js';

// Environment Variable Validation and Logging
console.log('🔍 Environment Variable Check:');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('VITE_FACEBOOK_APP_ID:', import.meta.env.VITE_FACEBOOK_APP_ID);
console.log('VITE_OPENAI_API_KEY exists:', !!import.meta.env.VITE_OPENAI_API_KEY);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables!');
  console.error('   Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  console.error('   Check Bolt secrets section or .env file');
  throw new Error('❌ Missing required environment variables! Check Bolt secrets section.');
}

console.log('🚀 Supabase Client Initializing...');
console.log('   URL:', supabaseUrl);
console.log('   Project:', supabaseUrl?.split('//')[1]?.split('.')[0]);
console.log('✅ Expected: hiefmgtlazspyhspzbjl');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('✅ Supabase client created successfully');

// Verify connection is to correct project
if (supabaseUrl?.includes('hiefmgtlazspyhspzbjl')) {
  console.log('✅ Connected to correct Supabase project: hiefmgtlazspyhspzbjl');
} else {
  console.warn('⚠️ WARNING: Not connected to expected project hiefmgtlazspyhspzbjl');
  console.warn('   Current URL:', supabaseUrl);
}
