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

const stores = [
  {
    name: 'エリート',
    store_id: 'elite',
    email: 'elite@hostclub.local',
    password: 'hostclub123'
  },
  {
    name: 'アイズワン', 
    store_id: 'izone',
    email: 'izone@hostclub.local',
    password: 'hostclub123'
  },
  {
    name: 'ホワイト',
    store_id: 'white',
    email: 'white@hostclub.local',
    password: 'hostclub123'
  }
]

async function createStoreUsers() {
  console.log('🚀 3店舗のユーザーアカウント作成を開始します...')
  
  for (const store of stores) {
    console.log(`\n📍 ${store.name}（${store.store_id}）のアカウント作成中...`)
    
    try {
      // まず既存のユーザーを確認
      const { data: existingUsers, error: fetchError } = await supabase.auth.admin.listUsers()
      
      if (fetchError) {
        console.error(`❌ ユーザー一覧取得エラー:`, fetchError)
        continue
      }
      
      const existingUser = existingUsers?.users?.find(u => u.email === store.email)
      
      if (existingUser) {
        console.log(`⚠️  ${store.email} は既に存在します。メタデータを更新します...`)
        
        // メタデータを更新
        const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          {
            user_metadata: {
              role: 'customer',
              store_id: store.store_id,
              store_name: store.name
            }
          }
        )
        
        if (updateError) {
          console.error(`❌ メタデータ更新エラー:`, updateError)
        } else {
          console.log(`✅ ${store.name}のメタデータを更新しました`)
        }
        
      } else {
        // 新規ユーザー作成
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: store.email,
          password: store.password,
          email_confirm: true,
          user_metadata: {
            role: 'customer',
            store_id: store.store_id,
            store_name: store.name
          }
        })
        
        if (createError) {
          console.error(`❌ ユーザー作成エラー:`, createError)
        } else {
          console.log(`✅ ${store.name}のアカウントを作成しました`)
          console.log(`   - Email: ${store.email}`)
          console.log(`   - Password: ${store.password}`)
          console.log(`   - Store ID: ${store.store_id}`)
        }
      }
      
    } catch (error) {
      console.error(`❌ ${store.name}の処理中にエラー:`, error)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('📋 アクセス方法:')
  console.log('='.repeat(60))
  
  for (const store of stores) {
    console.log(`\n【${store.name}】`)
    console.log(`📍 URL: https://yourdomain.com/store/${store.store_id}`)
    console.log(`📧 Email: ${store.email}`)
    console.log(`🔑 Password: ${store.password}`)
    console.log(`\n開発環境でのテスト:`)
    console.log(`http://localhost:5173/store/${store.store_id}`)
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✨ 処理が完了しました!')
}

// 実行
createStoreUsers().catch(console.error)