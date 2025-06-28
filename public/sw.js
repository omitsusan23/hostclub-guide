// Service Worker for Push Notifications
const CACHE_NAME = 'hostclub-guide-v' + Date.now() // 開発中は毎回新しいキャッシュ
const urlsToCache = [
  '/',
  '/manifest.json'
]

// Heartbeat用の変数
let heartbeatInterval = null

// Service Worker インストール時
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Cache opened')
        return cache.addAll(urlsToCache)
      })
  )
})

// Service Worker アクティベート時
self.addEventListener('activate', event => {
  console.log('✅ Service Worker activated')
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  
  // Heartbeat開始
  startHeartbeat()
})

// Heartbeat機能 - バックグラウンドでの接続保持
function startHeartbeat() {
  console.log('💓 Heartbeat 開始')
  
  // 既存のintervalがあれば停止
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
  }
  
  // 30秒間隔でpingを送信
  heartbeatInterval = setInterval(() => {
    console.log('💓 Heartbeat ping')
    
    // すべてのクライアントにheartbeat通知
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'HEARTBEAT',
          timestamp: Date.now()
        })
      })
    }).catch(error => {
      console.error('💓 Heartbeat エラー:', error)
    })
  }, 30000) // 30秒間隔
}

// メッセージ受信（アプリからの通信・通知要請）
self.addEventListener('message', event => {
  console.log('💬 Message received in SW:', event.data)
  
  // 通知送信要請の処理
  if (event.data && event.data.type === 'SEND_NOTIFICATION') {
    console.log('🔔 Service Worker: 通知送信要請受信:', event.data.payload)
    
    const { title, body, icon, badge, vibrate, tag, data, actions } = event.data.payload
    
    const notificationOptions = {
      body: body,
      icon: icon || '/icon-192x192.png',
      badge: badge || '/icon-72x72.png',
      vibrate: vibrate || [100, 50, 100],
      tag: tag,
      data: data || {},
      actions: actions || [
        { action: 'open', title: '開く' },
        { action: 'close', title: '閉じる' }
      ],
      requireInteraction: false,
      silent: false,
      renotify: true,
      timestamp: Date.now()
    }
    
    console.log('📱 Service Worker: 通知表示実行:', { title, options: notificationOptions })
    
    self.registration.showNotification(title, notificationOptions)
      .then(() => {
        console.log('✅ Service Worker: 通知表示成功')
      })
      .catch((error) => {
        console.error('❌ Service Worker: 通知表示エラー:', error)
      })
    
    return
  }
  
  // 既存機能の処理
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  } else if (event.data && event.data.type === 'RESTART_HEARTBEAT') {
    console.log('🔄 Heartbeat 再開始要求')
    startHeartbeat()
  }
})

// 通知クリック時
self.addEventListener('notificationclick', event => {
  console.log('👆 Notification clicked:', event)
  
  const data = event.notification.data || {}
  const action = event.action
  
  event.notification.close()

  // アクションボタンの処理
  if (action === 'close') {
    return
  }

  // メインの通知または「チャットを確認」ボタンをクリック
  const urlToOpen = data.url || '/staff'
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // 既に開いているタブがあるかチェック
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          // 既存のタブにフォーカス
          client.focus()
          
          // チャット通知の場合は該当メッセージにスクロール
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            url: urlToOpen,
            chatId: data.chatId,
            urgent: data.urgent
          })
          return
        }
      }
      
      // 新しいタブで開く
      const fullUrl = data.chatId ? `${urlToOpen}?chatId=${data.chatId}` : urlToOpen
      return clients.openWindow(fullUrl)
    })
  )
})



// フェッチイベント（開発環境向け - ネットワーク優先）
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      // ネットワークエラー時のみキャッシュを使用
      return caches.match(event.request)
    })
  )
}) 