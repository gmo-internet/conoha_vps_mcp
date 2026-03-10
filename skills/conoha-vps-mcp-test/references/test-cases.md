# テストケース詳細定義

## 正常系テスト（No.1〜No.23）

---

### No.1 サーバー作成（正常系）

**確認ポイント**: 正常にボリューム、サーバーが作成されたか

**操作手順**:
1. `conoha_get` path=`/flavors/detail` → メモリ1GBのフレーバーID取得
2. `conoha_get` path=`/v2/images?limit=200` → Ubuntu 24.04のimageRef取得
3. `conoha_get` path=`/types` → ボリュームタイプ取得
4. `conoha_post` path=`/volumes`
   ```json
   {"volume": {"size": 30, "name": "<name>", "volume_type": "<type>", "imageRef": "<imageId>", "description": null}}
   ```
5. `conoha_post` path=`/servers`
   ```json
   {"server": {"flavorRef": "<flavorId>", "adminPass": "vG7#kLp9zX!q", "block_device_mapping_v2": [{"uuid": "<volumeId>"}], "metadata": {"instance_name_tag": "test"}, "security_groups": [{"name": "default"}]}}
   ```

**期待結果**: サーバーステータスがACTIVEになること

---

### No.2 サーバー停止（正常系）

**確認ポイント**: 正常にサーバーが停止したか

**前提**: No.1実行済み

**操作手順**:
1. `conoha_get` path=`/servers/detail` → testサーバーのID取得
2. `conoha_post_put_by_param` path=`/action` param=サーバーID
   ```json
   {"os-stop": null}
   ```

**期待結果**: サーバーステータスがSHUTOFFになること

---

### No.3 サーバー起動（正常系）

**確認ポイント**: 正常にサーバーが起動したか

**前提**: No.2実行済み（サーバーがSHUTOFF状態）

**操作手順**:
1. `conoha_get` path=`/servers/detail` → testサーバーのID取得
2. `conoha_post_put_by_param` path=`/action` param=サーバーID
   ```json
   {"os-start": null}
   ```

**期待結果**: サーバーステータスがACTIVEになること

---

### No.4 サーバー強制停止（正常系）

**確認ポイント**: 正常にサーバーが停止したか

**前提**: No.1実行済み（サーバーがACTIVE状態）

**操作手順**:
1. `conoha_get` path=`/servers/detail` → testサーバーのID取得
2. `conoha_post_put_by_param` path=`/action` param=サーバーID
   ```json
   {"os-stop": {"force_shutdown": true}}
   ```

**期待結果**: サーバーステータスがSHUTOFFになること

---

### No.5 サーバー再起動（正常系）

**確認ポイント**: 正常にサーバーが再起動したか

**前提**: No.1実行済み（サーバーがACTIVE状態）

**操作手順**:
1. `conoha_get` path=`/servers/detail` → testサーバーのID取得
2. `conoha_post_put_by_param` path=`/action` param=サーバーID
   ```json
   {"reboot": {"type": "SOFT"}}
   ```

**期待結果**: サーバーステータスがACTIVEになること

---

### No.6 サーバーリサイズ（正常系）

**確認ポイント**: 正常にサーバーがリサイズ処理状態になったか

**前提**: No.2実行済み（サーバーがSHUTOFF状態）

**操作手順**:
1. `conoha_get` path=`/servers/detail` → testサーバーのID取得
2. `conoha_get` path=`/flavors/detail` → メモリ4GBのフレーバーID取得
3. `conoha_post_put_by_param` path=`/action` param=サーバーID
   ```json
   {"resize": {"flavorRef": "<4GB_flavor_ID>"}}
   ```

**期待結果**: サーバーステータスがVERIFY_RESIZEになること

---

### No.7 サーバーリサイズ承認（正常系）

**確認ポイント**: 正常にサーバーがリサイズされたか

**前提**: No.6実行済み（サーバーがVERIFY_RESIZE状態）

**操作手順**:
1. `conoha_post_put_by_param` path=`/action` param=サーバーID
   ```json
   {"confirmResize": null}
   ```

**期待結果**: サーバーのフレーバーが4GBに変更されていること

---

### No.8 サーバーリサイズ取り消し（正常系）

**確認ポイント**: 正常にサーバーのリサイズ処理状態が取り消されたか

**前提**: No.6実行済み（サーバーがVERIFY_RESIZE状態）

**操作手順**:
1. `conoha_post_put_by_param` path=`/action` param=サーバーID
   ```json
   {"revertResize": null}
   ```

