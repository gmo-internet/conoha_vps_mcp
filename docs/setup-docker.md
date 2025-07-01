# Docker版セットアップガイド

Docker を使用したConoHa VPS MCPのセットアップ手順を説明します。

## 前提条件

- **Docker**: Windows/Mac/Linux対応
- **WSL**: Ubuntuなどのディストリビューションがインストール済み（Windows環境の場合）

## Docker runを使用したセットアップ

### 1. Dockerイメージのビルド

```bash
git clone https://github.com/gmo-internet/conoha_vps_mcp
cd conoha_vps_mcp
docker build -t conoha-vps-mcp .
```

### 2. VSCode設定の追加

1. VSCode左下の歯車マークをクリックして設定を開きます

   ![VSCodeの設定を開く](../assets/vscode_settings.png)

2. 上部の検索窓で「mcp」と検索します

   ![MCP設定を検索](../assets/vscode_settings_mcp.png)

3. 「settings.jsonで編集」をクリックします

4. `servers`セクションに以下の設定を追加します：

#### Windows環境

```json
"mcp": {
  "inputs": [
    {
      "type": "promptString",
      "id": "openstack-tenant-id",
      "description": "OpenStack Tenant ID"
    },
    {
      "type": "promptString",
      "id": "openstack-user-id",
      "description": "OpenStack User ID"
    },
    {
      "type": "promptString",
      "id": "openstack-password",
      "description": "OpenStack Password",
      "password": true
    }
  ],
  "servers": {
    "ConoHa VPS MCP": {
      "command": "wsl",
      "cwd": "PATH_TO_DIRECTORY",
      "args": [
        "docker",
        "run",
        "-i",
        "--rm",
        "-e",
        "OPENSTACK_TENANT_ID=${input:openstack-tenant-id}",
        "-e",
        "OPENSTACK_USER_ID=${input:openstack-user-id}",
        "-e",
        "OPENSTACK_PASSWORD=${input:openstack-password}",
        "conoha-vps-mcp"
      ]
    }
  }
}
```

#### Mac/Linux環境

```json
"mcp": {
  "inputs": [
    {
      "type": "promptString",
      "id": "openstack-tenant-id",
      "description": "OpenStack Tenant ID"
    },
    {
      "type": "promptString",
      "id": "openstack-user-id",
      "description": "OpenStack User ID"
    },
    {
      "type": "promptString",
      "id": "openstack-password",
      "description": "OpenStack Password",
      "password": true
    }
  ],
  "servers": {
    "ConoHa VPS MCP": {
      "command": "docker",
      "cwd": "PATH_TO_DIRECTORY",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "OPENSTACK_TENANT_ID=${input:openstack-tenant-id}",
        "-e",
        "OPENSTACK_USER_ID=${input:openstack-user-id}",
        "-e",
        "OPENSTACK_PASSWORD=${input:openstack-password}",
        "conoha-vps-mcp"
      ],
    }
  }
}
```

### 3. 設定値の確認

- `PATH_TO_DIRECTORY`: プロジェクトのディレクトリパスに置き換えてください
- 環境変数の設定値：

```txt
OPENSTACK_TENANT_ID: テナントID
OPENSTACK_USER_ID: APIユーザーのユーザーID
OPENSTACK_PASSWORD: APIユーザーのパスワード
```

各値はConoHaコントロールパネルのAPI設定で確認できます。

![ConoHa APIユーザー情報](../assets/conoha_api_info.png)

> [!TIP]
> 必要に応じて`.env`ファイルを用意し、`--env-file`オプションで指定することも可能です。

### 4. MCPサーバーの起動

編集したjsonファイル上に表示される起動ボタンをクリックして、MCPサーバーを起動します。

![起動と書かれたボタンをクリックして起動](../assets/vscode_settings_mcp_start.png)

### 5. ツールの使用

1. GitHub Copilotを起動します
   - **Windows/Linux**: `Ctrl + Shift + I`
   - **Mac**: `Command + Shift + I`

2. agentモードに切り替えます

3. チャット入力欄のツールボタンから、ConoHa VPS MCPが有効になっていることを確認します

   ![ツール一覧](../assets/view_tools.png)

4. プロンプトを入力して操作を実行します

   [サンプルプロンプト](../README.md#-使用例)

## トラブルシューティング

### よくある問題

- **認証エラー**: 環境変数の値が正しく設定されているか確認してください
- **Docker起動エラー**: Dockerが正常に動作しているか確認してください
- **WSLエラー**: Windows環境でWSLが正しく設定されているか確認してください
