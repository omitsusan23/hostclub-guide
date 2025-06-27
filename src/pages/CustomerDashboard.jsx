import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { useApp } from '../contexts/AppContext'
import { 
  getStores,
  getVisitRecords,
  getLatestStoreStatus,
  setStoreStatus
} from '../lib/database'

const CustomerDashboard = () => {
  const { getUserStoreId, getStoreIdFromSubdomain } = useApp()
  
  // ユーザーのstore_idまたはサブドメインから店舗IDを取得
  const storeId = getUserStoreId() || getStoreIdFromSubdomain()
  
  const [store, setStore] = useState(null)
  const [visitRecords, setVisitRecords] = useState([])
  const [invoiceSettings, setInvoiceSettings] = useState(null)
  const [currentStatus, setCurrentStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

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

      } catch (error) {
        console.error('データ取得エラー:', error)
      } finally {
        setDataLoading(false)
      }
    }

    fetchData()
  }, [storeId])

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

  const handleStatusUpdate = async () => {
    if (!currentStatus || !storeId) {
      alert('状況を選択してください')
      return
    }
    
    setLoading(true)
    try {
      await setStoreStatus(storeId, currentStatus)
      alert(`✅ 「${currentStatus}」を発信しました！`)
      setCurrentStatus('')
    } catch (error) {
      console.error('状況更新エラー:', error)
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
            
            <div className="space-y-3">
              {[
                '今初回ほしいです',
                '席に余裕があります',
                '満席に近いです',
                '本日は満席です',
                '特別イベント開催中'
              ].map((status) => (
                <button
                  key={status}
                  onClick={() => setCurrentStatus(status)}
                  className={`w-full p-3 text-left rounded-lg border transition-colors ${
                    currentStatus === status
                      ? 'border-green-500 bg-green-50 text-green-800'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            
            <button
              onClick={handleStatusUpdate}
              disabled={!currentStatus || loading}
              className="w-full mt-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '発信中...' : 'スタッフチャットに発信'}
            </button>
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