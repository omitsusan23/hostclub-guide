import React, { useEffect, useState } from 'react';
import { getMonthlyVisitRecords } from '../lib/database';

const StoreDetailModal = ({ isOpen, store, onClose, onEdit }) => {
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // 月別の紹介履歴を取得
  useEffect(() => {
    if (isOpen && store) {
      fetchMonthlyRecords();
    }
  }, [isOpen, store]);

  const fetchMonthlyRecords = async () => {
    if (!store) return;
    
    setLoading(true);
    try {
      const records = [];
      
      // 7月（先月）のデータを取得
      const julyData = await getMonthlyVisitRecords(store.store_id, 2025, 7, 'both');
      const julyCount = julyData.reduce((sum, record) => sum + (record.guest_count || 0), 0);
      
      // 8月（今月）のデータを取得
      const augustData = await getMonthlyVisitRecords(store.store_id, 2025, 8, 'both');
      const augustCount = augustData.reduce((sum, record) => sum + (record.guest_count || 0), 0);
      
      // 7月、8月の順番で追加（古い月から新しい月へ）
      records.push({
        year: 2025,
        month: 7,
        count: julyCount
      });
      
      records.push({
        year: 2025,
        month: 8,
        count: augustCount
      });
      
      setMonthlyRecords(records);
    } catch (error) {
      console.error('月別記録の取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

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
                <label className="block text-sm font-medium text-gray-700">来店制限</label>
                <p className="mt-1 text-sm text-gray-900">{store.visit_restriction || '20歳以上'}</p>
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
              <div>
                <label className="block text-sm font-medium text-gray-700">初回要請回数制限</label>
                <p className="mt-1 text-sm text-gray-900">
                  {store.first_request_limit === 0 ? '利用不可' : `${store.first_request_limit}回/月`}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">請求先宛名</label>
                <p className="mt-1 text-sm text-gray-900">
                  {store.billing_address || '未設定'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">外案内</label>
                <p className="mt-1 text-sm text-gray-900">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    store.outstaff_accessible 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {store.outstaff_accessible ? 'あり' : 'なし'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* 紹介履歴 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">📊 紹介履歴</h3>
            {loading ? (
              <p className="text-sm text-gray-500">読み込み中...</p>
            ) : monthlyRecords.length > 0 ? (
              <div className="space-y-2">
                {monthlyRecords.map((record, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-700">
                      {record.month}月
                    </span>
                    <span className="text-sm text-gray-900 font-semibold">
                      {record.count}本
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">紹介履歴がありません</p>
            )}
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