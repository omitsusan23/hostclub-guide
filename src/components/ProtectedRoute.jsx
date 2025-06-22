import React from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, getUserRole, hasAccess, signOut } = useApp()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">認証情報を確認中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const userRole = getUserRole()
  
  // ロール制限がある場合はチェック
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">アクセス権限がありません</h2>
          <p className="text-gray-600 mb-4">このページにアクセスする権限がありません。</p>
          <button 
            onClick={() => navigate('/dashboard', { replace: true })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    )
  }

  // store_idベースのアクセス権限チェック（customerロールの場合）
  if (!hasAccess()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">店舗アクセス権限がありません</h2>
          <p className="text-gray-600 mb-4">
            この店舗のページにアクセスする権限がありません。<br/>
            正しい店舗URLでアクセスしてください。
          </p>
          <button 
            onClick={async () => {
              try {
                // ログアウト処理を実行
                await signOut();
                // ログイン画面に遷移
                navigate('/login', { replace: true });
              } catch (error) {
                console.error('ログアウトエラー:', error);
                // エラーが発生してもログイン画面に遷移
                navigate('/login', { replace: true });
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            ログイン画面に戻る
          </button>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute 