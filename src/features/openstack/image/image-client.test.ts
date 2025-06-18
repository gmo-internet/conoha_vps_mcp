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

		it("画像一覧取得のAPIを正しく呼び出す", async () => {
			const path = "/v2/images";

			const result = await getImage(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledTimes(1);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				"https://image-service.c3j1.conoha.io",
				"/v2/images",
			);
		});

		it("特定の画像取得のAPIを正しく呼び出す", async () => {
			const path = "/v2/images/image-id-123";

			const result = await getImage(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				"https://image-service.c3j1.conoha.io",
				"/v2/images/image-id-123",
			);
		});

		it("クエリパラメータ付きのパスで正しく呼び出す", async () => {
			const path = "/v2/images?limit=10&status=active";

			const result = await getImage(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				"https://image-service.c3j1.conoha.io",
				"/v2/images?limit=10&status=active",
			);
		});

		it("パスの先頭にスラッシュがない場合も正しく処理する", async () => {
			const path = "v2/images";

			const result = await getImage(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				"https://image-service.c3j1.conoha.io",
				"v2/images",
			);
		});

		it("空のパスでも正しく処理する", async () => {
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
			it("executeOpenstackApiが例外を投げた場合はそのまま例外を投げる", async () => {
				const error = new Error("Network error");
				mockExecuteOpenstackApi.mockRejectedValue(error);
				const path = "/v2/images";

				await expect(getImage(path)).rejects.toThrow("Network error");
				expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
					"GET",
					"https://image-service.c3j1.conoha.io",
					"/v2/images",
				);
			});
		});

		describe("レスポンスの型", () => {
			it("文字列レスポンスを正しく返す", async () => {
				const stringResponse = "simple string response";
				mockExecuteOpenstackApi.mockResolvedValue(stringResponse);
				const path = "/v2/images";

				const result = await getImage(path);

				expect(result).toBe(stringResponse);
				expect(typeof result).toBe("string");
			});

			it("JSONレスポンスを文字列として返す", async () => {
				const jsonResponse = JSON.stringify({
					images: [{ id: "test", name: "test-image" }],
				});
				mockExecuteOpenstackApi.mockResolvedValue(jsonResponse);
				const path = "/v2/images";

				const result = await getImage(path);

				expect(result).toBe(jsonResponse);
				expect(typeof result).toBe("string");
			});
		});

		describe("パフォーマンス", () => {
			it("大量の画像データでも正しく処理する", async () => {
				const largeResponse = JSON.stringify({
					images: Array.from({ length: 1000 }, (_, i) => ({
						id: `image-${i}`,
						name: `test-image-${i}`,
						status: "active",
					})),
				});
				mockExecuteOpenstackApi.mockResolvedValue(largeResponse);
				const path = "/v2/images?limit=1000";

				const result = await getImage(path);

				expect(result).toBe(largeResponse);
				expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
					"GET",
					"https://image-service.c3j1.conoha.io",
					"/v2/images?limit=1000",
				);
			});

			it("非常に長いパスでも正しく処理する", async () => {
				const longPath = `/v2/images/${"very-long-id-".repeat(100)}123`;
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
