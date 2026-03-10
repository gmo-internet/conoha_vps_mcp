---
id: 16
title: Taste Invariants（主観的品質基準）
last-reviewed: 2026-03-10
enforcement-level: L2
related-rules: [B-5, B-6, E-2, F-3]
checked-by: [coding-pattern-check]
---

## 16. Taste Invariants（主観的品質基準）

機械的に検証困難だが、プロジェクトの品質と一貫性に重要な判断基準。
L2（CLAUDE.md + Claude Code Review CI）で執行する。

### APIレスポンス設計

- フォーマッターは「ユーザーが次のアクション判断に必要な情報のみ」に絞る
- 不要なネスト（`server.server.id` → `server.id`）を排除する
- 日付や状態値はそのまま返し、独自フォーマットを加えない

### エラーメッセージ

- 「何が起きたか」+「何をすべきか」の2要素で構成する
- 例: `"サーバーが見つかりません。server_idが正しいか確認してください"`

### 関数設計

- 1関数 = 1 API操作（単一責任）
- 複数APIを組み合わせるオーケストレーションはクライアント関数に持たせない
- 副作用（ログ出力等）は最小限に

### セマンティックルールとの関連

以下のL2ルールはこの品質基準を具体化したもの:

| ID | ルール | 判断基準 |
|----|--------|---------|
| B-5 | `executeOpenstackApi()` → `formatResponse()` チェーン | 単一責任: API呼び出しとレスポンス整形を分離 |
| B-6 | storageは `generateApiToken()` を直接使用 | アーキテクチャ例外の明示的管理 |
| E-2 | `vi.mocked(await import(...))` パターン | テストの型安全性と可読性 |
| F-3 | JSDoc日本語記述 | 日本語ファーストの一貫性 |
