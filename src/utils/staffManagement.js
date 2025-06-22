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
export const createStaffUser = async (staffId, displayName, password) => {
  try {
    console.log('🔐 createStaffUser called with:', { 
      staffId, 
      displayName, 
      password: password,  // 実際のパスワードも表示
      passwordLength: password?.length 
    });
    
    const email = `${staffId}@hostclub.local`
    
    // Supabase Edge Functionを呼び出し
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const functionUrl = `${supabaseUrl}/functions/v1/create-store-user`
    
    console.log('📡 Calling Edge Function:', functionUrl);
    console.log('📦 Request payload:', {
      email,
      password,
      user_metadata: {
        role: 'staff',
        staff_id: staffId,
        display_name: displayName,
        email_verified: true
      }
    });
    
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

    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Edge Function error response:', errorData);
      throw new Error(errorData.error || 'Failed to create staff user')
    }

    const result = await response.json()
    console.log('✅ createStaffUser result:', result);
    console.log('👤 Created user ID:', result.user?.id);
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ Staff user creation error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 新スタッフ追加（完全版）
 */
export const addNewStaff = async (formData) => {
  try {
    console.log('🚀 addNewStaff called with formData:', formData);

    // バリデーション
    if (!formData.staff_id || !formData.display_name) {
      return { success: false, error: 'スタッフIDと表示名は必須です' }
    }

    // パスワードの処理
    const password = formData.password && formData.password.trim() !== '' 
      ? formData.password.trim() 
      : 'ryota123';
    
    console.log('🔐 Password processing:', { 
      originalPassword: formData.password, 
      finalPassword: password,
      passwordChanged: password !== 'ryota123'
    });

    // 1. 認証ユーザーを作成
    console.log('👤 Creating user with password:', password);
    const userResult = await createStaffUser(
      formData.staff_id, 
      formData.display_name, 
      password
    )
    
    if (!userResult.success) {
      return { success: false, error: `ユーザー作成エラー: ${userResult.error}` }
    }

    console.log('✅ User created successfully:', userResult.data.user.id);

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

    console.log('✅ Staff added to database successfully:', staffResult.data);

    return { 
      success: true, 
      message: `✅ スタッフ「${formData.display_name}」が正常に追加されました！`,
      data: staffResult.data,
      user: userResult.data
    }
  } catch (error) {
    console.error('❌ Complete staff addition error:', error)
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
 * スタッフのパスワードを更新
 */
export const updateStaffPassword = async (userId, newPassword) => {
  try {
    console.log('🔐 updateStaffPassword called with:', { 
      userId, 
      newPassword: newPassword,  // 実際のパスワードも表示
      passwordLength: newPassword.length 
    });
    
    // Supabase Edge Functionを呼び出し
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const functionUrl = `${supabaseUrl}/functions/v1/update-user-password`
    
    console.log('📡 Calling password update Edge Function:', functionUrl);
    console.log('📦 Password update payload:', {
      user_id: userId,
      new_password: newPassword
    });
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        user_id: userId,
        new_password: newPassword
      })
    })

    console.log('📡 Password update response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Password update Edge Function error:', errorData);
      throw new Error(errorData.error || 'Failed to update password')
    }

    const result = await response.json()
    console.log('✅ Password update result:', result);
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ Password update error:', error)
    return { success: false, error: error.message }
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

    // 現在のスタッフ情報を取得
    const { data: currentStaff, error: fetchError } = await supabase
      .from('staffs')
      .select('*')
      .eq('id', staffId)
      .single()

    if (fetchError) {
      console.error('❌ Failed to fetch current staff:', fetchError);
      return { success: false, error: 'スタッフ情報の取得に失敗しました' }
    }

    console.log('📋 Current staff data:', currentStaff);

    // データベース更新のためのデータを準備
    const updateData = {
      staff_id: formData.staff_id,
      display_name: formData.display_name,
      email: `${formData.staff_id}@hostclub.local`,
      notes: formData.notes || '',
      is_active: formData.is_active !== undefined ? formData.is_active : true
    };

    console.log('📝 Update data prepared:', updateData);

    // パスワードが変更された場合は認証ユーザーのパスワードも更新
    if (formData.password && formData.password.trim() !== '' && currentStaff.user_id) {
      console.log('🔐 Password change detected, updating auth user password...');
      const passwordResult = await updateStaffPassword(currentStaff.user_id, formData.password.trim())
      
      if (!passwordResult.success) {
        console.error('❌ Password update failed:', passwordResult.error);
        return { success: false, error: `パスワード更新エラー: ${passwordResult.error}` }
      }
      
      console.log('✅ Password updated successfully');
    } else if (formData.password !== undefined) {
      console.log('🔐 Password field present but empty, skipping password update');
    } else {
      console.log('🔐 No password field provided, skipping password update');
    }

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