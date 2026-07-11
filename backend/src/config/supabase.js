const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'your-service-key';

console.log('Supabase URL configured:', supabaseUrl ? 'YES' : 'NO');
console.log('Supabase Anon Key configured:', supabaseAnonKey && supabaseAnonKey.length > 10 ? 'YES' : 'NO');
console.log('Supabase Service Key configured:', supabaseServiceKey && supabaseServiceKey.length > 10 ? 'YES' : 'NO');

// Standard client for public operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client using service_role key - this authenticates via the HTTP header
// (Authorization: Bearer <service_role_key>), NOT via JWT_SECRET
// The service_role key is a Supabase API key, not a JWT
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

module.exports = { supabase, supabaseAdmin, supabaseUrl, supabaseAnonKey };
