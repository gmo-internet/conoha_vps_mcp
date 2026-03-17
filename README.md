<div align="center">

![ConoHa VPS Logo](assets/conoha_logo.svg)

# ConoHa VPS MCP Server

**日本語対応のConoHa VPS Model Context Protocol (MCP) サーバー**

[![GitHub Stars](https://img.shields.io/github/stars/gmo-internet/conoha_vps_mcp?style=flat-square&logo=github)](https://github.com/gmo-internet/conoha_vps_mcp/stargazers)
[![GitHub License](https://img.shields.io/github/license/gmo-internet/conoha_vps_mcp?style=flat-square)](LICENSE)
[![GitHub Release](https://img.shields.io/github/v/release/gmo-internet/conoha_vps_mcp?style=flat-square)](https://github.com/gmo-internet/conoha_vps_mcp/releases)

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-white?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-white?style=flat-square&logo=docker)](https://www.docker.com/)
[![OpenStack](https://img.shields.io/badge/OpenStack-API-red?style=flat-square&logo=openstack)](https://docs.openstack.org/)

[🚀 クイックスタート](#-クイックスタート) • [📚 使用例](#-使用例) • [よくある質問（FAQ）](docs/FAQ.md)

</div>

---

## 🌟 概要

ConoHa VPS MCPは、ConoHa VPSの[公開API](https://doc.conoha.jp/reference/api-vps3/)を日本語で操作できるオープンソースのMCPサーバーです。AIエージェント（Claude Code、Claude Desktop、GitHub Copilot、Clineなど）と連携し、自然言語でインフラ操作ができます。

⚠️ 注意: 本ソフトウェアは現在ベータ版です。機能や動作が予告なく変更される場合があります。本番環境での使用前には十分なテストを行ってください。このベータ版 ConoHa VPS MCP を使用することで、これらの条件に同意したものとみなされます。

## ✨ 主な特徴

| 特徴 | 説明 |
|------|------|
| 🇯🇵 **日本語対応** | ツール説明・エラーメッセージを含め、すべて日本語で操作可能 |
| 🤖 **AI エージェント連携** | Claude Code、Claude Desktop、GitHub Copilot、Cline など主要なAIエージェントに対応 |
| 🔧 **包括的API** | サーバー・ボリューム・イメージ・セキュリティグループ・オブジェクトストレージを管理 |
| 🐳 **クロスプラットフォーム** | Node.js / Docker で動作、Windows・Mac・Linuxに対応 |
| 🛡️ **セキュリティ対策** | OpenStack準拠のセキュリティ機能を搭載 |

## ❓ Model Context Protocol (MCP) とは

MCPは、AIエージェント（Claude Code、Claude Desktop、GitHub Copilot、Clineなど）が外部のサービスやツールと連携するためのプロトコルです。このMCPサーバーを導入すると、AIに日本語で指示するだけでConoHa VPSの操作ができるようになります。

## 🚀 クイックスタート

### Claude Desktopで利用する場合

1. [Releases](https://github.com/gmo-internet/conoha_vps_mcp/releases/)よりダウンロードしたmcpbファイルをClaude Desktopに登録
2. Claude Desktopで環境変数を設定

詳しくは [mcpb ファイルインストール版実行ガイド](docs/mcpb-setup.md) を参照してください。

### Claude Codeで利用する場合（プラグイン）

Claude Codeのプラグインマーケットプレイスからインストールできます。MCPサーバーに加えて、操作をガイドするスキルも利用可能になります。

```
/plugin marketplace add https://github.com/gmo-internet/conoha_vps_mcp
```

詳しくは [Claude Code プラグインインストール版実行ガイド](docs/plugin-setup.md) を参照してください。

### それ以外のAIエージェント (GitHub Copilot等) で利用する場合

1. Node.jsをローカル端末にインストール
2. 利用中のMCP対応のAIエージェントにConoHa VPS MCPの設定を記載し、MCPサーバーを起動
    <details>
    <summary>設定（簡略版）</summary>

    ```json
    {
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
    ```
    </details>
  
  | Cursor | VS Code |
  |:------:|:-------:|
  | [![Install MCP Server](https://cursor.com/deeplink/mcp-install-light.svg)](https://cursor.com/ja/install-mcp?name=ConoHa%20VPS%20MCP&config=eyJlbnYiOnsiT1BFTlNUQUNLX1RFTkFOVF9JRCI6IiIsIk9QRU5TVEFDS19VU0VSX0lEIjoiIiwiT1BFTlNUQUNLX1BBU1NXT1JEIjoiIn0sImNvbW1hbmQiOiJucG0gZXhlYyBAZ21vLWludGVybmV0L2Nvbm9oYS12cHMtbWNwQGxhdGVzdCJ9) | [![Install VS Code](https://img.shields.io/badge/Install-VS_Code-FF9900?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=ConoHa%20VPS%20MCP&config=%7B%22command%22%3A%22npm%22%2C%22args%22%3A%5B%22exec%22%2C%22%40gmo-internet%2Fconoha-vps-mcp%40latest%22%5D%2C%22env%22%3A%7B%22OPENSTACK_TENANT_ID%22%3A%22%22%2C%22OPENSTACK_USER_ID%22%3A%22%22%2C%22OPENSTACK_PASSWORD%22%3A%22%22%7D%2C%22type%22%3A%22stdio%22%7D) |

詳しくは [npm パッケージインストール版実行ガイド](docs/npm-setup.md) を参照してください。

### 🔧 その他の方法で利用する場合

- 📋 [Node.js ローカルビルド版実行ガイド](docs/nodejs-setup.md) - ソースコードからビルドして実行
- 🐳 [Docker ローカルビルド版実行ガイド](docs/docker-setup.md) - Dockerコンテナで実行

🆘 トラブルシューティング

- ❓ [FAQ](docs/FAQ.md) - よくある質問と解決方法

## 🎯 使用例

### リソース管理

```txt
現在あるサーバーの一覧を表示してください。
```

```txt
現在あるサーバーを確認し、test-1という名前のサーバーを停止してください。
```

```txt
test-1という名前のサーバーにアタッチされているボリュームの詳細を表示してください。
```

### サーバー作成

```txt
Ubuntu 24.04でメモリ1GBのサーバーを、rootパスワード：vG7#kLp9zX!q、
ネームタグ：test-1、セキュリティグループ：defaultとして作ってください。
```

### スタートアップスクリプトを利用したサーバー作成

```txt
Ubuntu 24.04でメモリ1GBのサーバーを、rootパスワード：vG7#kLp9zX!q、
ネームタグ：test、セキュリティグループ：defaultに加えて、SSHが使えるように作ってください。
その際、VPS上でClaude Codeを利用できるようにしてください。
```

**⚠️ 注意: パスワードセキュリティに関する重要な警告**

- 上記のパスワードは例示用です。**そのまま使わないでください**
- 実際の運用では、十分に複雑なパスワードを生成してください
- サーバー作成後はすぐにパスワードを変更するか、パスワード認証を無効化してください
- SSHキー認証への切り替えを推奨します
- AIエージェントとの会話履歴にパスワードが残る点にも注意してください

### セキュリティ設定

```txt
Webサーバー用のセキュリティグループをweb-server-secgroupという名前で新しく作成して、
HTTP（80番）とHTTPS（443番）のみを許可してください。
```

### オブジェクトストレージ

```
オブジェクトストレージの容量を200GBに設定をして、コンテナ名：mysite-dev、
オブジェクト名：index.html、アップロードファイル：path/to/fileでオブジェクトを作成してください。
```

## 📚 ドキュメント

### 対応プラットフォーム

**💡 重要:** 今後のバージョンアップによってサポート対象外となる可能性があります。

#### MCPサーバー実行環境

- ✅ Node.js v20以上
- ✅ Docker
- ✅ Linux / macOS / Windows

#### AIエージェント統合

- ✅ [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
- ✅ [Claude Desktop](https://claude.ai/download)
- ✅ [Cursor](https://cursor.com/ja/download)
- ✅ [Cline (VS Code)](https://github.com/cline/cline)
- ✅ [GitHub Copilot (VS Code)](https://docs.github.com/ja/copilot)
- ✅ [Codex CLI](https://github.com/openai/codex)

**📝 注記:** MCPに対応した他のAIエージェントでも利用できます。詳細は各AIエージェントのドキュメントを参照して下さい。

#### ConoHa環境

- ✅ ConoHa VPS v3.0 API

### MCPサーバーで対応している主な機能一覧

| カテゴリ | 主な対応機能 |
|---------|-------------|
| サーバー | 作成 / 削除 / 起動 / 停止 / リサイズ / コンソール接続 |
| ボリューム | 作成 / 削除 / 更新 |
| イメージ | 一覧取得 |
| SSHキーペア | 作成 / 削除 |
| セキュリティグループ | 作成 / 削除 / 更新 |
| セキュリティグループルール | 作成 / 削除 |
| オブジェクトストレージ | 作成 / 削除 / 更新 |

📄 ツールごとの全機能一覧は[こちら](docs/tool.md)を参照してください。

## ⚠️ 注意事項

### AIエージェントの利用料金

- AIエージェント（Claude等）の利用には別途費用がかかる場合があります
- 利用中のAIエージェントの料金プランを事前に確認してください

### API利用

- 🔑 **認証**: ConoHa VPSの公開APIクレデンシャルが必要です
- 💰 **課金**: MCP自体は無償ですが、VPS作成等の操作でConoHa VPSの料金が発生します
- 🛠️ **サポート**: MCP利用はConoHaサポート対象外です

### 自動化の注意点

- 設定ミスで意図しない課金が発生することがあります
- 自動化する前に設定内容とセキュリティを確認してください
- 不安な場合はコントロールパネルから手動で操作してください

### セキュリティ

- 🔐 APIクレデンシャルは安全に管理してください
- 🚫 本番環境では自動化スクリプトを十分テストしてください
- 📊 使用状況を定期的に確認してください

詳しくは[ConoHa APIご利用前の留意事項](https://doc.conoha.jp/reference/api-vps3/api-guideline-vps3/api-guideline-v3/)を確認してください。

## 🤝 コントリビュート

- 📝 [コントリビューションガイド](CONTRIBUTING.md)
- 🤝 [行動規範](CODE_OF_CONDUCT.md)
- 🔒 [セキュリティポリシー](SECURITY.md)

バグ報告や機能要望は[GitHub Issues](https://github.com/gmo-internet/conoha_vps_mcp/issues)でお受けしています。

## 📄 ライセンス

このプロジェクトは[Apache License 2.0](LICENSE) の下で公開されています。

## 🙏 謝辞

- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP仕様の開発
- [OpenStack](https://www.openstack.org/) - クラウドインフラ技術の基盤

## 📞 サポート・コミュニティ

- 🐛 **バグ報告・機能要望**: [GitHub Issues](https://github.com/gmo-internet/conoha_vps_mcp/issues)
- 🌟 **Star**: 役に立ったら ⭐ をいただけると励みになります

## 🔗 関連リンク

- [ConoHa 公式サイト](https://www.conoha.jp/)
- [公開 API ドキュメント](https://doc.conoha.jp/reference/api-vps3/)
- [Model Context Protocol 仕様](https://modelcontextprotocol.io/)

---

<div align="center">

**Made by [GMO Internet](https://internet.gmo/)**

[⬆️ トップに戻る](#conoha-vps-mcp-server)

</div>
