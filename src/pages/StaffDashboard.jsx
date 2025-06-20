import React, { useState } from 'react'
import Layout from '../components/Layout'
import VisitForm from '../components/VisitForm'
import Modal from '../components/Modal'
import { mockVisitRecords, mockStores, mockStaffChats, getTodaysVisitRecords, getStoreById } from '../lib/types'

const StaffDashboard = () => {
  const [visitRecords, setVisitRecords] = useState(mockVisitRecords)
  const [loading, setLoading] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, record: null })

  const todaysRecords = getTodaysVisitRecords()
  const totalVisitors = todaysRecords.reduce((sum, record) => sum + record.visitor_count, 0)

  const handleVisitSubmit = async (visitData) => {
    setLoading(true)
    try {
      // 実際のアプリではSupabaseへ送信
      const newRecord = {
        id: `visit-${Date.now()}`,
        store_id: visitData.storeId,
        staff_id: 'user-staff-1',
        visitor_count: visitData.visitorCount,
        visited_at: visitData.visitedAt,
        deleted: false
      }
      
      setVisitRecords(prev => [...prev, newRecord])
      
      // 成功メッセージ
      const store = getStoreById(visitData.storeId)
      alert(`✅ ${store.name} に ${visitData.visitorCount}名の案内を登録しました！`)
    } catch (error) {
      alert('❌ 案内登録に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRecord = (record) => {
    setDeleteModal({ isOpen: true, record })
  }

  const confirmDelete = () => {
    if (deleteModal.record) {
      // 実際のアプリではSupabaseで削除フラグを更新
      setVisitRecords(prev => 
        prev.map(record => 
          record.id === deleteModal.record.id 
            ? { ...record, deleted: true }
            : record
        )
      )
    }
    setDeleteModal({ isOpen: false, record: null })
  }

  return (
    <Layout>
      {/* ヘッダー */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          スタッフダッシュボード
        </h2>
        <p className="text-gray-600">
          案内所スタッフとして、案内登録と店舗確認業務を行うことができます。
        </p>
      </div>

      {/* メインエリア */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左側：案内フォーム */}
        <div className="lg:col-span-1">
          <VisitForm onSubmit={handleVisitSubmit} loading={loading} />
        </div>

        {/* 右側：実績とチャット */}
        <div className="lg:col-span-2 space-y-6">
          {/* 今日の実績 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📊 今日の実績
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{todaysRecords.length}</div>
                <div className="text-sm text-gray-600">案内件数</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{totalVisitors}</div>
                <div className="text-sm text-gray-600">総案内人数</div>
              </div>
            </div>
          </div>

          {/* 本日の案内履歴 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📋 本日の案内履歴
            </h3>
            <div className="space-y-3">
              {todaysRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-4">まだ案内記録がありません</p>
              ) : (
                todaysRecords.map((record) => {
                  const store = getStoreById(record.store_id)
                  const time = new Date(record.visited_at).toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                  
                  return (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {store.name} ({record.visitor_count}名)
                          </div>
                          <div className="text-sm text-gray-500">{time}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteRecord(record)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="削除"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* スタッフチャット */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              💬 スタッフチャット
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {mockStaffChats.map((chat) => {
                const time = new Date(chat.created_at).toLocaleTimeString('ja-JP', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
                
                return (
                  <div key={chat.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 text-sm">スタッフ</span>
                      <span className="text-xs text-gray-500">{time}</span>
                    </div>
                    <p className="text-gray-700">{chat.message}</p>
                  </div>
                )
              })}
            </div>
            
            {/* チャット入力 */}
            <div className="mt-4 flex space-x-2">
              <input
                type="text"
                placeholder="メッセージを入力..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                送信
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 削除確認モーダル */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, record: null })}
        title="案内記録の削除"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            この案内記録を削除してもよろしいですか？
          </p>
          {deleteModal.record && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="font-medium">
                {getStoreById(deleteModal.record.store_id)?.name} ({deleteModal.record.visitor_count}名)
              </div>
              <div className="text-sm text-gray-500">
                {new Date(deleteModal.record.visited_at).toLocaleString('ja-JP')}
              </div>
            </div>
          )}
          <div className="flex space-x-3">
            <button
              onClick={() => setDeleteModal({ isOpen: false, record: null })}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              削除
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}

export default StaffDashboard 