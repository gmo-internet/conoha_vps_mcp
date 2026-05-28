/**
 * ファイル拡張子から MIME タイプを推定する純粋関数
 *
 * @remarks
 * オブジェクト一覧表示で content_type が未設定の場合のフォールバックや、
 * アップロード直後にサーバー応答を待たず暫定的に表示する目的で利用する。
 *
 * @packageDocumentation
 */

const MIME_BY_EXT: Readonly<Record<string, string>> = {
	gz: "application/gzip",
	tar: "application/x-tar",
	zip: "application/zip",
	json: "application/json",
	txt: "text/plain",
	log: "text/plain",
	md: "text/markdown",
	html: "text/html",
	css: "text/css",
	js: "application/javascript",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	gif: "image/gif",
	webp: "image/webp",
	svg: "image/svg+xml",
	mp4: "video/mp4",
	mov: "video/quicktime",
	pdf: "application/pdf",
};

/**
 * ファイル名の拡張子から MIME タイプを推定する
 *
 * @remarks
 * - 拡張子は最後の "." 以降の文字列を小文字化して照合する
 * - 拡張子無し・対応外の拡張子はすべて "application/octet-stream"
 *
 * @param name - ファイル名（例: "report.pdf"）
 * @returns 推定された MIME タイプ
 */
export function guessMime(name: string): string {
	const dot = name.lastIndexOf(".");
	if (dot < 0 || dot === name.length - 1) {
		return "application/octet-stream";
	}
	const ext = name.slice(dot + 1).toLowerCase();
	return MIME_BY_EXT[ext] ?? "application/octet-stream";
}
