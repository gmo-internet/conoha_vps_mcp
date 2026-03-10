---
id: 8
title: 命名規則
last-reviewed: 2026-03-10
enforcement-level: L4
related-rules: [H-1, H-2, H-3, H-4]
checked-by: [architecture.test.ts, coding-pattern-check]
---

## 8. 命名規則

| 対象 | ケース | 例 |
|------|--------|-----|
| ファイル名 | kebab-case | `compute-client.ts`, `get-flavor-response-formatter.ts` |
| 関数名 | camelCase | `getCompute`, `formatResponse`, `generateApiToken` |
| 型名/インターフェース | PascalCase | `HttpMethod`, `ConoHaGetPaths`, `FlavorData` |
| 定数 | UPPER_SNAKE_CASE | `OPENSTACK_COMPUTE_BASE_URL`, `USER_AGENT` |
| スキーマ | PascalCase + `Schema`サフィックス | `CreateServerRequestSchema` |
| エクスポート定数（テーブル） | camelCase | `conohaGetHandlers`, `conohaPostHandlers` |
