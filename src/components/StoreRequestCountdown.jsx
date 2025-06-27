import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const StoreRequestCountdown = ({ chatMessageId }) => {
  const [requestData, setRequestData] = useState(null)
  const [remainingTime, setRemainingTime] = useState(null)
  const [isExpired, setIsExpired] = useState(false)

  // チャットメッセージIDから関連する店舗リクエストを取得
  useEffect(() => {
    const fetchRequestData = async () => {
      try {
        const { data, error } = await supabase
          .from('store_status_requests')
          .select('*')
          .eq('chat_message_id', chatMessageId)
          .eq('has_time_limit', true)
          .single()

        if (error) {
          console.log('リクエストデータなし:', error)
          return
        }

        setRequestData(data)
      } catch (error) {
        console.error('リクエストデータ取得エラー:', error)
      }
    }

    if (chatMessageId) {
      fetchRequestData()
    }
  }, [chatMessageId])

  // カウントダウンタイマー
  useEffect(() => {
    let interval = null

    if (requestData?.expires_at && !requestData.is_consumed) {
      interval = setInterval(() => {
        const now = new Date()
        const expiresAt = new Date(requestData.expires_at)
        const diff = expiresAt - now

        if (diff > 0) {
          const minutes = Math.floor(diff / 60000)
          const seconds = Math.floor((diff % 60000) / 1000)
          setRemainingTime(`${minutes}:${seconds.toString().padStart(2, '0')}`)
          setIsExpired(false)
        } else {
          setRemainingTime('期限切れ')
          setIsExpired(true)
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [requestData])

  // リクエストデータがない、または消化済みの場合は何も表示しない
  if (!requestData || requestData.is_consumed) {
    return null
  }

  return (
    <div className={`mt-2 p-2 rounded-md text-xs ${
      isExpired ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-800'
    }`}>
      <div className="flex items-center justify-between">
        <span className="font-medium">
          {isExpired ? '⏰ 期限切れ' : '⏱️ 残り時間'}
        </span>
        <span className={`font-mono ${isExpired ? 'text-gray-500' : 'text-orange-900'}`}>
          {remainingTime || '計算中...'}
        </span>
      </div>
      {!isExpired && (
        <div className="text-xs text-orange-600 mt-1">
          1時間以内の案内報告で消化されます
        </div>
      )}
    </div>
  )
}

export default StoreRequestCountdown 