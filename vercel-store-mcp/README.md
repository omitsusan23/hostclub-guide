# 🏪 Store Management MCP Server

店舗作成とサブドメイン自動構築のためのMCPサーバーです。

## 🚀 機能

### 利用可能なツール

1. **create_store_with_subdomain**
   - 新規店舗をSupabaseに追加
   - 認証ユーザーを自動作成
   - Vercelでサブドメインを自動構築
   - 完全自動化されたワークフロー

2. **check_subdomain_status**
   - サブドメインの稼働状況確認
   - DNS伝播チェック

## 🛠️ セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`env.example`を参考に環境変数を設定：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Vercel API設定
VERCEL_TOKEN=your_vercel_token
VERCEL_TEAM_ID=your_team_id_optional
BASE_DOMAIN=susukino-hostclub-guide.online
```

### 3. ローカル開発

```bash
npm run dev
```

### 4. Vercelにデプロイ

```bash
vercel --prod
```

## 📡 Cursorでの使用方法

### MCP設定

```json
{
  "mcpServers": {
    "store-management": {
      "url": "https://your-mcp-server.vercel.app/api/mcp"
    }
  }
}
```

### 使用例

**店舗作成:**
```
「福岡」という店舗を作成して、自動的にサブドメインを設定してください。店舗ID: fukuoka、営業時間: 19:00-24:00
```

**サブドメイン確認:**
```
fukuoka店のサブドメイン状況を確認してください
```

## 🔧 必要な設定

### Vercel API Token
1. Vercelダッシュボードにアクセス
2. Settings → Tokens → Create
3. 適切な権限を付与（Domains management）

### Supabase Service Role Key
1. Supabaseプロジェクトダッシュボード
2. Settings → API → service_role key

## 📋 出力例

店舗作成成功時：
```
✅ 店舗「福岡ホストクラブ」が正常に作成されました！

🏪 店舗情報
- 店舗名: 福岡ホストクラブ
- 店舗ID: fukuoka
- 営業時間: 19:00 - 24:00

🌐 サブドメイン
- URL: https://fukuoka.susukino-hostclub-guide.online
- 数分以内にアクセス可能になります

👤 ログイン情報
- メール: fukuoka@hostclub.local
- パスワード: hostclub123
- ユーザー作成: ✅

🎯 次の手順
1. DNSの伝播を待つ（通常5-10分）
2. https://fukuoka.susukino-hostclub-guide.online にアクセス
3. 上記のログイン情報でテスト
```

## 📚 技術スタック

- **MCP**: Model Context Protocol
- **Next.js**: Webアプリケーションフレームワーク
- **Supabase**: データベース・認証
- **Vercel**: ホスティング・ドメイン管理
- **TypeScript**: 型安全性 