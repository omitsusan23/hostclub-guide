import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not set');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Not set');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkEliteUser() {
  console.log('Checking elite@hostclub.local user in auth.users...\n');

  try {
    // Get user by email
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      filter: {
        email: 'elite@hostclub.local'
      }
    });

    if (error) {
      console.error('Error fetching user:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ User elite@hostclub.local not found in auth.users table');
      
      // Try to find similar emails
      console.log('\nSearching for similar emails...');
      const { data: { users: allUsers } } = await supabase.auth.admin.listUsers();
      
      const eliteUsers = allUsers?.filter(u => u.email?.includes('elite')) || [];
      if (eliteUsers.length > 0) {
        console.log('\nFound users with "elite" in email:');
        eliteUsers.forEach(u => {
          console.log(`  - ${u.email}`);
        });
      } else {
        console.log('No users with "elite" in email found');
      }
      return;
    }

    const user = users[0];
    console.log('✅ User found!\n');
    console.log('=== User Information ===');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Email Confirmed:', user.email_confirmed_at ? `Yes (${new Date(user.email_confirmed_at).toLocaleString()})` : 'No');
    console.log('Created At:', new Date(user.created_at).toLocaleString());
    console.log('Last Sign In:', user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never');
    console.log('Phone:', user.phone || 'Not set');
    console.log('Confirmed At:', user.confirmed_at ? new Date(user.confirmed_at).toLocaleString() : 'Not confirmed');
    
    console.log('\n=== User Metadata ===');
    if (user.user_metadata && Object.keys(user.user_metadata).length > 0) {
      console.log('user_metadata:', JSON.stringify(user.user_metadata, null, 2));
      
      // Check specific fields
      console.log('\n--- Metadata Validation ---');
      console.log('role:', user.user_metadata.role || '❌ NOT SET');
      console.log('store_id:', user.user_metadata.store_id || '❌ NOT SET');
      console.log('display_name:', user.user_metadata.display_name || 'Not set');
      
      if (user.user_metadata.role === 'customer' && user.user_metadata.store_id === 'elite') {
        console.log('\n✅ Metadata correctly configured for customer role with store_id=elite');
      } else {
        console.log('\n⚠️ Metadata may need adjustment:');
        if (user.user_metadata.role !== 'customer') {
          console.log('  - Expected role: customer, Got:', user.user_metadata.role);
        }
        if (user.user_metadata.store_id !== 'elite') {
          console.log('  - Expected store_id: elite, Got:', user.user_metadata.store_id);
        }
      }
    } else {
      console.log('❌ No user_metadata found');
    }
    
    console.log('\n=== App Metadata ===');
    if (user.app_metadata && Object.keys(user.app_metadata).length > 0) {
      console.log('app_metadata:', JSON.stringify(user.app_metadata, null, 2));
    } else {
      console.log('No app_metadata');
    }
    
    console.log('\n=== Account Status ===');
    console.log('Is Anonymous:', user.is_anonymous || false);
    console.log('Banned Until:', user.banned_until || 'Not banned');
    console.log('Deleted At:', user.deleted_at || 'Not deleted');
    
    // Check if user is active
    if (!user.banned_until && !user.deleted_at && user.email_confirmed_at) {
      console.log('\n✅ User is active and can log in');
    } else {
      console.log('\n⚠️ User may have issues:');
      if (user.banned_until) console.log('  - User is banned');
      if (user.deleted_at) console.log('  - User is deleted');
      if (!user.email_confirmed_at) console.log('  - Email not confirmed');
    }

    // Also check the stores table
    console.log('\n=== Checking stores table for elite store ===');
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('store_id', 'elite')
      .single();

    if (storeError) {
      console.log('Error fetching elite store:', storeError.message);
    } else if (store) {
      console.log('Elite store found:');
      console.log('  - ID:', store.id);
      console.log('  - Store ID:', store.store_id);
      console.log('  - Name:', store.name);
      console.log('  - Owner ID:', store.owner_id);
      console.log('  - Created At:', new Date(store.created_at).toLocaleString());
      
      if (store.owner_id === user.id) {
        console.log('\n✅ User is correctly set as the owner of elite store');
      } else {
        console.log(`\n⚠️ User ID (${user.id}) does not match store owner_id (${store.owner_id})`);
      }
    } else {
      console.log('❌ Elite store not found in stores table');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the check
checkEliteUser();