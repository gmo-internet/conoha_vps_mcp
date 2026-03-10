---
id: 1
title: ファイル構成パターン
last-reviewed: 2026-03-10
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
- テストファイルはソースファイルと同じディレクトリに配置（`*.test.ts`）
- `common/` にはサービス横断で使われるユーティリティを配置
- ファイル名はkebab-caseのみ
