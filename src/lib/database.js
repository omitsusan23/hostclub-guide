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

// スタッフチャット関連
// チャット履歴を取得（最新100件）
export const getStaffChats = async (limit = 100) => {
  try {
    const { data, error } = await supabase
      .from('staff_chats')
      .select(`
        id,
        message,
        sender_id,
        sender_name,
        sender_role,
        sent_at,
        message_type,
        is_edited,
        edited_at,
        reply_to_id
      `)
      .order('sent_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('チャット取得エラー:', error)
    return { success: false, error: error.message, data: [] }
  }
}

// チャットメッセージを送信
export const sendStaffChat = async (messageData) => {
  try {
    console.log('🔥 database.js sendStaffChat 開始:', messageData)
    
    const insertData = {
      message: messageData.message,
      sender_id: messageData.sender_id,
      sender_name: messageData.sender_name,
      sender_role: messageData.sender_role || 'staff',
      message_type: messageData.message_type || 'text',
      reply_to_id: messageData.reply_to_id || null
    }
    
    console.log('📊 Supabase INSERT データ:', insertData)
    
    const { data, error } = await supabase
      .from('staff_chats')
      .insert(insertData)
      .select()

    console.log('📥 Supabase レスポンス:', { data, error })

    if (error) throw error

    console.log('✅ database.js sendStaffChat 成功:', data?.[0])
    return { success: true, data: data?.[0] }
  } catch (error) {
    console.error('❌ database.js sendStaffChat エラー:', error)
    return { success: false, error: error.message }
  }
}

// チャットメッセージを編集
export const editStaffChat = async (chatId, newMessage, userId) => {
  try {
    const { data, error } = await supabase
      .from('staff_chats')
      .update({
        message: newMessage,
        is_edited: true,
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', chatId)
      .eq('sender_id', userId) // 自分のメッセージのみ編集可能
      .select()

    if (error) throw error

    return { success: true, data: data?.[0] }
  } catch (error) {
    console.error('チャット編集エラー:', error)
    return { success: false, error: error.message }
  }
}

// チャットメッセージを削除（管理者のみ）
export const deleteStaffChat = async (chatId, userId, userRole) => {
  try {
    // 管理者権限チェック
    if (userRole !== 'admin') {
      throw new Error('管理者のみがメッセージを削除できます')
    }

    const { error } = await supabase
      .from('staff_chats')
      .delete()
      .eq('id', chatId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('チャット削除エラー:', error)
    return { success: false, error: error.message }
  }
}

// リアルタイムチャット購読
export const subscribeToStaffChats = (callback) => {
  const subscription = supabase
    .channel('staff_chats_channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'staff_chats'
      },
      (payload) => {
        console.log('📨 リアルタイムイベント受信 RAW:', payload)
        
        // Supabaseのリアルタイム構造を統一
        const normalizedPayload = {
          eventType: payload.eventType || payload.event_type,
          new: payload.new,
          old: payload.old
        }
        
        console.log('📨 正規化されたペイロード:', normalizedPayload)
        callback(normalizedPayload)
      }
    )
    .subscribe((status) => {
      console.log('📡 チャット購読状態:', status)
      
      if (status === 'SUBSCRIBED') {
        console.log('✅ チャットリアルタイム購読成功')
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ チャットリアルタイム購読エラー')
      }
    })

  return subscription
}

// リアルタイム購読解除
export const unsubscribeFromStaffChats = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription)
  }
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

// 個人スタッフの推奨状態別当月案内数を取得
export const getPersonalMonthlyIntroductionsByRecommendation = async (staffName) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

    // そのスタッフの当月案内記録を取得
    const { data: logs, error: logsError } = await supabase
      .from('staff_logs')
      .select('guest_count, store_was_recommended, staff_name')
      .eq('staff_name', staffName)
      .gte('guided_at', startOfMonth)
      .lte('guided_at', endOfMonth)

    if (logsError) throw logsError

    // 推奨状態別に集計
    let recommendedCount = 0
    let notRecommendedCount = 0
    
    logs.forEach(record => {
      if (record.store_was_recommended) {
        recommendedCount += record.guest_count
      } else {
        notRecommendedCount += record.guest_count
      }
    })

    return { 
      success: true, 
      data: { 
        recommended: recommendedCount, 
        notRecommended: notRecommendedCount,
        total: recommendedCount + notRecommendedCount
      } 
    }
  } catch (error) {
    console.error('個人スタッフ案内数取得エラー:', error)
    return { 
      success: false, 
      error: error.message, 
      data: { recommended: 0, notRecommended: 0, total: 0 } 
    }
  }
}

