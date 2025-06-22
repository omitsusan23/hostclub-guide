import React, { useState, useEffect } from 'react'
import { getStores } from '../lib/database'

const VisitForm = ({ selectedStore, onSubmit, onClose }) => {
  const [stores, setStores] = useState([])
  const [storeId, setStoreId] = useState(selectedStore?.store_id || '')
  const [guestCount, setGuestCount] = useState(1)
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  // 店舗データ取得
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setDataLoading(true)
        const storesData = await getStores()
        setStores(storesData)
      } catch (error) {
        console.error('店舗データ取得エラー:', error)
      } finally {
        setDataLoading(false)
      }
    }

    fetchStores()
  }, [])

  // 選択された店舗が変更された場合の処理
  useEffect(() => {
    if (selectedStore) {
      setStoreId(selectedStore.store_id)
    }
  }, [selectedStore])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!storeId || guestCount < 1) {
      alert('店舗と人数を正しく入力してください')
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        storeId,
        guestCount: parseInt(guestCount),
        visitedAt: new Date().toISOString()
      })
      
      // フォームリセット
      setStoreId('')
      setGuestCount(1)
    } catch (error) {
      console.error('案内記録エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  if (dataLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">店舗データを読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            🏪 案内記録追加
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 店舗選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              案内先店舗 <span className="text-red-500">*</span>
            </label>
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              required
              disabled={!!selectedStore}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">店舗を選択してください</option>
              {stores.map((store) => (
                <option key={store.id} value={store.store_id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          {/* 人数入力 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              案内人数 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 現在時刻の表示 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              案内時刻
            </label>
            <div className="px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600">
              {new Date().toLocaleString('ja-JP')}
            </div>
          </div>

          {/* ボタン */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading || !storeId || guestCount < 1}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '保存中...' : '案内記録を保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VisitForm 