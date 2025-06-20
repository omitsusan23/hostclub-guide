import React, { useState } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import { mockStores, mockVisitRecords, mockMonthlyInvoices, getStoreById } from '../lib/types'

const AdminDashboard = () => {
  const [showStoreModal, setShowStoreModal] = useState(false)
  const [newStore, setNewStore] = useState({
    name: '',
    subdomain: '',
    base_fee: 30000,
    guaranteed_count: 8,
    guaranteed_penalty: 5000
  })
  const [loading, setLoading] = useState(false)

  // 統計計算
  const totalVisits = mockVisitRecords.filter(record => !record.deleted).length
  const totalRevenue = mockMonthlyInvoices.reduce((sum, invoice) => sum + invoice.total, 0)
  const activeStores = mockStores.length
  
  // 各店舗の実績計算
  const storeStats = mockStores.map(store => {
    const storeVisits = mockVisitRecords.filter(record => record.store_id === store.id && !record.deleted)
    const totalVisitors = storeVisits.reduce((sum, record) => sum + record.visitor_count, 0)
    
    return {
      ...store,
      visitCount: storeVisits.length,
      totalVisitors,
      monthlyRevenue: store.base_fee + Math.max(0, storeVisits.length - store.guaranteed_count) * 3000
    }
  })

  const handleAddStore = async () => {
    if (!newStore.name || !newStore.subdomain) {
      alert('店舗名とサブドメインを入力してください')
      return
    }

    setLoading(true)
    try {
      // 実際のアプリではSupabaseに送信
      console.log('新規店舗追加:', newStore)
      alert(`✅ ${newStore.name} を追加しました！サブドメイン: ${newStore.subdomain}.example.com`)
      
      setNewStore({
        name: '',
        subdomain: '',
        base_fee: 30000,
        guaranteed_count: 8,
        guaranteed_penalty: 5000
      })
      setShowStoreModal(false)
    } catch (error) {
      alert('❌ 店舗追加に失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      {/* ヘッダー */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          管理者ダッシュボード
        </h2>
        <p className="text-gray-600">
          案内所運営責任者として、全店舗の管理と新規契約を行うことができます。
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">登録店舗数</p>
              <p className="text-2xl font-bold text-gray-900">{activeStores}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">今月の案内件数</p>
              <p className="text-2xl font-bold text-gray-900">{totalVisits}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">今月の売上</p>
              <p className="text-2xl font-bold text-gray-900">¥{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">平均成約率</p>
              <p className="text-2xl font-bold text-gray-900">78%</p>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左側：店舗管理 */}
        <div className="space-y-6">
          {/* 店舗一覧 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                🏪 店舗管理
              </h3>
              <button
                onClick={() => setShowStoreModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                新規店舗追加
              </button>
            </div>
            
            <div className="space-y-3">
              {storeStats.map((store) => (
                <div key={store.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="font-medium text-gray-900">{store.name}</h4>
                        <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          {store.subdomain}.example.com
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        基本料金: ¥{store.base_fee.toLocaleString()} | 
                        保証本数: {store.guaranteed_count}本
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {store.visitCount}件 ({store.totalVisitors}名)
                      </div>
                      <div className="text-sm text-green-600">
                        ¥{store.monthlyRevenue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 新規契約・システム設定 */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📝 新規契約
              </h3>
              <p className="text-gray-600 mb-4">新しいホストクラブとの契約手続きを行います。</p>
              <div className="flex space-x-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  契約申込み処理
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                  契約一覧
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                ⚙️ システム設定
              </h3>
              <p className="text-gray-600 mb-4">システム全体の設定と管理を行います。</p>
              <div className="flex space-x-2">
                <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                  ユーザー管理
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                  システム設定
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 右側：統計・レポート */}
        <div className="space-y-6">
          {/* 月次売上レポート */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📊 月次売上レポート
            </h3>
            
            <div className="space-y-4">
              {mockMonthlyInvoices.map((invoice) => {
                const store = getStoreById(invoice.store_id)
                return (
                  <div key={invoice.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{store?.name}</div>
                        <div className="text-sm text-gray-600">{invoice.month}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-blue-600">
                          ¥{invoice.total.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          案内: {invoice.total_introductions}件
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between font-bold text-lg">
                <span>合計売上</span>
                <span className="text-green-600">¥{totalRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 最近の活動 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📰 最近の活動
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">新規店舗「クラブエース」の契約が完了しました</p>
                  <p className="text-xs text-gray-500">2時間前</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">スタッフ田中さんが案内登録を15件完了しました</p>
                  <p className="text-xs text-gray-500">5時間前</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">システムメンテナンスが正常に完了しました</p>
                  <p className="text-xs text-gray-500">1日前</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">月次請求書の自動発行が完了しました</p>
                  <p className="text-xs text-gray-500">2日前</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 新規店舗追加モーダル */}
      <Modal
        isOpen={showStoreModal}
        onClose={() => setShowStoreModal(false)}
        title="新規店舗追加"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              店舗名
            </label>
            <input
              type="text"
              value={newStore.name}
              onChange={(e) => setNewStore({...newStore, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: クラブプレミアム"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              サブドメイン
            </label>
            <div className="flex">
              <input
                type="text"
                value={newStore.subdomain}
                onChange={(e) => setNewStore({...newStore, subdomain: e.target.value})}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="premium"
              />
              <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500">
                .example.com
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                基本料金
              </label>
              <input
                type="number"
                value={newStore.base_fee}
                onChange={(e) => setNewStore({...newStore, base_fee: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                保証本数
              </label>
              <input
                type="number"
                value={newStore.guaranteed_count}
                onChange={(e) => setNewStore({...newStore, guaranteed_count: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              onClick={() => setShowStoreModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleAddStore}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '追加中...' : '店舗を追加'}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}

export default AdminDashboard 