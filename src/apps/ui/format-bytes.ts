/**
 * バイト数を人間可読な表記（B/KB/MB/GB/TB）に整形する純粋関数
 *
 * @remarks
 * mcp-app.ts のローカル関数を切り出し、単体テスト可能にする。
 *
 * @packageDocumentation
 */

/**
 * バイト数を 1024 進法で B/KB/MB/GB/TB に丸める
 *
 * @remarks
 * - 1024 未満は整数のまま `B`
 * - 1024 以上は単位を順に繰り上げ、100 未満は小数 1 桁、100 以上は整数で丸める
 * - 負の値や NaN は "0 B" にフォールバック
 *
 * @param bytes - バイト数
 * @returns 人間可読な文字列（例: "4.5 GB", "12 KB"）
 */
export function formatBytes(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
	if (bytes < 1024) return `${Math.round(bytes)} B`;
	const units = ["KB", "MB", "GB", "TB"];
	let n = bytes / 1024;
	let i = 0;
	while (n >= 1024 && i < units.length - 1) {
		n /= 1024;
		i++;
	}
	return `${n.toFixed(n >= 100 ? 0 : 1)} ${units[i]}`;
}
