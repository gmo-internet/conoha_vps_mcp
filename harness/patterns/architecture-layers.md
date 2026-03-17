---
id: 15
title: アーキテクチャレイヤーパターン
last-reviewed: 2026-03-10
enforcement-level: L3
related-rules: [I-1, I-2, I-3, I-4, I-5]
checked-by: [dependency-cruiser]
---

## 15. アーキテクチャレイヤーパターン

### レイヤー階層図

```
types.ts（型定義層）
  → common/（共通基盤層）
    → compute/ | network/ | volume/ | image/ | storage/（feature層）
      → tool-routing-tables.ts（ルーティング層）
        → index.ts（エントリポイント層）
```

`→` は「依存できる方向」を示す。上位層は下位層に依存できるが、下位層が上位層に依存することは禁止される。

### 依存フロールール

| ルールID | ルール名 | 内容 |
|----------|---------|------|
| I-1 | no-circular | 循環依存の禁止。すべてのモジュール間で循環参照は許可されない |
| I-2 | no-cross-feature-imports | feature層の横断インポート禁止。`compute/`, `network/`, `image/`, `volume/`, `storage/` は互いにインポートできない |
| I-3 | no-common-to-feature | 共通基盤層からfeature層への依存禁止。`common/` は特定のfeatureモジュールに依存してはならない |
| I-4 | no-root-types-to-feature | 型定義層からfeature層への依存禁止。`src/types.ts` は `src/features/` 配下のモジュールに依存してはならない |
| I-5 | no-feature-to-root | feature層からルートファイルへの依存禁止。featureモジュールは `index.ts`, `tool-routing-tables.ts`, `tool-descriptions.ts` をインポートできない（`types.ts` は例外として許可） |

### 各レイヤーの責務

| レイヤー | ファイル | 責務 |
|---------|---------|------|
| 型定義層 | `src/types.ts` | パスリテラル型やJSON型など、プロジェクト横断の型定義。他のどのレイヤーにも依存しない |
| 共通基盤層 | `src/features/openstack/common/` | APIクライアント、トークン生成、レスポンスフォーマット、エラーハンドリング。`types.ts` にのみ依存可能 |
| feature層 | `src/features/openstack/{compute,network,volume,image,storage}/` | 各OpenStackサービス固有のクライアントとスキーマ。`types.ts` と `common/` に依存可能 |
| ルーティング層 | `src/tool-routing-tables.ts` | MCPツールからfeatureクライアント関数へのマッピング。feature層と下位層に依存可能 |
| エントリポイント層 | `src/index.ts` | MCPサーバーの初期化とツール登録。すべての層に依存可能 |

### 許可される依存関係の例

```typescript
// feature層 → common/（共通基盤層）: OK
import { executeOpenstackApi } from "../common/openstack-client.js";

// feature層 → types.ts（型定義層）: OK
import type { JsonObject } from "../../../types.js";

// feature層 → 他のfeature層: NG（I-2違反）
import { getCompute } from "../compute/compute-client.js"; // 禁止

// common/ → feature層: NG（I-3違反）
import { getCompute } from "../compute/compute-client.js"; // 禁止

// feature層 → ルートファイル: NG（I-5違反）
import { routingTable } from "../../../tool-routing-tables.js"; // 禁止
```

### 新規featureモジュールの作成基準

新しいOpenStackサービスのAPIサポートを追加する場合、以下の手順でfeatureモジュールを作成する:

1. `src/features/openstack/` 配下にサービス名のディレクトリを作成（kebab-case）
2. クライアントファイル（`{service}-client.ts`）を作成し、`common/` の共有モジュールを利用
3. 必要に応じてスキーマファイル（`{service}-schema.ts`）を作成
4. テストファイル（`{service}-client.test.ts`）を同ディレクトリに配置
5. `src/types.ts` にパスリテラル型を追加
6. `src/tool-routing-tables.ts` にルーティングエントリを追加
7. `.dependency-cruiser.cjs` の `no-cross-feature-imports` ルールに新サービス名を追加

### dependency-cruiserによる検証

レイヤー間の依存ルールは `.dependency-cruiser.cjs` で定義され、CIで自動検証される。
違反が検出された場合はビルドが失敗する。

```bash
# 手動でレイヤー違反を検証
npx dependency-cruiser src --config .dependency-cruiser.cjs
```
