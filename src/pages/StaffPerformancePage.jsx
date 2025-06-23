import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useApp } from '../contexts/AppContext'
import { getTodayVisitRecords, getMonthlyVisitRecords, getStores, deleteVisitRecord } from '../lib/database'
import SwipeableVisitItem from '../components/SwipeableVisitItem'
import DeleteConfirmModal from '../components/DeleteConfirmModal'

const StaffPerformancePage = () => {
  const { user } = useApp()
  const [todayRecords, setTodayRecords] = useState([])
  const [monthlyRecords, setMonthlyRecords] = useState([])
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, record: null, storeName: '' })

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
        
        // 店舗データ取得
        const storesData = await getStores()
        setStores(storesData)
        
        // 今日の案内記録取得
        const todayData = await getTodayVisitRecords()
        setTodayRecords(todayData)

        // 今月の案内記録取得
        const monthlyData = await getMonthlyVisitRecords()
        setMonthlyRecords(monthlyData)
        
      } catch (error) {
        console.error('データ取得エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // 本日の案内数を計算
  const todayCount = todayRecords.reduce((total, record) => total + record.guest_count, 0)
  
  // 今月の案内数を計算
  const monthlyCount = monthlyRecords.reduce((total, record) => total + record.guest_count, 0)

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
      setTodayRecords(prev => prev.filter(record => record.id !== deleteModal.record.id))
      
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
      <div className="max-w-4xl mx-auto p-4">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            📊 案内実績
          </h1>
        </div>

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
              <div className="text-yellow-600 text-2xl mb-2">🎯</div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600 mb-1">目標本数まで</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* 本日の案内実績 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📋 本日の案内実績 {getTodayDateString()}
          </h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {todayRecords.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                本日の案内記録はまだありません
              </p>
            ) : (
              todayRecords.map((record) => {
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

        {/* 戻るボタン */}
        <div className="mt-6 text-center">
          <a
            href="/staff"
            className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← ダッシュボードに戻る
          </a>
        </div>
      </div>

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

export default StaffPerformancePage 