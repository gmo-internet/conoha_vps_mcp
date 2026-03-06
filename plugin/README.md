# ConoHa VPS MCP Plugin for Claude Code

ConoHa VPS MCPサーバーの操作をガイドするClaude Codeプラグイン。

## 概要

このプラグインは、ConoHa VPS MCPサーバーが提供する10個のツール+1個のプロンプトを正確かつ効率的に活用するためのスキルを提供します。

提供する情報:
- ツールの使い分けとワークフロー判定ツリー
- 絶対遵守制約（パスワード自動生成禁止、ポート範囲自動設定禁止等）
- 全ツールのパス・パラメータ・レスポンス形式一覧
- 全リクエストボディのJSONスキーマとフィールド説明
- 主要操作のステップバイステップレシピ

## 前提条件

このプラグインを使用するには、ConoHa VPS MCPサーバーがセットアップ済みである必要があります。

1. MCPサーバーの設定（[セットアップガイド](https://github.com/gmo-internet/conoha_vps_mcp)を参照）
2. 環境変数の設定:
   - `OPENSTACK_TENANT_ID` - ConoHaテナントID
   - `OPENSTACK_USER_ID` - ConoHaユーザーID
   - `OPENSTACK_PASSWORD` - ConoHa APIパスワード

## インストール方法

### GitHub リポジトリから（推奨）

```shell
# マーケットプレイスとして追加
/plugin marketplace add gmo-internet/conoha_vps_mcp

# プラグインをインストール
/plugin install conoha-vps-mcp
```

### ローカルディレクトリから（開発・テスト用）

```shell
claude --plugin-dir ./plugin
```

## 提供するスキル

### conoha-vps-mcp

ConoHa VPS MCPサーバーの全操作をカバーするスキル。以下のキーワードで自動発動します:

- ConoHa、VPS、サーバー作成、サーバー削除
- ボリューム、セキュリティグループ、オブジェクトストレージ
- conoha_get、conoha_post、conoha_delete
- フレーバー、イメージ、SSHキーペア、スタートアップスクリプト

## ライセンス

[Apache License 2.0](../LICENSE)
