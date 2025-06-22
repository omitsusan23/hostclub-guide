#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createClient } from '@supabase/supabase-js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// 環境変数の読み込み
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Supabase接続設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Vercel API設定
const vercelToken = process.env.VERCEL_TOKEN;
const vercelTeamId = process.env.VERCEL_TEAM_ID;
const baseDomain = process.env.BASE_DOMAIN || 'susukino-hostclub-guide.online';

/**
 * Vercel Domains APIでサブドメインを作成
 */
async function createSubdomain(storeId, projectId) {
  try {
    const subdomain = `${storeId}.${baseDomain}`;
    
    console.error(`🌐 Creating subdomain: ${subdomain}`);
    
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
    console.error(`✅ Subdomain created successfully:`, result);
    
    return {
      success: true,
      domain: subdomain,
      data: result
    };
  } catch (error) {
    console.error(`❌ Failed to create subdomain:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Supabaseに店舗データを追加
 */
async function addStoreToSupabase(storeData) {
  try {
    console.error(`🏪 Adding store to Supabase:`, storeData);
    
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
    
    console.error(`✅ Store added to Supabase:`, data);
    return { success: true, data };
  } catch (error) {
    console.error(`❌ Failed to add store to Supabase:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Supabaseに認証ユーザーを作成
 */
async function createStoreUser(storeId, storeName) {
  try {
    console.error(`👤 Creating user for store: ${storeId}`);
    
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
    
    console.error(`✅ User created successfully:`, data.user?.id);
    return { success: true, data };
  } catch (error) {
    console.error(`❌ Failed to create user:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// MCPサーバーの作成
const server = new Server(
  {
    name: 'vercel-store-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ツールリストの定義
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'create_store_with_subdomain',
        description: '新規店舗を作成し、自動的にサブドメインをセットアップします',
        inputSchema: {
          type: 'object',
          properties: {
            store_name: {
              type: 'string',
              description: '店舗名'
            },
            store_id: {
              type: 'string', 
              description: '店舗ID（サブドメインに使用）'
            },
            open_time: {
              type: 'string',
              description: '営業開始時間 (HH:MM形式)',
              default: '20:00'
            },
            close_time: {
              type: 'string',
              description: '営業終了時間 (HH:MM形式)', 
              default: '23:30'
            },
            base_price: {
              type: 'number',
              description: '基本料金',
              default: 0
            },
            vercel_project_id: {
              type: 'string',
              description: 'VercelプロジェクトID',
              default: 'prj_o42FtuXjf8sKIY0ifhgUedEGuehB'
            }
          },
          required: ['store_name', 'store_id']
        }
      },
      {
        name: 'check_subdomain_status',
        description: '指定したサブドメインの状況を確認します',
        inputSchema: {
          type: 'object',
          properties: {
            store_id: {
              type: 'string',
              description: '店舗ID'
            }
          },
          required: ['store_id']
        }
      }
    ]
  };
});

// ツール実行ハンドラー
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'create_store_with_subdomain') {
    try {
      const { store_name, store_id, open_time, close_time, base_price, vercel_project_id } = args;

      console.error(`🚀 Starting store creation process for: ${store_name} (${store_id})`);
      
      // 環境変数の確認
      if (!supabaseUrl || !supabaseServiceKey) {
        return {
          content: [
            {
              type: 'text',
              text: '❌ Supabase環境変数が設定されていません。NEXT_PUBLIC_SUPABASE_URLとSUPABASE_SERVICE_ROLE_KEYを設定してください。'
            }
          ]
        };
      }
      
      if (!vercelToken) {
        return {
          content: [
            {
              type: 'text',
              text: '❌ Vercel API Tokenが設定されていません。VERCEL_TOKENを設定してください。'
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
      const subdomainResult = await createSubdomain(store_id, vercel_project_id || 'prj_o42FtuXjf8sKIY0ifhgUedEGuehB');
      
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
            text: `❌ 予期しないエラーが発生しました: ${error.message}`
          }
        ]
      };
    }
  }

  if (name === 'check_subdomain_status') {
    try {
      const { store_id } = args;
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
            text: `⏳ サブドメイン ${args.store_id}.${baseDomain} は設定中です`
          }
        ]
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

// サーバー起動
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Vercel Store MCP Server started');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 