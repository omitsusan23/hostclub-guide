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
    const [isMobile, setIsMobile] = useState(false)
    const [generatingPDF, setGeneratingPDF] = useState(false)
    const invoiceRef = useRef()

    const storeId = getUserStoreId() || getStoreIdFromSubdomain()

    // モバイル判定
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

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
    const downloadPDF = async () => {
        if (!invoiceRef.current) return
        
        setGeneratingPDF(true)
        
        try {
            const opt = {
                margin: 10,
                filename: `請求書_${store?.name}_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    letterRendering: true,
                    logging: false
                },
                jsPDF: { 
                    unit: 'mm', 
                    format: 'a4', 
                    orientation: 'portrait' 
                }
            }

            await html2pdf().set(opt).from(invoiceRef.current).save()
        } catch (error) {
            console.error('PDF生成エラー:', error)
            alert('PDF生成に失敗しました。もう一度お試しください。')
        } finally {
            setGeneratingPDF(false)
        }
    }

    // 新しいタブで開く
    const openInNewTab = async () => {
        if (!invoiceRef.current) return
        
        setGeneratingPDF(true)
        
        try {
            const opt = {
                margin: 10,
                filename: 'invoice.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    letterRendering: true,
                    logging: false
                },
                jsPDF: { 
                    unit: 'mm', 
                    format: 'a4', 
                    orientation: 'portrait' 
                }
            }

            const pdf = await html2pdf().set(opt).from(invoiceRef.current).outputPdf('blob')
            const url = URL.createObjectURL(pdf)
            window.open(url, '_blank')
        } catch (error) {
            console.error('PDF生成エラー:', error)
            alert('PDF生成に失敗しました。もう一度お試しください。')
        } finally {
            setGeneratingPDF(false)
        }
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

    // 請求書のコンテンツコンポーネント
    const InvoiceContent = () => (
        <>
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
        </>
    )

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
                {/* モバイル用のサマリー表示 */}
                {isMobile && (
                    <div className="text-center py-8 mb-6">
                        <svg className="w-24 h-24 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">請求書PDFの生成</h3>
                        <p className="text-sm text-gray-600 mb-6">ボタンをクリックしてPDFを生成・表示します</p>
                        
                        {/* 請求金額サマリー */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left max-w-sm mx-auto">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">請求内容</h4>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">掲載料金：</span>
                                    <span className="font-medium">¥{baseFee.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">紹介料（{totalVisitors}名）：</span>
                                    <span className="font-medium">¥{(totalVisitors * unitPrice).toLocaleString()}</span>
                                </div>
                                {totalVisitors < guaranteeCount && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">保証割：</span>
                                        <span className="font-medium text-red-600">-¥{((guaranteeCount - totalVisitors) * unitPrice).toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t border-gray-200">
                                    <span className="text-gray-700 font-semibold">合計（税込）：</span>
                                    <span className="font-bold text-lg">¥{total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 請求書プレビュー（デスクトップ表示用、モバイルではPDF生成用） */}
                <div 
                    ref={invoiceRef}
                    className={`max-w-4xl mx-auto bg-white p-8 ${isMobile ? 'sr-only' : ''}`}
                    style={{ 
                        fontFamily: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", "Yu Gothic Medium", "Meiryo", sans-serif',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        color: '#333'
                    }}
                >
                    <InvoiceContent />
                </div>

                {/* ダウンロードボタン */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                    <button
                        onClick={downloadPDF}
                        disabled={generatingPDF}
                        className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {generatingPDF ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                生成中...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                PDFをダウンロード
                            </>
                        )}
                    </button>
                    
                    <button
                        onClick={openInNewTab}
                        disabled={generatingPDF}
                        className="inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {generatingPDF ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                生成中...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                新しいタブで開く
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Layout>
    )
}

export default CustomerBillingPDFPage