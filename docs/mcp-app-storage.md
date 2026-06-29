# 🌐 MCP App: 静的ホスティング UI 利用ガイド

ConoHa VPS のオブジェクトストレージを **静的サイトホスティング** として GUI から運用できる MCP App（埋め込み HTML UI）の使い方を説明します。

サイト用のコンテナを作成 → ファイルをアップロード → ワンクリックで Web 公開 → 公開 URL をコピーしてブラウザで確認、という流れを LLM への自然言語指示なしに完結できます。

---

## ✨ 主なユースケース

**ConoHa オブジェクトストレージで静的サイトを最速公開する**ためのコンソールです。

| やりたいこと | UI 操作 | 内部で呼ばれる MCP ツール |
|---|---|---|
| サイト用コンテナを作る | `+ コンテナ作成` ボタン → 名前入力 | `create_container` |
| サイトを **Web 公開する** | コンテナカードの `🌐 公開` ボタン | `enable_web_publish` |
| 公開 URL をコピー | カード下のシアン色の URL バー | （ブラウザの clipboard API） |
| サイトを **非公開に戻す** | カードの `非公開化` ボタン | `disable_web_publish` |
| サイトファイルをアップロード | コンテナを開いて `📤 ファイルをアップロード` | `upload_object` |
| 不要なファイルを削除 | オブジェクト行の `削除` | `delete_object` |
| サイトごと削除 | コンテナカードの `削除` | `delete_container` |

---

## 🚀 セットアップ

### 1. 環境変数を設定

`.env` または Claude Desktop / Claude Code の MCP 設定で、ConoHa の API ユーザー情報を設定します。

```env
OPENSTACK_TENANT_ID=your-tenant-id
OPENSTACK_USER_ID=your-user-id
OPENSTACK_PASSWORD=your-password
```

ConoHa コントロールパネル → **API → APIユーザー** で確認できます。

### 2. MCP クライアントから起動

`list_containers` ツールを呼び出すと、Claude Desktop / 対応クライアント上で MCP App UI が開きます。

```
list_containers を実行して静的ホスト管理画面を開いて
```

---

## 🌐 静的サイトを公開する流れ

### ① コンテナ（= サイト）を作成

`+ コンテナ作成` → サイト名（英数字 / `-` / `_` / `.`）を入力 → `コンテナを作成`

### ② ファイルをアップロード

作成したコンテナをクリック → `📤 ファイルをアップロード` で `index.html` 等を投入

> 💡 1 ファイルあたり **10 MB が上限**です。それ以上は `conoha_post_put` ツール（LLM 経由）を利用してください。

### ③ コンテナを Web 公開

コンテナ一覧に戻り、`🌐 公開` ボタンを押す。

裏側で `POST /v1/AUTH_{tenantid}/{container}` に `X-Container-Read: .r:*,.rlistings` ヘッダが送られ、匿名読み取りが許可されます。

### ④ 公開 URL を取得

公開済みコンテナのカード下に **cyan の URL バー**が出現:

```
🔗 https://object-storage.c3j1.conoha.io/v1/AUTH_xxx/your-site
```

クリックでクリップボードにコピー。各オブジェクトは:

```
https://object-storage.c3j1.conoha.io/v1/AUTH_xxx/your-site/index.html
```

の形式で **誰でも HTTPS でアクセス可能**になります。

### ⑤ 非公開に戻す（必要時）

`非公開化` ボタンを押すと `X-Container-Read` が空になり、匿名アクセスは即座に拒否されます。

---

## 🖥️ 画面構成

### コンテナ（サイト）一覧

```
┌──────────────────────────────────────────────────┐
│ ConoHa VPS / storage                  [MCP App] │
├──────────────────────────────────────────────────┤
│ [ストレージ]                                       │
├──────────────────────────────────────────────────┤
│ コンテナ 3 件                  [+ コンテナ作成]    │
├──────────────────────────────────────────────────┤
│ ┌──────────────────────────┐                     │
│ │📦 my-portfolio  ●公開中    │ ← 公開状態バッジ    │
│ │  [非公開化] [削除]         │ ← hover で出る     │
│ │  Objects: 12  Size: 4MB   │                    │
│ │  🔗 https://...my-portfolio│ ← 公開URL          │
│ └──────────────────────────┘                     │
│ ┌──────────────────────────┐                     │
│ │📦 staging       非公開     │                    │
│ │  [🌐 公開] [削除]          │                    │
│ │  Objects: 5  Size: 1MB    │                    │
│ └──────────────────────────┘                     │
└──────────────────────────────────────────────────┘
```

