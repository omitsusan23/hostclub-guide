import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

console.log('🔧 Supabase URL:', supabaseUrl);
console.log('🔧 Using Anon Key:', supabaseAnonKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEliteLogin() {
  console.log('\n====================================');
  console.log('🔐 Testing Elite Login');
  console.log('====================================\n');

  const email = 'elite@hostclub.local';
  const password = 'Elite@Club2025!';

  console.log('📧 Email:', email);
  console.log('🔑 Password:', password);
  console.log('');

  try {
    // Step 1: Try to sign in
    console.log('Step 1: Attempting to sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
      console.error('Error details:', JSON.stringify(signInError, null, 2));
      
      // Try to get more details about why login failed
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('\n🔍 Checking if user exists...');
        const { data: userData, error: userError } = await supabase
          .from('auth.users')
          .select('*')
          .eq('email', email)
          .single();
        
        if (userError) {
          console.log('Could not query auth.users directly (expected - requires service role)');
        }
      }
      return;
    }

    console.log('✅ Sign in successful!');
    console.log('');

    // Step 2: Get session details
    console.log('Step 2: Getting session details...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ Failed to get session:', sessionError.message);
      return;
    }

    if (!sessionData.session) {
      console.error('❌ No session found after login');
      return;
    }

    console.log('✅ Session retrieved successfully');
    console.log('');

    // Step 3: Display user information
    console.log('Step 3: User Information');
    console.log('------------------------');
    const user = sessionData.session.user;
    console.log('User ID:', user.id);
    console.log('Email:', user.email);
    console.log('Email Confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
    console.log('Created At:', new Date(user.created_at).toLocaleString());
    console.log('Last Sign In:', user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never');
    console.log('');

    // Step 4: Check user metadata
    console.log('Step 4: User Metadata');
    console.log('---------------------');
    console.log('User Metadata:', JSON.stringify(user.user_metadata, null, 2));
    console.log('App Metadata:', JSON.stringify(user.app_metadata, null, 2));
    console.log('');

    // Step 5: Verify role and store_id
    console.log('Step 5: Role Verification');
    console.log('-------------------------');
    const role = user.user_metadata?.role;
    const storeId = user.user_metadata?.store_id;
    const displayName = user.user_metadata?.display_name;

    console.log('Role:', role || 'Not set');
    console.log('Store ID:', storeId || 'Not set');
    console.log('Display Name:', displayName || 'Not set');

    if (role === 'customer' && storeId === 'elite') {
      console.log('✅ User metadata is correctly configured for Elite customer');
    } else {
      console.error('⚠️ User metadata may not be correctly configured');
      console.log('Expected: role=customer, store_id=elite');
      console.log(`Got: role=${role}, store_id=${storeId}`);
    }
    console.log('');

    // Step 6: Test data access
    console.log('Step 6: Testing Data Access');
    console.log('---------------------------');

    // Try to fetch store information
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('store_id', 'elite')
      .single();

    if (storeError) {
      console.error('❌ Failed to fetch store data:', storeError.message);
    } else {
      console.log('✅ Store data retrieved successfully');
      console.log('Store Name:', storeData.name);
      console.log('Store Owner ID:', storeData.owner_id);
      console.log('User matches owner:', storeData.owner_id === user.id ? 'Yes ✅' : 'No ❌');
    }
    console.log('');

    // Step 7: Sign out
    console.log('Step 7: Signing out...');
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error('❌ Sign out failed:', signOutError.message);
    } else {
      console.log('✅ Signed out successfully');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.error('Error stack:', error.stack);
  }

  console.log('\n====================================');
  console.log('🔍 Login Test Complete');
  console.log('====================================\n');
}

// Run the test
testEliteLogin().then(() => {
  console.log('Test execution completed');
  process.exit(0);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});