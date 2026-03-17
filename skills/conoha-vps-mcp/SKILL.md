---
name: conoha-vps-mcp
description: ConoHa VPS MCPサーバーの操作ガイド。サーバー作成・削除・起動・停止・リサイズ、ボリューム管理、セキュリティグループ設定、オブジェクトストレージ操作など、ConoHa VPS APIをMCPツールで操作する際に参照する。「ConoHa」「VPS」「サーバー作成」「サーバー削除」「ボリューム」「セキュリティグループ」「オブジェクトストレージ」「conoha_get」「conoha_post」「conoha_delete」「フレーバー」「イメージ」「SSHキーペア」「スタートアップスクリプト」などのキーワードで発動する。
---

# ConoHa VPS MCP 操作ガイド

## 前提条件

- 環境変数 `OPENSTACK_TENANT_ID`, `OPENSTACK_USER_ID`, `OPENSTACK_PASSWORD` が設定済みであること
- APIリージョンは c3j1 固定
- 認証トークンはリクエストごとに自動取得（キャッシュなし）
- オブジェクトストレージのパス中 `{tenantId}` はそのまま渡す（環境変数から自動置換される）

## ツール概要

| ツール名 | HTTPメソッド | 概要 |
|---|---|---|
| `fetch_url` | — | 指定URLからコンテンツを取得 |
| `encode_base64` | — | 文字列をBase64エンコード（1-10000文字） |
| `conoha_get` | GET | リソース一覧取得（13パス） |
| `conoha_get_by_param` | GET | パラメータ指定で個別リソース取得（6パス） |
| `conoha_post` | POST | リソース作成（5パス） |
| `conoha_post_put` | PUT | ストレージ コンテナ作成・オブジェクトアップロード（2パス） |
| `conoha_post_put_by_param` | POST/PUT | リソース更新・操作（6パス） |
| `conoha_post_by_header_param` | POST | ストレージ メタデータ設定（ヘッダーパラメータ指定） |
| `conoha_delete_by_param` | DELETE | リソース削除（7パス） |
| `conoha_head` | HEAD | アカウント情報・コンテナ詳細取得（2パス） |
| `create_server`（プロンプト） | — | サーバー作成ウィザード |

パス・パラメータの詳細は [tool-path-reference.md](references/tool-path-reference.md) を参照。

## 絶対遵守制約

1. **パスワード自動生成禁止** — `adminPass` は必ずユーザーが指定した値のみを使用する。条件不適合でも再入力を依頼する。自動生成・提案をしない
2. **ポート範囲自動設定禁止** — `port_range_min` / `port_range_max` は必ずユーザーに確認して指定する
3. **user_data は encode_base64 必須** — スタートアップスクリプトを `user_data` に設定する場合、必ず `encode_base64` ツールでエンコードした結果を使用する。自前でのBase64エンコードをしない
4. **{tenantId} はそのまま渡す** — オブジェクトストレージ関連パスの `{tenantId}` は文字列リテラルとしてそのまま渡す（サーバー側で自動置換）
5. **名前タグ制約** — `instance_name_tag`, ボリューム名, SSHキーペア名は英数字・アンダースコア・ハイフンのみ（1-255文字）
6. **オブジェクトアップロード時の content** — `content` にはアップロードするファイルの絶対パスを指定する（ファイル内容ではない）

## ワークフロー判定ツリー

### サーバー作成フロー

```
1. conoha_get path="/flavors/detail" → フレーバー一覧取得、ユーザー要件に合うフレーバーを選択
2. conoha_get path="/v2/images?limit=200" → イメージ一覧取得、OS/バージョンを選択
3. conoha_get path="/types" → ボリュームタイプ一覧取得
4. conoha_post path="/volumes" → ブートボリューム作成（imageRef 必須）
5. （任意）セキュリティグループ・SSHキーペアの準備
6. ユーザーに adminPass を確認
7. conoha_post path="/servers" → サーバー作成
```

### スタートアップスクリプト準備フロー

```
1. conoha_get path="/startup-scripts" → スタートアップスクリプト一覧取得
2. 一覧に該当スクリプトがある場合:
   a. fetch_url → スクリプト内容を取得
   b. encode_base64 → Base64エンコード
3. 一覧にない場合:
   a. 既存スクリプトを参考に新規スクリプトを作成
   b. encode_base64 → Base64エンコード
4. エンコード結果を user_data に設定してサーバー作成
```

### サーバー操作フロー

| 操作 | ツール | path | requestBody |
|---|---|---|---|
| 起動 | `conoha_post_put_by_param` | `/action` | `{"os-start": null}` |
| 停止 | `conoha_post_put_by_param` | `/action` | `{"os-stop": null}` |
| 強制停止 | `conoha_post_put_by_param` | `/action` | `{"os-stop": {"force_shutdown": true}}` |
| 再起動 | `conoha_post_put_by_param` | `/action` | `{"reboot": {"type": "SOFT"}}` or `"HARD"` |
| リサイズ | `conoha_post_put_by_param` | `/action` | `{"resize": {"flavorRef": "<ID>"}}` |
| リサイズ確定 | `conoha_post_put_by_param` | `/action` | `{"confirmResize": null}` |
| リサイズ取消 | `conoha_post_put_by_param` | `/action` | `{"revertResize": null}` |
| コンソール | `conoha_post_put_by_param` | `/remote-consoles` | `{"remote_console": {"protocol": "vnc", "type": "novnc"}}` |
| 削除 | `conoha_delete_by_param` | `/servers` | — (param=サーバーID) |

