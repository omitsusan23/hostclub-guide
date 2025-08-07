import React, { useState, useEffect, useRef } from 'react'
import html2pdf from 'html2pdf.js'
import Layout from '../components/Layout'
import { useApp } from '../contexts/AppContext'
import { getStores, getVisitRecords } from '../lib/database'

const CustomerBillingPDFPage = () => {
    const { getUserStoreId, getStoreIdFromSubdomain } = useApp()
    const [store, setStore] = useState(null)
    const [visitRecords, setVisitRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const invoiceRef = useRef()

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
                const startDate = new Date(2025, 6, 1).toISOString()
                const endDate = new Date(2025, 6, 31, 23, 59, 59).toISOString()
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

    // 日付フォーマット関数
    const formatDate = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const day = date.getDate()
        return `${year}年${month}月${day}日`
    }
    
    const getInvoiceDate = () => new Date(2025, 7, 5)
    const getDueDate = () => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth() + 1, 25)
    }
    const getMonthName = (date) => `${date.getMonth() + 1}月`

    // 請求計算
    const baseFee = store?.panel_fee || store?.base_fee || store?.base_price || 30000
    const unitPrice = store?.charge_per_person || store?.unit_price || 3000
    const guaranteeCount = store?.guarantee_count || 8
    const totalVisitors = visitRecords.reduce((sum, record) => sum + (record.guest_count || 0), 0)
    const subtotal = baseFee + (totalVisitors * unitPrice) - (totalVisitors < guaranteeCount ? (guaranteeCount - totalVisitors) * unitPrice : 0)
    const tax = Math.floor(subtotal * 0.1)
    const total = subtotal + tax

    // PDFダウンロード
    const downloadPDF = () => {
        if (!invoiceRef.current) return

        const opt = {
            margin: 10,
            filename: `請求書_${store?.name}_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                letterRendering: true
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait' 
            }
        }

        html2pdf().set(opt).from(invoiceRef.current).save()
    }

    // 新しいタブで開く
    const openInNewTab = () => {
        if (!invoiceRef.current) return

        const opt = {
            margin: 10,
            filename: 'invoice.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                letterRendering: true
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait' 
            }
        }

        html2pdf().set(opt).from(invoiceRef.current).outputPdf().then((pdf) => {
            const blob = new Blob([pdf], { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)
            window.open(url, '_blank')
        })
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center py-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-4 text-gray-600">請求書PDFを生成中...</p>
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

    return (
        <Layout>
            {/* ページヘッダー */}
            <div className="mb-8 px-4 sm:px-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    請求書（PDF版）
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                    請求書をPDFで確認・ダウンロードできます
                </p>
            </div>

            {/* PDF請求書プレビュー */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
                <div 
                    ref={invoiceRef}
                    className="max-w-4xl mx-auto bg-white p-8"
                    style={{ 
                        fontFamily: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", "Yu Gothic Medium", "Meiryo", sans-serif',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        color: '#333'
                    }}
                >
                    {/* ヘッダー */}
                    <div className="flex justify-end mb-6">
                        <div className="text-sm">
                            {formatDate(getInvoiceDate())}
                        </div>
                    </div>

                    {/* タイトル */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold mb-4">請求書</h1>
                    </div>

                    {/* 宛名 */}
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold">{store.name} 様</h2>
                    </div>

                    {/* 説明文 */}
                    <div className="mb-8">
                        <p className="text-base">下記の通りご請求申し上げます</p>
                    </div>

                    {/* 請求金額ヘッダー */}
                    <div className="bg-gray-800 text-white text-center py-3 mb-6">
                        <h3 className="text-lg font-semibold">■■ ご請求金額 ■■</h3>
                    </div>

                    {/* 明細テーブル */}
                    <div className="mb-8">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-t-2 border-b-2 border-gray-800">
                                    <th className="text-left py-3 px-2">項目</th>
                                    <th className="text-center py-3 px-2">数量</th>
                                    <th className="text-right py-3 px-2">単価</th>
                                    <th className="text-right py-3 px-2">金額</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* 掲載料金 */}
                                <tr>
                                    <td className="py-3 px-2">掲載料金</td>
                                    <td className="text-center py-3 px-2">1</td>
                                    <td className="text-right py-3 px-2">¥{baseFee.toLocaleString()}</td>
                                    <td className="text-right py-3 px-2">¥{baseFee.toLocaleString()}</td>
                                </tr>
                                
                                {/* 紹介料 */}
                                <tr>
                                    <td className="py-3 px-2">紹介料</td>
                                    <td className="text-center py-3 px-2">{totalVisitors}名</td>
                                    <td className="text-right py-3 px-2">¥{unitPrice.toLocaleString()}</td>
                                    <td className="text-right py-3 px-2">¥{(totalVisitors * unitPrice).toLocaleString()}</td>
                                </tr>
                                
                                {/* 保証割料金 */}
                                <tr>
                                    <td className="py-3 px-2">保証割料金</td>
                                    <td className="text-center py-3 px-2"></td>
                                    <td className="text-right py-3 px-2"></td>
                                    <td className="text-right py-3 px-2">
                                        {totalVisitors < guaranteeCount ? (
                                            <span className="text-red-600">
                                                -¥{((guaranteeCount - totalVisitors) * unitPrice).toLocaleString()}
                                            </span>
                                        ) : (
                                            '¥0'
                                        )}
                                    </td>
                                </tr>
                                
                                {/* 小計 */}
                                <tr className="border-t border-gray-400">
                                    <td className="py-3 px-2"></td>
                                    <td className="text-center py-3 px-2"></td>
                                    <td className="text-right py-3 px-2 font-semibold">小計</td>
                                    <td className="text-right py-3 px-2 font-semibold">¥{subtotal.toLocaleString()}</td>
                                </tr>
                                
                                {/* 消費税 */}
                                <tr>
                                    <td className="py-3 px-2"></td>
                                    <td className="text-center py-3 px-2"></td>
                                    <td className="text-right py-3 px-2">消費税（10%）</td>
                                    <td className="text-right py-3 px-2">¥{tax.toLocaleString()}</td>
                                </tr>
                                
                                {/* 合計 */}
                                <tr className="border-t-2 border-gray-800">
                                    <td className="py-3 px-2"></td>
                                    <td className="text-center py-3 px-2"></td>
                                    <td className="text-right py-3 px-2 text-lg font-bold">合計</td>
                                    <td className="text-right py-3 px-2 text-lg font-bold">¥{total.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* 説明文 */}
                    <div className="mb-8 space-y-2">
                        <p>いつもお世話になっております。</p>
                        <p>お手数ですが本書面をもって下記口座宛にお振込みくださいますようお願い申し上げます。</p>
                        <p>・振込手数料：おそれいりますが貴社負担にてお願い申し上げます。</p>
                        <p>・ご入金期日：{getMonthName(getDueDate())}25日</p>
                        <p className="text-red-600 font-semibold mt-4">
                            なお、当月までに振込が確認できない場合は、ご紹介の方を控えさせていただきます。
                        </p>
                    </div>

                    {/* 振込先情報 */}
                    <div className="bg-gray-100 p-6 rounded">
                        <h4 className="text-base font-bold mb-3">■振込先口座：</h4>
                        <div className="space-y-1 text-sm">
                            <p>　銀行名：北洋銀行</p>
                            <p>　支店名：札幌南支店（030）</p>
                            <p>　種別：普通</p>
                            <p>　口座番号：7210596</p>
                            <p>　口座名義：（カ）リプレイ センザキ マサミツ</p>
                        </div>
                    </div>

                    {/* フッター */}
                    <div className="text-center mt-8 text-xs text-gray-500">
                        ホストクラブ案内所システム
                    </div>
                </div>

                {/* ダウンロードボタン */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                    <button
                        onClick={downloadPDF}
                        className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        PDFをダウンロード
                    </button>
                    
                    <button
                        onClick={openInNewTab}
                        className="inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        新しいタブで開く
                    </button>
                </div>
            </div>
        </Layout>
    )
}

export default CustomerBillingPDFPage