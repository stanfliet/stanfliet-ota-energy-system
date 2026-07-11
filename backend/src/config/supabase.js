const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'your-service-key';

console.log('Supabase URL configured:', supabaseUrl ? 'YES' : 'NO');
console.log('Supabase Service Key configured:', supabaseServiceKey && supabaseServiceKey.length > 10 ? 'YES' : 'NO');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

module.exports = { supabase, supabaseAdmin, supabaseUrl, supabaseAnonKey };
