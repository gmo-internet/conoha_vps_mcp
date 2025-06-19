<div align="center">

![ConoHa VPS Logo](/assets/conoha_logo.svg)

# ConoHa VPS MCP Server

**日本語対応のConoHa VPS Model Context Protocol (MCP) サーバー**

[![GitHub Stars](https://img.shields.io/github/stars/gmo-internet/conoha_vps_mcp?style=flat-square&logo=github)](https://github.com/gmo-internet/conoha_vps_mcp/stargazers)
[![GitHub License](https://img.shields.io/github/license/gmo-internet/conoha_vps_mcp?style=flat-square)](LICENSE)
[![GitHub Release](https://img.shields.io/github/v/release/gmo-internet/conoha_vps_mcp?style=flat-square)](https://github.com/gmo-internet/conoha_vps_mcp/releases)

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-blue?style=flat-square&logo=docker)](https://www.docker.com/)
[![OpenStack](https://img.shields.io/badge/OpenStack-API-red?style=flat-square&logo=openstack)](https://docs.openstack.org/)

[📖 セットアップガイド](#-インストールセットアップ方法) • [🚀 クイックスタート](#-クイックスタート) • [📚 ドキュメント](#-ドキュメント) • [🤝 コントリビュート](#-コントリビュート)

</div>

---

## 🌟 概要

ConoHa VPS MCPは、ConoHa VPSの[公開API](https://doc.conoha.jp/reference/api-vps3/)を**日本語**で簡単に操作できるオープンソースの**Model Context Protocol (MCP) サーバー**です。

Claude、Cline、CursorなどのAIアシスタントと連携することで、**自然言語によるインフラ操作**が可能になります。

> [!CAUTION]
> **⚠️ ベータ版について**
>
> 本ソフトウェアは現在ベータ版です。
>
> - いかなる保証もなく現状のまま提供されます。
> - 機能・動作は予告なく変更される場合があります。
> - 本番環境での使用前に十分なテストを行ってください。
> - 問題やフィードバックは GitHub の Issue トラッカー からご報告をよろしくお願いいたします。
>
> このベータ版ConoHa VPS MCP を使用することで、これらの条件に同意したものとみなされます。

## ✨ 主な特徴

| 特徴 | 説明 |
|------|------|
| 🇯🇵 **完全日本語対応** | ConoHa VPSのOpenStackリソースを日本語で直感的に操作 |
| 🤖 **AI統合** | Claude、Cline、Cursorなど主要AIアシスタントに対応 |
| 🔧 **包括的API** | サーバー・ボリューム・イメージ・ネットワーク管理をフルサポート |
| 🐳 **クロスプラットフォーム** | Node.js および Docker での実行環境を提供 |
| 🛡️ **セキュア** | OpenStack標準のセキュリティ機能を継承 |
| 📝 **TypeScript完全対応** | 型安全性とコード補完を提供 |

## ❓ Model Context Protocol (MCP) とは?

ClaudeやCline、CursorなどのAIアシスタント（AIチャットボット）が、インターネット上のサービスや様々なツールと連携するための仕組みです。
この仕組みにより、AIアシスタントがあなたの代わりに、サーバーの操作やファイルの管理などの複雑な作業を簡単かつ自動で行えるようになります。

## 🚀 クイックスタート

### 前提条件

- Node.js 18以上 または Docker
- ConoHa VPSアカウントとAPIクレデンシャル
- 対応AIアシスタント（Claude Desktop、Cline、Cursor等）

### セットアップガイド

- 📋 [Node.js版セットアップ](docs/setup-nodejs.md)
- 🐳 [Docker版セットアップ](docs/setup-docker.md)
- ❓ [よくある質問](docs/FAQ.md)

## 🎯 使用例

### サーバー作成

```txt
Ubuntu 24.04でメモリ1GBのサーバーを、rootパスワード：vG7#kLp9zX!q、
ネームタグ：ubuntu-24-04-server、セキュリティグループ：defaultとして作ってください。
```

### リソース管理

```txt
現在あるサーバーの一覧を表示してください。
```

```txt
ubuntu-24-04-serverという名前のサーバーを停止してください。
```

### セキュリティ設定

```txt
Webサーバー用のセキュリティグループを作成して、HTTP（80番）とHTTPS（443番）を許可してください。
```

### ボリューム管理

```txt
100GBのボリュームを作成して、ubuntu-24-04-serverにアタッチしてください。
```

## 📚 ドキュメント

### 対応プラットフォーム

> [!IMPORTANT]
> 今後のバージョンアップによってサポート対象外となる可能性があります。

#### MCPサーバー実行環境

- ✅ Node.js v18以上
- ✅ Docker & Docker Compose
- ✅ Linux / macOS / Windows

#### AIアシスタント統合

- ✅ [Claude Desktop](https://claude.ai/download)
- ✅ [Cline (VS Code)](https://github.com/cline/cline)
- ✅ [Cursor](https://cursor.sh/)
- ✅ [GitHub Copilot (VS Code)](https://docs.github.com/ja/copilot)

#### ConoHa環境

- ✅ ConoHa VPS v3.0 API

### API リファレンス

| サービス | 機能 | 対応操作 |
|---------|------|----------|
| **Compute** | サーバー管理 | 作成・削除・起動・停止・再起動・リサイズ |
| **Volume** | ストレージ管理 | ボリューム作成・削除・アタッチ・デタッチ |
| **Network** | ネットワーク管理 | セキュリティグループ・ポート・IP管理 |
| **Image** | イメージ管理 | OS・カスタムイメージ参照 |

## 重要な注意事項

### API利用について

- 🔑 **認証**: ConoHa VPSの公開APIクレデンシャルが必要です
- 💰 **課金**: MCP自体は無償ですが、VPS作成等の操作により料金が発生する場合があります
- 🛠️ **サポート**: MCP利用はConoHaサポート対象外です

### 自動化利用について

- 設定ミスや設計不備により意図しない課金が発生する可能性があります
- 自動化する際は設定の確認とセキュリティ対策を十分に行ってください
- 不安な場合はコントロールパネルからの手動操作を推奨します

### その他

- 本ドキュメントはConoHa VPS v3.0 APIの利用例です
- 仕様変更により実際の動作と差異が生じる場合があります

詳細は[公開APIご利用前の留意事項](https://doc.conoha.jp/reference/api-vps3/api-guideline-vps3/api-guideline-v3/)をご確認ください。

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

このプロジェクトは[Apache License 2.0](LICENSE)の下で公開されています。

## 🙏 謝辞

- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP仕様の開発
- [OpenStack](https://www.openstack.org/) - クラウドインフラ技術の基盤

## 📞 サポート・コミュニティ

- 📧 **Issue報告**: [GitHub Issues](https://github.com/gmo-internet/conoha_vps_mcp/issues)
- 🌟 **Star**: このプロジェクトが役に立ったら⭐をお願いします！

## 🔗 関連リンク

- [ConoHa公式サイト](https://www.conoha.jp/)
- [公開API ドキュメント](https://doc.conoha.jp/reference/api-vps3/)
- [Model Context Protocol 仕様](https://modelcontextprotocol.io/)

---

<div align="center">

**Made by [GMO Internet](https://www.gmo.internet/)**

[⬆️ トップに戻る](#conoha-vps-mcp-server)

</div>
