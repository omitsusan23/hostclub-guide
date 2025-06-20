# ホストクラブ案内所システム

すすきののホストクラブ案内所業務を効率化するためのWebアプリケーションです。

## 技術スタック

- **フロントエンド**: React + Vite
- **認証・データベース**: Supabase
- **ルーティング**: React Router
- **スタイル**: CSS（カスタム）

## 機能概要

### ユーザーロール

1. **管理者 (admin)**: 案内所運営責任者
   - 全店舗管理
   - 新規契約
   - システム設定

2. **スタッフ (staff)**: 案内所スタッフ
   - 案内登録
   - 店舗確認
   - 顧客管理

3. **顧客 (customer)**: ホストクラブ担当者
   - 営業日設定
   - 請求確認
   - 店舗情報更新

### サブドメイン対応

本システムはサブドメインによるロール分離に対応しています：

- `admin.example.com` → 管理者
- `staff.example.com` → スタッフ
- `store1.example.com` → 顧客（店舗別）

開発環境では、URLクエリパラメータでロールを指定できます：
- `http://localhost:3000?role=admin`
- `http://localhost:3000?role=staff`
- `http://localhost:3000?role=customer`

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseの設定

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. `env.example`を参考に環境変数ファイルを作成：

```bash
cp env.example .env.local
```

3. `.env.local`にSupabaseの設定を記入：

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

## プロジェクト構成

```
src/
├── components/          # 共通コンポーネント
│   ├── Layout.jsx      # レイアウトコンポーネント
│   └── ProtectedRoute.jsx # 認証ガード
├── contexts/           # Reactコンテキスト
│   └── AppContext.jsx  # アプリケーション状態管理
├── lib/               # ライブラリ設定
│   └── supabase.js    # Supabaseクライアント
├── pages/             # ページコンポーネント
│   ├── Login.jsx      # ログインページ
│   ├── AdminDashboard.jsx    # 管理者ダッシュボード
│   ├── StaffDashboard.jsx    # スタッフダッシュボード
│   └── CustomerDashboard.jsx # 顧客ダッシュボード
├── App.jsx            # メインアプリケーション
├── main.jsx           # エントリーポイント
└── index.css          # グローバルスタイル
```

## ルーティング

- `/` → ロールに応じたダッシュボードにリダイレクト
- `/login` → ログインページ
- `/dashboard` → ロール判定後ダッシュボードにリダイレクト
- `/admin` → 管理者専用ダッシュボード
- `/staff` → スタッフ専用ダッシュボード
- `/customer` → 顧客専用ダッシュボード

## 認証フロー

1. ユーザーがログインページでメールアドレス・パスワードを入力
2. Supabase Authで認証
3. ユーザーの`user_metadata`からロールと店舗IDを取得
4. サブドメインまたはクエリパラメータでロールを補完
5. ロールに応じたダッシュボードにリダイレクト

## 今後の開発予定

- [ ] MCP（Supabase Managed Configuration Platform）の導入
- [ ] データベーステーブルの設定
- [ ] RLS（Row Level Security）の実装
- [ ] 実際の業務機能の実装
- [ ] UIの改善とレスポンシブデザイン

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プレビュー
npm run preview
```

## 注意事項

- 現在は土台部分のみの実装です
- Supabaseの設定が必要です
- MCPは後から導入予定です 