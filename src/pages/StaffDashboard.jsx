import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import VisitForm from '../components/VisitForm'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import SwipeableVisitItem from '../components/SwipeableVisitItem'
import { useApp } from '../contexts/AppContext'
import { 
  getStores,
  getTodayVisitRecords,
  getMonthlyVisitRecords,
  addVisitRecord,
  deleteVisitRecord,
  getMonthlyTarget,
  getStaffChats,
  sendStaffChat,
  editStaffChat,
  deleteStaffChat,
  subscribeToStaffChats,
  unsubscribeFromStaffChats
} from '../lib/database'
import { supabase } from '../lib/supabase'

const StaffDashboard = () => {
  const { user, hasAdminPermissions, getUserRole } = useApp()
  const [showVisitForm, setShowVisitForm] = useState(false)
  const [selectedStore, setSelectedStore] = useState(null)
  const [stores, setStores] = useState([])
  const [visitRecords, setVisitRecords] = useState([])
  const [monthlyRecords, setMonthlyRecords] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [chatLoading, setChatLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, record: null, storeName: '' })
  const [currentStaff, setCurrentStaff] = useState(null)
  const [monthlyTarget, setMonthlyTarget] = useState(0)
  const [chatSubscription, setChatSubscription] = useState(null)

  // 業務日ベースで今日の日付を取得する関数（25時切り替わり）
  const getTodayDateString = () => {
    const now = new Date()
    const businessDate = new Date(now)
    
    // 1時未満の場合は前日扱い
    if (now.getHours() < 1) {
      businessDate.setDate(businessDate.getDate() - 1)
    }
    
    const month = businessDate.getMonth() + 1
    const day = businessDate.getDate()
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][businessDate.getDay()]
    return `${month}/${day}(${dayOfWeek})`
  }

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // staff専用のデータ取得
        const userRole = getUserRole()
        const staffTypeFilter = 'staff'
        
        // 店舗データ取得（全店舗アクセス可能）
        const storesData = await getStores(userRole)
        setStores(storesData)

        // 今日の案内記録取得（staff分離表示）
        const recordsData = await getTodayVisitRecords(null, staffTypeFilter)
        setVisitRecords(recordsData)

        // 今月の案内記録取得（staff分離表示）
        const monthlyData = await getMonthlyVisitRecords(null, null, null, staffTypeFilter)
        setMonthlyRecords(monthlyData)

        // 現在のスタッフ情報取得
        if (user?.id) {
          const { data: staffData, error } = await supabase
            .from('staffs')
            .select('display_name')
            .eq('user_id', user.id)
            .single()
          
          if (!error && staffData) {
            setCurrentStaff(staffData)
          }
        }

        // staff用の月間目標を取得
        const target = await getMonthlyTarget()
        setMonthlyTarget(target)

        // スタッフチャットデータを取得
        await loadChatMessages()
        
      } catch (error) {
        console.error('データ取得エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    // チャットデータを読み込む関数
    const loadChatMessages = async () => {
      try {
        setChatLoading(true)
        const result = await getStaffChats()
        if (result.success) {
          setChatMessages(result.data)
        }
      } catch (error) {
        console.error('チャット取得エラー:', error)
      } finally {
        setChatLoading(false)
      }
    }

    // リアルタイムチャット購読を設定
    const setupChatSubscription = () => {
      const subscription = subscribeToStaffChats((payload) => {
        console.log('📨 チャット更新:', payload)
        
        if (payload.eventType === 'INSERT') {
          // 新しいメッセージが追加された場合
          setChatMessages(prev => [...prev, payload.new])
        } else if (payload.eventType === 'UPDATE') {
          // メッセージが編集された場合
          setChatMessages(prev => 
            prev.map(msg => 
              msg.id === payload.new.id ? payload.new : msg
            )
          )
        } else if (payload.eventType === 'DELETE') {
          // メッセージが削除された場合
          setChatMessages(prev => 
            prev.filter(msg => msg.id !== payload.old.id)
          )
        }
      })
      
      setChatSubscription(subscription)
    }

    fetchData()
    setupChatSubscription()

    // クリーンアップ
    return () => {
      if (chatSubscription) {
        unsubscribeFromStaffChats(chatSubscription)
      }
    }
  }, [user?.id])

  // 本日の案内数を計算
  const todayCount = visitRecords.reduce((total, record) => total + record.guest_count, 0)
  
  // 今月の案内数を計算
  const monthlyCount = monthlyRecords.reduce((total, record) => total + record.guest_count, 0)

  // 目標本数までの計算
  const getTargetRemaining = () => {
    const remaining = monthlyTarget - monthlyCount
    return remaining > 0 ? remaining : monthlyCount - monthlyTarget // 目標達成時は超過分を返す
  }

  // 目標達成状況
  const isTargetAchieved = () => {
    return monthlyCount >= monthlyTarget
  }

  const handleVisitSubmit = async (visitData) => {
    try {
      const userRole = getUserRole()
      
      // Supabaseに案内記録を保存（staff_type='staff'で固定）
      const savedRecord = await addVisitRecord({
        store_id: visitData.storeId,
        guest_count: visitData.guestCount,
        staff_name: currentStaff?.display_name || user?.user_metadata?.display_name || 'スタッフ',
        guided_at: visitData.guided_at
      }, userRole)
      
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
    if (!newMessage.trim() || !user?.id || !currentStaff) return

    try {
      const messageData = {
        message: newMessage.trim(),
        sender_id: user.id,
        sender_name: currentStaff.display_name,
        sender_role: getUserRole(),
        message_type: 'text'
      }

      const result = await sendStaffChat(messageData)
      
      if (result.success) {
        setNewMessage('')
        // リアルタイム機能により自動的にメッセージが追加される
      } else {
        console.error('チャット送信エラー:', result.error)
        alert('❌ 送信に失敗しました: ' + result.error)
      }
      
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
      <div className="pb-24">
        {/* 実績カード */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {/* 本日の案内数 */}
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
            <div className="flex flex-col items-center">
              <div className="text-green-600 text-2xl mb-2">🏪</div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600 mb-1">本日の案内数</p>
                <p className="text-2xl font-bold text-gray-900">{todayCount}</p>
              </div>
            </div>
          </div>
          
          {/* 今月の案内数 */}
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
            <div className="flex flex-col items-center">
              <div className="text-blue-600 text-2xl mb-2">📅</div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600 mb-1">今月の案内数</p>
                <p className="text-2xl font-bold text-gray-900">{monthlyCount}</p>
              </div>
            </div>
          </div>

          {/* 目標本数まで */}
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-2">
                <span className="text-yellow-600 text-2xl">🎯</span>
                                    <span className="text-sm text-gray-600 ml-1">({monthlyTarget})</span>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600 mb-1">目標本数まで</p>
                <p className={`text-2xl font-bold ${
                  isTargetAchieved() ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {isTargetAchieved() ? `+${getTargetRemaining()}` : getTargetRemaining()}
                </p>
              </div>
            </div>
          </div>
        </div>

                {/* クイックアクション */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${hasAdminPermissions() ? 'lg:grid-cols-4' : ''}`}>
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

          {/* 案内実績 */}
          <a
            href="/staff-performance"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all group"
          >
            <div className="flex items-center mb-2">
              <div className="text-2xl mr-3">📊</div>
              <h4 className="font-medium text-gray-900 group-hover:text-blue-600">
                案内実績
              </h4>
            </div>
            <p className="text-sm text-gray-600">
              本日・今月の案内実績を確認
            </p>
          </a>

          {/* 管理者限定：店舗管理 */}
          {hasAdminPermissions() && (
            <a
              href="/store-management"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-purple-300 transition-all group"
            >
              <div className="flex items-center mb-2">
                <div className="text-2xl mr-3">🏢</div>
                <h4 className="font-medium text-gray-900 group-hover:text-purple-600">
                  店舗管理
                </h4>
              </div>
              <p className="text-sm text-gray-600">
                店舗の登録・編集・削除を管理
              </p>
            </a>
          )}

          {/* 管理者限定：スタッフ管理 */}
          {hasAdminPermissions() && (
            <a
              href="/staff-management"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-orange-300 transition-all group"
            >
              <div className="flex items-center mb-2">
                <div className="text-2xl mr-3">👥</div>
                <h4 className="font-medium text-gray-900 group-hover:text-orange-600">
                  スタッフ管理
                </h4>
              </div>
              <p className="text-sm text-gray-600">
                スタッフの登録・編集・削除を管理
              </p>
            </a>
          )}

          {/* 管理者限定：outstaff店舗設定 */}
          {hasAdminPermissions() && (
            <a
              href="/outstaff-store-settings"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-pink-300 transition-all group"
            >
              <div className="flex items-center mb-2">
                <div className="text-2xl mr-3">🌸</div>
                <h4 className="font-medium text-gray-900 group-hover:text-pink-600">
                  outstaff店舗設定
                </h4>
              </div>
              <p className="text-sm text-gray-600">
                アウトスタッフの推奨店舗を設定
              </p>
            </a>
          )}

 
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="space-y-6">
          {/* スタッフチャット */}
          <div className="bg-white rounded-lg shadow-md p-6 h-96 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              💬 スタッフチャット
            </h3>
            
            {/* チャットメッセージ */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {chatLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 text-sm mt-2">チャットを読み込み中...</p>
                </div>
              ) : chatMessages.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  チャットメッセージはありません
                </p>
              ) : (
                chatMessages.map((chat) => {
                  const isMyMessage = chat.sender_id === user?.id
                  return (
                    <div key={chat.id} className={`p-3 rounded-lg ${
                      isMyMessage ? 'bg-blue-100 ml-8' : 'bg-gray-50 mr-8'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{chat.sender_name}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            chat.sender_role === 'admin' ? 'bg-red-100 text-red-700' :
                            chat.sender_role === 'outstaff' ? 'bg-pink-100 text-pink-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {chat.sender_role === 'admin' ? '管理者' :
                             chat.sender_role === 'outstaff' ? 'outstaff' : 'staff'}
                          </span>
                          {chat.is_edited && (
                            <span className="text-xs text-gray-500">(編集済み)</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(chat.sent_at).toLocaleTimeString('ja-JP', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{chat.message}</p>
                    </div>
                  )
                })
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
                <div key={store.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">{store.name}</div>
                  <div className="text-sm text-gray-600">ID: {store.store_id}</div>
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

      {/* 固定フッター：案内報告ボタン */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-lg z-50">
        <button
          onClick={() => setShowVisitForm(true)}
          className="w-full max-w-sm mx-auto block px-6 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-md"
        >
          📝 案内報告
        </button>
      </div>
    </Layout>
  )
}

export default StaffDashboard 