import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { useStaffChatNotifications } from '../hooks/useStaffChatNotifications'

const Layout = ({ children }) => {
  const { user, signOut, getUserRole } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  
  // スタッフ向け通知機能（staff, outstaff, adminのみ）
  const userRole = getUserRole()
  const showChatNotifications = ['staff', 'outstaff', 'admin'].includes(userRole)
  const { unreadCount } = useStaffChatNotifications(
    showChatNotifications ? user?.id : null
  )

  const handleLogout = async () => {
    try {
      await signOut()
      // ログアウト後は自動的にログインページにリダイレクトされる
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  // トップページかどうかを判定
  const isTopPage = () => {
    const topPaths = ['/', '/dashboard', '/admin', '/staff', '/outstaff', '/customer']
    return topPaths.includes(location.pathname)
  }

  // display nameの省略処理
  const getDisplayName = () => {
    const name = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'ユーザー'
    if (name.length > 8) {
      return name.substring(0, 8) + '...'
    }
    return name
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center h-12 sm:h-16">
            {/* 戻るボタンエリア（常に固定幅を確保） */}
            <div className="flex items-center w-8 sm:w-12">
              {!isTopPage() && user ? (
                <button
                  onClick={handleBack}
                  className="p-1 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  title="前のページに戻る"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              ) : (
                // トップページでもスペースを確保するための透明な要素
                <div className="w-4 h-4 sm:w-5 sm:h-5"></div>
              )}
            </div>

            {/* ロゴ・タイトル + ロール + display name（左寄せ） */}
            <div className="flex items-center flex-1 min-w-0 ml-1">
              <h1 className="font-bold text-gray-900">
                {/* デスクトップ表示 */}
                <span className="hidden sm:inline text-xl">すすきの ホストクラブ案内所</span>
                {/* モバイル表示（2段） */}
                <div className="sm:hidden text-xs leading-tight">
                  <div>すすきのホストクラブ</div>
                  <div style={{marginLeft: '3em'}}>無料案内所</div>
                </div>
              </h1>
              {user && (
                <div className="flex items-center ml-1 sm:ml-4">
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {getUserRole() === 'admin' && '管理者'}
                    {getUserRole() === 'staff' && 'スタッフ'}
                    {getUserRole() === 'outstaff' && 'アウトスタッフ'}
                    {getUserRole() === 'customer' && '店舗'}
                  </span>
                  <span className="ml-1 text-xs text-gray-700 truncate max-w-[60px]">
                    {getDisplayName()}
                  </span>
                </div>
              )}
            </div>

            {/* 通知とログアウト */}
            <div className="flex items-center ml-2 space-x-2">
              {/* スタッフチャット通知 */}
              {user && showChatNotifications && (
                <button
                  onClick={() => {
                    // ダッシュボードに戻る
                    if (userRole === 'admin') {
                      navigate('/admin')
                    } else if (userRole === 'outstaff') {
                      navigate('/outstaff')
                    } else {
                      navigate('/staff')
                    }
                  }}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  title="スタッフチャット"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.945 8.945 0 01-4.951-1.488c-1.035.124-2.091.193-3.161.193C3.635 18.705 2 17.07 2 15.121c0-.8.168-1.56.468-2.248L3 12a9 9 0 1118 0z" />
                  </svg>
                  {/* 未読数バッジ */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              )}
              
              {/* ログアウトボタン */}
              {user && (
                <button
                  onClick={handleLogout}
                  className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  ログアウト
                </button>
              )}
            </div>
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
            © 2025 すすきの ホストクラブ案内所
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout 