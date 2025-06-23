import React from 'react'
import { useApp } from '../contexts/AppContext'

const Layout = ({ children }) => {
  const { user, signOut, getUserRole } = useApp()

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
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-12 sm:h-16">
            {/* ロゴ・タイトル */}
            <div className="flex items-center">
              <h1 className="text-sm sm:text-xl font-bold text-gray-900">
                <span className="hidden sm:inline">すすきの ホストクラブ案内所</span>
                <span className="sm:hidden">すすきのホストクラブ案内所</span>
              </h1>
              {user && (
                <div className="flex items-center ml-1 sm:ml-4">
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {getUserRole() === 'admin' && '管理者'}
                    {getUserRole() === 'staff' && 'スタッフ'}
                    {getUserRole() === 'customer' && '店舗'}
                  </span>
                  <span className="ml-1 text-xs text-gray-700 truncate max-w-[60px]">
                    {user.user_metadata?.display_name || user.email?.split('@')[0] || 'ユーザー'}
                  </span>
                </div>
              )}
            </div>

            {/* ユーザー情報・ログアウト */}
            {user && (
              <div className="flex items-center">
                <button
                  onClick={handleLogout}
                  className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  ログアウト
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-0 sm:px-4 lg:px-8 py-0 sm:py-8">
        {children}
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            © 2024 すすきの ホストクラブ案内所
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout 