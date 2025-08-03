import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// .env.localファイルから環境変数を読み込む
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

// Service Roleキーを使用してSupabaseクライアントを作成
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function updateWhitePassword() {
  console.log('🔐 ホワイトのパスワードを更新します...')
  
  try {
    // ユーザー一覧を取得
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ ユーザー一覧取得エラー:', listError)
      return
    }
    
    // white@hostclub.localユーザーを検索
    const whiteUser = users.users.find(u => u.email === 'white@hostclub.local')
    
    if (!whiteUser) {
      console.error('❌ white@hostclub.localユーザーが見つかりません')
      return
    }
    
    console.log('📍 ユーザー発見:', whiteUser.id)
    
    // パスワードを更新（より強力なパスワードを使用）
    const newPassword = 'White@Club2025!'
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      whiteUser.id,
      {
        password: newPassword,
        user_metadata: {
          role: 'customer',
          store_id: 'white',
          store_name: 'ホワイト'
        }
      }
    )
    
    if (updateError) {
      console.error('❌ パスワード更新エラー:', updateError)
      return
    }
    
    console.log('✅ パスワードを更新しました')
    console.log('\n' + '='.repeat(60))
    console.log('📋 ホワイトのログイン情報:')
    console.log('='.repeat(60))
    console.log('📍 URL: https://susukino-hostclub-guide.online/store/white')
    console.log('📧 Email: white@hostclub.local')
    console.log('🔑 Password: ' + newPassword)
    console.log('\n開発環境でのテスト:')
    console.log('http://localhost:5173/store/white')
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
updateWhitePassword().catch(console.error)