**期待結果**: サーバーのフレーバーが元の1GBに戻っていること

---

### No.9 ボリューム更新（正常系）

**確認ポイント**: 正常にボリュームが更新されたか

**前提**: No.1実行済み

**操作手順**:
1. `conoha_get` path=`/servers/detail` → testサーバーにアタッチされているボリュームID取得
2. `conoha_post_put_by_param` path=`/volumes` param=ボリュームID
   ```json
   {"volume": {"name": "aaa"}}
   ```
3. `conoha_get` path=`/volumes/detail` → ボリューム名が変更されたことを確認

**期待結果**: ボリューム名が「aaa」に変更されていること

---

### No.10 セキュリティグループ・ルール作成（正常系）

**確認ポイント**: 正常にセキュリティグループ・セキュリティグループルールが作成されたか

**操作手順**:
1. `conoha_post` path=`/v2.0/security-groups`
   ```json
   {"security_group": {"name": "web-server-secgroup", "description": "Web server security group"}}
   ```
2. `conoha_post` path=`/v2.0/security-group-rules`（HTTP）
   ```json
   {"security_group_rule": {"security_group_id": "<sgId>", "direction": "ingress", "ethertype": "IPv4", "protocol": "tcp", "port_range_min": 80, "port_range_max": 80, "remote_ip_prefix": "0.0.0.0/0"}}
   ```
3. `conoha_post` path=`/v2.0/security-group-rules`（HTTPS）
   ```json
   {"security_group_rule": {"security_group_id": "<sgId>", "direction": "ingress", "ethertype": "IPv4", "protocol": "tcp", "port_range_min": 443, "port_range_max": 443, "remote_ip_prefix": "0.0.0.0/0"}}
   ```

**期待結果**: セキュリティグループとHTTP/HTTPSルールが作成されること

---

### No.11 セキュリティグループ更新（正常系）

**確認ポイント**: 正常にセキュリティグループルールが削除され、セキュリティグループが更新されたか

**前提**: No.10実行済み

**操作手順**:
1. `conoha_get` path=`/v2.0/security-groups` → web-server-secgroupのID取得
2. `conoha_get` path=`/v2.0/security-group-rules` → HTTP（80番）ルールのID取得
3. `conoha_delete_by_param` path=`/v2.0/security-group-rules` param=ルールID
4. `conoha_post_put_by_param` path=`/v2.0/security-groups` param=sgId
   ```json
   {"security_group": {"name": "https-secgroup"}}
   ```

**期待結果**: HTTPルールが削除され、SG名がhttps-secgroupに変更されること

---

### No.12 セキュリティグループ詳細の確認（正常系）

**確認ポイント**: セキュリティグループとルールの詳細が正しく取得できるか

**前提**: No.10実行済み

**操作手順**:
1. `conoha_get` path=`/v2.0/security-groups` → web-server-secgroupのID取得
2. `conoha_get_by_param` path=`/v2.0/security-groups` param=sgId → SG詳細表示
3. `conoha_get` path=`/v2.0/security-group-rules` → HTTPS（443番）ルールのID取得
4. `conoha_get_by_param` path=`/v2.0/security-group-rules` param=ruleId → ルール詳細表示

**期待結果**: SG詳細とHTTPSルール詳細が表示されること

---

### No.13 セキュリティグループのサーバーへの設定（正常系）

**確認ポイント**: 正常にセキュリティグループのサーバーへの設定が行われたか

**前提**: No.1, No.10実行済み

**操作手順**:
1. `conoha_get` path=`/servers/detail` → testサーバーのID取得
2. `conoha_get` path=`/v2.0/ports` → サーバーに紐づくポートID取得
3. `conoha_get` path=`/v2.0/security-groups` → web-server-secgroupのID取得
4. `conoha_post_put_by_param` path=`/v2.0/ports` param=ポートID
   ```json
   {"port": {"security_groups": ["<default_sgId>", "<web-server-secgroup_sgId>"]}}
   ```

**期待結果**: ポートにdefaultとweb-server-secgroupの両方が設定されること

---

### No.14 サーバーに紐づく情報の取得（正常系）

**確認ポイント**: サーバーに紐づくIPアドレスとセキュリティグループが取得できるか

**前提**: No.1実行済み

**操作手順**:
1. `conoha_get` path=`/servers/detail` → testサーバーのID取得
2. `conoha_get_by_param` path=`/ips` param=サーバーID → IPアドレス一覧
3. `conoha_get_by_param` path=`/os-security-groups` param=サーバーID → SG一覧

