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

async function fixIzoneAndElite() {
  console.log('=== アイズワンとエリートの完全修正 ===\n');
  
  // 1. パスワードを強力なものに更新
  console.log('1. パスワード更新処理\n');
  
  // izoneユーザーのパスワードを更新
  console.log('  izoneユーザーのパスワードを更新中...');
  const { data: izoneUpdate, error: izoneError } = await supabase.auth.admin.updateUserById(
    '731b878f-2079-41ef-8764-60c671a74c2d',
    { password: 'Izone@2025#Secure!' }
  );
  
  if (izoneError) {
    console.log('    ❌ エラー:', izoneError.message);
  } else {
    console.log('    ✅ 更新成功（新パスワード: Izone@2025#Secure!）');
  }
  
  // eliteユーザーのパスワードを更新
  console.log('\n  eliteユーザーのパスワードを更新中...');
  const { data: eliteUpdate, error: eliteError } = await supabase.auth.admin.updateUserById(
    '080c4a37-eedf-4991-8ae5-4a884f4a989f',
    { password: 'Elite@2025#Secure!' }
  );
  
  if (eliteError) {
    console.log('    ❌ エラー:', eliteError.message);
  } else {
    console.log('    ✅ 更新成功（新パスワード: Elite@2025#Secure!）');
  }
  
  // 2. storesテーブルにデータを作成
  console.log('\n2. storesテーブルのデータ作成\n');
  
  // izoneストアを作成
  console.log('  izoneストアを作成中...');
  const { data: izoneStore, error: izoneStoreError } = await supabase
    .from('stores')
    .upsert({
      id: 'izone',
      name: 'アイズワン',
      owner_id: '731b878f-2079-41ef-8764-60c671a74c2d',
      reading: 'アイズワン',
      area: '薄野',
      created_at: new Date().toISOString()
    }, { onConflict: 'id' });
    
  if (izoneStoreError) {
    console.log('    ❌ エラー:', izoneStoreError.message);
  } else {
    console.log('    ✅ izoneストアを作成/更新しました');
  }
  
  // eliteストアを作成
  console.log('\n  eliteストアを作成中...');
  const { data: eliteStore, error: eliteStoreError } = await supabase
    .from('stores')
    .upsert({
      id: 'elite',
      name: 'エリート',
      owner_id: '080c4a37-eedf-4991-8ae5-4a884f4a989f',
      reading: 'エリート',
      area: '薄野',
      created_at: new Date().toISOString()
    }, { onConflict: 'id' });
    
  if (eliteStoreError) {
    console.log('    ❌ エラー:', eliteStoreError.message);
  } else {
    console.log('    ✅ eliteストアを作成/更新しました');
  }
  
  // 3. ログインテスト
  console.log('\n3. ログインテスト\n');
  
  // izoneログインテスト
  console.log('  izone@hostclub.local でログイン試行...');
  const { data: izoneLogin, error: izoneLoginError } = await supabase.auth.signInWithPassword({
    email: 'izone@hostclub.local',
    password: 'Izone@2025#Secure!'
  });
  
  if (izoneLogin?.user) {
    console.log('    ✅ ログイン成功！');
    console.log('       - ID:', izoneLogin.user.id);
    console.log('       - role:', izoneLogin.user.user_metadata?.role);
    console.log('       - store_id:', izoneLogin.user.user_metadata?.store_id);
    console.log('       - store_name:', izoneLogin.user.user_metadata?.store_name);
    await supabase.auth.signOut();
  } else {
    console.log('    ❌ ログイン失敗:', izoneLoginError?.message);
  }
  
  // eliteログインテスト
  console.log('\n  elite@hostclub.local でログイン試行...');
  const { data: eliteLogin, error: eliteLoginError } = await supabase.auth.signInWithPassword({
    email: 'elite@hostclub.local',
    password: 'Elite@2025#Secure!'
  });
  
  if (eliteLogin?.user) {
    console.log('    ✅ ログイン成功！');
    console.log('       - ID:', eliteLogin.user.id);
    console.log('       - role:', eliteLogin.user.user_metadata?.role);
    console.log('       - store_id:', eliteLogin.user.user_metadata?.store_id);
    console.log('       - store_name:', eliteLogin.user.user_metadata?.store_name);
    await supabase.auth.signOut();
  } else {
    console.log('    ❌ ログイン失敗:', eliteLoginError?.message);
  }
  
  // 4. 最終確認
  console.log('\n4. 最終確認\n');
  
  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('*')
    .in('id', ['izone', 'elite']);
    
  if (stores && stores.length > 0) {
    console.log('  登録されたストア:');
    stores.forEach(store => {
      console.log(`    - ${store.id}: ${store.name} (owner_id: ${store.owner_id})`);
    });
  } else {
    console.log('  ❌ ストアが見つかりません');
  }
  
  console.log('\n=== 設定完了 ===');
  console.log('\nログイン情報:');
  console.log('  izone: izone@hostclub.local / Izone@2025#Secure!');
  console.log('  elite: elite@hostclub.local / Elite@2025#Secure!');
  
  process.exit(0);
}

fixIzoneAndElite().catch(console.error);