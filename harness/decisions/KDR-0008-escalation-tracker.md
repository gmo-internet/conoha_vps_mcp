# KDR-0008: L2→L3 エスカレーション自動トラッカー

- 起源: KDR-0006 項目4「フィードバックループの構築」
- レベル: L3
- 状態: 有効

## 経緯

ESCALATION.md では L2→L3 の昇格基準を「3回以上検出 + 自動検出手段あり」と定義しているが、違反回数の集計と昇格候補の通知が手動運用に依存していた。KDR-0006 で将来課題として挙げられていたフィードバックループを実装する。

## 決定

週次ワークフロー `.github/workflows/escalation-tracker.yaml` を新設し、以下を自動化する:

1. Claude Code Review CI が付与する `pattern-violation:*` ラベル付きマージ済みPRを集計
2. 閾値（3件）以上のルールについて GitHub Issue を自動作成
3. 重複防止: `escalation-candidate:{RULE-ID}` ラベルで既存 Issue を検索し、open なら更新、closed ならスキップ

対象ルール: B-5, B-6, E-1, E-2, F-3（ESCALATION.md の L2 ルール）

実際の L3 昇格判断（KDR作成、CI設定追加、ESCALATION.md 更新）は人間が行う。

## 執行方法

- `.github/workflows/escalation-tracker.yaml`（L3: 週次スケジュール + workflow_dispatch）
- `actions/github-script` による GitHub API 呼び出し（checkout 不要）
