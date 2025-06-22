import { supabase } from '../lib/supabase'

// Supabase Service Role Key設定（管理者機能用）
const createAdminClient = () => {
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    console.warn('Service Role Key not found. Using regular client.')
    return supabase
  }
  
  return supabase
}

/**
 * 新店舗をデータベースに追加
 */
export const addStoreToDatabase = async (storeData) => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .insert([{
        name: storeData.name,
        store_id: storeData.store_id,
        open_time: storeData.open_time || '20:00',
        close_time: storeData.close_time || '23:30',
        base_price: storeData.base_price || 0,
        id_required: storeData.id_required || '顔＝保険証＋キャッシュ',
        male_price: storeData.male_price || 0,
        panel_fee: storeData.panel_fee || 120000,
        guarantee_count: storeData.guarantee_count || 25,
        penalty_fee: storeData.penalty_fee || 20000,
        unit_price: storeData.unit_price || 1000,
        is_transfer: storeData.is_transfer || false
      }])
      .select()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Store creation error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 新店舗のユーザーアカウントを作成
 */
export const createStoreUser = async (storeId, storeName) => {
  try {
    const email = `${storeId}@hostclub.local`
    const password = 'hostclub123'
    
    // Supabase Edge Functionを呼び出し
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const functionUrl = `${supabaseUrl}/functions/v1/create-store-user`
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email,
        password,
        user_metadata: {
          role: 'customer',
          store_id: storeId,
          store_name: storeName,
          email_verified: true
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create user')
    }

    const result = await response.json()
    return { success: true, data: result }
  } catch (error) {
    console.error('User creation error:', error)
    // ユーザー作成に失敗した場合でも、店舗データは追加済みなので警告として扱う
    return { success: false, error: error.message }
  }
}

/**
 * 新店舗追加（完全版）
 */
export const addNewStore = async (formData) => {
  try {
    // バリデーション
    if (!formData.name || !formData.store_id) {
      return { success: false, error: '店舗名と店舗IDは必須です' }
    }

    // 1. データベースに店舗データを追加
    const storeResult = await addStoreToDatabase(formData)
    if (!storeResult.success) {
      return { success: false, error: `店舗データ追加エラー: ${storeResult.error}` }
    }

    // 2. 認証ユーザーを作成
    const userResult = await createStoreUser(formData.store_id, formData.name)
    if (!userResult.success) {
      // 店舗データは追加されたが、ユーザー作成に失敗した場合の警告
      console.warn('Store created but user creation failed:', userResult.error)
      return { 
        success: true, 
        warning: `店舗は追加されましたが、ユーザー作成に失敗しました: ${userResult.error}`,
        data: storeResult.data
      }
    }

    return { 
      success: true, 
      message: `✅ ${formData.name} が正常に追加されました！`,
      data: storeResult.data,
      user: userResult.data
    }
  } catch (error) {
    console.error('Complete store addition error:', error)
    return { success: false, error: `予期しないエラー: ${error.message}` }
  }
}

/**
 * 店舗ID生成（店舗名から自動生成）
 */
export const generateStoreId = (storeName) => {
  return storeName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/[あ-ん]/g, '') // ひらがな除去
    .replace(/[ア-ン]/g, '') // カタカナ除去
    .replace(/[一-龯]/g, '') // 漢字除去
    .substring(0, 15) // 15文字以下に制限
}

/**
 * 全店舗データを取得
 */
export const getAllStores = async () => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('name')

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Get stores error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 店舗IDの重複チェック
 */
export const checkStoreIdExists = async (storeId) => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('store_id')
      .eq('store_id', storeId)
      .limit(1)

    if (error) throw error
    return data && data.length > 0
  } catch (error) {
    console.error('Check store ID error:', error)
    return true // エラーの場合は重複ありとして安全側に倒す
  }
} 