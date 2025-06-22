import React, { useState, useEffect } from 'react';

const StoreEditModal = ({ isOpen, store, onSave, onClose, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    store_id: '',
    open_time: '20:00',
    close_time: '23:30',
    base_price: 0,
    id_required: '顔＝保険証＋キャッシュ',
    male_price: 0,
    panel_fee: 120000,
    guarantee_count: 25,
    penalty_fee: 20000,
    unit_price: 1000,
    is_transfer: false
  });

  // store propsが変更されたらフォームデータを更新
  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        store_id: store.store_id || '',
        open_time: store.open_time || '20:00',
        close_time: store.close_time || '23:30',
        base_price: store.base_price || 0,
        id_required: store.id_required || '顔＝保険証＋キャッシュ',
        male_price: store.male_price || 0,
        panel_fee: store.panel_fee || 120000,
        guarantee_count: store.guarantee_count || 25,
        penalty_fee: store.penalty_fee || 20000,
        unit_price: store.unit_price || 1000,
        is_transfer: store.is_transfer || false
      });
    }
  }, [store]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen || !store) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {store.name} - 編集
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* 基本情報 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📋 基本情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    店舗名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    店舗ID <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={formData.store_id}
                      onChange={(e) => setFormData({...formData, store_id: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500 text-sm">
                      .susukino-hostclub-guide.online
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">営業開始時間</label>
                  <input
                    type="time"
                    value={formData.open_time}
                    onChange={(e) => setFormData({...formData, open_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">営業終了時間</label>
                  <input
                    type="time"
                    value={formData.close_time}
                    onChange={(e) => setFormData({...formData, close_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 料金情報 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">💰 料金情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">基本料金</label>
                  <input
                    type="number"
                    value={formData.base_price}
                    onChange={(e) => setFormData({...formData, base_price: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">男性料金</label>
                  <input
                    type="number"
                    value={formData.male_price}
                    onChange={(e) => setFormData({...formData, male_price: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">パネル料</label>
                  <input
                    type="number"
                    value={formData.panel_fee}
                    onChange={(e) => setFormData({...formData, panel_fee: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">単価</label>
                  <input
                    type="number"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({...formData, unit_price: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* 保証・ペナルティ情報 */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">⚖️ 保証・ペナルティ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">保証本数</label>
                  <input
                    type="number"
                    value={formData.guarantee_count}
                    onChange={(e) => setFormData({...formData, guarantee_count: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ペナルティ料金</label>
                  <input
                    type="number"
                    value={formData.penalty_fee}
                    onChange={(e) => setFormData({...formData, penalty_fee: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* その他の設定 */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">⚙️ その他の設定</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">身分証要件</label>
                  <select
                    value={formData.id_required}
                    onChange={(e) => setFormData({...formData, id_required: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="顔＝保険証＋キャッシュ">顔＝保険証＋キャッシュ</option>
                    <option value="顔＝保険証＋クレジット">顔＝保険証＋クレジット</option>
                    <option value="顔必須">顔必須</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">振込対応</label>
                  <select
                    value={formData.is_transfer}
                    onChange={(e) => setFormData({...formData, is_transfer: e.target.value === 'true'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={false}>対応不可</option>
                    <option value={true}>対応可能</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* フッター */}
          <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? '更新中...' : '変更を保存'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StoreEditModal; 