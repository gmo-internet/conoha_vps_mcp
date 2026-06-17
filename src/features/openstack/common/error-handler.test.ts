import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatErrorMessage } from "../common/error-handler";

describe("formatErrorMessage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("一般的なエラーを渡されたら、何が起きたかを示すAPI Error: ${error.message}の形で返してくれる", async () => {
		const mockError = new Error("test error");

		const result = formatErrorMessage(mockError);
		expect(result).toBe("API Error: test error");
	});

	it("ネットワーク系のTypeError（fetch失敗等）を渡されたら、何が起きたかに加えて接続確認の対処ヒントを併せて返す", async () => {
		const mockError = new TypeError("fetch failed");

		const result = formatErrorMessage(mockError);
		expect(result).toBe(
			"API Error: fetch failed ConoHa API への接続に失敗しました。ネットワークと環境変数を確認してください",
		);
	});

	it("Error以外の値が渡されたら、何が起きたかに加えて再試行を促す対処ヒントを併せて返す", async () => {
		const result = formatErrorMessage("Some unexpected value");
		expect(result).toBe(
			"Unexpected error occurred. 予期しないエラーが発生しました。しばらく待って再試行してください",
		);
	});
});
