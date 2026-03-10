# KDR-0005: L2ルール一括昇格とセマンティックルール執行自動化

- 起源: ハーネス執行ギャップ分析
- レベル: L2 → L3/L4 + CLAUDE.md + Claude Code Review CI
- 状態: 有効

## 経緯

ハーネスフレームワークの執行状況を分析した結果、L2（AIスキルチェック）の約25ルールが手動実行のみで自動執行されていないことが判明した。「品質を担保できる」と言い切るには、全ルールの自動執行が必要。

## 決定

L2ルールを以下の3カテゴリに分類し、それぞれ適切な執行手段を導入する。

### 1. L4昇格（12ルール）— 機械的にチェック可能

`src/architecture.test.ts` にテストケースを追加:

| ルール | チェック方式 |
|--------|-------------|
| A-1 | featureディレクトリまたはsrcルート配置のファイルパス検証 |
| C-2 | スキーマファイル内の `.describe()` 存在確認 |
| C-3 | スキーマ名が `{Action}{Resource}RequestSchema` パターンに合致 |
| C-4 | `z.enum()` に `message` オプション存在確認 |
| D-1 | カスタムレスポンスフォーマッターに `interface` 定義存在 |
| D-2 | カスタムレスポンスフォーマッターに `JSON.stringify` 存在 |
| D-3 | カスタムレスポンスフォーマッターに `try/catch` 存在 |
| D-4 | カスタムレスポンスフォーマッターに `satisfies` 存在 |
| E-3 | `vi.mock()` 使用テストに `clearAllMocks` 存在確認 |
| E-4 | `it()` 記述に日本語文字含有確認 |
| H-3 | エクスポート型名がPascalCase |
| F-2 | エクスポート関数にJSDoc `@param`/`@returns` 存在確認 |

### 2. L3昇格（2ルール）— Biomeルール追加

| ルール | Biomeルール |
|--------|------------|
| B-2/G-2 | `useImportType` |
| G-3 | `useNodejsImportProtocol` |

### 3. L2残留（8ルール）— セマンティック・二重防御

機械的チェック不可のため、以下の二重防御で執行:

- **CLAUDE.md に明記**: 開発時にClaude Codeがルールに従ってコード生成（予防）
- **Claude Code Review CI**: PR時にClaudeがセマンティックルールの違反を自動検知（検知）

対象ルール: B-4, B-5, B-6, D-5, E-1, E-2, F-3, H-4

### 4. 重複整理（2ルール）

- B-1 → F-1（L4）に統合
- B-3 → G-1（L4）に統合

## 執行方法

- L4: `npm test` → GitHub Actions CI（ブロッキング）
- L3: `npm run biome:ci` → GitHub Actions CI（ブロッキング）
- L2: `CLAUDE.md`（開発時予防）+ `.github/workflows/claude-code-review.yml`（PR時検知、advisory）