**期待結果**: IPアドレスとセキュリティグループが表示されること

---

### No.15 コンソールURL取得（正常系）

**確認ポイント**: 正常にコンソールURLが発行されたか

**前提**: No.1実行済み（サーバーがACTIVE状態）

**操作手順**:
1. `conoha_get` path=`/servers/detail` → testサーバーのID取得
2. `conoha_post_put_by_param` path=`/remote-consoles` param=サーバーID
   ```json
   {"remote_console": {"protocol": "vnc", "type": "novnc"}}
   ```

**期待結果**: コンソールURLが返されること

---

### No.16 サーバー利用状況グラフ取得（正常系）

**確認ポイント**: サーバーの利用状況データが取得できるか

**前提**: No.1実行済み

**操作手順**:
1. `conoha_get` path=`/servers/detail` → testサーバーのID取得
2. `conoha_get_by_param` path=`/rrd/cpu` param=サーバーID → CPU使用時間
3. `conoha_get_by_param` path=`/rrd/disk` param=サーバーID → ディスクIO

**期待結果**: CPU使用時間とディスクIOのデータが返されること

---

### No.17 サーバーの削除（正常系）

**確認ポイント**: 正常にサーバー、ボリューム、セキュリティグループが削除されたか

**前提**: No.1, No.10, No.13実行済み

**操作手順**:
1. `conoha_get` path=`/servers/detail` → testサーバーのID取得
2. `conoha_get` path=`/volumes/detail` → ボリュームID取得
3. `conoha_delete_by_param` path=`/servers` param=サーバーID
4. サーバー削除完了を待機
5. `conoha_delete_by_param` path=`/volumes` param=ボリュームID
6. `conoha_get` path=`/v2.0/security-groups` → web-server-secgroupのID取得
7. `conoha_delete_by_param` path=`/v2.0/security-groups` param=sgId

**期待結果**: サーバー、ボリューム、セキュリティグループがすべて削除されること

---

### No.18 SSHキーペア作成（正常系）

**確認ポイント**: 正常にSSHキーペアが作成されたか

**テスト用リソース準備**: `ssh-keygen -t ed25519 -f /tmp/test_ssh_key -N ""`

**操作手順**:
1. `/tmp/test_ssh_key.pub` の内容を読み取る
2. `conoha_post` path=`/os-keypairs`
   ```json
   {"keypair": {"name": "ssh_key", "public_key": "<public_key_content>"}}
   ```
3. `conoha_get` path=`/os-keypairs` → ssh_keyが一覧に存在することを確認

**期待結果**: SSHキーペアが作成され、一覧に表示されること

---

### No.19 サーバー作成（SSHキー接続）（正常系）

**確認ポイント**: 正常にSSHキー付きでサーバーが作成されたか

**前提**: No.18実行済み

**操作手順**:
1. No.1と同じ手順でサーバー作成（以下を追加）
   ```json
   {"server": {"flavorRef": "<flavorId>", "adminPass": "vG7#kLp9zX!q", "key_name": "ssh_key", "block_device_mapping_v2": [{"uuid": "<volumeId>"}], "metadata": {"instance_name_tag": "test"}, "security_groups": [{"name": "default"}]}}
   ```

**期待結果**: サーバーがSSHキー付きで作成され、ACTIVEになること

---

### No.20 SSHキーペア削除（正常系）

**確認ポイント**: 正常にSSHキーペアが削除されたか

**前提**: No.18実行済み

**操作手順**:
1. `conoha_delete_by_param` path=`/os-keypairs` param=`ssh_key`

**期待結果**: SSHキーペアが削除されること

---

### No.21 Prompt実行：サーバー作成（正常系）

**確認ポイント**: `create_server` プロンプトが指示するサーバー作成フローがMCPツールで正常に動作するか

**操作手順**:
1. `conoha_get` path=`/flavors/detail` → メモリ1GBのフレーバーID取得
2. `conoha_get` path=`/v2/images?limit=200` → Ubuntu 24.04のimageRef取得
3. `conoha_get` path=`/types` → ボリュームタイプ取得
4. `conoha_post` path=`/volumes`
   ```json
   {"volume": {"size": 30, "name": "test", "volume_type": "<type>", "imageRef": "<imageId>", "description": null}}
   ```
5. `conoha_post` path=`/servers`
   ```json
   {"server": {"flavorRef": "<flavorId>", "adminPass": "vG7#kLp9zX!q", "block_device_mapping_v2": [{"uuid": "<volumeId>"}], "metadata": {"instance_name_tag": "test"}, "security_groups": [{"name": "default"}]}}
   ```

