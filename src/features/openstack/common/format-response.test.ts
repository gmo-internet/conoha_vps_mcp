import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatResponse } from "./format-response";

// Responseオブジェクトのモック用ヘルパー関数
function createMockResponse(
	status: number,
	statusText: string,
	body: string,
): Response {
	return {
		status,
		statusText,
		text: vi.fn().mockResolvedValue(body),
	} as unknown as Response;
}

describe("format-response", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("formatResponse", () => {
		it("正常なJSONレスポンスを正しくフォーマットする", async () => {
			const mockJsonBody = { message: "success", data: { id: 1 } };
			const mockResponse = createMockResponse(
				200,
				"OK",
				JSON.stringify(mockJsonBody),
			);

			const result = await formatResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: mockJsonBody,
			});
		});

		it("プレーンテキストレスポンスを正しくフォーマットする", async () => {
			const mockTextBody = "Plain text response";
			const mockResponse = createMockResponse(404, "Not Found", mockTextBody);

			const result = await formatResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 404,
				statusText: "Not Found",
				body: mockTextBody,
			});
		});

		it("空のレスポンスボディを正しく処理する", async () => {
			const mockResponse = createMockResponse(204, "No Content", "");

			const result = await formatResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 204,
				statusText: "No Content",
				body: "",
			});
		});

		it("不正なJSONレスポンスをテキストとして処理する", async () => {
			const invalidJson = '{"invalid": json}';
			const mockResponse = createMockResponse(
				500,
				"Internal Server Error",
				invalidJson,
			);

			const result = await formatResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 500,
				statusText: "Internal Server Error",
				body: invalidJson,
			});
		});

		it("異なるHTTPステータスコードを正しく処理する", async () => {
			const testCases = [
				{ status: 201, statusText: "Created" },
				{ status: 400, statusText: "Bad Request" },
				{ status: 401, statusText: "Unauthorized" },
				{ status: 403, statusText: "Forbidden" },
				{ status: 500, statusText: "Internal Server Error" },
			];

			for (const testCase of testCases) {
				const mockResponse = createMockResponse(
					testCase.status,
					testCase.statusText,
					'{"test": "data"}',
				);

				const result = await formatResponse(mockResponse);
				const parsed = JSON.parse(result);

				expect(parsed.status).toBe(testCase.status);
				expect(parsed.statusText).toBe(testCase.statusText);
			}
		});

		it("複雑なJSONオブジェクトを正しく処理する", async () => {
			const complexJson = {
				users: [
					{ id: 1, name: "Alice", roles: ["admin", "user"] },
					{ id: 2, name: "Bob", roles: ["user"] },
				],
				metadata: {
					total: 2,
					page: 1,
					hasNext: false,
				},
				timestamps: {
					created: "2024-01-01T00:00:00Z",
					updated: null,
				},
			};

			const mockResponse = createMockResponse(
				200,
				"OK",
				JSON.stringify(complexJson),
			);

			const result = await formatResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: complexJson,
			});
		});

		it("特殊文字を含むテキストレスポンスを正しく処理する", async () => {
			const specialText =
				'Error: "Invalid request" with \\n newline and \\"quotes\\"';
			const mockResponse = createMockResponse(400, "Bad Request", specialText);

			const result = await formatResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 400,
				statusText: "Bad Request",
				body: specialText,
			});
		});

		it("nullやundefinedを含むJSONを正しく処理する", async () => {
			const jsonWithNulls = {
				value: null,
				optional: undefined,
				empty: "",
				zero: 0,
				false: false,
			};
			// undefinedは通常JSON.stringifyで除外されるため、実際のJSONからundefinedを除外
			const expectedJson = {
				value: null,
				empty: "",
				zero: 0,
				false: false,
			};

			const mockResponse = createMockResponse(
				200,
				"OK",
				JSON.stringify(expectedJson),
			);

			const result = await formatResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: expectedJson,
			});
		});

		it("大きなJSONレスポンスを正しく処理する", async () => {
			const largeArray = Array.from({ length: 1000 }, (_, i) => ({
				id: i,
				name: `Item ${i}`,
				data: `Data for item ${i}`,
			}));

			const mockResponse = createMockResponse(
				200,
				"OK",
				JSON.stringify(largeArray),
			);

			const result = await formatResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed.status).toBe(200);
			expect(parsed.statusText).toBe("OK");
			expect(parsed.body).toHaveLength(1000);
			expect(parsed.body[0]).toEqual({
				id: 0,
				name: "Item 0",
				data: "Data for item 0",
			});
		});

		it("HTMLレスポンスをテキストとして処理する", async () => {
			const htmlContent =
				"<html><body><h1>Error 404</h1><p>Page not found</p></body></html>";
			const mockResponse = createMockResponse(404, "Not Found", htmlContent);

			const result = await formatResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 404,
				statusText: "Not Found",
				body: htmlContent,
			});
		});

		it("XMLレスポンスをテキストとして処理する", async () => {
			const xmlContent =
				'<?xml version="1.0"?><root><error>Invalid request</error></root>';
			const mockResponse = createMockResponse(400, "Bad Request", xmlContent);

			const result = await formatResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 400,
				statusText: "Bad Request",
				body: xmlContent,
			});
		});

		it("response.text()がエラーを投げた場合に適切に処理する", async () => {
			const mockResponse = {
				status: 500,
				statusText: "Internal Server Error",
				text: vi
					.fn()
					.mockRejectedValue(new Error("Failed to read response body")),
			} as unknown as Response;

			await expect(formatResponse(mockResponse)).rejects.toThrow(
				"Failed to read response body",
			);
		});

		it("JSONが部分的に破損している場合にテキストとして処理する", async () => {
			const partiallyBrokenJson = '{"valid": "data", "broken": incomplete';
			const mockResponse = createMockResponse(200, "OK", partiallyBrokenJson);

			const result = await formatResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: partiallyBrokenJson,
			});
		});

		it("空のJSONオブジェクトを正しく処理する", async () => {
			const emptyJson = "{}";
			const mockResponse = createMockResponse(200, "OK", emptyJson);

			const result = await formatResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: {},
			});
		});

		it("空のJSON配列を正しく処理する", async () => {
			const emptyArray = "[]";
			const mockResponse = createMockResponse(200, "OK", emptyArray);

			const result = await formatResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: [],
			});
		});
	});
});
