import React, { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import { useApp } from '../contexts/AppContext'
import { getStores, getVisitRecords } from '../lib/database'

const CustomerBillingPDFPageV3 = () => {
    const { getUserStoreId, getStoreIdFromSubdomain } = useApp()
    const [store, setStore] = useState(null)
    const [invoicesData, setInvoicesData] = useState([])
    const [loading, setLoading] = useState(true)
    const [generatingPDF, setGeneratingPDF] = useState(false)
    const [selectedMonth, setSelectedMonth] = useState(null)
    const invoiceRef = useRef(null)

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

                // 過去3ヶ月分の請求書データを取得
                const now = new Date()
                const currentYear = now.getFullYear()
                const currentMonth = now.getMonth()
                
                const invoices = []
                
                // 8月請求書 = 9月掲載料金 + 7月紹介料
                // 現在は8月なので、8月分の請求書のみ取得
                if (currentMonth === 7) { // 8月 (0-indexed)
                    // 7月分の紹介料データを取得
                    const julyStartDate = new Date(currentYear, 6, 1).toISOString() // 7月1日
                    const julyEndDate = new Date(currentYear, 6, 31, 23, 59, 59).toISOString() // 7月31日
                    const julyRecords = await getVisitRecords(storeId, julyStartDate, julyEndDate)
                    
                    invoices.push({
                        year: currentYear,
                        month: 8, // 8月請求
                        invoiceMonthName: '8月',
                        panelMonthName: '9月', // 9月分掲載料金
                        introductionMonthName: '7月', // 7月分紹介料
                        records: julyRecords, // 7月の案内記録
                        invoiceDate: new Date(currentYear, 7, 5), // 8月5日発行
                        dueDate: new Date(currentYear, 7, 25) // 8月25日締切
                    })
                }
                
                // 将来的に9月、10月の請求書も追加される
                // 9月請求書 = 10月掲載料金 + 8月紹介料
                // 10月請求書 = 11月掲載料金 + 9月紹介料
                
                setInvoicesData(invoices)
                if (invoices.length > 0) {
                    setSelectedMonth(invoices[0]) // デフォルトで最新月を選択
                }

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
    
    const getInvoiceDate = () => selectedMonth?.invoiceDate || new Date(2025, 7, 5)
    const getDueDate = () => selectedMonth?.dueDate || new Date(2025, 7, 25)
    const getMonthName = (date) => `${date.getMonth() + 1}月`

    // 請求計算（選択された月のデータを使用）
    const baseFee = store?.panel_fee || store?.base_fee || store?.base_price || 30000
    const unitPrice = store?.charge_per_person || store?.unit_price || 3000
    const guaranteeCount = store?.guarantee_count || 8
    const underGuaranteePenalty = store?.under_guarantee_penalty || 0 // 保証割れ料金（契約で定められた金額）
    const visitRecords = selectedMonth?.records || []
    const totalVisitors = visitRecords.reduce((sum, record) => sum + (record.guest_count || 0), 0)
    
    // 保証割れの計算
    const isUnderGuarantee = totalVisitors < guaranteeCount
    const shortfallCount = isUnderGuarantee ? guaranteeCount - totalVisitors : 0 // 不足人数
    const shortfallPersonCharge = shortfallCount * 3000 // 不足人数分の料金（一律3000円）
    
    // 小計の計算
    // 基本料金 + 紹介料 - 保証割れ料金（契約金額） - 保証割れ人数料金
    let subtotal = baseFee + (totalVisitors * unitPrice)
    if (isUnderGuarantee) {
        subtotal = subtotal - underGuaranteePenalty - shortfallPersonCharge
    }
    
    const tax = Math.floor(subtotal * 0.1)
    const total = subtotal + tax

    // モバイル判定
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    // モバイル用: 直接PDFをダウンロード
    const downloadPDFMobile = async () => {
        setGeneratingPDF(true)
        
        try {
            const element = invoiceRef.current
            if (!element) {
                alert('請求書の生成に失敗しました。')
                return
            }

            // 動的インポートでライブラリを遅延読み込み
            const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
                import('html2canvas'),
                import('jspdf')
            ])

            // html2canvasでキャンバスに変換
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                windowWidth: 794,
                windowHeight: 1123
            })
            
            // PDFを生成
            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })
            
            // A4サイズに合わせて画像を配置（1ページに収める）
            const imgWidth = 210
            const imgHeight = 297
            
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST')
            pdf.save(`請求書_${store?.name}_${new Date().toISOString().split('T')[0]}.pdf`)
            
        } catch (error) {
            console.error('PDF生成エラー:', error)
            alert('PDF生成に失敗しました。もう一度お試しください。')
        } finally {
            setGeneratingPDF(false)
        }
    }

    // デスクトップ用: 新しいウィンドウで開く（印刷用）
    const openPrintableVersion = () => {
        setGeneratingPDF(true)

        try {
            // 新しいウィンドウを開く
            const printWindow = window.open('', '_blank', 'width=800,height=1000')
            
            if (!printWindow) {
                alert('ポップアップがブロックされています。ブラウザの設定を確認してください。')
                setGeneratingPDF(false)
                return
            }

            // 印刷用HTMLを生成
            const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>請求書_${store?.name}_${new Date().toISOString().split('T')[0]}</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", "Yu Gothic Medium", "Meiryo", sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #000000;
            background: #ffffff;
            margin: 0;
            padding: 0;
        }
        
        .invoice-container {
            width: 210mm;
            height: 297mm;
            padding: 10mm;
            background: white;
            position: relative;
            page-break-after: avoid;
            overflow: hidden;
        }
        
        .header-date {
            text-align: right;
            margin-bottom: 12px;
            font-size: 11px;
        }
        
        .title {
            text-align: center;
            margin-bottom: 16px;
        }
        
        .title h1 {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .customer-name {
            margin-bottom: 12px;
        }
        
        .customer-name h2 {
            font-size: 16px;
            font-weight: 600;
        }
        
        .description {
            margin-bottom: 16px;
            font-size: 12px;
        }
        
        .amount-header {
            background-color: #1f2937;
            color: white;
            text-align: center;
            padding: 8px;
            margin-bottom: 12px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .amount-header h3 {
            font-size: 14px;
            font-weight: 600;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            page-break-inside: avoid;
        }
        
        thead tr {
            border-top: 2px solid #1f2937;
            border-bottom: 2px solid #1f2937;
        }
        
        th, td {
            padding: 6px 4px;
            font-size: 11px;
        }
        
        th {
            text-align: left;
            font-weight: 600;
        }
        
        th:nth-child(2), td:nth-child(2) {
            text-align: center;
        }
        
        th:nth-child(3), td:nth-child(3),
        th:nth-child(4), td:nth-child(4) {
            text-align: right;
        }
        
        tr.subtotal-row {
            border-top: 1px solid #9ca3af;
        }
        
        tr.total-row {
            border-top: 2px solid #1f2937;
        }
        
        .total-row td {
            font-size: 14px;
            font-weight: bold;
        }
        
        .negative {
            color: #dc2626;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .payment-info {
            margin-bottom: 16px;
        }
        
        .payment-info p {
            margin-bottom: 4px;
            font-size: 11px;
        }
        
        .warning {
            color: #dc2626;
            font-weight: 600;
            margin-top: 8px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .bank-info {
            background-color: #f3f4f6;
            padding: 12px;
            border-radius: 4px;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .bank-info h4 {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 6px;
        }
        
        .bank-info p {
            margin-bottom: 2px;
            font-size: 11px;
        }
        
        .footer {
            text-align: center;
            margin-top: 16px;
            font-size: 10px;
            color: #6b7280;
        }
        
        @media print {
            .no-print {
                display: none !important;
            }
            
            body {
                width: 210mm;
                height: 297mm;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- ボタン（印刷時は非表示） -->
        <div class="no-print" style="margin-bottom: 20px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                印刷 / PDFとして保存
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer;">
                閉じる
            </button>
        </div>
        
        <!-- 請求書本体 -->
        <div class="header-date">
            ${formatDate(getInvoiceDate())}
        </div>
        
        <div class="title">
            <h1>請求書</h1>
        </div>
        
        <div class="customer-name">
            <h2>${store.name} 様</h2>
        </div>
        
        <div class="description">
            <p>下記の通りご請求申し上げます</p>
        </div>
        
        <div class="amount-header">
            <h3>■■ ご請求金額 ■■</h3>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>項目</th>
                    <th>数量</th>
                    <th>単価</th>
                    <th>金額</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${selectedMonth?.panelMonthName || '9月'}掲載料金</td>
                    <td>1</td>
                    <td>¥${baseFee.toLocaleString()}</td>
                    <td>¥${baseFee.toLocaleString()}</td>
                </tr>
                <tr>
                    <td>${selectedMonth?.introductionMonthName || '7月'}紹介料</td>
                    <td>${totalVisitors}名</td>
                    <td>¥${unitPrice.toLocaleString()}</td>
                    <td>¥${(totalVisitors * unitPrice).toLocaleString()}</td>
                </tr>
                ${isUnderGuarantee ? `
                <tr>
                    <td>保証割れ料金</td>
                    <td></td>
                    <td></td>
                    <td><span class="negative">-¥${underGuaranteePenalty.toLocaleString()}</span></td>
                </tr>
                <tr>
                    <td>保証割れ人数料金</td>
                    <td>${shortfallCount}名分</td>
                    <td>¥3,000</td>
                    <td><span class="negative">-¥${shortfallPersonCharge.toLocaleString()}</span></td>
                </tr>
                ` : ''}
                <tr class="subtotal-row">
                    <td></td>
                    <td></td>
                    <td style="font-weight: 600;">小計</td>
                    <td style="font-weight: 600;">¥${subtotal.toLocaleString()}</td>
                </tr>
                <tr>
                    <td></td>
                    <td></td>
                    <td>消費税（10%）</td>
                    <td>¥${tax.toLocaleString()}</td>
                </tr>
                <tr class="total-row">
                    <td></td>
                    <td></td>
                    <td>合計</td>
                    <td>¥${total.toLocaleString()}</td>
                </tr>
            </tbody>
        </table>
        
        <div class="payment-info">
            <p>いつもお世話になっております。</p>
            <p>お手数ですが本書面をもって下記口座宛にお振込みくださいますようお願い申し上げます。</p>
            <p>・振込手数料：おそれいりますが貴社負担にてお願い申し上げます。</p>
            <p>・ご入金期日：8月25日</p>
            <p class="warning">
                なお、当月までに振込が確認できない場合は、ご紹介の方を控えさせていただきます。
            </p>
        </div>
        
        <div class="bank-info">
            <h4>■振込先口座：</h4>
            <p>　銀行名：北洋銀行</p>
            <p>　支店名：札幌南支店（030）</p>
            <p>　種別：普通</p>
            <p>　口座番号：7210596</p>
            <p>　口座名義：（カ）リプレイ センザキ マサミツ</p>
        </div>
        
        <div class="footer">
            ホストクラブ案内所システム
        </div>
    </div>
</body>
</html>
            `

            // 新しいウィンドウにHTMLを書き込む
            printWindow.document.write(htmlContent)
            printWindow.document.close()

            // 少し待ってから印刷ダイアログを開く
            setTimeout(() => {
                printWindow.focus()
                setGeneratingPDF(false)
            }, 500)

        } catch (error) {
            console.error('PDF生成エラー:', error)
            alert('PDF生成に失敗しました。もう一度お試しください。')
            setGeneratingPDF(false)
        }
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

    // 請求書のコンテンツ（モバイル用の隠し要素）
    const InvoiceContent = () => (
        <div 
            ref={invoiceRef}
            style={{
                position: 'absolute',
                left: '-9999px',
                width: '794px',
                height: '1123px',
                padding: '40px',
                backgroundColor: '#ffffff',
                fontFamily: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#000000'
            }}
        >
            {/* ヘッダー */}
            <div style={{ textAlign: 'right', marginBottom: '24px' }}>
                <div style={{ fontSize: '14px' }}>
                    {formatDate(getInvoiceDate())}
                </div>
            </div>

            {/* タイトル */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '16px' }}>請求書</h1>
            </div>

            {/* 宛名 */}
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600' }}>{store.name} 様</h2>
            </div>

            {/* 説明文 */}
            <div style={{ marginBottom: '32px' }}>
                <p style={{ fontSize: '16px' }}>下記の通りご請求申し上げます</p>
            </div>

            {/* 請求金額ヘッダー */}
            <div style={{ backgroundColor: '#1f2937', color: 'white', textAlign: 'center', padding: '12px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>■■ ご請求金額 ■■</h3>
            </div>

            {/* 明細テーブル */}
            <div style={{ marginBottom: '32px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderTop: '2px solid #1f2937', borderBottom: '2px solid #1f2937' }}>
                            <th style={{ textAlign: 'left', padding: '12px 8px' }}>項目</th>
                            <th style={{ textAlign: 'center', padding: '12px 8px' }}>数量</th>
                            <th style={{ textAlign: 'right', padding: '12px 8px' }}>単価</th>
                            <th style={{ textAlign: 'right', padding: '12px 8px' }}>金額</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '12px 8px' }}>{selectedMonth?.panelMonthName || '9月'}掲載料金</td>
                            <td style={{ textAlign: 'center', padding: '12px 8px' }}>1</td>
                            <td style={{ textAlign: 'right', padding: '12px 8px' }}>¥{baseFee.toLocaleString()}</td>
                            <td style={{ textAlign: 'right', padding: '12px 8px' }}>¥{baseFee.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '12px 8px' }}>{selectedMonth?.introductionMonthName || '7月'}紹介料</td>
                            <td style={{ textAlign: 'center', padding: '12px 8px' }}>{totalVisitors}名</td>
                            <td style={{ textAlign: 'right', padding: '12px 8px' }}>¥{unitPrice.toLocaleString()}</td>
                            <td style={{ textAlign: 'right', padding: '12px 8px' }}>¥{(totalVisitors * unitPrice).toLocaleString()}</td>
                        </tr>
                        {isUnderGuarantee && (
                            <>
                                <tr>
                                    <td style={{ padding: '12px 8px' }}>保証割れ料金</td>
                                    <td style={{ textAlign: 'center', padding: '12px 8px' }}></td>
                                    <td style={{ textAlign: 'right', padding: '12px 8px' }}></td>
                                    <td style={{ textAlign: 'right', padding: '12px 8px' }}>
                                        <span style={{ color: '#dc2626' }}>-¥{underGuaranteePenalty.toLocaleString()}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '12px 8px' }}>保証割れ人数料金</td>
                                    <td style={{ textAlign: 'center', padding: '12px 8px' }}>{shortfallCount}名分</td>
                                    <td style={{ textAlign: 'right', padding: '12px 8px' }}>¥3,000</td>
                                    <td style={{ textAlign: 'right', padding: '12px 8px' }}>
                                        <span style={{ color: '#dc2626' }}>-¥{shortfallPersonCharge.toLocaleString()}</span>
                                    </td>
                                </tr>
                            </>
                        )}
                        <tr style={{ borderTop: '1px solid #9ca3af' }}>
                            <td style={{ padding: '12px 8px' }}></td>
                            <td style={{ textAlign: 'center', padding: '12px 8px' }}></td>
                            <td style={{ textAlign: 'right', padding: '12px 8px', fontWeight: '600' }}>小計</td>
                            <td style={{ textAlign: 'right', padding: '12px 8px', fontWeight: '600' }}>¥{subtotal.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '12px 8px' }}></td>
                            <td style={{ textAlign: 'center', padding: '12px 8px' }}></td>
                            <td style={{ textAlign: 'right', padding: '12px 8px' }}>消費税（10%）</td>
                            <td style={{ textAlign: 'right', padding: '12px 8px' }}>¥{tax.toLocaleString()}</td>
                        </tr>
                        <tr style={{ borderTop: '2px solid #1f2937' }}>
                            <td style={{ padding: '12px 8px' }}></td>
                            <td style={{ textAlign: 'center', padding: '12px 8px' }}></td>
                            <td style={{ textAlign: 'right', padding: '12px 8px', fontSize: '18px', fontWeight: 'bold' }}>合計</td>
                            <td style={{ textAlign: 'right', padding: '12px 8px', fontSize: '18px', fontWeight: 'bold' }}>¥{total.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* 説明文 */}
            <div style={{ marginBottom: '32px' }}>
                <p style={{ marginBottom: '8px' }}>いつもお世話になっております。</p>
                <p style={{ marginBottom: '8px' }}>お手数ですが本書面をもって下記口座宛にお振込みくださいますようお願い申し上げます。</p>
                <p style={{ marginBottom: '8px' }}>・振込手数料：おそれいりますが貴社負担にてお願い申し上げます。</p>
                <p style={{ marginBottom: '8px' }}>・ご入金期日：8月25日</p>
                <p style={{ color: '#dc2626', fontWeight: '600', marginTop: '16px' }}>
                    なお、当月までに振込が確認できない場合は、ご紹介の方を控えさせていただきます。
                </p>
            </div>

            {/* 振込先情報 */}
            <div style={{ backgroundColor: '#f3f4f6', padding: '24px', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>■振込先口座：</h4>
                <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                    <p style={{ marginBottom: '4px' }}>　銀行名：北洋銀行</p>
                    <p style={{ marginBottom: '4px' }}>　支店名：札幌南支店（030）</p>
                    <p style={{ marginBottom: '4px' }}>　種別：普通</p>
                    <p style={{ marginBottom: '4px' }}>　口座番号：7210596</p>
                    <p style={{ marginBottom: '4px' }}>　口座名義：（カ）リプレイ センザキ マサミツ</p>
                </div>
            </div>

            {/* フッター */}
            <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '12px', color: '#6b7280' }}>
                ホストクラブ案内所システム
            </div>
        </div>
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

            {/* 月選択タブ（将来的に複数月対応） */}
            {invoicesData.length > 0 && (
                <div className="mb-6">
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                        {invoicesData.map((invoice) => (
                            <button
                                key={`${invoice.year}-${invoice.month}`}
                                onClick={() => setSelectedMonth(invoice)}
                                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                                    selectedMonth?.month === invoice.month 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {invoice.year}年{invoice.invoiceMonthName}分請求
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 請求書サマリー */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
                {/* 月表示バッジ */}
                <div className="text-center mb-4">
                    <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold">
                        {selectedMonth?.year}年{selectedMonth?.invoiceMonthName}分 請求書
                    </span>
                </div>
                <div className="text-center py-8">
                    <svg className="w-24 h-24 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">請求書PDFの生成</h3>
                    
                    {/* 請求金額サマリー */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left max-w-sm mx-auto">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">請求内容</h4>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">宛先：</span>
                                <span className="font-medium">{store.name} 様</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">{selectedMonth?.panelMonthName || '9月'}掲載料金：</span>
                                <span className="font-medium">¥{baseFee.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">{selectedMonth?.introductionMonthName || '7月'}紹介料（{totalVisitors}名）：</span>
                                <span className="font-medium">¥{(totalVisitors * unitPrice).toLocaleString()}</span>
                            </div>
                            {isUnderGuarantee && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">保証割れ料金：</span>
                                        <span className="font-medium text-red-600">-¥{underGuaranteePenalty.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">保証割れ人数料金（{shortfallCount}名分）：</span>
                                        <span className="font-medium text-red-600">-¥{shortfallPersonCharge.toLocaleString()}</span>
                                    </div>
                                </>
                            )}
                            <div className="flex justify-between pt-2 border-t border-gray-200">
                                <span className="text-gray-700 font-semibold">合計（税込）：</span>
                                <span className="font-bold text-lg">¥{total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* ダウンロードボタン */}
                    <button
                        onClick={isMobile ? downloadPDFMobile : openPrintableVersion}
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
                                {isMobile ? 'PDFをダウンロード' : '請求書を開く（印刷/PDF保存）'}
                            </>
                        )}
                    </button>
                    
                    <p className="text-xs text-gray-500 mt-4">
                        {isMobile ? 
                            '※ PDFファイルが直接ダウンロードされます。' :
                            '※ 新しいウィンドウで請求書が開きます。<br />印刷ボタンまたはブラウザの印刷機能（Ctrl+P）から印刷/PDFとして保存することができます。'
                        }
                    </p>
                </div>
            </div>

            {/* モバイル用の隠し請求書要素 */}
            {isMobile && <InvoiceContent />}
        </Layout>
    )
}

export default CustomerBillingPDFPageV3