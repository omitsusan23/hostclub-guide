import React, { useState, useEffect } from 'react'
import Modal from './Modal'
import { getTargetsByYear, setMonthlyTarget, setBulkMonthlyTargets } from '../lib/database'

const TargetSettingsModal = ({ isOpen, onClose }) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [targets, setTargets] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingTargets, setEditingTargets] = useState({})

  // 月名配列
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ]

  // データ取得
  useEffect(() => {
    if (isOpen) {
      fetchTargets()
    }
  }, [isOpen, currentYear])

  const fetchTargets = async () => {
    setLoading(true)
    try {
      const result = await getTargetsByYear(currentYear)
      if (result.success) {
        setTargets(result.data)
        
        // 編集用の初期値を設定
        const initialEditingTargets = {}
        result.data.forEach(target => {
          initialEditingTargets[target.month] = target.target_count
        })
        
        // 存在しない月はデフォルト値（0）を設定
        for (let month = 1; month <= 12; month++) {
          if (!initialEditingTargets[month]) {
            initialEditingTargets[month] = 0
          }
        }
        
        setEditingTargets(initialEditingTargets)
      }
    } catch (error) {
      console.error('目標取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // 目標値の変更
  const handleTargetChange = (month, value) => {
    const numValue = parseInt(value) || 0
    setEditingTargets(prev => ({
      ...prev,
      [month]: numValue
    }))
  }

  // 保存
  const handleSave = async () => {
    console.log('🎯 目標保存開始...')
    setSaving(true)
    try {
      // 一括保存用のデータを準備
      const bulkTargets = Object.entries(editingTargets).map(([month, target_count]) => ({
        year: currentYear,
        month: parseInt(month),
        target_count: target_count
      }))

      console.log('📊 保存データ:', bulkTargets)
      
      const result = await setBulkMonthlyTargets(bulkTargets)
      console.log('📝 保存結果:', result)
      
      if (result.success) {
        alert('✅ 目標を保存しました')
        await fetchTargets() // 最新データを再取得
      } else {
        console.error('❌ 保存失敗:', result.error)
        alert('❌ 保存に失敗しました: ' + result.error)
      }
    } catch (error) {
      console.error('❌ 保存エラー:', error)
      alert('❌ 保存中にエラーが発生しました: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  // 年度変更
  const handleYearChange = (direction) => {
    const newYear = direction === 'next' ? currentYear + 1 : currentYear - 1
    // 現在年の前年〜現在年の2年後まで制限
    const currentYearValue = new Date().getFullYear()
    if (newYear >= currentYearValue && newYear <= currentYearValue + 2) {
      setCurrentYear(newYear)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🎯 Staff目標設定">
      <div className="space-y-4">
        {/* 年度選択 */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => handleYearChange('prev')}
            disabled={currentYear <= new Date().getFullYear()}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ←
          </button>
          <h3 className="text-lg font-semibold">{currentYear}年</h3>
          <button
            onClick={() => handleYearChange('next')}
            disabled={currentYear >= new Date().getFullYear() + 2}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            →
          </button>
        </div>

        {/* 目標設定グリッド */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">読み込み中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto">
            {monthNames.map((monthName, index) => {
              const month = index + 1
              const currentValue = editingTargets[month] || 0
              
              return (
                <div key={month} className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {monthName}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={currentValue}
                    onChange={(e) => handleTargetChange(month, e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="text-xs text-gray-500 mt-1 text-center">本</div>
                </div>
              )
            })}
          </div>
        )}

        {/* ボタン */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default TargetSettingsModal 