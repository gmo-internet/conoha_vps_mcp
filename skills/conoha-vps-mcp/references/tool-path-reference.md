# ツール別パス・パラメータ一覧

## conoha_get（13パス）

入力: `{ path }`

| パス | 概要 | レスポンス |
|---|---|---|
| `/servers/detail` | サーバー一覧取得 | servers配列（id, name, status, addresses等） |
| `/flavors/detail` | フレーバー一覧取得 | flavors配列（id, name, ram, vcpus, disk等） |
| `/os-keypairs` | SSHキーペア一覧取得 | keypairs配列（name, public_key, fingerprint等） |
| `/types` | ボリュームタイプ一覧取得 | volume_types配列（id, name等） |
| `/volumes/detail` | ボリューム一覧取得 | volumes配列（id, name, size, status等） |
| `/v2/images?limit=200` | イメージ一覧取得 | images配列（id, name, status, min_disk等） |
| `/v2.0/security-groups` | セキュリティグループ一覧取得 | security_groups配列 |
| `/v2.0/security-group-rules` | セキュリティグループルール一覧取得 | security_group_rules配列 |
| `/v2.0/ports` | ポート一覧取得 | ports配列（id, device_id, security_groups等） |
| `/startup-scripts` | スタートアップスクリプト一覧取得 | スクリプト一覧（name, url等） |
| `/v1/AUTH_{tenantId}` | コンテナ一覧取得 | コンテナ名の一覧 |
| `/v1/AUTH_{tenantId}/{container}` | オブジェクト一覧取得 | オブジェクト一覧（name, bytes, content_type等） |
| `/v1/AUTH_{tenantId}/{container}/{object}` | オブジェクト詳細取得・ダウンロード | headers + body（テキスト: utf8, バイナリ: base64） |

**注意**:
- ストレージ関連パスの `{tenantId}` はそのまま渡す（自動置換）
- `{container}` はコンテナ名、`{object}` はオブジェクト名に置換して渡す（例: `/v1/AUTH_{tenantId}/mycontainer/myfile.txt`）
- conoha_get のパス入力は上記固定文字列 or `/v1/AUTH_{tenantId}/` で始まる正規表現パターンで受け付ける

---

## conoha_get_by_param（6パス）

入力: `{ path, param }`

| パス | param | 概要 |
|---|---|---|
| `/ips` | サーバーID | サーバーに紐づくIPアドレス一覧取得 |
| `/os-security-groups` | サーバーID | サーバーに紐づくセキュリティグループ一覧取得 |
| `/rrd/cpu` | サーバーID | サーバーのCPU使用率統計取得 |
| `/rrd/disk` | サーバーID | サーバーのディスク使用率統計取得 |
| `/v2.0/security-groups` | セキュリティグループID | セキュリティグループ詳細取得 |
| `/v2.0/security-group-rules` | セキュリティグループルールID | セキュリティグループルール詳細取得 |

---

## conoha_post（5パス）

入力: `{ input: { path, requestBody } }`

| パス | 概要 | requestBody のルートキー |
|---|---|---|
| `/servers` | サーバー作成 | `server` |
| `/os-keypairs` | SSHキーペア作成 | `keypair` |
| `/volumes` | ボリューム作成 | `volume` |
| `/v2.0/security-groups` | セキュリティグループ作成 | `security_group` |
| `/v2.0/security-group-rules` | セキュリティグループルール作成 | `security_group_rule` |

requestBody の詳細は [request-body-schemas.md](request-body-schemas.md) を参照。

---

## conoha_post_put（2パス）

入力: `{ input: { path, content?, contentType? } }`

| パス | 概要 | content | contentType |
|---|---|---|---|
| `/v1/AUTH_{tenantId}/{container}` | コンテナ作成 | 不要 | 不要 |
| `/v1/AUTH_{tenantId}/{container}/{object}` | オブジェクトアップロード | ファイルの絶対パス（必須） | MIMEタイプ（任意） |

