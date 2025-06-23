import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import VisitForm from '../components/VisitForm'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import SwipeableVisitItem from '../components/SwipeableVisitItem'
import { useApp } from '../contexts/AppContext'
import { 
  getStores,
  getTodayVisitRecords,
  addVisitRecord,
  deleteVisitRecord
} from '../lib/database'

const StaffDashboard = () => {
  const { user } = useApp()
  const [showVisitForm, setShowVisitForm] = useState(false)
  const [selectedStore, setSelectedStore] = useState(null)
  const [stores, setStores] = useState([])
  const [visitRecords, setVisitRecords] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, record: null, storeName: '' })

  // 今日の日付を取得する関数
  const getTodayDateString = () => {
    const today = new Date()
    const month = today.getMonth() + 1
    const day = today.getDate()
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][today.getDay()]
    return `${month}/${day}(${dayOfWeek})`
  }

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // 店舗データ取得
        const storesData = await getStores()
        setStores(storesData)

        // 今日の案内記録取得
        const recordsData = await getTodayVisitRecords()
        setVisitRecords(recordsData)

        // TODO: スタッフチャットデータ取得（テーブル作成後）
        setChatMessages([])
        
      } catch (error) {
        console.error('データ取得エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleVisitSubmit = async (visitData) => {
    try {
      // Supabaseに案内記録を保存
      const savedRecord = await addVisitRecord({
        store_id: visitData.storeId,
        guest_count: visitData.guestCount,
        staff_name: user?.email || 'スタッフ',
        guided_at: visitData.guided_at
      })
      
      // ローカル状態を更新
      setVisitRecords(prev => [savedRecord, ...prev])
      setShowVisitForm(false)
      setSelectedStore(null)
      
      alert('✅ 案内記録を保存しました')
    } catch (error) {
      console.error('案内記録保存エラー:', error)
      alert('❌ 保存に失敗しました')
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      // TODO: 実際のSupabaseへのチャット保存
      console.log('チャット送信:', newMessage)
      
      // 一時的にローカル状態を更新
      const newChatMessage = {
        id: Date.now().toString(),
        sender_id: user?.id || 'staff-1',
        sender_name: user?.email || 'スタッフ',
        message: newMessage,
        created_at: new Date().toISOString()
      }
      
      setChatMessages(prev => [...prev, newChatMessage])
      setNewMessage('')
      
    } catch (error) {
      console.error('チャット送信エラー:', error)
      alert('❌ 送信に失敗しました')
    }
  }

  // 削除確認モーダルを開く
  const handleDeleteRequest = (record, storeName) => {
    setDeleteModal({
      isOpen: true,
      record: record,
      storeName: storeName
    })
  }

  // 削除実行
  const handleConfirmDelete = async () => {
    try {
      await deleteVisitRecord(deleteModal.record.id)
      
      // ローカル状態から削除
      setVisitRecords(prev => prev.filter(record => record.id !== deleteModal.record.id))
      
      // モーダルを閉じる
      setDeleteModal({ isOpen: false, record: null, storeName: '' })
      
      alert('✅ 案内記録を削除しました')
    } catch (error) {
      console.error('削除エラー:', error)
      alert('❌ 削除に失敗しました')
    }
  }

  // 削除キャンセル
  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false, record: null, storeName: '' })
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">データを読み込み中...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* ヘッダー */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          スタッフダッシュボード
        </h2>
        <p className="text-gray-600">
          店舗への案内記録とスタッフ間のコミュニケーション
        </p>
      </div>

      {/* クイックアクション */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
          クイックアクション
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 本日の営業店舗 */}
          <a
            href="/today-open-stores"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-green-300 transition-all group"
          >
            <div className="flex items-center mb-2">
              <div className="text-2xl mr-3">🏪</div>
              <h4 className="font-medium text-gray-900 group-hover:text-green-600">
                本日の営業店舗
              </h4>
            </div>
            <p className="text-sm text-gray-600">
              今日営業中の店舗一覧と店休日更新状況を確認
            </p>
          </a>

          {/* 新規案内記録 */}
          <button
            onClick={() => setShowVisitForm(true)}
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-green-300 transition-all group text-left"
          >
            <div className="flex items-center mb-2">
              <div className="text-2xl mr-3">📝</div>
              <h4 className="font-medium text-gray-900 group-hover:text-green-600">
                新規案内記録
              </h4>
            </div>
            <p className="text-sm text-gray-600">
              お客様の案内記録を迅速に登録
            </p>
          </button>

          {/* 今後の機能用プレースホルダー */}
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center mb-2">
              <div className="text-2xl mr-3">📊</div>
              <h4 className="font-medium text-gray-500">
                案内実績レポート
              </h4>
            </div>
            <p className="text-sm text-gray-500">
              近日公開予定
            </p>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左側：案内記録 */}
        <div className="space-y-6">
          {/* 新規案内記録ボタン */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                🏪 店舗案内記録
              </h3>
              <button
                onClick={() => setShowVisitForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                新規記録
              </button>
            </div>
            
            <p className="text-sm text-gray-600">
              本日の案内記録: {visitRecords.length}件
            </p>
          </div>

          {/* 今日の案内記録一覧 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📊 本日の案内実績 {getTodayDateString()}
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {visitRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  本日の案内記録はまだありません
                </p>
              ) : (
                visitRecords.map((record) => {
                  const store = stores.find(s => s.store_id === record.store_id)
                  
                  return (
                    <SwipeableVisitItem
                      key={record.id}
                      record={record}
                      store={store}
                      onDelete={handleDeleteRequest}
                    />
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* 右側：スタッフチャット */}
        <div className="space-y-6">
          {/* スタッフチャット */}
          <div className="bg-white rounded-lg shadow-md p-6 h-96 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              💬 スタッフチャット
            </h3>
            
            {/* チャットメッセージ */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {chatMessages.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  チャットメッセージはありません
                </p>
              ) : (
                chatMessages.map((chat) => (
                  <div key={chat.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{chat.sender_name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(chat.created_at).toLocaleTimeString('ja-JP', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm">{chat.message}</p>
                  </div>
                ))
              )}
            </div>
            
            {/* メッセージ入力 */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="メッセージを入力..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                送信
              </button>
            </div>
          </div>

          {/* 店舗一覧 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🏢 契約店舗一覧
            </h3>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stores.map((store) => (
                <div key={store.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{store.name}</div>
                    <div className="text-sm text-gray-600">ID: {store.store_id}</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedStore(store)
                      setShowVisitForm(true)
                    }}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    案内記録
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 案内記録フォームモーダル */}
      {showVisitForm && (
        <VisitForm
          selectedStore={selectedStore}
          onSubmit={handleVisitSubmit}
          onClose={() => {
            setShowVisitForm(false)
            setSelectedStore(null)
          }}
        />
      )}

      {/* 削除確認モーダル */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        itemName={deleteModal.storeName}
      />
    </Layout>
  )
}

export default StaffDashboard 