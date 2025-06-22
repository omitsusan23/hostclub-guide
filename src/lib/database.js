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

// 案内記録取得（staff_logs）
export const getVisitRecordsByStoreId = async (storeId) => {
  const { data, error } = await supabase
    .from('staff_logs')
    .select('*')
    .eq('store_id', storeId)
    .order('guided_at', { ascending: false })
  
  if (error) {
    console.error('案内記録取得エラー:', error)
    return []
  }
  
  // 既存のモックデータ形式に合わせてデータ変換
  return data.map(record => ({
    id: record.id,
    store_id: record.store_id,
    staff_id: record.staff_name,
    visitor_count: record.guest_count,
    visited_at: record.guided_at,
    deleted: false
  }))
}

// 今日の案内記録取得
export const getTodaysVisitRecords = async () => {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('staff_logs')
    .select('*')
    .gte('guided_at', `${today}T00:00:00`)
    .lt('guided_at', `${today}T23:59:59`)
    .order('guided_at', { ascending: false })
  
  if (error) {
    console.error('今日の案内記録取得エラー:', error)
    return []
  }
  
  return data.map(record => ({
    id: record.id,
    store_id: record.store_id,
    staff_id: record.staff_name,
    visitor_count: record.guest_count,
    visited_at: record.guided_at,
    deleted: false
  }))
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