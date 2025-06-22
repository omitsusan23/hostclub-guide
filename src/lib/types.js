// データベース型定義とモックデータ

// 店舗データのモック
export const mockStores = [
  {
    id: 'store-1',
    name: 'クラブロイヤル',
    subdomain: 'royal',
    base_fee: 30000,
    guaranteed_count: 8,
    guaranteed_penalty: 5000,
    with_tax: true,
    is_invoice_eligible: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'store-2',
    name: 'クラブエース',
    subdomain: 'ace',
    base_fee: 35000,
    guaranteed_count: 10,
    guaranteed_penalty: 4000,
    with_tax: true,
    is_invoice_eligible: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'store-3',
    name: 'クラブキング',
    subdomain: 'king',
    base_fee: 25000,
    guaranteed_count: 6,
    guaranteed_penalty: 6000,
    with_tax: true,
    is_invoice_eligible: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'raize',
    name: 'RAIZE',
    subdomain: 'raize',
    base_fee: 30000,
    guaranteed_count: 8,
    guaranteed_penalty: 5000,
    with_tax: true,
    is_invoice_eligible: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

// ユーザーデータのモック
export const mockUsers = [
  {
    id: 'user-admin-1',
    email: 'admin@example.com',
    role: 'admin',
    store_id: null,
    display_name: '管理者',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'user-staff-1',
    email: 'staff1@example.com',
    role: 'staff',
    store_id: null,
    display_name: '田中スタッフ',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'user-customer-1',
    email: 'royal@example.com',
    role: 'customer',
    store_id: 'store-1',
    display_name: 'ロイヤル担当者',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

// 案内記録のモック
export const mockVisitRecords = [
  {
    id: 'visit-1',
    store_id: 'store-1',
    staff_id: 'user-staff-1',
    visitor_count: 3,
    visited_at: '2024-06-20T20:30:00Z',
    deleted: false
  },
  {
    id: 'visit-2',
    store_id: 'store-2',
    staff_id: 'user-staff-1',
    visitor_count: 2,
    visited_at: '2024-06-20T21:15:00Z',
    deleted: false
  },
  {
    id: 'visit-3',
    store_id: 'store-1',
    staff_id: 'user-staff-1',
    visitor_count: 4,
    visited_at: '2024-06-20T22:00:00Z',
    deleted: false
  }
]

// カレンダーのモック（休業日）
export const mockCalendars = [
  {
    id: 'cal-1',
    store_id: 'store-1',
    date: '2024-06-21',
    is_closed: true
  },
  {
    id: 'cal-2',
    store_id: 'store-2',
    date: '2024-06-22',
    is_closed: true
  }
]

// リアルタイム状況のモック
export const mockRealtimeStatuses = [
  {
    id: 'status-1',
    store_id: 'store-1',
    status_option: '今初回ほしいです',
    created_by: 'user-customer-1',
    created_at: '2024-06-20T22:30:00Z'
  }
]

// スタッフチャットのモック
export const mockStaffChats = [
  {
    id: 'chat-1',
    sender_id: 'user-staff-1',
    message: 'ロイヤルに3名案内完了しました',
    created_at: '2024-06-20T20:35:00Z'
  },
  {
    id: 'chat-2',
    sender_id: 'user-staff-1',
    message: 'エースも2名案内できました',
    created_at: '2024-06-20T21:20:00Z'
  }
]

// 請求設定のモック
export const mockInvoiceSettings = [
  {
    id: 'invoice-1',
    store_id: 'store-1',
    base_fee: 30000,
    guaranteed_count: 8,
    guaranteed_penalty: 5000,
    price_per_introduction: 3000,
    price_per_shortfall: 5000,
    with_tax: true
  }
]

// 月次請求のモック
export const mockMonthlyInvoices = [
  {
    id: 'monthly-1',
    store_id: 'store-1',
    month: '2024-06',
    base_fee: 30000,
    total_introductions: 12,
    shortfall_penalty: 0,
    introduction_bonus: 12000,
    subtotal: 42000,
    tax: 4200,
    total: 46200
  }
]

// ユーティリティ関数
export const getStoreById = (storeId) => {
  return mockStores.find(store => store.id === storeId)
}

export const getStoreBySubdomain = (subdomain) => {
  return mockStores.find(store => store.subdomain === subdomain)
}

export const getUserById = (userId) => {
  return mockUsers.find(user => user.id === userId)
}

export const getVisitRecordsByStoreId = (storeId) => {
  return mockVisitRecords.filter(record => record.store_id === storeId && !record.deleted)
}

export const getTodaysVisitRecords = () => {
  const today = new Date().toISOString().split('T')[0]
  return mockVisitRecords.filter(record => {
    const recordDate = new Date(record.visited_at).toISOString().split('T')[0]
    return recordDate === today && !record.deleted
  })
}

export const getStoreCalendar = (storeId, date) => {
  return mockCalendars.find(cal => cal.store_id === storeId && cal.date === date)
}

export const isStoreClosed = (storeId, date = new Date().toISOString().split('T')[0]) => {
  const calendar = getStoreCalendar(storeId, date)
  return calendar?.is_closed || false
} 