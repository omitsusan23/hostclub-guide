import React from 'react'
import Layout from '../components/Layout'
import { useApp } from '../contexts/AppContext'

const PastPerformancePage = () => {
  const { user, getUserRole } = useApp()

  // staff ロール以外はアクセス不可
  const userRole = getUserRole()
  if (userRole !== 'staff') {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <h2 className="text-lg font-semibold mb-2">アクセス権限がありません</h2>
            <p>このページはスタッフのみアクセスできます。</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
        {/* ヘッダー */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            📋 過去の案内実績
          </h1>
          <a
            href="/staff-performance"
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            📊 案内実績に戻る
          </a>
        </div>

        {/* メインコンテンツエリア */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              過去の案内実績
            </h3>
            <p className="text-gray-600">
              このページは現在開発中です
            </p>
          </div>
        </div>

        {/* 戻るボタン */}
        <div className="mt-6 text-center">
          <a
            href="/staff"
            className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← ダッシュボードに戻る
          </a>
        </div>
      </div>
    </Layout>
  )
}

export default PastPerformancePage 