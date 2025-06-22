import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';

const HolidayCalendar = () => {
  const { user, getUserStoreId } = useApp();
  const [holidays, setHolidays] = useState(new Set()); // サーバーから取得した店休日
  const [pendingChanges, setPendingChanges] = useState(new Set()); // ローカルで変更中の店休日
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date()); // 現在表示中の月
  const [storeCreatedAt, setStoreCreatedAt] = useState(null); // ストア作成日（契約開始月）
  const [availableDates, setAvailableDates] = useState(new Set()); // 利用可能な月（店休日データが存在する月）

  // 指定月のカレンダーデータを生成
  const generateCalendarData = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // 日曜日から開始

    const calendar = [];
    const current = new Date(startDate);

    // 6週間分のカレンダーを生成
    for (let week = 0; week < 6; week++) {
      const weekData = [];
      for (let day = 0; day < 7; day++) {
        weekData.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      calendar.push(weekData);
      
      // 翌月の日付が含まれている場合は終了
      if (current.getMonth() !== month && week >= 4) break;
    }

    return calendar;
  };

  // ストア情報の取得（契約開始月確認用）
  const fetchStoreInfo = async () => {
    const storeId = getUserStoreId();
    if (!storeId) return;

    try {
      const { data, error } = await supabase
        .from('stores')
        .select('created_at')
        .eq('store_id', storeId)
        .single();

      if (error) throw error;
      
      setStoreCreatedAt(new Date(data.created_at));
    } catch (error) {
      console.error('ストア情報の取得に失敗しました:', error);
    }
  };

  // 利用可能な月を取得（店休日データが存在する月）
  const fetchAvailableDates = async () => {
    const storeId = getUserStoreId();
    if (!storeId) return;

    try {
      // 6ヶ月分の範囲で店休日データを取得
      const today = new Date();
      const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);
      const sixMonthsLater = new Date(today.getFullYear(), today.getMonth() + 6, 0);

      const { data, error } = await supabase
        .from('store_holidays')
        .select('date')
        .eq('store_id', storeId)
        .gte('date', sixMonthsAgo.toISOString().split('T')[0])
        .lte('date', sixMonthsLater.toISOString().split('T')[0]);

      if (error) throw error;

      // 年月のセットを作成
      const availableMonths = new Set();
      data.forEach(item => {
        const date = new Date(item.date);
        const yearMonth = `${date.getFullYear()}-${date.getMonth()}`;
        availableMonths.add(yearMonth);
      });

      setAvailableDates(availableMonths);
    } catch (error) {
      console.error('利用可能な月の取得に失敗しました:', error);
    }
  };

  // 店休日データを取得（表示中の月のみ）
  const fetchHolidays = async (year, month) => {
    const storeId = getUserStoreId();
    if (!storeId) return;

    try {
      setLoading(true);
      
      // 表示月の最初の日と最後の日を取得
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      
      const { data, error } = await supabase
        .from('store_holidays')
        .select('date')
        .eq('store_id', storeId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      if (error) throw error;

      const holidaySet = new Set(data.map(item => item.date));
      setHolidays(holidaySet);
      setPendingChanges(new Set(holidaySet)); // 初期値として設定
    } catch (error) {
      console.error('店休日の取得に失敗しました:', error);
      alert('店休日の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // ローカルでの店休日切り替え（即座に更新しない）
  const toggleHolidayLocal = (date) => {
    const dateString = date.toISOString().split('T')[0];
    const newPendingChanges = new Set(pendingChanges);
    
    if (newPendingChanges.has(dateString)) {
      newPendingChanges.delete(dateString);
    } else {
      newPendingChanges.add(dateString);
    }
    
    setPendingChanges(newPendingChanges);
  };

  // 月の変更に対する一括更新
  const saveChanges = async () => {
    const storeId = getUserStoreId();
    
    if (!storeId || saving) {
      return;
    }

    try {
      setSaving(true);

      // 現在のサーバー状態と変更後の状態を比較
      const originalHolidays = holidays;
      const newHolidays = pendingChanges;

      // 削除対象：サーバーにあるがローカルにない
      const toDelete = [...originalHolidays].filter(date => !newHolidays.has(date));
      
      // 追加対象：ローカルにあるがサーバーにない
      const toAdd = [...newHolidays].filter(date => !originalHolidays.has(date));

      // 削除処理
      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('store_holidays')
          .delete()
          .eq('store_id', storeId)
          .in('date', toDelete);

        if (deleteError) throw deleteError;
      }

      // 追加処理
      if (toAdd.length > 0) {
        const insertData = toAdd.map(date => ({
          store_id: storeId,
          date: date
        }));

        const { error: insertError } = await supabase
          .from('store_holidays')
          .insert(insertData);

        if (insertError) throw insertError;
      }

      // 状態を更新
      setHolidays(new Set(pendingChanges));
      alert('店休日を更新しました');

    } catch (error) {
      console.error('店休日の更新に失敗しました:', error);
      alert('店休日の更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // 前月に移動可能かチェック
  const canGoToPreviousMonth = () => {
    if (!storeCreatedAt) return false;
    
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const targetDate = new Date(currentDate);
    targetDate.setMonth(targetDate.getMonth() - 1);
    
    // 契約開始月より前は不可
    const storeCreatedMonth = new Date(storeCreatedAt.getFullYear(), storeCreatedAt.getMonth(), 1);
    if (targetDate < storeCreatedMonth) return false;
    
    // 6ヶ月より前は不可
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    if (targetDate < sixMonthsAgo) return false;
    
    // 当月以降は常に移動可能、過去の月は店休日データが存在する場合のみ
    if (targetDate >= currentMonth) {
      return true;
    } else {
      const yearMonth = `${targetDate.getFullYear()}-${targetDate.getMonth()}`;
      return availableDates.has(yearMonth);
    }
  };

  // 次月に移動可能かチェック
  const canGoToNextMonth = () => {
    const today = new Date();
    const targetDate = new Date(currentDate);
    targetDate.setMonth(targetDate.getMonth() + 1);
    
    // 6ヶ月より先は不可
    const sixMonthsLater = new Date(today.getFullYear(), today.getMonth() + 6, 0);
    return targetDate <= sixMonthsLater;
  };

  // 前月へ移動
  const goToPreviousMonth = () => {
    if (!canGoToPreviousMonth()) return;
    
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  // 次月へ移動
  const goToNextMonth = () => {
    if (!canGoToNextMonth()) return;
    
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  // 変更があるかチェック
  const hasChanges = () => {
    // サイズが違う場合
    if (holidays.size !== pendingChanges.size) {
      return true;
    }
    
    // holidaysにあってpendingChangesにないものをチェック
    for (let date of holidays) {
      if (!pendingChanges.has(date)) {
        return true;
      }
    }
    
    // pendingChangesにあってholidaysにないものをチェック
    for (let date of pendingChanges) {
      if (!holidays.has(date)) {
        return true;
      }
    }
    
    return false;
  };

  // 日付の表示スタイルを取得
  const getDateStyle = (date, currentMonth) => {
    const dateString = date.toISOString().split('T')[0];
    const isHoliday = pendingChanges.has(dateString); // ローカル状態を参照
    const isCurrentMonth = date.getMonth() === currentMonth;
    const isToday = date.toDateString() === new Date().toDateString();
    const isPast = date < new Date().setHours(0, 0, 0, 0);

    let baseClasses = "w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-200 text-sm font-medium ";

    if (!isCurrentMonth) {
      baseClasses += "text-gray-300 ";
    } else if (isPast) {
      baseClasses += "text-gray-400 cursor-not-allowed ";
    } else {
      baseClasses += "text-gray-700 hover:bg-gray-100 ";
    }

    if (isHoliday && isCurrentMonth && !isPast) {
      baseClasses += "bg-red-500 text-white hover:bg-red-600 ";
    } else if (isHoliday && isPast) {
      baseClasses += "bg-red-300 text-white ";
    }

    if (isToday && !isHoliday) {
      baseClasses += "border-2 border-blue-500 ";
    }

    return baseClasses;
  };

  // 初期化時にストア情報と利用可能な月を取得
  useEffect(() => {
    if (user) {
      fetchStoreInfo();
      fetchAvailableDates();
    }
  }, [user]);

  // 月が変更されたときに店休日データを再取得
  useEffect(() => {
    if (user) {
      fetchHolidays(currentDate.getFullYear(), currentDate.getMonth());
    }
  }, [user, currentDate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  const calendar = generateCalendarData(currentDate.getFullYear(), currentDate.getMonth());
  
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        <p className="font-medium">使い方:</p>
        <ul className="mt-2 text-sm space-y-1">
          <li>• 日付をクリックして店休日のON/OFF切り替えができます</li>
          <li>• 赤色の日付が店休日です</li>
          <li>• 過去の日付は変更できません</li>
          <li>• 変更後は「更新」ボタンで保存してください</li>
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {/* 月ナビゲーション */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousMonth}
            disabled={!canGoToPreviousMonth()}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
              canGoToPreviousMonth()
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            ← 前月
          </button>
          
          <h3 className="text-xl font-bold text-gray-800">
            {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
          </h3>
          
          <button
            onClick={goToNextMonth}
            disabled={!canGoToNextMonth()}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
              canGoToNextMonth()
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            次月 →
          </button>
        </div>
        
        {/* カレンダーヘッダー */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* カレンダー本体 */}
        <div className="grid grid-cols-7 gap-1 mb-6">
          {calendar.flat().map((date, index) => {
            const isPast = date < new Date().setHours(0, 0, 0, 0);
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            
            return (
              <button
                key={index}
                onClick={() => {
                  if (!isPast && isCurrentMonth) {
                    toggleHolidayLocal(date);
                  }
                }}
                disabled={isPast || !isCurrentMonth}
                className={getDateStyle(date, currentDate.getMonth())}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        {/* 更新ボタン */}
        <div className="flex justify-center">
          <button
            onClick={saveChanges}
            disabled={!hasChanges() || saving}
            className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
              hasChanges() && !saving
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving ? '更新中...' : '更新'}
          </button>
        </div>

        {hasChanges() && !saving && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-center">
            変更があります。「更新」ボタンで保存してください。
          </div>
        )}
      </div>
    </div>
  );
};

export default HolidayCalendar; 