import React from 'react'
import Layout from '../components/Layout'
import { useApp } from '../contexts/AppContext'

const CustomerBillingPage = () => {
    const { getUserStoreId, getStoreIdFromSubdomain } = useApp()

    // ユーザーのstore_idまたはサブドメインから店舗IDを取得
    const storeId = getUserStoreId() || getStoreIdFromSubdomain()

    return (
        <Layout>
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
                    <h3 className="text-2xl font-bold text-gray-900">
                        請求書機能は準備中です
                    </h3>
                </div>
            </div>
        </Layout>
    )
}

export default CustomerBillingPage 