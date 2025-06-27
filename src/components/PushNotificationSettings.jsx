import React from 'react'
import { usePushNotifications } from '../hooks/usePushNotifications'

const PushNotificationSettings = ({ compact = false }) => {
  const {
    isSupported,
    permission,
    subscription,
    isLoading,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification
  } = usePushNotifications()

  // Push通知を有効にする
  const handleEnablePush = async () => {
    const permissionGranted = await requestPermission()
    if (permissionGranted) {
      await subscribeToPush()
    }
  }

  // Push通知を無効にする
  const handleDisablePush = async () => {
    const success = await unsubscribeFromPush()
    if (success) {
      alert('✅ プッシュ通知を無効にしました')
    } else {
      alert('❌ プッシュ通知の無効化に失敗しました')
    }
  }

  // デバイス/ブラウザ判定
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

  // サポートされていない場合
  if (!isSupported) {
    if (compact) return null
    
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-amber-600 text-xl">🍎</span>
          <div className="flex-1">
            <h4 className="font-medium text-amber-800 mb-2">プッシュ通知について</h4>
            {isIOS && isSafari ? (
              <div className="text-sm text-amber-700 space-y-2">
                <p><strong>iOSでプッシュ通知を利用するには：</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2 text-xs">
                  <li>Safari の <strong>共有ボタン（□↗）</strong> をタップ</li>
                  <li><strong>「ホーム画面に追加」</strong> を選択</li>
                  <li>追加された <strong>アプリアイコンから起動</strong></li>
                  <li>プッシュ通知設定が利用可能になります</li>
                </ol>
                <div className="mt-2 p-2 bg-amber-100 rounded text-xs">
                  ℹ️ iOS Safari ブラウザでは制限により、ホーム画面追加後のみプッシュ通知が利用できます（iOS 16.4以降）
                </div>
              </div>
            ) : (
              <p className="text-sm text-amber-700">
                お使いのブラウザはプッシュ通知をサポートしていません
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // コンパクト表示（ヘッダー用）
  if (compact) {
    if (permission === 'granted' && subscription) {
      return (
        <button
          onClick={sendTestNotification}
          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
          title="プッシュ通知テスト"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
        </button>
      )
    }

    if (permission === 'default') {
      return (
        <button
          onClick={handleEnablePush}
          disabled={isLoading}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          title="プッシュ通知を有効にする"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5 5-5v3.59c0-1.42-1.17-2.59-2.59-2.59H7.41C6.17 8 5 9.17 5 10.41v3.18C5 14.83 6.17 16 7.41 16H15z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4"/>
          </svg>
        </button>
      )
    }

    return null
  }

  // 通常表示（設定ページ用）
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-2xl">🔔</span>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">プッシュ通知</h3>
          <p className="text-sm text-gray-600">
            アプリを閉じていても新しいメッセージの通知を受け取れます
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* 現在の状態表示 */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${
              permission === 'granted' && subscription
                ? 'bg-green-500'
                : permission === 'denied'
                ? 'bg-red-500'
                : 'bg-yellow-500'
            }`}></span>
            <span className="text-sm font-medium">
              {permission === 'granted' && subscription
                ? '有効'
                : permission === 'denied'
                ? 'ブロック済み'
                : '無効'}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {permission === 'granted' && subscription
              ? 'プッシュ通知を受信します'
              : permission === 'denied'
              ? 'ブラウザ設定から許可してください'
              : 'プッシュ通知が無効です'}
          </span>
        </div>

        {/* アクションボタン */}
        <div className="flex space-x-3">
          {permission === 'granted' && subscription ? (
            <>
              <button
                onClick={sendTestNotification}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? '送信中...' : 'テスト通知'}
              </button>
              <button
                onClick={handleDisablePush}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                無効にする
              </button>
            </>
          ) : permission === 'denied' ? (
            <div className="text-sm text-gray-600">
              ⚠️ 通知がブロックされています。ブラウザの設定から通知を許可してください。
              <br />
              <span className="text-xs text-gray-500">
                Chrome: アドレスバーの🔒 → 通知 → 許可
              </span>
            </div>
          ) : (
            <button
              onClick={handleEnablePush}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? '設定中...' : 'プッシュ通知を有効にする'}
            </button>
          )}
        </div>

        {/* 説明 */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• プッシュ通知を有効にすると、アプリを閉じていても新しいスタッフチャットの通知を受け取れます</p>
          <p>• 通知をタップするとアプリが開き、該当のチャット画面に移動します</p>
          <p>• 設定はいつでも変更できます</p>
        </div>
      </div>
    </div>
  )
}

export default PushNotificationSettings 