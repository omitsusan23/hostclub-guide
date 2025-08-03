import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './contexts/AppContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import StaffDashboard from './pages/StaffDashboard'
import OutstaffDashboard from './pages/OutstaffDashboard'
import CustomerDashboard from './pages/CustomerDashboard'
import CustomerBillingPage from './pages/CustomerBillingPage'
import StoreHolidaysPage from './pages/StoreHolidaysPage'
import TodayOpenStoresPage from './pages/TodayOpenStoresPage'
import StaffPerformancePage from './pages/StaffPerformancePage'
import PastPerformancePage from './pages/PastPerformancePage'
import StoreManagementPage from './pages/StoreManagementPage'
import StaffManagementPage from './pages/StaffManagementPage'
import OutstaffStoreSettingsPage from './pages/OutstaffStoreSettingsPage'

// ロールに基づいてダッシュボードにリダイレクトするコンポーネント
const DashboardRedirect = () => {
  const { getUserRole, loading, getStoreIdFromSubdomain } = useApp()
  
  if (loading) {
    return (
      <div className="loading">
        ダッシュボードを読み込み中...
      </div>
    )
  }
  
  const role = getUserRole()
  const storeId = getStoreIdFromSubdomain()
  const hostname = window.location.hostname
  const subdomain = hostname.split('.')[0]
  
  // URLパス方式での店舗アクセスの場合、そのままのパスを維持
  if (window.location.pathname.startsWith('/store/')) {
    console.log('🏪 URLパス方式の店舗アクセス:', { pathname: window.location.pathname, role })
    // すでに /store/xxx にいる場合はそのまま
    return null
  }
  
  // 店舗サブドメインは廃止済み（customerサブドメインのみ使用）
  
  switch (role) {
    case 'admin':
      return <Navigate to="/admin" replace />
    case 'staff':
      return <Navigate to="/staff" replace />
    case 'outstaff':
      return <Navigate to="/outstaff" replace />
    case 'customer':
      // URLパス方式で店舗IDがある場合
      if (storeId) {
        return <Navigate to={`/store/${storeId}`} replace />
      }
      return <Navigate to="/customer" replace />
    default:
      // デフォルトではログイン画面に戻す
      console.log('⚠️ 不明なロール、ログイン画面にリダイレクト:', { role, storeId })
      return <Navigate to="/login" replace />
  }
}

// 認証コールバック処理コンポーネント
const AuthCallback = () => {
  const { user, loading, getStoreIdFromSubdomain } = useApp()
  
  useEffect(() => {
    if (!loading && user) {
      const storeId = getStoreIdFromSubdomain()
      
      // サブドメインがある場合は適切なダッシュボードにリダイレクト
      if (storeId) {
        console.log('🔄 認証コールバック - 店舗ダッシュボードにリダイレクト:', storeId)
        window.location.href = '/customer'
      } else {
        console.log('🔄 認証コールバック - 一般ダッシュボードにリダイレクト')
        window.location.href = '/dashboard'
      }
    }
  }, [user, loading, getStoreIdFromSubdomain])
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">認証処理中...</p>
        </div>
      </div>
    )
  }
  
  return <Navigate to="/login" replace />
}

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* パブリックルート */}
        <Route path="/login" element={<Login />} />
        
        {/* 認証コールバック */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* ルートアクセス時の自動リダイレクト */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          } 
        />
        
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
        
        {/* 外注スタッフ専用ルート */}
        <Route 
          path="/outstaff" 
          element={
            <ProtectedRoute allowedRoles={['outstaff']}>
              <OutstaffDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* スタッフ案内実績ページ */}
        <Route 
          path="/staff-performance" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'outstaff']}>
              <StaffPerformancePage />
            </ProtectedRoute>
          } 
        />
        
        {/* 過去の案内実績ページ */}
        <Route 
          path="/past-performance" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'outstaff']}>
              <PastPerformancePage />
            </ProtectedRoute>
          } 
        />
        
        {/* 店舗管理ページ（admin または display name「亮太」） */}
        <Route 
          path="/store-management" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']} requireAdminPermissions={true}>
              <StoreManagementPage />
            </ProtectedRoute>
          } 
        />
        
        {/* スタッフ管理ページ（admin または display name「亮太」） */}
        <Route 
          path="/staff-management" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']} requireAdminPermissions={true}>
              <StaffManagementPage />
            </ProtectedRoute>
          } 
        />
        
        {/* outstaff店舗設定ページ（admin または display name「亮太」） */}
        <Route 
          path="/outstaff-store-settings" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']} requireAdminPermissions={true}>
              <OutstaffStoreSettingsPage />
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
        
        {/* URLパス方式での店舗ログインページ */}
        <Route 
          path="/store/:storeId/login" 
          element={<Login />} 
        />
        
        {/* URLパス方式での店舗アクセス (/store/xxx) */}
        <Route 
          path="/store/:storeId" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* URLパス方式での店舗請求確認ページ */}
        <Route 
          path="/store/:storeId/billing" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerBillingPage />
            </ProtectedRoute>
          } 
        />
        
        {/* URLパス方式での店舗休日設定ページ */}
        <Route 
          path="/store/:storeId/holidays" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <StoreHolidaysPage />
            </ProtectedRoute>
          } 
        />
        
        {/* 請求確認ページ */}
        <Route 
          path="/customer/billing" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerBillingPage />
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
        
        {/* 本日の営業店舗ページ（admin/staff/outstaff専用） */}
        <Route 
          path="/today-open-stores" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'outstaff']}>
              <TodayOpenStoresPage />
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