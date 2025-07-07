// 全ユーザーを検索してrberuを探すスクリプト
// 実行方法: node find-all-users.js

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

async function findAllUsers() {
  try {
    console.log('🔍 全ユーザーを検索します...\n');

    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    if (error) {
      console.error('❌ ユーザー一覧取得エラー:', error);
      return;
    }

    console.log(`📋 総ユーザー数: ${users.length}\n`);

    // customerロールのユーザーのみ表示
    const customerUsers = users.filter(user => 
      user.user_metadata?.role === 'customer' || 
      user.app_metadata?.role === 'customer'
    );

    console.log('🏪 Customer ユーザー一覧:');
    console.log('='.repeat(80));
    
    customerUsers.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`  - User ID: ${user.id}`);
      console.log(`  - store_id (user_metadata): ${user.user_metadata?.store_id || 'なし'}`);
      console.log(`  - store_id (app_metadata): ${user.app_metadata?.store_id || 'なし'}`);
      console.log(`  - store_name: ${user.user_metadata?.store_name || 'なし'}`);
      console.log(`  - created_at: ${user.created_at}`);
      console.log('-'.repeat(80));
    });

    // rberuまたはルベルに関連するユーザーを検索
    console.log('\n🔍 rberu/ルベル関連のユーザー:');
    console.log('='.repeat(80));
    
    const rberuRelated = users.filter(user => 
      user.email?.toLowerCase().includes('rberu') ||
      user.email?.toLowerCase().includes('rbelu') ||
      user.email?.toLowerCase().includes('ruberu') ||
      user.email?.toLowerCase().includes('ルベル') ||
      user.user_metadata?.store_id?.toLowerCase().includes('rberu') ||
      user.user_metadata?.store_id?.toLowerCase().includes('rbelu') ||
      user.user_metadata?.store_name?.includes('ルベル') ||
      user.user_metadata?.store_name?.toLowerCase().includes('rberu')
    );

    if (rberuRelated.length > 0) {
      rberuRelated.forEach(user => {
        console.log(`✅ 見つかりました！`);
        console.log(`Email: ${user.email}`);
        console.log(`  - User ID: ${user.id}`);
        console.log(`  - store_id: ${user.user_metadata?.store_id || user.app_metadata?.store_id || 'なし'}`);
        console.log(`  - store_name: ${user.user_metadata?.store_name || 'なし'}`);
      });
    } else {
      console.log('❌ rberu関連のユーザーが見つかりません');
    }

  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
  }
}

// スクリプトを実行
findAllUsers();