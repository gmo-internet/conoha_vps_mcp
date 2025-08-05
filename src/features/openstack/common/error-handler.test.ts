import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatErrorMessage } from "../common/error-handler";

describe("formatErrorMessage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("エラーを渡されたら、エラーメッセージとしてAPI Error: ${error.message}の形で返してくれる", async () => {
		const mockError = new Error("test error");

		const result = formatErrorMessage(mockError);
		expect(result).toBe("API Error: test error");
	});

	it("Error以外の値が渡されたら、Unexpected error occurred.を返す", async () => {
		const result = formatErrorMessage("Some unexpected value");
		expect(result).toBe("Unexpected error occurred.");
	});
});
