import { supabase } from './supabase'

// 店舗データ取得
export const getStores = async () => {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('店舗データ取得エラー:', error)
    return []
  }
  
  return data || []
}

export const getStoreById = async (storeId) => {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('store_id', storeId)
    .single()
  
  if (error) {
    console.error('店舗データ取得エラー:', error)
    return null
  }
  
  return data
}

export const getStoreBySubdomain = async (subdomain) => {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('store_id', subdomain)
    .single()
  
  if (error) {
    console.error('店舗データ取得エラー:', error)
    return null
  }
  
  return data
}

// 案内記録取得（特定店舗）
export const getVisitRecordsByStoreId = async (storeId) => {
  const { data, error } = await supabase
    .from('visit_records')
    .select(`
      *,
      staffs!visit_records_staff_id_fkey (
        display_name,
        staff_id
      )
    `)
    .eq('store_id', storeId)
    .order('visited_at', { ascending: false })
  
  if (error) {
    console.error('案内記録取得エラー:', error)
    return []
  }
  
  return data.map(record => ({
    id: record.id,
    store_id: record.store_id,
    staff_id: record.staff_id,
    staff_display_name: record.staffs?.display_name || '不明',
    visitor_count: record.visitor_count,
    visited_at: record.visited_at,
    notes: record.notes
  }))
}

// 今日の案内記録取得
export const getTodaysVisitRecords = async () => {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('visit_records')
    .select(`
      *,
      staffs!visit_records_staff_id_fkey (
        display_name,
        staff_id
      )
    `)
    .gte('visited_at', `${today}T00:00:00`)
    .lt('visited_at', `${today}T23:59:59`)
    .order('visited_at', { ascending: false })
  
  if (error) {
    console.error('今日の案内記録取得エラー:', error)
    return []
  }
  
  return data.map(record => ({
    id: record.id,
    store_id: record.store_id,
    staff_id: record.staff_id,
    staff_display_name: record.staffs?.display_name || '不明',
    visitor_count: record.visitor_count,
    visited_at: record.visited_at,
    notes: record.notes
  }))
}

// 案内記録保存
export const saveVisitRecord = async (visitData) => {
  const { data, error } = await supabase
    .from('visit_records')
    .insert({
      store_id: visitData.store_id,
      staff_id: visitData.staff_id,
      visitor_count: visitData.visitor_count,
      notes: visitData.notes,
      visited_at: visitData.visited_at || new Date().toISOString()
    })
    .select(`
      *,
      staffs!visit_records_staff_id_fkey (
        display_name,
        staff_id
      )
    `)
    .single()
  
  if (error) {
    console.error('案内記録保存エラー:', error)
    throw error
  }
  
  return {
    id: data.id,
    store_id: data.store_id,
    staff_id: data.staff_id,
    staff_display_name: data.staffs?.display_name || '不明',
    visitor_count: data.visitor_count,
    visited_at: data.visited_at,
    notes: data.notes
  }
}

// リアルタイム状況取得
export const getLatestStoreStatus = async (storeId) => {
  const { data, error } = await supabase
    .from('store_status')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (error && error.code !== 'PGRST116') { // "not found"以外のエラー
    console.error('店舗状況取得エラー:', error)
    return null
  }
  
  return data
}

// リアルタイム状況設定
export const setStoreStatus = async (storeId, statusType) => {
  const { data, error } = await supabase
    .from('store_status')
    .insert({
      store_id: storeId,
      status_type: statusType
    })
  
  if (error) {
    console.error('店舗状況設定エラー:', error)
    throw error
  }
  
  return data
}

// 請求設定関連（将来のテーブル用）
export const getInvoiceSettings = async (storeId) => {
  // TODO: invoice_settingsテーブル作成後に実装
  // 現在はハードコードされた値を返す
  return {
    base_fee: 30000,
    guaranteed_count: 8,
    guaranteed_penalty: 5000,
    price_per_introduction: 3000,
    price_per_shortfall: 5000,
    with_tax: true
  }
}

// スタッフチャット関連（将来のテーブル用）
export const getStaffChats = async () => {
  // TODO: staff_chatsテーブル作成後に実装
  return []
}

export const sendStaffChat = async (message) => {
  // TODO: staff_chatsテーブル作成後に実装
  console.log('スタッフチャット送信:', message)
  return { success: true }
} 