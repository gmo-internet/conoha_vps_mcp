---
id: 14
title: Biome / フォーマッティングルール
last-reviewed: 2026-03-10
enforcement-level: L3
related-rules: []
checked-by: [biome.json]
---

## 14. Biome / フォーマッティングルール

### biome.json 設定

| 項目 | 設定 |
|------|------|
| インデント | タブ（幅2） |
| クォート | ダブルクォート |
| インポート整理 | 有効（`organizeImports: "on"`） |
| リンター | `recommended: true` |
| `noExplicitAny` | off |
| テストファイルのリンティング | 除外（`!**/src/**/*.test.ts`） |

### テストファイル除外

`biome.json` の `linter.includes` でテストファイルをリンティング対象から除外:

```json
{
	"linter": {
		"includes": ["**", "!**/src/**/*.test.ts"]
	}
}
```

### スタイルルール

以下のスタイルルールがerrorレベルで有効:

- `noParameterAssign` — パラメータへの再代入禁止
- `useAsConstAssertion` — `as const` の使用
- `useDefaultParameterLast` — デフォルトパラメータは末尾
- `useEnumInitializers` — enum初期化子の明示
- `useSelfClosingElements` — 自己閉じ要素の使用
- `useSingleVarDeclarator` — 変数宣言は1つずつ
- `noUnusedTemplateLiteral` — 不要なテンプレートリテラル禁止
- `useNumberNamespace` — Number名前空間の使用
- `noInferrableTypes` — 推論可能な型注釈の禁止
- `noUselessElse` — 不要なelse禁止