**期待結果**: サーバーステータスがACTIVEになること

**注意**: `create_server` はMCPプロンプトであり直接呼び出せないため、プロンプトが指示する操作と同等のMCPツール呼び出しで代替検証する。**このテストをスキップしてはならない。**

---

### No.22 READMEサンプルプロンプト：ボリューム詳細表示（正常系）

**確認ポイント**: ボリューム詳細が正しく表示されるか

**前提**: testという名前のサーバーが存在すること

**操作手順**:
1. プロンプト: 「testという名前のサーバーにアタッチされているボリュームの詳細を表示してください。」
2. `conoha_get` path=`/servers/detail` → testサーバーのボリュームID確認
3. `conoha_get` path=`/volumes/detail` → ボリューム詳細表示

**期待結果**: ボリュームの詳細情報が表示されること

---

### No.23 スタートアップスクリプト付きサーバー作成（正常系）

**確認ポイント**: スタートアップスクリプト付きでサーバーが作成されたか

**操作手順**:
1. `conoha_get` path=`/flavors/detail` → メモリ1GBのフレーバーID取得
2. `conoha_get` path=`/v2/images?limit=200` → Ubuntu 24.04のimageRef取得
3. `conoha_get` path=`/types` → ボリュームタイプ取得
4. `conoha_get` path=`/startup-scripts` → スタートアップスクリプト確認
5. `fetch_url` → Claude Codeインストールスクリプト取得
6. `encode_base64` → スクリプトをBase64エンコード
7. `conoha_post` path=`/volumes` → ボリューム作成
8. `conoha_post` path=`/servers` → サーバー作成（`user_data`にBase64スクリプトを含む）

**期待結果**: サーバーが作成され、Claude Codeが利用可能な状態になること

**注意**: Claude Code動作確認はSSH接続後に手動で行う

---

## 異常系テスト（No.24〜No.30）

---

### No.24 パスワード条件違反（異常系）

**確認ポイント**: パスワードバリデーションでサーバー作成が拒否されるか

**操作手順**:
1. `conoha_get` path=`/flavors/detail` → フレーバー一覧表示
2. `conoha_get` path=`/v2/images?limit=200` → イメージ一覧表示
3. `conoha_get` path=`/types` → ボリュームタイプ一覧表示
4. サーバー作成を試みる（パスワード: `12345`）

**期待結果**: パスワード `12345` がバリデーション不合格となり、サーバー作成APIが呼ばれないこと

---

### No.25 サーバー名条件違反（異常系）

**確認ポイント**: サーバー名バリデーションでサーバー作成が拒否されるか

**操作手順**:
1. `conoha_get` path=`/flavors/detail` → フレーバー一覧表示
2. `conoha_get` path=`/v2/images?limit=200` → イメージ一覧表示
3. `conoha_get` path=`/types` → ボリュームタイプ一覧表示
4. サーバー作成を試みる（サーバー名: `+test`、パスワード: `vG7#kLp9zX!q`）

**期待結果**: サーバー名 `+test` がバリデーション不合格となり、サーバー作成APIが呼ばれないこと

---

### No.26 SSHキー名条件違反（異常系）

**確認ポイント**: SSHキー名バリデーションでキーペア作成が拒否されるか

**操作手順**:
1. SSHキーペア作成を試みる（名前: `+ssh_key`）

**期待結果**: キー名 `+ssh_key` がバリデーション不合格となり、APIが呼ばれないこと

---

### No.27 ボリューム名条件違反：作成（異常系）

**確認ポイント**: ボリューム名バリデーションでボリューム作成が拒否されるか

**操作手順**:
1. `conoha_get` path=`/v2/images?limit=200` → イメージ一覧表示
2. `conoha_get` path=`/types` → ボリュームタイプ一覧表示
3. ボリューム作成を試みる（ボリューム名: `+test`）

**期待結果**: ボリューム名 `+test` がバリデーション不合格となり、APIが呼ばれないこと

---

### No.28 ボリューム名条件違反：更新（異常系）

**確認ポイント**: ボリューム名バリデーションでボリューム更新が拒否されるか

**前提**: No.1実行済み

**操作手順**:
1. `conoha_get` path=`/servers/detail` → testサーバーのボリュームID取得
2. ボリューム名変更を試みる（新名前: `+aaa`）

**期待結果**: ボリューム名 `+aaa` がバリデーション不合格となり、APIが呼ばれないこと

