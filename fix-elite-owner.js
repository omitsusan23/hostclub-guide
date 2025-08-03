import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixEliteOwner() {
  console.log('Fixing elite store owner_id...\n');

  try {
    // Get the elite user
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers({
      filter: {
        email: 'elite@hostclub.local'
      }
    });

    if (userError || !users || users.length === 0) {
      console.error('Could not find elite@hostclub.local user');
      return;
    }

    const user = users[0];
    console.log('Found user:');
    console.log('  - ID:', user.id);
    console.log('  - Email:', user.email);
    console.log('  - Role:', user.user_metadata?.role);
    console.log('  - Store ID:', user.user_metadata?.store_id);

    // Check current store status
    const { data: storeBefore, error: storeBeforeError } = await supabase
      .from('stores')
      .select('*')
      .eq('store_id', 'elite')
      .single();

    if (storeBeforeError) {
      console.error('Error fetching store:', storeBeforeError);
      return;
    }

    console.log('\nCurrent elite store:');
    console.log('  - ID:', storeBefore.id);
    console.log('  - Store ID:', storeBefore.store_id);
    console.log('  - Name:', storeBefore.name);
    console.log('  - Current Owner ID:', storeBefore.owner_id || 'NULL/undefined');

    // Update the owner_id
    const { data: updatedStore, error: updateError } = await supabase
      .from('stores')
      .update({ owner_id: user.id })
      .eq('store_id', 'elite')
      .select()
      .single();

    if (updateError) {
      console.error('Error updating store owner_id:', updateError);
      return;
    }

    console.log('\n✅ Successfully updated elite store owner_id!');
    console.log('Updated store:');
    console.log('  - ID:', updatedStore.id);
    console.log('  - Store ID:', updatedStore.store_id);
    console.log('  - Name:', updatedStore.name);
    console.log('  - New Owner ID:', updatedStore.owner_id);

    // Verify the relationship
    if (updatedStore.owner_id === user.id) {
      console.log('\n✅ Verification successful: User is now correctly set as the owner of elite store');
    } else {
      console.log('\n⚠️ Warning: Owner ID still does not match');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the fix
fixEliteOwner();