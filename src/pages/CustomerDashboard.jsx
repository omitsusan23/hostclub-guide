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
import { supabase } from '../lib/supabase'

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
                  <div className="text-sm text-gray-500">
                    🚧 近日解禁
                  </div>
                </div>
              </div>
              
              {/* アクティブなリクエスト表示 - 近日解禁により非表示 */}
              {false && activeRequest && (
                <div className={`mb-3 p-3 border rounded-md ${
                  activeRequest.is_consumed 
                    ? 'bg-green-100 border-green-200' 
                    : 'bg-orange-100 border-orange-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      activeRequest.is_consumed ? 'text-green-800' : 'text-orange-800'
                    }`}>
                      {activeRequest.is_consumed ? '✅ 案内完了' : '⏱️ 発信中'}
                    </span>
                    <span className={`text-xs ${
                      activeRequest.is_consumed ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {activeRequest.is_consumed 
                        ? (() => {
                            const date = new Date(activeRequest.consumed_at)
                            // 日本時間に変換（UTC + 9時間）
                            const jpTime = new Date(date.getTime() + (9 * 60 * 60 * 1000))
                            return jpTime.toLocaleTimeString('ja-JP', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          })()
                        : `残り: ${remainingTime || '計算中...'}`}
                    </span>
                  </div>
                  {!activeRequest.is_consumed && (
                    <div className="text-xs text-orange-700 mt-1">
                      1時間以内の案内報告で消化されます
                    </div>
                  )}
                </div>
              )}
              
              <div className="text-xs text-gray-600 mb-3 text-center">
                この機能は現在準備中です。近日中に利用可能になります。
              </div>
              
              <button
                disabled={true}
                className="w-full py-3 bg-gray-400 text-white rounded-md cursor-not-allowed"
              >
                🚧 近日解禁
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
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {visitRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  今月の案内実績はありません
                </div>
              ) : (
                visitRecords.map((record) => (
                  <div key={record.id} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-lg font-semibold text-gray-900">
                        {record.guest_count}名
                      </div>
                      <span className="text-sm text-gray-500">
                        {(() => {
                          const date = new Date(record.guided_at || record.created_at)
                          return date.toLocaleDateString('ja-JP', {
                            month: 'numeric',
                            day: 'numeric'
                          }) + ' ' + date.toLocaleTimeString('ja-JP', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        })()}
                      </span>
                    </div>
                    
                    {record.notes && (
                      <div className="text-sm text-gray-600 mt-2">
                        {record.notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            {/* 合計表示 */}
            {visitRecords.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{totalVisitors}</div>
                  <div className="text-sm text-gray-600">総案内人数</div>
                </div>
              </div>
            )}
          </div>




        </div>
      </div>
    </Layout>
  )
}

export default CustomerDashboard 