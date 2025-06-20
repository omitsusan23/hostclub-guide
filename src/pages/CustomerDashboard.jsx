import React, { useState } from 'react'
import Layout from '../components/Layout'
import { useApp } from '../contexts/AppContext'
import { 
  getStoreById, 
  mockCalendars, 
  mockRealtimeStatuses, 
  getVisitRecordsByStoreId,
  mockInvoiceSettings 
} from '../lib/types'

const CustomerDashboard = () => {
  const { getUserStoreId } = useApp()
  const storeId = getUserStoreId() || 'store-1' // デモ用にデフォルト値
  const store = getStoreById(storeId)
  
  const [selectedDates, setSelectedDates] = useState(new Set())
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

  // カレンダー用の日付生成（今月）
  const generateCalendarDates = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfWeek = new Date(year, month, 1).getDay()
    
    const dates = []
    
    // 前月の末尾日付
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      dates.push({ date, isCurrentMonth: false })
    }
    
    // 今月の日付
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      dates.push({ date, isCurrentMonth: true })
    }
    
    return dates
  }

  const calendarDates = generateCalendarDates()

  const handleDateToggle = (date) => {
    const dateString = date.toISOString().split('T')[0]
    const newSelectedDates = new Set(selectedDates)
    
    if (newSelectedDates.has(dateString)) {
      newSelectedDates.delete(dateString)
    } else {
      newSelectedDates.add(dateString)
    }
    
    setSelectedDates(newSelectedDates)
  }

  const handleSaveCalendar = async () => {
    setLoading(true)
    try {
      // 実際のアプリではSupabaseに送信
      console.log('休業日設定:', Array.from(selectedDates))
      alert('✅ 営業カレンダーを更新しました！')
    } catch (error) {
      alert('❌ 更新に失敗しました。')
    } finally {
      setLoading(false)
    }
  }

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
        {/* 左側：営業カレンダー */}
        <div className="space-y-6">
          {/* 営業カレンダー */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                📅 営業カレンダー
              </h3>
              <button
                onClick={handleSaveCalendar}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              休業日をクリックして選択してください
            </p>
            
            {/* カレンダーグリッド */}
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                <div key={day} className="py-2 font-medium text-gray-500">
                  {day}
                </div>
              ))}
              
              {calendarDates.map((item, index) => {
                const dateString = item.date.toISOString().split('T')[0]
                const isSelected = selectedDates.has(dateString)
                const isToday = dateString === new Date().toISOString().split('T')[0]
                
                return (
                  <button
                    key={index}
                    onClick={() => item.isCurrentMonth && handleDateToggle(item.date)}
                    disabled={!item.isCurrentMonth}
                    className={`py-2 rounded transition-colors ${
                      !item.isCurrentMonth
                        ? 'text-gray-300 cursor-not-allowed'
                        : isSelected
                        ? 'bg-red-500 text-white'
                        : isToday
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {item.date.getDate()}
                  </button>
                )
              })}
            </div>
            
            <div className="mt-4 flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                <span>今日</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                <span>休業日</span>
              </div>
            </div>
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