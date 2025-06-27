import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
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

const CustomerDashboard = () => {
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

        // 案内記録取得（この店舗の分のみ）
        const records = await getVisitRecords(storeId)
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

    fetchData()
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
  
  // 請求情報を計算
  const monthlyIntroductions = visitRecords.length
  const baseAmount = invoiceSettings?.base_fee || 30000
  const guaranteedCount = invoiceSettings?.guaranteed_count || 8
  const bonusAmount = Math.max(0, monthlyIntroductions - guaranteedCount) * (invoiceSettings?.price_per_introduction || 3000)
  const totalAmount = baseAmount + bonusAmount
  const taxAmount = invoiceSettings?.with_tax ? totalAmount * 0.1 : 0
  const finalAmount = Math.floor(totalAmount + taxAmount)

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
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">店舗データを読み込み中...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!store) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-gray-500">店舗情報が見つかりません。</p>
          <p className="text-sm text-gray-400 mt-2">店舗ID: {storeId}</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* ヘッダー */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {store.name} 管理ダッシュボード
        </h2>
        <p className="text-gray-600">
          店舗の営業日設定、リアルタイム状況発信、請求確認を行うことができます。
        </p>
      </div>

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左側：クイックアクション */}
        <div className="space-y-6">
          {/* 店休日設定へのナビゲーション */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="text-2xl mr-3">📅</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  店休日設定
                </h3>
                <p className="text-sm text-gray-600">
                  営業カレンダーの設定・変更
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              3ヶ月分の店休日をカレンダー形式で設定できます。設定した休業日は予約システムに自動反映されます。
            </p>
            
            <Link
              to="/customer/holidays"
              className="w-full inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              店休日設定ページへ
            </Link>
          </div>

          {/* リアルタイム状況発信 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📡 リアルタイム状況発信
            </h3>
            
            {/* 今初回ほしいです - 回数制限付き */}
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-red-800">🔥 今初回ほしいです</h4>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    回数制限: {store.first_request_limit === 0 ? '利用不可' : `${store.first_request_limit}回/月`}
                  </div>
                  {store.first_request_limit > 0 && (
                    <div className="text-xs text-gray-500">
                      今月使用: {monthlyRequestCount}回
                    </div>
                  )}
                </div>
              </div>
              
              {/* アクティブなリクエスト表示 */}
              {activeRequest && (
                <div className="mb-3 p-3 bg-orange-100 border border-orange-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-orange-800">⏱️ 発信中</span>
                    <span className="text-xs text-orange-600">
                      残り: {remainingTime || '計算中...'}
                    </span>
                  </div>
                  <div className="text-xs text-orange-700 mt-1">
                    1時間以内の案内報告で消化されます
                  </div>
                </div>
              )}
              
              <button
                onClick={() => handleFirstTimeRequest()}
                disabled={loading || store.first_request_limit === 0 || monthlyRequestCount >= store.first_request_limit}
                className="w-full py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '発信中...' : 
                 store.first_request_limit === 0 ? '利用不可' :
                 monthlyRequestCount >= store.first_request_limit ? 
                 '今月の上限に達しました' : 'スタッフチャットに発信'}
              </button>
            </div>


          </div>
        </div>

        {/* 右側：実績と請求 */}
        <div className="space-y-6">
          {/* 今月の案内実績 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📊 今月の案内実績
            </h3>
            
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-4xl font-bold text-blue-600">{totalVisitors}</div>
              <div className="text-lg text-gray-600">総案内人数</div>
            </div>
          </div>




        </div>
      </div>
    </Layout>
  )
}

export default CustomerDashboard 