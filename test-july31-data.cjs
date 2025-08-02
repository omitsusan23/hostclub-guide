const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

console.log('環境変数チェック:')
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '設定済み' : '未設定')
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '設定済み' : '未設定')

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.error('❌ 環境変数が設定されていません。.env.local ファイルを確認してください。')
  process.exit(1)
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testJuly31Data() {
  console.log('=== 7月31日のデータ取得テスト ===\n')
  
  // 7月31日の時間範囲を計算（JST基準）
  const targetDate = new Date('2025-07-31')
  const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 1)
  const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1, 1)
  
  console.log('🗓️ 対象日付: 2025年7月31日')
  console.log('📍 開始時刻 (JST):', startOfDay.toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'}))
  console.log('📍 終了時刻 (JST):', endOfDay.toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'}))
  console.log('📍 開始時刻 (ISO/UTC):', startOfDay.toISOString())
  console.log('📍 終了時刻 (ISO/UTC):', endOfDay.toISOString())
  console.log()
  
  try {
    // 7月31日のデータを取得
    const { data: july31Records, error } = await supabase
      .from('staff_logs')
      .select('*')
      .gte('guided_at', startOfDay.toISOString())
      .lte('guided_at', endOfDay.toISOString())
      .order('guided_at', { ascending: false })
    
    if (error) {
      console.error('❌ エラー:', error)
      return
    }
    
    console.log(`✅ 7月31日の案内記録: ${july31Records.length}件\n`)
    
    if (july31Records.length > 0) {
      console.log('📊 詳細:')
      july31Records.forEach((record, index) => {
        const guidedAt = new Date(record.guided_at)
        console.log(`\n${index + 1}. ID: ${record.id}`)
        console.log(`   店舗: ${record.store_id}`)
        console.log(`   スタッフ: ${record.staff_name}`)
        console.log(`   人数: ${record.guest_count}人`)
        console.log(`   タイプ: ${record.staff_type || 'staff'}`)
        console.log(`   案内時刻 (JST): ${guidedAt.toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'})}`)
        console.log(`   案内時刻 (ISO): ${record.guided_at}`)
      })
    }
    
    // より広い範囲でも確認（7月30日16時～8月1日16時 UTC）
    console.log('\n\n=== 拡張範囲での確認 ===')
    const extendedStart = new Date('2025-07-30T16:00:00.000Z')
    const extendedEnd = new Date('2025-08-01T16:00:00.000Z')
    
    const { data: extendedRecords, error: extError } = await supabase
      .from('staff_logs')
      .select('id, guided_at, store_id, staff_name, guest_count')
      .gte('guided_at', extendedStart.toISOString())
      .lte('guided_at', extendedEnd.toISOString())
      .order('guided_at', { ascending: true })
    
    if (!extError && extendedRecords) {
      console.log(`\n📊 7月30日16時UTC～8月1日16時UTC の全記録: ${extendedRecords.length}件`)
      
      // 日付ごとに集計
      const byDate = {}
      extendedRecords.forEach(record => {
        const date = new Date(record.guided_at).toLocaleDateString('ja-JP', {timeZone: 'Asia/Tokyo'})
        byDate[date] = (byDate[date] || 0) + 1
      })
      
      console.log('\n📅 日付別件数:')
      Object.entries(byDate).forEach(([date, count]) => {
        console.log(`   ${date}: ${count}件`)
      })
    }
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

// 実行
testJuly31Data()