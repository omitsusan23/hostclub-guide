import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user, signIn, loading: authLoading, getStoreIdFromSubdomain } = useApp()

  // 既にログイン済みの場合はダッシュボードにリダイレクト
  if (user && !authLoading) {
    // URLパス方式で店舗IDがある場合は、そのまま留まる
    const storeId = getStoreIdFromSubdomain()
    if (storeId && window.location.pathname.startsWith('/store/')) {
      // /store/xxx の場合はそのまま留まる（リダイレクトしない）
      return <Navigate to={window.location.pathname} replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    console.log('🔐 ログイン試行:', { email })

    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        console.error('❌ ログインエラー:', error)
        setError(`ログインエラー: ${error.message || 'メールアドレスまたはパスワードが正しくありません'}`)
      } else {
        console.log('✅ ログイン成功')
      }
    } catch (err) {
      console.error('❌ 予期しないエラー:', err)
      setError('ログイン中にエラーが発生しました')
    } finally {
      setLoading(false)
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
            すすきの ホストクラブ案内所システム
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="メールアドレス"
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
                autoComplete="current-password"
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

          <div className="text-center">
            <div className="text-sm text-gray-600">
              アカウントをお持ちでない場合は、管理者にお問い合わせください。
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login 