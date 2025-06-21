import React, { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { getStoreById } from '../lib/types'
import PasswordChange from './PasswordChange'

const Layout = ({ children }) => {
  const { user, signOut, getUserRole, getUserStoreId } = useApp()
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  
  const role = getUserRole()
  const storeId = getUserStoreId()
  const store = storeId ? getStoreById(storeId) : null

  const handleSignOut = async () => {
    await signOut()
  }

  const getRoleDisplayName = (role) => {
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ヘッダー */}
      <header className={`bg-gradient-to-r ${getRoleColor(role)} shadow-lg`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🏢</div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  ホストクラブ案内所システム
                </h1>
                <div className="text-sm text-gray-200">
                  すすきの案内所 業務管理システム
                </div>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="flex items-center text-white">
                    <span className="mr-2">{getRoleIcon(role)}</span>
                    <span className="font-medium">{getRoleDisplayName(role)}</span>
                  </div>
                  {store && (
                    <div className="text-sm text-gray-200">
                      {store.name}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="px-3 py-2 bg-white bg-opacity-20 text-white rounded-md hover:bg-opacity-30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 text-sm"
                >
                  🔑 パスワード変更
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-md hover:bg-opacity-30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                >
                  ログアウト
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {children}
        </div>
      </main>

      {/* フッター（ロール別） */}
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="text-center">
            {role === 'admin' && (
              <div className="mb-3">
                <div className="flex justify-center items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-1">
                    <span>🏪</span>
                    <span>全店舗管理</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>📝</span>
                    <span>新規契約</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>⚙️</span>
                    <span>システム設定</span>
                  </div>
                </div>
              </div>
            )}
            {role === 'staff' && (
              <div className="mb-3">
                <div className="flex justify-center items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-1">
                    <span>👥</span>
                    <span>案内登録</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>🏢</span>
                    <span>店舗確認</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>💬</span>
                    <span>チャット</span>
                  </div>
                </div>
              </div>
            )}
            {role === 'customer' && (
              <div className="mb-3">
                <div className="flex justify-center items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-1">
                    <span>📅</span>
                    <span>営業日設定</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>💰</span>
                    <span>請求確認</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>📡</span>
                    <span>リアルタイム状況</span>
                  </div>
                </div>
              </div>
            )}
            <div className="text-xs text-gray-400 border-t border-gray-700 pt-3">
              © 2024 ホストクラブ案内所システム - すべての権利を保有します
            </div>
          </div>
        </div>
      </footer>

      {/* パスワード変更モーダル */}
      {showPasswordChange && (
        <PasswordChange onClose={() => setShowPasswordChange(false)} />
      )}
    </div>
  )
}

export default Layout 