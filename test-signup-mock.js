// Mocked test for Supabase signUp — no network calls
// This simulates success and error responses from supabase.auth.signUp

const mockSupabase = {
  auth: {
    async signUp({ email, password }) {
      // simple deterministic mock: emails containing "error" return an error
      if (email && email.includes('error')) {
        return { data: null, error: { message: 'Mocked signup error', status: 400 } };
      }

      // success mock
      return {
        data: {
          user: {
            id: 'mock_user_1',
            email,
          },
          // typically Supabase returns additional session info; omitted here
        },
        error: null,
      };
    },
  },
};

async function runMockTests() {
  console.log('Running mocked signup tests (no network)...');

  const goodEmail = 'user@example.com';
  const badEmail = 'error@example.com';

  const good = await mockSupabase.auth.signUp({ email: goodEmail, password: 'password123' });
  console.log('\n[GOOD] signup result:');
  console.log('data:', good.data);
  console.log('error:', good.error);

  const bad = await mockSupabase.auth.signUp({ email: badEmail, password: 'pw' });
  console.log('\n[BAD] signup result:');
  console.log('data:', bad.data);
  console.log('error:', bad.error);
}

runMockTests().catch((err) => {
  console.error('Unexpected error in mock test:', err);
  process.exit(1);
});
