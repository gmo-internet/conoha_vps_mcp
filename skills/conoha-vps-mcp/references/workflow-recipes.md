# 主要操作のワークフローレシピ

## 1. サーバー作成の完全手順

### Step 1: フレーバー一覧取得

ツール: `conoha_get`
```json
{ "path": "/flavors/detail" }
```
→ ユーザーの要件（メモリ、CPU等）に合うフレーバーの `id` を控える

### Step 2: イメージ一覧取得

ツール: `conoha_get`
```json
{ "path": "/v2/images?limit=200" }
```
→ ユーザーが指定したOS/バージョンのイメージ `id` を控える

### Step 3: ボリュームタイプ一覧取得

ツール: `conoha_get`
```json
{ "path": "/types" }
```
→ ボリュームタイプの `name` または `id` を控える

### Step 4: ブートボリューム作成

ツール: `conoha_post`
```json
{
  "input": {
    "path": "/volumes",
    "requestBody": {
      "volume": {
        "size": 30,
        "name": "boot-volume-1",
        "volume_type": "c3j1-ds02-boot",
        "imageRef": "<イメージID>",
        "description": null
      }
    }
  }
}
```
→ 作成されたボリュームの `id` を控える

### Step 5: ユーザーに adminPass を確認

パスワード要件:
- 9-70文字
- 英大文字、英小文字、数字、記号をそれぞれ含む
- 利用可能な記号: `\^$+-*/|()[]{}.,?!_=&@~%#:;'"`
- **自動生成・提案禁止。必ずユーザーに入力を依頼する**

### Step 6: サーバー作成

ツール: `conoha_post`
```json
{
  "input": {
    "path": "/servers",
    "requestBody": {
      "server": {
        "flavorRef": "<フレーバーID>",
        "adminPass": "<ユーザーが指定したパスワード>",
        "block_device_mapping_v2": [
          { "uuid": "<ボリュームID>" }
        ],
        "metadata": {
          "instance_name_tag": "my-server"
        },
        "security_groups": [
          { "name": "default" }
        ]
      }
    }
  }
}
```

---

## 2. スタートアップスクリプト付きサーバー作成

Step 1-3 はサーバー作成の完全手順と同じ。

### Step 4: スタートアップスクリプト一覧取得

ツール: `conoha_get`
```json
{ "path": "/startup-scripts" }
```

### Step 5: スクリプト内容の取得

ツール: `fetch_url`
```json
{ "url": "<スクリプトのURL>" }
```

### Step 6: Base64エンコード

ツール: `encode_base64`
```json
{ "text": "<スクリプト内容>" }
```
→ **自前でのBase64エンコード禁止。必ず encode_base64 ツールを使用する**

パラメータ付きスクリプトの場合、パラメータを埋め込んだ内容を encode_base64 に渡す。

### Step 7: ブートボリューム作成（Step 4 と同じ）

### Step 8: サーバー作成（user_data 付き）

ツール: `conoha_post`
```json
{
  "input": {
    "path": "/servers",
    "requestBody": {
      "server": {
        "flavorRef": "<フレーバーID>",
        "adminPass": "<ユーザーが指定したパスワード>",
        "block_device_mapping_v2": [
          { "uuid": "<ボリュームID>" }
        ],
        "metadata": {
          "instance_name_tag": "my-server"
        },
        "security_groups": [
          { "name": "default" }
        ],
        "user_data": "<encode_base64の結果>"
      }
    }
  }
}
```

---

## 3. セキュリティグループ作成とサーバーへの適用

### Step 1: セキュリティグループ作成

ツール: `conoha_post`
```json
{
  "input": {
    "path": "/v2.0/security-groups",
    "requestBody": {
      "security_group": {
        "name": "web-server-sg",
        "description": "HTTP/HTTPSを許可するセキュリティグループ"
      }
    }
  }
}
```
→ 作成されたセキュリティグループの `id` を控える

### Step 2: ルール追加（HTTP）

ツール: `conoha_post`
```json
{
  "input": {
    "path": "/v2.0/security-group-rules",
    "requestBody": {
      "security_group_rule": {
        "security_group_id": "<セキュリティグループID>",
        "direction": "ingress",
        "ethertype": "IPv4",
        "protocol": "tcp",
        "port_range_min": 80,
        "port_range_max": 80,
        "remote_ip_prefix": "0.0.0.0/0"
      }
    }
  }
}
```
→ **port_range_min / port_range_max はユーザーに確認して設定。自動設定禁止。**

