import { useEffect, useRef } from 'react'

const ORIGINAL_TITLE = 'ホストクラブ案内所'

export const usePageTitleNotifications = (unreadCount = 0) => {
  const originalTitleRef = useRef(ORIGINAL_TITLE)
  const intervalRef = useRef(null)

  useEffect(() => {
    // 未読数がある場合
    if (unreadCount > 0) {
      // 点滅効果
      let isVisible = true
      
      intervalRef.current = setInterval(() => {
        if (isVisible) {
          document.title = `(${unreadCount}) ${originalTitleRef.current}`
        } else {
          document.title = `🔔 新着メッセージ ${unreadCount}件`
        }
        isVisible = !isVisible
      }, 1500) // 1.5秒間隔で点滅
      
    } else {
      // 未読数がない場合は元のタイトルに戻す
      clearInterval(intervalRef.current)
      document.title = originalTitleRef.current
    }

    // クリーンアップ
    return () => {
      clearInterval(intervalRef.current)
    }
  }, [unreadCount])

  // ページがフォーカスされた時にタイトルをリセット
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && unreadCount === 0) {
        document.title = originalTitleRef.current
      }
    }

    const handleFocus = () => {
      if (unreadCount === 0) {
        document.title = originalTitleRef.current
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [unreadCount])

  // カスタムタイトルを設定する関数
  const setCustomTitle = (title) => {
    originalTitleRef.current = title
    if (unreadCount === 0) {
      document.title = title
    }
  }

  return {
    setCustomTitle
  }
} 