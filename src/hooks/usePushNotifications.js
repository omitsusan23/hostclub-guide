import { useState, useEffect, useCallback } from 'react'

const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY' // TODO: 実際のVAPIDキーに置き換え

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [permission, setPermission] = useState('default')
  const [isLoading, setIsLoading] = useState(false)

  // Push通知のサポート状況を確認
  useEffect(() => {
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window
      setIsSupported(supported)
      
      if (supported) {
        setPermission(Notification.permission)
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
      alert('❌ プッシュ通知の設定に失敗しました')
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

  return {
    isSupported,
    permission,
    subscription,
    isLoading,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification
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

// サーバーに購読情報を保存（TODO: 実装）
async function savePushSubscription(subscription) {
  try {
    // Supabaseに購読情報を保存
    console.log('💾 Saving push subscription to server:', subscription)
    // TODO: Supabaseテーブルに保存する処理を実装
  } catch (error) {
    console.error('❌ Failed to save subscription:', error)
  }
}

// サーバーから購読情報を削除（TODO: 実装）
async function removePushSubscription(subscription) {
  try {
    // Supabaseから購読情報を削除
    console.log('🗑️ Removing push subscription from server:', subscription)
    // TODO: Supabaseテーブルから削除する処理を実装
  } catch (error) {
    console.error('❌ Failed to remove subscription:', error)
  }
} 