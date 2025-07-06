# DNS接続が切れる問題の詳細分析

## 問題の詳細
- NamecheapでCustom DNSを確実に保存しているにも関わらず、Vercelとの接続が定期的に切れる
- 同じDNS設定（ns1.vercel-dns.com, ns2.vercel-dns.com）を削除して再入力すると一時的に復旧

## 考えられる技術的原因

### 1. **DNS検証の失敗（最も可能性が高い）**

#### Vercel側の定期的なドメイン検証
- Vercelは定期的にドメインの所有権を確認
- 検証方法：
  1. ネームサーバーが正しく設定されているか
  2. DNSレコードが正しく解決されるか
  3. SSL証明書の更新が可能か

#### 問題となるケース
- **一時的なDNS解決エラー**: ネットワークの問題でVercelがDNSを解決できない
- **レート制限**: 頻繁なDNSクエリによりNamecheapまたはVercelのDNSサーバーでレート制限
- **DNSSEC検証エラー**: DNSSECが有効な場合の署名検証失敗

### 2. **Namecheapの内部プロセス**

#### セキュリティスキャン
- Namecheapが定期的にセキュリティスキャンを実行
- 外部DNSサーバーへの委任を「異常」と判断する可能性
- 自動的に「安全な」デフォルト設定に戻す

#### APIの同期問題
- NamecheapのフロントエンドとバックエンドのAPI同期に遅延
- 表示上は保存されているが、実際のDNSサーバーには反映されていない

### 3. **DNS伝播の特殊なケース**

#### Anycast DNSの問題
- Vercelのns1/ns2.vercel-dns.comはAnycastを使用
- 地理的に異なる場所から異なる応答が返される可能性
- Namecheapが特定の地域のDNSサーバーにアクセスできない

#### グローバルDNSキャッシュ
- 世界中のDNSリゾルバーが異なるタイミングでキャッシュ
- 一部のリゾルバーが古い情報を保持し続ける

### 4. **隠れた設定の影響**

#### Namecheap側
1. **Premium DNS**: 無効になっていても内部的に干渉
2. **DDoS Protection**: 高レベルの保護が外部DNSを拒否
3. **Domain Protection Plus**: 追加のセキュリティ機能が干渉

#### Vercel側
1. **Edge Network設定**: 特定の地域でのアクセス制限
2. **プロジェクトの設定**: ドメイン設定の不整合

## 診断手順

### 1. DNS解決のテスト
```bash
# 複数のDNSサーバーから確認
nslookup susukino-hostclub-guide.online 8.8.8.8
nslookup susukino-hostclub-guide.online 1.1.1.1
nslookup susukino-hostclub-guide.online 208.67.222.222

# NSレコードの確認
dig +trace susukino-hostclub-guide.online NS
```

### 2. Namecheapの詳細設定確認
1. **Account Dashboard → Security**
   - API Access設定
   - IP Whitelisting
   - Activity Logs（DNS変更の記録）

2. **Domain → Advanced DNS**
   - 「Host Records」に不要なレコードがないか
   - 「Mail Settings」が干渉していないか

3. **Domain → Domain Privacy**
   - WhoisGuardの設定
   - Privacy Protection Level

### 3. Vercelの確認
```bash
# ドメインの詳細情報
vercel domains inspect susukino-hostclub-guide.online

# プロジェクトのドメイン設定
vercel --debug
```

## 推奨される解決策

### 即時対応
1. **DNSSECを完全に無効化**
   - Namecheap → Domain → Advanced DNS → DNSSEC → OFF

2. **Namecheapのキャッシュクリア**
   - DNS設定を一度BasicDNSに戻す
   - 5分待つ
   - Custom DNSに再設定

3. **Vercelでドメインを再追加**
   ```bash
   vercel domains rm susukino-hostclub-guide.online
   vercel domains add susukino-hostclub-guide.online
   ```

### 長期的対策

1. **監視スクリプトの設置**
```python
import dns.resolver
import requests
import time

def check_dns_status():
    domain = "susukino-hostclub-guide.online"
    expected_ns = ["ns1.vercel-dns.com", "ns2.vercel-dns.com"]
    
    try:
        answers = dns.resolver.resolve(domain, 'NS')
        current_ns = [str(rdata).rstrip('.') for rdata in answers]
        
        if not all(ns in current_ns for ns in expected_ns):
            # 警告を送信
            print(f"DNS変更検出: {current_ns}")
            # 自動修復を試みる
            
    except Exception as e:
        print(f"DNS解決エラー: {e}")

# 10分ごとに実行
while True:
    check_dns_status()
    time.sleep(600)
```

2. **代替ソリューション**
- CloudflareをDNSプロキシとして使用
- Route53などの別のDNSプロバイダーを検討

## 結論

最も可能性が高いのは、NamecheapのセキュリティメカニズムまたはVercelの定期的な検証プロセスとの相性問題です。DNS設定を削除して再入力すると動作することから、キャッシュまたは内部状態のリセットが関係している可能性が高いです。