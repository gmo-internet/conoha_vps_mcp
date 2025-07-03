# Node.js ローカルビルド版実行ガイド

## 目次

- [Node.js ローカルビルド版実行ガイド](#nodejs-ローカルビルド版実行ガイド)
  - [目次](#目次)
  - [前提条件](#前提条件)
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
      - [2. 設定値の確認](#2-設定値の確認-1)
    - [3. MCPサーバーの起動](#3-mcpサーバーの起動)
    - [4. ツールの使用](#4-ツールの使用-1)
  - [トラブルシューティング](#トラブルシューティング)
    - [よくある問題](#よくある問題)

Node.js を使用したConoHa VPS MCPのセットアップ手順を説明します。

## 前提条件

- **Node.js**: v18以上
- **npm**: Node.jsに付属

## プロジェクトの準備

```bash
# リポジトリをクローン
git clone https://github.com/gmo-internet/conoha_vps_mcp.git

# 依存関係のインストール
npm install

# ビルド
npm run build
```

## AIエージェント別設定方法

### Claude Desktop

<details>
<summary>セットアップ手順</summary>

#### 1. Claude Desktopの設定の追加

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
      "command": "node",
      "args": ["PATH_TO_DIRECTORY", "dist/index.js"],
      "env": {
        "OPENSTACK_TENANT_ID": "YOUR_OPENSTACK_TENANT_ID",
        "OPENSTACK_USER_ID": "YOUR_OPENSTACK_USER_ID",
        "OPENSTACK_PASSWORD": "YOUR_OPENSTACK_PASSWORD",
        "OPENSTACK_IDENTITY_BASE_URL": "https://identity.c3j1.conoha.io/v3",
        "OPENSTACK_COMPUTE_BASE_URL": "https://compute.c3j1.conoha.io/v2.1",
        "OPENSTACK_VOLUME_BASE_URL": "https://block-storage.c3j1.conoha.io/v3",
        "OPENSTACK_IMAGE_BASE_URL": "https://image-service.c3j1.conoha.io",
        "OPENSTACK_NETWORK_BASE_URL": "https://networking.c3j1.conoha.io"
      }
    }
  }
}
```

#### 2. 設定値の確認

- `PATH_TO_DIRECTORY`: プロジェクトのディレクトリパスに置き換えてください
- 環境変数の設定値：

```txt
OPENSTACK_TENANT_ID: テナントID
OPENSTACK_USER_ID: APIユーザーのユーザーID
OPENSTACK_PASSWORD: APIユーザーのパスワード
```

各値はConoHaコントロールパネルのAPI設定で確認できます。

![ConoHa APIユーザー情報](../assets/conoha_api_info.png)

#### 3. ツールの使用

プロンプトを入力して操作を実行します

   [サンプルプロンプト](../README.md#使用例)

</details>

### Cline (VSCode)

<details>
<summary>セットアップ手順</summary>

#### 1. VSCodeにおけるClineのインストール

1. VSCode左側の拡張機能メニューを開きます

   ![VSCodeの拡張機能メニューを開く](../assets/vscode_install.png)

2. 上部の検索窓で「cline」と検索し、Clineをインストールします

   ![Clineをインストール](../assets/cline_install.png)

#### 2. Clineの設定の追加

1. VSCode左側のClineメニューを開き、適切なプランを選択するとMCPサーバーアイコンが表示されるため、これをクリックします

   ![ClineのMCPサーバー設定を開く](../assets/cline_setting.png)

2. 歯車アイコンから設定を開き、 **[Configure MCP Servers]** をクリックします

   ![ClineのMCPサーバーconfigファイルを開く](../assets/cline_setting_config.png)

3. `cline_mcp_settings.json`に以下の設定を追加します：

```json
{
  "mcpServers": {
    "ConoHa VPS MCP": {
      "command": "npm",
      "args": ["--prefix", "PATH_TO_DIRECTORY", "start"],
      "env": {
        "OPENSTACK_TENANT_ID": "YOUR_OPENSTACK_TENANT_ID",
        "OPENSTACK_USER_ID": "YOUR_OPENSTACK_USER_ID",
        "OPENSTACK_PASSWORD": "YOUR_OPENSTACK_PASSWORD",
        "OPENSTACK_IDENTITY_BASE_URL": "https://identity.c3j1.conoha.io/v3",
        "OPENSTACK_COMPUTE_BASE_URL": "https://compute.c3j1.conoha.io/v2.1",
        "OPENSTACK_VOLUME_BASE_URL": "https://block-storage.c3j1.conoha.io/v3",
        "OPENSTACK_IMAGE_BASE_URL": "https://image-service.c3j1.conoha.io",
        "OPENSTACK_NETWORK_BASE_URL": "https://networking.c3j1.conoha.io"
      }
    }
  }
}
```

#### 3. 設定値の確認

- `PATH_TO_DIRECTORY`: プロジェクトのディレクトリパスに置き換えてください
- 環境変数の設定値：

```txt
OPENSTACK_TENANT_ID: テナントID
OPENSTACK_USER_ID: APIユーザーのユーザーID
OPENSTACK_PASSWORD: APIユーザーのパスワード
```

各値はConoHaコントロールパネルのAPI設定で確認できます。

![ConoHa APIユーザー情報](../assets/conoha_api_info.png)

#### 4. ツールの使用

1. チャット欄右下の切り替えメニューから**Act**モードを選択します

2. プロンプトを入力して操作を実行します

   [サンプルプロンプト](../README.md#使用例)

</details>

### GitHub Copilot (VSCode)

<details>
<summary>セットアップ手順</summary>

#### 1. VSCode設定の追加

1. VSCode左下の歯車マークをクリックして設定を開きます

   ![VSCodeの設定を開く](../assets/vscode_settings.png)

2. 上部の検索窓で「mcp」と検索します

   ![MCP設定を検索](../assets/vscode_settings_mcp.png)

3. 「settings.jsonで編集」をクリックします

4. `mcp`セクションに以下の設定を追加します：

```json
{
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
        "command": "npm",
        "args": [
          "--prefix",
          "PATH_TO_DIRECTORY",
          "start"
        ],
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

#### 2. 設定値の確認

- `PATH_TO_DIRECTORY`: プロジェクトのディレクトリパスに置き換えてください
- 環境変数の設定値：

```txt
OPENSTACK_TENANT_ID: テナントID
OPENSTACK_USER_ID: APIユーザーのユーザーID
OPENSTACK_PASSWORD: APIユーザーのパスワード
```

各値はConoHaコントロールパネルのAPI設定で確認できます。

![ConoHa APIユーザー情報](../assets/conoha_api_info.png)
*https://manage.conoha.jp/V3/API/*

### 3. MCPサーバーの起動

編集したjsonファイル上に表示される起動ボタンをクリックして、MCPサーバーを起動します。その際、環境変数の初期設定を求められるので、確認した設定値を入力してください。

### 4. ツールの使用

1. GitHub Copilotを起動します
   - **Windows/Linux**: `Ctrl + Shift + I`
   - **Mac**: `Command + Shift + I`

2. チャット欄のドロップダウンメニューから**Agent**モードを選択します

3. チャット欄の**ツール**ボタンをクリックして、**MCPサーバー：ConoHa VPS MCP**を選択します

   ![MCPサーバー：ConoHa VPS MCPと表示される](../assets/view_tools.png)

4. プロンプトを入力して操作を実行します

   [サンプルプロンプト](../README.md#-使用例)

</details>

## トラブルシューティング

### よくある問題

- **認証エラー**: 環境変数の値が正しく設定されているか確認してください
- **Node.jsバージョンエラー**: Node.js v18以上がインストールされているか確認してください
- **起動エラー**: `npm install`や`npm run build`が正常に完了しているか確認してください
- **パス設定エラー**: `PATH_TO_DIRECTORY`が正しいプロジェクトパスに設定されているか確認してください
- **ファイル不存在エラー**: `npm run build`が正常に完了し、`dist/index.js`ファイルが存在するか確認してください

> [!TIP]
> 問題が解決しない場合は、[GitHub Issues](https://github.com/gmo-internet/conoha_vps_mcp/issues)でお気軽にお問い合わせください。
