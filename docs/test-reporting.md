# テストケースCSVレポート機能

## テスト・品質管理

このプロジェクトでは、品質保証とビジネス報告のために包括的なテストスイートを提供しています。

### テスト実行

```bash
# 基本テスト実行（カバレッジ付き）
npm test

# CSVレポート付きテスト実行
npm run test:csv

# 詳細なビジネス分析レポート生成
npm run test:report
```

### ビジネス報告用CSVエクスポート

テストケースをビジネスサイドへの報告用にCSV形式でエクスポートできます：

- **出力ファイル**: `./reports/test-cases.csv`
- **含まれる情報**: テスト名、カテゴリ、機能エリア、ビジネス価値、優先度、実行結果など
- **自動分類**: API、スキーマ、エラーハンドリング、パフォーマンステストの自動分類
- **ビジネス価値評価**: High/Medium/Lowでの価値評価
- **優先度評価**: Critical/Important/Normalでの優先度評価

詳細は [テストレポート機能](docs/test-reporting.md) を参照してください。

## その他

ビジネスサイドへの報告用として、VitestのテストケースをCSV形式でエクスポートする機能です。

## 概要

この機能により、以下の情報を含むCSVレポートを生成できます：

- **FileName**: テストファイルのパス
- **SuiteName**: テストスイート名（describe）
- **TestName**: テストケース名（it）
- **Category**: テストカテゴリ（API、Schema、ErrorHandling、Performance等）
- **FunctionalArea**: 機能エリア（Compute、Network、Volume、Image、Common、Core）
- **TestType**: テストタイプ（Unit、Integration）
- **Status**: テスト結果（passed、failed、skipped）
- **Duration(ms)**: テスト実行時間（ミリ秒）
- **Description**: テストの説明（日本語）
- **BusinessValue**: ビジネス価値（High、Medium、Low）
- **Priority**: 優先度（Critical、Important、Normal）

## 使用方法

### 1. CSV レポートのみ生成

```bash
npm run test:csv
```

### 2. CSV レポート + カバレッジレポート生成

```bash
npm run test:full-report
```

### 3. 既存のテストコマンド（CSV + カバレッジ）

```bash
npm test
```

## 出力ファイル

- **場所**: `./reports/test-cases.csv`
- **形式**: UTF-8エンコードのCSV
- **区切り文字**: カンマ（,）

## レポートの分類ロジック

### カテゴリ分類

- **ErrorHandling**: エラー、例外、失敗を含むテスト
- **Performance**: パフォーマンス、大量データ、長いパスのテスト
- **Schema**: スキーマファイルのテスト
- **API**: API、リクエスト、レスポンスのテスト
- **Validation**: 検証、許可、拒否のテスト
- **Mock**: モック関連のテスト
- **Functional**: その他の機能テスト

### 機能エリア分類

ファイルパスに基づいて自動分類：

- **Compute**: `/compute/` - サーバー管理機能
- **Network**: `/network/` - ネットワーク管理機能
- **Volume**: `/volume/` - ボリューム管理機能
- **Image**: `/image/` - イメージ管理機能
- **Common**: `/common/` - 共通機能
- **Core**: `index.test.ts` - コア機能

### ビジネス価値評価

- **High**: コアAPI機能、エラーハンドリング
- **Medium**: スキーマ検証、一般的な機能
- **Low**: パフォーマンステスト、モックテスト

### 優先度評価

- **Critical**: エラーハンドリング、セキュリティ関連
- **Important**: 作成、削除、APIの基本機能
- **Normal**: その他の機能

## 実行例

```bash
$ npm run test:csv

> conoha-vps-mcp@0.2.0 test:csv
> vitest run

 ✓ src/features/openstack/compute/compute-client.test.ts (29 tests) 29ms
 ✓ src/features/openstack/network/network-client.test.ts (33 tests) 26ms
 ✓ src/features/openstack/common/openstack-client.test.ts (20 tests) 84ms
 ...

 Test Files  11 passed (11)
      Tests  231 passed (231)

📊 Generating CSV test report...
✅ CSV report generated: ./reports/test-cases.csv
📈 Total test cases: 231

📊 Test Summary:
  - Passed: 231
  - Failed: 0
  - Skipped: 0
  - High Business Value: 54
  - Critical Priority: 31
```

## CSVサンプル出力

```csv
FileName,SuiteName,TestName,Category,FunctionalArea,TestType,Status,Duration(ms),Description,BusinessValue,Priority
"/src/features/openstack/compute/compute-client.test.ts","compute-client > getCompute","サーバー一覧取得のAPIを正しく呼び出す",API,Compute,Unit,passed,6.3,"ConoHa VPSサーバー一覧の取得機能",High,Important
"/src/features/openstack/compute/compute-client.test.ts","compute-client > getCompute > エラーハンドリング","executeOpenstackApiが例外を投げた場合はそのまま例外を投げる",ErrorHandling,Compute,Unit,passed,1.9,"API例外処理の検証",High,Critical
```

## ビジネス報告での活用

このCSVレポートは以下の用途に活用できます：

1. **品質報告**: テストカバレッジと実行結果の可視化
2. **リスク評価**: Critical優先度のテスト結果の確認
3. **機能別分析**: 各機能エリアのテスト充実度の評価
4. **投資判断**: High Business Valueテストの成功率分析
5. **プロジェクト管理**: テスト実行時間とパフォーマンス分析

## カスタマイズ

カテゴリ分類や説明文をカスタマイズしたい場合は、`src/reporters/csv-reporter.ts`を編集してください。

- `categorizeTest()`: カテゴリ分類ロジック
- `generateDescription()`: 説明文生成ロジック
- `assessBusinessValue()`: ビジネス価値評価ロジック
- `assessPriority()`: 優先度評価ロジック
