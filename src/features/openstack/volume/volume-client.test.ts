import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createVolume,
	deleteVolumeById,
	getVolume,
	updateVolumeById,
} from "./volume-client";

// executeOpenstackApi のモック
vi.mock("../common/openstack-client", () => ({
	executeOpenstackApi: vi.fn(),
}));

// モック関数の型定義
const mockExecuteOpenstackApi = vi.mocked(
	await import("../common/openstack-client"),
).executeOpenstackApi;

describe("volume-client", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// 環境変数を設定
		process.env = { OPENSTACK_TENANT_ID: "test-tenant-id" };
	});

	const expectedBaseUrl = `https://block-storage.c3j1.conoha.io/v3/${process.env.OPENSTACK_TENANT_ID}`;

	describe("getVolume", () => {
		const mockResponse = JSON.stringify({
			status: 200,
			statusText: "OK",
			body: {
				volumes: [
					{
						id: "volume-id-123",
						name: "test-volume",
						status: "available",
						size: 10,
					},
				],
			},
		});

		beforeEach(() => {
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);
		});

		it("ボリューム一覧取得のAPIを正しく呼び出す", async () => {
			const path = "/volumes";

			const result = await getVolume(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledTimes(1);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/volumes",
			);
		});

		it("特定のボリューム取得のAPIを正しく呼び出す", async () => {
			const path = "/volumes/volume-id-123";

			const result = await getVolume(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/volumes/volume-id-123",
			);
		});

		it("クエリパラメータ付きのパスで正しく呼び出す", async () => {
			const path = "/volumes?limit=10&status=available";

			const result = await getVolume(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/volumes?limit=10&status=available",
			);
		});

		it("パスの先頭にスラッシュがない場合も正しく処理する", async () => {
			const path = "volumes";

			const result = await getVolume(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"volumes",
			);
		});

		it("空のパスでも正しく処理する", async () => {
			const path = "";

			const result = await getVolume(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"",
			);
		});

		describe("エラーハンドリング", () => {
			it("executeOpenstackApiが例外を投げた場合はそのまま例外を投げる", async () => {
				const error = new Error("Network error");
				mockExecuteOpenstackApi.mockRejectedValue(error);
				const path = "/volumes";

				await expect(getVolume(path)).rejects.toThrow("Network error");
				expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
					"GET",
					expectedBaseUrl,
					"/volumes",
				);
			});
		});
	});

	describe("createVolume", () => {
		const mockResponse = JSON.stringify({
			status: 201,
			statusText: "Created",
			body: {
				volume: {
					id: "new-volume-id",
					name: "new-volume",
					status: "creating",
					size: 20,
				},
			},
		});

		const mockRequestBody = {
			volume: {
				name: "new-volume",
				size: 20,
				volume_type: "standard",
			},
		};

		beforeEach(() => {
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);
		});

		it("ボリューム作成のAPIを正しく呼び出す", async () => {
			const path = "/volumes";

			const result = await createVolume(path, mockRequestBody);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledTimes(1);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"POST",
				expectedBaseUrl,
				"/volumes",
				mockRequestBody,
			);
		});

		it("異なるパスでも正しく呼び出す", async () => {
			const path = "/volumes/action";

			const result = await createVolume(path, mockRequestBody);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"POST",
				expectedBaseUrl,
				"/volumes/action",
				mockRequestBody,
			);
		});

		describe("エラーハンドリング", () => {
			it("executeOpenstackApiが例外を投げた場合はそのまま例外を投げる", async () => {
				const error = new Error("Creation failed");
				mockExecuteOpenstackApi.mockRejectedValue(error);
				const path = "/volumes";

				await expect(createVolume(path, mockRequestBody)).rejects.toThrow(
					"Creation failed",
				);
				expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
					"POST",
					expectedBaseUrl,
					"/volumes",
					mockRequestBody,
				);
			});
		});
	});

	describe("updateVolumeById", () => {
		const mockResponse = JSON.stringify({
			status: 200,
			statusText: "OK",
			body: {
				volume: {
					id: "volume-id-123",
					name: "updated-volume",
					status: "available",
					size: 10,
				},
			},
		});

		const mockRequestBody = {
			volume: {
				name: "updated-volume",
				description: "Updated description",
			},
		};

		beforeEach(() => {
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);
		});

		it("ボリューム更新のAPIを正しく呼び出す", async () => {
			const path = "/volumes";
			const id = "volume-id-123";

			const result = await updateVolumeById(path, id, mockRequestBody);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledTimes(1);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"PUT",
				expectedBaseUrl,
				"/volumes/volume-id-123",
				mockRequestBody,
			);
		});

		it("異なるIDでも正しく呼び出す", async () => {
			const path = "/volumes";
			const id = "another-volume-id";

			const result = await updateVolumeById(path, id, mockRequestBody);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"PUT",
				expectedBaseUrl,
				"/volumes/another-volume-id",
				mockRequestBody,
			);
		});

		it("パスの末尾にスラッシュがある場合も正しく処理する", async () => {
			const path = "/volumes/";
			const id = "volume-id-123";

			const result = await updateVolumeById(path, id, mockRequestBody);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"PUT",
				expectedBaseUrl,
				"/volumes//volume-id-123",
				mockRequestBody,
			);
		});

		describe("エラーハンドリング", () => {
			it("executeOpenstackApiが例外を投げた場合はそのまま例外を投げる", async () => {
				const error = new Error("Update failed");
				mockExecuteOpenstackApi.mockRejectedValue(error);
				const path = "/volumes";
				const id = "volume-id-123";

				await expect(
					updateVolumeById(path, id, mockRequestBody),
				).rejects.toThrow("Update failed");
				expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
					"PUT",
					expectedBaseUrl,
					"/volumes/volume-id-123",
					mockRequestBody,
				);
			});
		});
	});

	describe("deleteVolumeById", () => {
		const mockResponse = "";

		beforeEach(() => {
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);
		});

		it("ボリューム削除のAPIを正しく呼び出す", async () => {
			const path = "/volumes";
			const id = "volume-id-123";

			const result = await deleteVolumeById(path, id);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledTimes(1);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"DELETE",
				expectedBaseUrl,
				"/volumes/volume-id-123",
			);
		});

		it("異なるIDでも正しく呼び出す", async () => {
			const path = "/volumes";
			const id = "another-volume-id";

			const result = await deleteVolumeById(path, id);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"DELETE",
				expectedBaseUrl,
				"/volumes/another-volume-id",
			);
		});

		it("パスの末尾にスラッシュがある場合も正しく処理する", async () => {
			const path = "/volumes/";
			const id = "volume-id-123";

			const result = await deleteVolumeById(path, id);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"DELETE",
				expectedBaseUrl,
				"/volumes//volume-id-123",
			);
		});

		describe("エラーハンドリング", () => {
			it("executeOpenstackApiが例外を投げた場合はそのまま例外を投げる", async () => {
				const error = new Error("Delete failed");
				mockExecuteOpenstackApi.mockRejectedValue(error);
				const path = "/volumes";
				const id = "volume-id-123";

				await expect(deleteVolumeById(path, id)).rejects.toThrow(
					"Delete failed",
				);
				expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
					"DELETE",
					expectedBaseUrl,
					"/volumes/volume-id-123",
				);
			});
		});
	});

	describe("レスポンスの型", () => {
		it("文字列レスポンスを正しく返す", async () => {
			const stringResponse = "simple string response";
			mockExecuteOpenstackApi.mockResolvedValue(stringResponse);
			const path = "/volumes";

			const result = await getVolume(path);

			expect(result).toBe(stringResponse);
			expect(typeof result).toBe("string");
		});

		it("JSONレスポンスを文字列として返す", async () => {
			const jsonResponse = JSON.stringify({
				volumes: [{ id: "test", name: "test-volume" }],
			});
			mockExecuteOpenstackApi.mockResolvedValue(jsonResponse);
			const path = "/volumes";

			const result = await getVolume(path);

			expect(result).toBe(jsonResponse);
			expect(typeof result).toBe("string");
		});
	});

	describe("パフォーマンス", () => {
		it("大量のボリュームデータでも正しく処理する", async () => {
			const largeResponse = JSON.stringify({
				volumes: Array.from({ length: 1000 }, (_, i) => ({
					id: `volume-${i}`,
					name: `test-volume-${i}`,
					status: "available",
					size: 10,
				})),
			});
			mockExecuteOpenstackApi.mockResolvedValue(largeResponse);
			const path = "/volumes?limit=1000";

			const result = await getVolume(path);

			expect(result).toBe(largeResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/volumes?limit=1000",
			);
		});

		it("非常に長いパスでも正しく処理する", async () => {
			const longPath = `/volumes/${"very-long-id-".repeat(100)}123`;
			const mockResponse = JSON.stringify({ volume: { id: "test" } });
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);

			const result = await getVolume(longPath);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				longPath,
			);
		});
	});
});
