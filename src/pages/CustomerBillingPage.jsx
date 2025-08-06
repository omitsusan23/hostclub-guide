import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useApp } from '../contexts/AppContext'
import { getStores, getVisitRecords } from '../lib/database'

const CustomerBillingPage = () => {
    const { getUserStoreId, getStoreIdFromSubdomain, user } = useApp()
    const [store, setStore] = useState(null)
    const [visitRecords, setVisitRecords] = useState([])
    const [loading, setLoading] = useState(true)

    // ユーザーのstore_idまたはサブドメインから店舗IDを取得
    const storeId = getUserStoreId() || getStoreIdFromSubdomain()

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

                // 今月の案内記録取得
                const records = await getVisitRecords(storeId)
                setVisitRecords(records)

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
        return `${date.getMonth() + 1}月`
    }

    // 掲載料金の月（翌々月）
    const getNextMonth = () => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth() + 2, 1)
    }

    // 紹介料の月（前月）
    const getPrevMonth = () => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth() - 1, 1)
    }

    // 請求書の日付を取得（翌月4日）
    const getInvoiceDate = () => {
        const now = new Date()
        const invoiceDate = new Date(now.getFullYear(), now.getMonth() + 1, 4)
        return invoiceDate
    }

    // 支払期日（翌月25日）
    const getDueDate = () => {
        const now = new Date()
        const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 25)
        return dueDate
    }

    // 日付フォーマット（令和表記）
    const formatDateToWareki = (date) => {
        const year = date.getFullYear()
        const reiwaYear = year - 2018
        const month = date.getMonth() + 1
        const day = date.getDate()
        return `令和${reiwaYear}年${month}月${day}日`
    }

    // 日付フォーマット（通常表記）
    const formatDate = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const day = date.getDate()
        return `${year}年${month}月${day}日`
    }

    // 数値を3桁区切りにフォーマット
    const formatNumber = (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center py-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-4 text-gray-600">請求書データを読み込み中...</p>
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
                    <p className="text-sm text-gray-400 mt-2">店舗ID: {storeId}</p>
                </div>
            </Layout>
        )
    }

    // 請求計算
    const baseFee = store.base_price || 30000 // 基本料金
    const unitPrice = store.unit_price || 3000 // 案内料の単価
    const guaranteeCount = store.guarantee_count || 8 // 保証人数
    
    // 今月の案内人数（請求書なので今月のデータを使用）
    const totalVisitors = visitRecords.reduce((sum, record) => sum + (record.guest_count || 0), 0)
    
    // 保証人数を超えた分の計算
    const billableCount = Math.max(0, totalVisitors - guaranteeCount)
    const additionalFee = billableCount * unitPrice

    // 明細データ
    const items = [
        {
            label: '掲載料金',
            quantity: 1,
            unitPrice: baseFee,
            amount: baseFee
        },
        {
            label: '紹介料',
            quantity: totalVisitors,
            unitPrice: totalVisitors > 0 ? unitPrice : 0,
            amount: totalVisitors * unitPrice
        },
        {
            label: '保証割料金',
            quantity: totalVisitors < guaranteeCount ? (guaranteeCount - totalVisitors) : 0,
            unitPrice: totalVisitors < guaranteeCount ? -unitPrice : 0,
            amount: totalVisitors < guaranteeCount ? -(guaranteeCount - totalVisitors) * unitPrice : 0
        }
    ]

    // 小計・税・合計
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
    const tax = Math.floor(subtotal * 0.1)
    const total = subtotal + tax

    return (
        <Layout>
            {/* ページヘッダー */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    請求書
                </h2>
                <p className="text-gray-600">
                    今月の請求内容を確認できます
                </p>
            </div>

            {/* ログイン情報カード */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                    🔐 このページのログイン情報
                </h3>
                <div className="bg-white rounded-lg p-4 space-y-3">
                    <div className="flex items-start">
                        <span className="text-gray-600 font-medium min-w-[80px]">URL:</span>
                        <span className="text-gray-900 break-all">
                            {window.location.protocol}//{window.location.host}{window.location.pathname}
                        </span>
                    </div>
                    <div className="flex items-start">
                        <span className="text-gray-600 font-medium min-w-[80px]">メール:</span>
                        <span className="text-gray-900">{storeId}@hostclub.local</span>
                    </div>
                    <div className="flex items-start">
                        <span className="text-gray-600 font-medium min-w-[80px]">パスワード:</span>
                        <span className="text-gray-900">
                            {storeId && storeId.charAt(0).toUpperCase()}{storeId && storeId.slice(1)}@Club2025!
                        </span>
                    </div>
                </div>
                <p className="text-sm text-blue-700 mt-3">
                    ※ この情報は安全に保管し、必要に応じてパスワードを変更してください。
                </p>
            </div>

            {/* 請求書本体 */}
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
                <div className="text-right mb-4 text-gray-700">
                    {formatDate(getInvoiceDate())}
                </div>

                <h1 className="text-center text-3xl font-bold mb-8 tracking-widest">請 求 書</h1>

                <div className="mb-8">
                    <p className="text-lg font-semibold">{store.name} 様</p>
                </div>

                <p className="mb-8">下記の通りご請求申し上げます</p>

                <div className="mb-6">
                    <h2 className="bg-gray-800 text-white text-center py-2 px-4 font-bold">
                        ■■ ご請求金額 ■■
                    </h2>
                </div>

                {/* 明細 */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">明細</h3>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b-2 border-gray-300">
                                <th className="text-left py-2">項目</th>
                                <th className="text-center py-2">数量</th>
                                <th className="text-right py-2">単価</th>
                                <th className="text-right py-2">金額</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* 基本料金 */}
                            <tr className="border-b border-gray-200">
                                <td className="py-3">基本料金</td>
                                <td className="text-center py-3">1</td>
                                <td className="text-right py-3">¥{baseFee.toLocaleString()}</td>
                                <td className="text-right py-3">¥{baseFee.toLocaleString()}</td>
                            </tr>
                            
                            {/* 案内料金 */}
                            <tr className="border-b border-gray-200">
                                <td className="py-3">
                                    案内料
                                    <span className="text-sm text-gray-600 ml-2">
                                        （保証{guaranteeCount}名を超えた分）
                                    </span>
                                </td>
                                <td className="text-center py-3">{billableCount}名</td>
                                <td className="text-right py-3">¥{unitPrice.toLocaleString()}</td>
                                <td className="text-right py-3">¥{additionalFee.toLocaleString()}</td>
                            </tr>

                            {/* 小計 */}
                            <tr className="border-b border-gray-200">
                                <td colSpan="3" className="text-right py-3 font-medium">小計</td>
                                <td className="text-right py-3 font-medium">¥{subtotal.toLocaleString()}</td>
                            </tr>

                            {/* 消費税 */}
                            <tr className="border-b border-gray-200">
                                <td colSpan="3" className="text-right py-3">消費税（10%）</td>
                                <td className="text-right py-3">¥{tax.toLocaleString()}</td>
                            </tr>

                            {/* 合計 */}
                            <tr className="border-b-2 border-gray-300">
                                <td colSpan="3" className="text-right py-3 font-bold text-lg">合計</td>
                                <td className="text-right py-3 font-bold text-lg">¥{total.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>


                <hr className="mb-8" />

                <div className="mb-8">
                    <p className="mb-4">いつもお世話になっております。</p>
                    <p className="mb-4">お手数ですが本書面をもって下記口座宛にお振込みくださいますようお願い申し上げます。</p>
                    <p className="mb-2">・振込手数料：おそれいりますが貴社負担にてお願い申し上げます。</p>
                    <p className="mb-4">・ご入金期日：{getMonthName(getDueDate())}25日</p>
                    <p className="font-bold text-red-600">
                        なお、**当月までに振込が確認できない場合は、ご紹介の方を控えさせていただきます。**
                    </p>
                </div>

                <hr className="mb-8" />

                {/* 振込先情報 */}
                <div className="bg-gray-50 p-6 rounded">
                    <h3 className="font-bold mb-4">■振込先口座：</h3>
                    <div className="ml-4 space-y-1">
                        <p>　銀行名：北洋銀行</p>
                        <p>　支店名：札幌南支店（030）</p>
                        <p>　種別：普通</p>
                        <p>　口座番号：7210596</p>
                        <p>　口座名義：（カ）リプレイ センザキ マサミツ</p>
                    </div>
                </div>
            </div>

            {/* 印刷ボタン */}
            <div className="mt-8 text-center">
                <button
                    onClick={() => window.print()}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    請求書を印刷
                </button>
            </div>
        </Layout>
    )
}

export default CustomerBillingPage