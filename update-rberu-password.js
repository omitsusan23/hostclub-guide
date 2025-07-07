// rberuユーザーのパスワードを更新するスクリプト
// 実行方法: node update-rberu-password.js

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

async function updateRberuPassword() {
  try {
    console.log('🔍 rberuユーザーのパスワードを更新します...\n');

    // 1. rberuに関連するユーザーを検索
    console.log('1️⃣ rberuユーザーを検索中...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ ユーザー一覧取得エラー:', listError);
      return;
    }

    // rberuに関連するメールアドレスを探す
    const rberuUsers = users.filter(user => 
      user.email?.includes('rberu') || 
      user.email?.includes('rbelu') ||
      user.user_metadata?.store_id === 'rberu' ||
      user.user_metadata?.store_id === 'rbelu'
    );

    if (rberuUsers.length === 0) {
      console.error('❌ rberuユーザーが見つかりません');
      return;
    }

    console.log('📋 見つかったユーザー:');
    rberuUsers.forEach(user => {
      console.log(`   - Email: ${user.email}`);
      console.log(`     store_id: ${user.user_metadata?.store_id}`);
      console.log(`     created_at: ${user.created_at}`);
    });

    // 2. 各ユーザーのパスワードを更新
    for (const user of rberuUsers) {
      console.log(`\n2️⃣ ユーザー ${user.email} のパスワードを更新中...`);

      const { data, error } = await supabase.auth.admin.updateUserById(
        user.id,
        {
          password: 'hostclub123'
        }
      );

      if (error) {
        console.error(`❌ パスワード更新エラー:`, error);
      } else {
        console.log(`✅ パスワードを更新しました`);
        console.log(`   Email: ${user.email}`);
        console.log(`   新しいPassword: hostclub123`);
      }
    }

    console.log('\n✨ 処理が完了しました！');

  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
  }
}

// スクリプトを実行
updateRberuPassword();