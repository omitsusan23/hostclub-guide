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

async function checkAceData() {
  console.log('=== エース店舗データの詳細確認 ===\n')
  
  try {
    // エース店舗の情報を詳細取得
    console.log('🏪 エース店舗の基本情報:')
    const { data: aceStore, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('store_id', 'ace')
      .single()
    
    if (storeError) {
      console.error('❌ 店舗情報取得エラー:', storeError)
    } else {
      console.log('✅ 店舗情報:', JSON.stringify(aceStore, null, 2))
    }
    
    console.log('\n📊 エース店舗の案内記録:')
    
    // エース店舗の全案内記録を取得
    const { data: aceRecords, error: recordsError } = await supabase
      .from('staff_logs')
      .select('*')
      .eq('store_id', 'ace')
      .order('guided_at', { ascending: false })
    
    if (recordsError) {
      console.error('❌ 案内記録取得エラー:', recordsError)
    } else {
      console.log(`✅ エース店舗の案内記録: ${aceRecords.length}件`)
      
      if (aceRecords.length > 0) {
        console.log('\n📅 案内記録詳細:')
        aceRecords.forEach((record, index) => {
          const guidedAt = new Date(record.guided_at)
          console.log(`\n${index + 1}. ID: ${record.id}`)
          console.log(`   案内時刻 (JST): ${guidedAt.toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'})}`)
          console.log(`   案内時刻 (ISO): ${record.guided_at}`)
          console.log(`   人数: ${record.guest_count}人`)
          console.log(`   スタッフ: ${record.staff_name}`)
          console.log(`   タイプ: ${record.staff_type || 'staff'}`)
        })
        
        // 月別集計
        console.log('\n📅 月別集計:')
        const monthlyData = {}
        aceRecords.forEach(record => {
          const date = new Date(record.guided_at)
          const yearMonth = `${date.getFullYear()}年${date.getMonth() + 1}月`
          if (!monthlyData[yearMonth]) {
            monthlyData[yearMonth] = 0
          }
          monthlyData[yearMonth] += record.guest_count
        })
        
        Object.entries(monthlyData).forEach(([month, count]) => {
          console.log(`   ${month}: ${count}人`)
        })
      }
    }
    
    // 全店舗の案内記録数もチェック
    console.log('\n🌍 全店舗の案内記録統計:')
    const { data: allRecords, error: allError } = await supabase
      .from('staff_logs')
      .select('store_id, guest_count, guided_at')
      .order('guided_at', { ascending: false })
      .limit(20)
    
    if (allError) {
      console.error('❌ 全記録取得エラー:', allError)
    } else {
      console.log(`✅ 直近20件の案内記録:`)
      if (allRecords.length === 0) {
        console.log('   ⚠️ データベースに案内記録がありません')
      } else {
        allRecords.forEach((record, index) => {
          const date = new Date(record.guided_at)
          console.log(`   ${index + 1}. ${record.store_id}: ${record.guest_count}人 (${date.toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'})})`)
        })
      }
    }
    
    // 特定の日付範囲でのチェック（7月と8月）
    console.log('\n📅 7月・8月の全店舗データ:')
    
    // 7月のデータ
    const july2025Start = '2025-07-01T00:00:00.000Z'
    const july2025End = '2025-07-31T23:59:59.999Z'
    
    const { data: julyData, error: julyError } = await supabase
      .from('staff_logs')
      .select('store_id, guest_count, guided_at')
      .gte('guided_at', july2025Start)
      .lte('guided_at', july2025End)
    
    if (!julyError && julyData) {
      console.log(`✅ 2025年7月の全記録: ${julyData.length}件`)
      const julyStoreData = {}
      julyData.forEach(record => {
        if (!julyStoreData[record.store_id]) {
          julyStoreData[record.store_id] = 0
        }
        julyStoreData[record.store_id] += record.guest_count
      })
      
      Object.entries(julyStoreData).forEach(([storeId, count]) => {
        console.log(`   ${storeId}: ${count}人`)
      })
      
      const aceJulyCount = julyStoreData['ace'] || 0
      console.log(`\n🎯 エース店舗の7月実績: ${aceJulyCount}人`)
    }
    
    // 8月のデータ
    const august2025Start = '2025-08-01T00:00:00.000Z'
    const august2025End = '2025-08-31T23:59:59.999Z'
    
    const { data: augustData, error: augustError } = await supabase
      .from('staff_logs')
      .select('store_id, guest_count, guided_at')
      .gte('guided_at', august2025Start)
      .lte('guided_at', august2025End)
    
    if (!augustError && augustData) {
      console.log(`\n✅ 2025年8月の全記録: ${augustData.length}件`)
      const augustStoreData = {}
      augustData.forEach(record => {
        if (!augustStoreData[record.store_id]) {
          augustStoreData[record.store_id] = 0
        }
        augustStoreData[record.store_id] += record.guest_count
      })
      
      Object.entries(augustStoreData).forEach(([storeId, count]) => {
        console.log(`   ${storeId}: ${count}人`)
      })
      
      const aceAugustCount = augustStoreData['ace'] || 0
      console.log(`\n🎯 エース店舗の8月実績: ${aceAugustCount}人`)
    }
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

// 実行
checkAceData()