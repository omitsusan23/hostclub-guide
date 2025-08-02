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

async function addJuly31TestData() {
  console.log('=== 7月31日のテストデータ追加 ===\n')
  
  try {
    // まず店舗データを追加（存在しない場合）
    const testStores = [
      { store_id: 'grand', name: 'グランド', owner_id: null },
      { store_id: 'lounge', name: 'ラウンジ', owner_id: null },
      { store_id: 'shine', name: 'シャイン', owner_id: null }
    ]
    
    console.log('📍 店舗データを確認/追加中...')
    for (const store of testStores) {
      const { data: existing } = await supabase
        .from('stores')
        .select('store_id')
        .eq('store_id', store.store_id)
        .single()
      
      if (!existing) {
        const { error } = await supabase
          .from('stores')
          .insert(store)
        
        if (error) {
          console.log(`❌ 店舗 ${store.name} の追加に失敗:`, error.message)
        } else {
          console.log(`✅ 店舗 ${store.name} を追加しました`)
        }
      } else {
        console.log(`ℹ️ 店舗 ${store.name} は既に存在します`)
      }
    }
    
    // 7月31日のテストデータ（JST時間で設定）
    const july31TestData = [
      {
        store_id: 'grand',
        guest_count: 3,
        staff_name: 'スタッフA',
        guided_at: new Date('2025-07-31T02:30:00+09:00').toISOString(), // 7月31日 2:30 JST
        staff_type: 'staff'
      },
      {
        store_id: 'lounge',
        guest_count: 2,
        staff_name: 'スタッフB',
        guided_at: new Date('2025-07-31T14:45:00+09:00').toISOString(), // 7月31日 14:45 JST
        staff_type: 'staff'
      },
      {
        store_id: 'shine',
        guest_count: 4,
        staff_name: 'スタッフC',
        guided_at: new Date('2025-07-31T19:00:00+09:00').toISOString(), // 7月31日 19:00 JST
        staff_type: 'staff'
      },
      {
        store_id: 'grand',
        guest_count: 1,
        staff_name: 'スタッフD',
        guided_at: new Date('2025-07-31T23:30:00+09:00').toISOString(), // 7月31日 23:30 JST
        staff_type: 'staff'
      },
      {
        store_id: 'lounge',
        guest_count: 2,
        staff_name: 'アウトスタッフA',
        guided_at: new Date('2025-07-31T16:00:00+09:00').toISOString(), // 7月31日 16:00 JST
        staff_type: 'outstaff',
        store_was_recommended: true
      }
    ]
    
    console.log('\n📊 7月31日の案内記録を追加中...')
    
    for (const record of july31TestData) {
      const { data, error } = await supabase
        .from('staff_logs')
        .insert(record)
        .select()
      
      if (error) {
        console.log(`❌ エラー:`, error.message)
      } else {
        const guidedAt = new Date(record.guided_at)
        console.log(`✅ 追加成功: ${record.staff_name} - ${record.store_id} - ${record.guest_count}人`)
        console.log(`   時刻 (JST): ${guidedAt.toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'})}`)
      }
    }
    
    // 追加したデータを確認
    console.log('\n📋 追加したデータの確認:')
    const targetDate = new Date('2025-07-31')
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 1).toISOString()
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1, 1).toISOString()
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('staff_logs')
      .select('*')
      .gte('guided_at', startOfDay)
      .lte('guided_at', endOfDay)
      .order('guided_at', { ascending: true })
    
    if (!verifyError && verifyData) {
      console.log(`\n✅ 7月31日の案内記録: ${verifyData.length}件`)
      verifyData.forEach((record, i) => {
        const guidedAt = new Date(record.guided_at)
        console.log(`\n${i + 1}. ${record.staff_name} (${record.staff_type})`)
        console.log(`   店舗: ${record.store_id}`)
        console.log(`   人数: ${record.guest_count}人`)
        console.log(`   時刻 (JST): ${guidedAt.toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'})}`)
      })
    }
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

// 実行
addJuly31TestData()