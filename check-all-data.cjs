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

async function checkAllData() {
  console.log('=== 全案内記録の確認 ===\n')
  
  try {
    // 全データを取得（最新100件）
    const { data: allRecords, error } = await supabase
      .from('staff_logs')
      .select('*')
      .order('guided_at', { ascending: false })
      .limit(100)
    
    if (error) {
      console.error('❌ エラー:', error)
      return
    }
    
    console.log(`✅ 全案内記録: ${allRecords.length}件\n`)
    
    if (allRecords.length > 0) {
      // 日付別に集計
      const byDate = {}
      allRecords.forEach(record => {
        const guidedAt = new Date(record.guided_at)
        const dateJST = guidedAt.toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'})
        const dateUTC = guidedAt.toLocaleDateString('ja-JP', {timeZone: 'UTC'})
        
        if (!byDate[dateJST]) {
          byDate[dateJST] = []
        }
        byDate[dateJST].push({
          id: record.id,
          guided_at: record.guided_at,
          guided_at_jst: guidedAt.toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'}),
          guided_at_utc: guidedAt.toLocaleString('ja-JP', {timeZone: 'UTC'}),
          store_id: record.store_id,
          staff_name: record.staff_name,
          guest_count: record.guest_count
        })
      })
      
      console.log('📅 日付別案内記録（JST基準）:')
      Object.entries(byDate).sort().reverse().forEach(([date, records]) => {
        console.log(`\n${date}: ${records.length}件`)
        records.slice(0, 3).forEach((record, i) => {
          console.log(`  ${i + 1}. ID: ${record.id}`)
          console.log(`     案内時刻 (JST): ${record.guided_at_jst}`)
          console.log(`     案内時刻 (UTC): ${record.guided_at_utc}`)
          console.log(`     案内時刻 (ISO): ${record.guided_at}`)
          console.log(`     店舗: ${record.store_id}, スタッフ: ${record.staff_name}`)
        })
        if (records.length > 3) {
          console.log(`  ... 他 ${records.length - 3} 件`)
        }
      })
      
      // 最初と最後のデータ
      console.log('\n\n📊 データ範囲:')
      const oldestRecord = allRecords[allRecords.length - 1]
      const newestRecord = allRecords[0]
      
      console.log('最古のデータ:')
      console.log(`  ID: ${oldestRecord.id}`)
      console.log(`  案内時刻 (JST): ${new Date(oldestRecord.guided_at).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'})}`)
      console.log(`  案内時刻 (ISO): ${oldestRecord.guided_at}`)
      
      console.log('\n最新のデータ:')
      console.log(`  ID: ${newestRecord.id}`)
      console.log(`  案内時刻 (JST): ${new Date(newestRecord.guided_at).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'})}`)
      console.log(`  案内時刻 (ISO): ${newestRecord.guided_at}`)
    }
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

// 実行
checkAllData()