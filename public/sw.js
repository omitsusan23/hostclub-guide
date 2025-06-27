// Service Worker for Push Notifications
const CACHE_NAME = 'hostclub-guide-v1'
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
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

// プッシュ通知受信時
self.addEventListener('push', event => {
  console.log('📨 Push notification received:', event)
  
  const options = {
    body: 'スタッフチャットに新しいメッセージがあります',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      url: '/staff' // 通知タップ時の遷移先
    },
    actions: [
      {
        action: 'explore',
        title: 'チャットを確認',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: '閉じる'
      }
    ]
  }

  if (event.data) {
    try {
      const payload = event.data.json()
      options.title = payload.title || 'ホストクラブ案内所'
      options.body = payload.body || options.body
      options.data.url = payload.url || options.data.url
      
      if (payload.unreadCount) {
        options.body = `新しいメッセージがあります (${payload.unreadCount}件)`
        options.badge = `/badge-${Math.min(payload.unreadCount, 9)}.png` // 数字バッジ
      }
    } catch (e) {
      console.log('📋 Using default notification options')
    }
  }

  event.waitUntil(
    self.registration.showNotification('ホストクラブ案内所', options)
  )
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

// メッセージ受信（メインアプリからの通信）
self.addEventListener('message', event => {
  console.log('💬 Message received in SW:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  } else if (event.data && event.data.type === 'RESTART_HEARTBEAT') {
    console.log('🔄 Heartbeat 再開始要求')
    startHeartbeat()
  }
})

// フェッチイベント（オフライン対応）
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュにあればそれを返す
        if (response) {
          return response
        }
        return fetch(event.request)
      })
  )
}) 