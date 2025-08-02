import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// 環境変数を読み込み
dotenv.config({ path: '.env.local' })

// Supabaseクライアントを作成
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// デバッグ用ログ関数
const log = (message, data = null) => {
  console.log(`\n🔍 ${message}`)
  if (data) {
    console.log(JSON.stringify(data, null, 2))
  }
}

async function analyzeTimezoneIssue() {
  log('=== タイムゾーン問題の詳細分析 ===')
  
  // 1. 問題の説明
  log('📌 問題の説明:')
  log('JavaScriptのnew Date("2025-07-31")は、ローカルタイムゾーン（JST）の00:00を作成')
  log('これをUTCに変換すると、前日の15:00または16:00になる')
  
  // 2. 具体的な例
  const july31 = new Date('2025-07-31')
  log('\n📅 new Date("2025-07-31")の結果:', {
    toString: july31.toString(),
    toISOString: july31.toISOString(),
    getDate: july31.getDate(),
    getMonth: july31.getMonth(),
    getFullYear: july31.getFullYear()
  })
  
  // 3. getSpecificDateVisitRecords関数の日付計算を再現
  log('\n⚠️ getSpecificDateVisitRecords関数の日付計算:')
  const startOfDay = new Date(july31.getFullYear(), july31.getMonth(), july31.getDate(), 1)
  const endOfDay = new Date(july31.getFullYear(), july31.getMonth(), july31.getDate() + 1, 1)
  
  log('startOfDay:', {
    toString: startOfDay.toString(),
    toISOString: startOfDay.toISOString()
  })
  
  log('endOfDay:', {
    toString: endOfDay.toString(),
    toISOString: endOfDay.toISOString()
  })
  
  log('\n❌ 問題: 日本時間の7月31日 1:00は、UTCでは7月30日 16:00になる！')
  log('そのため、7月30日の一部データも含まれてしまう')
  
  // 4. 正しい実装方法
  log('\n✅ 正しい実装方法:')
  
  // 方法1: UTC基準で日付を扱う
  const july31UTC = new Date(Date.UTC(2025, 6, 31)) // 月は0ベースなので6 = 7月
  const startOfDayUTC = new Date(Date.UTC(2025, 6, 31, 1, 0, 0))
  const endOfDayUTC = new Date(Date.UTC(2025, 7, 1, 1, 0, 0))
  
  log('方法1 - UTC基準:', {
    july31UTC: july31UTC.toISOString(),
    startOfDayUTC: startOfDayUTC.toISOString(),
    endOfDayUTC: endOfDayUTC.toISOString()
  })
  
  // 方法2: 文字列で直接指定
  const startOfDayString = '2025-07-31T01:00:00+09:00' // JST表記
  const endOfDayString = '2025-08-01T01:00:00+09:00'   // JST表記
  
  log('方法2 - 文字列直接指定:', {
    startOfDayString: new Date(startOfDayString).toISOString(),
    endOfDayString: new Date(endOfDayString).toISOString()
  })
  
  // 5. 実際のデータで確認
  log('\n📊 実際のデータで確認:')
  
  // 間違った範囲（現在の実装）
  const wrongStart = '2025-07-30T16:00:00.000Z'
  const wrongEnd = '2025-07-31T16:00:00.000Z'
  
  const { data: wrongData } = await supabase
    .from('staff_logs')
    .select('guided_at, staff_name, store_id')
    .gte('guided_at', wrongStart)
    .lte('guided_at', wrongEnd)
    .order('guided_at')
  
  log(`間違った範囲のデータ数: ${wrongData?.length || 0}件`)
  if (wrongData && wrongData.length > 0) {
    log('最初のデータ:', wrongData[0])
    log('最後のデータ:', wrongData[wrongData.length - 1])
  }
  
  // 正しい範囲
  const correctStart = '2025-07-31T01:00:00.000Z'
  const correctEnd = '2025-08-01T01:00:00.000Z'
  
  const { data: correctData } = await supabase
    .from('staff_logs')
    .select('guided_at, staff_name, store_id')
    .gte('guided_at', correctStart)
    .lte('guided_at', correctEnd)
    .order('guided_at')
  
  log(`\n正しい範囲のデータ数: ${correctData?.length || 0}件`)
  if (correctData && correctData.length > 0) {
    log('最初のデータ:', correctData[0])
    log('最後のデータ:', correctData[correctData.length - 1])
  }
  
  // 6. 7月30日の夜間データを確認
  log('\n🌙 7月30日の夜間データ（16:00-24:00 UTC）を確認:')
  
  const { data: nightData } = await supabase
    .from('staff_logs')
    .select('guided_at, staff_name, store_id')
    .gte('guided_at', '2025-07-30T16:00:00.000Z')
    .lt('guided_at', '2025-07-31T00:00:00.000Z')
    .order('guided_at')
  
  log(`7月30日夜間データ: ${nightData?.length || 0}件`)
  if (nightData && nightData.length > 0) {
    nightData.forEach((record, index) => {
      const jstTime = new Date(record.guided_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
      log(`${index + 1}. ${jstTime} - ${record.staff_name} (${record.store_id})`)
    })
  }
  
  log('\n=== 分析完了 ===')
}

// 実行
analyzeTimezoneIssue()