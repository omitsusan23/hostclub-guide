import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import StoreDetailModal from '../components/StoreDetailModal'
import StoreEditModal from '../components/StoreEditModal'
import StaffEditModal from '../components/StaffEditModal'
import { useApp } from '../contexts/AppContext'
import { addNewStore, getAllStores, generateStoreId, checkStoreIdExists, updateStore } from '../utils/storeManagement.js'
import { addNewStaff, getAllStaffs, generateStaffId, checkStaffIdExists, updateStaff, deleteStaff } from '../utils/staffManagement.js'
import { getMonthlyIntroductionCounts } from '../lib/database.js'

const AdminDashboard = () => {
  const { user, getUserRole, getUserStoreId } = useApp()
  const [showStoreModal, setShowStoreModal] = useState(false)
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [stores, setStores] = useState([])
  const [staffs, setStaffs] = useState([])
  const [loadingStores, setLoadingStores] = useState(true)
  const [loadingStaffs, setLoadingStaffs] = useState(true)
  const [monthlyStats, setMonthlyStats] = useState({ 
    totalVisits: 0, 
    staffVisits: 0, 
    outstaffVisits: 0 
  })
  const [loadingStats, setLoadingStats] = useState(true)
  const [newStore, setNewStore] = useState({
    name: '',
    store_id: '',
    open_time: '',
    close_time: '',
    base_price: 0,
    id_required: '',
    male_price: 0,
    panel_fee: 0,
    guarantee_count: 0,
    penalty_fee: 0,
    charge_per_person: 0,
    is_transfer: false,
    hoshos_url: '',
    store_phone: ''
  })
  const [newStaff, setNewStaff] = useState({
    staff_id: '',
    display_name: '',
    password: 'ryota123',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success', 'error', 'warning'
  const [selectedStore, setSelectedStore] = useState(null)
  const [showStoreDetailModal, setShowStoreDetailModal] = useState(false)
  const [showStoreEditModal, setShowStoreEditModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [showStaffEditModal, setShowStaffEditModal] = useState(false)

  // 店舗データを取得
  useEffect(() => {
    loadStores()
    loadStaffs()
    loadMonthlyStats()
  }, [])

  const loadStores = async () => {
    setLoadingStores(true)
    try {
      const result = await getAllStores()
      if (result.success) {
        setStores(result.data)
      } else {
        console.error('Failed to load stores:', result.error)
        setMessage('店舗データの読み込みに失敗しました')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error loading stores:', error)
      setMessage('店舗データの読み込み中にエラーが発生しました')
      setMessageType('error')
    } finally {
      setLoadingStores(false)
    }
  }

  const loadStaffs = async () => {
    setLoadingStaffs(true)
    try {
      const result = await getAllStaffs()
      if (result.success) {
        setStaffs(result.data)
      } else {
        console.error('Failed to load staffs:', result.error)
        setMessage('スタッフデータの読み込みに失敗しました')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error loading staffs:', error)
      setMessage('スタッフデータの読み込み中にエラーが発生しました')
      setMessageType('error')
    } finally {
      setLoadingStaffs(false)
    }
  }

  const loadMonthlyStats = async () => {
    setLoadingStats(true)
    try {
      // staff、outstaff、合算の3つのデータを並行取得
      const [staffResult, outstaffResult, totalResult] = await Promise.all([
        getMonthlyIntroductionCounts('staff'),
        getMonthlyIntroductionCounts('outstaff'),
        getMonthlyIntroductionCounts('both')
      ])

      let staffVisits = 0, outstaffVisits = 0, totalVisits = 0

      if (staffResult.success) {
        staffVisits = Object.values(staffResult.data).reduce((sum, count) => sum + count, 0)
      }

      if (outstaffResult.success) {
        outstaffVisits = Object.values(outstaffResult.data).reduce((sum, count) => sum + count, 0)
      }

      if (totalResult.success) {
        totalVisits = Object.values(totalResult.data).reduce((sum, count) => sum + count, 0)
      }

      setMonthlyStats({ 
        totalVisits,
        staffVisits,
        outstaffVisits
      })
    } catch (error) {
      console.error('Error loading monthly stats:', error)
      setMonthlyStats({ 
        totalVisits: 0,
        staffVisits: 0,
        outstaffVisits: 0
      })
    } finally {
      setLoadingStats(false)
    }
  }

  // 統計計算
  const activeStores = stores.length
  const totalVisits = monthlyStats.totalVisits
  const totalRevenue = 0 // TODO: 請求データベースと連携
  
  // 各店舗の実績計算（現在は基本情報のみ）
  const storeStats = stores.map(store => ({
    ...store,
    visitCount: 0, // TODO: 案内記録と連携
    totalVisitors: 0, // TODO: 案内記録と連携
    monthlyRevenue: store.panel_fee || 0 // TODO: 実際の売上計算
  }))

  const handleAddStore = async () => {
    // 基本バリデーション
    if (!newStore.name || !newStore.store_id) {
      setMessage('店舗名と店舗IDは必須です')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')
    
    try {
      // 店舗IDの重複チェック
      const exists = await checkStoreIdExists(newStore.store_id)
      if (exists) {
        setMessage('この店舗IDは既に使用されています')
        setMessageType('error')
        return
      }

      // 新店舗追加実行
      const result = await addNewStore(newStore)
      
      if (result.success) {
        setMessage(result.message || `✅ ${newStore.name} を追加しました！`)
        setMessageType('success')
        
        // 警告がある場合は表示
        if (result.warning) {
          setTimeout(() => {
            setMessage(result.warning)
            setMessageType('warning')
          }, 2000)
        }
        
        // フォームリセット
        setNewStore({
          name: '',
          store_id: '',
          open_time: '',
          close_time: '',
          base_price: 0,
          id_required: '',
          male_price: 0,
          panel_fee: 0,
          guarantee_count: 0,
          penalty_fee: 0,
          charge_per_person: 0,
          is_transfer: false,
          hoshos_url: '',
          store_phone: ''
        })
        
        // 店舗リストを更新
        loadStores()
        
        // モーダルを閉じる（成功の場合のみ）
        setTimeout(() => {
          setShowStoreModal(false)
          setMessage('')
          setMessageType('')
        }, 3000)
        
      } else {
        setMessage(`❌ エラー: ${result.error}`)
        setMessageType('error')
      }
      
    } catch (error) {
      console.error('Store addition error:', error)
      setMessage('❌ 店舗追加中に予期しないエラーが発生しました')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  // 店舗名から店舗IDを自動生成
  const handleNameChange = (name) => {
    setNewStore({
      ...newStore, 
      name,
      store_id: newStore.store_id || generateStoreId(name)
    })
  }

  // スタッフ追加処理
  const handleAddStaff = async () => {
    // 基本バリデーション
    if (!newStaff.staff_id || !newStaff.display_name) {
      setMessage('スタッフIDと表示名は必須です')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')
    
    try {
      // スタッフIDの重複チェック
      const exists = await checkStaffIdExists(newStaff.staff_id)
      if (exists) {
        setMessage('このスタッフIDは既に使用されています')
        setMessageType('error')
        return
      }

      // 新スタッフ追加実行
      const result = await addNewStaff(newStaff)
      
      if (result.success) {
        setMessage(result.message || `✅ ${newStaff.display_name} を追加しました！`)
        setMessageType('success')
        
        // 警告がある場合は表示
        if (result.warning) {
          setTimeout(() => {
            setMessage(result.warning)
            setMessageType('warning')
          }, 2000)
        }
        
        // フォームリセット
        setNewStaff({
          staff_id: '',
          display_name: '',
          password: 'ryota123',
          notes: ''
        })
        
        // スタッフリストを更新
        loadStaffs()
        
        // モーダルを閉じる（成功の場合のみ）
        setTimeout(() => {
          setShowStaffModal(false)
          setMessage('')
          setMessageType('')
        }, 3000)
        
      } else {
        setMessage(`❌ エラー: ${result.error}`)
        setMessageType('error')
      }
      
    } catch (error) {
      console.error('Staff addition error:', error)
      setMessage('❌ スタッフ追加中に予期しないエラーが発生しました')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  // 表示名からスタッフIDを自動生成
  const handleDisplayNameChange = (displayName) => {
    setNewStaff({
      ...newStaff, 
      display_name: displayName,
      staff_id: newStaff.staff_id || generateStaffId(displayName)
    })
  }

  // 店舗詳細モーダルを開く
  const handleStoreClick = (store) => {
    setSelectedStore(store)
    setShowStoreDetailModal(true)
  }

  // 店舗詳細モーダルを閉じる
  const handleCloseStoreDetail = () => {
    setSelectedStore(null)
    setShowStoreDetailModal(false)
  }

  // 店舗編集モーダルを開く
  const handleEditStore = (store) => {
    setSelectedStore(store)
    setShowStoreDetailModal(false) // 詳細モーダルを閉じる
    setShowStoreEditModal(true)
  }

  // 店舗編集モーダルを閉じる
  const handleCloseStoreEdit = () => {
    setSelectedStore(null)
    setShowStoreEditModal(false)
  }

  // 店舗更新処理
  const handleUpdateStore = async (formData) => {
    console.log('🚀 handleUpdateStore called with formData:', formData);
    console.log('📍 selectedStore:', selectedStore);
    
    if (!selectedStore) {
      console.error('❌ No selectedStore');
      return;
    }

    setLoading(true)
    setMessage('')

    try {
      console.log('📞 Calling updateStore...');
      const result = await updateStore(selectedStore.id, formData)
      console.log('📝 updateStore result:', result);
      
      if (result.success) {
        console.log('✅ Update successful');
        setMessage(result.message || `✅ ${formData.name} を更新しました！`)
        setMessageType('success')
        
        // 店舗リストを再読み込み
        console.log('🔄 Reloading stores...');
        loadStores()
        
        // モーダルを閉じる
        setTimeout(() => {
          console.log('🚪 Closing modal...');
          setShowStoreEditModal(false)
          setSelectedStore(null)
          setMessage('')
          setMessageType('')
        }, 2000)
        
      } else {
        console.error('❌ Update failed:', result.error);
        setMessage(`❌ エラー: ${result.error}`)
        setMessageType('error')
      }
      
    } catch (error) {
      console.error('❌ handleUpdateStore error:', error)
      setMessage('❌ 店舗更新中に予期しないエラーが発生しました')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  // スタッフ編集モーダルを開く
  const handleEditStaff = (staff) => {
    setSelectedStaff(staff)
    setShowStaffEditModal(true)
  }

  // スタッフ編集モーダルを閉じる
  const handleCloseStaffEdit = () => {
    setSelectedStaff(null)
    setShowStaffEditModal(false)
  }

  // スタッフ更新処理
  const handleUpdateStaff = async (formData) => {
    console.log('🚀 handleUpdateStaff called with formData:', formData);
    console.log('📍 selectedStaff:', selectedStaff);
    
    if (!selectedStaff) {
      console.error('❌ No selectedStaff');
      return;
    }

    setLoading(true)
    setMessage('')

    try {
      console.log('📞 Calling updateStaff...');
      const result = await updateStaff(selectedStaff.id, formData)
      console.log('📝 updateStaff result:', result);
      
      if (result.success) {
        console.log('✅ Update successful');
        setMessage(result.message || `✅ ${formData.display_name} を更新しました！`)
        setMessageType('success')
        
        // スタッフリストを再読み込み
        console.log('🔄 Reloading staffs...');
        loadStaffs()
        
        // モーダルを閉じる
        setTimeout(() => {
          console.log('🚪 Closing modal...');
          setShowStaffEditModal(false)
          setSelectedStaff(null)
          setMessage('')
          setMessageType('')
        }, 2000)
        
      } else {
        console.error('❌ Update failed:', result.error);
        setMessage(`❌ エラー: ${result.error}`)
        setMessageType('error')
      }
      
    } catch (error) {
      console.error('❌ handleUpdateStaff error:', error)
      setMessage('❌ スタッフ更新中に予期しないエラーが発生しました')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  // スタッフ削除処理
  const handleDeleteStaff = async (staffId) => {
    console.log('🗑️ handleDeleteStaff called with staffId:', staffId);
    
    if (!staffId) {
      console.error('❌ No staffId');
      return;
    }

    setLoading(true)
    setMessage('')

    try {
      console.log('📞 Calling deleteStaff...');
      const result = await deleteStaff(staffId)
      console.log('📝 deleteStaff result:', result);
      
      if (result.success) {
        console.log('✅ Delete successful');
        setMessage(result.message || `✅ スタッフを削除しました`)
        setMessageType('success')
        
        // スタッフリストを再読み込み
        console.log('🔄 Reloading staffs...');
        loadStaffs()
        
        // モーダルを閉じる
        setTimeout(() => {
          console.log('🚪 Closing modal...');
          setShowStaffEditModal(false)
          setSelectedStaff(null)
          setMessage('')
          setMessageType('')
        }, 2000)
        
      } else {
        console.error('❌ Delete failed:', result.error);
        setMessage(`❌ エラー: ${result.error}`)
        setMessageType('error')
      }
      
    } catch (error) {
      console.error('❌ handleDeleteStaff error:', error)
      setMessage('❌ スタッフ削除中に予期しないエラーが発生しました')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      {/* ヘッダー */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          管理者ダッシュボード
        </h2>
        <p className="text-gray-600">
          案内所運営責任者として、全店舗の管理と新規契約を行うことができます。
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {/* 登録店舗数 */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">登録店舗数</p>
              <p className="text-xl font-bold text-gray-900">
                {loadingStores ? '...' : activeStores}
              </p>
            </div>
          </div>
        </div>

        {/* 今月の案内件数（合算） */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-green-100 text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">今月の案内件数（合算）</p>
              <p className="text-xl font-bold text-gray-900">
                {loadingStats ? '...' : monthlyStats.totalVisits}
              </p>
            </div>
          </div>
        </div>

        {/* staff案内件数 */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-indigo-100 text-indigo-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">staff案内件数</p>
              <p className="text-xl font-bold text-gray-900">
                {loadingStats ? '...' : monthlyStats.staffVisits}
              </p>
            </div>
          </div>
        </div>

        {/* outstaff案内件数 */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-pink-100 text-pink-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">outstaff案内件数</p>
              <p className="text-xl font-bold text-gray-900">
                {loadingStats ? '...' : monthlyStats.outstaffVisits}
              </p>
            </div>
          </div>
        </div>

        {/* 今月の売上 */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">今月の売上</p>
              <p className="text-xl font-bold text-gray-900">¥{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* 登録スタッフ数 */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-purple-100 text-purple-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">登録スタッフ数</p>
              <p className="text-xl font-bold text-gray-900">{staffs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* クイックアクション */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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

          {/* staff案内実績 */}
          <a
            href="/staff-performance"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-all group"
          >
            <div className="flex items-center mb-2">
              <div className="text-2xl mr-3">📊</div>
              <h4 className="font-medium text-gray-900 group-hover:text-indigo-600">
                staff案内実績
              </h4>
            </div>
            <p className="text-sm text-gray-600">
              staffの案内実績レポートを確認
            </p>
          </a>

          {/* outstaff案内実績 */}
          <a
            href="/staff-performance"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-pink-300 transition-all group"
          >
            <div className="flex items-center mb-2">
              <div className="text-2xl mr-3">🌸</div>
              <h4 className="font-medium text-gray-900 group-hover:text-pink-600">
                outstaff案内実績
              </h4>
            </div>
            <p className="text-sm text-gray-600">
              outstaffの案内実績レポートを確認
            </p>
          </a>

          {/* 店舗管理 */}
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

          {/* スタッフ管理 */}
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

          {/* outstaff店舗設定 */}
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
        </div>
      </div>

      {/* 管理者向けサマリー情報 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          📈 システム概要
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* システム統計 */}
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">月額パネル料合計</span>
              <span className="font-bold text-green-600">
                ¥{storeStats.reduce((sum, store) => sum + (store.panel_fee || 0), 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">アクティブスタッフ数</span>
              <span className="font-bold text-blue-600">
                {staffs.filter(staff => staff.is_active).length}名
              </span>
            </div>
          </div>
          
          {/* 管理機能へのリンク */}
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">管理機能</h4>
              <div className="space-y-2">
                <a
                  href="/store-management"
                  className="block text-sm text-blue-600 hover:text-blue-800"
                >
                  🏢 店舗管理ページで詳細管理
                </a>
                <a
                  href="/staff-management"
                  className="block text-sm text-blue-600 hover:text-blue-800"
                >
                  👥 スタッフ管理ページで詳細管理
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* メッセージ表示 */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg ${
          messageType === 'success' ? 'bg-green-100 border border-green-200 text-green-800' :
          messageType === 'warning' ? 'bg-yellow-100 border border-yellow-200 text-yellow-800' :
          'bg-red-100 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            <div className="flex-1">{message}</div>
            <button
              onClick={() => setMessage('')}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 新規店舗追加モーダル */}
      <Modal
        isOpen={showStoreModal}
        onClose={() => setShowStoreModal(false)}
        title="新規店舗追加"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                店舗名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newStore.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: クラブプレミアム"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                店舗ID <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={newStore.store_id}
                  onChange={(e) => setNewStore({...newStore, store_id: e.target.value})}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="premium"
                />
                <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500 text-sm">
                  .susukino-hostclub-guide.online
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Open
              </label>
              <input
                type="time"
                value={newStore.open_time}
                onChange={(e) => setNewStore({...newStore, open_time: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                初回Close
              </label>
              <input
                type="time"
                value={newStore.close_time}
                onChange={(e) => setNewStore({...newStore, close_time: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                初回料金
              </label>
              <input
                type="number"
                value={newStore.base_price}
                onChange={(e) => setNewStore({...newStore, base_price: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                男性料金
              </label>
              <input
                type="number"
                value={newStore.male_price}
                onChange={(e) => setNewStore({...newStore, male_price: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ホスホスURL
              </label>
              <input
                type="url"
                value={newStore.hoshos_url}
                onChange={(e) => setNewStore({...newStore, hoshos_url: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://hoshos.jp/shop/..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                店舗番号
              </label>
              <input
                type="tel"
                value={newStore.store_phone}
                onChange={(e) => setNewStore({...newStore, store_phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="011-555-1234"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                パネル料
              </label>
              <input
                type="number"
                value={newStore.panel_fee}
                onChange={(e) => setNewStore({...newStore, panel_fee: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="120000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                一人単価
              </label>
              <input
                type="number"
                value={newStore.charge_per_person}
                onChange={(e) => setNewStore({...newStore, charge_per_person: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                保証本数
              </label>
              <input
                type="number"
                value={newStore.guarantee_count}
                onChange={(e) => setNewStore({...newStore, guarantee_count: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="25"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                保証割れ料金
              </label>
              <input
                type="number"
                value={newStore.penalty_fee}
                onChange={(e) => setNewStore({...newStore, penalty_fee: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="20000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                振込/現金
              </label>
              <select
                value={newStore.is_transfer}
                onChange={(e) => setNewStore({...newStore, is_transfer: e.target.value === 'true'})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={false}>現金</option>
                <option value={true}>振込</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                身分証要件
              </label>
              <select
                value={newStore.id_required}
                onChange={(e) => setNewStore({...newStore, id_required: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="顔＝保険証＋キャッシュ">顔＝保険証＋キャッシュ</option>
                <option value="顔＝保険証＋クレジット">顔＝保険証＋クレジット</option>
                <option value="顔必須">顔必須</option>
              </select>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              onClick={() => setShowStoreModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleAddStore}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '追加中...' : '店舗を追加'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 新規スタッフ追加モーダル */}
      <Modal
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
        title="新規スタッフ追加"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                表示名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newStaff.display_name}
                onChange={(e) => handleDisplayNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="例: 田中 太郎"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                スタッフID <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={newStaff.staff_id}
                  onChange={(e) => setNewStaff({...newStaff, staff_id: e.target.value})}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="tanaka"
                />
                <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500 text-sm">
                  @hostclub.local
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              type="text"
              value={newStaff.password}
              onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="ryota123"
            />
            <p className="text-xs text-gray-500 mt-1">
              スタッフがログインに使用するパスワードです
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              備考（任意）
            </label>
            <textarea
              value={newStaff.notes}
              onChange={(e) => setNewStaff({...newStaff, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="役職、担当エリア、その他メモなど"
              rows={3}
            />
          </div>
          
          {/* プレビュー */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">作成される情報</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>📧 メール: {newStaff.staff_id ? `${newStaff.staff_id}@hostclub.local` : '（スタッフIDを入力してください）'}</div>
              <div>👤 表示名: {newStaff.display_name || '（表示名を入力してください）'}</div>
              <div>🔑 パスワード: {newStaff.password}</div>
              <div>🌐 アクセスURL: https://staff.susukino-hostclub-guide.online</div>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              onClick={() => setShowStaffModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleAddStaff}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? '追加中...' : 'スタッフを追加'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 店舗詳細モーダル */}
      <StoreDetailModal
        isOpen={showStoreDetailModal}
        store={selectedStore}
        onClose={handleCloseStoreDetail}
        onEdit={handleEditStore}
      />

      {/* 店舗編集モーダル */}
      <StoreEditModal
        isOpen={showStoreEditModal}
        store={selectedStore}
        onSave={handleUpdateStore}
        onClose={handleCloseStoreEdit}
        loading={loading}
      />

      {/* スタッフ編集モーダル */}
      <StaffEditModal
        isOpen={showStaffEditModal}
        staff={selectedStaff}
        onSave={handleUpdateStaff}
        onDelete={handleDeleteStaff}
        onClose={handleCloseStaffEdit}
        loading={loading}
      />
    </Layout>
  )
}

export default AdminDashboard 