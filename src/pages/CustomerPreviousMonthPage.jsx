import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useApp } from '../contexts/AppContext'
import { getStores, getVisitRecords } from '../lib/database'

const CustomerPreviousMonthPage = () => {
    const { getUserStoreId, getStoreIdFromSubdomain } = useApp()
    const [store, setStore] = useState(null)
    const [visitRecords, setVisitRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedMonth, setSelectedMonth] = useState(null)

    // ユーザーのstore_idまたはサブドメインから店舗IDを取得
    const storeId = getUserStoreId() || getStoreIdFromSubdomain()

    // 前月の日付範囲を取得
    const getPreviousMonthRange = () => {
        const now = new Date()
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
        return { start: prevMonth, end: prevMonthEnd }
    }

    // データ取得
    useEffect(() => {
        const fetchData = async () => {
            if (!storeId) return

            try {
                setLoading(true)
                
                // 店舗データ取得
                const allStores = await getStores()
                const storeData = allStores.find(s => s.store_id === storeId)
                setStore(storeData)

                // 前月の案内記録取得
                const { start, end } = getPreviousMonthRange()
                const records = await getVisitRecords(storeId, start.toISOString(), end.toISOString())
                setVisitRecords(records)
                setSelectedMonth(start)

            } catch (error) {
                console.error('データ取得エラー:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [storeId])

    // 月名を取得
    const getMonthName = (date) => {
        if (!date) return ''
        return `${date.getFullYear()}年${date.getMonth() + 1}月`
    }

    // 合計案内人数を計算
    const totalVisitors = visitRecords.reduce((sum, record) => sum + (record.guest_count || 0), 0)

    // 日付フォーマット
    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center py-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-4 text-gray-600">前月のデータを読み込み中...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    if (!store) {
        return (
            <Layout>
                <div className="text-center py-8">
                    <p className="text-gray-500">店舗情報が見つかりません。</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            {/* ページヘッダー */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    前月の案内実績
                </h2>
                <p className="text-gray-600">
                    {selectedMonth && getMonthName(selectedMonth)}の案内記録
                </p>
            </div>

            {/* サマリーカード */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                        <p className="text-sm text-gray-600">月間案内人数</p>
                        <p className="text-3xl font-bold text-blue-600">{totalVisitors}人</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">案内回数</p>
                        <p className="text-3xl font-bold text-green-600">{visitRecords.length}回</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">平均案内人数</p>
                        <p className="text-3xl font-bold text-purple-600">
                            {visitRecords.length > 0 ? (totalVisitors / visitRecords.length).toFixed(1) : 0}人
                        </p>
                    </div>
                </div>
            </div>

            {/* 案内記録リスト */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">案内記録一覧</h3>
                
                {visitRecords.length > 0 ? (
                    <div className="space-y-4">
                        {visitRecords.map((record) => (
                            <div key={record.id} className="border-b pb-4 last:border-b-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {formatDate(record.guided_at)}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            案内担当: {record.staff_name || '未記録'}
                                        </p>
                                        {record.staff_type === 'outstaff' && (
                                            <span className="inline-block mt-1 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                                                外案内
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-bold text-blue-600">
                                            {record.guest_count}人
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">
                        前月の案内記録がありません
                    </p>
                )}
            </div>

            {/* ダッシュボードに戻るボタン */}
            <div className="mt-6 text-center">
                <button
                    onClick={() => window.location.href = '/'}
                    className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                    ダッシュボードに戻る
                </button>
            </div>
        </Layout>
    )
}

export default CustomerPreviousMonthPage