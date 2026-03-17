### 変更内容

変更点とその重要性を明確に記載してください。

---

### 参考情報

関連する情報源へのリンクを貼ってください（複数可）。

---

### チェックリスト

- [ ] [Conventional Commits](https://www.conventionalcommits.org/ja/v1.0.0/) に則ったコミットログで構成されていることを確認しました
- [ ] [ConoHa VPS MCP Code of Conduct](https://github.com/gmo-internet/conoha_vps_mcp/blob/main/CODE_OF_CONDUCT.md) を読みました
- [ ] GitHub ActionsのCIがすべて通ることを確認しました
- [ ] NOTICEを更新しました（`npm run generate:notice`コマンドの実行）※ パッケージの更新があった場合
- [ ] release前にはpackage.jsonとmanifest.jsonのバージョン更新を行いました
- [ ] npmへのpublishはGitHub Action経由で、Trusted Publishingにて行うため、内容を確認しました
- [ ] Claude Code Review の指摘事項に対応しました（`pattern-violation:*` ラベルなし or `review:clean` を確認）
- [ ] この変更で `harness/patterns/` のパターン更新が必要ですか？（必要ならば更新済み）
- [ ] 新しいパターンや規約が導入されましたか？（導入した場合は `harness/decisions/` にKDRを作成済み）
