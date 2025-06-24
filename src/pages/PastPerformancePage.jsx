import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import SwipeableVisitItem from '../components/SwipeableVisitItem'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { useApp } from '../contexts/AppContext'
import { getVisitRecords, getStores, deleteVisitRecord } from '../lib/database'

const PastPerformancePage = () => {
  const { user, getUserRole } = useApp()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedRecords, setSelectedRecords] = useState([])
  const [stores, setStores] = useState([])
  const [monthlyData, setMonthlyData] = useState({})
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, recordId: null, storeName: '' })

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
    
    if (direction === 'prev') {
      // 2025年7月より前には行けない
      if (newDate.getFullYear() === 2025 && newDate.getMonth() === 6) {
        return
      }
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (direction === 'next') {
      const now = new Date()
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

  const calendar = generateCalendarData()
  const now = new Date()
  const canGoPrev = !(currentDate.getFullYear() === 2025 && currentDate.getMonth() === 6)
  const canGoNext = !(currentDate.getFullYear() > now.getFullYear() || 
                     (currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() >= now.getMonth()))

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
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
        ) : selectedDate ? (
          // 日付詳細表示
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                📋 {selectedDate.getMonth() + 1}/{selectedDate.getDate()} 案内実績 {selectedDate.getMonth() + 1}/{selectedDate.getDate()}({getWeekday(selectedDate)})
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                カレンダーに戻る
              </button>
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
        ) : (
          // カレンダー表示
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
        )}

        {/* 削除確認モーダル */}
        <DeleteConfirmModal
          isOpen={deleteModal.isOpen}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          itemName={deleteModal.storeName}
        />
      </div>
    </Layout>
  )
}

export default PastPerformancePage 