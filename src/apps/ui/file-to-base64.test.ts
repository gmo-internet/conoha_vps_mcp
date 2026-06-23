/**
 * file-to-base64 ユーティリティのテスト
 *
 * @remarks
 * node 環境には FileReader が無いため vi.stubGlobal で最小スタブを差し替え、
 * onload / onerror を手動駆動して data: ヘッダ除去と失敗系を検証する。
 *
 * @packageDocumentation
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { fileToBase64 } from "./file-to-base64";

/**
 * readAsDataURL 呼び出し時に指定結果で onload を発火する FileReader スタブを仕込む
 *
 * @param result - readAsDataURL 完了時に reader.result へ載せる値
 */
function stubFileReaderResolving(result: unknown): void {
	vi.stubGlobal(
		"FileReader",
		class {
			result: unknown = null;
			error: unknown = null;
			onload: (() => void) | null = null;
			onerror: (() => void) | null = null;
			readAsDataURL(): void {
				this.result = result;
				this.onload?.();
			}
		},
	);
}

describe("fileToBase64", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("data: ヘッダ付きの結果からカンマ以降の Base64 のみを取り出す", async () => {
		stubFileReaderResolving("data:text/plain;base64,QUJD");
		expect(await fileToBase64({} as File)).toBe("QUJD");
	});

	it("カンマを含まない結果はそのまま返す", async () => {
		stubFileReaderResolving("QUJD");
		expect(await fileToBase64({} as File)).toBe("QUJD");
	});

	it("結果が文字列でない場合は読み込み失敗で reject する", async () => {
		stubFileReaderResolving(new ArrayBuffer(8));
		await expect(fileToBase64({} as File)).rejects.toThrow(
			"ファイル読み込みに失敗しました",
		);
	});

	it("onerror 発火時は reader.error を理由に reject する", async () => {
		const cause = new Error("デバイスエラー");
		vi.stubGlobal(
			"FileReader",
			class {
				result: unknown = null;
				error: unknown = cause;
				onload: (() => void) | null = null;
				onerror: (() => void) | null = null;
				readAsDataURL(): void {
					this.onerror?.();
				}
			},
		);
		await expect(fileToBase64({} as File)).rejects.toBe(cause);
	});

	it("onerror 発火時に reader.error が無ければ既定メッセージで reject する", async () => {
		vi.stubGlobal(
			"FileReader",
			class {
				result: unknown = null;
				error: unknown = null;
				onload: (() => void) | null = null;
				onerror: (() => void) | null = null;
				readAsDataURL(): void {
					this.onerror?.();
				}
			},
		);
		await expect(fileToBase64({} as File)).rejects.toThrow("読み込みエラー");
	});
});
