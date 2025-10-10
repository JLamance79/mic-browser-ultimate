import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://cblmedhjcprsvmpessvd.supabase.co';

let _supabase = null;

// Lazily create the Supabase client so importing this module doesn't fail
// when SUPABASE_KEY isn't set (useful for CLI tests).
export function getSupabase() {
  if (_supabase) return _supabase;

  const supabaseKey = process.env.SUPABASE_KEY;
  if (!supabaseKey) {
    throw new Error('SUPABASE_KEY is required to create Supabase client.');
  }

  _supabase = createClient(supabaseUrl, supabaseKey);
  return _supabase;
}

// Helper: sign up a user (wrapped in a function to avoid top-level await)
export async function signUpUser(email = 'user@example.com', password = 'password123') {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  return { data, error };
}

// Default export remains a function to get the client lazily
export default getSupabase;
