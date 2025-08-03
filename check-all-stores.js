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

async function checkAllStores() {
  console.log('\n====================================');
  console.log('🔍 Checking All Stores in Database');
  console.log('====================================\n');

  try {
    // Get ALL stores from the database
    console.log('Fetching all stores from database...');
    const { data: allStores, error: allError } = await supabase
      .from('stores')
      .select('store_id, name, created_at')
      .order('created_at', { ascending: true });

    if (allError) {
      console.error('❌ Failed to fetch stores:', allError.message);
      return;
    }

    console.log(`✅ Found ${allStores.length} stores in total\n`);
    
    console.log('📋 List of all store_ids:');
    console.log('------------------------');
    
    const storeIds = [];
    allStores.forEach((store, index) => {
      storeIds.push(store.store_id);
      console.log(`${index + 1}. store_id: "${store.store_id}" | name: "${store.name || 'N/A'}"`);
    });
    
    console.log('\n📊 Summary:');
    console.log('------------');
    console.log(`Total stores: ${allStores.length}`);
    console.log(`\nAll store_ids array: [${storeIds.map(id => `"${id}"`).join(', ')}]`);
    
    // Identify potential subdomain store_ids
    console.log('\n🌐 Potential subdomain store_ids (alphanumeric, no spaces):');
    console.log('------------------------------------------------------------');
    const subdomainCandidates = storeIds.filter(id => /^[a-z0-9-]+$/.test(id));
    subdomainCandidates.forEach(id => {
      const store = allStores.find(s => s.store_id === id);
      console.log(`- ${id} (${store.name || 'N/A'})`);
    });
    
    // Check for specific stores mentioned
    console.log('\n🔎 Checking for specific stores:');
    console.log('----------------------------------');
    const checkStores = ['nana', 'elite', 'izone', 'rberu', 'rberusapporo', 'white', 'july31'];
    checkStores.forEach(storeId => {
      const exists = storeIds.includes(storeId);
      console.log(`${storeId}: ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    });
    
    // Check created dates
    console.log('\n📅 Stores by creation date:');
    console.log('----------------------------');
    allStores.forEach(store => {
      const date = new Date(store.created_at).toLocaleDateString('ja-JP');
      console.log(`${store.store_id}: created on ${date}`);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('\n====================================');
  console.log('✅ Store Check Complete');
  console.log('====================================\n');
}

// Run the check
checkAllStores().then(() => {
  console.log('Check completed');
  process.exit(0);
}).catch(error => {
  console.error('Check failed:', error);
  process.exit(1);
});