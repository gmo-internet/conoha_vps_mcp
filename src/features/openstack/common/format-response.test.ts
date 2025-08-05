import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatResponse } from "./response-formatter";

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
		it("公開APIの200 OKのJSONレスポンスを'{status: number, statusText: string, body: json}'形式にフォーマットできる", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
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

		it("公開APIの404 Not FoundのJSONレスポンスを'{status: number, statusText: string, body: string}'形式にフォーマットできる", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
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

		it("公開APIの204 No Contentの空レスポンスを'{status: number, statusText: string, body: ''}'形式にフォーマットできる", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			const mockResponse = createMockResponse(204, "No Content", "");

			const result = await formatResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 204,
				statusText: "No Content",
				body: "",
			});
		});

		it("公開APIの500 Internal Server Errorの不正なJSONレスポンスを'{status: number, statusText: string, body: string}'形式にフォーマットできる", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
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

		it("さまざまなHTTPステータスコードのJSONレスポンスを'{status: number, statusText: string}'形式に正しくフォーマットできる", async () => {
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

		it("公開APIの200 OKのレスポンスで入れ子構造や配列を含む複雑なJSONオブジェクトがあった場合に、'{status: number, statusText: string, body: json}'形式に正しくフォーマットできる", async () => {
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

		it("公開APIの400 Bad Requestのレスポンスで改行やクォートなど特殊文字を含むテキストがあった場合に、'{status: number, statusText: string, body: string}'形式に正しくフォーマットできる", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
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

		it("公開APIの200 OKレスポンスにnullやundefined、空文字、0、falseを含むJSONオブジェクトがあった場合に、'{status: number, statusText: string, body: json}'形式に正しくフォーマットできる", async () => {
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

		it("公開APIの200 OKレスポンスで1000件の要素を持つ大規模なJSON配列があった場合に、'{status: number, statusText: string, body: json[]}'形式に正しくフォーマットできる。\n加えてbody内のJSON配列の長さが1000でかつ0番目の値が'{id: 0, name: 'Item 0', data: 'Data for item 0'}'になっている", async () => {
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

		it("公開APIの404 Not FoundレスポンスでHTMLコンテンツが返却された場合に、'{status: number, statusText: string, body: string}'形式に正しくフォーマットできる", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
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

		it("公開APIの400 Bad RequestレスポンスでXMLコンテンツが返却された場合に、'{status: number, statusText: string, body: string}'形式に正しくフォーマットできる", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
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

		it("公開APIの500 Internal Server Errorレスポンスでresponse.text()が例外を投げた場合に、エラーメッセージを正しく例外としてスローできる", async () => {
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

		it("公開APIの200 OKレスポンスで部分的に破損したJSON文字列が返却された場合に、'{status: number, statusText: string, body: string}'形式のように、JSON文字列をテキストデータとして正しくフォーマットできる", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
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

		it("公開APIの200 OKレスポンスで空のJSONオブジェクトが返却された場合に、'{status: number, statusText: string, body: {}}'形式に正しくフォーマットできる", async () => {
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

		it("公開APIの200 OKレスポンスで空のJSON配列が返却された場合に、'{status: number, statusText: string, body: []}'形式に正しくフォーマットできる", async () => {
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
