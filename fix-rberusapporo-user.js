// rberusapporoユーザーを探してrberuに修正するスクリプト
// 実行方法: node fix-rberusapporo-user.js

import dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 環境変数が設定されていません');
  process.exit(1);
}

async function createOrUpdateRberuUser() {
  try {
    console.log('🔍 rberuユーザーを作成/更新します...\n');

    // まず、rberusapporo@hostclub.localでユーザーを作成してみる
    const oldEmail = 'rberusapporo@hostclub.local';
    const newEmail = 'rberu@hostclub.local';
    
    console.log('1️⃣ 古いメールアドレスでログインを試みます...');
    console.log(`   Email: ${oldEmail}`);
    
    // ログイン試行のメールアドレスリスト
    const emailsToTry = [
      'rberusapporo@hostclub.local',
      'rberu@hostclub.local',
      'rbelu@hostclub.local',
      'ルベル@hostclub.local'
    ];
    
    const passwordsToTry = ['0000', 'hostclub123', '1234'];
    
    console.log('\n2️⃣ 様々な組み合わせでログインを試みます...');
    
    for (const email of emailsToTry) {
      for (const password of passwordsToTry) {
        console.log(`\n試行中: ${email} / ${password}`);
        
        try {
          const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseAnonKey
            },
            body: JSON.stringify({
              email: email,
              password: password
            })
          });
          
          const result = await response.json();
          
          if (response.ok && result.access_token) {
            console.log(`✅ ログイン成功！`);
            console.log(`   正しいEmail: ${email}`);
            console.log(`   正しいPassword: ${password}`);
            console.log(`   User ID: ${result.user?.id}`);
            console.log(`   store_id: ${result.user?.user_metadata?.store_id}`);
            
            // 新しいユーザーを作成する必要がある場合のメッセージ
            if (email !== 'rberu@hostclub.local') {
              console.log('\n⚠️  メールアドレスが異なるため、新しいユーザーの作成が必要です。');
              console.log('   Supabaseダッシュボードで以下の操作を行ってください：');
              console.log('   1. Authentication → Users で該当ユーザーを探す');
              console.log('   2. ユーザーのuser_metadataを編集');
              console.log('   3. store_idを"rberu"に変更');
              console.log('   4. 必要に応じてメールアドレスも変更');
            }
            
            return;
          }
        } catch (error) {
          // ログイン失敗は想定内なので続行
        }
      }
    }
    
    console.log('\n❌ どの組み合わせでもログインできませんでした。');
    console.log('\n3️⃣ 新しいユーザーを作成します...');
    
    // Edge Functionを使用して新規作成
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
      console.log('\n✅ 新規ユーザー作成成功！');
      console.log('📝 ログイン情報:');
      console.log('   Email: rberu@hostclub.local');
      console.log('   Password: hostclub123');
    } else {
      console.error('\n❌ エラー:', result.error);
    }

  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
  }
}

// スクリプトを実行
createOrUpdateRberuUser();