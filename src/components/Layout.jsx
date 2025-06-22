import React from 'react'
import { useApp } from '../contexts/AppContext'

const Layout = ({ children }) => {
  const { user, signOut } = useApp()

  const handleLogout = async () => {
    try {
      await signOut()
      // ログアウト後は自動的にログインページにリダイレクトされる
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* ロゴ・タイトル */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                すすきの ホストクラブ案内所
              </h1>
              {user && (
                <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {user.app_metadata?.role === 'admin' && '管理者'}
                  {user.app_metadata?.role === 'staff' && 'スタッフ'}
                  {user.app_metadata?.role === 'customer' && '店舗'}
                </span>
              )}
            </div>

            {/* ユーザー情報・ログアウト */}
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  ログアウト
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            © 2024 すすきの ホストクラブ案内所 - 実際のSupabaseデータを使用中
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout 