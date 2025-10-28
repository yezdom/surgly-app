import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('🚀 Supabase Client Initializing...');
console.log('   URL:', supabaseUrl);
console.log('   Project:', supabaseUrl.split('//')[1]?.split('.')[0] || 'unknown');
console.log('   Anon Key:', supabaseAnonKey.substring(0, 30) + '...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('✅ Supabase client created successfully');
