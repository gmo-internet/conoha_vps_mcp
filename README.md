# ConoHa VPS MCP

[![GitHub](https://img.shields.io/badge/gmo-internet/conoha_vps_mcp-blue.svg?style=flat&logo=github)](https://github.com/gmo-internet/conoha_vps_mcp)
[![License](https://img.shields.io/badge/license-Apache--2.0-brightgreen)](LICENSE)

ConoHa VPS MCPは、ConoHa VPSの[公開API](https://doc.conoha.jp/reference/api-vps3/) を日本語で簡単に操作できるオープンソースMCPサーバーです。

- ConoHa VPSのサーバー・ボリューム・イメージ・ネットワーク等のOpenStackリソースを日本語で操作
- 日本語ドキュメント・日本人向けUI
- Node.js および Docker で動作

> [!CAUTION]
> ベータ版に関する注意：本ソフトウェアは現在ベータ版であり、いかなる保証もなく現状のまま提供されます。
>
> - 機能・動作は予告なく変更される場合があります。
> - 本番環境やクリティカルなワークロードでの使用は推奨されません。
> - 問題やフィードバックは GitHub の Issue トラッカー からご報告をよろしくお願いいたします。
>
> このベータ版ConoHa VPS MCP を使用することで、これらの条件に同意したものとみなされます。

## 目次

- [ConoHa VPS MCP](#conoha-vps-mcp)
  - [目次](#目次)
  - [Model Context Protocol (MCP) とは?](#model-context-protocol-mcp-とは)
  - [MCPサーバーの活用例](#mcpサーバーの活用例)
  - [MCPサーバーのご利用前の留意事項](#mcpサーバーのご利用前の留意事項)
  - [インストール・セットアップ方法](#インストールセットアップ方法)
  - [動作確認済み環境](#動作確認済み環境)
    - [MCPサーバー実行環境](#mcpサーバー実行環境)
    - [AIエージェント環境](#aiエージェント環境)
    - [ConoHa VPSの環境](#conoha-vpsの環境)
  - [サンプルプロンプト](#サンプルプロンプト)
  - [ライセンス](#ライセンス)
  - [コントリビュート](#コントリビュート)
  - [参考リンク](#参考リンク)

## Model Context Protocol (MCP) とは?

ClaudeやCline、CursorなどのAIアシスタント（AIチャットボット）が、インターネット上のサービスや様々なツールと連携するための仕組みです。
この仕組みにより、AIアシスタントがあなたの代わりに、サーバーの操作やファイルの管理などの複雑な作業を簡単かつ自動で行えるようになります。

## MCPサーバーの活用例

1. 初心者が新規サーバーを作成：AIが用途に合った適切なプランやイメージを選択し、サーバーを作成
2. 開発者が作業を効率化：複数のサーバー操作をチャット形式で一括実行
3. セキュリティポリシー管理の簡素化：セキュリティグループやルールの操作を直感的な文章で実行

その他多数

## MCPサーバーのご利用前の留意事項

- 提供されておりますAPIは、クラウド基盤にて採用しておりますOpenStackの機能にて実装しております。
- APIのご利用には専門的な知識が必要になります。使い方などにつきましては、ConoHaのサポート対象外となりますので、OpenStackのドキュメントなどのインターネット上の情報にてご確認ください。
- API自体は無償でご利用いただけますが、VPSの作成や自動バックアップの有効化など、APIを実行した結果としてご請求が発生するものがございます。ご利用前にサービスサイトをご確認の上、ご不安な場合は、APIは使用せずにコントロールパネルからの操作を推奨します。
- APIによる自動化をご検討いただいておりますお客様におきましては、設定に誤りや設計に不備がございますとAPIの実行を繰り返し、意図しないサービス利用につながる可能性がございます。自動化する際は、設定や設計の誤りや不備などがないかのご確認に加え、セキュリティ対策も考慮ください。
- 本ドキュメントはConoHa VPSのバージョン3.0のAPIをご利用いただく際の一例となり、お客様の運用やポリシーによってその限りではございません。お客様のご利用状況に応じて必要な設定や操作をおこなってください。
- 本ドキュメントに掲載しております情報につきましては、実際の仕様とサポートページの更新状況に差が出る場合がございます。

詳細は、[APIのご利用前の留意事項](https://doc.conoha.jp/reference/api-vps3/api-guideline-vps3/api-guideline-v3/?btn_id=reference-api-vps3--sidebar_reference-api-guideline-v3)を参照してください。

## インストール・セットアップ方法

- [Node.js版の使い方](docs/setup-nodejs.md)
- [Docker版の使い方](docs/setup-docker.md)

## 動作確認済み環境

### MCPサーバー実行環境

- Node.js v18 以上
- Docker compose

### AIエージェント環境

- [Visual Studio Code](https://code.visualstudio.com/) × [Cline](https://github.com/cline/cline) vFIXME: 以上
- [Visual Studio Code](https://code.visualstudio.com/) × [GitHub Copilot](https://docs.github.com/ja/copilot) vFIXME: 以上
- Claude Desktop vFIXME: 以上
- Cursor vFIXME: 以上

### ConoHa VPSの環境

- ConoHa 3（確認方法は[こちら](FIXME: )）

> [!IMPORTANT]
> 今後のバージョンアップによってサポート対象外となる可能性があります。

## サンプルプロンプト

- サーバー作成

  ```txt
  Ubuntu 24.04でメモリ1GBのサーバーを、rootパスワード：vG7#kLp9zX!q、ネームタグ：ubuntu-24-04-server、セキュリティグループ：defaultとして作ってください。
  ```

- サーバー一覧表示

  ```txt
  現在あるサーバーの一覧を表示してください。
  ```

- サーバー停止

  ```txt
  ubuntu-24-04-serverという名前のサーバーを停止してください。
  ```

## ライセンス

Apache License 2.0

## コントリビュート

バグの報告、機能要望、ドキュメント改善要望などはIssueとして歓迎しております。

 [CONTRIBUTING](https://github.com/gmo-internet/conoha_vps_mcp/blob/main/CONTRIBUTING.md)

## 参考リンク

- [ConoHa公式サイト](https://www.conoha.jp/)
- [公開API ドキュメント](https://doc.conoha.jp/reference/api-vps3/)
