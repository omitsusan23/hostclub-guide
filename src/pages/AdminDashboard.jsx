import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import StoreDetailModal from '../components/StoreDetailModal'
import StoreEditModal from '../components/StoreEditModal'
import StaffEditModal from '../components/StaffEditModal'
import TargetSettingsModal from '../components/TargetSettingsModal'
import StoreRequestCountdown from '../components/StoreRequestCountdown'
import PushNotificationSettings from '../components/PushNotificationSettings'
import { useApp } from '../contexts/AppContext'
import { useStaffChatNotifications } from '../hooks/useStaffChatNotifications'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { addNewStore, getAllStores, generateStoreId, checkStoreIdExists, updateStore } from '../utils/storeManagement.js'
import { addNewStaff, getAllStaffs, generateStaffId, checkStaffIdExists, updateStaff, deleteStaff } from '../utils/staffManagement.js'
import { 
  getMonthlyIntroductionCounts,
  getStaffChats,
  sendStaffChat,
  subscribeToStaffChats,
  unsubscribeFromStaffChats,
  cleanupAllChatChannels
} from '../lib/database.js'

const AdminDashboard = () => {
  const { user, getUserRole, getUserStoreId } = useApp()
  const location = useLocation()
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
  
  // 通知機能 - 一時的に完全無効化
  const { markAsRead, incrementUnreadCount } = useStaffChatNotifications(user?.id)
  const pushNotifications = usePushNotifications(user || null)
  const sendChatNotification = pushNotifications?.sendChatNotification || (() => {})
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
  const [showTargetSettingsModal, setShowTargetSettingsModal] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [chatLoading, setChatLoading] = useState(true)
  const [chatSubscription, setChatSubscription] = useState(null)

  // 店舗データを取得
  useEffect(() => {
    console.log('🔄 Admin データ取得 useEffect実行:', {
      userId: user?.id,
      pathname: location.pathname,
      currentSubscription: !!chatSubscription
    })
    
    loadStores()
    loadStaffs()
    loadMonthlyStats()
    loadChatMessages()
    setupChatSubscription()
    
    // ダッシュボードアクセス時にチャット通知をクリア
    markAsRead()

    // クリーンアップ
    return () => {
      console.log('🧹 Admin データ取得 useEffect クリーンアップ実行')
      if (chatSubscription) {
        console.log('🔌 Admin チャット購読解除:', chatSubscription)
        unsubscribeFromStaffChats(chatSubscription)
      }
    }
  }, [user?.id, location.pathname]) // location.pathnameを依存配列に追加

  // Page Visibility API でバックグラウンド復帰時の再接続
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log('🔍 Admin ページ可視性変更:', {
        hidden: document.hidden,
        visibilityState: document.visibilityState,
        pathname: location.pathname
      })
      
      if (!document.hidden && document.visibilityState === 'visible') {
        console.log('👁️ Admin ページがアクティブになりました - 再接続実行')
        
        // 少し遅延させて確実に再接続
        setTimeout(() => {
          reconnectChatSubscription()
        }, 500)
      }
    }

    const handleFocus = () => {
      console.log('🔍 Admin ウィンドウフォーカス取得:', { pathname: location.pathname })
      
      // フォーカス取得時も再接続
      setTimeout(() => {
        reconnectChatSubscription()
      }, 300)
    }

    // ページ遷移復帰検知（hashchangeやpopstateを監視）
    const handlePageReturn = () => {
      console.log('🔄 Admin ページ遷移復帰検知:', { pathname: location.pathname })
      
      // Admin ページに戻った場合のみ実行
      if (location.pathname === '/admin') {
        setTimeout(() => {
          reconnectChatSubscription()
        }, 200)
      }
    }

    // イベントリスナー追加
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('popstate', handlePageReturn)
    
    // ページロード時も確認
    if (location.pathname === '/admin') {
      setTimeout(() => {
        console.log('🔄 Admin ページ初期ロード確認')
        if (!chatSubscription) {
          reconnectChatSubscription()
        }
      }, 1000)
    }

    // クリーンアップ
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('popstate', handlePageReturn)
    }
  }, [location.pathname]) // chatSubscriptionを除外してlocation.pathnameのみに

  // React Router Navigation監視でページ遷移を検知
  useEffect(() => {
    console.log('🔄 Admin ページ遷移検知:', { pathname: location.pathname })
    
    // Admin ページに来た場合の初期化
    if (location.pathname === '/admin') {
      // 少し遅延させてからチャット状態確認
      const timer = setTimeout(() => {
        console.log('🔍 Admin チャット購読状態確認:', { 
          hasSubscription: !!chatSubscription,
          pathname: location.pathname 
        })
        
        // 購読がない場合は再接続
        if (!chatSubscription) {
          console.log('🔄 Admin チャット購読なし - 再接続実行')
          reconnectChatSubscription()
        }
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [location.pathname])

  // Service Worker Heartbeat受信
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'HEARTBEAT') {
        console.log('💓 Admin Heartbeat受信:', event.data.timestamp)
        
        // Heartbeat受信時にチャット購読が生きているかチェック
        if (!chatSubscription) {
          console.log('⚠️ Admin チャット購読が切断されています - 再接続')
          reconnectChatSubscription()
        } else {
          // 購読が生きている場合はpingを送信して接続維持
          console.log('📡 Admin リアルタイム接続 ping送信')
          try {
            // Supabaseリアルタイム接続にpingを送信
            if (chatSubscription && chatSubscription.send) {
              chatSubscription.send({ type: 'ping' })
            }
          } catch (error) {
            console.error('📡 Admin ping送信エラー:', error)
            // ping送信に失敗した場合は再接続
            reconnectChatSubscription()
          }
        }
      }
    }

    navigator.serviceWorker?.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
    }
  }, []) // chatSubscriptionの依存を削除

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

  // 購読を再接続する関数（改善版）
  const reconnectChatSubscription = () => {
    console.log('🔄 Admin チャット購読再接続開始')
    
    // 1. 既存の購読を解除
    if (chatSubscription) {
      console.log('🔌 Admin 既存購読を解除')
      unsubscribeFromStaffChats(chatSubscription)
    }
    
    // 2. 全チャットチャンネルをクリーンアップ（重複防止）
    console.log('🧹 Admin 全チャンネルクリーンアップ実行')
    cleanupAllChatChannels()
    
    // 3. chatSubscriptionをクリア
    setChatSubscription(null)
    
    // 4. 少し遅延してから再接続
    setTimeout(() => {
      console.log('🔄 Admin 新規チャット購読開始')
      
      // 新しい購読を開始
      setupChatSubscription()
      
      // データも再読み込み
      loadChatMessages()
      
      console.log('✅ Admin チャット購読再接続完了')
    }, 200) // 遅延時間を少し長くして確実性向上
  }

  // リアルタイムチャット購読を設定
  const setupChatSubscription = () => {
    console.log('🔥 Admin setupChatSubscription 開始')
    console.log('🔍 Admin ユーザー情報:', { userId: user?.id, userEmail: user?.email })
    
    // 初期化時に既存チャンネルをクリーンアップ
    console.log('🧹 Admin 初期チャンネルクリーンアップ')
    cleanupAllChatChannels()
    
    const subscription = subscribeToStaffChats((payload) => {
      console.log('📨 Admin チャット更新 RAW:', payload)
      console.log('🔍 Admin 現在のユーザー:', user?.id)
      console.log('🔍 Admin 現在のパス:', location.pathname)
      
      // Supabaseのリアルタイム構造に合わせて修正
      const eventType = payload.eventType || payload.event_type
      console.log('🔍 Admin イベントタイプ:', eventType)
      
      if (eventType === 'INSERT') {
        console.log('➕ Admin 新しいメッセージ追加:', payload.new)
        console.log('🔍 Admin メッセージ送信者:', payload.new.sender_id)
        console.log('🔍 Admin 自分かどうか:', payload.new.sender_id === user?.id)
        
        // チャットメッセージリストを更新
        setChatMessages(prev => {
          console.log('📊 Admin 更新前チャット数:', prev.length)
          const newList = [payload.new, ...prev]
          console.log('📊 Admin 更新後チャット数:', newList.length)
          return newList
        })
        
        // 自分以外のメッセージの場合は未読数を増加（他ページにいる場合）
        if (payload.new.sender_id !== user?.id && location.pathname !== '/admin') {
          console.log('🔔 Admin 未読数増加実行')
          incrementUnreadCount()
        }
        
        // プッシュ通知を送信（自分以外のメッセージで、かつ「今初回ほしい」が含まれる場合のみ）
        const isFirstTimeRequest = payload.new.message?.includes('今初回ほしいです')
        if (payload.new.sender_id !== user?.id && isFirstTimeRequest) {
          console.log('🔥 Admin 緊急要請通知送信条件クリア:', {
            senderID: payload.new.sender_id,
            currentUserID: user?.id,
            message: payload.new.message,
            senderName: payload.new.sender_name,
            isFirstTimeRequest: true
          })
          
          try {
            console.log('📞 Admin sendChatNotification 呼び出し前')
            sendChatNotification(payload.new)
            console.log('📞 Admin sendChatNotification 呼び出し後')
          } catch (error) {
            console.error('❌ Admin sendChatNotification 呼び出しエラー:', error)
          }
        } else {
          console.log('👤 Admin 自分のメッセージなので通知スキップ:', {
            senderID: payload.new.sender_id,
            currentUserID: user?.id
          })
        }
      } else if (eventType === 'UPDATE') {
        console.log('✏️ Admin メッセージ編集:', payload.new)
        setChatMessages(prev => 
          prev.map(msg => 
            msg.id === payload.new.id ? payload.new : msg
          )
        )
      } else if (eventType === 'DELETE') {
        console.log('🗑️ Admin メッセージ削除:', payload.old)
        setChatMessages(prev => 
          prev.filter(msg => msg.id !== payload.old.id)
        )
      }
    })
    
    console.log('📡 Admin 購読オブジェクト:', subscription)
    setChatSubscription(subscription)
    console.log('✅ Admin setupChatSubscription 完了')
  }

  // チャットメッセージ送信
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.id) {
      console.log('❌ 送信条件未満:', { message: newMessage.trim(), userId: user?.id })
      return
    }

    try {
      console.log('🚀 チャット送信開始...')
      
      const messageData = {
        message: newMessage.trim(),
        sender_id: user.id,
        sender_name: 'Admin', // 管理者は固定で「Admin」として表示
        sender_role: 'admin',
        message_type: 'text'
      }

      console.log('📊 送信データ:', messageData)
      
      const result = await sendStaffChat(messageData)
      console.log('📝 送信結果:', result)
      
      if (result.success) {
        setNewMessage('')
        console.log('✅ チャット送信成功')
        
        // リアルタイム購読で自動的に追加されるので、ローカル追加は不要
        // 重複を防ぐため、ローカル追加を削除
      } else {
        console.error('❌ チャット送信エラー:', result.error)
        alert('❌ 送信に失敗しました: ' + result.error)
      }
      
    } catch (error) {
      console.error('❌ チャット送信例外:', error)
      alert('❌ 送信に失敗しました: ' + error.message)
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
            href="/staff-performance?type=outstaff"
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

          {/* staff目標設定 */}
          <button
            onClick={() => setShowTargetSettingsModal(true)}
            className="block w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all group"
          >
            <div className="flex items-center mb-2">
              <div className="text-2xl mr-3">🎯</div>
              <h4 className="font-medium text-gray-900 group-hover:text-blue-600">
                staff目標設定
              </h4>
            </div>
            <p className="text-sm text-gray-600">
              staffの月間目標数を設定・管理
            </p>
          </button>
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
                <a
                  href="/staff-performance"
                  className="block text-sm text-blue-600 hover:text-blue-800"
                >
                  📊 outstaff案内実績
                </a>
                <button
                  onClick={() => setShowTargetSettingsModal(true)}
                  className="block text-sm text-blue-600 hover:text-blue-800 text-left"
                >
                  🎯 staff目標設定
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Push通知設定 */}
      <div className="mt-8">
        <PushNotificationSettings />
      </div>

      {/* スタッフチャット */}
              <div className="bg-white rounded-lg shadow-md p-6 mt-8 h-[576px] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            💬 スタッフチャット
          </h3>
          <button
            onClick={async () => {
              console.log('🔄 Admin チャット手動リロード')
              await loadChatMessages()
            }}
            className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 text-sm"
          >
            🔄 更新
          </button>
        </div>
        
        {/* チャットメッセージ */}
                  <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {chatLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
              <p className="text-gray-500 text-sm mt-2">チャットを読み込み中...</p>
            </div>
          ) : chatMessages.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              チャットメッセージはありません
            </p>
          ) : (
            chatMessages.map((chat) => {
              const isMyMessage = chat.sender_id === user?.id
              const isStoreStatusRequest = chat.sender_role === 'customer' && chat.message_type === 'status_request'
              const isFirstTimeRequest = chat.message?.includes('今初回ほしいです')
              
              return (
                <div key={chat.id} className={`p-2 rounded-md ${
                  isMyMessage ? 'bg-red-100 ml-6' : 
                  isFirstTimeRequest ? 'bg-red-50 border border-red-200 mr-6' :
                  isStoreStatusRequest ? 'bg-yellow-50 border border-yellow-200 mr-6' :
                  'bg-gray-50 mr-6'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium text-xs">{chat.sender_name}</span>
                      <span className={`px-1 py-0.5 text-xs rounded ${
                        chat.sender_role === 'admin' ? 'bg-red-200 text-red-800' :
                        chat.sender_role === 'outstaff' ? 'bg-pink-200 text-pink-800' :
                        chat.sender_role === 'customer' ? 'bg-green-200 text-green-800' :
                        'bg-blue-200 text-blue-800'
                      }`}>
                        {chat.sender_role === 'admin' ? '管理' :
                         chat.sender_role === 'outstaff' ? 'out' : 
                         chat.sender_role === 'customer' ? '店舗' : 'staff'}
                      </span>
                      {chat.is_edited && (
                        <span className="text-xs text-gray-400">(編集)</span>
                      )}
                      {isFirstTimeRequest && (
                        <span className="text-xs text-red-600 font-bold">🔥 緊急</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                                                {(() => {
                            const date = new Date(chat.created_at || chat.sent_at)
                            // 日本時間に変換（UTC + 9時間）
                            const jpTime = new Date(date.getTime() + (9 * 60 * 60 * 1000))
                            return jpTime.toLocaleTimeString('ja-JP', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          })()}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{chat.message}</p>
                  {isFirstTimeRequest && (
                    <StoreRequestCountdown chatMessageId={chat.id} />
                  )}
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
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            送信
          </button>
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

      {/* 目標設定モーダル */}
      <TargetSettingsModal
        isOpen={showTargetSettingsModal}
        onClose={() => setShowTargetSettingsModal(false)}
      />
    </Layout>
  )
}

export default AdminDashboard 