---

### No.29 サーバーにアタッチされているボリュームの削除（異常系）

**確認ポイント**: アタッチ中のボリューム削除が拒否されるか

**前提**: No.1実行済み

**操作手順**:
1. `conoha_get` path=`/volumes/detail` → ボリュームID取得
2. ボリューム削除を試みる

**期待結果**: アタッチ中のため削除が拒否されること（バリデーションまたはAPIエラー）

---

### No.30 Prompt実行：パスワード条件違反（異常系）

**確認ポイント**: `create_server` プロンプトと同一のパスワードバリデーションでサーバー作成が拒否されるか

**操作手順**:
1. `conoha_get` path=`/flavors/detail` → フレーバー一覧表示
2. `conoha_get` path=`/v2/images?limit=200` → イメージ一覧表示
3. `conoha_get` path=`/types` → ボリュームタイプ一覧表示
4. `conoha_post` path=`/servers` でサーバー作成を試みる（パスワード: `aaa`）

**期待結果**: パスワード `aaa` がバリデーション不合格となり、サーバー作成APIが呼ばれないこと（No.24と同じバリデーション機構）

**注意**: `create_server` プロンプトの `rootPassword` バリデーションと `conoha_post` path=`/servers` の `adminPass` バリデーションは同一の正規表現を使用しているため、ツール経由で同等の検証が可能。**このテストをスキップしてはならない。**

---

## オブジェクトストレージテスト（No.31〜No.37）

---

### No.31 アカウント容量設定（正常系）

**確認ポイント**: 正常にアカウント容量が設定されたか

**操作手順**:
1. `conoha_post_by_header_param` path=`/v1/AUTH_{tenantId}`
   - ヘッダー: `{"X-Account-Meta-Quota-Giga-Bytes": "200"}`

**期待結果**: アカウント容量が200GBに設定されること

---

### No.32 コンテナ作成・オブジェクトアップロード（正常系）

**確認ポイント**: 正常にコンテナが作成され、オブジェクトがアップロードされたか

**テスト用リソース準備**: `/tmp/test_index.html` にHTMLファイルを作成

**操作手順**:
1. `conoha_post_put` path=`/v1/AUTH_{tenantId}/mysite-dev` → コンテナ作成
2. `conoha_post_put` path=`/v1/AUTH_{tenantId}/mysite-dev/index.html`
   - content: `/tmp/test_index.html` の絶対パス
   - contentType: `text/html`

**期待結果**: コンテナとオブジェクトが作成されること

---

### No.33 Web公開（正常系）

**確認ポイント**: 発行された公開用URLでファイルを閲覧できるか

**前提**: No.32実行済み

**操作手順**:
1. `conoha_post_by_header_param` path=`/v1/AUTH_{tenantId}/mysite-dev`
   - ヘッダー: `{"X-Container-Read": ".r:*"}`
2. 公開URL確認: `https://object-storage.c3j1.conoha.io/v1/AUTH_{tenantId}/mysite-dev/index.html`

**期待結果**: Web公開設定が完了し、公開URLでアクセス可能になること

---

### No.34 アカウント情報取得（正常系）

**確認ポイント**: アカウント情報が正しく取得できるか

**操作手順**:
1. `conoha_head` path=`/v1/AUTH_{tenantId}`

**期待結果**: アカウント情報（コンテナ数、オブジェクト数、使用量等）が返されること

---

### No.35 Web公開解除（正常系）

**確認ポイント**: Web公開が正しく解除されたか

**前提**: No.33実行済み

**操作手順**:
1. `conoha_post_by_header_param` path=`/v1/AUTH_{tenantId}/mysite-dev`
   - ヘッダー: `{"X-Container-Read": ""}`
2. 公開URLにアクセスして無効化を確認

**期待結果**: Web公開が解除され、公開URLでアクセスできなくなること

---

### No.36 コンテナ一覧取得（正常系）

**確認ポイント**: コンテナ一覧が正しく取得できるか

**前提**: No.32実行済み

**操作手順**:
1. `conoha_get` path=`/v1/AUTH_{tenantId}`

**期待結果**: mysite-devを含むコンテナ一覧が表示されること

---

### No.37 オブジェクト一覧取得（正常系）

**確認ポイント**: オブジェクト一覧が正しく取得できるか

**前提**: No.32実行済み

**操作手順**:
1. `conoha_get` path=`/v1/AUTH_{tenantId}/mysite-dev`

**期待結果**: index.htmlを含むオブジェクト一覧が表示されること
