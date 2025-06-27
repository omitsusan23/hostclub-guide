import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import VisitForm from '../components/VisitForm'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import StoreRequestCountdown from '../components/StoreRequestCountdown'
import SwipeableVisitItem from '../components/SwipeableVisitItem'
import PushNotificationSettings from '../components/PushNotificationSettings'
import { useApp } from '../contexts/AppContext'
import { useStaffChatNotifications } from '../hooks/useStaffChatNotifications'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { 
  getStores,
  getTodayVisitRecords,
  getMonthlyVisitRecords,
  addVisitRecord,
  addVisitRecordWithRequestCheck,
  deleteVisitRecord,
  getMonthlyTarget,
  getStaffChats,
  sendStaffChat,
  editStaffChat,
  deleteStaffChat,
  subscribeToStaffChats,
  unsubscribeFromStaffChats,
  cleanupAllChatChannels
} from '../lib/database'
import { supabase } from '../lib/supabase'

const StaffDashboard = () => {
  const { user, hasAdminPermissions, getUserRole } = useApp()
  const location = useLocation()
  const [showVisitForm, setShowVisitForm] = useState(false)
  const [selectedStore, setSelectedStore] = useState(null)
  const [stores, setStores] = useState([])
  const [visitRecords, setVisitRecords] = useState([])
  const [monthlyRecords, setMonthlyRecords] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [chatLoading, setChatLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, record: null, storeName: '' })
  const [currentStaff, setCurrentStaff] = useState(null)
  const [monthlyTarget, setMonthlyTarget] = useState(0)
  const [chatSubscription, setChatSubscription] = useState(null)
  
  // 通知機能 - 詳細デバッグ版
  const { markAsRead, incrementUnreadCount } = useStaffChatNotifications(user?.id)
  
  console.log('🔍 Staff usePushNotifications 呼び出し前:', { 
    user: user?.id, 
    userObject: user 
  })
  
  const pushNotifications = usePushNotifications(user || null)
  
  console.log('🔍 Staff usePushNotifications 戻り値:', {
    pushNotifications,
    type: typeof pushNotifications,
    keys: pushNotifications ? Object.keys(pushNotifications) : null,
    sendChatNotification: pushNotifications?.sendChatNotification,
    sendChatNotificationType: typeof pushNotifications?.sendChatNotification
  })
  
  const sendChatNotification = pushNotifications?.sendChatNotification || (() => {
    console.log('🚫🚫🚫 STAFF DEFAULT FUNCTION CALLED - プッシュ通知が無効化されています')
    console.log('%c🔥 DEFAULT FUNCTION', 'background: orange; color: white; font-size: 16px;')
  })

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

  // チャットデータを読み込む関数（外部から呼び出し可能）
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
    console.log('🔄 Staff チャット購読再接続開始')
    
    // 1. 既存の購読を解除
    if (chatSubscription) {
      console.log('🔌 Staff 既存購読を解除')
      unsubscribeFromStaffChats(chatSubscription)
    }
    
    // 2. 全チャットチャンネルをクリーンアップ（重複防止）
    console.log('🧹 Staff 全チャンネルクリーンアップ実行')
    cleanupAllChatChannels()
    
    // 3. chatSubscriptionをクリア
    setChatSubscription(null)
    
    // 4. 少し遅延してから再接続
    setTimeout(() => {
      console.log('🔄 Staff 新規チャット購読開始')
      
      // 新しい購読を開始
      setupChatSubscription()
      
      // データも再読み込み
      loadChatMessages()
      
      console.log('✅ Staff チャット購読再接続完了')
    }, 200) // 遅延時間を少し長くして確実性向上
  }

  // setupChatSubscription関数を定義
  const setupChatSubscription = () => {
    console.log('🔥 Staff setupChatSubscription 開始')
    console.log('🔍 Staff ユーザー情報:', { userId: user?.id, userEmail: user?.email })
    
    // 初期化時に既存チャンネルをクリーンアップ
    console.log('🧹 Staff 初期チャンネルクリーンアップ')
    cleanupAllChatChannels()
    
    const subscription = subscribeToStaffChats((payload) => {
      console.log('📨 Staff チャット更新 RAW:', payload)
      console.log('🔍 Staff 現在のユーザー:', user?.id)
      console.log('🔍 Staff 現在のパス:', location.pathname)
      
      // Supabaseのリアルタイム構造に合わせて修正
      const eventType = payload.eventType || payload.event_type
      console.log('🔍 Staff イベントタイプ:', eventType)
      
      if (eventType === 'INSERT') {
        // 新しいメッセージが追加された場合（最上部に追加）
        console.log('➕ Staff 新しいメッセージ追加:', payload.new)
        console.log('🔍 Staff メッセージ送信者:', payload.new.sender_id)
        console.log('🔍 Staff 自分かどうか:', payload.new.sender_id === user?.id)
        
        // チャットメッセージリストを更新
        setChatMessages(prev => {
          console.log('📊 Staff 更新前チャット数:', prev.length)
          const newList = [payload.new, ...prev]
          console.log('📊 Staff 更新後チャット数:', newList.length)
          return newList
        })
        
        // 自分以外のメッセージの場合は未読数を増加（他ページにいる場合）
        if (payload.new.sender_id !== user?.id && location.pathname !== '/staff') {
          console.log('🔔 Staff 未読数増加実行')
          incrementUnreadCount()
        }
        
        // プッシュ通知を送信（自分以外のメッセージの場合）
        if (payload.new.sender_id !== user?.id) {
          console.log('🔔 Staff プッシュ通知送信条件クリア:', {
            senderID: payload.new.sender_id,
            currentUserID: user?.id,
            message: payload.new.message,
            senderName: payload.new.sender_name
          })
          
          try {
            console.log('📞 Staff sendChatNotification 呼び出し前')
            console.log('🔍 Staff sendChatNotification の値:', {
              type: typeof sendChatNotification,
              isFunction: typeof sendChatNotification === 'function',
              value: sendChatNotification,
              pushNotifications: pushNotifications,
              pushNotificationsType: typeof pushNotifications
            })
            
            if (typeof sendChatNotification === 'function') {
              console.log('✅ Staff sendChatNotification は関数です - 実行中...')
              console.log('🚨 CALLING FUNCTION WITH PAYLOAD:', payload.new)
              
              // 関数に識別子を追加してテスト
              if (sendChatNotification.toString().includes('usePushNotifications')) {
                console.log('✅ 正しいusePushNotifications関数を呼び出し中')
              } else {
                console.log('⚠️ デフォルト関数を呼び出し中')
                console.log('📝 関数のソース:', sendChatNotification.toString())
              }
              
              sendChatNotification(payload.new)
              console.log('📞 Staff sendChatNotification 呼び出し後')
            } else {
              console.error('❌ Staff sendChatNotification が関数ではありません!', {
                type: typeof sendChatNotification,
                value: sendChatNotification
              })
            }
          } catch (error) {
            console.error('❌ Staff sendChatNotification 呼び出しエラー:', error)
          }
        } else {
          console.log('👤 Staff 自分のメッセージなので通知スキップ:', {
            senderID: payload.new.sender_id,
            currentUserID: user?.id
          })
        }
      } else if (eventType === 'UPDATE') {
        // メッセージが編集された場合
        console.log('✏️ Staff メッセージ編集:', payload.new)
        setChatMessages(prev => 
          prev.map(msg => 
            msg.id === payload.new.id ? payload.new : msg
          )
        )
      } else if (eventType === 'DELETE') {
        // メッセージが削除された場合
        console.log('🗑️ Staff メッセージ削除:', payload.old)
        setChatMessages(prev => 
          prev.filter(msg => msg.id !== payload.old.id)
        )
      }
    })
    
    console.log('📡 Staff 購読オブジェクト:', subscription)
    setChatSubscription(subscription)
    console.log('✅ Staff setupChatSubscription 完了')
  }

  // データ取得
  useEffect(() => {
    console.log('🔄 Staff データ取得 useEffect実行:', {
      userId: user?.id,
      pathname: location.pathname,
      currentSubscription: !!chatSubscription
    })
    
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // staff専用のデータ取得
        const userRole = getUserRole()
        const staffTypeFilter = 'staff'
        
        // 店舗データ取得（全店舗アクセス可能）
        const storesData = await getStores(userRole)
        setStores(storesData)

        // 今日の案内記録取得（staff分離表示）
        const recordsData = await getTodayVisitRecords(null, staffTypeFilter)
        setVisitRecords(recordsData)

        // 今月の案内記録取得（staff分離表示）
        const monthlyData = await getMonthlyVisitRecords(null, null, null, staffTypeFilter)
        setMonthlyRecords(monthlyData)

        // 現在のスタッフ情報取得
        if (user?.id) {
          console.log('🔍 ユーザー情報:', { userId: user.id, userEmail: user.email })
          
          const { data: staffData, error } = await supabase
            .from('staffs')
            .select('display_name, staff_id, email, user_id, is_active')
            .eq('user_id', user.id)
            .single()
          
          console.log('📊 スタッフクエリ結果:', { staffData, error })
          console.log('🔍 クエリパラメータ確認:', { userId: user.id })
          
          if (!error && staffData) {
            console.log('✅ スタッフ情報設定:', staffData)
            setCurrentStaff(staffData)
          } else {
            console.log('❌ スタッフ情報取得失敗:', error)
            console.log('🔍 エラー詳細:', {
              errorCode: error?.code,
              errorMessage: error?.message,
              errorDetails: error?.details,
              hint: error?.hint
            })
          }
        } else {
          console.log('❌ ユーザー情報なし')
        }

        // staff用の月間目標を取得
        const target = await getMonthlyTarget()
        setMonthlyTarget(target)

        // スタッフチャットデータを取得
        await loadChatMessages()
        
        // ダッシュボードアクセス時にチャット通知をクリア
        markAsRead()
        
      } catch (error) {
        console.error('データ取得エラー:', error)
      } finally {
        setLoading(false)
      }
    }



    fetchData()
    setupChatSubscription()

    // クリーンアップ
    return () => {
      console.log('🧹 Staff データ取得 useEffect クリーンアップ実行')
      if (chatSubscription) {
        console.log('🔌 Staff チャット購読解除:', chatSubscription)
        unsubscribeFromStaffChats(chatSubscription)
      }
    }
  }, [user?.id, location.pathname]) // location.pathnameを依存配列に追加

  // Page Visibility API でバックグラウンド復帰時の再接続
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log('🔍 Staff ページ可視性変更:', {
        hidden: document.hidden,
        visibilityState: document.visibilityState,
        pathname: location.pathname
      })
      
      if (!document.hidden && document.visibilityState === 'visible') {
        console.log('👁️ Staff ページがアクティブになりました - 再接続実行')
        
        // 少し遅延させて確実に再接続
        setTimeout(() => {
          reconnectChatSubscription()
        }, 500)
      }
    }

    const handleFocus = () => {
      console.log('🔍 Staff ウィンドウフォーカス取得:', { pathname: location.pathname })
      
      // フォーカス取得時も再接続
      setTimeout(() => {
        reconnectChatSubscription()
      }, 300)
    }

    // ページ遷移復帰検知（hashchangeやpopstateを監視）
    const handlePageReturn = () => {
      console.log('🔄 Staff ページ遷移復帰検知:', { pathname: location.pathname })
      
      // Staff ページに戻った場合のみ実行
      if (location.pathname === '/staff') {
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
    if (location.pathname === '/staff') {
      setTimeout(() => {
        console.log('🔄 Staff ページ初期ロード確認')
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
    console.log('🔄 Staff ページ遷移検知:', { pathname: location.pathname })
    
    // Staff ページに来た場合の初期化
    if (location.pathname === '/staff') {
      // 少し遅延させてからチャット状態確認
      const timer = setTimeout(() => {
        console.log('🔍 Staff チャット購読状態確認:', { 
          hasSubscription: !!chatSubscription,
          pathname: location.pathname 
        })
        
        // 購読がない場合は再接続
        if (!chatSubscription) {
          console.log('🔄 Staff チャット購読なし - 再接続実行')
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
        console.log('💓 Staff Heartbeat受信:', event.data.timestamp)
        
        // Heartbeat受信時にチャット購読が生きているかチェック
        if (!chatSubscription) {
          console.log('⚠️ Staff チャット購読が切断されています - 再接続')
          reconnectChatSubscription()
        } else {
          // 購読が生きている場合はpingを送信して接続維持
          console.log('📡 Staff リアルタイム接続 ping送信')
          try {
            // Supabaseリアルタイム接続にpingを送信
            if (chatSubscription && chatSubscription.send) {
              chatSubscription.send({ type: 'ping' })
            }
          } catch (error) {
            console.error('📡 Staff ping送信エラー:', error)
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

  // 本日の案内数を計算
  const todayCount = visitRecords.reduce((total, record) => total + record.guest_count, 0)
  
  // 今月の案内数を計算
  const monthlyCount = monthlyRecords.reduce((total, record) => total + record.guest_count, 0)

  // 目標本数までの計算
  const getTargetRemaining = () => {
    const remaining = monthlyTarget - monthlyCount
    return remaining > 0 ? remaining : monthlyCount - monthlyTarget // 目標達成時は超過分を返す
  }

  // 目標達成状況
  const isTargetAchieved = () => {
    return monthlyCount >= monthlyTarget
  }

  const handleVisitSubmit = async (visitData) => {
    try {
      const userRole = getUserRole()
      
      // Supabaseに案内記録を保存（staff_type='staff'で固定） + リクエスト消化チェック
      const savedRecord = await addVisitRecordWithRequestCheck({
        store_id: visitData.storeId,
        guest_count: visitData.guestCount,
        staff_name: currentStaff?.display_name || user?.user_metadata?.display_name || 'スタッフ',
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

  const handleSendMessage = async () => {
    console.log('🔍 送信チェック開始:', { 
      message: newMessage.trim(), 
      userId: user?.id, 
      currentStaff: currentStaff,
      userRole: getUserRole()
    })

    if (!newMessage.trim() || !user?.id || !currentStaff) {
      console.log('❌ 送信条件未満:', { 
        messageOK: !!newMessage.trim(),
        message: newMessage,
        userIdOK: !!user?.id,
        userId: user?.id,
        currentStaffOK: !!currentStaff,
        currentStaffData: currentStaff,
        currentStaffDisplayName: currentStaff?.display_name
      })
      
      // 特に問題のある部分を詳細に確認
      if (!currentStaff) {
        console.log('🚨 currentStaffが設定されていません！スタッフ情報を再取得してください。')
        alert('⚠️ スタッフ情報の読み込みに問題があります。ページを再読み込みしてください。')
      }
      return
    }

    try {
      console.log('🚀 チャット送信開始...')
      
      const messageData = {
        message: newMessage.trim(),
        sender_id: user.id,
        sender_name: currentStaff.display_name,
        sender_role: getUserRole(),
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
              <div className="flex items-center mb-2">
                <span className="text-yellow-600 text-2xl">🎯</span>
                                    <span className="text-sm text-gray-600 ml-1">({monthlyTarget})</span>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600 mb-1">目標本数まで</p>
                <p className={`text-2xl font-bold ${
                  isTargetAchieved() ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {isTargetAchieved() ? `+${getTargetRemaining()}` : getTargetRemaining()}
                </p>
              </div>
            </div>
          </div>
        </div>

                {/* クイックアクション */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${hasAdminPermissions() ? 'lg:grid-cols-4' : ''}`}>
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
              本日・今月の案内実績を確認
            </p>
          </a>

          {/* 管理者限定：店舗管理 */}
          {hasAdminPermissions() && (
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
          )}

          {/* 管理者限定：スタッフ管理 */}
          {hasAdminPermissions() && (
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
          )}

          {/* 管理者限定：outstaff店舗設定 */}
          {hasAdminPermissions() && (
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
          )}

 
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="space-y-6">
          {/* Push通知設定 */}
          <PushNotificationSettings />
          
          {/* スタッフチャット */}
          <div className="bg-white rounded-lg shadow-md p-6 h-[576px] flex flex-col">
                      <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              💬 スタッフチャット
            </h3>
            <button
              onClick={async () => {
                console.log('🔄 チャット手動リロード')
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
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
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
                      isMyMessage ? 'bg-blue-100 ml-6' : 
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
                          {new Date(chat.created_at || chat.sent_at).toLocaleTimeString('ja-JP', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Tokyo'
                          })}
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                送信
              </button>
            </div>
          </div>

          {/* 店舗一覧 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🏢 契約店舗一覧
            </h3>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stores.map((store) => (
                <div key={store.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">{store.name}</div>
                  <div className="text-sm text-gray-600">ID: {store.store_id}</div>
                </div>
              ))}
            </div>
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-lg z-50">
        <button
          onClick={() => setShowVisitForm(true)}
          className="w-full max-w-sm mx-auto block px-6 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-md"
        >
          📝 案内報告
        </button>
      </div>
    </Layout>
  )
}

export default StaffDashboard 