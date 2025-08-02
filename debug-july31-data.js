import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// 環境変数を読み込み
dotenv.config({ path: '.env.local' })

// Supabaseクライアントを作成
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service Roleキーを使用してRLSをバイパス
)

// デバッグ用ログ関数
const log = (message, data = null) => {
  console.log(`\n🔍 ${message}`)
  if (data) {
    console.log(JSON.stringify(data, null, 2))
  }
}

// 7月31日のデータ取得をテスト
async function testJuly31Data() {
  try {
    log('=== 7月31日データ取得テスト開始 ===')
    
    // 1. Service Role Keyを使用しているため認証は不要
    log('✅ Service Role Keyを使用してRLSをバイパスします')
    
    // 2. 直接SQLクエリで7月31日のデータを確認
    log('\n📊 直接SQLクエリで7月31日のデータを確認...')
    
    // 2025年7月31日の日本時間1時から翌日1時まで
    const startOfDay = '2025-07-31T01:00:00.000Z'
    const endOfDay = '2025-08-01T01:00:00.000Z'
    
    const { data: directData, error: directError } = await supabase
      .from('staff_logs')
      .select('*')
      .gte('guided_at', startOfDay)
      .lte('guided_at', endOfDay)
      .order('guided_at', { ascending: false })
    
    if (directError) {
      log('❌ 直接クエリエラー:', directError)
    } else {
      log(`✅ 直接クエリ結果: ${directData.length}件のデータ`)
      if (directData.length > 0) {
        log('データサンプル:', directData.slice(0, 3))
      }
    }
    
    // 3. getSpecificDateVisitRecords関数の実装を再現
    log('\n📊 getSpecificDateVisitRecords関数の実装を再現...')
    
    const july31 = new Date('2025-07-31')
    // 関数内での日付計算を再現
    const funcStartOfDay = new Date(july31.getFullYear(), july31.getMonth(), july31.getDate(), 1).toISOString()
    const funcEndOfDay = new Date(july31.getFullYear(), july31.getMonth(), july31.getDate() + 1, 1).toISOString()
    
    log('関数で使用される日付範囲:', {
      startOfDay: funcStartOfDay,
      endOfDay: funcEndOfDay
    })
    
    const { data: funcData, error: funcError } = await supabase
      .from('staff_logs')
      .select('*')
      .gte('guided_at', funcStartOfDay)
      .lte('guided_at', funcEndOfDay)
      .order('guided_at', { ascending: false })
    
    if (funcError) {
      log('❌ 関数実装エラー:', funcError)
    } else {
      log(`✅ 関数実装結果: ${funcData.length}件のデータ`)
      if (funcData.length > 0) {
        log('データサンプル:', funcData.slice(0, 3))
      }
    }
    
    // 4. RLSポリシーの確認
    log('\n🔒 RLSポリシーの確認...')
    
    // staff_logsテーブルのRLSポリシーを確認
    const { data: policies, error: policyError } = await supabase
      .rpc('get_policies', { table_name: 'staff_logs' })
      .select('*')
    
    if (policyError) {
      log('⚠️ RLSポリシー確認エラー（通常のクエリで確認）:', policyError)
      
      // 代替方法：データ取得権限を確認
      const testQuery = await supabase
        .from('staff_logs')
        .select('count')
        .limit(1)
      
      if (testQuery.error) {
        log('❌ staff_logsテーブルへのアクセス権限なし:', testQuery.error)
      } else {
        log('✅ staff_logsテーブルへのアクセス権限あり')
      }
    } else {
      log('RLSポリシー:', policies)
    }
    
    // 5. 日付範囲のデータ分布を確認
    log('\n📅 7月末周辺のデータ分布を確認...')
    
    const dates = [
      { date: '2025-07-29', label: '7月29日' },
      { date: '2025-07-30', label: '7月30日' },
      { date: '2025-07-31', label: '7月31日' },
      { date: '2025-08-01', label: '8月1日' },
      { date: '2025-08-02', label: '8月2日' }
    ]
    
    for (const { date, label } of dates) {
      const targetDate = new Date(date)
      const dayStartOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 1).toISOString()
      const dayEndOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1, 1).toISOString()
      
      const { data: dayData } = await supabase
        .from('staff_logs')
        .select('*')
        .gte('guided_at', dayStartOfDay)
        .lte('guided_at', dayEndOfDay)
      
      log(`${label}: ${dayData?.length || 0}件`)
    }
    
    // 6. 特定の店舗でフィルタリングしてテスト
    log('\n🏪 店舗別データ取得テスト...')
    
    // まず全店舗を取得
    const { data: stores } = await supabase
      .from('stores')
      .select('store_id, name')
      .limit(5)
    
    if (stores && stores.length > 0) {
      for (const store of stores) {
        const { data: storeData } = await supabase
          .from('staff_logs')
          .select('*')
          .eq('store_id', store.store_id)
          .gte('guided_at', funcStartOfDay)
          .lte('guided_at', funcEndOfDay)
        
        log(`${store.name} (${store.store_id}): ${storeData?.length || 0}件`)
      }
    }
    
    // 7. staff_typeフィルタリングのテスト
    log('\n👥 staff_typeフィルタリングテスト...')
    
    const { data: staffData } = await supabase
      .from('staff_logs')
      .select('*')
      .eq('staff_type', 'staff')
      .gte('guided_at', funcStartOfDay)
      .lte('guided_at', funcEndOfDay)
    
    const { data: outstaffData } = await supabase
      .from('staff_logs')
      .select('*')
      .eq('staff_type', 'outstaff')
      .gte('guided_at', funcStartOfDay)
      .lte('guided_at', funcEndOfDay)
    
    const { data: bothData } = await supabase
      .from('staff_logs')
      .select('*')
      .gte('guided_at', funcStartOfDay)
      .lte('guided_at', funcEndOfDay)
    
    log(`staff: ${staffData?.length || 0}件`)
    log(`outstaff: ${outstaffData?.length || 0}件`)
    log(`both: ${bothData?.length || 0}件`)
    
    // 8. タイムゾーン関連の確認
    log('\n🕐 タイムゾーン関連の確認...')
    
    const testDate = new Date('2025-07-31')
    log('JavaScript Dateオブジェクト:', {
      toString: testDate.toString(),
      toISOString: testDate.toISOString(),
      toLocaleString: testDate.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
    })
    
    // getSpecificDateVisitRecords関数内での日付計算を再現
    const startOfDayCalc = new Date(testDate.getFullYear(), testDate.getMonth(), testDate.getDate(), 1).toISOString()
    const endOfDayCalc = new Date(testDate.getFullYear(), testDate.getMonth(), testDate.getDate() + 1, 1).toISOString()
    
    log('関数内での日付計算:', {
      startOfDay: startOfDayCalc,
      endOfDay: endOfDayCalc
    })
    
    log('\n=== テスト完了 ===')
    
  } catch (error) {
    log('❌ テストエラー:', error)
  } finally {
    process.exit(0)
  }
}

// テスト実行
testJuly31Data()