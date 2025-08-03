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

async function checkStoresStructure() {
  console.log('\n====================================');
  console.log('🔍 Checking Stores Table Structure');
  console.log('====================================\n');

  try {
    // Get Elite store data with all columns
    console.log('Fetching Elite store data...');
    const { data: eliteStore, error: eliteError } = await supabase
      .from('stores')
      .select('*')
      .eq('store_id', 'elite')
      .single();

    if (eliteError) {
      console.error('❌ Failed to fetch Elite store:', eliteError.message);
      return;
    }

    console.log('Elite store columns and values:');
    console.log(JSON.stringify(eliteStore, null, 2));
    console.log('');

    // Get all stores to see the structure
    console.log('Fetching all stores to verify structure...');
    const { data: allStores, error: allError } = await supabase
      .from('stores')
      .select('*')
      .limit(3);

    if (allError) {
      console.error('❌ Failed to fetch stores:', allError.message);
      return;
    }

    console.log(`Found ${allStores.length} stores. Sample structure:`);
    if (allStores.length > 0) {
      console.log('Available columns:', Object.keys(allStores[0]));
      console.log('');
      console.log('First store sample:');
      console.log(JSON.stringify(allStores[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('\n====================================');
  console.log('✅ Structure Check Complete');
  console.log('====================================\n');
}

// Run the check
checkStoresStructure().then(() => {
  console.log('Check completed');
  process.exit(0);
}).catch(error => {
  console.error('Check failed:', error);
  process.exit(1);
});