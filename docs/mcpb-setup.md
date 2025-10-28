# mcpb ファイルインストール版実行ガイド

## 目次

- [mcpb ファイルインストール版実行ガイド](#mcpb-ファイルインストール版実行ガイド)
  - [目次](#目次)
  - [前提条件](#前提条件)
  - [セットアップ手順](#セットアップ手順)
    - [mcpbファイルのダウンロード](#mcpbファイルのダウンロード)
    - [mcpbファイルのインストール](#mcpbファイルのインストール)
    - [環境変数の設定](#環境変数の設定)
    - [ツールの使用](#ツールの使用)
    - [よくある問題](#よくある問題)

このドキュメントでは、**mcpb ファイル**によりMCPサーバーをインストールして実行する方法を説明します。

## 前提条件

- **Claude Desktop**最新バージョンがインストール済み
  
## セットアップ手順

### mcpbファイルのダウンロード

1. Releasesより、最新リリースノートを開きます  
    [最新リリースノート](https://github.com/gmo-internet/conoha_vps_mcp/releases/latest)
2. Assetsより`conoha_vps_mcp.mcpb`ファイルをダウンロードしてください（ファイル名をクリックするとダウンロードが開始されます）

### mcpbファイルのインストール

1. 左上のメニューより、`ファイル → 設定`で設定画面を開きます

    ![左上のメニューからファイルをクリックして、設定を開きます](../assets/claude_open_settings.png)
2. 設定画面より**拡張機能**をクリックします

    ![設定画面の左側メニューの下から2番目の拡張機能をクリック](../assets/claude_desktop_click_extension_settings.png)

<details>
<summary>既に他の拡張機能がインストールされている場合</summary>

1. `.MCPBまたは.DXTファイルをここにドラッグしてインストールしてください`と書かれている部分に、先ほどダウンロードしたmcpbファイルをドラッグしてください

    ![拡張機能を参照、詳細設定と書かれているボタンの下部にあるエリアにドラッグ](../assets/claude_desktop_drag_mcpb.png)

2. 内容を確認して最後に右上の**インストール**をクリックして、mcpbファイルをClaude Desktopにインストールします

    ![右上にあるインストールボタンでインストール完了](../assets/claude_desktop_install_mcpb.png)
</details>

<details>
<summary>他の拡張機能がインストールされていない場合</summary>

1. **詳細設定**をクリックします

    ![画面中央にある詳細設定ボタンをクリック](../assets/claude_desktop_click_extension_detail_settings.png)

2. **拡張機能をインストール...** をクリックします

    ![拡張機能開発者と書かれたところにある、拡張機能をインストールをクリック](../assets/claude_desktop_click_extension_func_install.png)

3. 先ほどダウンロードしたmcpbファイルを選択して**プレビュー**をクリックします

    ![エクスプローラが開き、先ほどダウンロードしたmcpbファイルを選択](../assets/explorer_select_mcpb_file.png)

4. 内容を確認して最後に右上の**インストール**をクリックして、mcpbファイルをClaude Desktopにインストールします

    ![右上にあるインストールボタンでインストール完了](../assets/claude_desktop_install_mcpb.png)

</details>

### 環境変数の設定

1. 設定画面の拡張機能タブに戻って、**conoha-vps-mcp**と書かれた拡張機能の欄にある**設定**をクリックします

    ![右端にある設定をクリック](../assets/claude_desktop_click_conoha_vps_mcp_mcpb_settings.png)

1. ConoHa APIのテナントID、ユーザーID、パスワードを入力します。

    ![テナントID、ユーザーID、パスワードと書かれた入力画面](../assets/claude_desktop_env_form.png)

    各値はConoHaコントロールパネルのAPI設定で確認できます。

    ![ConoHa APIユーザー情報](../assets/conoha_api_info.png)

    環境変数の入力が完了したら、最後に**保存**ボタンをクリックしてください。

### ツールの使用

プロンプトを入力して操作を実行します

   [サンプルプロンプト](../README.md#-使用例)

### よくある問題

- **認証エラー**: 環境変数の値が正しく設定されているか確認してください
- **Claude Desktop のバージョンエラー**: Claude Desktop が最新バージョンになっているか確認してください
- その他FAQは[こちら](FAQ.md)

**💡 ヒント:** 問題が解決しない場合は、[GitHub Issues](https://github.com/gmo-internet/conoha_vps_mcp/issues)でお気軽にお問い合わせください。