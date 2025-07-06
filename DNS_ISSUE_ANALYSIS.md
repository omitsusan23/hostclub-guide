# NamecheapとVercelのDNS接続問題の分析

## 現象
- NamecheapでVercelのネームサーバー（ns1.vercel-dns.com, ns2.vercel-dns.com）を設定しても定期的に接続が切れる
- 同じネームサーバーを削除して再度設定すると一時的に復旧する

## 考えられる原因

### 1. DNS伝播の遅延
- **問題**: NamecheapのDNS更新が完全に伝播するまでに時間がかかる
- **症状**: 一部のDNSサーバーで古い情報がキャッシュされている
- **解決策**: TTL（Time To Live）を短く設定する

### 2. DNSSEC設定の不整合
- **問題**: NamecheapでDNSSECが有効になっているが、Vercel側で対応していない
- **症状**: DNS検証エラーにより接続が切れる
- **解決策**: NamecheapでDNSSECを無効にする

### 3. Namecheapの自動DNS管理機能
- **問題**: NamecheapのDNS管理機能が自動的にデフォルト設定に戻す
- **症状**: 定期的にNamecheapのデフォルトネームサーバーに戻る
- **解決策**: 
  - Domain Lockを有効にする
  - Auto-renewalの設定を確認
  - DNS管理をCustom DNSに明示的に設定

### 4. APIトークンの有効期限
- **問題**: NamecheapのAPIトークンが期限切れ
- **症状**: 自動更新が失敗し、デフォルト設定に戻る
- **解決策**: APIトークンを更新

### 5. Vercel側のドメイン検証
- **問題**: Vercelが定期的にドメイン所有権を検証し、失敗している
- **症状**: Vercelがドメインを「未検証」と判断
- **解決策**: Vercelでドメインを再検証

## 推奨される対処法

### 即時対応
1. NamecheapでDNSSECが無効になっているか確認
2. Domain Lockが有効になっているか確認
3. ネームサーバーがCustom DNSに設定されているか確認

### 長期的対策
1. **DNSモニタリング**: 定期的にDNS設定をチェックするスクリプトを作成
2. **Webhookアラート**: DNS変更時に通知を受け取る設定
3. **代替案検討**: CloudflareなどのDNSプロキシサービスの使用

### Namecheapでの確認項目
```
1. Domain List → 対象ドメイン → Advanced DNS
   - DNSSEC: Disabled
   - Domain Lock: Enabled
   
2. Domain List → 対象ドメイン → Nameservers
   - Custom DNS選択
   - ns1.vercel-dns.com
   - ns2.vercel-dns.com
   
3. Account Settings → API Access
   - APIトークンの有効期限確認
```

### 監視スクリプト例
```bash
#!/bin/bash
# DNS監視スクリプト
DOMAIN="susukino-hostclub-guide.online"
EXPECTED_NS1="ns1.vercel-dns.com"
EXPECTED_NS2="ns2.vercel-dns.com"

# 現在のネームサーバーを確認
CURRENT_NS=$(dig +short NS $DOMAIN)

if [[ ! "$CURRENT_NS" =~ "$EXPECTED_NS1" ]] || [[ ! "$CURRENT_NS" =~ "$EXPECTED_NS2" ]]; then
    echo "警告: ネームサーバーが変更されています"
    echo "現在のNS: $CURRENT_NS"
    # 通知を送る処理をここに追加
fi
```

## 結論
最も可能性が高い原因は、Namecheapの自動DNS管理機能またはDNSSECの設定不整合です。上記の確認項目をチェックし、Custom DNSが確実に保持されるよう設定を見直してください。