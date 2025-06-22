import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import Layout from '../components/Layout';
import HolidayCalendar from '../components/HolidayCalendar';

const StoreHolidaysPage = () => {
  const { user } = useContext(AppContext);

  // customerロール以外はアクセス不可
  if (user?.app_metadata?.role !== 'customer') {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <h2 className="text-lg font-semibold mb-2">アクセス権限がありません</h2>
            <p>このページはcustomerロールのユーザーのみアクセスできます。</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">店休日設定</h1>
          <p className="text-gray-600">
            お店の休業日を設定できます。設定した休業日は予約システムに反映されます。
          </p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              カレンダー設定
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              3ヶ月分（今月 + 翌月 + 翌々月）の店休日を設定できます
            </p>
          </div>
          
          <div className="p-6">
            <HolidayCalendar />
          </div>
        </div>

        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            店休日設定について
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <span className="font-medium">店休日の設定:</span>
                <span className="ml-2">カレンダーの日付をクリックして店休日を設定・解除できます</span>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <span className="font-medium">即座に反映:</span>
                <span className="ml-2">設定変更は即座にデータベースに保存され、予約システムに反映されます</span>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <span className="font-medium">過去日制限:</span>
                <span className="ml-2">過去の日付は変更できません。今日以降の日付のみ設定可能です</span>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <span className="font-medium">3ヶ月間対応:</span>
                <span className="ml-2">当月から3ヶ月先まで設定できます。定期的に更新してください</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StoreHolidaysPage; 