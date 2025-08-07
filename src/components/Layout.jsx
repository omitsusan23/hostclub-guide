import React, { useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
// import { useStaffChatNotifications } from '../hooks/useStaffChatNotifications'
// import { usePageTitleNotifications } from '../hooks/usePageTitleNotifications'
// import PushNotificationSettings from './PushNotificationSettings'

const Layout = ({ children }) => {
  const { user, signOut, getUserRole } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const previousLocation = useRef(null)
  
  // トップページかどうかを判定
  const isTopPage = () => {
    const topPaths = ['/', '/dashboard', '/admin', '/staff', '/outstaff', '/customer']
    return topPaths.includes(location.pathname)
  }
  
  // ナビゲーション履歴を管理
  useEffect(() => {
    // 現在のパスを履歴に追加
    const history = JSON.parse(sessionStorage.getItem('navigationHistory') || '[]')
    
    // 同じパスが連続しないように、かつトップページは除外
    if (history[history.length - 1] !== location.pathname && !isTopPage()) {
      history.push(location.pathname)
      // 履歴は最大10件まで保持
      if (history.length > 10) {
        history.shift()
      }
      sessionStorage.setItem('navigationHistory', JSON.stringify(history))
    }
  }, [location])
  
  // スタッフ向け通知機能（staff, outstaff, adminのみ）
  const userRole = getUserRole()
  const showChatNotifications = ['staff', 'outstaff', 'admin'].includes(userRole)
  
  // フックは必ず同じ順序で呼び出す - 一時的に無効化
  // const { unreadCount } = useStaffChatNotifications(
  //   showChatNotifications ? user?.id : null
  // )
  const unreadCount = 0
  
  // ページタイトル通知 - 一時的に無効化
  // usePageTitleNotifications(showChatNotifications ? (unreadCount || 0) : 0)

  const handleLogout = async () => {
    try {
      await signOut()
      // ログアウト後は自動的にログインページにリダイレクトされる
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  const handleBack = () => {
    // セッションストレージから履歴を取得
    const history = JSON.parse(sessionStorage.getItem('navigationHistory') || '[]')
    
    if (history.length > 0) {
      // 現在のページを履歴から削除
      const currentPath = location.pathname
      const filteredHistory = history.filter(path => path !== currentPath)
      
      if (filteredHistory.length > 0) {
        // 直前のページへ戻る
        const previousPath = filteredHistory[filteredHistory.length - 1]
        sessionStorage.setItem('navigationHistory', JSON.stringify(filteredHistory))
        navigate(previousPath)
        return
      }
    }
    
    // 履歴がない場合はロールに応じたダッシュボードへ
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
    if (name.length > 8) {
      return name.substring(0, 8) + '...'
    }
    return name
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-1 xs:px-2 sm:px-4 lg:px-8">
          <div className="flex items-center h-10 xs:h-12 sm:h-16">
            {/* 戻るボタンエリア（常に固定幅を確保） */}
            <div className="flex items-center w-6 xs:w-8 sm:w-12">
              {!isTopPage() && user ? (
                <button
                  onClick={handleBack}
                  className="p-0.5 xs:p-1 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  title="前のページに戻る"
                >
                  <svg className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              ) : (
                // トップページでもスペースを確保するための透明な要素
                <div className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5"></div>
              )}
            </div>

            {/* ロゴ・タイトル + ロール + display name（左寄せ） */}
            <div className="flex items-center flex-1 min-w-0 ml-1">
              <h1 className="font-bold text-gray-900">
                {/* デスクトップ表示 */}
                <span className="hidden sm:inline text-xl">すすきの ホストクラブ案内所</span>
                {/* タブレット表示 */}
                <span className="hidden xs:inline sm:hidden text-sm">すすきの ホストクラブ案内所</span>
                {/* 小さいスマホ表示（2段・小さめ） */}
                <div className="xs:hidden text-xs leading-tight">
                  <div className="text-[10px]">すすきのホスト</div>
                  <div className="text-[10px]" style={{marginLeft: '2.5em'}}>無料案内所</div>
                </div>
              </h1>
              {user && (
                <div className="flex items-center ml-1 sm:ml-4">
                  <span className="px-1 py-0.5 bg-blue-100 text-blue-800 text-[10px] xs:text-xs rounded-full">
                    {getUserRole() === 'admin' && '管理者'}
                    {getUserRole() === 'staff' && 'スタッフ'}
                    {getUserRole() === 'outstaff' && 'アウト'}
                    {getUserRole() === 'customer' && '店舗'}
                  </span>
                  <span className="ml-1 text-[10px] xs:text-xs text-gray-700 truncate max-w-[45px] xs:max-w-[60px]">
                    {getDisplayName()}
                  </span>
                </div>
              )}
            </div>

            {/* 通知とログアウト */}
            <div className="flex items-center ml-1 xs:ml-2 space-x-1 xs:space-x-2">
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
                  className="relative p-1 xs:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  title="スタッフチャット"
                >
                  <svg className="w-4 h-4 xs:w-5 xs:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.945 8.945 0 01-4.951-1.488c-1.035.124-2.091.193-3.161.193C3.635 18.705 2 17.07 2 15.121c0-.8.168-1.56.468-2.248L3 12a9 9 0 1118 0z" />
                  </svg>
                  {/* 未読数バッジ */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] xs:text-xs rounded-full min-w-[16px] xs:min-w-[18px] h-[16px] xs:h-[18px] flex items-center justify-center px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              )}
              
              {/* Push通知設定 - 一時的に無効化 */}
              {/* {user && showChatNotifications && (
                <PushNotificationSettings compact={true} />
              )} */}

            {/* ログアウトボタン */}
              {user && (
                <button
                  onClick={handleLogout}
                  className="px-1.5 py-0.5 xs:px-2 xs:py-1 sm:px-4 sm:py-2 text-[10px] xs:text-xs sm:text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
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