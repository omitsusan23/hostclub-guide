import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import VisitForm from '../components/VisitForm'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import SwipeableVisitItem from '../components/SwipeableVisitItem'
import { useApp } from '../contexts/AppContext'
import { useStaffChatNotifications } from '../hooks/useStaffChatNotifications'
import { 
  getStores,
  getTodayVisitRecords,
  getMonthlyVisitRecords,
  addVisitRecord,
  addVisitRecordWithRequestCheck,
  deleteVisitRecord,
  getPersonalMonthlyIntroductionsByRecommendation
} from '../lib/database'
import { supabase } from '../lib/supabase'

const OutstaffDashboard = () => {
  const { user, getUserRole } = useApp()
  const [showVisitForm, setShowVisitForm] = useState(false)
  const [selectedStore, setSelectedStore] = useState(null)
  const [stores, setStores] = useState([])
  const [visitRecords, setVisitRecords] = useState([])
  const [monthlyRecords, setMonthlyRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, record: null, storeName: '' })
  const [currentStaff, setCurrentStaff] = useState(null)
  const [personalMonthlyRecommendations, setPersonalMonthlyRecommendations] = useState({ recommended: 0, notRecommended: 0, total: 0 })
  
  // 通知機能
  const { markAsRead } = useStaffChatNotifications(user?.id)

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
        
        // outstaff専用のデータ取得
        const userRole = getUserRole()
        const staffTypeFilter = 'outstaff'
        
        // 店舗データ取得（outstaffアクセス可能店舗のみ）
        const storesData = await getStores(userRole)
        setStores(storesData)

        // 今日の案内記録取得（outstaff分離表示）
        const recordsData = await getTodayVisitRecords(null, staffTypeFilter)
        setVisitRecords(recordsData)

        // 今月の案内記録取得（outstaff分離表示）
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
            
            // 個人の推奨状態別当月案内数を取得
            const personalRecommendationsResult = await getPersonalMonthlyIntroductionsByRecommendation(staffData.display_name)
            if (personalRecommendationsResult.success) {
              setPersonalMonthlyRecommendations(personalRecommendationsResult.data)
            }
          }
        }
        
        // ダッシュボードアクセス時にチャット通知をクリア
        markAsRead()
        
      } catch (error) {
        console.error('データ取得エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

  // 本日の案内数を計算
  const todayCount = visitRecords.reduce((total, record) => total + record.guest_count, 0)
  
  // 今月の案内数を計算
  const monthlyCount = monthlyRecords.reduce((total, record) => total + record.guest_count, 0)



  const handleVisitSubmit = async (visitData) => {
    try {
      const userRole = getUserRole()
      
      // Supabaseに案内記録を保存（staff_type='outstaff'で自動設定） + リクエスト消化チェック
      const savedRecord = await addVisitRecordWithRequestCheck({
        store_id: visitData.storeId,
        guest_count: visitData.guestCount,
        staff_name: currentStaff?.display_name || user?.user_metadata?.display_name || 'アウトスタッフ',
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
      const result = await deleteVisitRecord(deleteModal.record.id)
      
      if (result.success) {
        // ローカル状態から削除
        setVisitRecords(prev => prev.filter(record => record.id !== deleteModal.record.id))
        
        // モーダルを閉じる
        setDeleteModal({ isOpen: false, record: null, storeName: '' })
        
        if (result.restoredRequests > 0) {
          alert(`✅ 案内記録を削除しました。店舗の残り回数を ${result.restoredRequests} 回復元しました。`)
        } else {
          alert('✅ 案内記録を削除しました')
        }
      } else {
        alert('❌ 削除に失敗しました: ' + result.error)
      }
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
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
            <div className="flex flex-col items-center">
              <div className="text-blue-600 text-2xl mb-2">🏪</div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600 mb-1">本日の案内数</p>
                <p className="text-2xl font-bold text-gray-900">{todayCount}</p>
              </div>
            </div>
          </div>
          
          {/* 今月のチェックマークあり案内数 */}
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
            <div className="flex flex-col items-center">
              <div className="text-green-600 text-2xl mb-2">✅</div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600 mb-1">今月のチェックマークあり</p>
                <p className="text-2xl font-bold text-gray-900">{personalMonthlyRecommendations.recommended}</p>
              </div>
            </div>
          </div>

          {/* 今月のチェックマークなし案内数 */}
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
            <div className="flex flex-col items-center">
              <div className="text-red-600 text-2xl mb-2">❌</div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600 mb-1">今月のチェックマークなし</p>
                <p className="text-2xl font-bold text-gray-900">{personalMonthlyRecommendations.notRecommended}</p>
              </div>
            </div>
          </div>
        </div>

        {/* クイックアクション（outstaff用） */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                本日・今月のアウトスタッフ案内実績を確認
              </p>
            </a>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="space-y-6">
          {/* 担当可能店舗一覧 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🏢 担当可能店舗一覧
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {stores.map((store) => (
                <div key={store.id} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="font-medium text-blue-800">{store.name}</div>
                  <div className="text-sm text-blue-600">ID: {store.store_id}</div>
                </div>
              ))}
            </div>
            
            {stores.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🏪</div>
                <p className="text-gray-500">担当可能な店舗がありません</p>
              </div>
            )}
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
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 border-t border-purple-300 px-4 py-3 shadow-lg z-50">
        <button
          onClick={() => setShowVisitForm(true)}
          className="w-full max-w-sm mx-auto block px-6 py-4 bg-white text-purple-600 text-lg font-semibold rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-md border-2 border-white"
        >
          📝 案内報告
        </button>
      </div>
    </Layout>
  )
}

export default OutstaffDashboard 