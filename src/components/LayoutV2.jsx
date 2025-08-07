import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'

const LayoutV2 = ({ children }) => {
  const { user, signOut, getUserRole } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // トップページかどうかを判定
  const isTopPage = () => {
    const topPaths = ['/', '/dashboard', '/admin', '/staff', '/outstaff', '/customer']
    return topPaths.includes(location.pathname)
  }
  
  // ページ遷移時の処理
  useEffect(() => {
    // ページ遷移時にモバイルメニューを閉じる
    setIsMobileMenuOpen(false)
  }, [location])
  
  // スタッフ向け通知機能（staff, outstaff, adminのみ）
  const userRole = getUserRole()
  const showChatNotifications = ['staff', 'outstaff', 'admin'].includes(userRole)
  
  const unreadCount = 0

  const handleLogout = async () => {
    try {
      await signOut()
      // ログアウト後は自動的にログインページにリダイレクトされる
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  const handleBack = () => {
    // 常にロールに応じたダッシュボードへ戻る
    const role = getUserRole()
    switch (role) {
      case 'admin':
        navigate('/admin')
        break
      case 'staff':
        navigate('/staff')
        break
      case 'outstaff':
        navigate('/outstaff')
        break
      case 'customer':
        navigate('/customer')
        break
      default:
        navigate('/')
    }
  }

  // display nameの省略処理
  const getDisplayName = () => {
    const name = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'ユーザー'
    if (name.length > 10) {
      return name.substring(0, 10) + '...'
    }
    return name
  }

  // ロールの表示名
  const getRoleDisplay = () => {
    switch (getUserRole()) {
      case 'admin': return '管理者'
      case 'staff': return 'スタッフ'
      case 'outstaff': return 'アウト'
      case 'customer': return '店舗'
      default: return ''
    }
  }

  // ロールの色
  const getRoleColor = () => {
    switch (getUserRole()) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200'
      case 'staff': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'outstaff': return 'bg-green-100 text-green-800 border-green-200'
      case 'customer': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー（改善版） */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* 左側: 戻るボタン + ロゴ */}
            <div className="flex items-center flex-1 min-w-0">
              {/* 戻るボタン */}
              {!isTopPage() && user && (
                <button
                  onClick={handleBack}
                  className="mr-2 sm:mr-3 p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="前のページに戻る"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              
              {/* ロゴ（レスポンシブ） */}
              <div className="flex items-center flex-1 min-w-0">
                <h1 className="font-bold text-gray-900 truncate">
                  {/* デスクトップ */}
                  <span className="hidden sm:inline text-lg lg:text-xl">
                    すすきの ホストクラブ案内所
                  </span>
                  {/* モバイル */}
                  <span className="sm:hidden text-sm">
                    すすきの案内所
                  </span>
                </h1>
              </div>
            </div>

            {/* 右側: ユーザー情報 + アクション */}
            <div className="flex items-center ml-2 sm:ml-4">
              {user && (
                <>
                  {/* ユーザー情報（デスクトップ） */}
                  <div className="hidden sm:flex items-center mr-3">
                    <span className={`px-2 py-1 text-xs rounded-full border ${getRoleColor()}`}>
                      {getRoleDisplay()}
                    </span>
                    <span className="ml-2 text-sm text-gray-700 max-w-[100px] truncate">
                      {getDisplayName()}
                    </span>
                  </div>

                  {/* モバイルメニューボタン */}
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="sm:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {isMobileMenuOpen ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </button>

                  {/* デスクトップメニュー */}
                  <div className="hidden sm:flex items-center space-x-2">
                    {/* スタッフチャット通知 */}
                    {showChatNotifications && (
                      <button
                        onClick={() => {
                          if (userRole === 'admin') navigate('/admin')
                          else if (userRole === 'outstaff') navigate('/outstaff')
                          else navigate('/staff')
                        }}
                        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="スタッフチャット"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.945 8.945 0 01-4.951-1.488c-1.035.124-2.091.193-3.161.193C3.635 18.705 2 17.07 2 15.121c0-.8.168-1.56.468-2.248L3 12a9 9 0 1118 0z" />
                        </svg>
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </button>
                    )}

                    {/* ログアウトボタン */}
                    <button
                      onClick={handleLogout}
                      className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      ログアウト
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* モバイルメニュー（ドロップダウン） */}
          {user && isMobileMenuOpen && (
            <div className="sm:hidden border-t border-gray-200 py-3">
              <div className="space-y-2">
                {/* ユーザー情報 */}
                <div className="px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`px-2 py-1 text-xs rounded-full border ${getRoleColor()}`}>
                      {getRoleDisplay()}
                    </span>
                    <span className="ml-2 text-sm text-gray-700">
                      {getDisplayName()}
                    </span>
                  </div>
                </div>

                {/* スタッフチャット */}
                {showChatNotifications && (
                  <button
                    onClick={() => {
                      if (userRole === 'admin') navigate('/admin')
                      else if (userRole === 'outstaff') navigate('/outstaff')
                      else navigate('/staff')
                      setIsMobileMenuOpen(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                  >
                    <span>スタッフチャット</span>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                )}

                {/* ログアウト */}
                <button
                  onClick={() => {
                    handleLogout()
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  ログアウト
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8">
          {children}
        </div>
      </main>

      {/* フッター（シンプル化） */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="text-center text-xs sm:text-sm text-gray-500">
            © 2025 すすきの ホストクラブ案内所
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LayoutV2