// 個人スタッフの推奨状態別本日案内数を取得
export const getPersonalTodayIntroductionsByRecommendation = async (staffName) => {
  try {
    const businessDate = getBusinessDate()
    const startOfDay = new Date(businessDate.getFullYear(), businessDate.getMonth(), businessDate.getDate(), 1).toISOString() // 1時から開始
    const endOfDay = new Date(businessDate.getFullYear(), businessDate.getMonth(), businessDate.getDate() + 1, 1).toISOString() // 翌日1時まで

    // そのスタッフの本日案内記録を取得
    const { data: logs, error: logsError } = await supabase
      .from('staff_logs')
      .select('guest_count, store_was_recommended, staff_name')
      .eq('staff_name', staffName)
      .gte('guided_at', startOfDay)
      .lte('guided_at', endOfDay)

    if (logsError) throw logsError

    // 推奨状態別に集計
    let recommendedCount = 0
    let notRecommendedCount = 0
    
    logs.forEach(record => {
      if (record.store_was_recommended) {
        recommendedCount += record.guest_count
      } else {
        notRecommendedCount += record.guest_count
      }
    })

    return { 
      success: true, 
      data: { 
        recommended: recommendedCount, 
        notRecommended: notRecommendedCount,
        total: recommendedCount + notRecommendedCount
      } 
    }
  } catch (error) {
    console.error('個人スタッフ本日案内数取得エラー:', error)
    return { 
      success: false, 
      error: error.message, 
      data: { recommended: 0, notRecommended: 0, total: 0 } 
    }
  }
}

// 全outstaffスタッフの推奨状態別本日案内数を取得
export const getAllOutstaffTodayIntroductionsByRecommendation = async () => {
  try {
    const businessDate = getBusinessDate()
    const startOfDay = new Date(businessDate.getFullYear(), businessDate.getMonth(), businessDate.getDate(), 1).toISOString() // 1時から開始
    const endOfDay = new Date(businessDate.getFullYear(), businessDate.getMonth(), businessDate.getDate() + 1, 1).toISOString() // 翌日1時まで

    // 全outstaffスタッフの本日案内記録を取得
    const { data: logs, error: logsError } = await supabase
      .from('staff_logs')
      .select('guest_count, store_was_recommended, staff_type')
      .eq('staff_type', 'outstaff')
      .gte('guided_at', startOfDay)
      .lte('guided_at', endOfDay)

    if (logsError) throw logsError

    // 推奨状態別に集計
    let recommendedCount = 0
    let notRecommendedCount = 0
    
    logs.forEach(record => {
      if (record.store_was_recommended) {
        recommendedCount += record.guest_count
      } else {
        notRecommendedCount += record.guest_count
      }
    })

    return { 
      success: true, 
      data: { 
        recommended: recommendedCount, 
        notRecommended: notRecommendedCount,
        total: recommendedCount + notRecommendedCount
      } 
    }
  } catch (error) {
    console.error('全outstaff本日案内数取得エラー:', error)
    return { 
      success: false, 
      error: error.message, 
      data: { recommended: 0, notRecommended: 0, total: 0 } 
    }
  }
}

// staff向け目標関連機能
// 月間目標を取得（データベースから）
export const getMonthlyTarget = async (year = null, month = null) => {
  try {
    const now = new Date()
    const targetYear = year || now.getFullYear()
    const targetMonth = month !== null ? month : now.getMonth() + 1 // getMonth()は0ベースなので+1

    const { data, error } = await supabase
      .from('staff_targets')
      .select('target_count')
      .eq('year', targetYear)
      .eq('month', targetMonth)
      .single()

    if (error) {
      console.warn('目標取得エラー（デフォルト値0を使用）:', error)
      return 0 // デフォルト値
    }

    return data?.target_count || 0
  } catch (error) {
    console.warn('目標取得エラー（デフォルト値0を使用）:', error)
    return 0 // デフォルト値
  }
}

