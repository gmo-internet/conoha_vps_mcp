---
id: 1
title: ファイル構成パターン
last-reviewed: 2026-06-18
enforcement-level: L4
related-rules: [A-1, A-2, A-3, H-1]
checked-by: [architecture.test.ts, coding-pattern-check]
---

## 1. ファイル構成パターン

### Feature Modules構造

```
src/
├── index.ts                    # エントリポイント（ツール登録）
├── types.ts                    # 共通型定義
├── tool-routing-tables.ts      # ルーティングテーブル
├── tool-descriptions.ts        # ツール説明文
├── apps/                       # MCP Apps（インタラクティブUI）
│   ├── apps-tools.ts               # ツール定義・データ解決層
│   ├── apps-tools.test.ts
│   ├── apps-types.ts                # App用型定義
│   ├── build-config.test.ts        # ビルド構成テスト
│   └── ui/                          # クライアントサイドUI（Viteビルド、tsconfig.ui.json）
│       ├── mcp-app.html             # 本番エントリ
│       ├── mcp-app.tsx              # マウント
│       ├── mcp-app.css              # スタイル
│       ├── app.tsx                  # ルートコンポーネント
│       ├── mcp-bridge.ts            # サーバーツール呼び出しラッパー
│       ├── clipboard.ts             # ユーティリティ（各 *.test.ts あり）
│       ├── format-bytes.ts
│       ├── validate-container-name.ts
│       ├── conoha_vps.svg
│       ├── components/              # UIコンポーネント（*.tsx）
│       ├── icons/                   # SVGアイコン群
│       └── preview/                 # 認証情報なしプレビュー（npm run preview:ui）
│           ├── index.html           # プレビュー用エントリ
│           └── mock-bridge.ts       # プレビュー用モックブリッジ
└── features/openstack/
    ├── constants.ts             # API定数（ベースURL等）
    ├── common/                  # 共通モジュール
    │   ├── openstack-client.ts      # APIクライアント
    │   ├── generate-api-token.ts    # トークン生成
    │   ├── response-formatter.ts    # レスポンスフォーマッター
    │   └── error-handler.ts         # エラーハンドラー
    ├── compute/                 # Compute (Nova) API
    │   ├── compute-client.ts
    │   ├── compute-client.test.ts
    │   ├── compute-schema.ts
    │   └── get-flavor-response-formatter.ts
    ├── volume/                  # Block Storage (Cinder) API
    ├── image/                   # Image (Glance) API
    ├── network/                 # Networking (Neutron) API
    └── storage/                 # Object Storage (Swift) API
```

### 規則

- 1つのOpenStackサービスにつき1つのfeatureディレクトリ
- `apps/` はMCP Apps（ext-apps SDK）のインタラクティブUI機能を配置
- `apps/ui/` は別tsconfig（tsconfig.ui.json、DOM型あり）でビルド
- テストファイルはソースファイルと同じディレクトリに配置（`*.test.ts`）
- `common/` にはサービス横断で使われるユーティリティを配置
- ファイル名はkebab-caseのみ
