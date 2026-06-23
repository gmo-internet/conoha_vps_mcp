/**
 * エラーハンドリングユーティリティ
 *
 * @packageDocumentation
 */

/**
 * エラーオブジェクトをユーザーフレンドリーなメッセージに変換
 *
 * @param error - 任意のエラーオブジェクト
 * @returns フォーマット済みエラーメッセージ文字列
 *
 * @remarks
 * 「何が起きたか」に加えて「何をすべきか」の対処ヒントを併せて返します。
 * ネットワーク系の失敗（fetch 失敗時の `TypeError` 等）には接続確認の案内を、
 * Errorインスタンス以外の不明なエラーには再試行・問い合わせの案内を付与します。
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation();
 * } catch (error) {
 *   const message = formatErrorMessage(error);
 *   // message: "API Error: fetch failed ConoHa API への接続に失敗しました。ネットワークと環境変数を確認してください"
 * }
 * ```
 */
export function formatErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		if (error instanceof TypeError) {
			return `API Error: ${error.message} ConoHa API への接続に失敗しました。ネットワークと環境変数を確認してください`;
		}
		return `API Error: ${error.message}`;
	}
	return "Unexpected error occurred. 予期しないエラーが発生しました。しばらく待って再試行してください";
}
