import React, { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import Layout from '../components/Layout'
import { useApp } from '../contexts/AppContext'
import { getStores, getVisitRecords } from '../lib/database'

const CustomerBillingPDFPage = () => {
    const { getUserStoreId, getStoreIdFromSubdomain } = useApp()
    const [store, setStore] = useState(null)
    const [visitRecords, setVisitRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [pdfUrl, setPdfUrl] = useState(null)

    const storeId = getUserStoreId() || getStoreIdFromSubdomain()

    // フォント読み込み（日本語対応）
    const loadFont = async () => {
        // NotoSansJPフォントのBase64データを設定
        // 実際の実装では、publicフォルダにフォントファイルを配置してfetchで読み込む
        return Promise.resolve()
    }

    // データ取得
    useEffect(() => {
        const fetchData = async () => {
            if (!storeId) return

            try {
                setLoading(true)
                
                // フォント読み込み
                await loadFont()
                
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

    // PDF生成
    useEffect(() => {
        if (!store || loading) return

        const generatePDF = () => {
            const doc = new jsPDF('p', 'mm', 'a4')
            
            // 日付関連の関数
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
            const baseFee = store.panel_fee || store.base_fee || store.base_price || 30000
            const unitPrice = store.charge_per_person || store.unit_price || 3000
            const guaranteeCount = store.guarantee_count || 8
            const totalVisitors = visitRecords.reduce((sum, record) => sum + (record.guest_count || 0), 0)
            const subtotal = baseFee + (totalVisitors * unitPrice) - (totalVisitors < guaranteeCount ? (guaranteeCount - totalVisitors) * unitPrice : 0)
            const tax = Math.floor(subtotal * 0.1)
            const total = subtotal + tax

            // ヘッダー
            doc.setFontSize(10)
            doc.text(formatDate(getInvoiceDate()), 190, 20, { align: 'right' })
            
            // タイトル
            doc.setFontSize(24)
            doc.text('請 求 書', 105, 40, { align: 'center' })
            
            // 宛名
            doc.setFontSize(14)
            doc.text(`${store.name} 様`, 20, 60)
            
            // 説明文
            doc.setFontSize(11)
            doc.text('下記の通りご請求申し上げます', 20, 75)
            
            // 請求金額ヘッダー
            doc.setFillColor(50, 50, 50)
            doc.rect(20, 85, 170, 10, 'F')
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(12)
            doc.text('■■ ご請求金額 ■■', 105, 91, { align: 'center' })
            doc.setTextColor(0, 0, 0)
            
            // 明細テーブル
            let y = 105
            doc.setFontSize(10)
            
            // テーブルヘッダー
            doc.line(20, y, 190, y)
            doc.text('項目', 25, y + 6)
            doc.text('数量', 85, y + 6, { align: 'center' })
            doc.text('単価', 125, y + 6, { align: 'right' })
            doc.text('金額', 185, y + 6, { align: 'right' })
            y += 10
            doc.line(20, y, 190, y)
            
            // 掲載料金
            y += 8
            doc.text('掲載料金', 25, y)
            doc.text('1', 85, y, { align: 'center' })
            doc.text(`¥${baseFee.toLocaleString()}`, 125, y, { align: 'right' })
            doc.text(`¥${baseFee.toLocaleString()}`, 185, y, { align: 'right' })
            
            // 紹介料
            y += 8
            doc.text('紹介料', 25, y)
            doc.text(`${totalVisitors}名`, 85, y, { align: 'center' })
            doc.text(`¥${unitPrice.toLocaleString()}`, 125, y, { align: 'right' })
            doc.text(`¥${(totalVisitors * unitPrice).toLocaleString()}`, 185, y, { align: 'right' })
            
            // 保証割料金
            y += 8
            doc.text('保証割料金', 25, y)
            if (totalVisitors < guaranteeCount) {
                doc.setTextColor(255, 0, 0)
                doc.text(`-¥${((guaranteeCount - totalVisitors) * unitPrice).toLocaleString()}`, 185, y, { align: 'right' })
                doc.setTextColor(0, 0, 0)
            } else {
                doc.text('¥0', 185, y, { align: 'right' })
            }
            
            // 小計
            y += 8
            doc.line(20, y, 190, y)
            y += 6
            doc.text('小計', 125, y, { align: 'right' })
            doc.text(`¥${subtotal.toLocaleString()}`, 185, y, { align: 'right' })
            
            // 消費税
            y += 8
            doc.text('消費税（10%）', 125, y, { align: 'right' })
            doc.text(`¥${tax.toLocaleString()}`, 185, y, { align: 'right' })
            
            // 合計
            y += 8
            doc.line(20, y, 190, y)
            y += 6
            doc.setFontSize(12)
            doc.setFont(undefined, 'bold')
            doc.text('合計', 125, y, { align: 'right' })
            doc.text(`¥${total.toLocaleString()}`, 185, y, { align: 'right' })
            doc.setFont(undefined, 'normal')
            
            // 説明文
            y += 15
            doc.setFontSize(10)
            doc.text('いつもお世話になっております。', 20, y)
            y += 6
            doc.text('お手数ですが本書面をもって下記口座宛にお振込みくださいますようお願い申し上げます。', 20, y)
            y += 6
            doc.text('・振込手数料：おそれいりますが貴社負担にてお願い申し上げます。', 20, y)
            y += 6
            doc.text(`・ご入金期日：${getMonthName(getDueDate())}25日`, 20, y)
            y += 8
            doc.setTextColor(255, 0, 0)
            doc.setFont(undefined, 'bold')
            doc.text('なお、当月までに振込が確認できない場合は、ご紹介の方を控えさせていただきます。', 20, y)
            doc.setFont(undefined, 'normal')
            doc.setTextColor(0, 0, 0)
            
            // 振込先情報
            y += 15
            doc.setFillColor(240, 240, 240)
            doc.rect(20, y - 5, 170, 35, 'F')
            doc.setFontSize(11)
            doc.setFont(undefined, 'bold')
            doc.text('■振込先口座：', 25, y + 2)
            doc.setFont(undefined, 'normal')
            doc.setFontSize(10)
            y += 8
            doc.text('　銀行名：北洋銀行', 30, y)
            y += 5
            doc.text('　支店名：札幌南支店（030）', 30, y)
            y += 5
            doc.text('　種別：普通', 30, y)
            y += 5
            doc.text('　口座番号：7210596', 30, y)
            y += 5
            doc.text('　口座名義：（カ）リプレイ センザキ マサミツ', 30, y)
            
            // フッター
            doc.setFontSize(8)
            doc.text('ホストクラブ案内所システム', 105, 285, { align: 'center' })
            
            // PDFをBlob URLとして生成
            const pdfBlob = doc.output('blob')
            const url = URL.createObjectURL(pdfBlob)
            setPdfUrl(url)
        }

        generatePDF()
    }, [store, visitRecords, loading])

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

            {/* PDFビューア */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                {pdfUrl ? (
                    <>
                        <div className="mb-4">
                            <iframe
                                src={pdfUrl}
                                className="w-full h-[600px] border border-gray-300 rounded"
                                title="請求書PDF"
                            />
                        </div>
                        
                        {/* ダウンロードボタン */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href={pdfUrl}
                                download={`請求書_${store.name}_${new Date().toISOString().split('T')[0]}.pdf`}
                                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                PDFをダウンロード
                            </a>
                            
                            <button
                                onClick={() => window.open(pdfUrl, '_blank')}
                                className="inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                新しいタブで開く
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500">PDFを生成中...</p>
                    </div>
                )}
            </div>
        </Layout>
    )
}

export default CustomerBillingPDFPage