import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { useApp } from '../contexts/AppContext'
import { 
  getStoreById, 
  getStoreBySubdomain,
  mockCalendars, 
  mockRealtimeStatuses, 
  getVisitRecordsByStoreId,
  mockInvoiceSettings 
} from '../lib/types'

const CustomerDashboard = () => {
  const { getUserStoreId, getStoreIdFromSubdomain } = useApp()
  
  // ユーザーのstore_idまたはサブドメインから店舗IDを取得
  const storeId = getUserStoreId() || getStoreIdFromSubdomain()
  
  // IDで店舗を検索、見つからなければサブドメインで検索
  let store = getStoreById(storeId)
  if (!store) {
    store = getStoreBySubdomain(storeId)
  }
  
  const [currentStatus, setCurrentStatus] = useState('')
  const [loading, setLoading] = useState(false)

  // 店舗の案内実績を取得
  const visitRecords = getVisitRecordsByStoreId(storeId)
  const totalVisitors = visitRecords.reduce((sum, record) => sum + record.visitor_count, 0)
  
  // 請求情報を計算
  const invoiceSetting = mockInvoiceSettings.find(setting => setting.store_id === storeId)
  const monthlyIntroductions = visitRecords.length
  const baseAmount = invoiceSetting?.base_fee || 30000
  const bonusAmount = Math.max(0, monthlyIntroductions - (invoiceSetting?.guaranteed_count || 8)) * 3000
  const totalAmount = baseAmount + bonusAmount
  const taxAmount = totalAmount * 0.1
  const finalAmount = Math.floor(totalAmount + taxAmount)

  const handleStatusUpdate = async () => {
    if (!currentStatus) {
      alert('状況を選択してください')
      return
    }
    
    setLoading(true)
    try {
      // 実際のアプリではSupabaseに送信
      console.log('状況更新:', currentStatus)
      alert(`✅ 「${currentStatus}」を発信しました！`)
      setCurrentStatus('')
    } catch (error) {
      alert('❌ 発信に失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  if (!store) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-gray-500">店舗情報が見つかりません。</p>
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{visitRecords.length}</div>
                <div className="text-sm text-gray-600">案内件数</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{totalVisitors}</div>
                <div className="text-sm text-gray-600">総案内人数</div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">保証本数: {store.guaranteed_count}本</div>
              <div className="text-sm text-gray-600">
                追加ボーナス: {Math.max(0, visitRecords.length - store.guaranteed_count)}本
              </div>
            </div>
          </div>

          {/* 請求金額 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              💰 今月の請求金額
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">基本料金</span>
                <span className="font-medium">¥{baseAmount.toLocaleString()}</span>
              </div>
              
              {bonusAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">追加ボーナス</span>
                  <span className="font-medium text-green-600">+¥{bonusAmount.toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">小計</span>
                <span className="font-medium">¥{totalAmount.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">税額（10%）</span>
                <span className="font-medium">¥{taxAmount.toLocaleString()}</span>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>合計</span>
                  <span className="text-blue-600">¥{finalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
              💡 請求書は月末に自動発行されます
            </div>
          </div>

          {/* 現在の営業状況 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🏪 現在の営業状況
            </h3>
            
            <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <div>
                <div className="font-medium text-green-800">営業中</div>
                <div className="text-sm text-green-600">18:00 - 03:00 | 空席あり</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default CustomerDashboard 