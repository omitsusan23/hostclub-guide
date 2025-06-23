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

// ローカル日付を正しいフォーマットに変換する関数
const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 本日の営業店舗データを取得（admin/staff用）
export const getTodayOpenStores = async () => {
  try {
    const today = formatLocalDate(new Date()); // YYYY-MM-DD形式

    // 全店舗を取得
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .order('name')

    if (storesError) throw storesError

    // 本日の店休日データを取得
    const { data: todayHolidays, error: holidaysError } = await supabase
      .from('store_holidays')
      .select('store_id')
      .eq('date', today)

    if (holidaysError) throw holidaysError

    // 店休日の店舗IDセットを作成
    const holidayStoreIds = new Set(todayHolidays.map(h => h.store_id))

    // 今月の範囲を計算
    const now = new Date()
    const currentMonthStart = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1))
    const currentMonthEnd = formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))

    // 各店舗の今月の店休日更新状況をチェック
    const storeHolidayUpdates = await Promise.all(
      stores.map(async (store) => {
        const { data: monthlyHolidays, error } = await supabase
          .from('store_holidays')
          .select('date')
          .eq('store_id', store.store_id)
          .gte('date', currentMonthStart)
          .lte('date', currentMonthEnd)

        if (error) {
          console.error(`店舗 ${store.store_id} の店休日取得エラー:`, error)
          return { store_id: store.store_id, hasUpdated: false }
        }

        // 今月の店休日設定があるかチェック
        return { 
          store_id: store.store_id, 
          hasUpdated: monthlyHolidays && monthlyHolidays.length > 0 
        }
      })
    )

    // 更新状況マップを作成
    const updateStatusMap = new Map()
    storeHolidayUpdates.forEach(status => {
      updateStatusMap.set(status.store_id, status.hasUpdated)
    })

    // 営業中の店舗のみフィルタリング（本日が店休日でない店舗）
    const openStores = stores
      .filter(store => !holidayStoreIds.has(store.store_id))
      .map(store => ({
        ...store,
        hasMonthlyUpdate: updateStatusMap.get(store.store_id) || false
      }))

    return { success: true, data: openStores }
  } catch (error) {
    console.error('本日の営業店舗取得エラー:', error)
    return { success: false, error: error.message }
  }
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

// 案内記録を取得
export const getVisitRecords = async (storeId = null, startDate = null, endDate = null) => {
  let query = supabase
    .from('visit_records')
    .select('*')
    .order('visited_at', { ascending: false })

  if (storeId) {
    query = query.eq('store_id', storeId)
  }

  if (startDate) {
    query = query.gte('visited_at', startDate)
  }

  if (endDate) {
    query = query.lte('visited_at', endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('案内記録取得エラー:', error)
    return []
  }

  return data || []
}

// 今日の案内記録を取得
export const getTodayVisitRecords = async (storeId = null) => {
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()
  
  return await getVisitRecords(storeId, startOfDay, endOfDay)
}

// 月間案内記録を取得
export const getMonthlyVisitRecords = async (storeId = null, year = null, month = null) => {
  const now = new Date()
  const targetYear = year || now.getFullYear()
  const targetMonth = month !== null ? month : now.getMonth()
  
  const startOfMonth = new Date(targetYear, targetMonth, 1).toISOString()
  const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59).toISOString()
  
  return await getVisitRecords(storeId, startOfMonth, endOfMonth)
}

// 案内記録を追加
export const addVisitRecord = async (visitData) => {
  const { data, error } = await supabase
    .from('visit_records')
    .insert({
      store_id: visitData.store_id,
      guest_count: visitData.guest_count,
      staff_name: visitData.staff_name,
      visited_at: visitData.visited_at || new Date().toISOString(),
      notes: visitData.notes || null,
      purpose: visitData.purpose || '案内'
    })
    .select()

  if (error) {
    console.error('案内記録追加エラー:', error)
    throw error
  }

  return data?.[0]
}

// 案内記録を更新
export const updateVisitRecord = async (recordId, updateData) => {
  const { data, error } = await supabase
    .from('visit_records')
    .update(updateData)
    .eq('id', recordId)
    .select()

  if (error) {
    console.error('案内記録更新エラー:', error)
    throw error
  }

  return data?.[0]
}

// 案内記録を削除
export const deleteVisitRecord = async (recordId) => {
  const { error } = await supabase
    .from('visit_records')
    .delete()
    .eq('id', recordId)

  if (error) {
    console.error('案内記録削除エラー:', error)
    throw error
  }

  return true
}

// 店舗の最新状況を取得
export const getLatestStoreStatus = async (storeId) => {
  const { data, error } = await supabase
    .from('store_status')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(1)
  
  if (error) {
    console.error('店舗状況取得エラー:', error)
    return null
  }
  
  return data?.[0] || null
}

// 全店舗の最新状況を取得
export const getAllStoresLatestStatus = async () => {
  const { data, error } = await supabase
    .from('store_status')
    .select('store_id, status_type, created_at')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('全店舗状況取得エラー:', error)
    return {}
  }
  
  // 各店舗の最新状況のみを抽出
  const latestStatus = {}
  data?.forEach(status => {
    if (!latestStatus[status.store_id]) {
      latestStatus[status.store_id] = status
    }
  })
  
  return latestStatus
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