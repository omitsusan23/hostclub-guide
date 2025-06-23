import React from 'react';

const StoreDetailModal = ({ isOpen, store, onClose, onEdit }) => {
  if (!isOpen || !store) return null;

  // 時間から秒を削除する関数
  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.slice(0, 5); // "HH:MM:SS" → "HH:MM"
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {store.name} - 店舗詳細
            </h2>
            <button
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
            <h3 className="text-lg font-medium text-gray-900 mb-3">📋 基本情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">店舗名</label>
                <p className="mt-1 text-sm text-gray-900">{store.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">店舗ID</label>
                <p className="mt-1 text-sm text-gray-900">{store.store_id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Open</label>
                <p className="mt-1 text-sm text-gray-900">{formatTime(store.open_time)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">初回Close</label>
                <p className="mt-1 text-sm text-gray-900">{formatTime(store.close_time)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">初回料金</label>
                <p className="mt-1 text-sm text-gray-900">¥{(store.base_fee != null ? store.base_fee : 0).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">男性料金</label>
                <p className="mt-1 text-sm text-gray-900">
                  {store.male_price === 0 ? '男性不可' : `¥${store.male_price.toLocaleString()}以上`}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">身分証要件</label>
                <p className="mt-1 text-sm text-gray-900">{store.id_required || '未設定'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ホスホス</label>
                <div className="mt-1">
                  {store.hoshos_url ? (
                    <a
                      href={store.hoshos_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      ホスホス
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500">未設定</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">店舗番号</label>
                <p className="mt-1 text-sm text-gray-900">{store.store_phone || '未設定'}</p>
              </div>
            </div>
          </div>

          {/* 契約内容 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">📋 契約内容</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">パネル料</label>
                <p className="mt-1 text-sm text-gray-900">¥{(store.panel_fee != null ? store.panel_fee : 0).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">一人単価</label>
                <p className="mt-1 text-sm text-gray-900">¥{(store.charge_per_person != null ? store.charge_per_person : 0).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">保証本数</label>
                <p className="mt-1 text-sm text-gray-900">{store.guarantee_count === 0 ? 'なし' : `${store.guarantee_count}本`}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">保証割れ料金</label>
                <p className="mt-1 text-sm text-gray-900">
                  {(store.under_guarantee_penalty == null || store.under_guarantee_penalty === 0) ? 'なし' : `－¥${store.under_guarantee_penalty.toLocaleString()}`}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">振込/現金</label>
                <p className="mt-1 text-sm text-gray-900">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    store.is_transfer 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {store.is_transfer ? '振込' : '現金'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* 作成・更新日時 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">📅 履歴情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">作成日時</label>
                <p className="mt-1 text-sm text-gray-900">
                  {store.created_at ? new Date(store.created_at).toLocaleString('ja-JP') : '不明'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">最終更新</label>
                <p className="mt-1 text-sm text-gray-900">
                  {store.updated_at ? new Date(store.updated_at).toLocaleString('ja-JP') : '不明'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              閉じる
            </button>
            <button
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              onClick={() => onEdit && onEdit(store)}
            >
              編集
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreDetailModal; 