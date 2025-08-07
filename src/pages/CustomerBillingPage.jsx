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

                // 7月1日〜7月31日の案内記録取得
                const startDate = new Date(2025, 6, 1).toISOString() // 2025年7月1日
                const endDate = new Date(2025, 6, 31, 23, 59, 59).toISOString() // 2025年7月31日
                const records = await getVisitRecords(storeId, startDate, endDate)
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

    // 請求書の日付を取得（毎月5日）
    const getInvoiceDate = () => {
        // 今回は8月5日を固定で返す（7月分の請求書）
        return new Date(2025, 7, 5) // 2025年8月5日
    }

    // 支払期日（翌月25日）
    const getDueDate = () => {
        const now = new Date()
        const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 25)
        return dueDate
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
    const baseFee = store.panel_fee || store.base_fee || store.base_price || 30000 // 掲載料金（パネル料）
    const unitPrice = store.charge_per_person || store.unit_price || 3000 // 紹介料の単価
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
            <div className="mb-8 print:hidden px-4 sm:px-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    請求書
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                    今月の請求内容を確認できます
                </p>
            </div>

            {/* ログイン情報カード */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 mb-6 print:hidden mx-4 sm:mx-0">
                <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-4">
                    🔐 このページのログイン情報
                </h3>
                <div className="bg-white rounded-lg p-3 sm:p-4 space-y-3">
                    <div className="sm:flex sm:items-start">
                        <span className="text-gray-600 font-medium sm:min-w-[80px] block sm:inline-block mb-1 sm:mb-0">URL:</span>
                        <span className="text-gray-900 break-all text-sm sm:text-base">
                            {window.location.protocol}//{window.location.host}{window.location.pathname}
                        </span>
                    </div>
                    <div className="sm:flex sm:items-start">
                        <span className="text-gray-600 font-medium sm:min-w-[80px] block sm:inline-block mb-1 sm:mb-0">メール:</span>
                        <span className="text-gray-900 text-sm sm:text-base">{storeId}@hostclub.local</span>
                    </div>
                    <div className="sm:flex sm:items-start">
                        <span className="text-gray-600 font-medium sm:min-w-[80px] block sm:inline-block mb-1 sm:mb-0">パスワード:</span>
                        <span className="text-gray-900 text-sm sm:text-base break-all">
                            {storeId && storeId.charAt(0).toUpperCase()}{storeId && storeId.slice(1)}@Club2025!
                        </span>
                    </div>
                </div>
                <p className="text-xs sm:text-sm text-blue-700 mt-3">
                    ※ この情報は安全に保管し、必要に応じてパスワードを変更してください。
                </p>
            </div>

            {/* 請求書本体 */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8 max-w-4xl mx-4 sm:mx-auto print:shadow-none print:rounded-none print:max-w-none print:p-2 print:m-0 print:avoid-break">
                <div className="text-right mb-4 print:mb-1 text-gray-700 text-sm sm:text-base print:text-xs">
                    {formatDate(getInvoiceDate())}
                </div>

                <h1 className="text-center text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 tracking-widest print:text-xl print:mb-2">請 求 書</h1>

                <div className="mb-4 sm:mb-6 print:mb-1">
                    <p className="text-base sm:text-lg font-semibold print:text-sm">{store.name} 様</p>
                </div>

                <p className="mb-4 sm:mb-6 print:mb-1 text-sm sm:text-base print:text-xs">下記の通りご請求申し上げます</p>

                <div className="mb-4 print:mb-1">
                    <h2 className="bg-gray-800 text-white text-center py-2 px-2 sm:px-4 font-bold text-sm sm:text-base print:py-0.5 print:text-xs">
                        ■■ ご請求金額 ■■
                    </h2>
                </div>

                {/* 明細テーブル */}
                <div className="mb-6 font-mono text-xs sm:text-sm print:mb-1 print:text-xs overflow-x-auto">
                    <table className="w-full border-collapse min-w-[320px]">
                        <thead>
                            <tr className="border-b-2 border-gray-300">
                                <th className="text-left py-1 sm:py-2 print:py-0.5 print:text-xs px-1 sm:px-0">項目</th>
                                <th className="text-center py-1 sm:py-2 print:py-0.5 print:text-xs px-1 sm:px-0">数量</th>
                                <th className="text-right py-1 sm:py-2 print:py-0.5 print:text-xs px-1 sm:px-0">単価</th>
                                <th className="text-right py-1 sm:py-2 print:py-0.5 print:text-xs px-1 sm:px-0">金額</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* 掲載料金 */}
                            <tr className="border-b border-gray-200">
                                <td className="py-2 sm:py-3 print:py-0.25 print:text-xs px-1 sm:px-0">掲載料金</td>
                                <td className="text-center py-2 sm:py-3 print:py-0.25 print:text-xs px-1 sm:px-0">1</td>
                                <td className="text-right py-2 sm:py-3 print:py-0.25 print:text-xs px-1 sm:px-0 text-xs sm:text-sm">¥{baseFee.toLocaleString()}</td>
                                <td className="text-right py-2 sm:py-3 print:py-0.25 print:text-xs px-1 sm:px-0 text-xs sm:text-sm">¥{baseFee.toLocaleString()}</td>
                            </tr>
                            
                            {/* 紹介料 */}
                            <tr className="border-b border-gray-200">
                                <td className="py-2 sm:py-3 print:py-0.25 print:text-xs px-1 sm:px-0">紹介料</td>
                                <td className="text-center py-2 sm:py-3 print:py-0.25 print:text-xs px-1 sm:px-0">{totalVisitors}名</td>
                                <td className="text-right py-2 sm:py-3 print:py-0.25 print:text-xs px-1 sm:px-0 text-xs sm:text-sm">¥{unitPrice.toLocaleString()}</td>
                                <td className="text-right py-2 sm:py-3 print:py-0.25 print:text-xs px-1 sm:px-0 text-xs sm:text-sm">¥{(totalVisitors * unitPrice).toLocaleString()}</td>
                            </tr>

                            {/* 保証割料金 */}
                            <tr className="border-b border-gray-200">
                                <td className="py-2 sm:py-3 print:py-0.25 print:text-xs px-1 sm:px-0">保証割料金</td>
                                <td className="text-center py-2 sm:py-3 print:py-0.25 print:text-xs px-1 sm:px-0"></td>
                                <td className="text-right py-2 sm:py-3 print:py-0.25 print:text-xs px-1 sm:px-0"></td>
                                <td className={`text-right py-2 sm:py-3 print:py-0.25 print:text-xs px-1 sm:px-0 text-xs sm:text-sm ${totalVisitors < guaranteeCount ? 'text-red-600' : ''}`}>
                                    {totalVisitors < guaranteeCount 
                                        ? `-¥${((guaranteeCount - totalVisitors) * unitPrice).toLocaleString()}`
                                        : '¥0'
                                    }
                                </td>
                            </tr>

                            {/* 小計 */}
                            <tr className="border-b border-gray-200">
                                <td colSpan="3" className="text-right py-2 sm:py-3 font-medium print:py-0.25 print:text-xs px-1 sm:px-0">小計</td>
                                <td className="text-right py-2 sm:py-3 font-medium print:py-0.25 print:text-xs px-1 sm:px-0 text-xs sm:text-sm">¥{subtotal.toLocaleString()}</td>
                            </tr>

                            {/* 消費税 */}
                            <tr className="border-b border-gray-200">
                                <td colSpan="3" className="text-right py-2 sm:py-3 print:py-0.25 print:text-xs px-1 sm:px-0">消費税（10%）</td>
                                <td className="text-right py-2 sm:py-3 print:py-0.25 print:text-xs px-1 sm:px-0 text-xs sm:text-sm">¥{tax.toLocaleString()}</td>
                            </tr>

                            {/* 合計 */}
                            <tr className="border-b-2 border-gray-300">
                                <td colSpan="3" className="text-right py-2 sm:py-3 font-bold text-base sm:text-lg print:py-0.5 print:text-sm print:font-semibold px-1 sm:px-0">合計</td>
                                <td className="text-right py-2 sm:py-3 font-bold text-base sm:text-lg print:py-0.5 print:text-sm print:font-semibold px-1 sm:px-0">¥{total.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>



                <hr className="mb-3 print:mb-0.5" />

                <div className="mb-3 print:mb-0.5 text-xs sm:text-sm print:text-xs">
                    <p className="mb-1 print:mb-0.25">いつもお世話になっております。</p>
                    <p className="mb-1 print:mb-0.25">お手数ですが本書面をもって下記口座宛にお振込みくださいますようお願い申し上げます。</p>
                    <p className="mb-1 print:mb-0.25">・振込手数料：おそれいりますが貴社負担にてお願い申し上げます。</p>
                    <p className="mb-1 print:mb-0.25">・ご入金期日：{getMonthName(getDueDate())}25日</p>
                    <p className="font-bold text-red-600 text-xs sm:text-sm print:text-xs">
                        なお、**当月までに振込が確認できない場合は、ご紹介の方を控えさせていただきます。**
                    </p>
                </div>

                <hr className="mb-3 print:mb-0.5" />

                {/* 振込先情報 */}
                <div className="bg-gray-50 p-4 sm:p-6 rounded print:p-1 print:text-xs print:bg-transparent">
                    <h3 className="font-bold mb-2 sm:mb-3 print:mb-0.5 text-sm sm:text-base print:text-xs">■振込先口座：</h3>
                    <div className="ml-2 sm:ml-4 space-y-1 print:space-y-0 print:leading-tight text-xs sm:text-sm">
                        <p>　銀行名：北洋銀行</p>
                        <p>　支店名：札幌南支店（030）</p>
                        <p>　種別：普通</p>
                        <p>　口座番号：7210596</p>
                        <p>　口座名義：（カ）リプレイ センザキ マサミツ</p>
                    </div>
                </div>
            </div>

            {/* 印刷ボタン */}
            <div className="mt-8 text-center print:hidden px-4 sm:px-0">
                <button
                    onClick={() => window.print()}
                    className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    請求書を印刷
                </button>
            </div>
        </Layout>
    )
}

export default CustomerBillingPage