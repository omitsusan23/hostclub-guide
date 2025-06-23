import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useApp } from '../contexts/AppContext'
import { getTodayVisitRecords, getMonthlyVisitRecords } from '../lib/database'

const StaffPerformancePage = () => {
  const { user } = useApp()
  const [todayRecords, setTodayRecords] = useState([])
  const [monthlyRecords, setMonthlyRecords] = useState([])
  const [loading, setLoading] = useState(true)

  // 今日の日付を取得する関数
  const getTodayDateString = () => {
    const today = new Date()
    const month = today.getMonth() + 1
    const day = today.getDate()
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][today.getDay()]
    return `${month}/${day}(${dayOfWeek})`
  }

  // 今月の日付を取得する関数
  const getCurrentMonthString = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() + 1
    return `${year}年${month}月`
  }

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            📊 案内実績
          </h1>
          <p className="text-gray-600">
            あなたの案内実績を確認できます
          </p>
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

        {/* 詳細情報 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📈 詳細情報
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">
                本日の実績 {getTodayDateString()}
              </h4>
              <div className="text-sm text-gray-600">
                案内件数: {todayRecords.length}件 | 総案内人数: {todayCount}名
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">
                {getCurrentMonthString()}の実績
              </h4>
              <div className="text-sm text-gray-600">
                案内件数: {monthlyRecords.length}件 | 総案内人数: {monthlyCount}名
              </div>
            </div>
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
    </Layout>
  )
}

export default StaffPerformancePage 