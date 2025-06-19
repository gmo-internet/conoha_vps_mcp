# Node.js版セットアップガイド

Node.js を使用したConoHa VPS MCPのセットアップ手順を説明します。

## 前提条件

- **Node.js**: v18以上
- **npm**: Node.jsに付属

## セットアップ手順

### 1. プロジェクトの準備

```bash
# リポジトリをクローン
git clone https://github.com/gmo-internet/conoha_vps_mcp.git
cd conoha_vps_mcp

# 依存関係のインストール
npm install
```

### 2. 環境変数の設定

以下の環境変数を設定してください：

```txt
OPENSTACK_TENANT_ID: テナントID
OPENSTACK_USER_ID: APIユーザーのユーザーID
OPENSTACK_PASSWORD: APIユーザーのパスワード
```

各値はConoHaコントロールパネルのAPI設定で確認できます。

### 3. サーバーの起動テスト

```bash
npm start
```

## AIエージェント別設定方法

### Claude Desktop

`claude_desktop_config.json`に以下の設定を追加します：

```json
{
  "mcpServers": {
    "ConoHa VPS MCP": {
      "command": "npm",
      "args": ["--prefix", "PATH_TO_DIRECTORY", "start"],
      "env": {
        "OPENSTACK_TENANT_ID": "YOUR_OPENSTACK_TENANT_ID",
        "OPENSTACK_USER_ID": "YOUR_OPENSTACK_USER_ID",
        "OPENSTACK_PASSWORD": "YOUR_OPENSTACK_PASSWORD"
      }
    }
  }
}
```

以下の値を実際の値に置き換えてください：

- `PATH_TO_DIRECTORY`: プロジェクトのディレクトリパス
- `YOUR_OPENSTACK_TENANT_ID`: テナントID
- `YOUR_OPENSTACK_USER_ID`: APIユーザーのユーザーID
- `YOUR_OPENSTACK_PASSWORD`: APIユーザーのパスワード

### Cline (VSCode)

`.vscode/settings.json`に以下の設定を追加します：

```json
{
  "mcp": {
    "inputs": [
      { "type": "promptString", "id": "openstack-tenant-id", "description": "OpenStack Tenant ID" },
      { "type": "promptString", "id": "openstack-user-id", "description": "OpenStack User ID" },
      { "type": "promptString", "id": "openstack-password", "description": "OpenStack Password", "password": true }
    ],
    "servers": {
      "ConoHa VPS MCP": {
        "command": "npm",
        "args": ["--prefix", "PATH_TO_DIRECTORY", "start"],
        "env": {
          "OPENSTACK_TENANT_ID": "${input:openstack-tenant-id}",
          "OPENSTACK_USER_ID": "${input:openstack-user-id}",
          "OPENSTACK_PASSWORD": "${input:openstack-password}"
        }
      }
    }
  }
}
```

`PATH_TO_DIRECTORY`をプロジェクトのディレクトリパスに置き換えてください。

### GitHub Copilot (VSCode)

#### 設定方法

1. VSCode左下の歯車マークをクリックして設定を開きます

2. 上部の検索窓で「mcp」と検索します

3. 「settings.jsonで編集」をクリックします

4. 上記のCline設定と同じ内容を追加します

#### 使用方法

1. GitHub Copilotを起動します
   - **Windows/Linux**: `Ctrl + Shift + I`
   - **Mac**: `Command + Shift + I`

2. チャット欄のドロップダウンメニューから**Agent**モードを選択します

3. チャット欄の**ツール**ボタンをクリックして、**MCPサーバー：ConoHa VPS MCP**を選択します

4. プロンプトを入力して操作を実行します

   [サンプルプロンプト](../README.md#サンプルプロンプト)

### Cursor

設定方法は準備中です。Claude Desktop設定を参考にしてください。

## 認証情報の取得方法

ConoHa VPS v3.0のAPI認証情報は、ConoHaコントロールパネルのAPI設定画面から取得できます。

詳細な取得手順については、[ConoHa公式ドキュメント](https://doc.conoha.jp/reference/api-vps3/)をご確認ください。

## トラブルシューティング

### よくある問題

- **認証エラー**: 環境変数の値が正しく設定されているか確認してください
- **Node.jsバージョンエラー**: Node.js v18以上がインストールされているか確認してください
- **起動エラー**: `npm install`が正常に完了しているか確認してください
- **パス設定エラー**: `PATH_TO_DIRECTORY`が正しいプロジェクトパスに設定されているか確認してください

> [!TIP]
> 問題が解決しない場合は、[GitHub Issues](https://github.com/gmo-internet/conoha_vps_mcp/issues)でお気軽にお問い合わせください。
