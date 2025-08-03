const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function analyzeIzoneEliteProblem() {
  console.log('=== アイズワン・エリート問題の詳細分析 ===\n');
  
  // 1. ユーザー情報を取得
  const { data: authData } = await supabase.auth.admin.listUsers();
  const izoneUser = authData?.users?.find(u => u.email === 'izone@hostclub.local');
  const eliteUser = authData?.users?.find(u => u.email === 'elite@hostclub.local');
  
  console.log('1. ユーザーメタデータ:');
  console.log('\n  IZONE:');
  console.log('    store_id:', izoneUser?.user_metadata?.store_id);
  console.log('    store_name:', izoneUser?.user_metadata?.store_name);
  console.log('    role:', izoneUser?.user_metadata?.role);
  
  console.log('\n  ELITE:');
  console.log('    store_id:', eliteUser?.user_metadata?.store_id);
  console.log('    store_name:', eliteUser?.user_metadata?.store_name);
  console.log('    role:', eliteUser?.user_metadata?.role);
  
  // 2. stores テーブルの確認
  console.log('\n2. Stores テーブルのレコード:');
  const { data: stores } = await supabase
    .from('stores')
    .select('*')
    .in('name', ['アイズワン', 'エリート']);
  
  stores?.forEach(store => {
    console.log('\n  Store:', store.name);
    console.log('    ID (UUID):', store.id);
    console.log('    store_id (TEXT):', store.store_id);
    console.log('    base_fee:', store.base_fee);
  });
  
  // 3. RLSポリシーのチェック（照合）
  console.log('\n3. RLSポリシー照合結果:');
  console.log('\n  RLSは store_id (TEXT) = user_metadata.store_id で照合');
  
  const izoneStore = stores?.find(s => s.name === 'アイズワン');
  const eliteStore = stores?.find(s => s.name === 'エリート');
  
  if (izoneStore) {
    console.log('\n  IZONE:');
    console.log('    Store store_id:', izoneStore.store_id);
    console.log('    User store_id:', izoneUser?.user_metadata?.store_id);
    if (izoneStore.store_id === izoneUser?.user_metadata?.store_id) {
      console.log('    ✅ 一致しています');
    } else {
      console.log('    ❌ 一致していません！');
    }
  }
  
  if (eliteStore) {
    console.log('\n  ELITE:');
    console.log('    Store store_id:', eliteStore.store_id);
    console.log('    User store_id:', eliteUser?.user_metadata?.store_id);
    if (eliteStore.store_id === eliteUser?.user_metadata?.store_id) {
      console.log('    ✅ 一致しています');
    } else {
      console.log('    ❌ 一致していません！');
    }
  }
  
  // 4. 問題の診断
  console.log('\n=== 診断結果 ===\n');
  
  if (!izoneStore) {
    console.log('❌ アイズワンのストアレコードが存在しません');
    console.log('   → stores テーブルにレコード追加が必要です');
  } else if (izoneStore.store_id !== izoneUser?.user_metadata?.store_id) {
    console.log('❌ アイズワンの store_id が一致しません');
    console.log('   → ユーザーのメタデータまたはストアの store_id を修正する必要があります');
  }
  
  if (!eliteStore) {
    console.log('❌ エリートのストアレコードが存在しません');
    console.log('   → stores テーブルにレコード追加が必要です');
  } else if (eliteStore.store_id !== eliteUser?.user_metadata?.store_id) {
    console.log('❌ エリートの store_id が一致しません');
    console.log('   → ユーザーのメタデータまたはストアの store_id を修正する必要があります');
  }
  
  if (izoneStore && izoneStore.store_id === izoneUser?.user_metadata?.store_id && 
      eliteStore && eliteStore.store_id === eliteUser?.user_metadata?.store_id) {
    console.log('✅ 両方とも store_id が正しく設定されています');
    console.log('\nログイン情報:');
    console.log('  IZONE: izone@hostclub.local / Izone@Club2025!');
    console.log('  ELITE: elite@hostclub.local / Elite@Club2025!');
  }
  
  process.exit(0);
}

analyzeIzoneEliteProblem().catch(console.error);