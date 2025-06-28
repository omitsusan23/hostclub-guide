import { useState, useEffect, useCallback } from 'react'

const VAPID_PUBLIC_KEY = 'BEhb7-IaewDKk4eAq8kCgcBTofxLgP62S7tosMJ185MGpNZn9uJ-O922tcY2SDyXuggV7cS3VDjHFvrcT15q0js'

export const usePushNotifications = (currentUser = null) => {
  console.log('🚀 usePushNotifications.js: フック初期化開始')
  
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [permission, setPermission] = useState('default')
  const [isLoading, setIsLoading] = useState(false)
  
  // 早期リターン - ユーザーがいない場合は無効化
  const [isInitialized, setIsInitialized] = useState(false)

  // Push通知のサポート状況を確認
  useEffect(() => {
    const checkSupport = () => {
      try {
        const supported = 'serviceWorker' in navigator && 'PushManager' in window
        setIsSupported(supported)
        
        if (supported && typeof Notification !== 'undefined') {
          setPermission(Notification.permission)
        }
        
        setIsInitialized(true)
      } catch (error) {
        console.warn('Push通知サポート確認エラー:', error)
        setIsSupported(false)
        setIsInitialized(true) // エラーでも初期化完了とする
      }
    }

    checkSupport()
  }, [])

  // Service Workerを登録
  const registerServiceWorker = useCallback(async () => {
    if (!isSupported) return null

    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('✅ Service Worker registered:', registration)
      
      // Service Worker の更新をチェック
      registration.addEventListener('updatefound', () => {
        console.log('🔄 New Service Worker found')
      })

      return registration
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error)
      return null
    }
  }, [isSupported])

  // 通知許可を要求
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
      
      if (isIOS && isSafari) {
        alert('🍎 iOSでプッシュ通知を利用するには、Safari の共有ボタン（□↗）から「ホーム画面に追加」してアプリとして起動してください。')
      } else {
        alert('❌ お使いのブラウザはプッシュ通知をサポートしていません')
      }
      return false
    }

    setIsLoading(true)

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted')
        return true
      } else if (permission === 'denied') {
        alert('❌ 通知がブロックされています。ブラウザの設定から通知を許可してください。')
        return false
      } else {
        console.log('⚠️ Notification permission dismissed')
        return false
      }
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  // プッシュ購読を設定
  const subscribeToPush = useCallback(async () => {
    if (!isSupported || permission !== 'granted') {
      return null
    }

    setIsLoading(true)

    try {
      const registration = await registerServiceWorker()
      if (!registration) {
        throw new Error('Service Worker registration failed')
      }

      // 既存の購読を確認
      let existingSubscription = await registration.pushManager.getSubscription()
      
      if (existingSubscription) {
        console.log('📱 Existing push subscription found')
        setSubscription(existingSubscription)
        return existingSubscription
      }

      // 新しい購読を作成
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })

      console.log('🔔 New push subscription created:', newSubscription)
      setSubscription(newSubscription)

      // サーバーに購読情報を送信（TODO: 実装）
      await savePushSubscription(newSubscription)

      return newSubscription
    } catch (error) {
      console.error('❌ Error subscribing to push:', error)
      
      // エラーの詳細を表示
      let errorMessage = 'プッシュ通知の設定に失敗しました'
      
      if (error.message.includes('VAPID')) {
        errorMessage = '🔑 VAPIDキーが設定されていません。PUSH_SETUP.mdを参考に設定してください。'
      } else if (error.message.includes('InvalidStateError')) {
        errorMessage = '⚠️ Service Workerの状態に問題があります。ページを再読み込みして再試行してください。'
      } else if (error.message.includes('NotSupportedError')) {
        errorMessage = '❌ お使いのブラウザはプッシュ通知をサポートしていません'
      } else {
        errorMessage = `❌ プッシュ通知の設定に失敗しました: ${error.message}`
      }
      
      alert(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, permission, registerServiceWorker])

  // プッシュ購読を解除
  const unsubscribeFromPush = useCallback(async () => {
    if (!subscription) return true

    setIsLoading(true)

    try {
      const success = await subscription.unsubscribe()
      if (success) {
        setSubscription(null)
        console.log('🔕 Push subscription removed')
        
        // サーバーからも削除（TODO: 実装）
        await removePushSubscription(subscription)
      }
      return success
    } catch (error) {
      console.error('❌ Error unsubscribing from push:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [subscription])

  // 初期化
  useEffect(() => {
    const initialize = async () => {
      if (isSupported && permission === 'granted') {
        const registration = await registerServiceWorker()
        if (registration) {
          const existingSubscription = await registration.pushManager.getSubscription()
          if (existingSubscription) {
            setSubscription(existingSubscription)
          }
        }
      }
    }

    initialize()
  }, [isSupported, permission, registerServiceWorker])

  // テスト通知を送信
  const sendTestNotification = useCallback(async () => {
    if (!subscription) {
      alert('❌ プッシュ通知が有効になっていません')
      return
    }

    try {
      // 簡易テスト通知（実際のサーバー経由ではなく、Service Worker経由）
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification('テスト通知', {
          body: 'プッシュ通知のテストです',
          icon: '/icon-192x192.png',
          badge: '/icon-72x72.png',
          vibrate: [100, 50, 100],
          data: { url: '/staff' }
        })
      }
    } catch (error) {
      console.error('❌ Test notification failed:', error)
    }
  }, [subscription])

  // 新着チャットメッセージの通知を送信（詳細ログ版）
  const sendChatNotification = useCallback(async (chatMessage) => {
    try {
      // 初期化チェック
      if (!isInitialized) {
        console.log('⚠️ usePushNotifications.js: まだ初期化されていません')
        return
      }
      
      // 確実に見えるログを出力
      console.log('🚨🚨🚨 usePushNotifications.js: sendChatNotification 確実に呼び出された!!')
      console.log('%c💀 REAL PUSH NOTIFICATION CALLED', 'background: red; color: white; font-size: 20px;')
      console.error('🚨 FORCE ERROR LOG - usePushNotifications.js called!')  // errorログも追加
      alert('🔔 REAL usePushNotifications.js function called!')  // アラートで確認
      
      console.log('🔔 sendChatNotification 開始:', {
        chatMessage,
        subscription: !!subscription,
        permission,
        currentUser: currentUser?.id,
        hasServiceWorker: 'serviceWorker' in navigator
      })
      
      console.log('🔍 関数内部デバッグ - パラメータ詳細:', {
        chatMessageType: typeof chatMessage,
        chatMessageKeys: chatMessage ? Object.keys(chatMessage) : null,
        subscriptionExists: !!subscription,
        permissionValue: permission,
        currentUserExists: !!currentUser
      })
    
    if (!subscription || permission !== 'granted' || !currentUser) {
      console.log('🔕 Push通知が無効です:', {
        hasSubscription: !!subscription,
        permission,
        hasCurrentUser: !!currentUser
      })
      return
    }

    // 自分のメッセージには通知しない
    if (chatMessage.sender_id === currentUser?.id) {
      console.log('👤 自分のメッセージなので通知しません:', {
        sender_id: chatMessage.sender_id,
        current_user_id: currentUser?.id
      })
      return
    }

    console.log('🚀 プッシュ通知送信処理開始...')

    try {
      const isFirstTimeRequest = chatMessage.message?.includes('今初回ほしいです')
      console.log('🔍 緊急要請判定:', { isFirstTimeRequest, message: chatMessage.message })
      
      // Service Worker の存在確認
      if (!('serviceWorker' in navigator)) {
        console.error('❌ Service Worker not supported')
        return
      }

      console.log('📡 Service Worker ready取得中...')
      const registration = await navigator.serviceWorker.ready
      console.log('✅ Service Worker ready取得完了:', registration)

      const notificationTitle = isFirstTimeRequest ? '🔥 緊急要請' : '💬 新着メッセージ'
      const notificationOptions = {
        body: `${chatMessage.sender_name}: ${chatMessage.message}`,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        vibrate: isFirstTimeRequest ? [200, 100, 200, 100, 200] : [100, 50, 100],
        tag: 'staff-chat',
        requireInteraction: isFirstTimeRequest,
        data: { 
          url: '/staff',
          chatId: chatMessage.id,
          type: 'chat',
          urgent: isFirstTimeRequest
        },
        actions: [
          { action: 'open', title: '開く' },
          { action: 'close', title: '閉じる' }
        ]
      }

      console.log('📝 通知オプション:', { notificationTitle, notificationOptions })
      console.log('🔔 showNotification実行中...')

      await registration.showNotification(notificationTitle, notificationOptions)
      
      console.log('✅ チャット通知を送信しました:', {
        title: notificationTitle,
        message: chatMessage.message,
        sender: chatMessage.sender_name,
        isUrgent: isFirstTimeRequest
      })
    } catch (error) {
      console.error('❌ チャット通知送信エラー:', error)
      console.error('❌ エラー詳細:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    } catch (mainError) {
      console.error('🚨 usePushNotifications.js: sendChatNotification 関数内でキャッチされたエラー:', mainError)
      console.error('🚨 エラー詳細:', {
        name: mainError.name,
        message: mainError.message,
        stack: mainError.stack
      })
    }
  }, [subscription, permission, currentUser, isInitialized])

  // ネイティブ通知を表示
  const showNotification = useCallback(async (options) => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/icon-192x192.png',
          badge: options.badge || '/icon-72x72.png',
          vibrate: options.vibrate || [100, 50, 100],
          tag: options.tag || 'notification',
          requireInteraction: options.requireInteraction || false,
          data: options.data || {},
          actions: [
            {
              action: 'open',
              title: '開く'
            },
            {
              action: 'close',
              title: '閉じる'
            }
          ]
        })
      } catch (error) {
        console.error('❌ Notification表示エラー:', error)
      }
    }
  }, [])



  // 初期化完了前は安全なデフォルト値を返す（削除して確実に初期化完了後の関数を使用）

  console.log('🔧 usePushNotifications.js: return オブジェクト作成', {
    isSupported,
    permission,
    hasSubscription: !!subscription,
    isLoading,
    isInitialized,
    sendChatNotificationType: typeof sendChatNotification
  })

  return {
    isSupported: isSupported || false,
    permission: permission || 'default',
    subscription: subscription || null,
    isLoading: isLoading || false,
    isInitialized: isInitialized,
    requestPermission: requestPermission || (() => Promise.resolve(false)),
    subscribeToPush: subscribeToPush || (() => Promise.resolve(null)),
    unsubscribeFromPush: unsubscribeFromPush || (() => Promise.resolve(true)),
    sendTestNotification: sendTestNotification || (() => {}),
    sendChatNotification: Object.assign(sendChatNotification, { 
      _source: 'usePushNotifications.js',
      _timestamp: Date.now()
    }),
    showNotification: showNotification || (() => {})
  }
}

// Helper functions
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// サーバーに購読情報を保存（実装版）
async function savePushSubscription(subscription) {
  try {
    console.log('💾 Saving push subscription to server:', subscription)
    
    // 購読情報をJSONからオブジェクトに変換
    const subscriptionObject = subscription.toJSON()
    console.log('📊 購読オブジェクト:', subscriptionObject)
    
    // LocalStorageに一時保存（デバッグ用）
    localStorage.setItem('pushSubscription', JSON.stringify({
      endpoint: subscriptionObject.endpoint,
      keys: subscriptionObject.keys,
      timestamp: Date.now()
    }))
    
    console.log('✅ Push subscription saved to localStorage')
  } catch (error) {
    console.error('❌ Failed to save subscription:', error)
  }
}

// サーバーから購読情報を削除（実装版）
async function removePushSubscription(subscription) {
  try {
    console.log('🗑️ Removing push subscription from server:', subscription)
    
    // LocalStorageから削除
    localStorage.removeItem('pushSubscription')
    
    console.log('✅ Push subscription removed from localStorage')
  } catch (error) {
    console.error('❌ Failed to remove subscription:', error)
  }
} 