### Step 3: ルール追加（HTTPS）

同様に port_range_min: 443, port_range_max: 443 でルールを追加。

### Step 4: ポート一覧取得

ツール: `conoha_get`
```json
{ "path": "/v2.0/ports" }
```
→ 対象サーバーの `device_id` が一致するポートの `id` を特定

### Step 5: ポートにセキュリティグループを適用

ツール: `conoha_post_put_by_param`
```json
{
  "input": {
    "path": "/v2.0/ports",
    "param": "<ポートID>",
    "requestBody": {
      "port": {
        "security_groups": ["<セキュリティグループID>"]
      }
    }
  }
}
```

---

## 4. サーバーリサイズ手順

### Step 1: フレーバー一覧取得

ツール: `conoha_get`
```json
{ "path": "/flavors/detail" }
```
→ リサイズ先のフレーバー `id` を確認

### Step 2: リサイズ実行

ツール: `conoha_post_put_by_param`
```json
{
  "input": {
    "path": "/action",
    "param": "<サーバーID>",
    "requestBody": {
      "resize": {
        "flavorRef": "<リサイズ先フレーバーID>"
      }
    }
  }
}
```

### Step 3: 状態確認

ツール: `conoha_get`
```json
{ "path": "/servers/detail" }
```
→ サーバーの status が `VERIFY_RESIZE` になるまで待機

### Step 4: リサイズ確定

ツール: `conoha_post_put_by_param`
```json
{
  "input": {
    "path": "/action",
    "param": "<サーバーID>",
    "requestBody": {
      "confirmResize": null
    }
  }
}
```

リサイズを取り消す場合:
```json
{
  "input": {
    "path": "/action",
    "param": "<サーバーID>",
    "requestBody": {
      "revertResize": null
    }
  }
}
```

---

## 5. オブジェクトストレージWeb公開

### Step 1: アカウント容量設定

ツール: `conoha_post_by_header_param`
```json
{
  "input": {
    "path": "/v1/AUTH_{tenantId}",
    "headerparam": {
      "X-Account-Meta-Quota-Giga-Bytes": "200"
    }
  }
}
```

### Step 2: コンテナ作成

ツール: `conoha_post_put`
```json
{
  "input": {
    "path": "/v1/AUTH_{tenantId}/mysite-dev"
  }
}
```

### Step 3: オブジェクトアップロード

ツール: `conoha_post_put`
```json
{
  "input": {
    "path": "/v1/AUTH_{tenantId}/mysite-dev/index.html",
    "content": "/home/user/path/to/index.html",
    "contentType": "text/html"
  }
}
```
→ `content` にはファイルの**絶対パス**を指定（ファイル内容ではない）

### Step 4: Web公開設定

ツール: `conoha_post_by_header_param`
```json
{
  "input": {
    "path": "/v1/AUTH_{tenantId}/mysite-dev",
    "headerparam": {
      "X-Container-Read": ".r:*"
    }
  }
}
```

### 公開URL

```
https://object-storage.c3j1.conoha.io/v1/AUTH_{tenantId}/mysite-dev/index.html
```

### Web公開解除

ツール: `conoha_post_by_header_param`
```json
{
  "input": {
    "path": "/v1/AUTH_{tenantId}/mysite-dev",
    "headerparam": {
      "X-Container-Read": ""
    }
  }
}
```

---

## 6. サーバー削除手順

### Step 1: サーバー一覧確認

ツール: `conoha_get`
```json
{ "path": "/servers/detail" }
```
→ 削除対象サーバーの `id` を確認

### Step 2: サーバー停止（起動中の場合）

ツール: `conoha_post_put_by_param`
```json
{
  "input": {
    "path": "/action",
    "param": "<サーバーID>",
    "requestBody": {
      "os-stop": null
    }
  }
}
```

### Step 3: サーバー削除

ツール: `conoha_delete_by_param`
```json
{
  "path": "/servers",
  "param": "<サーバーID>"
}
```

**注意**: サーバー削除は取り消せない。削除前にユーザーに確認すること。
