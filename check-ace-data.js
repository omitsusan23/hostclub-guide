import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkAceData() {
  console.log('=== エース店のデータ確認 ===\n')
  
  try {
    // エース店のstore_idを確認
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('name', 'エース')
      .single()
    
    if (storeError) {
      console.error('店舗検索エラー:', storeError)
      return
    }
    
    console.log('店舗情報:', {
      name: store.name,
      store_id: store.store_id
    })
    
    // 7月のデータを取得（2025年7月1日〜7月31日）
    const julyStart = new Date(2025, 6, 1).toISOString() // JavaScriptは0ベース：6 = 7月
    const julyEnd = new Date(2025, 6, 31, 23, 59, 59).toISOString()
    
    const { data: julyData, error: julyError } = await supabase
      .from('staff_logs')
      .select('*')
      .eq('store_id', store.store_id)
      .gte('guided_at', julyStart)
      .lte('guided_at', julyEnd)
    
    if (julyError) {
      console.error('7月データ取得エラー:', julyError)
    } else {
      const julyTotal = julyData.reduce((sum, record) => sum + (record.guest_count || 0), 0)
      console.log(`\n7月の紹介実績: ${julyTotal}本 (${julyData.length}件)`)
    }
    
    // 8月のデータを取得（2025年8月1日〜8月31日）
    const augustStart = new Date(2025, 7, 1).toISOString() // JavaScriptは0ベース：7 = 8月
    const augustEnd = new Date(2025, 7, 31, 23, 59, 59).toISOString()
    
    const { data: augustData, error: augustError } = await supabase
      .from('staff_logs')
      .select('*')
      .eq('store_id', store.store_id)
      .gte('guided_at', augustStart)
      .lte('guided_at', augustEnd)
    
    if (augustError) {
      console.error('8月データ取得エラー:', augustError)
    } else {
      const augustTotal = augustData.reduce((sum, record) => sum + (record.guest_count || 0), 0)
      console.log(`8月の紹介実績: ${augustTotal}本 (${augustData.length}件)`)
    }
    
    // 全期間のデータも確認
    const { data: allData, error: allError } = await supabase
      .from('staff_logs')
      .select('*')
      .eq('store_id', store.store_id)
      .order('guided_at', { ascending: false })
    
    if (!allError && allData.length > 0) {
      console.log(`\n全期間の紹介実績: ${allData.length}件`)
      console.log('最新5件:')
      allData.slice(0, 5).forEach(record => {
        const date = new Date(record.guided_at)
        console.log(`  - ${date.toLocaleDateString('ja-JP')} ${date.toLocaleTimeString('ja-JP')}: ${record.guest_count}人`)
      })
    }
    
  } catch (error) {
    console.error('エラー:', error)
  }
  
  process.exit()
}

checkAceData()