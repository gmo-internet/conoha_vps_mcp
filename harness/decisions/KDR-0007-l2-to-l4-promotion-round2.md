# KDR-0007: L2→L4昇格第2弾 + ハーネス強化

- 起源: OpenAI "Harness engineering" 記事に基づく第2回レビュー
- レベル: L4
- 状態: 有効

## 経緯

OpenAI記事の3本柱（コンテキストエンジニアリング、アーキテクチャ制約、ガベージコレクション）およびMartin Fowlerの補完的分析に基づき、本プロジェクトのハーネス設定を再レビューした。

## 決定

### 1. L2→L4昇格（3ルール）

以下のルールを決定論的構造テストに昇格:

| ID | ルール | L4テスト手法 |
|----|--------|-------------|
| B-4 | クライアント関数命名 | `*-client.ts` の export function 名が `{get\|create\|delete\|update\|operate\|set\|upload}{PascalCase}(ByParam)?` パターンか検証 |
| D-5 | catch返却形式 | カスタムフォーマッターの catch ブロックに `JSON.stringify` + `status` + `statusText` が含まれるか検証 |
| H-4 | 定数UPPER_SNAKE_CASE | `constants.ts` の `export const` が UPPER_SNAKE_CASE か検証 |

L2に残留（セマンティック判断が必要）: B-5, B-6, E-1, E-2, F-3

### 2. CLAUDE.md目次化

CLAUDE.md を123行→約60行に圧縮。アーキテクチャ詳細を `docs/architecture.md` に分離し、CLAUDE.md にはポインタのみ残す。OpenAI推奨の「AGENTS.mdは目次」パターンに準拠。

### 3. エントロピースキャンにarchitecture.test.ts追加

週次エントロピースキャンに `npx vitest run src/architecture.test.ts` ステップを追加し、ドキュメント整合性テスト（L-1/L-2/L-3）を週次でも自動検証。

### 4. Taste Invariants の明文化

`harness/patterns/taste-invariants.md` を新設し、機械検証困難な主観的品質基準を定義。Claude Code Review CIのプロンプトに組み込み、L2で執行。

### 5. Claude Code ReviewプロンプトからL4昇格済みルールを除外

B-4, D-5, H-4 をCIレビュープロンプトから除外し、Taste Invariantsの観点を追加。

## 執行方法

- 項目1: `src/architecture.test.ts`（L4構造テスト）で自動検証
- 項目2: `docs/architecture.md` に詳細を移動済み
- 項目3: `.github/workflows/entropy-scan.yaml`（L3）で自動検証
- 項目4-5: `.github/workflows/claude-code-review.yml`（L2）で執行
