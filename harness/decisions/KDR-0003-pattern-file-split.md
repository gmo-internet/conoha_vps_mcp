# KDR-0003: CODING_PATTERN.md 分割

- 起源: ハーネスフレームワーク導入
- レベル: L1
- 状態: 有効

## 経緯

`CODING_PATTERN.md` が681行に成長し、以下の問題が生じていた:

1. AIスキルが全文を読み込むコンテキストコストが高い
2. パターンファイルごとの `enforcement-level` を付与できない
3. 個別パターンの更新履歴が追いにくい

## 決定

`CODING_PATTERN.md` を14のパターンファイルに分割し、`harness/patterns/` に配置する。元の `CODING_PATTERN.md` は目次テーブル + 各ファイルへのリンクのインデックスファイルに変換する。

各パターンファイルにはYAMLフロントマターで以下のメタデータを付与:
- `id`: セクション番号
- `title`: セクションタイトル
- `last-reviewed`: 最終レビュー日
- `enforcement-level`: 執行レベル（L1〜L4）
- `related-rules`: 関連ルールID
- `checked-by`: 検証メカニズム

## 執行方法

- `harness/patterns/*.md` に分割ファイルを配置
- `CODING_PATTERN.md` をインデックス化
- `coding-pattern-check` スキルの参照先を更新
