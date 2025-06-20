import React from 'react'
import { useApp } from '../contexts/AppContext'

const Layout = ({ children }) => {
  const { user, signOut, getUserRole, getUserStoreId } = useApp()
  
  const role = getUserRole()
  const storeId = getUserStoreId()

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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <header style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '1rem 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            ホストクラブ案内所システム
          </h1>
          
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '0.9rem' }}>
                <div>{getRoleDisplayName(role)}</div>
                {storeId && (
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                    店舗ID: {storeId}
                  </div>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="btn btn-secondary"
                style={{ fontSize: '0.9rem', padding: '8px 16px' }}
              >
                ログアウト
              </button>
            </div>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main style={{ flex: 1, paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="container">
          {children}
        </div>
      </main>

      {/* フッター（ロール別） */}
      <footer style={{
        backgroundColor: '#34495e',
        color: 'white',
        padding: '1rem 0',
        marginTop: 'auto'
      }}>
        <div className="container">
          <div style={{ fontSize: '0.9rem', textAlign: 'center' }}>
            {role === 'admin' && (
              <div>
                <strong>管理者機能:</strong> 全店舗管理 | 新規契約 | システム設定
              </div>
            )}
            {role === 'staff' && (
              <div>
                <strong>スタッフ機能:</strong> 案内登録 | 店舗確認 | 顧客管理
              </div>
            )}
            {role === 'customer' && (
              <div>
                <strong>店舗機能:</strong> 営業日設定 | 請求確認 | 店舗情報更新
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>
            © 2024 ホストクラブ案内所システム
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout 