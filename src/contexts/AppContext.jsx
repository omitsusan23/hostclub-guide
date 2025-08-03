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

  // サブドメインまたはURLパスからstore_idを取得する関数
  const getStoreIdFromSubdomain = () => {
    const hostname = window.location.hostname
    const pathname = window.location.pathname
    
    // URLパス方式のチェック (/store/xxx の形式)
    // React Routerのパスも考慮
    if (pathname.includes('/store/')) {
      const pathParts = pathname.split('/')
      const storeIndex = pathParts.indexOf('store')
      if (storeIndex !== -1 && pathParts[storeIndex + 1]) {
        const storeId = pathParts[storeIndex + 1]
        console.log('🏪 URLパス方式でstore_id取得:', storeId, 'from path:', pathname)
        return storeId
      }
    }
    
    // 開発環境の場合
    if (hostname === 'localhost' || hostname.includes('127.0.0.1') || hostname.includes('192.168.')) {
      // クエリパラメータから取得
      const urlParams = new URLSearchParams(window.location.search)
      const queryStoreId = urlParams.get('store_id')
      if (queryStoreId) {
        return queryStoreId
      }
      // URLパスから既に取得できている場合はnullを返す（demo-storeは返さない）
      return null
    }
    
    // 本番環境の場合はサブドメインを取得
    const subdomain = hostname.split('.')[0]
    
    // 管理者・スタッフページの場合はnullを返す
    if (subdomain === 'admin' || subdomain === 'staff' || subdomain === 'outstaff') {
      return null
    }
    
    // customer サブドメインの場合もnullを返す（URLパスから取得するため）
    if (subdomain === 'customer') {
      return null
    }
    
    return subdomain
  }

  // サブドメインまたはURLパスからロールを判定する関数
  const getRoleFromSubdomain = () => {
    const hostname = window.location.hostname
    const pathname = window.location.pathname
    
    // URLパス方式のチェック (/store/xxx の形式は customer ロール)
    if (pathname.startsWith('/store/')) {
      return 'customer'
    }
    
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
      case 'customer':
        // customer.susukino-hostclub-guide.online の場合
        return 'customer'
      default:
        // メインドメインの場合はadmin専用とする
        if (hostname === 'susukino-hostclub-guide.online' || hostname === 'www.susukino-hostclub-guide.online') {
          return 'admin'
        }
        // その他のサブドメイン（store1など）の場合はcustomer
        return 'customer'
    }
  }

  // ユーザーのスタッフ情報を取得
  const fetchUserStaffInfo = async (userId, userData) => {
    try {
      // customerロールの場合はスタッフ情報を取得しない
      const role = userData?.user_metadata?.role || userData?.app_metadata?.role
      if (role === 'customer') {
        console.log('📝 customerロールのためスタッフ情報取得をスキップ')
        setUserStaff(null)
        return
      }
      
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
        console.log('🔐 セッション取得:', {
          sessionExists: !!session,
          userEmail: session?.user?.email,
          userMetadata: session?.user?.user_metadata,
          appMetadata: session?.user?.app_metadata
        })
        setSession(session)
        setUser(session?.user ?? null)
        
        // スタッフ情報を非ブロッキングで取得
        if (session?.user) {
          fetchUserStaffInfo(session.user.id, session.user).catch(console.warn)
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
          fetchUserStaffInfo(session.user.id, session.user).catch(console.warn)
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
      // 現在のドメインとサブドメインを取得して情報表示
      const hostname = window.location.hostname
      
      // 本番環境でサブドメインがある場合の情報表示
      if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
        const subdomain = hostname.split('.')[0]
        
        // rberu などの店舗サブドメインの場合は情報をログ出力
        if (subdomain !== 'admin' && subdomain !== 'staff' && subdomain !== 'outstaff') {
          console.log('🏪 店舗サブドメイン認証:', { subdomain, hostname })
        }
      }
      
      // 認証オプション（リダイレクトURLは signInWithPassword では使用しない）
      const authOptions = {
        email,
        password,
      }
      
      const { data, error } = await supabase.auth.signInWithPassword(authOptions)
      
      if (error) throw error
      
      console.log('✅ ログイン成功:', {
        userEmail: data.user?.email,
        userMetadata: data.user?.user_metadata,
        subdomain: window.location.hostname.split('.')[0]
      })
      
      return { data, error: null }
    } catch (error) {
      console.error('❌ ログインエラー:', error)
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
    // サブドメインベースの判定を優先
    const subdomainRole = getRoleFromSubdomain()
    
    // rberu のような店舗サブドメインの場合は customer として扱う
    if (subdomainRole === 'customer' && getStoreIdFromSubdomain()) {
      console.log('🏪 サブドメインベース認証:', { 
        subdomain: getStoreIdFromSubdomain(), 
        role: 'customer' 
      })
      return 'customer'
    }
    
    // ユーザーメタデータからロールを取得
    if (user?.user_metadata?.role) {
      return user.user_metadata.role
    }
    
    // app_metadataからロールを取得（フォールバック）
    if (user?.app_metadata?.role) {
      return user.app_metadata.role
    }
    
    // サブドメインベースの判定をフォールバックとして使用
    return subdomainRole
  }

  // ユーザーの店舗IDを取得
  const getUserStoreId = () => {
    if (!user) return null
    
    // user_metadataからstore_idを取得、なければapp_metadata、最後にサブドメインから取得
    const storeId = user.user_metadata?.store_id || user.app_metadata?.store_id || getStoreIdFromSubdomain()
    console.log('🏪 getUserStoreId:', {
      email: user.email,
      userMetadataStoreId: user.user_metadata?.store_id,
      appMetadataStoreId: user.app_metadata?.store_id,
      subdomainStoreId: getStoreIdFromSubdomain(),
      finalStoreId: storeId
    })
    return storeId
  }

  // アクセス権限チェック（customerロールの場合のみstore_idをチェック）
  const hasAccess = () => {
    const role = getUserRole()
    const userStoreId = getUserStoreId()
    const currentStoreId = getStoreIdFromSubdomain()

    console.log('🔐 アクセス権限チェック:', {
      role,
      userStoreId,
      currentStoreId,
      pathname: window.location.pathname
    })

    // 管理者とスタッフ（staff/outstaff）は常にアクセス可能
    if (role === 'admin' || role === 'staff' || role === 'outstaff') {
      return true
    }

    // customerの場合
    if (role === 'customer') {
      // URLパス方式の場合、currentStoreIdが取得できていることを確認
      if (currentStoreId) {
        const accessGranted = userStoreId === currentStoreId
        console.log('🏪 店舗アクセス判定:', {
          userStoreId,
          currentStoreId,
          accessGranted
        })
        return accessGranted
      }
      // store_idが取得できない場合もcustomerロールなら許可
      // （ログイン直後など）
      return true
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