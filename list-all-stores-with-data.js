import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function listStoresWithData() {
  console.log('=== 全店舗と紹介データ確認 ===\n')
  
  try {
    // 全店舗を取得
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .order('name')
    
    if (storesError) {
      console.error('店舗取得エラー:', storesError)
      return
    }
    
    console.log(`店舗数: ${stores.length}件\n`)
    
    for (const store of stores) {
      console.log(`\n【${store.name}】 (store_id: ${store.store_id})`)
      
      // 7月のデータ
      const julyStart = '2025-07-01T00:00:00Z'
      const julyEnd = '2025-07-31T23:59:59Z'
      
      const { data: julyData } = await supabase
        .from('staff_logs')
        .select('*')
        .eq('store_id', store.store_id)
        .gte('guided_at', julyStart)
        .lte('guided_at', julyEnd)
      
      const julyTotal = julyData ? julyData.reduce((sum, r) => sum + (r.guest_count || 0), 0) : 0
      
      // 8月のデータ
      const augustStart = '2025-08-01T00:00:00Z'
      const augustEnd = '2025-08-31T23:59:59Z'
      
      const { data: augustData } = await supabase
        .from('staff_logs')
        .select('*')
        .eq('store_id', store.store_id)
        .gte('guided_at', augustStart)
        .lte('guided_at', augustEnd)
      
      const augustTotal = augustData ? augustData.reduce((sum, r) => sum + (r.guest_count || 0), 0) : 0
      
      console.log(`  7月: ${julyTotal}本 (${julyData?.length || 0}件)`)
      console.log(`  8月: ${augustTotal}本 (${augustData?.length || 0}件)`)
    }
    
  } catch (error) {
    console.error('エラー:', error)
  }
  
  process.exit()
}

listStoresWithData()