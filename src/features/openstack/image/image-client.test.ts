import { beforeEach, describe, expect, it, vi } from "vitest";
import { getImage } from "./image-client";

// executeOpenstackApi のモック
vi.mock("../common/openstack-client", () => ({
	executeOpenstackApi: vi.fn(),
}));

// モック関数の型定義
const mockExecuteOpenstackApi = vi.mocked(
	await import("../common/openstack-client"),
).executeOpenstackApi;

describe("image-client", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getImage", () => {
		const mockResponse = JSON.stringify({
			status: 200,
			statusText: "OK",
			body: {
				images: [
					{
						id: "image-id-123",
						name: "ubuntu-22.04",
						status: "active",
					},
				],
			},
		});

		beforeEach(() => {
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);
		});

		it("Image API（/v2/images?limit=200）へのGETリクエストで画像一覧レスポンスを受け取った場合に、正しいURL（https://image-service.c3j1.conoha.io）とパス（/v2/images?limit=200）でモックAPIを呼び出し、API呼び出しパラメータ（'GET', 'https://image-service.c3j1.conoha.io', '/v2/images?limit=200'）が正しく引き渡されることを確認し、モックレスポンス（'{status: 200, statusText: 'OK', body: {images: [...]}}'）と一致する文字列を戻り値として返すことができる", async () => {
			const path = "/v2/images?limit=200";

			const result = await getImage(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledTimes(1);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				"https://image-service.c3j1.conoha.io",
				"/v2/images?limit=200",
			);
		});

		it("Image API（/v2/images/image-id-123）への特定の画像ID（image-id-123）指定GETリクエストで個別画像レスポンスを受け取った場合に、正しいURL（https://image-service.c3j1.conoha.io）とパス（/v2/images/image-id-123）でモックAPIを呼び出し、API呼び出しパラメータ（'GET', 'https://image-service.c3j1.conoha.io', '/v2/images/image-id-123'）が正しく引き渡されることを確認し、モックレスポンスと一致する文字列を戻り値として返すことができる", async () => {
			const path = "/v2/images/image-id-123";

			const result = await getImage(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				"https://image-service.c3j1.conoha.io",
				"/v2/images/image-id-123",
			);
		});

		it("Image API（/v2/images?limit=200）へのGETリクエストでクエリパラメータ付き画像一覧レスポンスを受け取った場合に、クエリパラメータを含む正しいパス（/v2/images?limit=200）でモックAPIを呼び出し、API呼び出しパラメータ（'GET', 'https://image-service.c3j1.conoha.io', '/v2/images?limit=200'）が正しく引き渡されることを確認し、モックレスポンスと一致する文字列を戻り値として返すことができる", async () => {
			const path = "/v2/images?limit=200";

			const result = await getImage(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				"https://image-service.c3j1.conoha.io",
				"/v2/images?limit=200",
			);
		});

		it("Image API（v2/images?limit=200）への先頭スラッシュなしパス指定でGETリクエストした場合に、パス文字列（v2/images?limit=200）をそのままモックAPIに渡してリクエストし、API呼び出しパラメータ（'GET', 'https://image-service.c3j1.conoha.io', 'v2/images?limit=200'）が正しく引き渡されることを確認し、モックレスポンスと一致する文字列を戻り値として返すことができる", async () => {
			const path = "v2/images?limit=200";

			const result = await getImage(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				"https://image-service.c3j1.conoha.io",
				"v2/images?limit=200",
			);
		});

		it("Image APIへの空文字列パス指定でGETリクエストした場合に、空文字列パス（''）をそのまま正しいURL（https://image-service.c3j1.conoha.io）とともにモックAPIに渡してリクエストし、API呼び出しパラメータ（'GET', 'https://image-service.c3j1.conoha.io', ''）が正しく引き渡されることを確認し、モックレスポンスと一致する文字列を戻り値として返すことができる", async () => {
			const path = "";

			const result = await getImage(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				"https://image-service.c3j1.conoha.io",
				"",
			);
		});

		describe("エラーハンドリング", () => {
			it("モックAPIがネットワークエラー例外を投げた場合に、API呼び出しパラメータ（'GET', 'https://image-service.c3j1.conoha.io', '/v2/images?limit=200'）でリクエストは送信されるがgetImageから同じエラーメッセージ（Network error）の例外が投げられること", async () => {
				const error = new Error("Network error");
				mockExecuteOpenstackApi.mockRejectedValue(error);
				const path = "/v2/images?limit=200";

				await expect(getImage(path)).rejects.toThrow("Network error");
				expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
					"GET",
					"https://image-service.c3j1.conoha.io",
					"/v2/images?limit=200",
				);
			});
		});

		describe("レスポンスの型", () => {
			it("getImageが単純な文字列レスポンス（'simple string response'）を受け取った場合に、モックAPIから返された文字列と一致する戻り値を返し、TypeScriptの型システムで文字列型として正しく型付けされること", async () => {
				const stringResponse = "simple string response";
				mockExecuteOpenstackApi.mockResolvedValue(stringResponse);
				const path = "/v2/images?limit=200";

				const result = await getImage(path);

				expect(result).toBe(stringResponse);
				expect(typeof result).toBe("string");
			});

			it("getImageがJSON形式の画像一覧レスポンス（{images: [{id: 'test', name: 'test-image'}]}）を文字列として受け取った場合に、モックAPIから返されたJSON文字列と一致する戻り値を返し、TypeScriptの型システムで文字列型として正しく型付けされること", async () => {
				const jsonResponse = JSON.stringify({
					images: [{ id: "test", name: "test-image" }],
				});
				mockExecuteOpenstackApi.mockResolvedValue(jsonResponse);
				const path = "/v2/images?limit=200";

				const result = await getImage(path);

				expect(result).toBe(jsonResponse);
				expect(typeof result).toBe("string");
			});
		});

		describe("パフォーマンス", () => {
			it("getImageが非常に長いパス（100回繰り返された'very-long-id-'を含むパス）を処理する場合に、パス長の制限なく正しい長いパス（/v2/images/very-long-id-...123）でモックAPIを呼び出し、API呼び出しパラメータ（'GET', 'https://image-service.c3j1.conoha.io', longPath）が正しく引き渡されることを確認し、モックレスポンスと一致する戻り値を返すことができる", async () => {
				const longPath = `/v2/images/${"very-long-id-".repeat(100)}123?limit=200`;
				mockExecuteOpenstackApi.mockResolvedValue(mockResponse);

				const result = await getImage(longPath);

				expect(result).toBe(mockResponse);
				expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
					"GET",
					"https://image-service.c3j1.conoha.io",
					longPath,
				);
			});
		});
	});
});
