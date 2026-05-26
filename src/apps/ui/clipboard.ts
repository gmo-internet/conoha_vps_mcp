/**
 * クリップボードコピーのフォールバック付きユーティリティ
 *
 * @remarks
 * MCP App は埋め込み Webview（iframe）上で動作するため、`navigator.clipboard`
 * が利用できない（非セキュアコンテキスト / Permissions Policy で `clipboard-write`
 * が許可されない）ことがある。その場合は一時 textarea を選択して
 * `document.execCommand('copy')` にフォールバックする。execCommand はユーザー
 * ジェスチャー起点であれば iframe 内でも動作する。
 *
 * @packageDocumentation
 */

/**
 * 文字列をクリップボードへコピーする（フォールバック付き）
 *
 * @remarks
 * 1. まず `navigator.clipboard.writeText` を試す。
 * 2. 利用不可または拒否された場合は一時 textarea + `execCommand('copy')` を使う。
 *
 * @param text - コピーする文字列
 * @returns コピーに成功したら true、いずれの手段でも失敗したら false
 */
export async function copyToClipboard(text: string): Promise<boolean> {
	// 型上は常に存在するが、実行環境では undefined になりうるため明示的に絞り込む
	const clipboard = navigator.clipboard as Clipboard | undefined;
	if (clipboard) {
		try {
			await clipboard.writeText(text);
			return true;
		} catch {
			// Permissions Policy 等で拒否された場合は execCommand にフォールバック
		}
	}
	return copyViaExecCommand(text);
}

/**
 * 一時 textarea を選択して execCommand('copy') でコピーする
 *
 * @internal
 */
function copyViaExecCommand(text: string): boolean {
	try {
		const ta = document.createElement("textarea");
		ta.value = text;
		ta.setAttribute("readonly", "");
		ta.style.position = "fixed";
		ta.style.top = "-9999px";
		ta.style.opacity = "0";
		document.body.appendChild(ta);
		ta.select();
		const ok = document.execCommand("copy");
		document.body.removeChild(ta);
		return ok;
	} catch {
		return false;
	}
}
