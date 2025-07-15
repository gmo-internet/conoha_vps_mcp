<div align="center">

![ConoHa VPS Logo](assets/conoha_logo.svg)

# ConoHa VPS MCP Server

**日本語対応のConoHa VPS Model Context Protocol (MCP) サーバー**

[![GitHub Stars](https://img.shields.io/github/stars/gmo-internet/conoha_vps_mcp?style=flat-square&logo=github)](https://github.com/gmo-internet/conoha_vps_mcp/stargazers)
[![GitHub License](https://img.shields.io/github/license/gmo-internet/conoha_vps_mcp?style=flat-square)](LICENSE)
[![GitHub Release](https://img.shields.io/github/v/release/gmo-internet/conoha_vps_mcp?style=flat-square)](https://github.com/gmo-internet/conoha_vps_mcp/releases)

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-blue?style=flat-square&logo=docker)](https://www.docker.com/)
[![OpenStack](https://img.shields.io/badge/OpenStack-API-red?style=flat-square&logo=openstack)](https://docs.openstack.org/)

[🚀 クイックスタート](#-クイックスタート) • [📚 使用例](#-使用例) • [よくある質問（FAQ）](docs/FAQ.md)

</div>

---

## 🌟 概要

ConoHa VPS MCPは、ConoHa VPSの[公開API](https://doc.conoha.jp/reference/api-vps3/)を**日本語**で簡単に操作できるオープンソースの**Model Context Protocol (MCP) サーバー**です。

GitHub Copilot、Cline、ClaudeなどのAIエージェントと連携することで、**自然言語によるインフラ操作**が可能になります。

> [!CAUTION]
> **⚠️ 本ソフトウェアは現在ベータ版です**
>
> - いかなる保証もなく現状のまま提供されます。
> - 機能・動作は予告なく変更される場合があります。
> - 本番環境での使用前に十分なテストを行ってください。
> - バグやフィードバックは GitHub の Issue トラッカー からご報告願います。
>
> このベータ版ConoHa VPS MCP を使用することで、これらの条件に同意したものとみなされます。

## ✨ 主な特徴

| 特徴 | 説明 |
|------|------|
| 🇯🇵 **完全日本語対応** | ConoHa VPSのリソースを日本語で直感的に操作 |
| 🤖 **AI統合** | GitHub Copilot、Cline、Claudeなど、主要なMCP対応AIエージェントに対応 |
| 🔧 **包括的API** | サーバー・ボリューム・イメージ・セキュリティグループ管理をサポート |
| 🐳 **クロスプラットフォーム** | Node.js および Dockerでの実行環境を提供 |
| 🛡️ **セキュリティ** | 公開APIのセキュリティ機能を継承 |

## ❓ Model Context Protocol (MCP) とは

Model Context Protocolとは、GitHub Copilot、Cline、ClaudeなどのAIエージェントがインターネット上のサービスや様々なツールと連携するための共通化された仕組み（プロトコル）です。
この仕組みにより、AIエージェントがあなたの代わりに、サーバーの操作やファイルの管理などの複雑な作業を簡単かつ自動で行えるようになります。

## 🚀 クイックスタート

1. ConoHaのコントロールパネルにアクセスし、APIクレデンシャルを発行
2. Node.js あるいは Dockerをローカル端末にインストール
3. 利用中のMCP対応のAIエージェント（GitHub Copilot等）にConoHa VPS MCPの設定を記載し、MCPサーバーを起動
    <details>
    <summary>設定（簡略版）</summary>

    ```json
    {
      "ConoHa VPS MCP": {
        "command": "npm",
        "args": [
          "exec",
          "--@gmo-internet:registry=https://npm.pkg.github.com",
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

詳細な手順は 👉 [簡単実行ガイド](docs/easy-setup.md) を参照してください。

### 🔧 その他の設定方法（ローカルビルド版（上級者向け））

- 📋 [Node.js ローカルビルド版実行ガイド](docs/nodejs-setup.md) - ソースコードからビルドして実行
- 🐳 [Docker ローカルビルド版実行ガイド](docs/docker-setup.md) - Dockerコンテナで実行

### 🆘 トラブルシューティング

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
サーバープラン一覧、イメージ一覧、ボリュームタイプ一覧を確認して、
Ubuntu 24.04でメモリ1GBのサーバーを、rootパスワード：vG7#kLp9zX!q、
ネームタグ：test-1、セキュリティグループ：defaultとして作ってください。
```

> [!CAUTION]
> **パスワードセキュリティに関する重要な警告**
>
> - 上記のパスワード例は**絶対に実際に使用しないでください**（公開されているため）
> - 実際の運用では、十分に複雑で一意なパスワードを生成してください
> - サーバー作成後は、**直ちに**パスワードの変更、またはパスワード認証の無効化を行ってください
> - SSHキー認証への変更を強く推奨します
> - AIエージェントとの会話履歴にパスワードが残ることに注意してください

### セキュリティ設定

```txt
Webサーバー用のセキュリティグループをweb-server-secgroupという名前で新しく作成して、
HTTP（80番）とHTTPS（443番）のみを許可してください。
```

## 📚 ドキュメント

### 対応プラットフォーム

> [!IMPORTANT]
> 今後のバージョンアップによってサポート対象外となる可能性があります。

#### MCPサーバー実行環境

- ✅ Node.js v18以上
- ✅ Docker
- ✅ Linux / macOS / Windows

#### AIエージェント統合

- ✅ [Claude Desktop](https://claude.ai/download)
- ✅ [Cline (VS Code)](https://github.com/cline/cline)
- ✅ [GitHub Copilot (VS Code)](https://docs.github.com/ja/copilot)

> [!NOTE]
> MCPに対応した他のAIエージェントでも利用できます。
> 詳細は各AIエージェントのドキュメントを参照して下さい。

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

📄 ツールごとの全機能一覧は[こちら](docs/tool.md)を参照してください。

## ⚠️ 重要な注意事項

### AIエージェント利用について

- Claude等、AIエージェントの利用には別途費用が発生する場合があります
- 利用しているAIエージェントの料金プランや課金形態は十分確認してください

### API利用について

- 🔑 **認証**: ConoHa VPSの公開APIクレデンシャルが必要です
- 💰 **課金**: MCP自体は無償ですが、VPS作成等の操作により料金が発生する場合があります
- 🛠️ **サポート**: MCP利用はConoHaサポート対象外です

### 自動化利用について

- 設定ミスにより意図しない課金が発生する可能性があります
- 自動化する際は設定の確認とセキュリティ対策を十分に行ってください
- 不安な場合はコントロールパネルからの手動操作を推奨します

### セキュリティ考慮事項

- 🔐 APIクレデンシャルを安全に管理してください
- 🚫 本番環境では自動化スクリプトの十分な検証を行ってください
- 📊 使用状況を定期的に監視してください

詳細は[ConoHa APIご利用前の留意事項](https://doc.conoha.jp/reference/api-vps3/api-guideline-vps3/api-guideline-v3/)をご確認ください。

## 🤝 コントリビュート

私たちはコミュニティからの貢献を歓迎します！

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
- 🌟 **Star**: このプロジェクトが役に立ったら ⭐ をお願いします！

## 🔗 関連リンク

- [ConoHa 公式サイト](https://www.conoha.jp/)
- [公開 API ドキュメント](https://doc.conoha.jp/reference/api-vps3/)
- [Model Context Protocol 仕様](https://modelcontextprotocol.io/)

---

<div align="center">

**Made by [GMO Internet](https://internet.gmo/)**

[⬆️ トップに戻る](#conoha-vps-mcp-server)

</div>
