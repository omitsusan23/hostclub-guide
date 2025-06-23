import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SwipeableVisitItem = ({ record, store, onDelete }) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayName, setDisplayName] = useState(record.staff_name || '不明');
  const startX = useRef(0);
  const currentX = useRef(0);
  const isTracking = useRef(false);

  const time = new Date(record.guided_at).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // staff_nameがメールアドレス形式の場合、staffsテーブルからdisplay_nameを取得
  useEffect(() => {
    const fetchDisplayName = async () => {
      if (!record.staff_name) return;
      
      // メールアドレス形式かチェック（@を含むかどうか）
      if (record.staff_name.includes('@')) {
        try {
          const { data, error } = await supabase
            .from('staffs')
            .select('display_name')
            .eq('email', record.staff_name)
            .single();
          
          if (!error && data?.display_name) {
            setDisplayName(data.display_name);
          }
        } catch (error) {
          console.error('スタッフ表示名取得エラー:', error);
          // エラーの場合は元のstaff_nameを使用
        }
      }
    };

    fetchDisplayName();
  }, [record.staff_name]);

  // タッチ開始
  const handleTouchStart = (e) => {
    if (isDeleting) return;
    
    isTracking.current = true;
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
  };

  // タッチ移動
  const handleTouchMove = (e) => {
    if (!isTracking.current || isDeleting) return;

    currentX.current = e.touches[0].clientX;
    const deltaX = currentX.current - startX.current;
    
    // 左スワイプのみ対応（マイナス値）
    if (deltaX < 0) {
      const moveX = Math.max(deltaX, -80); // 最大80px左に移動
      setTranslateX(moveX);
    }
  };

  // タッチ終了
  const handleTouchEnd = () => {
    if (!isTracking.current || isDeleting) return;
    
    isTracking.current = false;
    const deltaX = currentX.current - startX.current;
    
    // 40px以上左にスワイプした場合は削除ボタンを表示
    if (deltaX < -40) {
      setTranslateX(-80);
    } else {
      setTranslateX(0);
    }
  };

  // 削除ボタンクリック
  const handleDeleteClick = () => {
    setIsDeleting(true);
    onDelete(record, store?.name || record.store_id);
  };

  // リセット（外部から呼び出し用）
  const resetPosition = () => {
    setTranslateX(0);
    setIsDeleting(false);
  };

  // 削除が完了した後にリセット
  React.useEffect(() => {
    if (isDeleting) {
      const timer = setTimeout(() => {
        resetPosition();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isDeleting]);

  return (
    <div className="relative bg-gray-50 rounded-lg overflow-hidden">
      {/* 背景の削除ボタン */}
      <div className="absolute right-0 top-0 h-full w-20 bg-red-500 flex items-center justify-center">
        <button
          onClick={handleDeleteClick}
          className="text-white text-sm font-medium px-3 py-1 rounded"
          disabled={isDeleting}
        >
          {isDeleting ? '削除中...' : '削除'}
        </button>
      </div>

      {/* メインコンテンツ */}
      <div
        className="relative bg-gray-50 rounded-lg transition-transform duration-200 ease-out"
        style={{
          transform: `translateX(${translateX}px)`,
          opacity: isDeleting ? 0.5 : 1
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        // マウスイベントも追加（PC開発時のため）
        onMouseDown={(e) => {
          isTracking.current = true;
          startX.current = e.clientX;
          currentX.current = e.clientX;
        }}
        onMouseMove={(e) => {
          if (!isTracking.current || isDeleting) return;
          currentX.current = e.clientX;
          const deltaX = currentX.current - startX.current;
          if (deltaX < 0) {
            const moveX = Math.max(deltaX, -80);
            setTranslateX(moveX);
          }
        }}
        onMouseUp={() => {
          if (!isTracking.current || isDeleting) return;
          isTracking.current = false;
          const deltaX = currentX.current - startX.current;
          if (deltaX < -40) {
            setTranslateX(-80);
          } else {
            setTranslateX(0);
          }
        }}
        onMouseLeave={() => {
          if (isTracking.current) {
            isTracking.current = false;
            setTranslateX(0);
          }
        }}
      >
        <div className="flex items-center gap-4 p-2">
          <div className="font-medium text-sm min-w-0 flex-shrink-0">
            {store?.name || record.store_id}
          </div>
          <div className="text-sm text-gray-600 flex-shrink-0">
            {record.guest_count}名 - {time}
          </div>
          <div className="text-sm text-gray-500 ml-auto flex-shrink-0">
            担当: {displayName}
          </div>
        </div>
      </div>

      {/* スワイプヒント（初回のみ表示する場合は状態管理を追加） */}
      {translateX === 0 && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs pointer-events-none">
          ←
        </div>
      )}
    </div>
  );
};

export default SwipeableVisitItem; 