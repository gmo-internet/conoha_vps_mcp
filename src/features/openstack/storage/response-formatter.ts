/**
 * Object Storage APIレスポンスフォーマッター
 *
 * @remarks
 * OpenStack Object Storage (Swift) APIからのレスポンスを
 * 統一されたJSON形式に変換します。
 *
 * @packageDocumentation
 */

import type { Buffer } from "node:buffer";

/**
 * HEADリクエストのレスポンスをフォーマット
 *
 * @param response - fetch APIのResponseオブジェクト
 * @returns JSON文字列（status、statusText、headersを含む）
 *
 * @remarks
 * HEADリクエストではレスポンスボディがないため、
 * ヘッダー情報のみを返します。
 *
 * @example
 * ```typescript
 * const response = await fetch(url, { method: "HEAD" });
 * const formatted = formatHeadResponse(response);
 * // formatted: '{"status":200,"statusText":"OK","headers":{...}}'
 * ```
 */
export function formatHeadResponse(response: Response): string {
	const responseHeaders: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		responseHeaders[key] = value;
	});

	return JSON.stringify({
		status: response.status,
		statusText: response.statusText,
		headers: responseHeaders,
	});
}

/**
 * オブジェクト取得（ダウンロード）レスポンスをフォーマット
 *
 * @param response - fetch APIのResponseオブジェクト
 * @param content - レスポンスボディの生バイト列（Buffer）
 * @returns JSON文字列（status、statusText、headers、body、encodingを含む）
 *
 * @remarks
 * Content-Typeに基づいてバイナリかテキストかを判定し、
 * バイナリデータの場合はBase64エンコード、テキストの場合はUTF-8で
 * デコードして返します。エンコーディング情報も含めることで、
 * クライアント側で適切にデコードできるようにします。
 *
 * @example
 * ```typescript
 * const response = await fetch(url);
 * const content = Buffer.from(await response.arrayBuffer());
 * const formatted = formatObjectGetResponse(response, content);
 * // formatted: '{"status":200,"statusText":"OK","headers":{...},"body":"...","encoding":"base64"}'
 * ```
 */
export function formatObjectGetResponse(
	response: Response,
	content: Buffer,
): string {
	const responseHeaders: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		responseHeaders[key] = value;
	});

	const contentType = response.headers.get("content-type") || "";

	let body: string;
	const isBinary =
		!contentType.includes("text/") &&
		!contentType.includes("application/json") &&
		!contentType.includes("application/xml");

	if (isBinary) {
		body = content.toString("base64");
	} else {
		body = content.toString("utf8");
	}

	return JSON.stringify({
		status: response.status,
		statusText: response.statusText,
		headers: responseHeaders,
		body: body,
		encoding: isBinary ? "base64" : "utf8",
	});
}
