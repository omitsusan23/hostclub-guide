import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';

const HolidayCalendar = () => {
  const { user, getUserStoreId } = useApp();
  const [holidays, setHolidays] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 現在の月から3ヶ月分の期間を取得
  const getThreeMonthsPeriod = () => {
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endMonth = new Date(today.getFullYear(), today.getMonth() + 3, 0);
    
    return {
      start: currentMonth,
      end: endMonth
    };
  };

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

  // 店休日データを取得
  const fetchHolidays = async () => {
    const storeId = getUserStoreId();
    if (!storeId) return;

    try {
      setLoading(true);
      const period = getThreeMonthsPeriod();
      
      const { data, error } = await supabase
        .from('store_holidays')
        .select('date')
        .eq('store_id', storeId)
        .gte('date', period.start.toISOString().split('T')[0])
        .lte('date', period.end.toISOString().split('T')[0]);

      if (error) throw error;

      const holidaySet = new Set(data.map(item => item.date));
      setHolidays(holidaySet);
    } catch (error) {
      console.error('店休日の取得に失敗しました:', error);
      alert('店休日の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 店休日の切り替え
  const toggleHoliday = async (date) => {
    const storeId = getUserStoreId();
    if (!storeId || saving) return;

    const dateString = date.toISOString().split('T')[0];
    const isHoliday = holidays.has(dateString);

    try {
      setSaving(true);

      if (isHoliday) {
        // 店休日を削除
        const { error } = await supabase
          .from('store_holidays')
          .delete()
          .eq('store_id', storeId)
          .eq('date', dateString);

        if (error) throw error;

        const newHolidays = new Set(holidays);
        newHolidays.delete(dateString);
        setHolidays(newHolidays);
      } else {
        // 店休日を追加
        const { error } = await supabase
          .from('store_holidays')
          .insert({
            store_id: storeId,
            date: dateString
          });

        if (error) throw error;

        const newHolidays = new Set(holidays);
        newHolidays.add(dateString);
        setHolidays(newHolidays);
      }
    } catch (error) {
      console.error('店休日の更新に失敗しました:', error);
      alert('店休日の更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // 日付の表示スタイルを取得
  const getDateStyle = (date, currentMonth) => {
    const dateString = date.toISOString().split('T')[0];
    const isHoliday = holidays.has(dateString);
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

  useEffect(() => {
    fetchHolidays();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  const today = new Date();
  const months = [
    today.getMonth(),
    today.getMonth() + 1,
    today.getMonth() + 2
  ].map(month => {
    const adjustedMonth = month > 11 ? month - 12 : month;
    const year = month > 11 ? today.getFullYear() + 1 : today.getFullYear();
    return { year, month: adjustedMonth };
  });

  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="space-y-8">
      {saving && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
          保存中...
        </div>
      )}
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        <p className="font-medium">使い方:</p>
        <ul className="mt-2 text-sm space-y-1">
          <li>• 日付をクリックして店休日のON/OFF切り替えができます</li>
          <li>• 赤色の日付が店休日です</li>
          <li>• 過去の日付は変更できません</li>
        </ul>
      </div>

      {months.map(({ year, month }) => {
        const calendar = generateCalendarData(year, month);
        
        return (
          <div key={`${year}-${month}`} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
              {year}年 {monthNames[month]}
            </h3>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {calendar.flat().map((date, index) => {
                const isPast = date < new Date().setHours(0, 0, 0, 0);
                const isCurrentMonth = date.getMonth() === month;
                
                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (!isPast && isCurrentMonth) {
                        toggleHoliday(date);
                      }
                    }}
                    disabled={isPast || !isCurrentMonth || saving}
                    className={getDateStyle(date, month)}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HolidayCalendar; 