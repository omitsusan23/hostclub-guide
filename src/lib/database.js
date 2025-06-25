import { supabase } from './supabase'

// 店舗データ取得（outstaffフィルタリング対応）
export const getStores = async (userRole = null) => {
  let query = supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: true })
  
  // outstaffの場合はアクセス可能な店舗のみフィルタリング
  if (userRole === 'outstaff') {
    query = query.eq('outstaff_accessible', true)
  }

  const { data, error } = await query
  
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

// 業務日（25時切り替わり）を取得する関数
const getBusinessDate = () => {
  const now = new Date();
  const businessDate = new Date(now);
  
  // 1時未満の場合は前日扱い
  if (now.getHours() < 1) {
    businessDate.setDate(businessDate.getDate() - 1);
  }
  
  return businessDate;
};

// 業務日ベースで今日の日付文字列を取得
const getBusinessToday = () => {
  return formatLocalDate(getBusinessDate());
};

// 本日の営業店舗データを取得（admin/staff/outstaff用）
export const getTodayOpenStores = async (userRole = null) => {
  try {
    const today = getBusinessToday(); // 業務日ベースの今日（25時切り替わり）

    // 全店舗を取得（outstaffフィルタリング対応）
    let storesQuery = supabase
      .from('stores')
      .select('*')
      .order('name')

    // outstaffの場合はアクセス可能な店舗のみフィルタリング
    if (userRole === 'outstaff') {
      storesQuery = storesQuery.eq('outstaff_accessible', true)
    }

    const { data: stores, error: storesError } = await storesQuery

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

    // 当月の紹介数を取得（本日の営業店舗カード内は合算データ）
    const monthlyIntroductionsResult = await getMonthlyIntroductionCounts('both')
    const monthlyIntroductions = monthlyIntroductionsResult.success ? monthlyIntroductionsResult.data : {}

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

    // 全店舗の更新統計を計算（営業中・休業中関係なく）
    const totalStoresWithMonthlyUpdate = storeHolidayUpdates.filter(status => status.hasUpdated).length

    // 営業中の店舗のみフィルタリング（本日が店休日でない店舗）
    let openStores = stores
      .filter(store => !holidayStoreIds.has(store.store_id))
      .map(store => ({
        ...store,
        hasMonthlyUpdate: updateStatusMap.get(store.store_id) || false,
        monthlyIntroductions: monthlyIntroductions[store.store_id] || 0,
        guaranteeShortfall: Math.max(0, (store.guarantee_count || 0) - (monthlyIntroductions[store.store_id] || 0))
      }))

    // 保証あり店舗と保証なし店舗で分ける
    const guaranteedStores = openStores.filter(store => store.guarantee_count > 0)
    const nonGuaranteedStores = openStores.filter(store => store.guarantee_count === 0)

    // 保証あり店舗は残り必要数が多い順でソート（保証達成店舗は末尾）
    guaranteedStores.sort((a, b) => b.guaranteeShortfall - a.guaranteeShortfall)

    // 保証なし店舗はア行順でソート
    nonGuaranteedStores.sort((a, b) => a.name.localeCompare(b.name, 'ja'))

    // 統合：保証あり店舗 → 保証なし店舗
    openStores = [...guaranteedStores, ...nonGuaranteedStores]

    return { 
      success: true, 
      data: openStores,
      // 全店舗ベースの統計情報を追加
      totalStoresWithMonthlyUpdate 
    }
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

// 案内記録を取得（staff_typeフィルタリング対応）
export const getVisitRecords = async (storeId = null, startDate = null, endDate = null, staffTypeFilter = 'both') => {
  let query = supabase
    .from('staff_logs')
    .select('*')
    .order('guided_at', { ascending: false })

  if (storeId) {
    query = query.eq('store_id', storeId)
  }

  if (startDate) {
    query = query.gte('guided_at', startDate)
  }

  if (endDate) {
    query = query.lte('guided_at', endDate)
  }

  // staff_typeでフィルタリング
  if (staffTypeFilter === 'staff') {
    query = query.eq('staff_type', 'staff')
  } else if (staffTypeFilter === 'outstaff') {
    query = query.eq('staff_type', 'outstaff')
  }
  // 'both'の場合はフィルタリングしない

  const { data, error } = await query

  if (error) {
    console.error('案内記録取得エラー:', error)
    return []
  }

  return data || []
}

// 今日の案内記録を取得（業務日ベース - 25時切り替わり）
export const getTodayVisitRecords = async (storeId = null, staffTypeFilter = 'both') => {
  const businessDate = getBusinessDate()
  const startOfDay = new Date(businessDate.getFullYear(), businessDate.getMonth(), businessDate.getDate(), 1).toISOString() // 1時から開始
  const endOfDay = new Date(businessDate.getFullYear(), businessDate.getMonth(), businessDate.getDate() + 1, 1).toISOString() // 翌日1時まで
  
  return await getVisitRecords(storeId, startOfDay, endOfDay, staffTypeFilter)
}

// 月間案内記録を取得
export const getMonthlyVisitRecords = async (storeId = null, year = null, month = null, staffTypeFilter = 'both') => {
  const now = new Date()
  const targetYear = year || now.getFullYear()
  const targetMonth = month !== null ? month : now.getMonth()
  
  const startOfMonth = new Date(targetYear, targetMonth, 1).toISOString()
  const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59).toISOString()
  
  return await getVisitRecords(storeId, startOfMonth, endOfMonth, staffTypeFilter)
}

// 当月の紹介数を店舗別に集計（staff/outstaffの分離・合算対応）
export const getMonthlyIntroductionCounts = async (staffTypeFilter = 'both') => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

    let query = supabase
      .from('staff_logs')
      .select('store_id, guest_count, staff_type')
      .gte('guided_at', startOfMonth)
      .lte('guided_at', endOfMonth)

    // staff_typeでフィルタリング
    if (staffTypeFilter === 'staff') {
      query = query.eq('staff_type', 'staff')
    } else if (staffTypeFilter === 'outstaff') {
      query = query.eq('staff_type', 'outstaff')
    }
    // 'both'の場合はフィルタリングしない（staff + outstaff合算）

    const { data, error } = await query

    if (error) throw error

    // 店舗別に人数を集計
    const countsByStore = {}
    data.forEach(record => {
      if (!countsByStore[record.store_id]) {
        countsByStore[record.store_id] = 0
      }
      countsByStore[record.store_id] += record.guest_count
    })

    return { success: true, data: countsByStore }
  } catch (error) {
    console.error('当月紹介数取得エラー:', error)
    return { success: false, error: error.message }
  }
}

