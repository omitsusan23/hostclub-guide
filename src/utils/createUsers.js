import { supabase } from '../lib/supabase'

// 店舗ユーザーを一括作成する関数
export const createStoreUsers = async () => {
  // 全店舗のstore_idリスト
  const storeIds = [
    'rberu', 'ace', 'kings', 'aqua', 'berry', 'air', 'alive', 'almond',
    'arkluxe', 'atom', 'cloudnine', 'earth', 'fk', 'galaxy', 'gallery',
    'gift', 'gran', 'hrs', 'love', 'lunaipro', 'micheles', 'mrsapporo',
    'newbirth', 'no9sapporo', 'party', 'phantom', 'raize', 'rampage',
    'remake', 'sette', 'sifir', 'sirius', 'star', 'start', 'topdandysapporo',
    'urvanity', 'valencia', 'white', 'yoox', 'zeal'
  ]

  const results = []

  for (const storeId of storeIds) {
    try {
      const email = `${storeId}@hostclub.local`
      const password = '0000'

      // Supabaseの正式なサインアップAPIを使用
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            role: 'customer',
            store_id: storeId
          }
        }
      })

      if (error) {
        results.push({ storeId, status: 'error', error: error.message })
      } else {
        results.push({ storeId, status: 'success', userId: data.user?.id })
      }

      // API制限を避けるため少し待機
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (err) {
      results.push({ storeId, status: 'error', error: err.message })
    }
  }

  return results
}

// 単一ユーザー作成関数
export const createSingleUser = async (storeId) => {
  try {
    const email = `${storeId}@hostclub.local`
    const password = '0000'

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          role: 'customer',
          store_id: storeId
        }
      }
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, user: data.user }
  } catch (err) {
    return { success: false, error: err.message }
  }
} 