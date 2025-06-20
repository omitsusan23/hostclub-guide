import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'

const Login = () => {
  const { user, signIn, getRoleFromSubdomain } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentRole = getRoleFromSubdomain()

  // 既にログイン済みの場合はダッシュボードにリダイレクト
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await signIn(email, password)
      
      if (error) {
        setError('ログインに失敗しました: ' + error.message)
      }
    } catch (err) {
      setError('ログインエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const getRoleDescription = (role) => {
    switch (role) {
      case 'admin':
        return '案内所管理者'
      case 'staff':
        return '案内所スタッフ'
      case 'customer':
        return 'ホストクラブ担当者'
      default:
        return 'ユーザー'
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'from-purple-600 to-purple-800'
      case 'staff':
        return 'from-blue-600 to-blue-800'
      case 'customer':
        return 'from-green-600 to-green-800'
      default:
        return 'from-gray-600 to-gray-800'
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return '👑'
      case 'staff':
        return '👨‍💼'
      case 'customer':
        return '🏢'
      default:
        return '👤'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* ヘッダー */}
        <div className="text-center">
          <div className={`mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-gradient-to-br ${getRoleColor(currentRole)} mb-4`}>
            <span className="text-3xl">{getRoleIcon(currentRole)}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ホストクラブ案内所システム
          </h1>
          <p className="text-gray-600">
            {getRoleDescription(currentRole)} ログイン
          </p>
        </div>

        {/* ログインフォーム */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r ${getRoleColor(currentRole)} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  ログイン中...
                </div>
              ) : (
                `${getRoleDescription(currentRole)}としてログイン`
              )}
            </button>
          </form>
        </div>

        {/* 開発用情報 */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 mb-1">開発用テスト</h3>
              <div className="text-sm text-blue-700">
                <p>URLに以下のパラメータを追加してロールをテストできます：</p>
                <div className="mt-2 space-y-1">
                  <p><code className="bg-blue-100 px-1 rounded">?role=admin</code> - 管理者モード</p>
                  <p><code className="bg-blue-100 px-1 rounded">?role=staff</code> - スタッフモード</p>
                  <p><code className="bg-blue-100 px-1 rounded">?role=customer</code> - 店舗モード</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login 