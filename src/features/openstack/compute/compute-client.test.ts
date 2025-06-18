import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createCompute,
	createComputeById,
	deleteComputeById,
	getCompute,
	getComputeById,
} from "./compute-client";

// executeOpenstackApi のモック
vi.mock("../common/openstack-client", () => ({
	executeOpenstackApi: vi.fn(),
}));

// モック関数の型定義
const mockExecuteOpenstackApi = vi.mocked(
	await import("../common/openstack-client"),
).executeOpenstackApi;

describe("compute-client", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const expectedBaseUrl = "https://compute.c3j1.conoha.io/v2.1";

	describe("getCompute", () => {
		const mockResponse = JSON.stringify({
			status: 200,
			statusText: "OK",
			body: {
				servers: [
					{
						id: "server-id-123",
						name: "test-server",
						status: "ACTIVE",
						flavor: { id: "flavor-1" },
					},
				],
			},
		});

		beforeEach(() => {
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);
		});

		it("サーバー一覧取得のAPIを正しく呼び出す", async () => {
			const path = "/servers";

			const result = await getCompute(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledTimes(1);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/servers",
			);
		});

		it("フレーバー一覧取得のAPIを正しく呼び出す", async () => {
			const path = "/flavors";

			const result = await getCompute(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/flavors",
			);
		});

		it("クエリパラメータ付きのパスで正しく呼び出す", async () => {
			const path = "/servers?limit=10&status=ACTIVE";

			const result = await getCompute(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/servers?limit=10&status=ACTIVE",
			);
		});

		it("パスの先頭にスラッシュがない場合も正しく処理する", async () => {
			const path = "servers";

			const result = await getCompute(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"servers",
			);
		});

		it("空のパスでも正しく処理する", async () => {
			const path = "";

			const result = await getCompute(path);

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
				const path = "/servers";

				await expect(getCompute(path)).rejects.toThrow("Network error");
				expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
					"GET",
					expectedBaseUrl,
					"/servers",
				);
			});
		});
	});

	describe("getComputeById", () => {
		const mockResponse = JSON.stringify({
			status: 200,
			statusText: "OK",
			body: {
				server: {
					id: "server-id-123",
					name: "test-server",
					status: "ACTIVE",
					flavor: { id: "flavor-1" },
				},
			},
		});

		beforeEach(() => {
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);
		});

		it("特定のサーバー取得のAPIを正しく呼び出す", async () => {
			const path = "";
			const id = "server-id-123";

			const result = await getComputeById(path, id);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledTimes(1);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/servers/server-id-123",
			);
		});

		it("サーバーの詳細情報取得のAPIを正しく呼び出す", async () => {
			const path = "/detail";
			const id = "server-id-123";

			const result = await getComputeById(path, id);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/servers/server-id-123/detail",
			);
		});

		it("サーバーのアクション履歴取得のAPIを正しく呼び出す", async () => {
			const path = "/os-instance-actions";
			const id = "server-id-123";

			const result = await getComputeById(path, id);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/servers/server-id-123/os-instance-actions",
			);
		});

		it("異なるIDでも正しく呼び出す", async () => {
			const path = "";
			const id = "another-server-id";

			const result = await getComputeById(path, id);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/servers/another-server-id",
			);
		});

		describe("エラーハンドリング", () => {
			it("executeOpenstackApiが例外を投げた場合はそのまま例外を投げる", async () => {
				const error = new Error("Server not found");
				mockExecuteOpenstackApi.mockRejectedValue(error);
				const path = "";
				const id = "server-id-123";

				await expect(getComputeById(path, id)).rejects.toThrow(
					"Server not found",
				);
				expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
					"GET",
					expectedBaseUrl,
					"/servers/server-id-123",
				);
			});
		});
	});

	describe("createCompute", () => {
		const mockResponse = JSON.stringify({
			status: 202,
			statusText: "Accepted",
			body: {
				server: {
					id: "new-server-id",
					name: "new-server",
					status: "BUILD",
					flavor: { id: "flavor-1" },
				},
			},
		});

		const mockRequestBody = {
			server: {
				name: "new-server",
				imageRef: "image-id-123",
				flavorRef: "flavor-1",
				networks: [{ uuid: "network-id-123" }],
			},
		};

		beforeEach(() => {
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);
		});

		it("サーバー作成のAPIを正しく呼び出す", async () => {
			const path = "/servers";

			const result = await createCompute(path, mockRequestBody);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledTimes(1);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"POST",
				expectedBaseUrl,
				"/servers",
				mockRequestBody,
			);
		});

		it("キーペア作成のAPIを正しく呼び出す", async () => {
			const path = "/os-keypairs";
			const keypairBody = {
				keypair: {
					name: "test-keypair",
					public_key: "ssh-rsa AAAAB3...",
				},
			};

			const result = await createCompute(path, keypairBody);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"POST",
				expectedBaseUrl,
				"/os-keypairs",
				keypairBody,
			);
		});

		describe("エラーハンドリング", () => {
			it("executeOpenstackApiが例外を投げた場合はそのまま例外を投げる", async () => {
				const error = new Error("Creation failed");
				mockExecuteOpenstackApi.mockRejectedValue(error);
				const path = "/servers";

				await expect(createCompute(path, mockRequestBody)).rejects.toThrow(
					"Creation failed",
				);
				expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
					"POST",
					expectedBaseUrl,
					"/servers",
					mockRequestBody,
				);
			});
		});
	});

	describe("createComputeById", () => {
		const mockResponse = JSON.stringify({
			status: 202,
			statusText: "Accepted",
			body: {
				message: "Action performed successfully",
			},
		});

		const mockRequestBody = {
			reboot: {
				type: "SOFT",
			},
		};

		beforeEach(() => {
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);
		});

		it("サーバーアクション実行のAPIを正しく呼び出す", async () => {
			const path = "/action";
			const id = "server-id-123";

			const result = await createComputeById(path, id, mockRequestBody);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledTimes(1);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"POST",
				expectedBaseUrl,
				"/servers/server-id-123/action",
				mockRequestBody,
			);
		});

		it("サーバーリブートのAPIを正しく呼び出す", async () => {
			const path = "/action";
			const id = "server-id-123";
			const rebootBody = {
				reboot: {
					type: "HARD",
				},
			};

			const result = await createComputeById(path, id, rebootBody);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"POST",
				expectedBaseUrl,
				"/servers/server-id-123/action",
				rebootBody,
			);
		});

		it("異なるIDでも正しく呼び出す", async () => {
			const path = "/action";
			const id = "another-server-id";

			const result = await createComputeById(path, id, mockRequestBody);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"POST",
				expectedBaseUrl,
				"/servers/another-server-id/action",
				mockRequestBody,
			);
		});

		describe("エラーハンドリング", () => {
			it("executeOpenstackApiが例外を投げた場合はそのまま例外を投げる", async () => {
				const error = new Error("Action failed");
				mockExecuteOpenstackApi.mockRejectedValue(error);
				const path = "/action";
				const id = "server-id-123";

				await expect(
					createComputeById(path, id, mockRequestBody),
				).rejects.toThrow("Action failed");
				expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
					"POST",
					expectedBaseUrl,
					"/servers/server-id-123/action",
					mockRequestBody,
				);
			});
		});
	});

	describe("deleteComputeById", () => {
		const mockResponse = "";

		beforeEach(() => {
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);
		});

		it("サーバー削除のAPIを正しく呼び出す", async () => {
			const path = "/servers";
			const id = "server-id-123";

			const result = await deleteComputeById(path, id);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledTimes(1);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"DELETE",
				expectedBaseUrl,
				"/servers/server-id-123",
			);
		});

		it("キーペア削除のAPIを正しく呼び出す", async () => {
			const path = "/os-keypairs";
			const id = "keypair-name";

			const result = await deleteComputeById(path, id);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"DELETE",
				expectedBaseUrl,
				"/os-keypairs/keypair-name",
			);
		});

		it("異なるIDでも正しく呼び出す", async () => {
			const path = "/servers";
			const id = "another-server-id";

			const result = await deleteComputeById(path, id);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"DELETE",
				expectedBaseUrl,
				"/servers/another-server-id",
			);
		});

		describe("エラーハンドリング", () => {
			it("executeOpenstackApiが例外を投げた場合はそのまま例外を投げる", async () => {
				const error = new Error("Delete failed");
				mockExecuteOpenstackApi.mockRejectedValue(error);
				const path = "/servers";
				const id = "server-id-123";

				await expect(deleteComputeById(path, id)).rejects.toThrow(
					"Delete failed",
				);
				expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
					"DELETE",
					expectedBaseUrl,
					"/servers/server-id-123",
				);
			});
		});
	});

	describe("レスポンスの型", () => {
		it("文字列レスポンスを正しく返す", async () => {
			const stringResponse = "simple string response";
			mockExecuteOpenstackApi.mockResolvedValue(stringResponse);
			const path = "/servers";

			const result = await getCompute(path);

			expect(result).toBe(stringResponse);
			expect(typeof result).toBe("string");
		});

		it("JSONレスポンスを文字列として返す", async () => {
			const jsonResponse = JSON.stringify({
				servers: [{ id: "test", name: "test-server" }],
			});
			mockExecuteOpenstackApi.mockResolvedValue(jsonResponse);
			const path = "/servers";

			const result = await getCompute(path);

			expect(result).toBe(jsonResponse);
			expect(typeof result).toBe("string");
		});
	});

	describe("パフォーマンス", () => {
		it("大量のサーバーデータでも正しく処理する", async () => {
			const largeResponse = JSON.stringify({
				servers: Array.from({ length: 1000 }, (_, i) => ({
					id: `server-${i}`,
					name: `test-server-${i}`,
					status: "ACTIVE",
					flavor: { id: "flavor-1" },
				})),
			});
			mockExecuteOpenstackApi.mockResolvedValue(largeResponse);
			const path = "/servers?limit=1000";

			const result = await getCompute(path);

			expect(result).toBe(largeResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/servers?limit=1000",
			);
		});

		it("非常に長いパスでも正しく処理する", async () => {
			const longPath = `/servers/${"very-long-id-".repeat(100)}123`;
			const mockResponse = JSON.stringify({ server: { id: "test" } });
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);

			const result = await getCompute(longPath);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				longPath,
			);
		});
	});

	describe("パス結合のテスト", () => {
		it("getComputeByIdでパスが正しく結合される", async () => {
			const mockResponse = JSON.stringify({ server: { id: "test" } });
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);

			const path = "/detail";
			const id = "server-123";

			await getComputeById(path, id);

			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/servers/server-123/detail",
			);
		});

		it("createComputeByIdでパスが正しく結合される", async () => {
			const mockResponse = JSON.stringify({ message: "OK" });
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);

			const path = "/action";
			const id = "server-123";
			const requestBody = { reboot: { type: "SOFT" } };

			await createComputeById(path, id, requestBody);

			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"POST",
				expectedBaseUrl,
				"/servers/server-123/action",
				requestBody,
			);
		});

		it("deleteComputeByIdでパスが正しく結合される", async () => {
			const mockResponse = "";
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);

			const path = "/servers";
			const id = "server-123";

			await deleteComputeById(path, id);

			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"DELETE",
				expectedBaseUrl,
				"/servers/server-123",
			);
		});
	});
});
