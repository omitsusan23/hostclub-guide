import { z } from 'zod';
import { createMcpHandler } from '@vercel/mcp-adapter';
import { createClient } from '@supabase/supabase-js';

// Supabase接続設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-key';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Vercel API設定
const vercelToken = process.env.VERCEL_TOKEN || 'dummy-token';
const vercelTeamId = process.env.VERCEL_TEAM_ID;
const baseDomain = process.env.BASE_DOMAIN || 'susukino-hostclub-guide.online';

/**
 * Vercel Domains APIでサブドメインを作成
 */
async function createSubdomain(storeId: string, projectId: string) {
  try {
    const subdomain = `${storeId}.${baseDomain}`;
    
    console.log(`🌐 Creating subdomain: ${subdomain}`);
    
    const response = await fetch(`https://api.vercel.com/v10/projects/${projectId}/domains`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
        ...(vercelTeamId && { 'X-Vercel-Team-Id': vercelTeamId })
      },
      body: JSON.stringify({
        name: subdomain,
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vercel API error: ${response.status} ${error}`);
    }

    const result = await response.json();
    console.log(`✅ Subdomain created successfully:`, result);
    
    return {
      success: true,
      domain: subdomain,
      data: result
    };
  } catch (error) {
    console.error(`❌ Failed to create subdomain:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Supabaseに店舗データを追加
 */
async function addStoreToSupabase(storeData: {
  name: string;
  store_id: string;
  open_time?: string;
  close_time?: string;
  base_price?: number;
}) {
  try {
    console.log(`🏪 Adding store to Supabase:`, storeData);
    
    const { data, error } = await supabase
      .from('stores')
      .insert([{
        name: storeData.name,
        store_id: storeData.store_id,
        open_time: storeData.open_time || '20:00',
        close_time: storeData.close_time || '23:30',
        base_price: storeData.base_price || 0,
        id_required: '顔＝保険証＋キャッシュ',
        male_price: 0,
        panel_fee: 120000,
        guarantee_count: 25,
        penalty_fee: 20000,
        unit_price: 1000,
        is_transfer: false,
        hoshos_url: null,
        store_phone: null
      }])
      .select();

    if (error) throw error;
    
    console.log(`✅ Store added to Supabase:`, data);
    return { success: true, data };
  } catch (error) {
    console.error(`❌ Failed to add store to Supabase:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Supabaseに認証ユーザーを作成
 */
async function createStoreUser(storeId: string, storeName: string) {
  try {
    console.log(`👤 Creating user for store: ${storeId}`);
    
    const email = `${storeId}@hostclub.local`;
    const password = 'hostclub123';
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'customer',
        store_id: storeId,
        store_name: storeName,
        email_verified: true
      }
    });

    if (error) throw error;
    
    console.log(`✅ User created successfully:`, data.user?.id);
    return { success: true, data };
  } catch (error) {
    console.error(`❌ Failed to create user:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

const handler = createMcpHandler(
  (server) => {
    // 店舗作成とサブドメイン自動生成ツール
    server.tool(
      'create_store_with_subdomain',
      '新規店舗を作成し、自動的にサブドメインをセットアップします',
      {
        store_name: z.string().describe('店舗名'),
        store_id: z.string().describe('店舗ID（サブドメインに使用）'),
        open_time: z.string().optional().describe('営業開始時間 (HH:MM形式)'),
        close_time: z.string().optional().describe('営業終了時間 (HH:MM形式)'),
        base_price: z.number().optional().describe('基本料金'),
        vercel_project_id: z.string().describe('VercelプロジェクトID')
      },
      async ({ store_name, store_id, open_time, close_time, base_price, vercel_project_id }) => {
        try {
          console.log(`🚀 Starting store creation process for: ${store_name} (${store_id})`);
          
          // 環境変数の確認
          if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ Supabase環境変数が設定されていません。NEXT_PUBLIC_SUPABASE_URLとSUPABASE_SERVICE_ROLE_KEYを設定してください。`
                }
              ]
            };
          }
          
          if (!process.env.VERCEL_TOKEN) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ Vercel API Tokenが設定されていません。VERCEL_TOKENを設定してください。`
                }
              ]
            };
          }
          
          // 1. Supabaseに店舗データを追加
          const storeResult = await addStoreToSupabase({
            name: store_name,
            store_id,
            open_time,
            close_time,
            base_price
          });
          
          if (!storeResult.success) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ 店舗データの追加に失敗しました: ${storeResult.error}`
                }
              ]
            };
          }
          
          // 2. 認証ユーザーを作成
          const userResult = await createStoreUser(store_id, store_name);
          
          // 3. Vercelでサブドメインを作成
          const subdomainResult = await createSubdomain(store_id, vercel_project_id);
          
          if (!subdomainResult.success) {
            return {
              content: [
                {
                  type: 'text',
                  text: `⚠️ 店舗は作成されましたが、サブドメインの作成に失敗しました: ${subdomainResult.error}`
                }
              ]
            };
          }
          
          // 4. 成功レスポンス
          const responseText = `✅ 店舗「${store_name}」が正常に作成されました！

🏪 **店舗情報**
- 店舗名: ${store_name}
- 店舗ID: ${store_id}
- 営業時間: ${open_time || '20:00'} - ${close_time || '23:30'}

🌐 **サブドメイン**
- URL: https://${subdomainResult.domain}
- 数分以内にアクセス可能になります

👤 **ログイン情報**
- メール: ${store_id}@hostclub.local
- パスワード: hostclub123
${userResult.success ? '- ユーザー作成: ✅' : `- ユーザー作成: ❌ (${userResult.error})`}

🎯 **次の手順**
1. DNSの伝播を待つ（通常5-10分）
2. https://${subdomainResult.domain} にアクセス
3. 上記のログイン情報でテスト`;

          return {
            content: [
              {
                type: 'text',
                text: responseText
              }
            ]
          };
          
        } catch (error) {
          console.error(`❌ Unexpected error:`, error);
          return {
            content: [
              {
                type: 'text',
                text: `❌ 予期しないエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`
              }
            ]
          };
        }
      }
    );

    // サブドメイン状況確認ツール
    server.tool(
      'check_subdomain_status',
      '指定したサブドメインの状況を確認します',
      {
        store_id: z.string().describe('店舗ID')
      },
      async ({ store_id }) => {
        try {
          const subdomain = `${store_id}.${baseDomain}`;
          
          // AbortControllerでタイムアウトを設定
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(`https://${subdomain}`, {
            method: 'HEAD',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          const status = response.ok ? '✅ アクティブ' : '⏳ 設定中';
          
          return {
            content: [
              {
                type: 'text',
                text: `🌐 サブドメイン状況: ${subdomain}\nステータス: ${status}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `⏳ サブドメイン ${store_id}.${baseDomain} は設定中です`
              }
            ]
          };
        }
      }
    );
  },
  {},
  { basePath: '/api' }
);

export { handler as GET, handler as POST, handler as DELETE }; 