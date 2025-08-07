import React from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { useApp } from '../contexts/AppContext'

const CustomerLoginInfoPage = () => {
    const { getUserStoreId, getStoreIdFromSubdomain } = useApp()
    const storeId = getUserStoreId() || getStoreIdFromSubdomain()

    // コピー機能
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            // コピー成功時の処理（トーストメッセージなど）
            const toast = document.createElement('div')
            toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-fade-in'
            toast.textContent = 'コピーしました！'
            document.body.appendChild(toast)
            
            setTimeout(() => {
                toast.remove()
            }, 2000)
        }).catch(err => {
            console.error('コピーに失敗しました:', err)
        })
    }

    return (
        <Layout>
            {/* ページヘッダー */}
            <div className="mb-8 px-4 sm:px-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    ログイン情報設定
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                    システムへのログイン情報を確認・管理できます
                </p>
            </div>

            {/* ログイン情報カード */}
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">
                        🔐 現在のログイン情報
                    </h3>
                    
                    <div className="space-y-6">
                        {/* URL */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                ログインURL
                            </label>
                            <div className="flex items-center justify-between bg-gray-50 rounded p-3">
                                <span className="text-sm sm:text-base text-gray-900 break-all mr-2">
                                    {window.location.protocol}//{window.location.host}/login
                                </span>
                                <button
                                    onClick={() => copyToClipboard(`${window.location.protocol}//${window.location.host}/login`)}
                                    className="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="コピー"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* メールアドレス */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                メールアドレス
                            </label>
                            <div className="flex items-center justify-between bg-gray-50 rounded p-3">
                                <span className="text-sm sm:text-base text-gray-900">
                                    {storeId}@hostclub.local
                                </span>
                                <button
                                    onClick={() => copyToClipboard(`${storeId}@hostclub.local`)}
                                    className="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="コピー"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* パスワード */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                初期パスワード
                            </label>
                            <div className="flex items-center justify-between bg-gray-50 rounded p-3">
                                <span className="text-sm sm:text-base text-gray-900 font-mono">
                                    {storeId && storeId.charAt(0).toUpperCase()}{storeId && storeId.slice(1)}@Club2025!
                                </span>
                                <button
                                    onClick={() => copyToClipboard(`${storeId && storeId.charAt(0).toUpperCase()}${storeId && storeId.slice(1)}@Club2025!`)}
                                    className="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="コピー"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>
                            <p className="text-xs text-amber-600 mt-2">
                                ※ セキュリティのため、初回ログイン後は必ずパスワードを変更してください
                            </p>
                        </div>

                        {/* 店舗ID */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                店舗ID（システム内部ID）
                            </label>
                            <div className="bg-white rounded p-3">
                                <span className="text-sm sm:text-base text-gray-700 font-mono">
                                    {storeId}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                ※ この ID は自動的に割り当てられたもので、変更できません
                            </p>
                        </div>
                    </div>

                    {/* セキュリティ注意事項 */}
                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">
                            🔒 セキュリティに関する注意事項
                        </h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• ログイン情報は安全な場所に保管してください</li>
                            <li>• パスワードは定期的に変更することを推奨します</li>
                            <li>• 他人とログイン情報を共有しないでください</li>
                            <li>• 不正なアクセスを発見した場合は、速やかにパスワードを変更してください</li>
                        </ul>
                    </div>

                    {/* アクションボタン */}
                    <div className="mt-8">
                        <Link
                            to="/customer/password-change"
                            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            パスワードを変更
                        </Link>
                    </div>
                </div>
            </div>

            {/* スタイル（アニメーション用） */}
            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </Layout>
    )
}

export default CustomerLoginInfoPage