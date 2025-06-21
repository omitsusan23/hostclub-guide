-- ホストクラブ案内所システム用データベーススキーマ

-- UUID拡張を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ステータスタイプのenum定義
CREATE TYPE status_type AS ENUM (
  '今初回ほしいです',
  '席に余裕があります',
  '満席に近いです',
  '本日は満席です',
  '特別イベント開催中'
);

-- ① stores テーブル（契約店舗情報）
CREATE TABLE stores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  store_id TEXT UNIQUE NOT NULL,
  base_fee INTEGER NOT NULL DEFAULT 0,
  guarantee_count INTEGER NOT NULL DEFAULT 0,
  under_guarantee_penalty INTEGER NOT NULL DEFAULT 0,
  charge_per_person INTEGER NOT NULL DEFAULT 0,
  exclude_tax BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ② staff_logs テーブル（案内所スタッフが入力する案内ログ）
CREATE TABLE staff_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 1,
  guided_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ③ store_status テーブル（customerが入力するリアルタイム状況）
CREATE TABLE store_status (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
  status_type status_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ④ schedules テーブル（営業スケジュール）
CREATE TABLE schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, date)
);

-- インデックスの作成
CREATE INDEX idx_staff_logs_store_id ON staff_logs(store_id);
CREATE INDEX idx_staff_logs_guided_at ON staff_logs(guided_at);
CREATE INDEX idx_store_status_store_id ON store_status(store_id);
CREATE INDEX idx_store_status_created_at ON store_status(created_at);
CREATE INDEX idx_schedules_store_id ON schedules(store_id);
CREATE INDEX idx_schedules_date ON schedules(date);

-- RLS（Row Level Security）ポリシーの設定

-- stores テーブルのRLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- 管理者は全てのストアにアクセス可能
CREATE POLICY "管理者は全てのストアにアクセス可能" ON stores
  FOR ALL USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- スタッフは全てのストアを参照可能
CREATE POLICY "スタッフは全てのストアを参照可能" ON stores
  FOR SELECT USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'staff'
  );

-- 顧客は自分の店舗のみアクセス可能
CREATE POLICY "顧客は自分の店舗のみアクセス可能" ON stores
  FOR ALL USING (
    store_id = (auth.jwt() ->> 'user_metadata')::jsonb ->> 'store_id'
  );

-- staff_logs テーブルのRLS
ALTER TABLE staff_logs ENABLE ROW LEVEL SECURITY;

-- 管理者は全ての記録にアクセス可能
CREATE POLICY "管理者は全ての記録にアクセス可能" ON staff_logs
  FOR ALL USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- スタッフは全ての記録を参照・作成可能
CREATE POLICY "スタッフは全ての記録を参照・作成可能" ON staff_logs
  FOR ALL USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'staff'
  );

-- 顧客は自分の店舗の記録のみ参照可能
CREATE POLICY "顧客は自分の店舗の記録のみ参照可能" ON staff_logs
  FOR SELECT USING (
    store_id = (auth.jwt() ->> 'user_metadata')::jsonb ->> 'store_id'
  );

-- store_status テーブルのRLS
ALTER TABLE store_status ENABLE ROW LEVEL SECURITY;

-- 管理者は全ての状況にアクセス可能
CREATE POLICY "管理者は全ての状況にアクセス可能" ON store_status
  FOR ALL USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- スタッフは全ての状況を参照可能
CREATE POLICY "スタッフは全ての状況を参照可能" ON store_status
  FOR SELECT USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'staff'
  );

-- 顧客は自分の店舗の状況のみ操作可能
CREATE POLICY "顧客は自分の店舗の状況のみ操作可能" ON store_status
  FOR ALL USING (
    store_id = (auth.jwt() ->> 'user_metadata')::jsonb ->> 'store_id'
  );

-- schedules テーブルのRLS
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- 管理者は全てのスケジュールにアクセス可能
CREATE POLICY "管理者は全てのスケジュールにアクセス可能" ON schedules
  FOR ALL USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- スタッフは全てのスケジュールを参照可能
CREATE POLICY "スタッフは全てのスケジュールを参照可能" ON schedules
  FOR SELECT USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'staff'
  );

-- 顧客は自分の店舗のスケジュールのみ操作可能
CREATE POLICY "顧客は自分の店舗のスケジュールのみ操作可能" ON schedules
  FOR ALL USING (
    store_id = (auth.jwt() ->> 'user_metadata')::jsonb ->> 'store_id'
  );

-- サンプルデータの挿入
INSERT INTO stores (store_id, name, base_fee, guarantee_count, under_guarantee_penalty, charge_per_person, exclude_tax) VALUES
  ('sapporo-rberu', 'クラブ リベール', 30000, 8, 10000, 1000, false),
  ('sapporo-ace', 'クラブ エース', 35000, 10, 20000, 1000, false),
  ('sapporo-king', 'クラブ キング', 25000, 6, 10000, 1000, false); 