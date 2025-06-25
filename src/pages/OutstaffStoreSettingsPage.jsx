import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useApp } from '../contexts/AppContext'
import { getOutstaffRecommendations, updateOutstaffRecommendations } from '../lib/database'

const OutstaffStoreSettingsPage = () => {
  const { user } = useApp()
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  // データ取得
  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = async () => {
    setLoading(true)
    try {
      const result = await getOutstaffRecommendations()
      if (result.success) {
        setRecommendations(result.data)
      } else {
        setMessage('データの読み込みに失敗しました')
        setMessageType('error')
      }
    } catch (error) {
      console.error('推奨店舗読み込みエラー:', error)
      setMessage('データの読み込み中にエラーが発生しました')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  // チェック状態を変更
  const handleCheckChange = (storeId, checked) => {
    setRecommendations(prev => 
      prev.map(rec => 
        rec.store_id === storeId 
          ? { ...rec, is_recommended: checked }
          : rec
      )
    )
  }

  // 全選択/全解除
  const handleSelectAll = (checked) => {
    setRecommendations(prev => 
      prev.map(rec => ({ ...rec, is_recommended: checked }))
    )
  }

  // 保存処理
  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    
    try {
      const result = await updateOutstaffRecommendations(recommendations, user?.id)
      
      if (result.success) {
        setMessage('✅ 推奨店舗設定を保存しました')
        setMessageType('success')
        
        // 3秒後にメッセージを消去
        setTimeout(() => {
          setMessage('')
          setMessageType('')
        }, 3000)
      } else {
        setMessage(`❌ 保存に失敗しました: ${result.error}`)
        setMessageType('error')
      }
    } catch (error) {
      console.error('保存エラー:', error)
      setMessage('❌ 保存中にエラーが発生しました')
      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  // 推奨店舗数を計算
  const recommendedCount = recommendations.filter(rec => rec.is_recommended).length
  const totalCount = recommendations.length

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">データを読み込み中...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-4">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🌸 outstaff店舗設定
          </h1>
          <p className="text-gray-600">
            アウトスタッフが案内できる推奨店舗を設定します。チェックされた店舗は、アウトスタッフ側で薄緑色で表示されます。
          </p>
        </div>

        {/* 統計情報 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
              <div className="text-sm text-gray-600">総店舗数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{recommendedCount}</div>
              <div className="text-sm text-gray-600">推奨店舗数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {totalCount > 0 ? Math.round((recommendedCount / totalCount) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">推奨率</div>
            </div>
          </div>
        </div>

        {/* 操作ボタン */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => handleSelectAll(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                全選択
              </button>
              <button
                onClick={() => handleSelectAll(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                全解除
              </button>
            </div>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? '保存中...' : '💾 設定を保存'}
            </button>
          </div>
        </div>

        {/* 店舗一覧 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            店舗一覧 ({totalCount}店舗)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec) => (
              <div 
                key={rec.store_id} 
                className={`p-4 border rounded-lg transition-all ${
                  rec.is_recommended 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rec.is_recommended}
                    onChange={(e) => handleCheckChange(rec.store_id, e.target.checked)}
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2 mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {rec.stores.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      ID: {rec.stores.store_id}
                    </div>
                    {rec.updated_at && (
                      <div className="text-xs text-gray-500 mt-1">
                        最終更新: {new Date(rec.updated_at).toLocaleDateString('ja-JP')}
                      </div>
                    )}
                  </div>
                </label>
              </div>
            ))}
          </div>
          
          {recommendations.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🏪</div>
              <p className="text-gray-500">店舗が見つかりません</p>
            </div>
          )}
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className={`fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg ${
            messageType === 'success' 
              ? 'bg-green-100 border border-green-200 text-green-800' 
              : 'bg-red-100 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              <div className="flex-1">{message}</div>
              <button
                onClick={() => setMessage('')}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default OutstaffStoreSettingsPage 