**リサイズ手順**: resize → サーバーが VERIFY_RESIZE 状態になるまで待機 → confirmResize で確定（または revertResize で取消）

### セキュリティグループフロー

```
1. conoha_post path="/v2.0/security-groups" → セキュリティグループ作成
2. conoha_post path="/v2.0/security-group-rules" → ルール追加（ポート範囲はユーザーに確認）
3. conoha_get path="/v2.0/ports" → ポート一覧取得、対象サーバーのポートIDを特定
4. conoha_post_put_by_param path="/v2.0/ports" → ポートにセキュリティグループを適用
```

### オブジェクトストレージフロー

```
■ クォータ設定
  conoha_post_by_header_param path="/v1/AUTH_{tenantId}" headerparam={"X-Account-Meta-Quota-Giga-Bytes": "100"}

■ コンテナ作成
  conoha_post_put path="/v1/AUTH_{tenantId}/{コンテナ名}"

■ オブジェクトアップロード
  conoha_post_put path="/v1/AUTH_{tenantId}/{コンテナ名}/{オブジェクト名}" content="絶対パス" contentType="MIMEタイプ"

■ Web公開設定
  conoha_post_by_header_param path="/v1/AUTH_{tenantId}/{コンテナ名}" headerparam={"X-Container-Read": ".r:*"}

■ Web公開解除
  conoha_post_by_header_param path="/v1/AUTH_{tenantId}/{コンテナ名}" headerparam={"X-Container-Read": ""}

■ Web公開URL
  https://object-storage.c3j1.conoha.io/v1/AUTH_{tenantId}/{container-name}/{object-name}

■ アカウント情報取得
  conoha_head path="/v1/AUTH_{tenantId}"

■ コンテナ詳細取得
  conoha_head path="/v1/AUTH_{tenantId}/{コンテナ名}"
```

### ボリューム管理フロー

```
■ ボリューム作成
  1. conoha_get path="/types" → ボリュームタイプ確認
  2. conoha_post path="/volumes" → ボリューム作成（size: 30, 100, 200, 500, 1000, 5000, 10000 GB）

■ ボリュームアタッチ
  conoha_post_put_by_param path="/os-volume_attachments" param=サーバーID requestBody={"volumeAttachment": {"volumeId": "<ID>"}}

■ ボリューム更新
  conoha_post_put_by_param path="/volumes" param=ボリュームID requestBody={"volume": {"name": "...", "description": "..."}}

■ ボリューム削除
  conoha_delete_by_param path="/volumes" param=ボリュームID
```

### 情報取得フロー

| 取得対象 | ツール | path | param |
|---|---|---|---|
| サーバー一覧 | `conoha_get` | `/servers/detail` | — |
| フレーバー一覧 | `conoha_get` | `/flavors/detail` | — |
| イメージ一覧 | `conoha_get` | `/v2/images?limit=200` | — |
| ボリューム一覧 | `conoha_get` | `/volumes/detail` | — |
| SSHキーペア一覧 | `conoha_get` | `/os-keypairs` | — |
| セキュリティグループ一覧 | `conoha_get` | `/v2.0/security-groups` | — |
| ポート一覧 | `conoha_get` | `/v2.0/ports` | — |
| サーバーのIP | `conoha_get_by_param` | `/ips` | サーバーID |
| CPU使用率 | `conoha_get_by_param` | `/rrd/cpu` | サーバーID |
| ディスクIO | `conoha_get_by_param` | `/rrd/disk` | サーバーID |

## ユーザー発話パターンとツール対応

| 発話パターン | 使用ツール | パス |
|---|---|---|
| 「サーバーを作成して」 | `conoha_post` | `/servers`（事前に flavors, images, volumes, types を取得） |
| 「サーバーを停止/起動/再起動して」 | `conoha_post_put_by_param` | `/action` |
| 「サーバーをリサイズして」 | `conoha_post_put_by_param` | `/action`（resize → confirmResize） |
| 「サーバーを削除して」 | `conoha_delete_by_param` | `/servers` |
| 「セキュリティグループを作成して」 | `conoha_post` | `/v2.0/security-groups` + `/v2.0/security-group-rules` |
| 「ファイルをアップロードして」 | `conoha_post_put` | `/v1/AUTH_{tenantId}/{container}/{object}` |
| 「ストレージを公開して」 | `conoha_post_by_header_param` | headerparam `X-Container-Read: .r:*` |
| 「サーバーの状態を確認して」 | `conoha_get` | `/servers/detail` |
| 「コンソールに接続して」 | `conoha_post_put_by_param` | `/remote-consoles` |

## エラー対応ガイド

| エラー | 原因 | 対処 |
|---|---|---|
| 401 Unauthorized | 認証情報不正 | 環境変数を確認 |
| 409 Conflict | リソース競合（削除中のボリューム等） | 状態を確認して再試行 |
| 400 Bad Request (adminPass) | パスワード要件不足 | 9-70文字、大小英字+数字+記号を含むか確認 |
| 400 Bad Request (port_range) | ポート範囲不正 | 0-65535の整数か確認 |
| 404 Not Found | リソースが存在しない | ID/名前を再確認 |
| 413 Entity Too Large | オブジェクトが5GB超 | 5GB未満のファイルのみ対応 |

## リファレンス

- [ツール別パス・パラメータ一覧](references/tool-path-reference.md)
- [リクエストボディスキーマ全集](references/request-body-schemas.md)
- [主要操作のワークフローレシピ](references/workflow-recipes.md)