公開中のコンテナは **緑のドット + 「公開中」バッジ**、非公開は **グレーの「非公開」バッジ**で一目で判別できます。

### サイト内ファイル一覧（コンテナ詳細）

```
┌────────────────────────────────────────────────┐
│ ConoHa VPS / storage / my-portfolio  [MCP App] │
├────────────────────────────────────────────────┤
│ [← 戻る] 📦 my-portfolio 12 件  [📤 アップロード] │
├────────────────────────────────────────────────┤
│ 📝 index.html                                   │
│   text/html         2026-04-30  4.2 KB  [削除]  │
│ 🖼️ hero.jpg                                    │
│   image/jpeg        2026-04-22  2.4 MB  [削除]  │
│ 📝 main.css                                     │
│   text/css          2026-04-30  1.8 KB  [削除]  │
└────────────────────────────────────────────────┘
```

各オブジェクト行に MIME バッジが付くので、`text/html` / `image/*` / `text/css` などサイト構成ファイルを判別しながら管理できます。

---

## 🎨 アイコン規約（MIME タイプ別）

| MIME タイプ | アイコン | 静的サイトでの典型用途 |
|---|---|---|
| `text/html` / `text/css` / `application/json` / `application/xml` | 📝 | HTML / CSS / 設定ファイル |
| `image/*` | 🖼️ | サイト画像 |
| `video/*` | 🎞️ | 動画 |
| `audio/*` | 🎵 | BGM・音声 |
| `application/pdf` | 📕 | 配布資料 |
| zip / gzip / tar | 🗜️ | アーカイブ配布 |
| その他 | 📄 | – |

---

## 🛠️ トラブルシュート

### `🌐 公開` ボタンを押しても反映されない
- ConoHa Swift の ACL 反映に数秒〜十数秒の遅延があります。`非公開化` → `🌐 公開` のトグルで再設定してから、URL バーをコピーしてブラウザで確認してください。

### 公開 URL にアクセスしても 401 / 403
- `X-Container-Read: .r:*,.rlistings` が正しく設定されたか確認:
  ```
  curl -I https://object-storage.c3j1.conoha.io/v1/AUTH_xxx/your-site/
  ```
  に `x-container-read: .r:*,.rlistings` が含まれていれば公開済み。
- 一度 `非公開化` → `🌐 公開` で再設定してみてください。

### 公開時 `index.html` が直接表示されず JSON が返る
- ConoHa は標準で「コンテナ直アクセス時に index.html を出す」設定が有効ではありません。
- 個別ファイルへ直接 URL を指すとアクセス可能:
  - `https://object-storage.c3j1.conoha.io/v1/AUTH_xxx/your-site/index.html`
- ドメインを当てたい・index 自動表示したい場合は CDN や別ホスティング層の併用を検討してください。

### コンテナを削除できない（409 Conflict）
- 中身が空でないコンテナは削除できません。先にすべてのオブジェクトを削除してください。

### アップロードが「サイズ上限を超えています」で失敗する
- UI からは 10 MB が上限です。
- 大容量ファイルは `conoha_post_put` ツール（LLM 指示）で `path/to/file` を指定してアップロードしてください。

---

## 🔒 セキュリティ上の注意

- `🌐 公開` を押すと **コンテナ内のすべてのオブジェクトが匿名でダウンロード可能**になります。機密ファイルが含まれていないか必ず確認してください。
- 非公開化は即時反映されますが、CDN・プロキシのキャッシュには残る可能性があります。

---

## 🔗 関連ドキュメント

- [README.md](../README.md) — プロジェクト全体の概要・クイックスタート
- [architecture.md](./architecture.md) — アーキテクチャ詳細・MCP ツール一覧
- [ConoHa Object Storage API リファレンス](https://doc.conoha.jp/reference/api-vps3/api-objectstorage-vps3/)
- [Web 公開 API](https://doc.conoha.jp/reference/api-vps3/api-objectstorage-vps3/object-web-publishing-v3/)
