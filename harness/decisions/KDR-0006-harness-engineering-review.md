# KDR-0006: ハーネスエンジニアリングレビューに基づく改善

- 起源: OpenAI "Harness engineering" 記事のレビュー
- レベル: L4
- 状態: 有効

## 経緯

OpenAIの「Harness engineering: leveraging Codex in an agent-first world」記事の3本柱（コンテキストエンジニアリング、アーキテクチャ制約、ガベージコレクション）の観点で本プロジェクトのハーネス設定をレビューした結果、以下の改善点を特定した。

## 決定

### 1. ドキュメント整合性テストの追加（L4）

CLAUDE.md・ESCALATION.md・パターンファイル間のクロスリファレンスを `architecture.test.ts` で機械的に検証する。

### 2. アーキテクチャレイヤーパターンの文書化

`harness/patterns/architecture-layers.md` として依存関係の概念モデルを明示する。

### 3. エントロピースキャンの鮮度チェック拡張

ESCALATION.mdとKDRファイルのgit更新日も90日閾値で検査する。

### 4. フィードバックループの構築（将来課題）

Claude Code Review CIの違反ラベル集計による昇格候補の自動検出。

### 5. ガベージコレクションの自動修正（将来課題）

entropy-scan検出結果のClaude Code自動修正ワークフロー。

### 6. ミューテーションテスト閾値の段階的強化（将来課題）

advisory → blocking への昇格。

### 7. オンボーディングガイドの作成（将来課題）

`harness/ONBOARDING.md` を作成し、新規コントリビューターの立ち上がりを支援する。

## 執行方法

- 項目1: `src/architecture.test.ts`（L4構造テスト）で自動検証
- 項目2: L1ドキュメント + dependency-cruiser（L3）で既存執行
- 項目3: `.github/workflows/entropy-scan.yaml`（L3）で自動検証
- 項目4-7: 将来のPR/Issueで段階的に実装
