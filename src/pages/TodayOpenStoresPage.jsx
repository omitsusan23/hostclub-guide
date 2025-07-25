import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import { useApp } from '../contexts/AppContext'
import { getTodayOpenStores, getAllStoresLatestStatus, getOutstaffRecommendations } from '../lib/database'

const TodayOpenStoresPage = () => {
  const { user, getUserRole } = useApp()
  const [openStores, setOpenStores] = useState([])
  const [totalStoresWithMonthlyUpdate, setTotalStoresWithMonthlyUpdate] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [storeStatuses, setStoreStatuses] = useState({})
  const [recommendedStores, setRecommendedStores] = useState(new Set())
  const [selectedStore, setSelectedStore] = useState(null)
  const [showStoreModal, setShowStoreModal] = useState(false)

  // admin、staff、outstaffのみアクセス可能
  const userRole = getUserRole()
  if (userRole !== 'admin' && userRole !== 'staff' && userRole !== 'outstaff') {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <h2 className="text-lg font-semibold mb-2">アクセス権限がありません</h2>
            <p>このページは管理者、スタッフ、またはアウトスタッフのみアクセスできます。</p>
          </div>
        </div>
      </Layout>
    )
  }

  // データ取得関数を独立させる
  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      // 本日の営業店舗と店舗状況を並行取得（outstaffフィルタリング対応）
      const promises = [
        getTodayOpenStores(userRole),
        getAllStoresLatestStatus()
      ]

      // outstaffの場合は推奨店舗データも取得
      if (userRole === 'outstaff') {
        promises.push(getOutstaffRecommendations())
      }

      const results = await Promise.all(promises)
      const [storesResult, statusesResult, recommendationsResult] = results

      if (!storesResult.success) {
        throw new Error(storesResult.error)
      }

      setTotalStoresWithMonthlyUpdate(storesResult.totalStoresWithMonthlyUpdate || 0)
      setStoreStatuses(statusesResult)

      // outstaffの場合、推奨店舗のSetを作成
      if (userRole === 'outstaff' && recommendationsResult?.success) {
        const recommended = new Set(
          recommendationsResult.data
            .filter(rec => rec.is_recommended)
            .map(rec => rec.store_id)
        )
        setRecommendedStores(recommended)
        
        // outstaffの場合は特別な並び順を適用
        if (storesResult.success) {
          const sortedStores = [...storesResult.data].sort((a, b) => {
            const aIsRecommended = recommended.has(a.store_id)
            const bIsRecommended = recommended.has(b.store_id)
            
            // 1. 推奨店舗を上に
            if (aIsRecommended && !bIsRecommended) return -1
            if (!aIsRecommended && bIsRecommended) return 1
            
            // 2. 同じ推奨状態の場合は、残り保証人数差が多い順（保証なしは末尾）
            const aGuaranteeShortfall = Math.max(0, (a.guarantee_count || 0) - (a.monthlyIntroductions || 0))
            const bGuaranteeShortfall = Math.max(0, (b.guarantee_count || 0) - (b.monthlyIntroductions || 0))
            
            // 保証数が0の店舗は末尾
            if ((a.guarantee_count || 0) === 0 && (b.guarantee_count || 0) > 0) return 1
            if ((a.guarantee_count || 0) > 0 && (b.guarantee_count || 0) === 0) return -1
            
            // 両方保証ありまたは両方保証なしの場合
            if ((a.guarantee_count || 0) > 0 && (b.guarantee_count || 0) > 0) {
              return bGuaranteeShortfall - aGuaranteeShortfall // 残り必要数が多い順
            }
            
            // 両方保証なしの場合は名前順
            return a.name.localeCompare(b.name, 'ja')
          })
          
          setOpenStores(sortedStores)
        }
      } else {
        // outstaff以外の場合は通常の並び順
        if (storesResult.success) {
          setOpenStores(storesResult.data)
        }
      }
    } catch (err) {
      console.error('データ取得エラー:', err)
      setError('データの取得に失敗しました: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 初回データ取得 + userRole変更時の再取得
  useEffect(() => {
    fetchData()
  }, [userRole]) // userRoleを依存配列に追加

  // ページが見えるようになったときにデータを更新
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('📋 TodayOpenStoresPage: ページが見えるようになったのでデータを更新')
        fetchData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // ページフォーカス時にもデータを更新
  useEffect(() => {
    const handleFocus = () => {
      console.log('📋 TodayOpenStoresPage: ページにフォーカスが戻ったのでデータを更新')
      fetchData()
    }

    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // 店舗状況のスタイルを取得
  const getStatusStyle = (statusType) => {
    switch (statusType) {
      case '今初回ほしいです':
        return 'bg-green-100 text-green-800 border-green-200'
      case '席に余裕があります':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case '満席に近いです':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case '本日は満席です':
        return 'bg-red-100 text-red-800 border-red-200'
      case '特別イベント開催中':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // 店舗状況の表示テキスト
  const getStatusText = (statusType) => {
    return statusType || ''
  }

  // 店舗詳細モーダルを開く
  const handleStoreClick = (store) => {
    setSelectedStore(store)
    setShowStoreModal(true)
  }

  // 店舗詳細モーダルを閉じる
  const handleCloseStoreModal = () => {
    setSelectedStore(null)
    setShowStoreModal(false)
  }

  // 今日の日付を取得（見出し用）
  const today = new Date()
  const headerDateString = today.toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short'
  })

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-2 sm:p-4">
        {/* ヘッダー */}
        <div className="mb-3 sm:mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            本日の営業店舗 {headerDateString}
          </h1>
        </div>

        {/* ローディング状態 */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">データを読み込み中...</span>
          </div>
        )}

        {/* エラー状態 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* メインコンテンツ */}
        {!loading && !error && (
          <>
            {/* 統計情報 */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-white rounded-lg shadow-md p-2 border-l-4 border-green-500">
                <div className="flex flex-col items-center">
                  <div className="text-green-600 text-base mb-1">🏪</div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600">営業中</p>
                    <p className="text-base font-bold text-gray-900">{openStores.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-2 border-l-4 border-yellow-500">
                <div className="flex flex-col items-center">
                  <div className="text-yellow-600 text-base mb-1">⚠️</div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600">未更新</p>
                    <p className="text-base font-bold text-gray-900">
                      {openStores.filter(store => !store.hasMonthlyUpdate).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-2 border-l-4 border-blue-500">
                <div className="flex flex-col items-center">
                  <div className="text-blue-600 text-base mb-1">✅</div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600">更新済み</p>
                    <p className="text-base font-bold text-gray-900">
                      {totalStoresWithMonthlyUpdate}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 店舗一覧 */}
            {openStores.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏪</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  本日営業中の店舗はありません
                </h3>
                <p className="text-gray-600">
                  すべての店舗が店休日に設定されています
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-base font-semibold text-gray-900">
                    営業中店舗一覧 ({openStores.length}店舗)
                  </h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {openStores.map((store) => {
                    const latestStatus = storeStatuses[store.store_id]
                    const statusType = latestStatus?.status_type
                    const isRecommended = userRole === 'outstaff' && recommendedStores.has(store.store_id)
                    
                    return (
                      <div 
                        key={store.id} 
                        className={`pt-2 px-3 pb-1.5 transition-colors cursor-pointer ${
                          isRecommended 
                            ? 'bg-green-50 hover:bg-green-100' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleStoreClick(store)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            {/* 店舗名と更新状況 */}
                            <div className="flex items-center mb-0.5">
                              <h3 className="text-base font-semibold text-gray-900 mr-2">
                                {store.name}
                              </h3>
                              
                              {/* 店休日更新状況マーク */}
                              {!store.hasMonthlyUpdate && (
                                <span className="px-1 py-0.5 bg-yellow-100 text-yellow-800 rounded border border-yellow-200 flex items-center" style={{fontSize: '9px'}}>
                                  ⚠未更新
                                </span>
                              )}
                            </div>

                            {/* 営業時間 */}
                            <div className="flex items-center text-xs text-gray-600 mb-0.5">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              営業時間: {store.open_time ? store.open_time.slice(0, 5) : '20:00'} - {store.close_time ? store.close_time.slice(0, 5) : '23:30'}
                            </div>

                            {/* 料金情報（管理者のみ表示） */}
                            {userRole === 'admin' && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mt-1">
                                <div className="text-gray-600">
                                  <span className="font-medium">基本料金:</span>
                                  <div className="text-gray-900">{(store.base_fee != null ? store.base_fee : 0).toLocaleString()}円</div>
                                </div>
                                <div className="text-gray-600">
                                  <span className="font-medium">パネル代:</span>
                                  <div className="text-gray-900">{(store.panel_fee != null ? store.panel_fee : 0).toLocaleString()}円</div>
                                </div>
                                <div className="text-gray-600">
                                  <span className="font-medium">保証本数:</span>
                                  <div className="text-gray-900">{store.guarantee_count != null ? store.guarantee_count : 0}本</div>
                                </div>
                                <div className="text-gray-600">
                                  <span className="font-medium">単価:</span>
                                  <div className="text-gray-900">{(store.charge_per_person != null ? store.charge_per_person : 0).toLocaleString()}円</div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 当月紹介数と店舗状況 */}
                          <div className="ml-3 flex-shrink-0 flex flex-col items-end">
                            {/* 当月紹介数 */}
                            <div className="text-xs text-gray-500 mb-0.5">当月紹介数</div>
                            {store.guarantee_count > 0 ? (
                              (store.monthlyIntroductions || 0) >= store.guarantee_count ? (
                                // 保証達成：紹介数のみ表示
                                <div className="text-base font-bold mb-1 text-gray-900">
                                  {store.monthlyIntroductions || 0}
                                </div>
                              ) : (
                                // 保証未達成：現在数（黒字）/残り必要数（赤字）
                                <div className="text-base font-bold mb-1">
                                  <span className="text-gray-900">{store.monthlyIntroductions || 0}</span>
                                  <span className="text-red-600">/{store.guarantee_count - (store.monthlyIntroductions || 0)}</span>
                                </div>
                              )
                            ) : (
                              <div className="text-base font-bold mb-1 text-gray-900">
                                {store.monthlyIntroductions || 0}
                              </div>
                            )}
                            
                            {/* 店舗状況 */}
                            <div className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(statusType)}`}>
                              {getStatusText(statusType)}
                            </div>
                            {latestStatus && (
                              <div className="text-xs text-gray-500 mt-0.5 text-right">
                                {new Date(latestStatus.created_at).toLocaleString('ja-JP', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}


          </>
        )}
              </div>

        {/* 店舗詳細モーダル */}
        {selectedStore && (
          <Modal
            isOpen={showStoreModal}
            onClose={handleCloseStoreModal}
            title={selectedStore.name}
          >
            <div className="space-y-4">
              {/* 基本情報 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">📋 基本情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">店舗名:</span>
                    <div className="text-gray-900">{selectedStore.name}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">店舗ID:</span>
                    <div className="text-gray-900">{selectedStore.store_id}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Open:</span>
                    <div className="text-gray-900">
                      {selectedStore.open_time ? selectedStore.open_time.slice(0, 5) : '20:00'}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">初回Close:</span>
                    <div className="text-gray-900">
                      {selectedStore.close_time ? selectedStore.close_time.slice(0, 5) : '23:30'}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">初回料金:</span>
                    <div className="text-gray-900">¥{(selectedStore.base_fee != null ? selectedStore.base_fee : 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">男性料金:</span>
                    <div className="text-gray-900">
                      {selectedStore.male_price === 0 ? '男性不可' : `¥${selectedStore.male_price?.toLocaleString() || 0}以上`}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">身分証要件:</span>
                    <div className="text-gray-900">{selectedStore.id_required || '未設定'}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">来店制限:</span>
                    <div className="text-gray-900">{selectedStore.visit_restriction || '20歳以上'}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">ホスホス:</span>
                    <div className="text-gray-900">
                      {selectedStore.hoshos_url ? (
                        <a 
                          href={selectedStore.hoshos_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                        >
                          ホスホス
                        </a>
                      ) : (
                        <span className="text-gray-500">未設定</span>
                      )}
                    </div>
                  </div>
                                     <div>
                     {selectedStore.store_phone ? (
                       <a 
                         href={`tel:${selectedStore.store_phone}`}
                         className="inline-block px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors w-full text-center"
                       >
                         📞 電話する
                       </a>
                     ) : (
                       <div className="text-sm text-gray-500">電話番号未設定</div>
                     )}
                   </div>
                </div>
              </div>

              {/* ボタン */}
              <div className="flex justify-end">
                <button
                  onClick={handleCloseStoreModal}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </Modal>
        )}
      </Layout>
    )
  }

  export default TodayOpenStoresPage 