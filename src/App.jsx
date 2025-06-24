import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './contexts/AppContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import StaffDashboard from './pages/StaffDashboard'
import CustomerDashboard from './pages/CustomerDashboard'
import StoreHolidaysPage from './pages/StoreHolidaysPage'
import TodayOpenStoresPage from './pages/TodayOpenStoresPage'
import StaffPerformancePage from './pages/StaffPerformancePage'
import PastPerformancePage from './pages/PastPerformancePage'
import StoreManagementPage from './pages/StoreManagementPage'
import StaffManagementPage from './pages/StaffManagementPage'

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
        
        {/* スタッフ案内実績ページ */}
        <Route 
          path="/staff-performance" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <StaffPerformancePage />
            </ProtectedRoute>
          } 
        />
        
        {/* 過去の案内実績ページ */}
        <Route 
          path="/past-performance" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <PastPerformancePage />
            </ProtectedRoute>
          } 
        />
        
        {/* 店舗管理ページ（display name「亮太」のみ） */}
        <Route 
          path="/store-management" 
          element={
            <ProtectedRoute allowedRoles={['staff']} requireAdminPermissions={true}>
              <StoreManagementPage />
            </ProtectedRoute>
          } 
        />
        
        {/* スタッフ管理ページ（display name「亮太」のみ） */}
        <Route 
          path="/staff-management" 
          element={
            <ProtectedRoute allowedRoles={['staff']} requireAdminPermissions={true}>
              <StaffManagementPage />
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
        
        {/* 店休日設定ページ */}
        <Route 
          path="/customer/holidays" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <StoreHolidaysPage />
            </ProtectedRoute>
          } 
        />
        
        {/* 本日の営業店舗ページ（admin/staff専用） */}
        <Route 
          path="/today-open-stores" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <TodayOpenStoresPage />
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-gray-600 mb-8">お探しのページが見つかりません</p>
                <button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  ダッシュボードに戻る
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