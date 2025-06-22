import React, { useState, useEffect } from 'react';

const StaffEditModal = ({ isOpen, staff, onSave, onDelete, onClose, loading }) => {
  const [formData, setFormData] = useState({
    staff_id: '',
    display_name: '',
    password: 'ryota123',
    notes: '',
    is_active: true
  });

  // staff propsが変更されたらフォームデータを更新
  useEffect(() => {
    if (staff) {
      console.log('👤 Setting form data from staff:', staff);
      const newFormData = {
        staff_id: staff.staff_id || '',
        display_name: staff.display_name || '',
        password: 'ryota123', // パスワードは初期値のまま
        notes: staff.notes || '',
        is_active: staff.is_active !== undefined ? staff.is_active : true
      };
      console.log('📝 New form data:', newFormData);
      setFormData(newFormData);
    }
  }, [staff]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('📝 StaffEditModal form submitted with data:', formData);
    onSave(formData);
  };

  const handleDelete = () => {
    if (window.confirm(`本当に「${staff?.display_name}」を削除しますか？\n\n削除されたスタッフは非アクティブ状態になり、ログインできなくなります。`)) {
      console.log('🗑️ Staff delete requested for:', staff?.id);
      onDelete(staff?.id);
    }
  };

  if (!isOpen || !staff) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {staff.display_name} - スタッフ編集
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">👤 基本情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    表示名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                    placeholder="例: 田中 太郎"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    スタッフID <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={formData.staff_id}
                      onChange={(e) => setFormData({...formData, staff_id: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                      placeholder="tanaka"
                    />
                    <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500 text-sm">
                      @hostclub.local
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    パスワード
                  </label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="ryota123"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    変更する場合のみ入力してください
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ステータス
                  </label>
                  <select
                    value={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={true}>アクティブ</option>
                    <option value={false}>非アクティブ</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 備考 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📝 備考</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  備考・メモ
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="役職、担当エリア、その他メモなど"
                  rows={4}
                />
              </div>
            </div>

            {/* アカウント情報 */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">🔐 アカウント情報</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>📧 メールアドレス: {formData.staff_id ? `${formData.staff_id}@hostclub.local` : '（スタッフIDを入力してください）'}</div>
                <div>🌐 ログインURL: https://staff.susukino-hostclub-guide.online</div>
                <div>🔑 現在のパスワード: {formData.password}</div>
                <div>📱 ステータス: 
                  <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                    formData.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {formData.is_active ? 'アクティブ' : '非アクティブ'}
                  </span>
                </div>
              </div>
            </div>

            {/* 危険な操作 */}
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h3 className="text-lg font-medium text-red-900 mb-3">⚠️ 危険な操作</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 font-medium">スタッフを削除</p>
                  <p className="text-xs text-red-600">削除されたスタッフは非アクティブになり、ログインできなくなります</p>
                </div>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  削除
                </button>
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
                className="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
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

export default StaffEditModal; 