**注意**:
- `content` にはファイルの内容ではなく、アップロードするファイルの**絶対パス**を指定する
- ファイルは自動的に読み込まれBase64エンコードされてアップロードされる
- 5GB未満のファイルのみ対応
- 疑似ディレクトリはパスに `/` を含めて表現（例: `/v1/AUTH_{tenantId}/container/dir/file.txt`）
- パスは正規表現で検証: コンテナ作成 = `/v1/AUTH_{tenantId}/` + コンテナ名、オブジェクト = `/v1/AUTH_{tenantId}/` + コンテナ名 + `/` + オブジェクト名

---

## conoha_post_put_by_param（6パス）

入力: `{ input: { path, param, requestBody } }`

| パス | param | 概要 |
|---|---|---|
| `/action` | サーバーID | サーバー操作（起動/停止/再起動/リサイズ等） |
| `/remote-consoles` | サーバーID | リモートコンソールURL取得 |
| `/os-volume_attachments` | サーバーID | ボリュームアタッチ |
| `/v2.0/security-groups` | セキュリティグループID | セキュリティグループ更新 |
| `/v2.0/ports` | ポートID | ポート更新（セキュリティグループの関連付け変更） |
| `/volumes` | ボリュームID | ボリューム更新 |

requestBody の詳細は [request-body-schemas.md](request-body-schemas.md) を参照。

---

## conoha_post_by_header_param

入力: `{ input: { path, headerparam } }`

| パス | headerparam | 概要 |
|---|---|---|
| `/v1/AUTH_{tenantId}` | `{"X-Account-Meta-Quota-Giga-Bytes": "<GB>"}` | アカウント容量設定（100GB単位） |
| `/v1/AUTH_{tenantId}/{コンテナ名}` | `{"X-Container-Read": ".r:*"}` | コンテナのWeb公開設定 |
| `/v1/AUTH_{tenantId}/{コンテナ名}` | `{"X-Container-Read": ""}` | コンテナのWeb公開解除 |

**注意**:
- クォータは100GB単位で指定（例: `"100"`, `"200"`, `"300"`）
- Web公開URLは `https://object-storage.c3j1.conoha.io/v1/AUTH_{tenantId}/{container-name}/{object-name}`

---

## conoha_delete_by_param（7パス）

入力: `{ path, param }`

| パス | param | 概要 |
|---|---|---|
| `/servers` | サーバーID | サーバー削除 |
| `/os-keypairs` | SSHキーペア名 | SSHキーペア削除 |
| `/v2.0/security-groups` | セキュリティグループID | セキュリティグループ削除 |
| `/v2.0/security-group-rules` | セキュリティグループルールID | セキュリティグループルール削除 |
| `/volumes` | ボリュームID | ボリューム削除 |
| `/v1/AUTH_{tenantId}/{container}` | コンテナのフルパス | コンテナ削除 |
| `/v1/AUTH_{tenantId}/{container}/{object}` | オブジェクトのフルパス | オブジェクト削除 |

**注意**:
- ストレージ関連の param にはテナントIDを含む完全なパスを指定する（例: `/v1/AUTH_テナントID/mycontainer`）
- テナントIDは環境変数から取得可能

---

## conoha_head（2パス）

入力: `{ path }`

| パス | 概要 | 主なレスポンスヘッダー |
|---|---|---|
| `/v1/AUTH_{tenantId}` | アカウント情報取得 | `x-account-container-count`, `x-account-object-count`, `x-account-bytes-used`, `x-account-bytes-used-actual`, `x-account-meta-quota-bytes` |
| `/v1/AUTH_{tenantId}/{コンテナ名}` | コンテナ詳細取得 | `x-container-object-count`, `x-container-bytes-used`, `x-container-bytes-used-actual`, `x-timestamp`, `x-storage-policy`, `x-storage-class`, `last-modified` |

**注意**: 204 No Content または 200 OK が返されていても、レスポンスヘッダーは正常に取得できている。
