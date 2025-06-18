import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createNetwork,
	deleteNetworkById,
	getNetwork,
	getNetworkById,
	updateNetworkById,
} from "./network-client";

// executeOpenstackApi のモック
vi.mock("../common/openstack-client", () => ({
	executeOpenstackApi: vi.fn(),
}));

// モック関数の型定義
const mockExecuteOpenstackApi = vi.mocked(
	await import("../common/openstack-client"),
).executeOpenstackApi;

describe("network-client", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const expectedBaseUrl = "https://networking.c3j1.conoha.io";

	describe("getNetwork", () => {
		const mockResponse = JSON.stringify({
			status: 200,
			statusText: "OK",
			body: {
				networks: [
					{
						id: "network-id-123",
						name: "test-network",
						status: "ACTIVE",
						admin_state_up: true,
					},
				],
			},
		});

		beforeEach(() => {
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);
		});

		it("ネットワーク一覧取得のAPIを正しく呼び出す", async () => {
			const path = "/v2.0/networks";

			const result = await getNetwork(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledTimes(1);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/v2.0/networks",
			);
		});

		it("サブネット一覧取得のAPIを正しく呼び出す", async () => {
			const path = "/v2.0/subnets";

			const result = await getNetwork(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/v2.0/subnets",
			);
		});

		it("ポート一覧取得のAPIを正しく呼び出す", async () => {
			const path = "/v2.0/ports";

			const result = await getNetwork(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/v2.0/ports",
			);
		});

		it("クエリパラメータ付きのパスで正しく呼び出す", async () => {
			const path = "/v2.0/networks?limit=10&status=ACTIVE";

			const result = await getNetwork(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/v2.0/networks?limit=10&status=ACTIVE",
			);
		});

		it("パスの先頭にスラッシュがない場合も正しく処理する", async () => {
			const path = "v2.0/networks";

			const result = await getNetwork(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"v2.0/networks",
			);
		});

		it("空のパスでも正しく処理する", async () => {
			const path = "";

			const result = await getNetwork(path);

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
				const path = "/v2.0/networks";

				await expect(getNetwork(path)).rejects.toThrow("Network error");
				expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
					"GET",
					expectedBaseUrl,
					"/v2.0/networks",
				);
			});
		});
	});

	describe("getNetworkById", () => {
		const mockResponse = JSON.stringify({
			status: 200,
			statusText: "OK",
			body: {
				network: {
					id: "network-id-123",
					name: "test-network",
					status: "ACTIVE",
					admin_state_up: true,
				},
			},
		});

		beforeEach(() => {
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);
		});

		it("特定のネットワーク取得のAPIを正しく呼び出す", async () => {
			const path = "/v2.0/networks";
			const id = "network-id-123";

			const result = await getNetworkById(path, id);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledTimes(1);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/v2.0/networks/network-id-123",
			);
		});

		it("特定のサブネット取得のAPIを正しく呼び出す", async () => {
			const path = "/v2.0/subnets";
			const id = "subnet-id-123";

			const result = await getNetworkById(path, id);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/v2.0/subnets/subnet-id-123",
			);
		});

		it("特定のポート取得のAPIを正しく呼び出す", async () => {
			const path = "/v2.0/ports";
			const id = "port-id-123";

			const result = await getNetworkById(path, id);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/v2.0/ports/port-id-123",
			);
		});

		it("異なるIDでも正しく呼び出す", async () => {
			const path = "/v2.0/networks";
			const id = "another-network-id";

			const result = await getNetworkById(path, id);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/v2.0/networks/another-network-id",
			);
		});

		describe("エラーハンドリング", () => {
			it("executeOpenstackApiが例外を投げた場合はそのまま例外を投げる", async () => {
				const error = new Error("Network not found");
				mockExecuteOpenstackApi.mockRejectedValue(error);
				const path = "/v2.0/networks";
				const id = "network-id-123";

				await expect(getNetworkById(path, id)).rejects.toThrow(
					"Network not found",
				);
				expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
					"GET",
					expectedBaseUrl,
					"/v2.0/networks/network-id-123",
				);
			});
		});
	});

	describe("createNetwork", () => {
		const mockResponse = JSON.stringify({
			status: 201,
			statusText: "Created",
			body: {
				network: {
					id: "new-network-id",
					name: "new-network",
					status: "ACTIVE",
					admin_state_up: true,
				},
			},
		});

		const mockRequestBody = {
			network: {
				name: "new-network",
				admin_state_up: true,
				shared: false,
			},
		};

		beforeEach(() => {
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);
		});

		it("ネットワーク作成のAPIを正しく呼び出す", async () => {
			const path = "/v2.0/networks";

			const result = await createNetwork(path, mockRequestBody);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledTimes(1);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"POST",
				expectedBaseUrl,
				"/v2.0/networks",
				mockRequestBody,
			);
		});

		it("サブネット作成のAPIを正しく呼び出す", async () => {
			const path = "/v2.0/subnets";
			const subnetBody = {
				subnet: {
					name: "new-subnet",
					network_id: "network-id-123",
					ip_version: 4,
					cidr: "192.168.1.0/24",
				},
			};

			const result = await createNetwork(path, subnetBody);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"POST",
				expectedBaseUrl,
				"/v2.0/subnets",
				subnetBody,
			);
		});

		it("ポート作成のAPIを正しく呼び出す", async () => {
			const path = "/v2.0/ports";
			const portBody = {
				port: {
					name: "new-port",
					network_id: "network-id-123",
					admin_state_up: true,
				},
			};

			const result = await createNetwork(path, portBody);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"POST",
				expectedBaseUrl,
				"/v2.0/ports",
				portBody,
			);
		});

		describe("エラーハンドリング", () => {
			it("executeOpenstackApiが例外を投げた場合はそのまま例外を投げる", async () => {
				const error = new Error("Creation failed");
				mockExecuteOpenstackApi.mockRejectedValue(error);
				const path = "/v2.0/networks";

				await expect(createNetwork(path, mockRequestBody)).rejects.toThrow(
					"Creation failed",
				);
				expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
					"POST",
					expectedBaseUrl,
					"/v2.0/networks",
					mockRequestBody,
				);
			});
		});
	});

	describe("updateNetworkById", () => {
		const mockResponse = JSON.stringify({
			status: 200,
			statusText: "OK",
			body: {
				network: {
					id: "network-id-123",
					name: "updated-network",
					status: "ACTIVE",
					admin_state_up: true,
				},
			},
		});

		const mockRequestBody = {
			network: {
				name: "updated-network",
				admin_state_up: false,
			},
		};

		beforeEach(() => {
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);
		});

		it("ネットワーク更新のAPIを正しく呼び出す", async () => {
			const path = "/v2.0/networks";
			const id = "network-id-123";

			const result = await updateNetworkById(path, id, mockRequestBody);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledTimes(1);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"PUT",
				expectedBaseUrl,
				"/v2.0/networks/network-id-123",
				mockRequestBody,
			);
		});

		it("サブネット更新のAPIを正しく呼び出す", async () => {
			const path = "/v2.0/subnets";
			const id = "subnet-id-123";
			const subnetBody = {
				subnet: {
					name: "updated-subnet",
					dns_nameservers: ["8.8.8.8", "8.8.4.4"],
				},
			};

			const result = await updateNetworkById(path, id, subnetBody);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"PUT",
				expectedBaseUrl,
				"/v2.0/subnets/subnet-id-123",
				subnetBody,
			);
		});

		it("ポート更新のAPIを正しく呼び出す", async () => {
			const path = "/v2.0/ports";
			const id = "port-id-123";
			const portBody = {
				port: {
					name: "updated-port",
					admin_state_up: false,
				},
			};

			const result = await updateNetworkById(path, id, portBody);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"PUT",
				expectedBaseUrl,
				"/v2.0/ports/port-id-123",
				portBody,
			);
		});

		it("異なるIDでも正しく呼び出す", async () => {
			const path = "/v2.0/networks";
			const id = "another-network-id";

			const result = await updateNetworkById(path, id, mockRequestBody);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"PUT",
				expectedBaseUrl,
				"/v2.0/networks/another-network-id",
				mockRequestBody,
			);
		});

		describe("エラーハンドリング", () => {
			it("executeOpenstackApiが例外を投げた場合はそのまま例外を投げる", async () => {
				const error = new Error("Update failed");
				mockExecuteOpenstackApi.mockRejectedValue(error);
				const path = "/v2.0/networks";
				const id = "network-id-123";

				await expect(
					updateNetworkById(path, id, mockRequestBody),
				).rejects.toThrow("Update failed");
				expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
					"PUT",
					expectedBaseUrl,
					"/v2.0/networks/network-id-123",
					mockRequestBody,
				);
			});
		});
	});

	describe("deleteNetworkById", () => {
		const mockResponse = "";

		beforeEach(() => {
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);
		});

		it("ネットワーク削除のAPIを正しく呼び出す", async () => {
			const path = "/v2.0/networks";
			const id = "network-id-123";

			const result = await deleteNetworkById(path, id);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledTimes(1);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"DELETE",
				expectedBaseUrl,
				"/v2.0/networks/network-id-123",
			);
		});

		it("サブネット削除のAPIを正しく呼び出す", async () => {
			const path = "/v2.0/subnets";
			const id = "subnet-id-123";

			const result = await deleteNetworkById(path, id);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"DELETE",
				expectedBaseUrl,
				"/v2.0/subnets/subnet-id-123",
			);
		});

		it("ポート削除のAPIを正しく呼び出す", async () => {
			const path = "/v2.0/ports";
			const id = "port-id-123";

			const result = await deleteNetworkById(path, id);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"DELETE",
				expectedBaseUrl,
				"/v2.0/ports/port-id-123",
			);
		});

		it("異なるIDでも正しく呼び出す", async () => {
			const path = "/v2.0/networks";
			const id = "another-network-id";

			const result = await deleteNetworkById(path, id);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"DELETE",
				expectedBaseUrl,
				"/v2.0/networks/another-network-id",
			);
		});

		describe("エラーハンドリング", () => {
			it("executeOpenstackApiが例外を投げた場合はそのまま例外を投げる", async () => {
				const error = new Error("Delete failed");
				mockExecuteOpenstackApi.mockRejectedValue(error);
				const path = "/v2.0/networks";
				const id = "network-id-123";

				await expect(deleteNetworkById(path, id)).rejects.toThrow(
					"Delete failed",
				);
				expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
					"DELETE",
					expectedBaseUrl,
					"/v2.0/networks/network-id-123",
				);
			});
		});
	});

	describe("レスポンスの型", () => {
		it("文字列レスポンスを正しく返す", async () => {
			const stringResponse = "simple string response";
			mockExecuteOpenstackApi.mockResolvedValue(stringResponse);
			const path = "/v2.0/networks";

			const result = await getNetwork(path);

			expect(result).toBe(stringResponse);
			expect(typeof result).toBe("string");
		});

		it("JSONレスポンスを文字列として返す", async () => {
			const jsonResponse = JSON.stringify({
				networks: [{ id: "test", name: "test-network" }],
			});
			mockExecuteOpenstackApi.mockResolvedValue(jsonResponse);
			const path = "/v2.0/networks";

			const result = await getNetwork(path);

			expect(result).toBe(jsonResponse);
			expect(typeof result).toBe("string");
		});
	});

	describe("パフォーマンス", () => {
		it("大量のネットワークデータでも正しく処理する", async () => {
			const largeResponse = JSON.stringify({
				networks: Array.from({ length: 1000 }, (_, i) => ({
					id: `network-${i}`,
					name: `test-network-${i}`,
					status: "ACTIVE",
					admin_state_up: true,
				})),
			});
			mockExecuteOpenstackApi.mockResolvedValue(largeResponse);
			const path = "/v2.0/networks?limit=1000";

			const result = await getNetwork(path);

			expect(result).toBe(largeResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/v2.0/networks?limit=1000",
			);
		});

		it("非常に長いパスでも正しく処理する", async () => {
			const longPath = `/v2.0/networks/${"very-long-id-".repeat(100)}123`;
			const mockResponse = JSON.stringify({ network: { id: "test" } });
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);

			const result = await getNetwork(longPath);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				longPath,
			);
		});
	});

	describe("パス結合のテスト", () => {
		it("getNetworkByIdでパスが正しく結合される", async () => {
			const mockResponse = JSON.stringify({ network: { id: "test" } });
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);

			const path = "/v2.0/networks";
			const id = "network-123";

			await getNetworkById(path, id);

			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/v2.0/networks/network-123",
			);
		});

		it("updateNetworkByIdでパスが正しく結合される", async () => {
			const mockResponse = JSON.stringify({ network: { id: "test" } });
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);

			const path = "/v2.0/networks";
			const id = "network-123";
			const requestBody = { network: { name: "updated" } };

			await updateNetworkById(path, id, requestBody);

			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"PUT",
				expectedBaseUrl,
				"/v2.0/networks/network-123",
				requestBody,
			);
		});

		it("deleteNetworkByIdでパスが正しく結合される", async () => {
			const mockResponse = "";
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);

			const path = "/v2.0/networks";
			const id = "network-123";

			await deleteNetworkById(path, id);

			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"DELETE",
				expectedBaseUrl,
				"/v2.0/networks/network-123",
			);
		});
	});
});
