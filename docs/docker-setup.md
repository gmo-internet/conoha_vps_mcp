# Docker ローカルビルド版実行ガイド

## 目次

- [Docker ローカルビルド版実行ガイド](#docker-ローカルビルド版実行ガイド)
  - [目次](#目次)
  - [前提条件](#前提条件)
  - [Docker runを使用した実行方法](#docker-runを使用した実行方法)
    - [プロジェクトの準備](#プロジェクトの準備)
    - [AIエージェント別設定方法](#aiエージェント別設定方法)
      - [Claude Desktop](#claude-desktop)
        - [1. Claude Desktopの設定の追加](#1-claude-desktopの設定の追加)
        - [2. 設定値の確認](#2-設定値の確認)
        - [3. ツールの使用](#3-ツールの使用)
      - [Cline (VSCode)](#cline-vscode)
        - [1. VSCodeにおけるClineのインストール](#1-vscodeにおけるclineのインストール)
        - [2. Clineの設定の追加](#2-clineの設定の追加)
        - [3. 設定値の確認](#3-設定値の確認)
        - [4. ツールの使用](#4-ツールの使用)
      - [GitHub Copilot (VSCode)](#github-copilot-vscode)
        - [1. VSCode設定の追加](#1-vscode設定の追加)
          - [Windows環境](#windows環境)
          - [Mac/Linux環境](#maclinux環境)
        - [2. 設定値の確認](#2-設定値の確認-1)
    - [3. MCPサーバーの起動](#3-mcpサーバーの起動)
    - [4. ツールの使用](#4-ツールの使用-1)
  - [トラブルシューティング](#トラブルシューティング)
    - [よくある問題](#よくある問題)

Docker を使用したConoHa VPS MCPのセットアップ手順を説明します。

## 前提条件

- **Docker**: Windows/Mac/Linux対応
- **WSL**: Ubuntuなどのディストリビューションがインストール済み（Windows環境の場合）

## Docker runを使用した実行方法

### プロジェクトの準備

```bash
git clone https://github.com/gmo-internet/conoha_vps_mcp
cd conoha_vps_mcp
docker build -t conoha-vps-mcp .
```

### AIエージェント別設定方法

#### Claude Desktop

<details>
<summary>展開</summary>

##### 1. Claude Desktopの設定の追加

1. メニューバーから **[ファイル]** → **[設定]** を開きます

   ![Claude Desktopの設定を開く](../assets/claude_desktop_setting.png)

2. 左側のメニューから **[開発者]** タブを選択します

   ![開発者タブ](../assets/claude_desktop_setting_config.png)

3. **[構成を編集]** をクリックします

4. `claude_desktop_config.json`を開き、以下の設定を追加します：

```json
{
  "mcpServers": {
    "ConoHa VPS MCP": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "OPENSTACK_TENANT_ID=YOUR_OPENSTACK_TENANT_ID",
        "-e",
        "OPENSTACK_USER_ID=YOUR_OPENSTACK_USER_ID",
        "-e",
        "OPENSTACK_PASSWORD=YOUR_OPENSTACK_PASSWORD",
        "conoha-vps-mcp"
      ]
    }
  }
}
```

##### 2. 設定値の確認

- 環境変数の設定値：

```txt
OPENSTACK_TENANT_ID: テナントID
OPENSTACK_USER_ID: APIユーザーのユーザーID
OPENSTACK_PASSWORD: APIユーザーのパスワード
```

各値はConoHaコントロールパネルのAPI設定で確認できます。

![ConoHa APIユーザー情報](../assets/conoha_api_info.png)

##### 3. ツールの使用

プロンプトを入力して操作を実行します

   [サンプルプロンプト](../README.md#使用例)

</details>

#### Cline (VSCode)

<details>
<summary>展開</summary>

##### 1. VSCodeにおけるClineのインストール

1. VSCode左側の拡張機能メニューを開きます

   ![VSCodeの拡張機能メニューを開く](../assets/vscode_install.png)

2. 上部の検索窓で「cline」と検索し、Clineをインストールします

   ![Clineをインストール](../assets/cline_install.png)

##### 2. Clineの設定の追加

1. VSCode左側のClineメニューを開き、適切なプランを選択するとMCPサーバーアイコンが表示されるため、これをクリックします

   ![ClineのMCPサーバー設定を開く](../assets/cline_setting.png)

2. 歯車アイコンから設定を開き、 **[Configure MCP Servers]** をクリックします

   ![ClineのMCPサーバーconfigファイルを開く](../assets/cline_setting_config.png)

3. `cline_mcp_settings.json`に以下の設定を追加します：

```json
{
  "mcpServers": {
    "ConoHa VPS MCP": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "OPENSTACK_TENANT_ID=YOUR_OPENSTACK_TENANT_ID",
        "-e",
        "OPENSTACK_USER_ID=YOUR_OPENSTACK_USER_ID",
        "-e",
        "OPENSTACK_PASSWORD=YOUR_OPENSTACK_PASSWORD",
        "conoha-vps-mcp"
      ]
    }
  }
}
```

##### 3. 設定値の確認

- 環境変数の設定値：

```txt
OPENSTACK_TENANT_ID: テナントID
OPENSTACK_USER_ID: APIユーザーのユーザーID
OPENSTACK_PASSWORD: APIユーザーのパスワード
```

各値はConoHaコントロールパネルのAPI設定で確認できます。

![ConoHa APIユーザー情報](../assets/conoha_api_info.png)

##### 4. ツールの使用

1. チャット欄右下の切り替えメニューから**Act**モードを選択します

2. プロンプトを入力して操作を実行します

   [サンプルプロンプト](../README.md#使用例)

</details>

#### GitHub Copilot (VSCode)

<details>
<summary>展開</summary>

##### 1. VSCode設定の追加

1. VSCode左下の歯車マークをクリックして設定を開きます

   ![VSCodeの設定を開く](../assets/vscode_settings.png)

2. 上部の検索窓で「mcp」と検索します

   ![MCP設定を検索](../assets/vscode_settings_mcp.png)

3. 「settings.jsonで編集」をクリックします

4. `mcp`セクションに以下の設定を追加します：

###### Windows環境

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

###### Mac/Linux環境

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
      ]
    }
  }
}
```

##### 2. 設定値の確認

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

</details>

### 3. MCPサーバーの起動

編集したjsonファイル上に表示される起動ボタンをクリックして、MCPサーバーを起動します。

![起動と書かれたボタンをクリックして起動](../assets/vscode_settings_mcp_start.png)

### 4. ツールの使用

1. GitHub Copilotを起動します
   - **Windows/Linux**: `Ctrl + Shift + I`
   - **Mac**: `Command + Shift + I`

2. agentモードに切り替えます

3. チャット入力欄のツールボタンから、ConoHa VPS MCPが有効になっていることを確認します

   ![ツール一覧](../assets/view_tools.png)

4. プロンプトを入力して操作を実行します

   [サンプルプロンプト](../README.md#使用例)

## トラブルシューティング

### よくある問題

- **認証エラー**: 環境変数の値が正しく設定されているか確認してください
- **Docker起動エラー**: Dockerが正常に動作しているか確認してください
- **WSLエラー**: Windows環境でWSLが正しく設定されているか確認してください