// 日割り目標を計算（staffのみ）- 動的計算式
export const calculateDailyTarget = async (currentMonthCount = 0) => {
  const monthlyTarget = await getMonthlyTarget()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  
  // 今月の総日数
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate()
  
  // 今日が何日目か
  const currentDay = now.getDate()
  
  // 今日を含む残り営業日数
  const remainingDays = totalDaysInMonth - currentDay + 1
  
  // 残り目標数 = 月間目標 - 現在までの案内数
  const remainingTarget = Math.max(0, monthlyTarget - currentMonthCount)
  
  // 今日の日割り目標 = 残り目標数 ÷ 残り営業日数
  const dailyTarget = remainingDays > 0 ? Math.ceil(remainingTarget / remainingDays) : 0
  
  return {
    monthlyTarget,
    totalDaysInMonth,
    currentDay,
    remainingDays,
    remainingTarget,
    dailyTarget,
    currentMonthCount
  }
}

// 目標達成率を計算（staffのみ）
export const calculateTargetAchievementRate = async (currentCount) => {
  const { dailyTarget, monthlyTarget } = await calculateDailyTarget(currentCount)
  const dailyRate = dailyTarget > 0 ? (currentCount / dailyTarget) * 100 : 0
  const monthlyRate = (currentCount / monthlyTarget) * 100
  
  return {
    dailyRate: Math.round(dailyRate * 10) / 10, // 小数点第1位まで
    monthlyRate: Math.round(monthlyRate * 10) / 10,
    remainingToDaily: Math.max(0, dailyTarget - currentCount),
    remainingToMonthly: Math.max(0, monthlyTarget - currentCount)
  }
}

// 目標管理関連機能（admin専用）
// 全目標を取得（指定年のみ）
export const getTargetsByYear = async (year) => {
  try {
    const { data, error } = await supabase
      .from('staff_targets')
      .select('*')
      .eq('year', year)
      .order('month')

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('年次目標取得エラー:', error)
    return { success: false, error: error.message, data: [] }
  }
}

// 目標を設定・更新
export const setMonthlyTarget = async (year, month, targetCount) => {
  try {
    const { data, error } = await supabase
      .from('staff_targets')
      .upsert({ 
        year, 
        month, 
        target_count: targetCount,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'year,month' 
      })
      .select()

    if (error) throw error

    return { success: true, data: data?.[0] }
  } catch (error) {
    console.error('目標設定エラー:', error)
    return { success: false, error: error.message }
  }
}

// 複数月の目標を一括設定
export const setBulkMonthlyTargets = async (targets) => {
  try {
    const upsertData = targets.map(target => ({
      year: target.year,
      month: target.month,
      target_count: target.target_count,
      updated_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('staff_targets')
      .upsert(upsertData, { onConflict: 'year,month' })
      .select()

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('一括目標設定エラー:', error)
    return { success: false, error: error.message }
  }
}

// ============================================
// 店舗状況発信関連機能
// ============================================

// 店舗状況発信リクエストを記録
export const sendStoreStatusRequest = async (requestData) => {
  try {
    console.log('🔥 database.js sendStoreStatusRequest 開始:', requestData)
    
    const insertData = {
      store_id: requestData.store_id,
      status_type: requestData.status_type,
      message: requestData.message,
      has_time_limit: requestData.has_time_limit || false,
      has_count_limit: requestData.has_count_limit || false,
      chat_message_id: requestData.chat_message_id || null
    }
    
    // 時間制限がある場合は有効期限を設定（1時間後）
    if (requestData.has_time_limit) {
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 1)
      insertData.expires_at = expiresAt.toISOString()
    }
    
    console.log('📊 Supabase INSERT データ:', insertData)
    
    const { data, error } = await supabase
      .from('store_status_requests')
      .insert(insertData)
      .select()

    console.log('📥 Supabase レスポンス:', { data, error })

    if (error) throw error

    console.log('✅ database.js sendStoreStatusRequest 成功:', data?.[0])
    return { success: true, data: data?.[0] }
  } catch (error) {
    console.error('❌ database.js sendStoreStatusRequest エラー:', error)
    return { success: false, error: error.message }
  }
}

// 店舗の月間リクエスト数を取得（回数制限があるもののみ）
export const getMonthlyRequestCount = async (storeId, statusType = null) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

    let query = supabase
      .from('store_status_requests')
      .select('id')
      .eq('store_id', storeId)
      .eq('has_count_limit', true)
      .gte('requested_at', startOfMonth)
      .lte('requested_at', endOfMonth)

    if (statusType) {
      query = query.eq('status_type', statusType)
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, count: data?.length || 0 }
  } catch (error) {
    console.error('月間リクエスト数取得エラー:', error)
    return { success: false, error: error.message, count: 0 }
  }
}

