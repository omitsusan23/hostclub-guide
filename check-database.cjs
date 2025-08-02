const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.error('❌ 環境変数が設定されていません。')
  process.exit(1)
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkDatabase() {
  console.log('=== データベース状態確認 ===\n')
  
  try {
    // 各テーブルのデータ数を確認
    const tables = ['staff_logs', 'stores', 'staffs', 'store_holidays', 'schedules']
    
    for (const table of tables) {
      try {
        const { data, count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.log(`❌ ${table}: エラー - ${error.message}`)
        } else {
          console.log(`✅ ${table}: ${count || 0}件`)
        }
      } catch (e) {
        console.log(`❌ ${table}: アクセスエラー`)
      }
    }
    
    // staff_logsの詳細を確認
    console.log('\n📊 staff_logsテーブルの詳細:')
    const { data: staffLogs, error: logsError } = await supabase
      .from('staff_logs')
      .select('*')
      .limit(5)
    
    if (logsError) {
      console.log('エラー:', logsError.message)
    } else if (staffLogs && staffLogs.length > 0) {
      console.log('サンプルデータ:')
      staffLogs.forEach((log, i) => {
        console.log(`\n${i + 1}. ID: ${log.id}`)
        console.log(`   店舗: ${log.store_id}`)
        console.log(`   スタッフ: ${log.staff_name}`)
        console.log(`   人数: ${log.guest_count}`)
        console.log(`   案内時刻: ${log.guided_at}`)
      })
    } else {
      console.log('データが存在しません')
      
      // サンプルデータを追加するか確認
      console.log('\n💡 7月31日のテストデータを追加しますか？')
      console.log('確認のため、手動でデータを追加してください。')
      console.log('\n以下のようなデータを追加できます:')
      console.log(`
{
  store_id: "grand",
  guest_count: 3,
  staff_name: "テストスタッフ",
  guided_at: "2025-07-31T05:30:00.000Z", // 7月31日 14:30 JST
  staff_type: "staff"
}`)
    }
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

// 実行
checkDatabase()