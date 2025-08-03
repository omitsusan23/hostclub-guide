import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixEliteOwnerId() {
  console.log('\n====================================');
  console.log('🔧 Fixing Elite Store Owner ID');
  console.log('====================================\n');

  const userId = '080c4a37-eedf-4991-8ae5-4a884f4a989f';
  const storeId = 'elite';

  try {
    // Step 1: Check current store data
    console.log('Step 1: Checking current store data...');
    const { data: currentStore, error: checkError } = await supabase
      .from('stores')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (checkError) {
      console.error('❌ Failed to fetch store:', checkError.message);
      return;
    }

    console.log('Current store data:');
    console.log('- Store ID:', currentStore.store_id);
    console.log('- Name:', currentStore.name);
    console.log('- Current Owner ID:', currentStore.owner_id || 'null');
    console.log('');

    // Step 2: Update owner_id
    console.log('Step 2: Updating owner_id...');
    console.log('Setting owner_id to:', userId);

    const { data: updateData, error: updateError } = await supabase
      .from('stores')
      .update({ owner_id: userId })
      .eq('store_id', storeId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update owner_id:', updateError.message);
      return;
    }

    console.log('✅ Owner ID updated successfully!');
    console.log('');

    // Step 3: Verify the update
    console.log('Step 3: Verifying update...');
    const { data: verifyStore, error: verifyError } = await supabase
      .from('stores')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (verifyError) {
      console.error('❌ Failed to verify update:', verifyError.message);
      return;
    }

    console.log('Updated store data:');
    console.log('- Store ID:', verifyStore.store_id);
    console.log('- Name:', verifyStore.name);
    console.log('- New Owner ID:', verifyStore.owner_id);
    console.log('- Owner matches user:', verifyStore.owner_id === userId ? 'Yes ✅' : 'No ❌');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('\n====================================');
  console.log('✅ Owner ID Fix Complete');
  console.log('====================================\n');
}

// Run the fix
fixEliteOwnerId().then(() => {
  console.log('Fix execution completed');
  process.exit(0);
}).catch(error => {
  console.error('Fix execution failed:', error);
  process.exit(1);
});