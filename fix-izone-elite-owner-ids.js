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

async function fixOwnerIds() {
  console.log('🔧 アイズワンとエリートのowner_idを修正します...\n')
  
  try {
    // 1. ユーザー情報を取得
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ ユーザー一覧取得エラー:', authError)
      return
    }
    
    const izoneUser = authData.users.find(u => u.email === 'izone@hostclub.local')
    const eliteUser = authData.users.find(u => u.email === 'elite@hostclub.local')
    
    if (!izoneUser) {
      console.error('❌ izone@hostclub.localユーザーが見つかりません')
      return
    }
    
    if (!eliteUser) {
      console.error('❌ elite@hostclub.localユーザーが見つかりません')
      return
    }
    
    console.log('✅ ユーザー情報取得完了:')
    console.log('  Izone User ID:', izoneUser.id)
    console.log('  Elite User ID:', eliteUser.id)
    console.log('')
    
    // 2. stores テーブルのレコードを取得
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .in('name', ['アイズワン', 'エリート'])
    
    if (storesError) {
      console.error('❌ ストア取得エラー:', storesError)
      return
    }
    
    const izoneStore = stores.find(s => s.name === 'アイズワン')
    const eliteStore = stores.find(s => s.name === 'エリート')
    
    if (!izoneStore) {
      console.error('❌ アイズワンのストアレコードが見つかりません')
      return
    }
    
    if (!eliteStore) {
      console.error('❌ エリートのストアレコードが見つかりません')
      return
    }
    
    console.log('✅ ストア情報取得完了:')
    console.log('  Izone Store ID:', izoneStore.id)
    console.log('  Elite Store ID:', eliteStore.id)
    console.log('')
    
    // 3. アイズワンのowner_idを更新
    console.log('📝 アイズワンのowner_idを更新中...')
    const { error: izoneUpdateError } = await supabase
      .from('stores')
      .update({ owner_id: izoneUser.id })
      .eq('id', izoneStore.id)
    
    if (izoneUpdateError) {
      console.error('❌ アイズワン更新エラー:', izoneUpdateError)
      return
    }
    
    console.log('✅ アイズワンのowner_idを更新しました')
    
    // 4. エリートのowner_idを更新
    console.log('📝 エリートのowner_idを更新中...')
    const { error: eliteUpdateError } = await supabase
      .from('stores')
      .update({ owner_id: eliteUser.id })
      .eq('id', eliteStore.id)
    
    if (eliteUpdateError) {
      console.error('❌ エリート更新エラー:', eliteUpdateError)
      return
    }
    
    console.log('✅ エリートのowner_idを更新しました')
    
    // 5. 更新後の確認
    console.log('\n=== 更新後の確認 ===\n')
    const { data: updatedStores, error: checkError } = await supabase
      .from('stores')
      .select('id, name, owner_id')
      .in('name', ['アイズワン', 'エリート'])
    
    if (updatedStores) {
      updatedStores.forEach(store => {
        console.log(`📍 ${store.name}:`)
        console.log('   Store ID:', store.id)
        console.log('   Owner ID:', store.owner_id)
        
        if (store.name === 'アイズワン' && store.owner_id === izoneUser.id) {
          console.log('   ✅ owner_idが正しく設定されています')
        } else if (store.name === 'エリート' && store.owner_id === eliteUser.id) {
          console.log('   ✅ owner_idが正しく設定されています')
        } else {
          console.log('   ❌ owner_idが正しくありません')
        }
        console.log('')
      })
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ 修正完了！ログイン情報:')
    console.log('='.repeat(60))
    console.log('\n📋 アイズワン:')
    console.log('  URL: https://susukino-hostclub-guide.online/store/izone')
    console.log('  Email: izone@hostclub.local')
    console.log('  Password: Izone@Club2025!')
    console.log('\n📋 エリート:')
    console.log('  URL: https://susukino-hostclub-guide.online/store/elite')
    console.log('  Email: elite@hostclub.local')
    console.log('  Password: Elite@Club2025!')
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
fixOwnerIds().catch(console.error)