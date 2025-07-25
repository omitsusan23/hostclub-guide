import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import SwipeableVisitItem from '../components/SwipeableVisitItem'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { useApp } from '../contexts/AppContext'
import { getVisitRecords, getStores, deleteVisitRecord, getPersonalMonthlyIntroductionsByRecommendation, calculateTargetAchievementRate, getMonthlyIntroductionCountsByStaffAndRecommendation } from '../lib/database'
import { supabase } from '../lib/supabase'

const PastPerformancePage = () => {
  const { user, getUserRole, getUserStoreId } = useApp()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedRecords, setSelectedRecords] = useState([])
  const [stores, setStores] = useState([])
  const [monthlyData, setMonthlyData] = useState({})
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, recordId: null, storeName: '', isStoreView: false })
  
  // 店舗別案内実績用の状態
  const [selectedStore, setSelectedStore] = useState(null)
  const [storeCurrentDate, setStoreCurrentDate] = useState(new Date())
  const [storeSelectedDate, setStoreSelectedDate] = useState(null)
  const [storeMonthlyData, setStoreMonthlyData] = useState({})
  const [storeSelectedRecords, setStoreSelectedRecords] = useState([])
  const [storeLoading, setStoreLoading] = useState(false)
  const [currentStaff, setCurrentStaff] = useState(null)
  const [personalMonthlyRecommendations, setPersonalMonthlyRecommendations] = useState({ recommended: 0, notRecommended: 0, total: 0 })

  // staff、outstaff、adminロールのみアクセス可能
  const userRole = getUserRole()
  
  // URLパラメータからtypeを取得（adminの場合）
  const urlParams = new URLSearchParams(window.location.search)
  const forceType = urlParams.get('type') // 'staff'、'outstaff' または null
  
  if (userRole !== 'staff' && userRole !== 'outstaff' && userRole !== 'admin') {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <h2 className="text-lg font-semibold mb-2">アクセス権限がありません</h2>
            <p>このページはスタッフまたはアウトスタッフのみアクセスできます。</p>
          </div>
        </div>
      </Layout>
    )
  }

  // 実際に使用するロール（adminの場合はURLパラメータで決定）
  const effectiveRole = forceType || userRole

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

  // 月の案内記録を取得（分離表示）
  const fetchMonthlyData = async (year, month) => {
    try {
      // effectiveRoleが定義されるまで待機
      if (!effectiveRole) return
      
      setLoading(true)
      const startDate = new Date(year, month, 1)
      const endDate = new Date(year, month + 1, 0)
      
      // 分離表示のためstaff_typeフィルタリングを適用
      const staffTypeFilter = effectiveRole === 'outstaff' ? 'outstaff' : 'staff'
      
      const records = await getVisitRecords(
        null, 
        startDate.toISOString(), 
        endDate.toISOString(),
        staffTypeFilter
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

  // 店舗データ取得（outstaffフィルタリング対応）
  useEffect(() => {
    const fetchInitialData = async () => {
      // effectiveRoleが定義されるまで待機
      if (!effectiveRole) return
      
      const storesData = await getStores(effectiveRole)
      setStores(storesData)

      // スタッフ情報と当月推奨状態別案内数を取得（outstaffの場合のみ）
      if (effectiveRole === 'outstaff') {
        if (userRole === 'admin' || forceType === 'outstaff') {
          // adminの場合は全outstaffの統計を取得（権限エラー回避のため既存関数を使用）
          const staffCountsResult = await getMonthlyIntroductionCountsByStaffAndRecommendation()
          console.log('outstaffスタッフ統計データ:', staffCountsResult)
          
          if (staffCountsResult.success) {
            // 全outstaffスタッフの統計を合計
            let totalRecommended = 0
            let totalNotRecommended = 0
            
            Object.values(staffCountsResult.data).forEach(staffData => {
              console.log('スタッフデータ:', staffData)
              totalRecommended += staffData.recommended
              totalNotRecommended += staffData.notRecommended
            })
            
            console.log('合計統計:', { totalRecommended, totalNotRecommended })
            
            setPersonalMonthlyRecommendations({
              recommended: totalRecommended,
              notRecommended: totalNotRecommended,
              total: totalRecommended + totalNotRecommended
            })
            setCurrentStaff({ display_name: '全outstaffスタッフ' })
          } else {
            console.error('outstaffスタッフ統計取得エラー:', staffCountsResult.error)
            
            // デバッグ: 直接outstaffデータが存在するかチェック
            const { data: outstaffLogs, error: logsError } = await supabase
              .from('staff_logs')
              .select('*')
              .eq('staff_type', 'outstaff')
              .gte('guided_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
              .limit(10)
            
            console.log('outstaffの生ログデータ:', outstaffLogs, 'エラー:', logsError)
          }
        } else if (user?.id) {
          // 個人outstaffスタッフの場合
          const { data: staffData, error } = await supabase
            .from('staffs')
            .select('display_name')
            .eq('user_id', user.id)
            .single()
          
          if (!error && staffData) {
            setCurrentStaff(staffData)
            
            const personalRecommendationsResult = await getPersonalMonthlyIntroductionsByRecommendation(staffData.display_name)
            if (personalRecommendationsResult.success) {
              setPersonalMonthlyRecommendations(personalRecommendationsResult.data)
            }
          }
        }
      }
    }
    fetchInitialData()
  }, [user?.id, effectiveRole])

  // 月が変更されたときにデータを取得
  useEffect(() => {
    // effectiveRoleが定義されるまで待機
    if (!effectiveRole) return
    
    fetchMonthlyData(currentDate.getFullYear(), currentDate.getMonth())
  }, [currentDate, effectiveRole])

  // 店舗カレンダーの月が変更されたときに店舗データを再取得
  useEffect(() => {
    if (selectedStore && effectiveRole) {
      fetchStoreMonthlyData(selectedStore.store_id, storeCurrentDate.getFullYear(), storeCurrentDate.getMonth())
    }
  }, [storeCurrentDate, selectedStore, effectiveRole])

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
      // 過去6ヶ月までは遡ることができる
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
      if (newDate <= sixMonthsAgo) {
        return
      }
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (direction === 'next') {
      // 来月には行けない（現在月まで）
      if (newDate.getFullYear() > now.getFullYear() || 
          (newDate.getFullYear() === now.getFullYear() && newDate.getMonth() >= now.getMonth())) {
        return
      }
      newDate.setMonth(newDate.getMonth() + 1)
    }
    
    setCurrentDate(newDate)
    setSelectedDate(null) // 選択日をリセット
    
    // 新しい月のデータを取得
    fetchMonthlyData(newDate.getFullYear(), newDate.getMonth())
  }

  // 日付選択
  const selectDate = (date) => {
    const dateStr = formatLocalDate(date)
    const records = monthlyData[dateStr] || []
    setSelectedRecords(records)
    setSelectedDate(date)
  }

  // 削除確認
  const handleDeleteRequest = (recordId, storeName) => {
    console.log('🗑️ 削除確認モーダル表示:', { recordId, storeName, userRole })
    const record = selectedRecords.find(r => r.id === recordId)
    const store = stores.find(s => s.store_id === record?.store_id)
    console.log('📋 削除対象記録:', { record, store })
    setDeleteModal({
      isOpen: true,
      recordId,
      storeName: storeName || store?.name || '不明な店舗',
      isStoreView: false
    })
  }

  // 削除実行
  const handleConfirmDelete = async () => {
    try {
      const result = await deleteVisitRecord(deleteModal.recordId)
      
      if (result.success) {
        // 選択中の記録リストから削除
        setSelectedRecords(prev => prev.filter(r => r.id !== deleteModal.recordId))
        
        // 月次データからも削除
        const selectedDateStr = formatLocalDate(selectedDate)
        setMonthlyData(prev => ({
          ...prev,
          [selectedDateStr]: prev[selectedDateStr]?.filter(r => r.id !== deleteModal.recordId) || []
        }))
        
        setDeleteModal({ isOpen: false, recordId: null, storeName: '', isStoreView: false })
        
        if (result.restoredRequests > 0) {
          alert(`✅ 案内記録を削除しました。店舗の残り回数を ${result.restoredRequests} 回復元しました。`)
        }
      } else {
        alert('❌ 削除に失敗しました: ' + result.error)
      }
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
    }
  }

  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false, recordId: null, storeName: '', isStoreView: false })
  }

  // 店舗別案内実績用の関数群
  
  // 特定店舗の月次データ取得（分離表示）
  const fetchStoreMonthlyData = async (storeId, year, month) => {
    try {
      // effectiveRoleが定義されるまで待機
      if (!effectiveRole) return
      
      setStoreLoading(true)
      const startDate = new Date(year, month, 1)
      const endDate = new Date(year, month + 1, 0)
      
      // 分離表示のためstaff_typeフィルタリングを適用
      const staffTypeFilter = effectiveRole === 'outstaff' ? 'outstaff' : 'staff'
      
      const records = await getVisitRecords(
        storeId, 
        startDate.toISOString(), 
        endDate.toISOString(),
        staffTypeFilter
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
      // 過去6ヶ月までは遡ることができる
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
      if (newDate <= sixMonthsAgo) {
        return
      }
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (direction === 'next') {
      // 来月には行けない（現在月まで）
      if (newDate.getFullYear() > now.getFullYear() || 
          (newDate.getFullYear() === now.getFullYear() && newDate.getMonth() >= now.getMonth())) {
        return
      }
      newDate.setMonth(newDate.getMonth() + 1)
    }
    
    setStoreCurrentDate(newDate)
    setStoreSelectedDate(null) // 選択日をリセット
    
    // 新しい月の店舗データを取得
    if (selectedStore && effectiveRole) {
      fetchStoreMonthlyData(selectedStore.store_id, newDate.getFullYear(), newDate.getMonth())
    }
  }

  // 店舗選択
  const selectStore = (store) => {
    setSelectedStore(store)
    setStoreSelectedDate(null)
    setStoreCurrentDate(new Date()) // 現在月にリセット
    
    // effectiveRoleが定義されている場合のみデータ取得
    if (effectiveRole) {
      fetchStoreMonthlyData(store.store_id, new Date().getFullYear(), new Date().getMonth())
    }
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
    if (effectiveRole === 'customer') {
      const userStoreId = getUserStoreId()
      return stores.filter(store => store.store_id === userStoreId)
    }
    // staff、outstaff、adminの場合は取得済みの店舗（既にフィルタリング済み）を表示
    return stores.sort((a, b) => a.name.localeCompare(b.name, 'ja'))
  }

  // 店舗カレンダーの削除確認
  const handleStoreDeleteRequest = (record, storeName) => {
    console.log('🗑️ 店舗カレンダー削除確認モーダル表示:', { record, userRole })
    const store = stores.find(s => s.store_id === record?.store_id)
    console.log('📋 店舗カレンダー削除対象記録:', { record, store })
    setDeleteModal({
      isOpen: true,
      recordId: record.id,
      storeName: storeName || store?.name || '不明な店舗',
      isStoreView: true
    })
  }

  // 店舗カレンダーの削除実行
  const handleStoreConfirmDelete = async () => {
    console.log('🗑️ 店舗カレンダー削除実行開始:', { recordId: deleteModal.recordId, userRole })
    try {
      const result = await deleteVisitRecord(deleteModal.recordId)
      console.log('🗑️ 店舗カレンダー削除結果:', result)
      
      if (result.success) {
        console.log('✅ 店舗カレンダー削除成功 - ローカル状態更新中...')
        // 選択中の記録リストから削除
        setStoreSelectedRecords(prev => prev.filter(r => r.id !== deleteModal.recordId))
        
        // 月次データからも削除
        const selectedDateStr = formatLocalDate(storeSelectedDate)
        setStoreMonthlyData(prev => ({
          ...prev,
          [selectedDateStr]: prev[selectedDateStr]?.filter(r => r.id !== deleteModal.recordId) || []
        }))
        
        setDeleteModal({ isOpen: false, recordId: null, storeName: '', isStoreView: false })
        
        if (result.restoredRequests > 0) {
          alert(`✅ 案内記録を削除しました。店舗の残り回数を ${result.restoredRequests} 回復元しました。`)
        } else {
          alert('✅ 案内記録を削除しました')
        }
      } else {
        console.error('❌ 店舗カレンダー削除失敗:', result.error)
        alert('❌ 削除に失敗しました: ' + result.error)
      }
    } catch (error) {
      console.error('❌ 店舗カレンダー削除例外:', error)
      alert('❌ 削除に失敗しました: ' + error.message)
    }
  }

  const calendar = generateCalendarData()
  const now = new Date()
  
  // 過去6ヶ月までは遡ることができる
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
  const canGoPrev = currentDate > sixMonthsAgo
  
  // 来月には行けない（現在月まで）
  const canGoNext = !(currentDate.getFullYear() > now.getFullYear() || 
                     (currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() >= now.getMonth()))

  // 現在選択中の月の案内数を計算
  const getCurrentMonthGuidanceCount = () => {
    return Object.values(monthlyData).flat().reduce((total, record) => total + (record.guest_count || 0), 0)
  }

  // staff向けの目標達成度を計算
  const [staffAchievementData, setStaffAchievementData] = useState(null)
  
  // staff向けの目標達成度を取得
  useEffect(() => {
    const calculateStaffAchievement = async () => {
      if (effectiveRole === 'staff') {
        const currentMonthCount = getCurrentMonthGuidanceCount()
        const achievementResult = await calculateTargetAchievementRate(currentMonthCount)
        setStaffAchievementData(achievementResult)
      }
    }
    
    if (!loading) {
      calculateStaffAchievement()
    }
  }, [monthlyData, effectiveRole, loading])

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
        {/* outstaffの場合のみ当月統計カードを表示 */}
        {effectiveRole === 'outstaff' && !selectedDate && !storeSelectedDate && !selectedStore && (
          <div className="grid grid-cols-3 gap-2 mb-6">
            {/* 当月の案内数 */}
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
              <div className="flex flex-col items-center">
                <div className="text-blue-600 text-2xl mb-2">🏪</div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600 mb-1">当月の案内数</p>
                  <p className="text-2xl font-bold text-gray-900">{personalMonthlyRecommendations.total}</p>
                </div>
              </div>
            </div>
            
            {/* 当月のチェックマークあり案内数 */}
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
              <div className="flex flex-col items-center">
                <div className="text-green-600 text-2xl mb-2">✅</div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600 mb-1">当月のチェックマークあり</p>
                  <p className="text-2xl font-bold text-gray-900">{personalMonthlyRecommendations.recommended}</p>
                </div>
              </div>
            </div>

            {/* 当月のチェックマークなし案内数 */}
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
              <div className="flex flex-col items-center">
                <div className="text-red-600 text-2xl mb-2">❌</div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600 mb-1">当月のチェックマークなし</p>
                  <p className="text-2xl font-bold text-gray-900">{personalMonthlyRecommendations.notRecommended}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* staffの場合のみ目標達成度カードを表示 */}
        {effectiveRole === 'staff' && !selectedDate && !storeSelectedDate && !selectedStore && staffAchievementData && (
          <div className="grid grid-cols-2 gap-2 mb-6">
            {/* 目標達成度 */}
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
              <div className="flex flex-col items-center">
                <div className="text-green-600 text-2xl mb-2">🎯</div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600 mb-1">月間目標達成度</p>
                  <p className="text-2xl font-bold text-gray-900">{staffAchievementData.monthlyRate}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    ({getCurrentMonthGuidanceCount()}/100本)
                  </p>
                </div>
              </div>
            </div>

            {/* 目標本数まで */}
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
              <div className="flex flex-col items-center">
                <div className="text-orange-600 text-2xl mb-2">📈</div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600 mb-1">目標本数まで</p>
                  <p className="text-2xl font-bold text-gray-900">{staffAchievementData.remainingToMonthly}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    残り本数
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
                    disabled={storeCurrentDate <= new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1)}
                    className={`p-2 rounded-lg transition-colors ${
                      storeCurrentDate > new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1)
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
                <div className="grid grid-cols-1 gap-4 mb-6">
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
          onConfirm={deleteModal.isStoreView ? handleStoreConfirmDelete : handleConfirmDelete}
          onCancel={handleCancelDelete}
          itemName={deleteModal.storeName}
        />
      </div>
    </Layout>
  )
}

export default PastPerformancePage 