import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// .env.localファイルから環境変数を読み込む
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  console.error('必要な環境変数:')
  console.error('- VITE_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Service Roleキーを使用してSupabaseクライアントを作成
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 店舗情報を指定（必要に応じて変更）
const storeInfo = {
  store_id: '', // ここに店舗IDを入力
  store_name: '', // ここに店舗名を入力
}

async function createStoreUser(store) {
  if (!store.store_id || !store.store_name) {
    console.error('❌ store_idとstore_nameを指定してください')
    console.log('例: store_id: "newstore", store_name: "新店舗"')
    return
  }

  const email = `${store.store_id}@hostclub.local`
  const password = `${store.store_id.charAt(0).toUpperCase()}${store.store_id.slice(1)}@Club2025!`
  
  console.log(`\n📍 ${store.store_name}（${store.store_id}）のアカウント作成中...`)
  
  try {
    // まず既存のユーザーを確認
    const { data: existingUsers, error: fetchError } = await supabase.auth.admin.listUsers()
    
    if (fetchError) {
      console.error(`❌ ユーザー一覧取得エラー:`, fetchError)
      return
    }
    
    const existingUser = existingUsers?.users?.find(u => u.email === email)
    
    if (existingUser) {
      console.log(`⚠️  ${email} は既に存在します。`)
      console.log(`   ユーザーID: ${existingUser.id}`)
      
      // パスワードをリセット
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          password: password,
          user_metadata: {
            role: 'customer',
            store_id: store.store_id,
            store_name: store.store_name
          }
        }
      )
      
      if (updateError) {
        console.error(`❌ パスワード更新エラー:`, updateError)
        return
      }
      
      console.log(`✅ パスワードを更新しました`)
      
    } else {
      // 新規ユーザー作成
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          role: 'customer',
          store_id: store.store_id,
          store_name: store.store_name
        }
      })
      
      if (createError) {
        console.error(`❌ ユーザー作成エラー:`, createError)
        return
      }
      
      console.log(`✅ ${store.store_name}のアカウントを作成しました`)
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('📋 ログイン情報:')
    console.log('='.repeat(60))
    console.log(`📍 URL: https://customer.susukino-hostclub-guide.online/store/${store.store_id}`)
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Password: ${password}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error(`❌ ${store.store_name}の処理中にエラー:`, error)
  }
}

// 使用例
// createStoreUser(storeInfo).catch(console.error)

// 複数店舗を一括作成する場合
async function createMultipleStoreUsers() {
  // storesテーブルから全店舗を取得
  const { data: stores, error } = await supabase
    .from('stores')
    .select('store_id, name')
    .order('created_at', { ascending: false })
    .limit(10) // 最新10件
  
  if (error) {
    console.error('店舗データ取得エラー:', error)
    return
  }
  
  console.log(`📊 ${stores.length}件の店舗を確認します...`)
  
  // 各店舗のユーザーを確認・作成
  for (const store of stores) {
    await createStoreUser({
      store_id: store.store_id,
      store_name: store.name
    })
    
    // 1秒待機（レート制限対策）
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

// 実行方法を選択
const args = process.argv.slice(2)

if (args[0] === '--all') {
  // 全店舗のユーザーを確認・作成
  console.log('🚀 全店舗のユーザー確認・作成を開始します...')
  createMultipleStoreUsers().catch(console.error)
} else if (args[0] && args[1]) {
  // 特定の店舗のユーザーを作成
  storeInfo.store_id = args[0]
  storeInfo.store_name = args[1]
  createStoreUser(storeInfo).catch(console.error)
} else {
  console.log('📝 使用方法:')
  console.log('  特定店舗: node create-store-user-manual.js [store_id] [store_name]')
  console.log('  例: node create-store-user-manual.js newstore "新店舗"')
  console.log('  全店舗: node create-store-user-manual.js --all')
}