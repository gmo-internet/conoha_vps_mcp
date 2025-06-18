# Node.js版 環境構築

このドキュメントでは、Node.jsを利用したMCPサーバーのセットアップ・利用方法を解説します。

---

## セットアップ手順

```sh
# リポジトリをクローン
git clone https://github.com/gmo-internet/conoha_vps_mcp.git
cd conoha_vps_mcp
# ライブラリのインストール
npm install
```

## 環境変数の設定

主な環境変数:

- `OPENSTACK_TENANT_ID` : ConoHaのテナントID
- `OPENSTACK_USER_ID`   : ユーザーID
- `OPENSTACK_PASSWORD`  : パスワード

## サーバーの起動

```sh
npm start
```

## 環境設定

### Claude Desktopでの利用例

`claude_desktop_config.json`に以下を記載してください。

```json
{
  "mcpServers": {
    "ConoHa VPS MCP": {
      "command": "npm",
      "args": [ "--prefix", "PATH_TO_DIRECTORY", "start"],
      "env": {
        "OPENSTACK_TENANT_ID": "YOUR_OPENSTACK_TENANT_ID",
        "OPENSTACK_USER_ID": "YOUR_OPENSTACK_USER_ID",
        "OPENSTACK_PASSWORD": "YOUR_OPENSTACK_PASSWORD"
      }
    }
  }
}
```

`PATH_TO_DIRECTORY`、`YOUR_OPENSTACK_TENANT_ID`、`YOUR_OPENSTACK_USER_ID`、`YOUR_OPENSTACK_PASSWORD`は自身のものに置き換えてください。

### Clineでの利用例

### Cursorでの利用例

### VSCodeでの利用例

`.vscode/settings.json`に以下を記載し、コマンド実行時に認証情報を入力できます。

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

`PATH_TO_DIRECTORY`は自身のパスに置き換えてください。

まずGitHub Copilotを起動します（Windows/Linux：``ctrl + Shift+ I``、Mac：``Command ＋ Shift + I``）。

そしてチャット欄にあるドロップダウンメニューから**Agent**モードを選択します。

その後チャット欄にある**ツール**ボタンをクリックして、その中から**MCPサーバー：ConoHa VPS MCP**を選択してください。

以上の設定により、**ConoHa VPS MCP**をGitHub Copilotからツールとして使えるようになります。

## 認証情報について

ConoHa VPS Ver.3.0のAPI認証情報はConoHa管理画面から取得できます。
