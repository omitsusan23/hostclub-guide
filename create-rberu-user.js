// rberuユーザーを作成するスクリプト
// 実行方法: node create-rberu-user.js

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 環境変数が設定されていません');
  process.exit(1);
}

async function createRberuUser() {
  try {
    console.log('🔍 rberuユーザーを作成します...\n');

    const functionUrl = `${supabaseUrl}/functions/v1/create-store-user`;
    
    const requestBody = {
      email: 'rberu@hostclub.local',
      password: 'hostclub123',
      user_metadata: {
        role: 'customer',
        store_id: 'rberu',
        store_name: 'ルベル',
        email_verified: true
      }
    };

    console.log('📤 リクエスト送信中...');
    console.log('URL:', functionUrl);
    console.log('Body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('\n✅ ユーザー作成成功！');
      console.log('📝 ログイン情報:');
      console.log('   Email: rberu@hostclub.local');
      console.log('   Password: hostclub123');
    } else {
      console.error('\n❌ エラー:', result.error);
      
      // エラーがユーザー既存の場合
      if (result.error && result.error.includes('already registered')) {
        console.log('\n💡 ユーザーは既に存在しています。パスワードリセットを試してください。');
      }
    }

  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
  }
}

// スクリプトを実行
createRberuUser();