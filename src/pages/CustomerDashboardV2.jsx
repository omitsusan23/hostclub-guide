import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/LayoutV2'
import { useApp } from '../contexts/AppContext'
import { 
  getStores,
  getVisitRecords,
  getLatestStoreStatus,
  setStoreStatus,
  sendStaffChat,
  sendStoreStatusRequest,
  getMonthlyRequestCount,
  getActiveRequest
} from '../lib/database'
import { supabase } from '../lib/supabase'

const CustomerDashboardV2 = () => {
  const { getUserStoreId, getStoreIdFromSubdomain, user } = useApp()
  
  // ユーザーのstore_idまたはサブドメインから店舗IDを取得
  const storeId = getUserStoreId() || getStoreIdFromSubdomain()
  
  const [store, setStore] = useState(null)
  const [visitRecords, setVisitRecords] = useState([])
  const [invoiceSettings, setInvoiceSettings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [monthlyRequestCount, setMonthlyRequestCount] = useState(0)
  const [activeRequest, setActiveRequest] = useState(null)
  const [remainingTime, setRemainingTime] = useState(null)
  const [requestSubscription, setRequestSubscription] = useState(null)

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      if (!storeId) return

      try {
        setDataLoading(true)
        
        // 店舗データ取得
        const allStores = await getStores()
        const storeData = allStores.find(s => s.store_id === storeId)
        setStore(storeData)

        // 当月の案内記録取得（この店舗の分のみ）
        const now = new Date()
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
        const records = await getVisitRecords(storeId, currentMonthStart, currentMonthEnd)
        setVisitRecords(records)

        // 請求設定は店舗データから取得
        setInvoiceSettings({
          base_fee: storeData?.base_price || 30000,
          guaranteed_count: storeData?.guarantee_count || 8,
          price_per_introduction: storeData?.unit_price || 3000,
          with_tax: !storeData?.exclude_tax
        })

        // 月間リクエスト数を取得（「今初回ほしいです」のみ）
        const monthlyCount = await getMonthlyRequestCount(storeId, '今初回ほしいです')
        setMonthlyRequestCount(monthlyCount.count || 0)

        // アクティブリクエストを取得
        const activeReq = await getActiveRequest(storeId, '今初回ほしいです')
        setActiveRequest(activeReq.data)

      } catch (error) {
        console.error('データ取得エラー:', error)
      } finally {
        setDataLoading(false)
      }
    }

    // リアルタイムリクエスト購読を設定
    const setupRequestSubscription = () => {
      if (!storeId) return
      
      const subscription = supabase
        .channel(`store_status_requests_${storeId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'store_status_requests',
            filter: `store_id=eq.${storeId}`
          },
          (payload) => {
            console.log('📨 リクエスト更新:', payload)
            
            if (payload.new && activeRequest && payload.new.id === activeRequest.id) {
              setActiveRequest(payload.new)
              
              // 月間リクエスト数も更新
              if (payload.new.is_consumed && !payload.old?.is_consumed) {
                console.log('🎉 リクエスト消化完了')
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 リクエスト購読状態:', status)
        })
      
      setRequestSubscription(subscription)
    }

    fetchData()
    setupRequestSubscription()

    // クリーンアップ
    return () => {
      if (requestSubscription) {
        supabase.removeChannel(requestSubscription)
      }
    }
  }, [storeId])

  // カウントダウンタイマー
  useEffect(() => {
    let interval = null
    
    if (activeRequest?.expires_at) {
      interval = setInterval(() => {
        const now = new Date()
        const expiresAt = new Date(activeRequest.expires_at)
        const diff = expiresAt - now
        
        if (diff > 0) {
          const minutes = Math.floor(diff / 60000)
          const seconds = Math.floor((diff % 60000) / 1000)
          setRemainingTime(`${minutes}:${seconds.toString().padStart(2, '0')}`)
        } else {
          setRemainingTime('期限切れ')
          setActiveRequest(null) // 期限切れの場合はアクティブリクエストをクリア
        }
      }, 1000)
    } else {
      setRemainingTime(null)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeRequest])

  // 総案内人数を計算
  const totalVisitors = visitRecords.reduce((sum, record) => sum + (record.guest_count || 0), 0)

  // 「今初回ほしいです」専用ハンドラー（回数制限・時間制限付き）
  const handleFirstTimeRequest = async () => {
    if (!storeId || !store) return
    
    // 回数制限チェック
    if (store.first_request_limit === 0) {
      alert('❌ この機能は利用できません。')
      return
    }
    
    if (monthlyRequestCount >= store.first_request_limit) {
      alert('❌ 今月の回数制限に達しています。')
      return
    }
    
    setLoading(true)
    try {
      // スタッフチャットに発信
      const chatResult = await sendStaffChat({
        message: `🔥 ${store.name} - 今初回ほしいです！`,
        sender_id: user?.id || 'system',
        sender_name: store.name,
        sender_role: 'customer',
        message_type: 'status_request'
      })
      
      if (chatResult.success) {
        // リクエスト履歴を記録
        await sendStoreStatusRequest({
          store_id: storeId,
          status_type: '今初回ほしいです',
          message: `🔥 ${store.name} - 今初回ほしいです！`,
          has_time_limit: true,
          has_count_limit: true,
          chat_message_id: chatResult.data.id
        })
        
        alert('✅ 「今初回ほしいです」を発信しました！')
        
        // データを再取得して状態を更新
        const updatedMonthlyCount = await getMonthlyRequestCount(storeId, '今初回ほしいです')
        setMonthlyRequestCount(updatedMonthlyCount.count || 0)
        
        const updatedActiveReq = await getActiveRequest(storeId, '今初回ほしいです')
        setActiveRequest(updatedActiveReq.data)
      }
    } catch (error) {
      console.error('発信エラー:', error)
      alert('❌ 発信に失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  if (dataLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-sm sm:text-base text-gray-600">データを読み込み中...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!store) {
    return (
      <Layout>
        <div className="text-center min-h-[60vh] flex items-center justify-center">
          <div>
            <svg className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-gray-500 text-base sm:text-lg">店舗情報が見つかりません</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">店舗ID: {storeId}</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* モバイル最適化されたヘッダー */}
      <div className="px-4 sm:px-6 lg:px-0 mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
          {store.name}
        </h1>
        <p className="text-xs sm:text-sm lg:text-base text-gray-600">
          店舗管理ダッシュボード
        </p>
      </div>

      {/* ステータスカード（モバイルファースト） */}
      <div className="px-4 sm:px-6 lg:px-0 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* 今月の案内人数 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xl">👥</span>
            <span className="text-[10px] sm:text-xs text-gray-500">今月</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{totalVisitors}</div>
          <div className="text-[10px] sm:text-xs text-gray-600">案内人数</div>
        </div>

        {/* 保証人数 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xl">🎯</span>
            <span className="text-[10px] sm:text-xs text-gray-500">保証</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{invoiceSettings?.guaranteed_count || 8}</div>
          <div className="text-[10px] sm:text-xs text-gray-600">保証人数</div>
        </div>

        {/* 達成率 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xl">📊</span>
            <span className="text-[10px] sm:text-xs text-gray-500">達成率</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">
            {Math.round((totalVisitors / (invoiceSettings?.guaranteed_count || 8)) * 100)}%
          </div>
          <div className="text-[10px] sm:text-xs text-gray-600">目標達成</div>
        </div>

        {/* 基本料金 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xl">💰</span>
            <span className="text-[10px] sm:text-xs text-gray-500">月額</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">
            {((invoiceSettings?.base_fee || 30000) / 1000).toFixed(0)}K
          </div>
          <div className="text-[10px] sm:text-xs text-gray-600">基本料金</div>
        </div>
      </div>

      {/* メインコンテンツエリア */}
      <div className="px-4 sm:px-6 lg:px-0">
        {/* クイックアクション（モバイル最適化） */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 sm:mb-8">
          {/* 店休日設定 */}
          <Link
            to={window.location.pathname.includes('/store/') ? `/store/${storeId}/holidays` : '/customer/holidays'}
            className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 sm:p-5 hover:shadow-lg transition-all duration-200 border border-blue-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 sm:p-3 bg-blue-500 rounded-lg group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">店休日設定</h3>
            <p className="text-xs sm:text-sm text-gray-600">営業カレンダーの管理</p>
          </Link>

          {/* 請求書確認 */}
          <Link
            to="/customer/billing-pdf"
            className="group bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 sm:p-5 hover:shadow-lg transition-all duration-200 border border-green-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 sm:p-3 bg-green-500 rounded-lg group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">請求書PDF</h3>
            <p className="text-xs sm:text-sm text-gray-600">月次請求書の確認</p>
          </Link>

          {/* ログイン情報 */}
          <Link
            to="/customer/login-info"
            className="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 sm:p-5 hover:shadow-lg transition-all duration-200 border border-purple-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 sm:p-3 bg-purple-500 rounded-lg group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">ログイン情報</h3>
            <p className="text-xs sm:text-sm text-gray-600">アカウント設定</p>
          </Link>
        </div>

        {/* リアルタイム発信機能（近日公開） */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="text-2xl sm:text-3xl mr-2 sm:mr-3">🔥</span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">リアルタイム発信</h2>
                <p className="text-xs sm:text-sm text-gray-600">今初回ほしいです</p>
              </div>
            </div>
            <span className="px-2 sm:px-3 py-1 bg-orange-200 text-orange-800 text-xs sm:text-sm rounded-full font-medium">
              🚧 準備中
            </span>
          </div>
          
          <div className="bg-white/70 rounded-lg p-3 sm:p-4 text-center">
            <p className="text-xs sm:text-sm text-gray-600 mb-3">
              この機能は現在準備中です
            </p>
            <button
              disabled={true}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed text-sm sm:text-base"
            >
              近日公開予定
            </button>
          </div>
        </div>

        {/* 今月の案内実績 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">今月の案内実績</h2>
            <Link
              to={window.location.pathname.includes('/store/') ? `/store/${storeId}/previous-month` : '/customer/previous-month'}
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              前月分を見る →
            </Link>
          </div>
          
          {visitRecords.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm sm:text-base text-gray-500">今月の案内実績はまだありません</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {visitRecords.map((record) => (
                <div key={record.id} className="bg-gray-50 rounded-lg p-3 sm:p-4 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-lg sm:text-xl font-bold text-gray-900 mr-2 sm:mr-3">
                        {record.guest_count}名
                      </div>
                      {record.notes && (
                        <span className="text-xs sm:text-sm text-gray-600 bg-white px-2 py-1 rounded">
                          {record.notes}
                        </span>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm text-gray-500">
                      {(() => {
                        const date = new Date(record.guided_at || record.created_at)
                        return date.toLocaleDateString('ja-JP', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      })()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default CustomerDashboardV2