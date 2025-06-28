import React from 'react'
import Layout from '../components/Layout'
import { useApp } from '../contexts/AppContext'

const CustomerBillingPage = () => {
  const { getUserStoreId, getStoreIdFromSubdomain } = useApp()
  
  // ユーザーのstore_idまたはサブドメインから店舗IDを取得
  const storeId = getUserStoreId() || getStoreIdFromSubdomain()

  return (
    <Layout>
      {/* ヘッダー */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          請求確認
        </h2>
        <p className="text-gray-600">
          月次請求書の確認・ダウンロードページ
        </p>
      </div>

      {/* 準備中メッセージ */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          {/* アイコン */}
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-yellow-100 mb-6">
            <svg className="h-12 w-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          {/* メインメッセージ */}
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            請求書機能は準備中です
          </h3>
          
          <div className="max-w-2xl mx-auto space-y-4 text-gray-600">
            <p className="text-lg">
              現在、請求書の自動生成機能を準備中です。
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left">
              <h4 className="font-semibold text-blue-900 mb-3">📅 サービス開始予定について</h4>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start">
                  <span className="font-medium mr-2">•</span>
                  <span><strong>2024年8月</strong>より正式サービス開始予定</span>
                </li>
                <li className="flex items-start">
                  <span className="font-medium mr-2">•</span>
                  <span>7月のご案内実績を基に、8月分請求書から自動生成いたします</span>
                </li>
                <li className="flex items-start">
                  <span className="font-medium mr-2">•</span>
                  <span>初期期間は管理者による確認・承認プロセスを経て発行されます</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-left">
              <h4 className="font-semibold text-gray-900 mb-3">💳 請求書機能について</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="font-medium mr-2">•</span>
                  <span>毎月の掲載料と前月のご案内実績を基に自動計算</span>
                </li>
                <li className="flex items-start">
                  <span className="font-medium mr-2">•</span>
                  <span>保証本数の達成状況に応じた適切な請求金額の算出</span>
                </li>
                <li className="flex items-start">
                  <span className="font-medium mr-2">•</span>
                  <span>PDF形式での請求書ダウンロード・印刷機能</span>
                </li>
                <li className="flex items-start">
                  <span className="font-medium mr-2">•</span>
                  <span>過去の請求履歴の確認機能</span>
                </li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-left">
              <h4 className="font-semibold text-green-900 mb-3">🔄 現在の状況</h4>
              <ul className="space-y-2 text-green-800">
                <li className="flex items-start">
                  <span className="font-medium mr-2">•</span>
                  <span>7月よりシステム運用開始</span>
                </li>
                <li className="flex items-start">
                  <span className="font-medium mr-2">•</span>
                  <span>ご案内実績の蓄積中</span>
                </li>
                <li className="flex items-start">
                  <span className="font-medium mr-2">•</span>
                  <span>請求書生成機能の最終調整中</span>
                </li>
              </ul>
            </div>
          </div>

          {/* フッターメッセージ */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              ご不明な点がございましたら、管理者までお問い合わせください。<br/>
              サービス開始時には改めてご連絡いたします。
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default CustomerBillingPage 