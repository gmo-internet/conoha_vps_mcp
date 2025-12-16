# Node.js ローカルビルド版実行ガイド

## 目次

- [Node.js ローカルビルド版実行ガイド](#nodejs-ローカルビルド版実行ガイド)
  - [目次](#目次)
  - [前提条件](#前提条件)
  - [プロジェクトの準備](#プロジェクトの準備)
  - [AIエージェント別設定方法](#aiエージェント別設定方法)
    - [Cursor](#cursor)
      - [1. mcp.jsonに設定を記述](#1-mcpjsonに設定を記述)
      - [2. 必要な環境変数](#2-必要な環境変数)
      - [3. MCPサーバーの起動](#3-mcpサーバーの起動)
      - [4. ツールの使用](#4-ツールの使用)
    - [GitHub Copilot (VSCode)](#github-copilot-vscode)
      - [1. 設定の追加](#1-設定の追加)
      - [2. 必要な環境変数](#2-必要な環境変数-1)
      - [3. 起動方法/Copilot Chatでの利用方法](#3-起動方法copilot-chatでの利用方法)
      - [4. プロンプトを入力して操作を実行します](#4-プロンプトを入力して操作を実行します)
    - [GitHub Copilot (CLI)](#github-copilot-cli)
      - [1. 設定の追加](#1-設定の追加-1)
      - [2. サーバーの利用](#2-サーバーの利用)
    - [Codex CLI](#codex-cli)
      - [1. config.tomlに設定を記述](#1-configtomlに設定を記述)
      - [2. サーバーの利用](#2-サーバーの利用-1)
    - [Cline (VSCode)](#cline-vscode)
      - [1. cline\_mcp\_settings.jsonに設定を記述](#1-cline_mcp_settingsjsonに設定を記述)
      - [2. 必要な環境変数](#2-必要な環境変数-2)
      - [3. ツールの使用](#3-ツールの使用-1)
    - [Claude Desktop](#claude-desktop)
      - [1. claude\_desktop\_config.jsonに設定を記述](#1-claude_desktop_configjsonに設定を記述)
      - [2. 設定値の確認](#2-設定値の確認)
      - [3. ツールの使用](#3-ツールの使用-2)
  - [トラブルシューティング](#トラブルシューティング)
    - [よくある問題](#よくある問題)

Node.js を使用したConoHa VPS MCPのセットアップ手順を説明します。

## 前提条件

- **Node.js**: v20以上
- **npm**: Node.jsに付属

## プロジェクトの準備

```bash
# リポジトリをクローン
git clone https://github.com/gmo-internet/conoha_vps_mcp.git
cd conoha_vps_mcp

# 依存関係のインストール
npm install

# ビルド
npm run build

# ビルドが成功したことを確認
ls dist/index.js
```

## AIエージェント別設定方法

### Cursor

<details>
<summary>セットアップ手順</summary>

#### 1. mcp.jsonに設定を記述
mcp.jsonに起動に必要なコマンド、環境変数を設定してください。

以下の設定を行います：

- **コマンド**: `npm`
- **引数**: 
  - `--prefix`,
  - `PATH_TO_DIRECTORY`,
  - `start`
- **環境変数**:
  - `OPENSTACK_TENANT_ID`: `YOUR_OPENSTACK_TENANT_ID`
  - `OPENSTACK_USER_ID`: `YOUR_OPENSTACK_USER_ID`
  - `OPENSTACK_PASSWORD`: `YOUR_OPENSTACK_PASSWORD`

##### mcp.jsonの書き方
以下のURL先の公式ドキュメントを参照してください。

公式ドキュメント：https://cursor.com/ja/docs/context/mcp#mcpjson

##### mcp.jsonの設置場所

特定のプロジェクト専用のツールとして設定する場合
```txt
使用するプロジェクト内に以下のディレクトリ、ファイルを作成
.cursor/mcp.json
```

どこからでも使えるツールとして設定する場合
```txt
~/.cursor/mcp.json
```


#### 2. 必要な環境変数

```txt
OPENSTACK_TENANT_ID: テナントID
OPENSTACK_USER_ID: APIユーザーのユーザーID
OPENSTACK_PASSWORD: APIユーザーのパスワード
```

各値はConoHaコントロールパネルのAPI設定で確認できます。

![ConoHa APIユーザー情報](../assets/conoha_api_info.png)
*https://manage.conoha.jp/V3/API/*

#### 3. MCPサーバーの起動

mcp.jsonを設定後、設定内容に問題がない場合は自動的に起動します。

#### 4. ツールの使用

1. チャット欄左下の切り替えメニューから**Agent**モードを選択します

2. プロンプトを入力して操作を実行します

   [サンプルプロンプト](../README.md#-使用例)

</details>

### GitHub Copilot (VSCode)

<details>
<summary>セットアップ手順</summary>

#### 1. 設定の追加

mcp.jsonに起動に必要なコマンド、環境変数を設定してください。

以下の設定を行います：

- **コマンド**: `npm`
- **引数**: 
  - `--prefix`,
  - `PATH_TO_DIRECTORY`,
  - `start`

また、以下の入力プロンプトを設定します：
- `openstack-tenant-id` (OpenStack Tenant ID)
- `openstack-user-id` (OpenStack User ID)
- `openstack-password` (OpenStack Password、パスワードタイプ)

mcp.jsonの詳しい書き方や配置場所は、公式ドキュメント（ https://docs.github.com/ja/copilot/how-tos/provide-context/use-mcp/extend-copilot-chat-with-mcp#configuring-mcp-servers-manually ）を参照してください

#### 2. 必要な環境変数

- 環境変数の設定値：

```txt
OPENSTACK_TENANT_ID: テナントID
OPENSTACK_USER_ID: APIユーザーのユーザーID
OPENSTACK_PASSWORD: APIユーザーのパスワード
```

各値はConoHaコントロールパネルのAPI設定で確認できます。

![ConoHa APIユーザー情報](../assets/conoha_api_info.png)
*https://manage.conoha.jp/V3/API/*


💡必要に応じて`.env`ファイルを用意し、`--env-file`オプションで指定することも可能です。

#### 3. 起動方法/Copilot Chatでの利用方法

下記の公式ドキュメントを参照してください

起動方法：https://docs.github.com/ja/copilot/how-tos/provide-context/use-mcp/extend-copilot-chat-with-mcp#configuring-mcp-servers-manually

Copilot Chatでの利用方法：https://docs.github.com/ja/copilot/how-tos/provide-context/use-mcp/extend-copilot-chat-with-mcp#copilot-chat-%E3%81%A7%E3%81%AE-mcp-%E3%82%B5%E3%83%BC%E3%83%90%E3%83%BC%E3%81%AE%E4%BD%BF%E7%94%A8


#### 4. プロンプトを入力して操作を実行します

   [サンプルプロンプト](../README.md#-使用例)

</details>

### GitHub Copilot (CLI)
<details>
<summary>セットアップ手順</summary>

GitHub Copilot (CLI)のインストール方法や起動方法などは、下記の公式ドキュメントを参照してください。
[インストール方法]("https://docs.github.com/ja/copilot/how-tos/set-up/install-copilot-cli")
[起動方法]("https://docs.github.com/ja/copilot/how-tos/use-copilot-agents/use-copilot-cli")

#### 1. 設定の追加
1. GitHub Copilot (CLI)を起動させて、以下のコマンドを入力します。

```
/mcp add
```

コマンドを入力して実行後、MCPサーバーの実行に必要な情報を入力する欄が出力されます。
それぞれの項目では以下のように入力してください。

**Server Name:**

この項目では、ユーザー自身が識別できる名前であれば任意の名前を入力することができます。
ただし英数字、アンダースコア、ハイフンのみを入力することができます（空白などを含めることはできません）。
```
例：ConoHa-VPS-MCP
```

**Server Type:**
```
[1] Local
```

**Command:**
```
npm --prefix PATH_TO_DIRECTORY start
```

**Environment Variables:**
```
OPENSTACK_TENANT_ID=YOUR_OPENSTACK_TENANT_ID, OPENSTACK_USER_ID=YOUR_OPENSTACK_USER_ID, OPENSTACK_PASSWORD=YOUR_OPENSTACK_PASSWORD
```
それぞれの環境変数の設定値：

```txt
OPENSTACK_TENANT_ID: テナントID
OPENSTACK_USER_ID: APIユーザーのユーザーID
OPENSTACK_PASSWORD: APIユーザーのパスワード
```

各値はConoHaコントロールパネルのAPI設定で確認できます。

![ConoHa APIユーザー情報](../assets/conoha_api_info.png)
*https://manage.conoha.jp/V3/API/*

**Tools**
すべてのtoolを使用したい場合は``*``を、使用したいtoolを指定したい場合はカンマ区切りでtool名を入力してください（デフォルト値は``*``）

[tool一覧](./tool.md)

以上の入力が完了したら、``ctrl`` + ``s``で登録情報を保存します。
``MCP configuration saved successfully! Changes will take effect immediately.``というメッセージが出力されたら``q``キーを押して終了させます。

#### 2. サーバーの利用
プロンプトを入力して操作を実行します。
[サンプルプロンプト](../README.md#-使用例)

</details>

### Codex CLI

<details>
<summary>セットアップ手順</summary>

Codex CLIのインストール方法や起動方法などは、下記の公式ドキュメントを参照してください。
[インストール/起動方法](https://github.com/openai/codex/blob/main/README.md)

### 1. config.tomlに設定を記述
config.tomlに起動に必要なコマンド、環境変数を設定してください。

以下の設定を行います：

- **コマンド**: `npm`
- **引数**: 
  - `--prefix`,
  - `PATH_TO_DIRECTORY`,
  - `start`
- **環境変数**:
  - `OPENSTACK_TENANT_ID`: `YOUR_OPENSTACK_TENANT_ID`
  - `OPENSTACK_USER_ID`: `YOUR_OPENSTACK_USER_ID`
  - `OPENSTACK_PASSWORD`: `YOUR_OPENSTACK_PASSWORD`

config.tomlの場所：``~/.codex/config.toml``

config.tomlでの詳しい設定方法は、下記の公式ドキュメントを参照してください。
[config.tomlでMCPサーバーを設定する方法](https://github.com/openai/codex/blob/main/docs/config.md#connecting-to-mcp-servers)

初めてMCPサーバーを追加する場合などはconfig.tomlが作成されていない場合があります。
その際はご自身でconfig.tomlを作成してください。

それぞれの環境変数の設定値：

```txt
OPENSTACK_TENANT_ID: テナントID
OPENSTACK_USER_ID: APIユーザーのユーザーID
OPENSTACK_PASSWORD: APIユーザーのパスワード
```

各値はConoHaコントロールパネルのAPI設定で確認できます。

![ConoHa APIユーザー情報](../assets/conoha_api_info.png)
*https://manage.conoha.jp/V3/API/*

#### 2. サーバーの利用
プロンプトを入力して操作を実行します。
[サンプルプロンプト](../README.md#-使用例)

</details>

### Cline (VSCode)

<details>
<summary>セットアップ手順</summary>

#### 1. cline_mcp_settings.jsonに設定を記述
cline_mcp_settings.jsonに起動に必要なコマンド、環境変数を設定してください。

以下の設定を行います：

- **コマンド**: `npm`
- **引数**: 
  - `--prefix`,
  - `PATH_TO_DIRECTORY`,
  - `start`

##### cline_mcp_settings.jsonの書き方

cline_mcp_settings.jsonの詳しい書き方や設定方法は、公式ドキュメント（ https://docs.cline.bot/mcp/configuring-mcp-servers ）を参照してください。

#### 2. 必要な環境変数

- 環境変数の設定値：

```txt
OPENSTACK_TENANT_ID: テナントID
OPENSTACK_USER_ID: APIユーザーのユーザーID
OPENSTACK_PASSWORD: APIユーザーのパスワード
```

各値はConoHaコントロールパネルのAPI設定で確認できます。

![ConoHa APIユーザー情報](../assets/conoha_api_info.png)

#### 3. ツールの使用

1. チャット欄右下の切り替えメニューから**Act**モードを選択します

2. プロンプトを入力して操作を実行します

   [サンプルプロンプト](../README.md#-使用例)

</details>

### Claude Desktop

<details>
<summary>セットアップ手順</summary>

#### 1. claude_desktop_config.jsonに設定を記述
claude_desktop_config.jsonに起動に必要なコマンド、環境変数を設定してください。

以下の設定を行います：

- **コマンド**: `node`
- **作業ディレクトリ (cwd)**: PATH_TO_DIRECTORY（プロジェクトディレクトリのパスを指定）
- **引数**: 
  - `dist/index.js`

##### claude_desktop_config.jsonの書き方

claude_desktop_config.jsonの詳しい書き方や設定方法は、公式ドキュメント（ https://mcp-jp.apidog.io/claude-デスクトップ-ユーザー向け-870862m0 ）を参照してください。

#### 2. 設定値の確認

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

   [サンプルプロンプト](../README.md#-使用例)

</details>

## トラブルシューティング

### よくある問題

- **認証エラー**: 環境変数の値が正しく設定されているか確認してください
- **Node.jsバージョンエラー**: Node.js v20以上がインストールされているか確認してください
- **起動エラー**: `npm install`や`npm run build`が正常に完了しているか確認してください
- **パス設定エラー**: `PATH_TO_DIRECTORY`が正しいプロジェクトパスに設定されているか確認してください
- **ファイル不存在エラー**: `npm run build`が正常に完了し、`dist/index.js`ファイルが存在するか確認してください
- その他FAQは[こちら](FAQ.md)

**💡 ヒント:** 問題が解決しない場合は、[GitHub Issues](https://github.com/gmo-internet/conoha_vps_mcp/issues)でお気軽にお問い合わせください。
