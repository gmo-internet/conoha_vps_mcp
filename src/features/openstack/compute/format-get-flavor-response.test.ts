import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatGetFlavorResponse } from "./get-flavor-response-formatter";

// Responseオブジェクトのモック用ヘルパー関数
function createMockResponse(
	status: number,
	statusText: string,
	body: any,
): Response {
	return {
		status,
		statusText,
		json: vi.fn().mockResolvedValue(body),
	} as unknown as Response;
}

describe("format-get-flavor-response", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("formatGetFlavorResponse", () => {
		it("正常なflavorレスポンスを'{status: number, statusText: string, body: {flavors: FlavorData[]}}'形式にフォーマットできる", async () => {
			const mockBody = {
				flavors: [
					{
						id: "1",
						name: "g-1gb",
						ram: 1024,
						vcpus: 1,
						disk: 100,
						extra_field: "should_be_filtered",
					},
					{
						id: "2",
						name: "g-2gb",
						ram: 2048,
						vcpus: 2,
						disk: 100,
					},
				],
			};
			const mockResponse = createMockResponse(200, "OK", mockBody);

			const result = await formatGetFlavorResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: {
					flavors: [
						{
							id: "1",
							name: "g-1gb",
							ram: 1024,
							vcpus: 1,
							disk: 100,
						},
						{
							id: "2",
							name: "g-2gb",
							ram: 2048,
							vcpus: 2,
							disk: 100,
						},
					],
				},
			});
		});

		it("空のflavorリストを正しくフォーマットできる", async () => {
			const mockBody = {
				flavors: [],
			};
			const mockResponse = createMockResponse(200, "OK", mockBody);

			const result = await formatGetFlavorResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: {
					flavors: [],
				},
			});
		});

		it("一部のフィールドが欠けているflavorデータを正しく処理できる", async () => {
			const mockBody = {
				flavors: [
					{
						id: "1",
						name: "g-1gb",
						ram: 1024,
						// vcpus と disk が欠けている
					},
					{
						// id と name が欠けている
						ram: 2048,
						vcpus: 2,
						disk: 100,
					},
				],
			};
			const mockResponse = createMockResponse(200, "OK", mockBody);

			const result = await formatGetFlavorResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: {
					flavors: [
						{
							id: "1",
							name: "g-1gb",
							ram: 1024,
							vcpus: undefined,
							disk: undefined,
						},
						{
							id: undefined,
							name: undefined,
							ram: 2048,
							vcpus: 2,
							disk: 100,
						},
					],
				},
			});
		});

		it("flavorsプロパティが存在しない場合、元のレスポンスボディをそのまま返す", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			const mockBody = {
				error: "No flavors found",
			};
			const mockResponse = createMockResponse(404, "Not Found", mockBody);

			const result = await formatGetFlavorResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 404,
				statusText: "Not Found",
				body: mockBody,
			});
		});

		it("flavorsが配列でない場合、元のレスポンスボディをそのまま返す", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			const mockBody = {
				flavors: "invalid_data",
			};
			const mockResponse = createMockResponse(200, "OK", mockBody);

			const result = await formatGetFlavorResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: mockBody,
			});
		});

		it("JSONパースエラーが発生した場合、エラーボディを返す", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			const mockResponse = {
				status: 500,
				statusText: "Internal Server Error",
				json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
			} as unknown as Response;

			const result = await formatGetFlavorResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 500,
				statusText: "Internal Server Error",
				body: "<error>",
			});
		});

		it("さまざまなHTTPステータスコードで正しくフォーマットできる", async () => {
			const testCases = [
				{ status: 201, statusText: "Created" },
				{ status: 400, statusText: "Bad Request" },
				{ status: 401, statusText: "Unauthorized" },
				{ status: 403, statusText: "Forbidden" },
				{ status: 500, statusText: "Internal Server Error" },
			];

			for (const testCase of testCases) {
				const mockBody = {
					flavors: [
						{
							id: "test",
							name: "test-flavor",
							ram: 512,
							vcpus: 1,
							disk: 50,
						},
					],
				};
				const mockResponse = createMockResponse(
					testCase.status,
					testCase.statusText,
					mockBody,
				);

				const result = await formatGetFlavorResponse(mockResponse);
				const parsed = JSON.parse(result);

				expect(parsed.status).toBe(testCase.status);
				expect(parsed.statusText).toBe(testCase.statusText);
				expect(parsed.body).toEqual(mockBody);
			}
		});

		it("nullやundefined値を含むflavorデータを正しく処理できる", async () => {
			const mockBody = {
				flavors: [
					{
						id: null,
						name: undefined,
						ram: 0,
						vcpus: null,
						disk: undefined,
					},
				],
			};
			const mockResponse = createMockResponse(200, "OK", mockBody);

			const result = await formatGetFlavorResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: {
					flavors: [
						{
							id: null,
							name: undefined,
							ram: 0,
							vcpus: null,
							disk: undefined,
						},
					],
				},
			});
		});

		it("大量のflavorデータを正しく処理できる", async () => {
			const largeFlavors = Array.from({ length: 100 }, (_, i) => ({
				id: `flavor-${i}`,
				name: `g-${i}gb`,
				ram: 1024 * (i + 1),
				vcpus: i + 1,
				disk: 100 + i * 10,
				extra_data: `extra-${i}`,
			}));

			const mockBody = {
				flavors: largeFlavors,
			};
			const mockResponse = createMockResponse(200, "OK", mockBody);

			const result = await formatGetFlavorResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed.status).toBe(200);
			expect(parsed.statusText).toBe("OK");
			expect(parsed.body.flavors).toHaveLength(100);
			expect(parsed.body.flavors[0]).toEqual({
				id: "flavor-0",
				name: "g-0gb",
				ram: 1024,
				vcpus: 1,
				disk: 100,
			});
			// extra_dataが除外されていることを確認
			expect(parsed.body.flavors[0]).not.toHaveProperty("extra_data");
		});

		it("bodyがnullの場合、元のレスポンスボディをそのまま返す", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			const mockResponse = createMockResponse(204, "No Content", null);

			const result = await formatGetFlavorResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 204,
				statusText: "No Content",
				body: null,
			});
		});
	});
});
