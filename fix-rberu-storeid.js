// rberuのstore_idを修正するスクリプト
// 実行方法: node fix-rberu-storeid.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ 環境変数が設定されていません');
  process.exit(1);
}

// Service Role Keyを使用してSupabaseクライアントを作成
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixRberuStoreId() {
  try {
    console.log('🔍 rberuのstore_idを修正します...\n');

    // 1. データベース内のrberu店舗を検索
    console.log('1️⃣ データベース内のrberu関連の店舗を検索中...');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .or('store_id.eq.rberu,name.ilike.%rberu%,name.ilike.%rbelu%,name.ilike.%リベール%');

    if (storesError) {
      console.error('❌ 店舗検索エラー:', storesError);
      return;
    }

    console.log('📋 見つかった店舗:', stores);

    // 2. 認証ユーザーでrberu関連のものを検索
    console.log('\n2️⃣ 認証ユーザーを検索中...');
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ ユーザー検索エラー:', usersError);
      return;
    }

    const rberuUsers = users.filter(user => 
      user.email?.includes('rberu') || 
      user.email?.includes('rbelu') ||
      user.user_metadata?.store_id?.includes('rberu') ||
      user.user_metadata?.store_id?.includes('rbelu')
    );

    console.log('📋 見つかったrberu関連ユーザー:', rberuUsers.map(u => ({
      email: u.email,
      store_id: u.user_metadata?.store_id,
      created_at: u.created_at
    })));

    // 3. 正しいstore_idを決定
    let correctStoreId = 'rberu';
    if (stores.length > 0) {
      correctStoreId = stores[0].store_id;
      console.log(`\n✅ データベースの正しいstore_id: ${correctStoreId}`);
    }

    // 4. ユーザーのstore_idを修正
    for (const user of rberuUsers) {
      if (user.user_metadata?.store_id !== correctStoreId) {
        console.log(`\n🔧 ユーザー ${user.email} のstore_idを修正中...`);
        console.log(`   現在: ${user.user_metadata?.store_id} → 修正後: ${correctStoreId}`);

        const { data, error } = await supabase.auth.admin.updateUserById(
          user.id,
          {
            user_metadata: {
              ...user.user_metadata,
              store_id: correctStoreId
            }
          }
        );

        if (error) {
          console.error(`❌ ユーザー更新エラー:`, error);
        } else {
          console.log(`✅ ユーザー ${user.email} のstore_idを修正しました`);
        }
      }
    }

    // 5. 新しいユーザーがいない場合は作成
    if (rberuUsers.length === 0) {
      console.log('\n⚠️ rberuユーザーが見つかりません。新規作成します...');
      
      const email = `${correctStoreId}@hostclub.local`;
      const password = 'hostclub123';

      const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          role: 'customer',
          store_id: correctStoreId,
          store_name: stores[0]?.name || 'リベール'
        }
      });

      if (error) {
        console.error('❌ ユーザー作成エラー:', error);
      } else {
        console.log(`✅ 新規ユーザーを作成しました: ${email}`);
      }
    }

    console.log('\n✨ 処理が完了しました！');
    console.log('📝 ログイン情報:');
    console.log(`   Email: ${correctStoreId}@hostclub.local`);
    console.log(`   Password: hostclub123`);

  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
  }
}

// スクリプトを実行
fixRberuStoreId();