import 'dotenv/config';
import { signUpUser } from './supabaseClient.js';

// Mock signUpUser for local testing

// Use the mock instead of the real function
async function main() {
  const key = process.env.SUPABASE_KEY;
  if (!key) {
    console.error('SUPABASE_KEY not set. Set it and re-run. Example (PowerShell):');
    console.error(
      '$env:SUPABASE_KEY = "your_service_role_or_anon_key_here"; node .\\test-signup.js'
    );
    process.exit(1);
  }

  const email = process.argv[2] || 'user@example.com';
  const password = process.argv[3] || 'password123';

  try {
    const { data, error } = await signUpUser(email, password);
    console.log('signup data:', data);
    console.log('signup error:', error);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(2);
  }
}

main();
