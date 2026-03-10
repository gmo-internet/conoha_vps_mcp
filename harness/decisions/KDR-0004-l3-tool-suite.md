# KDR-0004: L3 CIツールスイート導入

- 起源: Issues 02, 03, 04, 05, 07, 08
- レベル: L3
- 状態: 有効

## 経緯

OpenAIのハーネスエンジニアリングアプローチ（機械的執行・エントロピー管理・ゴールデンプリンシプルのエンコーディング）に基づき、L3（CIルール）層を大幅に強化する必要があった。既存のL3はBiomeのみで、アーキテクチャ境界・未使用コード・セキュリティ脆弱性・コード重複・テスト品質の検証が欠けていた。

## 決定

以下の6ツールをL3 CIルールとして導入する:

| ツール | 検出対象 | CI種別 | ワークフロー |
|--------|----------|--------|-------------|
| actionlint | GH Actionsワークフロー構文 | blocking | `github-actions-lint.yaml` |
| npm audit | 高リスク脆弱性 | blocking | `ci.yaml` (audit job) |
| knip | 未使用ファイル・エクスポート・依存 | blocking | `ci.yaml` (knip job) |
| dependency-cruiser | 循環依存・feature間インポート違反 | blocking | `ci.yaml` (depcruise job) |
| jscpd | コード重複 (10%閾値) | advisory | `jscpd.yaml` |
| Stryker | ミューテーションスコア (50%閾値) | advisory | `mutation.yaml` |

加えて、週次エントロピースキャン（`entropy-scan.yaml`）でPR間のドリフトを検出する。

## 執行方法

- **blocking ツール**: ci.yaml内のジョブとして実行。違反時はPRマージをブロック
- **advisory ツール**: 独立ワークフローとして実行。PRコメントで結果を報告（CIブロックなし）
- **エントロピー管理**: 週次スケジュールで自動実行。違反検出時にGitHub Issueを自動作成
