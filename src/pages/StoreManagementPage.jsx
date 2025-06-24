import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import StoreDetailModal from '../components/StoreDetailModal'
import StoreEditModal from '../components/StoreEditModal'
import { useApp } from '../contexts/AppContext'
import { addNewStore, getAllStores, generateStoreId, checkStoreIdExists, updateStore } from '../utils/storeManagement.js'

const StoreManagementPage = () => {
  const { hasAdminPermissions } = useApp()
  const [showStoreModal, setShowStoreModal] = useState(false)
  const [stores, setStores] = useState([])
  const [loadingStores, setLoadingStores] = useState(true)
  const [newStore, setNewStore] = useState({
    name: '',
    store_id: '',
    open_time: '',
    close_time: '',
    base_price: 0,
    id_required: '',
    male_price: 0,
    panel_fee: 0,
    guarantee_count: 0,
    penalty_fee: 0,
    charge_per_person: 0,
    is_transfer: false,
    hoshos_url: '',
    store_phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [selectedStore, setSelectedStore] = useState(null)
  const [showStoreDetailModal, setShowStoreDetailModal] = useState(false)
  const [showStoreEditModal, setShowStoreEditModal] = useState(false)

  // 権限チェック
  if (!hasAdminPermissions()) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <h2 className="text-lg font-semibold mb-2">アクセス権限がありません</h2>
            <p>このページは管理者のみアクセスできます。</p>
          </div>
        </div>
      </Layout>
    )
  }

  // 店舗データを取得
  useEffect(() => {
    loadStores()
  }, [])

  const loadStores = async () => {
    setLoadingStores(true)
    try {
      const result = await getAllStores()
      if (result.success) {
        setStores(result.data)
      } else {
        console.error('Failed to load stores:', result.error)
        setMessage('店舗データの読み込みに失敗しました')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error loading stores:', error)
      setMessage('店舗データの読み込み中にエラーが発生しました')
      setMessageType('error')
    } finally {
      setLoadingStores(false)
    }
  }

  const handleAddStore = async () => {
    if (!newStore.name || !newStore.store_id) {
      setMessage('店舗名と店舗IDは必須です')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')
    
    try {
      const exists = await checkStoreIdExists(newStore.store_id)
      if (exists) {
        setMessage('この店舗IDは既に使用されています')
        setMessageType('error')
        return
      }

      const result = await addNewStore(newStore)
      
      if (result.success) {
        setMessage(result.message || `✅ ${newStore.name} を追加しました！`)
        setMessageType('success')
        
        setNewStore({
          name: '',
          store_id: '',
          open_time: '',
          close_time: '',
          base_price: 0,
          id_required: '',
          male_price: 0,
          panel_fee: 0,
          guarantee_count: 0,
          penalty_fee: 0,
          charge_per_person: 0,
          is_transfer: false,
          hoshos_url: '',
          store_phone: ''
        })
        
        loadStores()
        
        setTimeout(() => {
          setShowStoreModal(false)
          setMessage('')
          setMessageType('')
        }, 3000)
        
      } else {
        setMessage(`❌ エラー: ${result.error}`)
        setMessageType('error')
      }
      
    } catch (error) {
      console.error('Store addition error:', error)
      setMessage('❌ 店舗追加中に予期しないエラーが発生しました')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleNameChange = (name) => {
    setNewStore({
      ...newStore, 
      name,
      store_id: newStore.store_id || generateStoreId(name)
    })
  }

  const handleStoreClick = (store) => {
    setSelectedStore(store)
    setShowStoreDetailModal(true)
  }

  const handleCloseStoreDetail = () => {
    setSelectedStore(null)
    setShowStoreDetailModal(false)
  }

  const handleEditStore = (store) => {
    setSelectedStore(store)
    setShowStoreDetailModal(false)
    setShowStoreEditModal(true)
  }

  const handleCloseStoreEdit = () => {
    setSelectedStore(null)
    setShowStoreEditModal(false)
  }

  const handleUpdateStore = async (formData) => {
    if (!selectedStore) {
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const result = await updateStore(selectedStore.id, formData)
      
      if (result.success) {
        setMessage(result.message || `✅ ${formData.name} を更新しました！`)
        setMessageType('success')
        
        loadStores()
        
        setTimeout(() => {
          setShowStoreEditModal(false)
          setSelectedStore(null)
          setMessage('')
          setMessageType('')
        }, 2000)
        
      } else {
        setMessage(`❌ エラー: ${result.error}`)
        setMessageType('error')
      }
      
    } catch (error) {
      console.error('Store update error:', error)
      setMessage('❌ 店舗更新中に予期しないエラーが発生しました')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        {/* ヘッダー */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            🏢 店舗管理
          </h2>
          <p className="text-gray-600">
            店舗の登録・編集・削除を管理できます。
          </p>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            messageType === 'success' ? 'bg-green-50 text-green-800' :
            messageType === 'error' ? 'bg-red-50 text-red-800' :
            'bg-yellow-50 text-yellow-800'
          }`}>
            {message}
          </div>
        )}

        {/* 新規店舗追加ボタン */}
        <div className="mb-6">
          <button
            onClick={() => setShowStoreModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ➕ 新規店舗追加
          </button>
        </div>

        {/* 店舗一覧 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            登録店舗一覧 ({stores.length}店舗)
          </h3>
          
          {loadingStores ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">店舗データを読み込み中...</p>
            </div>
          ) : stores.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              登録されている店舗がありません
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stores.map((store) => (
                <div
                  key={store.id}
                  onClick={() => handleStoreClick(store)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <h4 className="font-medium text-gray-900 mb-2">{store.name}</h4>
                  <p className="text-sm text-gray-600 mb-1">ID: {store.store_id}</p>
                  <p className="text-sm text-gray-600 mb-1">
                    営業時間: {store.open_time} - {store.close_time}
                  </p>
                  <p className="text-sm text-gray-600">
                    パネル料金: ¥{store.panel_fee?.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 新規店舗追加モーダル */}
        <Modal
          isOpen={showStoreModal}
          onClose={() => setShowStoreModal(false)}
          title="新規店舗追加"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  店舗名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newStore.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: クラブプレミアム"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  店舗ID <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={newStore.store_id}
                    onChange={(e) => setNewStore({...newStore, store_id: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="premium"
                  />
                  <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500 text-sm">
                    .susukino-hostclub-guide.online
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Open
                </label>
                <input
                  type="time"
                  value={newStore.open_time}
                  onChange={(e) => setNewStore({...newStore, open_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  初回Close
                </label>
                <input
                  type="time"
                  value={newStore.close_time}
                  onChange={(e) => setNewStore({...newStore, close_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  初回料金
                </label>
                <input
                  type="number"
                  value={newStore.base_price}
                  onChange={(e) => setNewStore({...newStore, base_price: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  男性料金
                </label>
                <input
                  type="number"
                  value={newStore.male_price}
                  onChange={(e) => setNewStore({...newStore, male_price: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ホスホスURL
                </label>
                <input
                  type="url"
                  value={newStore.hoshos_url}
                  onChange={(e) => setNewStore({...newStore, hoshos_url: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://hoshos.jp/shop/..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  店舗番号
                </label>
                <input
                  type="tel"
                  value={newStore.store_phone}
                  onChange={(e) => setNewStore({...newStore, store_phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="011-555-1234"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  パネル料
                </label>
                <input
                  type="number"
                  value={newStore.panel_fee}
                  onChange={(e) => setNewStore({...newStore, panel_fee: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="120000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  一人単価
                </label>
                <input
                  type="number"
                  value={newStore.charge_per_person}
                  onChange={(e) => setNewStore({...newStore, charge_per_person: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  保証本数
                </label>
                <input
                  type="number"
                  value={newStore.guarantee_count}
                  onChange={(e) => setNewStore({...newStore, guarantee_count: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="25"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  保証割れ料金
                </label>
                <input
                  type="number"
                  value={newStore.penalty_fee}
                  onChange={(e) => setNewStore({...newStore, penalty_fee: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="20000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  振込/現金
                </label>
                <select
                  value={newStore.is_transfer}
                  onChange={(e) => setNewStore({...newStore, is_transfer: e.target.value === 'true'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={false}>現金</option>
                  <option value={true}>振込</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  身分証要件
                </label>
                <select
                  value={newStore.id_required}
                  onChange={(e) => setNewStore({...newStore, id_required: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="顔＝保険証＋キャッシュ">顔＝保険証＋キャッシュ</option>
                  <option value="顔＝保険証＋クレジット">顔＝保険証＋クレジット</option>
                  <option value="顔必須">顔必須</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setShowStoreModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddStore}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '追加中...' : '店舗を追加'}
              </button>
            </div>
          </div>
        </Modal>

        {/* 店舗詳細モーダル */}
        <StoreDetailModal
          isOpen={showStoreDetailModal}
          onClose={handleCloseStoreDetail}
          store={selectedStore}
          onEdit={handleEditStore}
        />

        {/* 店舗編集モーダル */}
        <StoreEditModal
          isOpen={showStoreEditModal}
          onClose={handleCloseStoreEdit}
          store={selectedStore}
          onSave={handleUpdateStore}
        />
      </div>
    </Layout>
  )
}

export default StoreManagementPage 