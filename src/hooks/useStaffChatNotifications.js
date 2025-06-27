import { useState, useEffect } from 'react'
import { getStaffChats, subscribeToStaffChats, unsubscribeFromStaffChats } from '../lib/database'

const LAST_CHAT_VIEW_KEY = 'lastStaffChatViewTime'

export const useStaffChatNotifications = (userId) => {
  const [unreadCount, setUnreadCount] = useState(0)

  // 最後にチャットを見た時間を取得
  const getLastViewTime = () => {
    const stored = localStorage.getItem(LAST_CHAT_VIEW_KEY)
    return stored ? new Date(stored) : new Date(0) // 初回は1970年1月1日から全て未読
  }

  // 最後にチャットを見た時間を更新
  const markAsRead = () => {
    const now = new Date().toISOString()
    localStorage.setItem(LAST_CHAT_VIEW_KEY, now)
    setUnreadCount(0)
    console.log('📖 チャット既読処理:', now)
  }

  // 未読数を計算
  const calculateUnreadCount = async () => {
    try {
      const lastViewTime = getLastViewTime()
      const result = await getStaffChats(200) // 過去200件を取得
      
      if (result.success) {
        const unreadChats = result.data.filter(chat => {
          const chatTime = new Date(chat.created_at || chat.sent_at)
          const isAfterLastView = chatTime > lastViewTime
          const isNotMyMessage = chat.sender_id !== userId
          return isAfterLastView && isNotMyMessage
        })
        
        console.log('📊 未読チャット計算:', {
          lastViewTime: lastViewTime.toISOString(),
          totalChats: result.data.length,
          unreadCount: unreadChats.length
        })
        
        setUnreadCount(unreadChats.length)
      }
    } catch (error) {
      console.error('未読数計算エラー:', error)
    }
  }

  // 初期化（購読は各ダッシュボードに任せる）
  useEffect(() => {
    if (userId) {
      calculateUnreadCount()
    }
  }, [userId])

  // 外部から未読数を更新する関数
  const incrementUnreadCount = () => {
    setUnreadCount(prev => {
      const newCount = prev + 1
      console.log('🔔 未読数増加:', prev, '→', newCount)
      return newCount
    })
  }

  return {
    unreadCount,
    markAsRead,
    calculateUnreadCount,
    incrementUnreadCount
  }
} 