// 案内記録を追加（staff_type自動設定対応、推奨状態記録対応）
export const addVisitRecord = async (visitData, userRole = 'staff') => {
  // staff_typeを自動設定
  const staffType = userRole === 'outstaff' ? 'outstaff' : 'staff'
  
  // outstaffの場合は現在の推奨状態を取得
  let storeWasRecommended = false
  if (userRole === 'outstaff') {
    storeWasRecommended = await getCurrentRecommendationStatus(visitData.store_id)
  }

  const { data, error } = await supabase
    .from('staff_logs')
    .insert({
      store_id: visitData.store_id,
      guest_count: visitData.guest_count,
      staff_name: visitData.staff_name,
      guided_at: visitData.guided_at || new Date().toISOString(),
      staff_type: staffType,
      store_was_recommended: storeWasRecommended
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
    .from('staff_logs')
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
    .from('staff_logs')
    .delete()
    .eq('id', recordId)

  if (error) {
    console.error('案内記録削除エラー:', error)
    throw error
  }

  return true
}

// 店舗の最新状況を取得（store_statusテーブル未作成のため無効化）
export const getLatestStoreStatus = async (storeId) => {
  // store_statusテーブルが存在しないため、デフォルト値を返す
  console.log('store_statusテーブル未作成のため、店舗状況は無効です')
  return null
}

// 全店舗の最新状況を取得（store_statusテーブル未作成のため無効化）
export const getAllStoresLatestStatus = async () => {
  // store_statusテーブルが存在しないため、空のオブジェクトを返す
  console.log('store_statusテーブル未作成のため、店舗状況は無効です')
  return {}
}

// リアルタイム状況設定（store_statusテーブル未作成のため無効化）
export const setStoreStatus = async (storeId, statusType) => {
  // store_statusテーブルが存在しないため、何もしない
  console.log('store_statusテーブル未作成のため、店舗状況設定は無効です')
  return null
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

// outstaff推奨店舗システム関連
// 全店舗の推奨状態を取得
export const getOutstaffRecommendations = async () => {
  try {
    const { data, error } = await supabase
      .from('outstaff_store_recommendations')
      .select(`
        store_id,
        is_recommended,
        updated_at,
        stores (
          name,
          store_id
        )
      `)
      .order('stores(name)')

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('推奨店舗取得エラー:', error)
    return { success: false, error: error.message }
  }
}

// 推奨状態を一括更新
export const updateOutstaffRecommendations = async (recommendations, userId) => {
  try {
    // トランザクション的に更新
    const updates = recommendations.map(rec => ({
      store_id: rec.store_id,
      is_recommended: rec.is_recommended,
      updated_at: new Date().toISOString(),
      updated_by: userId
    }))

    const { error } = await supabase
      .from('outstaff_store_recommendations')
      .upsert(updates, { onConflict: 'store_id' })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('推奨状態更新エラー:', error)
    return { success: false, error: error.message }
  }
}

// 特定店舗の現在推奨状態を取得
export const getCurrentRecommendationStatus = async (storeId) => {
  try {
    const { data, error } = await supabase
      .from('outstaff_store_recommendations')
      .select('is_recommended')
      .eq('store_id', storeId)
      .single()

    if (error) throw error

    return data?.is_recommended || false
  } catch (error) {
    console.error('推奨状態取得エラー:', error)
    return false
  }
}

// outstaffスタッフ一覧を取得
export const getOutstaffStaffs = async () => {
  try {
    const { data, error } = await supabase
      .from('staffs')
      .select('staff_id, display_name, email')
      .eq('is_active', true)
      .order('display_name')

    if (error) throw error

    // outstaffに関連するスタッフをフィルタ（staff_typeカラムがない場合の対応）
    const outstaffStaffs = data.filter(staff => 
      staff.staff_id === 'yuhi' || 
      staff.display_name?.includes('夕日') ||
      staff.email?.includes('outstaff')
    )

    return { success: true, data: outstaffStaffs || [] }
  } catch (error) {
    console.error('outstaffスタッフ取得エラー:', error)
    return { success: false, error: error.message, data: [] }
  }
}

// スタッフ別・推奨状態別の当月案内数を取得
export const getMonthlyIntroductionCountsByStaffAndRecommendation = async () => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

    // outstaffの案内記録を取得
    const { data: logs, error: logsError } = await supabase
      .from('staff_logs')
      .select('staff_name, guest_count, store_was_recommended, staff_type')
      .eq('staff_type', 'outstaff')
      .gte('guided_at', startOfMonth)
      .lte('guided_at', endOfMonth)

    if (logsError) throw logsError

    // 全スタッフ情報を取得（メールアドレスから表示名を変換するため）
    const { data: staffs, error: staffsError } = await supabase
      .from('staffs')
      .select('email, display_name')

    if (staffsError) throw staffsError

    // メールアドレス→表示名のマップを作成
    const emailToDisplayName = {}
    staffs.forEach(staff => {
      if (staff.email && staff.display_name) {
        emailToDisplayName[staff.email] = staff.display_name
      }
    })

    // スタッフ別・推奨状態別に集計
    const countsByStaffAndRecommendation = {}
    
    logs.forEach(record => {
      // staff_nameがメールアドレスの場合は表示名に変換
      let displayName = record.staff_name
      if (record.staff_name && record.staff_name.includes('@')) {
        displayName = emailToDisplayName[record.staff_name] || record.staff_name
      }

      const isRecommended = record.store_was_recommended
      const guestCount = record.guest_count

      if (!countsByStaffAndRecommendation[displayName]) {
        countsByStaffAndRecommendation[displayName] = {
          recommended: 0,
          notRecommended: 0,
          total: 0
        }
      }

      if (isRecommended) {
        countsByStaffAndRecommendation[displayName].recommended += guestCount
      } else {
        countsByStaffAndRecommendation[displayName].notRecommended += guestCount
      }
      countsByStaffAndRecommendation[displayName].total += guestCount
    })

    return { success: true, data: countsByStaffAndRecommendation }
  } catch (error) {
    console.error('スタッフ別案内数取得エラー:', error)
    return { success: false, error: error.message, data: {} }
  }
} 