import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './contexts/AppContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import StaffDashboard from './pages/StaffDashboard'
import CustomerDashboard from './pages/CustomerDashboard'

// ロールに基づいてダッシュボードにリダイレクトするコンポーネント
const DashboardRedirect = () => {
  const { getUserRole, loading } = useApp()
  
  if (loading) {
    return (
      <div className="loading">
        ダッシュボードを読み込み中...
      </div>
    )
  }
  
  const role = getUserRole()
  
  switch (role) {
    case 'admin':
      return <Navigate to="/admin" replace />
    case 'staff':
      return <Navigate to="/staff" replace />
    case 'customer':
      return <Navigate to="/customer" replace />
    default:
      return <Navigate to="/login" replace />
  }
}

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* パブリックルート */}
        <Route path="/login" element={<Login />} />
        
        {/* ダッシュボードリダイレクト */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          } 
        />
        
        {/* 管理者専用ルート */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* スタッフ専用ルート */}
        <Route 
          path="/staff" 
          element={
            <ProtectedRoute allowedRoles={['staff']}>
              <StaffDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* 顧客（ホストクラブ）専用ルート */}
        <Route 
          path="/customer" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* ルートパスは認証状態に応じてリダイレクト */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          } 
        />
        
        {/* 404ページ */}
        <Route 
          path="*" 
          element={
            <div className="container">
              <div className="card" style={{ textAlign: 'center', marginTop: '4rem' }}>
                <h2>ページが見つかりません</h2>
                <p>お探しのページは存在しないか、移動された可能性があります。</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => window.location.href = '/'}
                >
                  ホームに戻る
                </button>
              </div>
            </div>
          } 
        />
      </Routes>
    </Router>
  )
}

const App = () => {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}

export default App 