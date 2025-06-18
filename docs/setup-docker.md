# Docker版 環境構築

このドキュメントでは、Dockerを利用したConoHa VPS MCPのセットアップ・利用方法を解説します。

---

## 前提条件

- Dockerがインストールされていること（Windows/Mac/Linux対応）

## イメージのビルド

```sh
# プロジェクトルートで
cd conoha_vps_mcp
# Dockerイメージをビルド
docker build -t conoha-vps-mcp .
```

## コンテナの起動

```sh
docker run -it --rm \
  -e OPENSTACK_TENANT_ID=あなたのテナントID \
  -e OPENSTACK_USER_ID=あなたのユーザーID \
  -e OPENSTACK_PASSWORD=あなたのパスワード \
  conoha-vps-mcp
```

※必要に応じて.envファイルを用意し、`--env-file`オプションで指定も可能です。

## よくあるトラブル

- 認証エラー：環境変数の値が正しいか確認してください
