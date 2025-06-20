import React, { useState } from 'react'
import { mockStores, isStoreClosed } from '../lib/types'

const VisitForm = ({ onSubmit, loading = false }) => {
  const [selectedStore, setSelectedStore] = useState('')
  const [visitorCount, setVisitorCount] = useState(1)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedStore) {
      alert('店舗を選択してください')
      return
    }
    
    onSubmit({
      storeId: selectedStore,
      visitorCount,
      visitedAt: new Date().toISOString()
    })
    
    // フォームリセット
    setSelectedStore('')
    setVisitorCount(1)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        📝 案内登録
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 店舗選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            案内先店舗
          </label>
          <div className="grid grid-cols-1 gap-3">
            {mockStores.map((store) => {
              const isClosed = isStoreClosed(store.id, today)
              return (
                <div
                  key={store.id}
                  className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedStore === store.id
                      ? 'border-blue-500 bg-blue-50'
                      : isClosed
                      ? 'border-gray-200 bg-gray-50 opacity-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => !isClosed && setSelectedStore(store.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="store"
                        value={store.id}
                        checked={selectedStore === store.id}
                        onChange={() => !isClosed && setSelectedStore(store.id)}
                        disabled={isClosed}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className="ml-3">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">
                            {store.name}
                          </span>
                          {isClosed && (
                            <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                              休業中
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          基本料金: ¥{store.base_fee.toLocaleString()} | 
                          保証本数: {store.guaranteed_count}本
                        </div>
                      </div>
                    </div>
                    
                    {/* 営業状況インジケーター */}
                    <div className={`w-3 h-3 rounded-full ${
                      isClosed ? 'bg-red-400' : 'bg-green-400'
                    }`}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 人数選択 */}
        {selectedStore && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              案内人数
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5, 6].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setVisitorCount(count)}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                    visitorCount === count
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {count}名
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 送信ボタン */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={!selectedStore || loading}
            className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
              !selectedStore || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                案内登録中...
              </div>
            ) : (
              `${mockStores.find(s => s.id === selectedStore)?.name || '店舗'} に ${visitorCount}名案内完了`
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default VisitForm 