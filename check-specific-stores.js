import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// .env.localファイルから環境変数を読み込む
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSpecificStores() {
  console.log('🔍 指定された3店舗の情報を確認中...\n');

  const storeNames = ['エリート', 'アイズワン', 'ホワイト'];

  try {
    // 各店舗名で検索
    for (const storeName of storeNames) {
      console.log(`\n📍 "${storeName}" を検索中...`);
      
      const { data, error } = await supabase
        .from('stores')
        .select('store_id, name, created_at')
        .eq('name', storeName);

      if (error) {
        console.error(`❌ エラー: ${error.message}`);
        continue;
      }

      if (data && data.length > 0) {
        console.log(`✅ 見つかりました！`);
        data.forEach(store => {
          console.log(`   - store_id: ${store.store_id}`);
          console.log(`   - name: ${store.name}`);
          console.log(`   - created_at: ${store.created_at}`);
        });
      } else {
        console.log(`⚠️ "${storeName}" という名前の店舗は見つかりませんでした`);
      }
    }

    // 部分一致での検索も試みる
    console.log('\n\n📍 部分一致での検索も実行中...');
    for (const storeName of storeNames) {
      console.log(`\n🔍 "${storeName}" を含む店舗名を検索中...`);
      
      const { data, error } = await supabase
        .from('stores')
        .select('store_id, name')
        .ilike('name', `%${storeName}%`);

      if (error) {
        console.error(`❌ エラー: ${error.message}`);
        continue;
      }

      if (data && data.length > 0) {
        console.log(`✅ 部分一致で見つかった店舗:}`);
        data.forEach(store => {
          console.log(`   - store_id: ${store.store_id}, name: "${store.name}"`);
        });
      } else {
        console.log(`⚠️ "${storeName}" を含む店舗名は見つかりませんでした`);
      }
    }

    // 全店舗の一覧も表示（参考のため）
    console.log('\n\n📋 現在登録されている全店舗一覧:');
    const { data: allStores, error: allError } = await supabase
      .from('stores')
      .select('store_id, name')
      .order('name');

    if (allError) {
      console.error(`❌ エラー: ${allError.message}`);
    } else if (allStores && allStores.length > 0) {
      allStores.forEach(store => {
        console.log(`   - ${store.store_id}: ${store.name}`);
      });
      console.log(`\n合計: ${allStores.length} 店舗`);
    } else {
      console.log('⚠️ 登録されている店舗がありません');
    }

  } catch (err) {
    console.error('❌ 予期しないエラー:', err);
  }

  process.exit(0);
}

checkSpecificStores();