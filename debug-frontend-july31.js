import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// 環境変数を読み込み
dotenv.config({ path: '.env.local' })

// Supabaseクライアントを作成
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// フロントエンドの日付処理を再現
const formatLocalDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// デバッグ用ログ関数
const log = (message, data = null) => {
  console.log(`\n🔍 ${message}`)
  if (data) {
    console.log(JSON.stringify(data, null, 2))
  }
}

async function debugFrontendDateProcessing() {
  log('=== フロントエンドでの7月31日データ処理デバッグ ===')
  
  // 1. 7月のデータを取得（フロントエンドと同じ方法）
  const year = 2025
  const month = 6 // JavaScriptの月は0ベース
  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0)
  
  log('月の開始・終了日:', {
    startDate: startDate.toString(),
    startDateISO: startDate.toISOString(),
    endDate: endDate.toString(),
    endDateISO: endDate.toISOString()
  })
  
  // 2. データ取得
  const { data: records, error } = await supabase
    .from('staff_logs')
    .select('*')
    .gte('guided_at', startDate.toISOString())
    .lte('guided_at', endDate.toISOString())
    .order('guided_at', { ascending: false })
  
  if (error) {
    log('❌ データ取得エラー:', error)
    return
  }
  
  log(`✅ 7月の全データ: ${records.length}件`)
  
  // 3. 日付別にグループ化（フロントエンドと同じ処理）
  const dailyData = {}
  records.forEach(record => {
    const recordDate = formatLocalDate(new Date(record.guided_at))
    if (!dailyData[recordDate]) {
      dailyData[recordDate] = []
    }
    dailyData[recordDate].push(record)
  })
  
  log('日付別グループ化結果:')
  Object.keys(dailyData).sort().forEach(date => {
    log(`${date}: ${dailyData[date].length}件`)
  })
  
  // 4. 7月31日のデータを確認
  const july31Key = '2025-07-31'
  log(`\n📅 7月31日のデータ確認:`)
  
  if (dailyData[july31Key]) {
    log(`✅ ${july31Key}のデータ: ${dailyData[july31Key].length}件`)
    dailyData[july31Key].forEach((record, index) => {
      const guidedAt = new Date(record.guided_at)
      log(`${index + 1}. ${guidedAt.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })} - ${record.staff_name} (${record.store_id})`)
    })
  } else {
    log(`❌ ${july31Key}のデータがdailyDataに存在しません`)
    log('dailyDataのキー一覧:', Object.keys(dailyData).sort())
  }
  
  // 5. 特定の7月31日データを直接確認
  log('\n📊 7月31日のデータを直接検索:')
  
  const july31Records = records.filter(record => {
    const recordDate = formatLocalDate(new Date(record.guided_at))
    return recordDate === july31Key
  })
  
  log(`フィルタリング結果: ${july31Records.length}件`)
  
  // 6. タイムゾーン変換の問題を確認
  log('\n🕐 タイムゾーン変換の確認:')
  
  const sampleRecord = records.find(r => r.guided_at.includes('2025-07-31'))
  if (sampleRecord) {
    const guidedAt = new Date(sampleRecord.guided_at)
    log('サンプルレコード:', {
      guided_at_raw: sampleRecord.guided_at,
      date_object: guidedAt.toString(),
      formatLocalDate_result: formatLocalDate(guidedAt),
      toLocaleDateString: guidedAt.toLocaleDateString('ja-JP'),
      getDate: guidedAt.getDate(),
      getMonth: guidedAt.getMonth() + 1,
      getFullYear: guidedAt.getFullYear()
    })
  }
  
  // 7. エッジケースの確認
  log('\n⚠️ エッジケースの確認:')
  
  const edgeCases = [
    '2025-07-30T15:00:00.000Z', // UTC 15:00 = JST 00:00
    '2025-07-30T16:00:00.000Z', // UTC 16:00 = JST 01:00
    '2025-07-31T14:59:59.999Z', // UTC 14:59 = JST 23:59
    '2025-07-31T15:00:00.000Z', // UTC 15:00 = JST 00:00 (8月1日)
  ]
  
  edgeCases.forEach(dateStr => {
    const date = new Date(dateStr)
    log(`${dateStr} → formatLocalDate: ${formatLocalDate(date)}`)
  })
  
  log('\n=== デバッグ完了 ===')
}

// 実行
debugFrontendDateProcessing()