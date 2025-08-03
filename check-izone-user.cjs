const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

// 通常のクライアント（フロントエンドと同じ）
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testIzoneLogin() {
  console.log('🔐 アイズワンのログインテスト...')
  console.log('Email: izone@hostclub.local')
  console.log('Password: Izone@Club2025!')
  console.log('-'.repeat(60))
  
  try {
    // ログイン試行
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'izone@hostclub.local',
      password: 'Izone@Club2025!'
    })
    
    if (error) {
      console.error('❌ ログインエラー:', error.message)
      console.error('詳細:', error)
      return
    }
    
    console.log('✅ ログイン成功！')
    console.log('ユーザーID:', data.user.id)
    console.log('Email:', data.user.email)
    console.log('Role:', data.user.user_metadata.role)
    console.log('Store ID:', data.user.user_metadata.store_id)
    console.log('Store Name:', data.user.user_metadata.store_name)
    
    // ストアデータを取得してみる
    console.log('\n📊 ストアデータ取得テスト...')
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('store_id', 'izone')
      .single()
    
    if (storeError) {
      console.error('❌ ストアデータ取得エラー:', storeError.message)
    } else {
      console.log('✅ ストアデータ取得成功:')
      console.log('  - 店舗名:', storeData.name)
      console.log('  - 店舗ID:', storeData.store_id)
      console.log('  - 基本料金:', storeData.base_fee)
      console.log('  - 保証件数:', storeData.guarantee_count)
    }
    
    // ログアウト
    await supabase.auth.signOut()
    console.log('\n✅ ログアウト完了')
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

// エリートのテストも実行
async function testEliteLogin() {
  console.log('\n' + '='.repeat(60))
  console.log('🔐 エリートのログインテスト...')
  console.log('Email: elite@hostclub.local')
  console.log('Password: Elite@Club2025!')
  console.log('-'.repeat(60))
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'elite@hostclub.local',
      password: 'Elite@Club2025!'
    })
    
    if (error) {
      console.error('❌ ログインエラー:', error.message)
      return
    }
    
    console.log('✅ ログイン成功！')
    console.log('ユーザーID:', data.user.id)
    console.log('Store ID:', data.user.user_metadata.store_id)
    
    await supabase.auth.signOut()
    console.log('✅ ログアウト完了')
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

// 実行
async function main() {
  await testIzoneLogin()
  await testEliteLogin()
  
  console.log('\n' + '='.repeat(60))
  console.log('📝 ログイン情報まとめ:')
  console.log('='.repeat(60))
  console.log('\n【アイズワン】')
  console.log('URL: https://susukino-hostclub-guide.online/store/izone')
  console.log('Email: izone@hostclub.local')
  console.log('Password: Izone@Club2025!')
  console.log('\n【エリート】')
  console.log('URL: https://susukino-hostclub-guide.online/store/elite')
  console.log('Email: elite@hostclub.local')
  console.log('Password: Elite@Club2025!')
  console.log('\n【ホワイト】')
  console.log('URL: https://susukino-hostclub-guide.online/store/white')
  console.log('Email: white@hostclub.local')
  console.log('Password: White@Club2025!')
}

main().catch(console.error)