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

async function resetPasswords() {
  console.log('=== パスワードリセット処理 ===\n');
  
  // izoneユーザーのパスワードを更新
  console.log('1. izoneユーザーのパスワードを更新中...');
  const { data: izoneUpdate, error: izoneError } = await supabase.auth.admin.updateUserById(
    '731b878f-2079-41ef-8764-60c671a74c2d',
    { password: 'izone1234' }
  );
  
  if (izoneError) {
    console.log('  ❌ エラー:', izoneError.message);
  } else {
    console.log('  ✅ izoneユーザーのパスワードを更新しました');
  }
  
  // eliteユーザーのパスワードを更新
  console.log('\n2. eliteユーザーのパスワードを更新中...');
  const { data: eliteUpdate, error: eliteError } = await supabase.auth.admin.updateUserById(
    '080c4a37-eedf-4991-8ae5-4a884f4a989f',
    { password: 'elite1234' }
  );
  
  if (eliteError) {
    console.log('  ❌ エラー:', eliteError.message);
  } else {
    console.log('  ✅ eliteユーザーのパスワードを更新しました');
  }
  
  // ログインテスト
  console.log('\n=== ログインテスト ===\n');
  
  // izoneログインテスト
  console.log('1. izone@hostclub.local / izone1234 でログイン試行:');
  const { data: izoneLogin, error: izoneLoginError } = await supabase.auth.signInWithPassword({
    email: 'izone@hostclub.local',
    password: 'izone1234'
  });
  
  if (izoneLogin?.user) {
    console.log('  ✅ ログイン成功！');
    console.log('     - ID:', izoneLogin.user.id);
    console.log('     - role:', izoneLogin.user.user_metadata?.role);
    console.log('     - store_id:', izoneLogin.user.user_metadata?.store_id);
    await supabase.auth.signOut();
  } else {
    console.log('  ❌ ログイン失敗:', izoneLoginError?.message);
  }
  
  // eliteログインテスト
  console.log('\n2. elite@hostclub.local / elite1234 でログイン試行:');
  const { data: eliteLogin, error: eliteLoginError } = await supabase.auth.signInWithPassword({
    email: 'elite@hostclub.local',
    password: 'elite1234'
  });
  
  if (eliteLogin?.user) {
    console.log('  ✅ ログイン成功！');
    console.log('     - ID:', eliteLogin.user.id);
    console.log('     - role:', eliteLogin.user.user_metadata?.role);
    console.log('     - store_id:', eliteLogin.user.user_metadata?.store_id);
    await supabase.auth.signOut();
  } else {
    console.log('  ❌ ログイン失敗:', eliteLoginError?.message);
  }
  
  // storesテーブルの確認と修正
  console.log('\n=== storesテーブルの確認 ===\n');
  
  // izoneストアの確認
  const { data: izoneStore, error: izoneStoreError } = await supabase
    .from('stores')
    .select('*')
    .eq('id', 'izone')
    .single();
    
  if (izoneStore) {
    console.log('✅ izoneストアが存在します');
    console.log('   - owner_id:', izoneStore.owner_id);
    
    if (izoneStore.owner_id !== '731b878f-2079-41ef-8764-60c671a74c2d') {
      console.log('   ⚠️ owner_idを修正中...');
      const { error: updateError } = await supabase
        .from('stores')
        .update({ owner_id: '731b878f-2079-41ef-8764-60c671a74c2d' })
        .eq('id', 'izone');
      
      if (updateError) {
        console.log('   ❌ 更新エラー:', updateError.message);
      } else {
        console.log('   ✅ owner_idを修正しました');
      }
    } else {
      console.log('   ✅ owner_idは正しく設定されています');
    }
  } else {
    console.log('❌ izoneストアが見つかりません。作成が必要です。');
  }
  
  // eliteストアの確認
  const { data: eliteStore, error: eliteStoreError } = await supabase
    .from('stores')
    .select('*')
    .eq('id', 'elite')
    .single();
    
  if (eliteStore) {
    console.log('\n✅ eliteストアが存在します');
    console.log('   - owner_id:', eliteStore.owner_id);
    
    if (eliteStore.owner_id !== '080c4a37-eedf-4991-8ae5-4a884f4a989f') {
      console.log('   ⚠️ owner_idを修正中...');
      const { error: updateError } = await supabase
        .from('stores')
        .update({ owner_id: '080c4a37-eedf-4991-8ae5-4a884f4a989f' })
        .eq('id', 'elite');
      
      if (updateError) {
        console.log('   ❌ 更新エラー:', updateError.message);
      } else {
        console.log('   ✅ owner_idを修正しました');
      }
    } else {
      console.log('   ✅ owner_idは正しく設定されています');
    }
  } else {
    console.log('\n❌ eliteストアが見つかりません。作成が必要です。');
  }
  
  console.log('\n処理完了');
  process.exit(0);
}

resetPasswords().catch(console.error);