import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import SwipeableVisitItem from '../components/SwipeableVisitItem'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { useApp } from '../contexts/AppContext'
import { getVisitRecords, getStores, deleteVisitRecord } from '../lib/database'

const PastPerformancePage = () => {
  const { user, getUserRole, getUserStoreId } = useApp()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedRecords, setSelectedRecords] = useState([])
  const [stores, setStores] = useState([])
  const [monthlyData, setMonthlyData] = useState({})
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, recordId: null, storeName: '' })
  
  // 店舗別案内実績用の状態
  const [selectedStore, setSelectedStore] = useState(null)
  const [storeCurrentDate, setStoreCurrentDate] = useState(new Date())
  const [storeSelectedDate, setStoreSelectedDate] = useState(null)
  const [storeMonthlyData, setStoreMonthlyData] = useState({})
  const [storeSelectedRecords, setStoreSelectedRecords] = useState([])
  const [storeLoading, setStoreLoading] = useState(false)

  // staff ロール以外はアクセス不可
  const userRole = getUserRole()
  if (userRole !== 'staff') {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <h2 className="text-lg font-semibold mb-2">アクセス権限がありません</h2>
            <p>このページはスタッフのみアクセスできます。</p>
          </div>
        </div>
      </Layout>
    )
  }

  // 日付フォーマット関数
  const formatLocalDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 曜日を取得
  const getWeekday = (date) => {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    return weekdays[date.getDay()]
  }

  // 月の案内記録を取得
  const fetchMonthlyData = async (year, month) => {
    try {
      setLoading(true)
      const startDate = new Date(year, month, 1)
      const endDate = new Date(year, month + 1, 0)
      
      const records = await getVisitRecords(
        null, 
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

      setMonthlyData(dailyData)
    } catch (error) {
      console.error('月次データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // 店舗データ取得
  useEffect(() => {
    const fetchStores = async () => {
      const storesData = await getStores()
      setStores(storesData)
    }
    fetchStores()
  }, [])

  // 月が変更されたときにデータを取得
  useEffect(() => {
    fetchMonthlyData(currentDate.getFullYear(), currentDate.getMonth())
  }, [currentDate])

  // 店舗カレンダーの月が変更されたときに店舗データを再取得
  useEffect(() => {
    if (selectedStore) {
      fetchStoreMonthlyData(selectedStore.store_id, storeCurrentDate.getFullYear(), storeCurrentDate.getMonth())
    }
  }, [storeCurrentDate, selectedStore])

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

  // 日付選択
  const selectDate = (date) => {
    const dateStr = formatLocalDate(date)
    const records = monthlyData[dateStr] || []
    setSelectedRecords(records)
    setSelectedDate(date)
  }

  // 削除確認
  const handleDeleteRequest = (recordId) => {
    const record = selectedRecords.find(r => r.id === recordId)
    const store = stores.find(s => s.store_id === record?.store_id)
    setDeleteModal({
      isOpen: true,
      recordId,
      storeName: store?.name || '不明な店舗'
    })
  }

  // 削除実行
  const handleConfirmDelete = async () => {
    try {
      await deleteVisitRecord(deleteModal.recordId)
      
      // 選択中の記録リストから削除
      setSelectedRecords(prev => prev.filter(r => r.id !== deleteModal.recordId))
      
      // 月次データからも削除
      const selectedDateStr = formatLocalDate(selectedDate)
      setMonthlyData(prev => ({
        ...prev,
        [selectedDateStr]: prev[selectedDateStr]?.filter(r => r.id !== deleteModal.recordId) || []
      }))
      
      setDeleteModal({ isOpen: false, recordId: null, storeName: '' })
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
    }
  }

  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false, recordId: null, storeName: '' })
  }

  // 店舗別案内実績用の関数群
  
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

  // 店舗カレンダーデータ生成
  const generateStoreCalendarData = () => {
    const year = storeCurrentDate.getFullYear()
    const month = storeCurrentDate.getMonth()
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

  // 店舗カレンダーの月移動
  const changeStoreMonth = (direction) => {
    const newDate = new Date(storeCurrentDate)
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
    
    setStoreCurrentDate(newDate)
    setStoreSelectedDate(null) // 選択日をリセット
  }

  // 店舗選択
  const selectStore = (store) => {
    setSelectedStore(store)
    setStoreSelectedDate(null)
    setStoreCurrentDate(new Date()) // 現在月にリセット
    fetchStoreMonthlyData(store.store_id, new Date().getFullYear(), new Date().getMonth())
  }

  // 店舗カレンダーの日付選択
  const selectStoreDate = (date) => {
    const dateStr = formatLocalDate(date)
    const records = storeMonthlyData[dateStr] || []
    setStoreSelectedRecords(records)
    setStoreSelectedDate(date)
  }

  // 店舗カレンダーから戻る
  const backToStoreList = () => {
    setSelectedStore(null)
    setStoreSelectedDate(null)
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

  // 店舗カレンダーの削除確認
  const handleStoreDeleteRequest = (recordId) => {
    const record = storeSelectedRecords.find(r => r.id === recordId)
    const store = stores.find(s => s.store_id === record?.store_id)
    setDeleteModal({
      isOpen: true,
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
      const selectedDateStr = formatLocalDate(storeSelectedDate)
      setStoreMonthlyData(prev => ({
        ...prev,
        [selectedDateStr]: prev[selectedDateStr]?.filter(r => r.id !== deleteModal.recordId) || []
      }))
      
      setDeleteModal({ isOpen: false, recordId: null, storeName: '' })
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
    }
  }

  const calendar = generateCalendarData()
  const now = new Date()
  const canGoPrev = !(currentDate.getFullYear() < now.getFullYear() || 
                     (currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() <= now.getMonth()))
  const canGoNext = !(currentDate.getFullYear() > now.getFullYear() || 
                     (currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() >= now.getMonth()))

  // 現在選択中の月の案内数を計算
  const getCurrentMonthGuidanceCount = () => {
    return Object.values(monthlyData).flat().reduce((total, record) => total + (record.guest_count || 0), 0)
  }

  // 目標本数（将来的にadmin設定から取得）
  const getMonthlyTarget = () => {
    // TODO: admin設定から取得する
    return 100 // デフォルト目標本数
  }

  // 達成度を計算
  const getCurrentMonthAchievementRate = () => {
    const guidanceCount = getCurrentMonthGuidanceCount()
    const target = getMonthlyTarget()
    if (target === 0) return 0
    return Math.round((guidanceCount / target) * 100)
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
        {selectedDate ? (
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
                カレンダーに戻る
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  📋 案内実績{selectedDate.getMonth() + 1}/{selectedDate.getDate()}({getWeekday(selectedDate)})
                </h3>
              </div>
             
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedRecords.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    この日の案内記録はありません
                  </p>
                ) : (
                  selectedRecords.map((record) => {
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
          </>
        ) : storeSelectedDate && selectedStore ? (
          // 店舗の日付詳細表示
          <>
            {/* 戻るボタン */}
            <div className="mb-6">
              <button
                onClick={() => setStoreSelectedDate(null)}
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
                  📋 {selectedStore.name} 案内実績{storeSelectedDate.getMonth() + 1}/{storeSelectedDate.getDate()}({getWeekday(storeSelectedDate)})
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
                    onClick={() => changeStoreMonth('prev')}
                    disabled={storeCurrentDate.getFullYear() < new Date().getFullYear() || 
                             (storeCurrentDate.getFullYear() === new Date().getFullYear() && storeCurrentDate.getMonth() <= new Date().getMonth())}
                    className={`p-2 rounded-lg transition-colors ${
                      !(storeCurrentDate.getFullYear() < new Date().getFullYear() || 
                       (storeCurrentDate.getFullYear() === new Date().getFullYear() && storeCurrentDate.getMonth() <= new Date().getMonth()))
                        ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' 
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedStore.name} - {storeCurrentDate.getFullYear()}年 {storeCurrentDate.getMonth() + 1}月
                  </h2>
                  
                  <button
                    onClick={() => changeStoreMonth('next')}
                    disabled={storeCurrentDate.getFullYear() > new Date().getFullYear() || 
                             (storeCurrentDate.getFullYear() === new Date().getFullYear() && storeCurrentDate.getMonth() >= new Date().getMonth())}
                    className={`p-2 rounded-lg transition-colors ${
                      !(storeCurrentDate.getFullYear() > new Date().getFullYear() || 
                       (storeCurrentDate.getFullYear() === new Date().getFullYear() && storeCurrentDate.getMonth() >= new Date().getMonth()))
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
                  {generateStoreCalendarData().map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 gap-1">
                      {week.map((date, dayIndex) => {
                        const dateStr = formatLocalDate(date)
                        const dayRecords = storeMonthlyData[dateStr] || []
                        const totalCount = dayRecords.reduce((sum, record) => sum + (record.guest_count || 0), 0)
                        const isCurrentMonth = date.getMonth() === storeCurrentDate.getMonth()
                        const isToday = date.toDateString() === new Date().toDateString()
                        const isFuture = date > new Date()

                        return (
                          <button
                            key={dayIndex}
                            onClick={() => isCurrentMonth && !isFuture && selectStoreDate(date)}
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
          <>
            {/* ヘッダー */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                📋 過去の案内実績
              </h1>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-4 text-gray-600">データを読み込み中...</p>
                </div>
              </div>
            ) : (
              <>
                {/* 月別実績カード */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* 月の案内数 */}
                  <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                    <div className="flex flex-col items-center">
                      <div className="text-blue-600 text-2xl mb-2">📊</div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          {currentDate.getMonth() + 1}月の案内数
                        </p>
                        <p className="text-2xl font-bold text-gray-900">{getCurrentMonthGuidanceCount()}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 目標達成度 */}
                  <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center mb-2">
                        <span className="text-green-600 text-2xl">🎯</span>
                        <span className="text-sm text-gray-600 ml-1">({getMonthlyTarget()})</span>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          {currentDate.getMonth() + 1}月の目標達成度
                        </p>
                        <p className={`text-2xl font-bold ${
                          getCurrentMonthAchievementRate() >= 100 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {getCurrentMonthAchievementRate()}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* カレンダー表示 */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  {/* 月移動ヘッダー */}
                  <div className="flex justify-between items-center mb-6">
                    <button
                      onClick={() => changeMonth('prev')}
                      disabled={!canGoPrev}
                      className={`p-2 rounded-lg transition-colors ${
                        canGoPrev 
                          ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' 
                          : 'text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <h2 className="text-xl font-bold text-gray-900">
                      {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
                    </h2>
                    
                    <button
                      onClick={() => changeMonth('next')}
                      disabled={!canGoNext}
                      className={`p-2 rounded-lg transition-colors ${
                        canGoNext 
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
                    {calendar.map((week, weekIndex) => (
                      <div key={weekIndex} className="grid grid-cols-7 gap-1">
                        {week.map((date, dayIndex) => {
                          const dateStr = formatLocalDate(date)
                          const dayRecords = monthlyData[dateStr] || []
                          const totalCount = dayRecords.reduce((sum, record) => sum + (record.guest_count || 0), 0)
                          const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                          const isToday = date.toDateString() === now.toDateString()
                          const isFuture = date > now

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

                                 {/* 店舗別案内実績 */}
                 <div className="mt-8">
                   <div className="bg-white rounded-lg shadow-md p-6">
                     <h3 className="text-lg font-semibold text-gray-800 mb-4">
                       🏪 店舗別案内実績
                     </h3>
                     
                     <div className="grid grid-cols-2 gap-3">
                       {getDisplayStores().map((store) => (
                         <button
                           key={store.id}
                           onClick={() => selectStore(store)}
                           className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all text-left"
                         >
                           <div className="flex items-center">
                             <div className="text-lg mr-2">🏪</div>
                             <h4 className="text-sm font-medium text-gray-900 leading-tight">{store.name}</h4>
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
                   
                   {/* メインに戻るボタン */}
                   <div className="mt-6">
                     <a
                       href="/staff"
                       className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                     >
                       <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                       </svg>
                       メインに戻る
                     </a>
                   </div>
                 </div>
              </>
            )}
          </>
        )}

        {/* 削除確認モーダル */}
        <DeleteConfirmModal
          isOpen={deleteModal.isOpen}
          onConfirm={deleteModal.recordId ? handleStoreConfirmDelete : handleConfirmDelete}
          onCancel={handleCancelDelete}
          itemName={deleteModal.storeName}
        />
      </div>
    </Layout>
  )
}

export default PastPerformancePage 