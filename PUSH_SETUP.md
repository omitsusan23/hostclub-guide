# 🔔 Push通知セットアップガイド

## 概要
本システムにPush通知機能が実装されました。アプリを閉じていても新しいスタッフチャットの通知を受け取ることができます。

## 🚀 現在の実装状況

### ✅ 実装済み
- Service Worker（`/public/sw.js`）
- Push通知管理フック（`/src/hooks/usePushNotifications.js`）
- 通知設定UI（`/src/components/PushNotificationSettings.jsx`）
- ページタイトル通知（`/src/hooks/usePageTitleNotifications.js`）
- ログインページでの通知設定
- ヘッダーでのコンパクト通知設定

### ⚠️ 設定が必要
- VAPIDキーペアの生成と設定
- プッシュ通知送信機能（Supabase Edge Functions等）

## 🔑 VAPIDキーの生成手順

### 1. web-pushライブラリを使用（推奨）

```bash
# Node.js環境で実行
npm install -g web-push

# VAPIDキーペアを生成
web-push generate-vapid-keys
```

出力例：
```
=======================================
Public Key:
BEl62iUYgUivxIkv69yViEuiBIa6-4NlAaM9F3YRyAMaKFNfpOwlCi8DjqDHAGF5Cla06...

Private Key:
JF2Av2WMD7v0l2S+9jcDWdxE55eQKGmE+xC8W7FgEYrYeL6Hh5Q/8BXIaF9LpHn...
=======================================
```

### 2. オンラインツールを使用

https://vapidkeys.com/ でも生成可能です。

## ⚙️ 設定手順

### 1. VAPIDキーの設定

`src/hooks/usePushNotifications.js` の3行目を更新：

```javascript
// 変更前
const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY'

// 変更後（生成されたPublic Keyを使用）
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa6-4NlAaM9F3YRyAMaKFN...'
```

### 2. Supabase Edge Function（プッシュ通知送信）

```javascript
// supabase/functions/send-push-notification/index.ts
import { serve } from "https://deno.land/std@0.208.0/http/server.ts"

const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!

serve(async (req) => {
  try {
    const { subscription, message, title } = await req.json()
    
    // Push通知を送信するロジック
    // web-push等のライブラリを使用
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

## 📱 ユーザー体験

### 初回設定
1. ログインページまたはダッシュボードで「プッシュ通知を有効にする」をクリック
2. ブラウザから「通知を許可しますか？」のポップアップ → 「許可」
3. 設定完了

### 通知受信
- 📱 **スマホ**: 画面上部に通知表示 + 音・振動
- 💻 **PC**: デスクトップ右下に通知表示
- 🌐 **ブラウザタブ**: タイトルが点滅「(3) ホストクラブ案内所」⇔「🔔 新着メッセージ 3件」

### 通知タップ
- アプリが自動で開く
- スタッフチャット画面に直接移動
- 未読数がクリア

## 🎯 メリット

1. **絶対に見逃さない**: アプリを閉じていても通知が届く
2. **即座に対応**: 緊急の「今初回ほしいです」に迅速対応
3. **業務効率向上**: 常時アプリを開いておく必要なし
4. **ネイティブアプリ並み**: PWAでありながら本格的な通知体験

## 🔧 テスト方法

### 1. 基本テスト
1. ログインページで「プッシュ通知を有効にする」
2. 「テスト通知」ボタンをクリック
3. 通知が表示されることを確認

### 2. 実際のチャットテスト
1. 2つのブラウザ/デバイスでログイン
2. 片方でアプリを閉じる
3. もう片方からスタッフチャットを送信
4. 閉じた側に通知が届くことを確認

## ⚠️ 注意事項

- **iOS Safari**: PWAをホーム画面に追加した場合のみ動作
- **Android Chrome**: ブラウザでも動作
- **プライベートモード**: 通知許可が保存されない場合あり
- **ブロック状態**: 一度拒否されると再許可を求めるのが困難

## 🔄 今後の拡張

- 通知音のカスタマイズ
- 通知の種類別設定（緊急・一般等）
- 営業時間外の通知制御
- グループ通知機能 