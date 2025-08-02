# 7月31日データ取得問題の調査報告書

## 問題の概要
過去実績ページで2025年7月31日のデータが表示されない問題が報告されました。

## 調査結果

### 1. データベースの状態
- **結果**: ✅ 正常
- 7月31日のデータは正しくデータベースに保存されています（16件）
- `getSpecificDateVisitRecords`関数も正しく動作しています

### 2. 問題の根本原因
**フロントエンドの月次データ取得ロジックに問題があります。**

#### 問題のコード（PastPerformancePage.jsx）
```javascript
const startDate = new Date(year, month, 1)
const endDate = new Date(year, month + 1, 0)  // ← ここが問題！
```

#### 具体的な問題
- `new Date(2025, 7, 0)` は「2025年7月31日 00:00:00」を返します
- これをISOStringに変換すると `2025-07-30T15:00:00.000Z` になります
- つまり、**7月30日の午後3時（UTC）まで**しかデータを取得していません
- 7月31日のデータ（UTC時間で7月31日 10:18〜14:47）は範囲外となり、取得されません

### 3. 影響範囲
- すべての月末日（31日、30日など）のデータが表示されない可能性があります
- 特に日本時間の午前9時以降のデータが影響を受けます

## 修正方法

### 修正案1: 月末日を正しく計算
```javascript
// 現在のコード
const endDate = new Date(year, month + 1, 0)

// 修正後のコード
const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)
```

### 修正案2: より確実な方法
```javascript
// 月初と月末を確実に取得
const startDate = new Date(year, month, 1)
const endDate = new Date(year, month + 1, 1) // 翌月1日の00:00
endDate.setMilliseconds(endDate.getMilliseconds() - 1) // 1ミリ秒前 = 当月末の23:59:59.999
```

## 修正が必要なファイル
1. `/src/pages/PastPerformancePage.jsx`
   - `fetchMonthlyData`関数（67行目〜）
   - `fetchStoreMonthlyData`関数（302行目〜）

## テスト方法
1. 7月のカレンダーを表示
2. 7月31日にデータが表示されることを確認
3. 他の月末日（例：6月30日、8月31日）でも確認

## 推奨事項
1. 日付処理のユーティリティ関数を作成し、一元管理することを推奨
2. タイムゾーンを考慮した日付処理の標準化
3. 単体テストの追加による再発防止

## 結論
この問題は、JavaScriptの日付処理の特性とタイムゾーン変換の組み合わせによって発生しています。月末日の計算を修正することで解決可能です。