---
id: 13
title: インポートルール
last-reviewed: 2026-03-10
enforcement-level: L4
related-rules: [G-1, G-2, G-3, G-4]
checked-by: [architecture.test.ts, coding-pattern-check]
---

## 13. インポートルール

### ソースファイル（`src/**/*.ts`、テスト除外）

| ルール | 例 |
|--------|-----|
| 相対インポートに `.js` 拡張子必須 | `import { foo } from "./bar.js"` |
| 型インポートは `import type` を使用 | `import type { JsonObject } from "../../../types.js"` |
| Node.js組み込みモジュールは `node:` プレフィックス使用 | `import { Buffer } from "node:buffer"` |

### テストファイル（`*.test.ts`）

| ルール | 例 |
|--------|-----|
| `.js` 拡張子不要 | `import { getCompute } from "./compute-client"` |
| `vi.mock()` のパスも `.js` 拡張子不要 | `vi.mock("../common/openstack-client", () => ({ ... }))` |
| vitest関数は名前付きインポート | `import { beforeEach, describe, expect, it, vi } from "vitest"` |

### 外部パッケージ

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
```
