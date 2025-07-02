import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext()

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userStaff, setUserStaff] = useState(null)

  // サブドメインからstore_idを取得する関数
  const getStoreIdFromSubdomain = () => {
    const hostname = window.location.hostname
    
    // 開発環境の場合
    if (hostname === 'localhost' || hostname.includes('127.0.0.1') || hostname.includes('192.168.')) {
      // クエリパラメータから取得
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get('store_id') || 'demo-store'
    }
    
    // 本番環境の場合はサブドメインを取得
    const subdomain = hostname.split('.')[0]
    
    // 管理者・スタッフページの場合はnullを返す
    if (subdomain === 'admin' || subdomain === 'staff') {
      return null
    }
    
    return subdomain
  }

  // サブドメインからロールを判定する関数
  const getRoleFromSubdomain = () => {
    const hostname = window.location.hostname
    
    // 開発環境の場合
    if (hostname === 'localhost' || hostname.includes('127.0.0.1') || hostname.includes('192.168.')) {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get('role') || 'customer'
    }
    
    // 本番環境のサブドメイン判定
    const subdomain = hostname.split('.')[0]
    
    switch (subdomain) {
      case 'admin':
        return 'admin'
      case 'staff':
        return 'staff'
      case 'outstaff':
        return 'outstaff'
      default:
        // store1.example.com のような形式の場合はcustomer
        return 'customer'
    }
  }

  // ユーザーのスタッフ情報を取得
  const fetchUserStaffInfo = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('staffs')
        .select('display_name')
        .eq('user_id', userId)
        .single()
      
      if (!error && data) {
        setUserStaff(data)
      } else {
        setUserStaff(null)
      }
    } catch (error) {
      console.warn('スタッフ情報取得エラー（続行します）:', error)
      setUserStaff(null)
    }
  }

  // 認証状態の変更を監視
  useEffect(() => {
    // 現在のセッションを取得
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        
        // スタッフ情報を非ブロッキングで取得
        if (session?.user) {
          fetchUserStaffInfo(session.user.id).catch(console.warn)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('セッション取得エラー:', error)
        setLoading(false)
      }
    }

    getSession()

    // 認証状態の変更をリッスン
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        // スタッフ情報を非ブロッキングで取得
        if (session?.user) {
          fetchUserStaffInfo(session.user.id).catch(console.warn)
        } else {
          setUserStaff(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ログイン
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // ログアウト（改善版）
  const signOut = async () => {
    try {
      // セッションが存在する場合のみログアウト実行
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      if (currentSession) {
        console.log('📤 ログアウト実行中...')
      const { error } = await supabase.auth.signOut()
      if (error) throw error
        console.log('✅ ログアウト成功')
      } else {
        console.log('ℹ️ セッションが存在しないため、ローカル状態のみクリア')
        // セッションが存在しない場合はローカル状態をクリア
        setSession(null)
        setUser(null)
        setUserStaff(null)
      }
    } catch (error) {
      console.error('❌ ログアウトエラー:', error)
      
      // エラーが発生してもローカル状態はクリア
      setSession(null)
      setUser(null)
      setUserStaff(null)
      
      // AuthSessionMissingErrorの場合は無視（既にログアウト済み）
      if (error.message?.includes('Auth session missing')) {
        console.log('ℹ️ セッション既に無効 - ローカル状態をクリアしました')
      } else {
        // その他のエラーは表示
        throw error
      }
    }
  }

  // パスワード更新（管理者権限必須）
  const updatePassword = async (newPassword) => {
    try {
      // 管理者権限チェック - 管理者以外はパスワード変更を禁止
      if (!hasAdminPermissions()) {
        console.error('❌ パスワード変更権限なし:', {
          userRole: getUserRole(),
          userStaff: userStaff,
          hasAdminPermissions: hasAdminPermissions()
        })
        return { 
          data: null, 
          error: { message: 'パスワード変更権限がありません。管理者にお問い合わせください。' }
        }
      }

      console.log('🔐 管理者権限確認済み - パスワード更新実行')
      
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      
      console.log('✅ パスワード更新成功')
      return { data, error: null }
    } catch (error) {
      console.error('❌ パスワード更新エラー:', error)
      return { data: null, error }
    }
  }

  // ユーザーのロールを取得
  const getUserRole = () => {
    if (!user) return null
    
    // app_metadataからroleを取得、なければサブドメインから判定
    return user.app_metadata?.role || getRoleFromSubdomain()
  }

  // ユーザーの店舗IDを取得
  const getUserStoreId = () => {
    if (!user) return null
    
    // app_metadataからstore_idを取得、なければサブドメインから取得
    return user.app_metadata?.store_id || getStoreIdFromSubdomain()
  }

  // アクセス権限チェック（customerロールの場合のみstore_idをチェック）
  const hasAccess = () => {
    const role = getUserRole()
    const userStoreId = getUserStoreId()
    const currentStoreId = getStoreIdFromSubdomain()

    // 管理者とスタッフ（staff/outstaff）は常にアクセス可能
    if (role === 'admin' || role === 'staff' || role === 'outstaff') {
      return true
    }

    // customerの場合はstore_idが一致する必要がある
    if (role === 'customer') {
      return userStoreId === currentStoreId
    }

    return false
  }

  // 管理者権限チェック（adminロールまたはdisplay name「亮太」）
  const hasAdminPermissions = () => {
    const role = getUserRole()
    // adminロールまたはstaffロールかつdisplay nameが「亮太」の場合に管理者権限を付与
    return role === 'admin' || (role === 'staff' && userStaff && userStaff.display_name === '亮太')
  }

  const value = {
    user,
    session,
    loading,
    userStaff,
    signIn,
    signOut,
    updatePassword,
    getUserRole,
    getUserStoreId,
    getStoreIdFromSubdomain,
    getRoleFromSubdomain,
    hasAccess,
    hasAdminPermissions,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
} 