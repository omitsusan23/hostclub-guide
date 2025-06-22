import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { createSingleUser } from '../utils/createUsers'

const Login = () => {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createUserLoading, setCreateUserLoading] = useState(false)
  const [createUserResult, setCreateUserResult] = useState('')
  const { user, signIn, loading: authLoading } = useApp()

  // 既にログイン済みの場合はダッシュボードにリダイレクト
  if (user && !authLoading) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // IDをホストクラブメールアドレスに変換
      const email = `${loginId}@hostclub.local`
      const { error } = await signIn(email, password)
      
      if (error) {
        setError('ログインIDまたはパスワードが正しくありません')
      }
    } catch (err) {
      setError('ログイン中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // 開発用：テストユーザー作成
  const handleCreateTestUser = async () => {
    if (!loginId) {
      setCreateUserResult('ログインIDを入力してからユーザー作成ボタンを押してください')
      return
    }

    setCreateUserLoading(true)
    setCreateUserResult('')

    try {
      const result = await createSingleUser(loginId)
      
      if (result.success) {
        setCreateUserResult(`✅ ユーザー「${loginId}@hostclub.local」を作成しました！`)
      } else {
        setCreateUserResult(`❌ エラー: ${result.error}`)
      }
    } catch (err) {
      setCreateUserResult(`❌ エラー: ${err.message}`)
    } finally {
      setCreateUserLoading(false)
    }
  }

  // 認証状態の読み込み中
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ログイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            ログインIDとパスワードを入力してください
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="loginId" className="sr-only">
                ログインID
              </label>
              <input
                id="loginId"
                name="loginId"
                type="text"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="ログインID"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="パスワード"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </div>

          {/* 開発用：デモログインとテストユーザー作成ボタン */}
          <div className="border-t pt-4">
            <p className="text-center text-xs text-gray-500 mb-2">開発用機能</p>
            
            {/* デモログインボタン */}
            <button
              type="button"
              onClick={() => {
                // デモ用のユーザーデータを設定
                const demoUser = {
                  id: 'demo-customer-001',
                  email: 'demo@hostclub.local',
                  app_metadata: {
                    role: 'customer',
                    store_id: 'demo-store'
                  }
                };
                // 直接ユーザー状態を設定（開発用）
                window.localStorage.setItem('demo-user', JSON.stringify(demoUser));
                window.location.reload();
              }}
              className="group relative w-full flex justify-center py-2 px-4 mb-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              🏪 デモ顧客でログイン（開発用）
            </button>
            
            <button
              type="button"
              onClick={handleCreateTestUser}
              disabled={createUserLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createUserLoading ? 'ユーザー作成中...' : 'テストユーザー作成'}
            </button>
            
            {createUserResult && (
              <div className="mt-2 p-2 text-xs text-center bg-gray-50 rounded border">
                {createUserResult}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login 