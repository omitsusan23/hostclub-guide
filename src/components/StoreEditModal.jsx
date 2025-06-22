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
    is_transfer: false,
    hoshos_url: '',
    store_phone: ''
  });

  // store propsが変更されたらフォームデータを更新
  useEffect(() => {
    if (store) {
      console.log('🏪 Setting form data from store:', store);
      const newFormData = {
        name: store.name || '',
        store_id: store.store_id || '',
        open_time: store.open_time || '20:00',
        close_time: store.close_time || '23:30',
        base_price: parseInt(store.base_price) || 0,
        id_required: store.id_required || '顔＝保険証＋キャッシュ',
        male_price: parseInt(store.male_price) || 0,
        panel_fee: parseInt(store.panel_fee) || 120000,
        guarantee_count: parseInt(store.guarantee_count) || 25,
        penalty_fee: parseInt(store.penalty_fee) || 20000,
        unit_price: parseInt(store.unit_price) || 1000,
        is_transfer: Boolean(store.is_transfer),
        hoshos_url: store.hoshos_url || '',
        store_phone: store.store_phone || ''
      };
      console.log('📝 New form data:', newFormData);
      setFormData(newFormData);
    }
  }, [store]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('📝 StoreEditModal form submitted with data:', formData);
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Open</label>
                  <input
                    type="time"
                    value={formData.open_time}
                    onChange={(e) => setFormData({...formData, open_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">初回Close</label>
                  <input
                    type="time"
                    value={formData.close_time}
                    onChange={(e) => setFormData({...formData, close_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">初回料金</label>
                  <input
                    type="number"
                    value={formData.base_price}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                      console.log('🔢 Base price changed:', { input: e.target.value, parsed: value });
                      setFormData({...formData, base_price: value});
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">男性料金</label>
                  <input
                    type="number"
                    value={formData.male_price}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                      console.log('🔢 Male price changed:', { input: e.target.value, parsed: value });
                      setFormData({...formData, male_price: value});
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">ホスホスURL</label>
                  <input
                    type="url"
                    value={formData.hoshos_url}
                    onChange={(e) => setFormData({...formData, hoshos_url: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://hoshos.jp/shop/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">店舗番号</label>
                  <input
                    type="tel"
                    value={formData.store_phone}
                    onChange={(e) => setFormData({...formData, store_phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="011-555-1234"
                  />
                </div>
              </div>
            </div>

            {/* 契約内容 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📋 契約内容</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">一人単価</label>
                  <input
                    type="number"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({...formData, unit_price: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">保証割れ料金</label>
                  <input
                    type="number"
                    value={formData.penalty_fee}
                    onChange={(e) => setFormData({...formData, penalty_fee: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">振込/現金</label>
                  <select
                    value={formData.is_transfer}
                    onChange={(e) => setFormData({...formData, is_transfer: e.target.value === 'true'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={false}>現金</option>
                    <option value={true}>振込</option>
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