// 店舗のアクティブなリクエストを取得（時間制限があり、まだ有効期限内のもの）
export const getActiveRequest = async (storeId, statusType = null) => {
  try {
    const now = new Date().toISOString()

    let query = supabase
      .from('store_status_requests')
      .select('*')
      .eq('store_id', storeId)
      .eq('has_time_limit', true)
      .eq('is_consumed', false)
      .gt('expires_at', now)
      .order('requested_at', { ascending: false })
      .limit(1)

    if (statusType) {
      query = query.eq('status_type', statusType)
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, data: data?.[0] || null }
  } catch (error) {
    console.error('アクティブリクエスト取得エラー:', error)
    return { success: false, error: error.message, data: null }
  }
}

// リクエストを消化（案内報告があった場合）
export const consumeRequest = async (requestId, staffLogId) => {
  try {
    const { data, error } = await supabase
      .from('store_status_requests')
      .update({
        is_consumed: true,
        consumed_at: new Date().toISOString(),
        staff_log_id: staffLogId,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()

    if (error) throw error

    return { success: true, data: data?.[0] }
  } catch (error) {
    console.error('リクエスト消化エラー:', error)
    return { success: false, error: error.message }
  }
}

// 期限切れリクエストを自動的に無効化
export const cleanupExpiredRequests = async () => {
  try {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('store_status_requests')
      .update({
        is_consumed: false, // 期限切れは消化扱いにしない
        updated_at: new Date().toISOString()
      })
      .eq('has_time_limit', true)
      .eq('is_consumed', false)
      .lt('expires_at', now)
      .select()

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('期限切れリクエスト処理エラー:', error)
    return { success: false, error: error.message }
  }
}

// 全店舗の最新状況発信を取得（スタッフチャット表示用）
export const getLatestStoreStatusRequests = async (limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('store_status_requests')
      .select(`
        id,
        store_id,
        status_type,
        message,
        has_time_limit,
        has_count_limit,
        requested_at,
        expires_at,
        is_consumed,
        consumed_at,
        stores (
          name
        )
      `)
      .order('requested_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('最新状況発信取得エラー:', error)
    return { success: false, error: error.message, data: [] }
  }
}

// 案内報告が上がったときにアクティブなリクエストを自動消化
export const checkAndConsumeRequest = async (staffLogData) => {
  try {
    console.log('🔍 リクエスト消化チェック開始:', staffLogData)
    
    const { store_id, guided_at } = staffLogData
    const guidedAtTime = new Date(guided_at)
    
    // その店舗のアクティブなリクエストを検索（1時間以内）
    const oneHourAgo = new Date(guidedAtTime.getTime() - 60 * 60 * 1000)
    
    const { data: activeRequests, error } = await supabase
      .from('store_status_requests')
      .select('*')
      .eq('store_id', store_id)
      .eq('has_time_limit', true)
      .eq('is_consumed', false)
      .gte('requested_at', oneHourAgo.toISOString())
      .lte('requested_at', guidedAtTime.toISOString())
      .order('requested_at', { ascending: false })
      .limit(1)
    
    if (error) throw error
    
    if (activeRequests && activeRequests.length > 0) {
      const request = activeRequests[0]
      console.log('✅ 消化対象リクエスト発見:', request)
      
      // リクエストを消化
      const { data: updatedRequest, error: updateError } = await supabase
        .from('store_status_requests')
        .update({
          is_consumed: true,
          consumed_at: guidedAtTime.toISOString(),
          staff_log_id: staffLogData.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id)
        .select()
      
      if (updateError) throw updateError
      
      console.log('🎉 リクエスト消化完了:', updatedRequest?.[0])
      
      return { success: true, consumed: true, request: updatedRequest?.[0] }
    } else {
      console.log('ℹ️ 消化対象のリクエストなし')
      return { success: true, consumed: false }
    }
    
  } catch (error) {
    console.error('リクエスト消化チェックエラー:', error)
    return { success: false, error: error.message, consumed: false }
  }
}

// addVisitRecordを修正してリクエスト消化チェックを追加
export const addVisitRecordWithRequestCheck = async (visitData, userRole = 'staff') => {
  try {
    console.log('📝 案内記録追加開始:', visitData)
    
    // 通常の案内記録追加
    const result = await addVisitRecord(visitData, userRole)
    
    if (result && result.id) {
      // リクエスト消化チェック
      await checkAndConsumeRequest(result)
    }
    
    return result
  } catch (error) {
    console.error('案内記録追加（リクエストチェック付き）エラー:', error)
    throw error
  }
} 