# KDR-0009: パターン freshness リフレッシュの運用

- 起源: PR #444（group C クリーンアップ）レビュー中の entropy-scan 赤 + Stop hook 指摘
- レベル: L3
- 状態: 有効

## 経緯

`entropy-scan.yaml` の "Check pattern freshness" ステップは、`harness/patterns/*.md` の frontmatter `last-reviewed` が 90 日閾値より古い場合に PR を失敗させる。PR #444 時点で全 16 ファイルが `2026-03-10`（閾値 `2026-03-20` を 10 日超過）で一律に stale となり、コード変更と無関係に entropy-scan が赤になっていた（repo-wide 条件）。

この場面で「KDR を作成するか」を検討した。結論と、その判断根拠を本 KDR に記録する。

## 決定

1. **freshness 赤の解消は `last-reviewed` の当日更新で行う。ただし日付だけを機械的に上げる（ゲートを gaming する）ことは禁止し、対象パターンが現行コードと合致するかを実際に確認した上で更新する。**
   - PR #444 では 16 ファイルすべてをレビューし current を確認した（コード変更が触れた 8 領域＝client-module / error-handling / response-formatter / type-definitions / naming-conventions / test-patterns / jsdoc / schema は実装と突き合わせ、残り 8＝architecture-layers / biome-rules / import-rules / path-addition / routing-tables / tool-registration / taste-invariants / file-structure は参照ファイル実在・CI ゲート（depcruise / biome / typecheck）緑・`architecture.test.ts` 432 passed で current を確認）。
2. **日付リフレッシュそのものには個別 KDR を作らない。** 定期メンテであり構造・知見の決定ではないため、KDR を量産すると `harness/decisions/` がセレモニー記録で希薄化する（minimality 原則）。代わりに「運用ポリシー」として本 KDR 1 本に集約する。
3. 罠として残す: `architecture-layers.md` と `taste-invariants.md` は **CRLF 行末**のため、`sed 's/...2026-03-10$/.../'` の `$` アンカーが効かず未置換になる。末尾アンカー無し `s/last-reviewed: OLD/last-reviewed: NEW/` で日付文字列だけ置換し、CRLF を保持すること。

## 執行方法

- `.github/workflows/entropy-scan.yaml` の "Check pattern freshness" ステップ（L3: 週次スケジュール + PR トリガー）
- 赤化時の手動手順: 16 ファイルの current 性を確認 → `last-reviewed` を当日に更新（日付以外は不変）→ ローカルで freshness ロジックを再現して緑を確認
- KDR ファイル自体は git 最終更新日で freshness 判定されるため、本 KDR の更新＝判定リセット
