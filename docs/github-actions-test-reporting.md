# GitHub Actions Test Reporting

このドキュメントでは、GitHub ActionsでテストレポートをPRコメントに表示する機能について説明します。

## 概要

このプロジェクトでは、Pull Request作成時に自動的にテストを実行し、`reports/test-cases.csv`の内容を表形式でGitHubのPRコメントに投稿するGitHub Actionsワークフローが設定されています。

## ファイル構成

```
.github/
├── workflows/
│   └── test-report.yml          # GitHub Actionsワークフロー
└── scripts/
    └── csv-to-markdown.js       # CSV→Markdown変換スクリプト
```

## ワークフローの動作

### トリガー条件
- Pull Requestが作成された時
- Pull Requestに新しいコミットがプッシュされた時
- Pull Requestが再オープンされた時

### 実行ステップ

1. **コードのチェックアウト**
   - リポジトリのコードを取得

2. **Node.js環境のセットアップ**
   - Node.js 18をインストール
   - npm キャッシュを使用

3. **依存関係のインストール**
   - `npm ci`でプロジェクトの依存関係をインストール

4. **テストの実行**
   - `npm test`でテストを実行
   - CSVレポーターによって`reports/test-cases.csv`が生成される

5. **CSVをMarkdownテーブルに変換**
   - `.github/scripts/csv-to-markdown.js`を実行
   - CSVファイルを読み込み、Markdownテーブル形式に変換
   - `test-report.md`ファイルを生成

6. **PRコメントの投稿**
   - 既存のテストレポートコメントがあれば更新
   - なければ新しいコメントを作成
   - Markdownテーブルとサマリー統計を表示

7. **アーティファクトのアップロード**
   - `reports/test-cases.csv`と`test-report.md`を保存（30日間）

## 出力例

PRコメントには以下のような内容が表示されます：

```markdown
## 📊 Test Results Report

| Category | Functional Area | Suite Name | Test Name | Status | Duration (ms) |
|----------|-----------------|------------|-----------|--------|---------------|
| API | Common | format-response > formatResponse | 正常なJSONレスポンスを正しくフォーマットする | ✅ passed | 3.04 |
| Mock | Core | index > モック関数の基本動作 | compute関連のモック関数が正しく定義されている | ✅ passed | 2.42 |
| ... | ... | ... | ... | ... | ... |

---

### 📈 Summary
- **Total Tests:** 231
- **✅ Passed:** 231
- **❌ Failed:** 0
- **⏭️ Skipped:** 0
- **Status:** 🎉 All tests passed!
```

## CSV形式について

`reports/test-cases.csv`は以下の形式で出力されます：

```csv
Category,FunctionalArea,SuiteName,TestName,Status,Duration(ms)
Mock,Core,"index > モック関数の基本動作","compute関連のモック関数が正しく定義されている",passed,2.421100000000024
```

### 列の説明
- **Category**: テストのカテゴリ（API、Mock、Schema、等）
- **FunctionalArea**: 機能領域（Core、Common、Compute、等）
- **SuiteName**: テストスイート名
- **TestName**: 個別のテスト名
- **Status**: テスト結果（passed、failed、skipped）
- **Duration(ms)**: 実行時間（ミリ秒）

## ステータス表示

テスト結果は絵文字付きで表示されます：
- ✅ passed - テスト成功
- ❌ failed - テスト失敗  
- ⏭️ skipped - テストスキップ
- 🔍 その他の状態

## 必要な権限

このワークフローには以下の権限が必要です：
- `contents: read` - コードの読み取り
- `pull-requests: write` - PRコメントの作成・更新

## カスタマイズ

### 表示内容の変更
`.github/scripts/csv-to-markdown.js`を編集することで、表示する列や形式を変更できます。

### トリガー条件の変更
`.github/workflows/test-report.yml`の`on`セクションを編集することで、実行タイミングを変更できます。

### CSVファイルパスの変更
スクリプト内の`csvFilePath`を変更することで、異なるCSVファイルを読み込むことができます。

## トラブルシューティング

### CSVファイルが見つからない
- テストが正常に実行されているか確認
- CSVレポーターが正しく設定されているか確認（`vitest.config.ts`）

### 権限エラー
- リポジトリの設定でGitHub Actionsに適切な権限が付与されているか確認
- ワークフローファイルの`permissions`セクションを確認

### コメントが更新されない
- GitHub token が正しく設定されているか確認
- PR番号が正しく取得されているか確認
