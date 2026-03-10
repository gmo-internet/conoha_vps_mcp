---
id: 3
title: スキーマパターン
last-reviewed: 2026-03-10
enforcement-level: L4
related-rules: [C-1, C-2, C-3, C-4]
checked-by: [architecture.test.ts, coding-pattern-check]
---

## 3. スキーマパターン

### Zod v4 スキーマ定義

- `.strict()` 必須（全オブジェクトに付与）
- `.describe()` で日本語の説明を付与
- 命名: `{Action}{Resource}RequestSchema`

```typescript
// src/features/openstack/compute/compute-schema.ts
import { z } from "zod";

export const CreateServerRequestSchema = z
	.object({
		server: z
			.object({
				flavorRef: z.string().describe("Flavor ID"),
				adminPass: z
					.string()
					.regex(/^...$/）
					.describe("サーバーの管理者/rootパスワード: ..."),
				block_device_mapping_v2: z
					.array(
						z
							.object({
								uuid: z.string().describe("起動元となるボリュームのUUID"),
							})
							.strict(),
					)
					.describe("1つ以上のボリュームマッピング"),
			})
			.strict(),
	})
	.strict();
```

### 命名パターン

| 操作 | 命名 | 例 |
|------|------|-----|
| 作成 | `Create{Resource}RequestSchema` | `CreateServerRequestSchema`, `CreateVolumeRequestSchema` |
| 更新 | `Update{Resource}RequestSchema` | `UpdateVolumeRequestSchema`, `UpdatePortRequestSchema` |
| 操作 | `{Action}{Resource}RequestSchema` | `OperateServerRequestSchema`, `AttachVolumeRequestSchema` |

### バリデーションメッセージ

enumフィールドには `message` オプションで日本語のエラーメッセージを付与する。

```typescript
direction: z
	.enum(["ingress", "egress"], {
		message: "通信の向きは 'ingress' または 'egress' を指定してください",
	})
	.describe("ルールの方向 (ingressまたはegress)"),
```
