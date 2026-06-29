/**
 * File ⇔ Base64 変換ユーティリティ
 *
 * @remarks
 * 本番 `mcp-bridge.ts` とプレビュー `preview/mock-bridge.ts` の双方から利用する
 * 純粋関数を 1 箇所に集約する。認証もモックも絡まないブラウザ File API のみの
 * ヘルパーのため、両ブリッジで重複させず本ファイルへ一本化する。
 *
 * @packageDocumentation
 */

/**
 * File オブジェクトを Base64 文字列に変換する
 *
 * @remarks
 * `FileReader.readAsDataURL` の結果から data: URI のヘッダ部を除いた純粋な
 * Base64 文字列のみを返す。大きなファイルでもスタックオーバーフローしない。
 *
 * @param file - ブラウザの File オブジェクト
 * @returns Base64 文字列（data: ヘッダ無し）
 */
export function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result;
			if (typeof result !== "string") {
				reject(new Error("ファイル読み込みに失敗しました"));
				return;
			}
			const comma = result.indexOf(",");
			resolve(comma >= 0 ? result.slice(comma + 1) : result);
		};
		reader.onerror = () => reject(reader.error ?? new Error("読み込みエラー"));
		reader.readAsDataURL(file);
	});
}
