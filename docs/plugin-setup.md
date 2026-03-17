# Claude Code プラグインインストール版実行ガイド

## 目次

- [Claude Code プラグインインストール版実行ガイド](#claude-code-プラグインインストール版実行ガイド)
  - [目次](#目次)
  - [前提条件](#前提条件)
  - [セットアップ手順](#セットアップ手順)
    - [1. マーケットプレイスの追加](#1-マーケットプレイスの追加)
    - [2. プラグインのインストール](#2-プラグインのインストール)
    - [3. 環境変数の設定](#3-環境変数の設定)
    - [4. プラグインの有効化](#4-プラグインの有効化)
    - [5. ツールの使用](#5-ツールの使用)
  - [プラグインが提供するスキル](#プラグインが提供するスキル)
  - [プラグインの管理](#プラグインの管理)
  - [トラブルシューティング](#トラブルシューティング)
    - [よくある問題](#よくある問題)

このドキュメントでは、**Claude Codeプラグインマーケットプレイス**を利用してConoHa VPS MCPをインストールする方法を説明します。

プラグインをインストールすると、MCPサーバー（ConoHa VPS API操作）に加えて、操作をガイドするスキルが利用可能になります。

## 前提条件

- **Claude Code バージョン 1.0.33 以上**
- ConoHa VPSの**APIクレデンシャル**（テナントID、ユーザーID、パスワード）

Claude Codeのインストール方法は、下記の公式ドキュメントを参照してください。
[インストール/起動方法](https://docs.anthropic.com/en/docs/claude-code/overview)

## セットアップ手順

### 1. マーケットプレイスの追加

Claude Code上で以下のコマンドを実行し、ConoHa VPS MCPマーケットプレイスを登録します：

```
/plugin marketplace add https://github.com/gmo-internet/conoha_vps_mcp
```

### 2. プラグインのインストール

マーケットプレイスを追加後、以下のいずれかの方法でプラグインをインストールします。

**方法A: インタラクティブUI**

1. Claude Code上で `/plugin` を実行します
2. **Discover** タブを開きます（`Tab` キーでタブを切り替え）
3. **conoha-vps-mcp** を選択します
4. インストールスコープを選択します（user / project / local）

**方法B: CLIコマンド**

```
/plugin install conoha-vps-mcp@conoha-vps-mcp
```

> 📌 **インストールスコープについて**
>
> | スコープ | 説明 | 設定ファイル |
> |---------|------|-------------|
> | **user** | すべてのプロジェクトで利用可能 | `~/.claude/settings.json` |
> | **project** | 共同作業者全員が利用可能 | `.claude/settings.json` |
> | **local** | 自分のみ・このリポジトリのみ | `.claude/settings.local.json`（gitignore対象） |

### 3. 環境変数の設定

MCPサーバーを利用するには、ConoHa VPS APIの環境変数を設定する必要があります。

設定方法は2つあります。

**方法1: .mcp.jsonファイルに直接記述する**

`.mcp.json`に以下の設定を追加します：

```json
{
  "mcpServers": {
    "ConoHa VPS MCP": {
      "command": "npm",
      "args": [
        "exec",
        "@gmo-internet/conoha-vps-mcp@latest"
      ],
      "env": {
        "OPENSTACK_TENANT_ID": "YOUR_OPENSTACK_TENANT_ID",
        "OPENSTACK_USER_ID": "YOUR_OPENSTACK_USER_ID",
        "OPENSTACK_PASSWORD": "YOUR_OPENSTACK_PASSWORD"
      }
    }
  }
}
```

**方法2: `claude mcp add` コマンドで追加する**

```bash
claude mcp add conoha-vps-mcp \
  -e OPENSTACK_TENANT_ID=YOUR_OPENSTACK_TENANT_ID \
  -e OPENSTACK_USER_ID=YOUR_OPENSTACK_USER_ID \
  -e OPENSTACK_PASSWORD=YOUR_OPENSTACK_PASSWORD \
  -- npm exec @gmo-internet/conoha-vps-mcp@latest
```

ユーザースコープ（すべてのプロジェクトで利用可能）で追加する場合は `--scope user` オプションを付けます：

```bash
claude mcp add conoha-vps-mcp --scope user \
  -e OPENSTACK_TENANT_ID=YOUR_OPENSTACK_TENANT_ID \
  -e OPENSTACK_USER_ID=YOUR_OPENSTACK_USER_ID \
  -e OPENSTACK_PASSWORD=YOUR_OPENSTACK_PASSWORD \
  -- npm exec @gmo-internet/conoha-vps-mcp@latest
```

##### 環境変数の設定値

```txt
OPENSTACK_TENANT_ID: テナントID
OPENSTACK_USER_ID: APIユーザーのユーザーID
OPENSTACK_PASSWORD: APIユーザーのパスワード
```

各値はConoHaコントロールパネルのAPI設定で確認できます。

![ConoHa APIユーザー情報](../assets/conoha_api_info.png)
*https://manage.conoha.jp/V3/API/*

### 4. プラグインの有効化

インストール後、以下のコマンドでプラグインを有効化します：

```
/reload-plugins
```

### 5. ツールの使用

プロンプトを入力して操作を実行します。

[サンプルプロンプト](../README.md#-使用例)

## プラグインが提供するスキル

プラグインをインストールすると、以下のスキルがClaude Codeに追加されます。
スキルは会話中のキーワードに応じて自動的に発動し、MCPツールの操作手順や制約をClaude Codeにガイドします。ユーザーが意識的に呼び出す必要はありません。

| スキル名 | 説明 | 対象ユーザー |
|---------|------|-------------|
| **conoha-vps-mcp** | VPS操作ガイド | 全ユーザー |

### conoha-vps-mcp

ConoHa VPS MCPサーバーの操作をガイドするスキルです。VPS関連のキーワード（「サーバー作成」「ボリューム」「セキュリティグループ」「オブジェクトストレージ」など）を含むプロンプトで自動発動します。

**提供する機能:**
- サーバー作成・削除・起動・停止・リサイズのワークフローガイド
- セキュリティグループ・SSHキーペア・ボリュームの管理手順
- オブジェクトストレージの操作手順（コンテナ作成、オブジェクトアップロード、Web公開設定）
- パスワードやポート範囲の制約チェック
- エラー発生時の対処ガイド

**発動例:**

```txt
サーバーを作成して
セキュリティグループを設定して
オブジェクトストレージにファイルをアップロードして
```

## プラグインの管理

```bash
# プラグインの更新
/plugin update conoha-vps-mcp@conoha-vps-mcp

# プラグインの無効化
/plugin disable conoha-vps-mcp@conoha-vps-mcp

# プラグインの有効化
/plugin enable conoha-vps-mcp@conoha-vps-mcp

# プラグインのアンインストール
/plugin uninstall conoha-vps-mcp@conoha-vps-mcp

# マーケットプレイスの一覧表示
/plugin marketplace list

# マーケットプレイスの更新
/plugin marketplace update conoha-vps-mcp

# マーケットプレイスの削除
/plugin marketplace remove conoha-vps-mcp
```

## トラブルシューティング

### よくある問題

- **`/plugin` コマンドが認識されない**: Claude Code バージョン 1.0.33 以上であることを確認してください
  - バイナリ: `claude update`
  - npm: `npm update -g @anthropic-ai/claude-code`
- **マーケットプレイスの読み込みエラー**: リポジトリURL（`https://github.com/gmo-internet/conoha_vps_mcp`）にアクセスできることを確認してください
- **認証エラー**: 環境変数の値が正しく設定されているか確認してください
- その他FAQは[こちら](FAQ.md)

問題が解決しない場合は、[GitHub Issues](https://github.com/gmo-internet/conoha_vps_mcp/issues)で気軽に質問してください。
