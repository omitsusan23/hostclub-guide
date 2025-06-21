# Supabase設定ガイド

## 認証設定

### 1. ユーザー事前登録
以下の形式でユーザーを事前に登録してください：

```sql
-- 顧客ユーザーの登録例
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'sapporo-rberu@dummy.email',
  crypt('0000', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"role": "customer", "store_id": "sapporo-rberu"}'::jsonb
);

-- 管理者ユーザーの登録例
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'admin@dummy.email',
  crypt('0000', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"role": "admin"}'::jsonb
);

-- スタッフユーザーの登録例
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'staff@dummy.email',
  crypt('0000', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"role": "staff"}'::jsonb
);
```

### 2. RLS（Row Level Security）設定

#### stores テーブル
```sql
-- ストアテーブルのRLS設定
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
    id = (auth.jwt() ->> 'user_metadata')::jsonb ->> 'store_id'
  );
```

#### visit_records テーブル
```sql
-- 案内記録テーブルのRLS設定
ALTER TABLE visit_records ENABLE ROW LEVEL SECURITY;

-- 管理者は全ての記録にアクセス可能
CREATE POLICY "管理者は全ての記録にアクセス可能" ON visit_records
  FOR ALL USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- スタッフは全ての記録を参照・作成可能
CREATE POLICY "スタッフは全ての記録を参照・作成可能" ON visit_records
  FOR ALL USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'staff'
  );

-- 顧客は自分の店舗の記録のみ参照可能
CREATE POLICY "顧客は自分の店舗の記録のみ参照可能" ON visit_records
  FOR SELECT USING (
    store_id = (auth.jwt() ->> 'user_metadata')::jsonb ->> 'store_id'
  );
```

#### calendars テーブル
```sql
-- カレンダーテーブルのRLS設定
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;

-- 管理者は全てのカレンダーにアクセス可能
CREATE POLICY "管理者は全てのカレンダーにアクセス可能" ON calendars
  FOR ALL USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- スタッフは全てのカレンダーを参照可能
CREATE POLICY "スタッフは全てのカレンダーを参照可能" ON calendars
  FOR SELECT USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'staff'
  );

-- 顧客は自分の店舗のカレンダーのみ操作可能
CREATE POLICY "顧客は自分の店舗のカレンダーのみ操作可能" ON calendars
  FOR ALL USING (
    store_id = (auth.jwt() ->> 'user_metadata')::jsonb ->> 'store_id'
  );
```

## 開発環境でのテスト方法

### ローカル開発
URLパラメータを使用してロールと店舗IDを指定：

```
# 顧客ダッシュボード
http://localhost:5173/?role=customer&store_id=sapporo-rberu

# 管理者ダッシュボード
http://localhost:5173/?role=admin

# スタッフダッシュボード
http://localhost:5173/?role=staff
```

### 本番環境でのサブドメイン設定
Vercelでの設定例：

```
# 顧客用
sapporo-rberu.yourdomain.com → customer role, store_id: sapporo-rberu

# 管理者用
admin.yourdomain.com → admin role

# スタッフ用
staff.yourdomain.com → staff role
```

## ログイン情報
- **ログインID**: サブドメイン名（例：`sapporo-rberu`）
- **初期パスワード**: `0000`
- **内部的なメールアドレス**: `{ログインID}@dummy.email`

## セキュリティ注意事項
1. 本番環境では必ず初期パスワードを変更してください
2. RLS設定が正しく適用されていることを確認してください
3. user_metadataの内容を改ざんされないよう注意してください 