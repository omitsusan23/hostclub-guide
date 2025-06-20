import React from 'react'
import { Navigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, getUserRole } = useApp()

  if (loading) {
    return (
      <div className="loading">
        認証情報を確認中...
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
      <div className="container">
        <div className="card">
          <h2>アクセス権限がありません</h2>
          <p>このページにアクセスする権限がありません。</p>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute 