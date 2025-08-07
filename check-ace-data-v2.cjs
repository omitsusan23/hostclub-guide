const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkAceData() {
  console.log('=== 全店舗の7月・8月データ確認 ===\n')
  
  try {
    // まず全店舗を確認
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .order('name')
    
    if (storesError) {
      console.error('店舗取得エラー:', storesError)
      return
    }
    
    console.log(`全店舗数: ${stores.length}店舗\n`)
    
    for (const store of stores) {
      console.log(`\n【${store.name}】 (store_id: ${store.store_id})`)
      
      // 7月のデータを取得
      const julyStart = '2025-07-01T00:00:00.000Z'
      const julyEnd = '2025-07-31T23:59:59.999Z'
      
      const { data: julyData, error: julyError } = await supabase
        .from('staff_logs')
        .select('*')
        .eq('store_id', store.store_id)
        .gte('guided_at', julyStart)
        .lte('guided_at', julyEnd)
      
      if (!julyError && julyData) {
        const julyTotal = julyData.reduce((sum, record) => sum + (record.guest_count || 0), 0)
        console.log(`  7月: ${julyTotal}本 (${julyData.length}件)`)
      }
      
      // 8月のデータを取得
      const augustStart = '2025-08-01T00:00:00.000Z'
      const augustEnd = '2025-08-31T23:59:59.999Z'
      
      const { data: augustData, error: augustError } = await supabase
        .from('staff_logs')
        .select('*')
        .eq('store_id', store.store_id)
        .gte('guided_at', augustStart)
        .lte('guided_at', augustEnd)
      
      if (!augustError && augustData) {
        const augustTotal = augustData.reduce((sum, record) => sum + (record.guest_count || 0), 0)
        console.log(`  8月: ${augustTotal}本 (${augustData.length}件)`)
      }
    }
    
    // エースという名前を含む店舗を探す
    const aceStore = stores.find(s => s.name.includes('エース') || s.store_id.includes('ace'))
    if (aceStore) {
      console.log('\n\n=== エース店詳細 ===')
      console.log('店舗情報:', aceStore)
    }
    
  } catch (error) {
    console.error('エラー:', error)
  }
  
  process.exit()
}

checkAceData()