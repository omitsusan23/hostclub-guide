# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Progressive Web Application (PWA) for managing hostclub guidance offices (ホストクラブ案内所) in Sapporo's Susukino district. The system supports three user roles: Admin (管理者), Staff (スタッフ), and Customer (顧客), with subdomain-based role separation.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Architecture

### Tech Stack
- **Frontend**: React 19.1.0 + Vite + React Router DOM
- **Styling**: TailwindCSS
- **Database/Auth**: Supabase (PostgreSQL with Row Level Security)
- **State Management**: React Context API
- **Deployment**: Vercel

### Project Structure
```
src/
├── components/       # Shared components (Layout, ProtectedRoute, modals)
├── contexts/        # React contexts (AppContext for global state)
├── lib/            # Library configurations (supabase.js)
├── pages/          # Page components for each role
├── utils/          # Utility functions (data operations, formatting)
└── styles/         # CSS files
```

### Role-Based Access
- Admin: `admin.example.com` or `?role=admin` (dev)
- Staff: `staff.example.com` or `?role=staff` (dev)
- Customer: `store1.example.com` or `?role=customer` (dev)

## Supabase Configuration

The project uses Supabase MCP server configured in `.cursor/mcp.json`. Environment variables required:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Key database tables:
- `stores` - Store information with owner_id
- `staff_logs` - Guidance records
- `store_status` - Real-time status updates
- `schedules` - Business schedules
- `store_holidays` - Holiday management

## Important Implementation Notes

1. **Authentication Flow**: Uses Supabase Auth with role information stored in user_metadata
2. **Mock Data**: Currently using mock data in utils/ - check `mockMode` flag in components
3. **PWA Features**: Service worker at `/public/sw.js` with push notification support
4. **No Test Framework**: Currently no testing setup - consider adding Vitest for unit tests
5. **Edge Functions**: Supabase Edge Functions in `/supabase/functions/` for server-side logic

## Common Development Tasks

### Adding New Features
1. Check existing utility functions in `src/utils/` before creating new ones
2. Follow the established pattern of role-based components
3. Use TailwindCSS classes for styling consistency
4. Ensure proper error handling with user-friendly messages

### Working with Database
1. All database operations should respect Row Level Security policies
2. Use the existing Supabase client instance from `src/lib/supabase.js`
3. Check mock data utilities when Supabase is not connected

### Debugging Tips
- Check browser console for Supabase connection errors
- Verify environment variables are properly set
- Use React Developer Tools to inspect context values
- Check Network tab for failed API requests

## 🚫 開発ルール - 絶対に変更禁止

### データベース関連（既存のSupabase設定）
- 既存のテーブル構造の変更・削除（stores, staff_logs, store_status, schedules, store_holidays）
- 既存のRLS（Row Level Security）ポリシーの変更
- 既存のテーブル間リレーションの変更
- 既存のデータ内容の変更・削除
- 既存のSupabase Edge Functionsの変更

### フロントエンド関連（React + Vite）
- 既存コンポーネントの内部ロジック変更
- 既存のReact Context API設定の変更
- 既存のルーティング設定（React Router DOM）の変更
- 既存のTailwindCSS設定の変更
- 既存のPWA設定（service worker）の変更
- 既存の認証フローの変更

### 環境・設定関連
- 既存の環境変数の変更
- 既存のVercel設定の変更
- 既存のMCP設定（.cursor/mcp.json）の変更
- 既存のpackage.jsonの依存関係変更

## ⚠️ 事前確認必須の作業

### 新機能追加
- 新しいSupabaseテーブルの作成
- 新しいReactコンポーネントの追加
- 新しいページ/ルートの追加
- 新しい依存関係の追加
- 新しいEdge Functionsの追加

### 既存コード修正（弊害がある場合のみ）
- バグ修正
- パフォーマンス改善
- セキュリティ修正
- 必要な場合の依存関係更新

## ✅ 推奨作業フロー

1. **計画提案**: 実装前に必ず計画を提案し承認を得る
2. **影響範囲分析**: 既存機能への影響を明示
3. **段階的実装**: 大きな機能は小さく分割
4. **テスト重視**: 新機能には適切なテストを検討
5. **ドキュメント更新**: 変更時は必要に応じてドキュメント更新

## 🎯 質問必須項目

新機能実装時は以下を必ず確認：
- この変更は既存の○○機能に影響しますか？
- 新しいSupabaseテーブル/API/コンポーネントが必要ですか？
- 既存のRLS政策に影響はありますか？
- 既存の認証フローに変更が必要ですか？
- mockMode設定への影響はありますか？

**重要**: 判断に迷う場合は必ず実行前に確認してください！安全第一で開発を進めましょう。