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
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  // サブドメインからロールを判定する関数
  const getRoleFromSubdomain = () => {
    const hostname = window.location.hostname
    const subdomain = hostname.split('.')[0]
    
    // 開発環境用の分岐
    if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
      // URLのクエリパラメータからロールを取得（開発用）
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get('role') || 'admin'
    }
    
    // 本番環境用のサブドメイン判定
    switch (subdomain) {
      case 'admin':
        return 'admin'
      case 'staff':
        return 'staff'
      default:
        // store1.example.com のような形式の場合はcustomer
        return 'customer'
    }
  }

  // ユーザーの認証状態を確認
  useEffect(() => {
    // 初回の認証状態チェック
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

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

  // ログアウト
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  // ユーザーのロールを取得
  const getUserRole = () => {
    if (!user) return null
    
    // user_metadataからroleを取得、なければサブドメインから判定
    return user.user_metadata?.role || getRoleFromSubdomain()
  }

  // ユーザーの店舗IDを取得
  const getUserStoreId = () => {
    if (!user) return null
    return user.user_metadata?.store_id || null
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    getUserRole,
    getUserStoreId,
    getRoleFromSubdomain,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
} 