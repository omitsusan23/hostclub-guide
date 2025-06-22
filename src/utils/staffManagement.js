import { supabase } from '../lib/supabase'

/**
 * スタッフをデータベースに追加
 */
export const addStaffToDatabase = async (staffData) => {
  try {
    const { data, error } = await supabase
      .from('staffs')
      .insert([{
        staff_id: staffData.staff_id,
        display_name: staffData.display_name,
        email: staffData.email,
        user_id: staffData.user_id,
        notes: staffData.notes || '',
        is_active: true
      }])
      .select()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Staff database insertion error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * スタッフの認証ユーザーを作成
 */
export const createStaffUser = async (staffId, displayName, password = 'ryota123') => {
  try {
    const email = `${staffId}@hostclub.local`
    
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
          role: 'staff',
          staff_id: staffId,
          display_name: displayName,
          email_verified: true
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create staff user')
    }

    const result = await response.json()
    return { success: true, data: result }
  } catch (error) {
    console.error('Staff user creation error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 新スタッフ追加（完全版）
 */
export const addNewStaff = async (formData) => {
  try {
    // バリデーション
    if (!formData.staff_id || !formData.display_name) {
      return { success: false, error: 'スタッフIDと表示名は必須です' }
    }

    // 1. 認証ユーザーを作成
    const userResult = await createStaffUser(
      formData.staff_id, 
      formData.display_name, 
      formData.password || 'ryota123'
    )
    
    if (!userResult.success) {
      return { success: false, error: `ユーザー作成エラー: ${userResult.error}` }
    }

    // 2. staffsテーブルにデータを追加
    const staffResult = await addStaffToDatabase({
      ...formData,
      email: `${formData.staff_id}@hostclub.local`,
      user_id: userResult.data.user.id
    })

    if (!staffResult.success) {
      console.warn('User created but staff data insertion failed:', staffResult.error)
      return { 
        success: true, 
        warning: `ユーザーは作成されましたが、スタッフデータ追加に失敗しました: ${staffResult.error}`,
        data: userResult.data
      }
    }

    return { 
      success: true, 
      message: `✅ スタッフ「${formData.display_name}」が正常に追加されました！`,
      data: staffResult.data,
      user: userResult.data
    }
  } catch (error) {
    console.error('Complete staff addition error:', error)
    return { success: false, error: `予期しないエラー: ${error.message}` }
  }
}

/**
 * スタッフID生成（表示名から自動生成）
 */
export const generateStaffId = (displayName) => {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/[あ-ん]/g, '') // ひらがな除去
    .replace(/[ア-ン]/g, '') // カタカナ除去
    .replace(/[一-龯]/g, '') // 漢字除去
    .substring(0, 20) // 20文字以下に制限
}

/**
 * 全スタッフデータを取得
 */
export const getAllStaffs = async () => {
  try {
    const { data, error } = await supabase
      .from('staffs')
      .select('*')
      .order('display_name')

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Get staffs error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * スタッフIDの重複チェック
 */
export const checkStaffIdExists = async (staffId) => {
  try {
    const { data, error } = await supabase
      .from('staffs')
      .select('staff_id')
      .eq('staff_id', staffId)
      .limit(1)

    if (error) throw error
    return data && data.length > 0
  } catch (error) {
    console.error('Check staff ID error:', error)
    return true // エラーの場合は重複ありとして安全側に倒す
  }
}

/**
 * スタッフIDの重複チェック（編集時 - 自分以外）
 */
export const checkStaffIdExistsForEdit = async (staffId, currentId) => {
  try {
    const { data, error } = await supabase
      .from('staffs')
      .select('staff_id')
      .eq('staff_id', staffId)
      .neq('id', currentId)
      .limit(1)

    if (error) throw error
    return data && data.length > 0
  } catch (error) {
    console.error('Check staff ID for edit error:', error)
    return true // エラーの場合は重複ありとして安全側に倒す
  }
}

/**
 * スタッフ情報を更新
 */
export const updateStaff = async (staffId, formData) => {
  try {
    console.log('🔄 updateStaff called with:', { staffId, formData });

    // バリデーション
    if (!formData.staff_id || !formData.display_name) {
      console.log('❌ Validation failed: staff_id or display_name missing');
      return { success: false, error: 'スタッフIDと表示名は必須です' }
    }

    // スタッフIDの重複チェック（自分以外）
    console.log('🔍 Checking staff_id exists for edit...');
    const exists = await checkStaffIdExistsForEdit(formData.staff_id, staffId)
    if (exists) {
      console.log('❌ Staff ID already exists');
      return { success: false, error: 'このスタッフIDは既に他のスタッフで使用されています' }
    }

    // データベース更新のためのデータを準備
    const updateData = {
      staff_id: formData.staff_id,
      display_name: formData.display_name,
      email: `${formData.staff_id}@hostclub.local`,
      notes: formData.notes || '',
      is_active: formData.is_active !== undefined ? formData.is_active : true
    };

    console.log('📝 Update data prepared:', updateData);

    // データベースを更新
    const { data, error } = await supabase
      .from('staffs')
      .update(updateData)
      .eq('id', staffId)
      .select()

    console.log('📤 Supabase update result:', { data, error });

    if (error) {
      console.error('❌ Supabase update error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.error('❌ No data returned from update');
      throw new Error('更新されたデータが返されませんでした');
    }

    console.log('✅ Staff updated successfully:', data[0]);

    return { 
      success: true, 
      message: `✅ ${formData.display_name} の情報を更新しました！`,
      data: data[0]
    }
  } catch (error) {
    console.error('❌ Staff update error:', error)
    return { success: false, error: `更新エラー: ${error.message}` }
  }
}

/**
 * スタッフを削除（論理削除）
 */
export const deleteStaff = async (staffId) => {
  try {
    console.log('🗑️ deleteStaff called with:', staffId);

    // is_activeをfalseに設定（論理削除）
    const { data, error } = await supabase
      .from('staffs')
      .update({ is_active: false })
      .eq('id', staffId)
      .select()

    console.log('📤 Supabase delete result:', { data, error });

    if (error) {
      console.error('❌ Supabase delete error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.error('❌ No data returned from delete');
      throw new Error('削除対象のスタッフが見つかりませんでした');
    }

    console.log('✅ Staff deleted successfully:', data[0]);

    return { 
      success: true, 
      message: `✅ ${data[0].display_name} を削除しました`,
      data: data[0]
    }
  } catch (error) {
    console.error('❌ Staff delete error:', error)
    return { success: false, error: `削除エラー: ${error.message}` }
  }
} 