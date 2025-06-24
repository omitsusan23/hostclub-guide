import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useApp } from '../contexts/AppContext'
import { getTodayVisitRecords, getMonthlyVisitRecords, getStores, deleteVisitRecord, getVisitRecords } from '../lib/database'
import { supabase } from '../lib/supabase'
import SwipeableVisitItem from '../components/SwipeableVisitItem'
import DeleteConfirmModal from '../components/DeleteConfirmModal'

const StaffPerformancePage = () => {
  const { user, getUserRole, getUserStoreId } = useApp()
  const [todayRecords, setTodayRecords] = useState([])
  const [monthlyRecords, setMonthlyRecords] = useState([])
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, record: null, recordId: null, storeName: '' })
  const [currentStaff, setCurrentStaff] = useState(null)
  
  // 店舗別案内実績用の状態
  const [selectedStore, setSelectedStore] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [storeMonthlyData, setStoreMonthlyData] = useState({})
  const [storeSelectedRecords, setStoreSelectedRecords] = useState([])
  const [storeLoading, setStoreLoading] = useState(false)

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

  // 店舗別案内実績用の関数群
  const formatLocalDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getWeekday = (date) => {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    return weekdays[date.getDay()]
  }

  // 特定店舗の月次データ取得
  const fetchStoreMonthlyData = async (storeId, year, month) => {
    try {
      setStoreLoading(true)
      const startDate = new Date(year, month, 1)
      const endDate = new Date(year, month + 1, 0)
      
      const records = await getVisitRecords(
        storeId, 
        startDate.toISOString(), 
        endDate.toISOString()
      )

      // 日付別にグループ化
      const dailyData = {}
      records.forEach(record => {
        const recordDate = formatLocalDate(new Date(record.guided_at))
        if (!dailyData[recordDate]) {
          dailyData[recordDate] = []
        }
        dailyData[recordDate].push(record)
      })

      setStoreMonthlyData(dailyData)
    } catch (error) {
      console.error('店舗月次データ取得エラー:', error)
    } finally {
      setStoreLoading(false)
    }
  }

  // カレンダーデータ生成
  const generateCalendarData = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // 日曜日から開始

    const calendar = []
    const current = new Date(startDate)

    for (let week = 0; week < 6; week++) {
      const weekData = []
      for (let day = 0; day < 7; day++) {
        weekData.push(new Date(current))
        current.setDate(current.getDate() + 1)
      }
      calendar.push(weekData)
      
      if (current.getMonth() !== month && week >= 4) break
    }

    return calendar
  }

  // 月移動
  const changeMonth = (direction) => {
    const newDate = new Date(currentDate)
    const now = new Date()
    
    if (direction === 'prev') {
      // 現在の月より前には行けない
      if (newDate.getFullYear() < now.getFullYear() || 
          (newDate.getFullYear() === now.getFullYear() && newDate.getMonth() <= now.getMonth())) {
        return
      }
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (direction === 'next') {
      // 来月には行けない
      if (newDate.getFullYear() > now.getFullYear() || 
          (newDate.getFullYear() === now.getFullYear() && newDate.getMonth() >= now.getMonth())) {
        return
      }
      newDate.setMonth(newDate.getMonth() + 1)
    }
    
    setCurrentDate(newDate)
    setSelectedDate(null) // 選択日をリセット
  }

  // 店舗選択
  const selectStore = (store) => {
    setSelectedStore(store)
    setSelectedDate(null)
    setCurrentDate(new Date()) // 現在月にリセット
    fetchStoreMonthlyData(store.store_id, new Date().getFullYear(), new Date().getMonth())
  }

  // 日付選択
  const selectDate = (date) => {
    const dateStr = formatLocalDate(date)
    const records = storeMonthlyData[dateStr] || []
    setStoreSelectedRecords(records)
    setSelectedDate(date)
  }

  // 店舗カレンダーから戻る
  const backToStoreList = () => {
    setSelectedStore(null)
    setSelectedDate(null)
    setStoreMonthlyData({})
    setStoreSelectedRecords([])
  }

  // 表示する店舗をフィルタリング
  const getDisplayStores = () => {
    const userRole = getUserRole()
    if (userRole === 'customer') {
      const userStoreId = getUserStoreId()
      return stores.filter(store => store.store_id === userStoreId)
    }
    // staff の場合は全店舗を表示
    return stores.sort((a, b) => a.name.localeCompare(b.name, 'ja'))
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
      recordId: null,
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
      setDeleteModal({ isOpen: false, record: null, recordId: null, storeName: '' })
      
      alert('✅ 案内記録を削除しました')
    } catch (error) {
      console.error('削除エラー:', error)
      alert('❌ 削除に失敗しました')
    }
  }

  // 削除キャンセル
  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false, record: null, recordId: null, storeName: '' })
  }

  // 店舗カレンダーの削除確認
  const handleStoreDeleteRequest = (recordId) => {
    const record = storeSelectedRecords.find(r => r.id === recordId)
    const store = stores.find(s => s.store_id === record?.store_id)
    setDeleteModal({
      isOpen: true,
      record: null,
      recordId,
      storeName: store?.name || '不明な店舗'
    })
  }

  // 店舗カレンダーの削除実行
  const handleStoreConfirmDelete = async () => {
    try {
      await deleteVisitRecord(deleteModal.recordId)
      
      // 選択中の記録リストから削除
      setStoreSelectedRecords(prev => prev.filter(r => r.id !== deleteModal.recordId))
      
      // 月次データからも削除
      const selectedDateStr = formatLocalDate(selectedDate)
      setStoreMonthlyData(prev => ({
        ...prev,
        [selectedDateStr]: prev[selectedDateStr]?.filter(r => r.id !== deleteModal.recordId) || []
      }))
      
      setDeleteModal({ isOpen: false, record: null, recordId: null, storeName: '' })
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
    }
  }

  // 月が変更されたときに店舗データを再取得
  useEffect(() => {
    if (selectedStore) {
      fetchStoreMonthlyData(selectedStore.store_id, currentDate.getFullYear(), currentDate.getMonth())
    }
  }, [currentDate, selectedStore])

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
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            📊 案内実績
          </h1>
          <a
            href="/past-performance"
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            📋 過去の案内実績
          </a>
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

        {/* 店舗別案内実績 */}
        <div className="mt-8">
          {selectedDate && selectedStore ? (
            // 日付詳細表示
            <>
              {/* 戻るボタン */}
              <div className="mb-6">
                <button
                  onClick={() => setSelectedDate(null)}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {selectedStore.name}のカレンダーに戻る
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    📋 {selectedStore.name} 案内実績{selectedDate.getMonth() + 1}/{selectedDate.getDate()}({getWeekday(selectedDate)})
                  </h3>
                </div>
               
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {storeSelectedRecords.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      この日の案内記録はありません
                    </p>
                  ) : (
                    storeSelectedRecords.map((record) => {
                      const store = stores.find(s => s.store_id === record.store_id)
                      
                      return (
                        <SwipeableVisitItem
                          key={record.id}
                          record={record}
                          store={store}
                          onDelete={handleStoreDeleteRequest}
                        />
                      )
                    })
                  )}
                </div>
              </div>
            </>
          ) : selectedStore ? (
            // 店舗カレンダー表示
            <>
              {/* 戻るボタン */}
              <div className="mb-6">
                <button
                  onClick={backToStoreList}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  店舗一覧に戻る
                </button>
              </div>

              {storeLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">データを読み込み中...</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6">
                  {/* 月移動ヘッダー */}
                  <div className="flex justify-between items-center mb-6">
                    <button
                      onClick={() => changeMonth('prev')}
                      disabled={currentDate.getFullYear() < new Date().getFullYear() || 
                               (currentDate.getFullYear() === new Date().getFullYear() && currentDate.getMonth() <= new Date().getMonth())}
                      className={`p-2 rounded-lg transition-colors ${
                        !(currentDate.getFullYear() < new Date().getFullYear() || 
                         (currentDate.getFullYear() === new Date().getFullYear() && currentDate.getMonth() <= new Date().getMonth()))
                          ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' 
                          : 'text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedStore.name} - {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
                    </h2>
                    
                    <button
                      onClick={() => changeMonth('next')}
                      disabled={currentDate.getFullYear() > new Date().getFullYear() || 
                               (currentDate.getFullYear() === new Date().getFullYear() && currentDate.getMonth() >= new Date().getMonth())}
                      className={`p-2 rounded-lg transition-colors ${
                        !(currentDate.getFullYear() > new Date().getFullYear() || 
                         (currentDate.getFullYear() === new Date().getFullYear() && currentDate.getMonth() >= new Date().getMonth()))
                          ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' 
                          : 'text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* 曜日ヘッダー */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
                      <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* カレンダー本体 */}
                  <div className="space-y-1">
                    {generateCalendarData().map((week, weekIndex) => (
                      <div key={weekIndex} className="grid grid-cols-7 gap-1">
                        {week.map((date, dayIndex) => {
                          const dateStr = formatLocalDate(date)
                          const dayRecords = storeMonthlyData[dateStr] || []
                          const totalCount = dayRecords.reduce((sum, record) => sum + (record.guest_count || 0), 0)
                          const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                          const isToday = date.toDateString() === new Date().toDateString()
                          const isFuture = date > new Date()

                          return (
                            <button
                              key={dayIndex}
                              onClick={() => isCurrentMonth && !isFuture && selectDate(date)}
                              disabled={!isCurrentMonth || isFuture}
                              className={`
                                h-16 p-1 rounded-lg border transition-all text-sm
                                ${isCurrentMonth 
                                  ? isFuture
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                                    : 'bg-white hover:bg-gray-50 border-gray-200 cursor-pointer'
                                  : 'bg-gray-50 text-gray-300 cursor-not-allowed border-gray-100'
                                }
                                ${isToday && isCurrentMonth ? 'border-blue-500 bg-blue-50' : ''}
                              `}
                            >
                              <div className="font-medium">{date.getDate()}</div>
                              {isCurrentMonth && !isFuture && totalCount > 0 && (
                                <div className="text-xs text-blue-600 font-bold">
                                  {totalCount}
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            // 店舗一覧表示
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                🏪 店舗別案内実績
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                {getDisplayStores().map((store) => (
                  <button
                    key={store.id}
                    onClick={() => selectStore(store)}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all text-left"
                  >
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">🏪</div>
                      <div>
                        <h4 className="font-medium text-gray-900">{store.name}</h4>
                        <p className="text-sm text-gray-600">案内実績を確認</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {getDisplayStores().length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>表示できる店舗がありません</p>
                </div>
              )}
            </div>
          )}
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
        onConfirm={deleteModal.recordId ? handleStoreConfirmDelete : handleConfirmDelete}
        onCancel={handleCancelDelete}
        itemName={deleteModal.storeName}
      />
    </Layout>
  )
}

export default StaffPerformancePage 