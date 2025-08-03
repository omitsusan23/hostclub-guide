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

async function checkIzoneAndElite() {
  console.log('=== アイズワン（izone）とエリート（elite）ユーザー確認 ===\n');
  
  // Admin APIでユーザーリスト取得
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.log('エラー:', authError);
    return;
  }
  
  console.log('登録ユーザー数:', authData.users.length);
  console.log('\n--- 対象ユーザー詳細 ---\n');
  
  // izoneとeliteを探す
  let izoneUser = null;
  let eliteUser = null;
  
  authData.users.forEach(user => {
    if (user.email === 'izone@hostclub.local') {
      izoneUser = user;
      console.log('📍 IZONE ユーザー:');
      console.log('  Email:', user.email);
      console.log('  ID:', user.id);
      console.log('  作成日時:', user.created_at);
      console.log('  最終サインイン:', user.last_sign_in_at || 'なし');
      console.log('  user_metadata:', JSON.stringify(user.user_metadata, null, 2));
      console.log('');
    }
    if (user.email === 'elite@hostclub.local') {
      eliteUser = user;
      console.log('📍 ELITE ユーザー:');
      console.log('  Email:', user.email);
      console.log('  ID:', user.id);
      console.log('  作成日時:', user.created_at);
      console.log('  最終サインイン:', user.last_sign_in_at || 'なし');
      console.log('  user_metadata:', JSON.stringify(user.user_metadata, null, 2));
      console.log('');
    }
  });
  
  if (!izoneUser) {
    console.log('⚠️ izone@hostclub.localユーザーが見つかりません\n');
  }
  if (!eliteUser) {
    console.log('⚠️ elite@hostclub.localユーザーが見つかりません\n');
  }
  
  // storesテーブルも確認
  console.log('\n=== storesテーブル確認 ===\n');
  const { data: stores, error: storeError } = await supabase
    .from('stores')
    .select('*')
    .in('id', ['izone', 'elite']);
    
  if (stores) {
    stores.forEach(store => {
      console.log(`📍 Store: ${store.id}`);
      console.log('  Name:', store.name);
      console.log('  Owner ID:', store.owner_id);
      
      // owner_idとユーザーIDの一致確認
      if (store.id === 'izone' && izoneUser) {
        if (store.owner_id === izoneUser.id) {
          console.log('  ✅ owner_idが正しく設定されています');
        } else {
          console.log('  ❌ owner_idが一致しません');
          console.log('     期待値:', izoneUser.id);
          console.log('     実際:', store.owner_id);
        }
      }
      if (store.id === 'elite' && eliteUser) {
        if (store.owner_id === eliteUser.id) {
          console.log('  ✅ owner_idが正しく設定されています');
        } else {
          console.log('  ❌ owner_idが一致しません');
          console.log('     期待値:', eliteUser.id);
          console.log('     実際:', store.owner_id);
        }
      }
      console.log('');
    });
  }
  
  // ログインテスト
  console.log('\n=== ログインテスト ===\n');
  
  // izoneログインテスト
  console.log('1. izone@hostclub.local / izone1234:');
  const { data: izoneLogin, error: izoneError } = await supabase.auth.signInWithPassword({
    email: 'izone@hostclub.local',
    password: 'izone1234'
  });
  
  if (izoneLogin?.user) {
    console.log('  ✅ ログイン成功');
    await supabase.auth.signOut();
  } else {
    console.log('  ❌ ログイン失敗:', izoneError?.message);
  }
  
  // eliteログインテスト
  console.log('\n2. elite@hostclub.local / elite1234:');
  const { data: eliteLogin, error: eliteError } = await supabase.auth.signInWithPassword({
    email: 'elite@hostclub.local',
    password: 'elite1234'
  });
  
  if (eliteLogin?.user) {
    console.log('  ✅ ログイン成功');
    await supabase.auth.signOut();
  } else {
    console.log('  ❌ ログイン失敗:', eliteError?.message);
  }
  
  // 問題の診断
  console.log('\n=== 診断結果 ===\n');
  if (!izoneUser) {
    console.log('❌ izoneユーザーが存在しません。作成が必要です。');
  } else if (izoneUser && izoneError) {
    console.log('❌ izoneユーザーは存在しますが、パスワードが正しくない可能性があります。');
    console.log('   パスワードリセットが必要かもしれません。');
  }
  
  if (!eliteUser) {
    console.log('❌ eliteユーザーが存在しません。作成が必要です。');
  } else if (eliteUser && eliteError) {
    console.log('❌ eliteユーザーは存在しますが、パスワードが正しくない可能性があります。');
    console.log('   パスワードリセットが必要かもしれません。');
  }
  
  process.exit(0);
}

checkIzoneAndElite().catch(console.error);