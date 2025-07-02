import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createNetwork,
	deleteNetworkByParam,
	getNetwork,
	getNetworkByParam,
	updateNetworkByParam,
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
				port: [
					{
						id: "port-id-123",
						name: "test-port",
						status: "ACTIVE",
						admin_state_up: true,
						security_groups: ["security-group-id-1"],
					},
				],
			},
		});

		beforeEach(() => {
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);
		});

		it("Network API（/v2.0/ports）へのGETリクエストでポート一覧レスポンスを受け取った場合に、正しいURL（https://networking.c3j1.conoha.io）とパス（/v2.0/ports）でモックAPIを呼び出し、API呼び出しパラメータ（'GET', expectedBaseUrl, '/v2.0/ports'）が正しく引き渡されることを確認し、モックレスポンスと一致する文字列を戻り値として返すことができる", async () => {
			const path = "/v2.0/ports";

			const result = await getNetwork(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/v2.0/ports",
			);
		});

		it("パスの先頭にスラッシュがない場合も正しく処理する", async () => {
			const path = "v2.0/ports";

			const result = await getNetwork(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"v2.0/ports",
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
			it("Network API（/v2.0/ports）へのGETリクエストでexecuteOpenstackApi実行時に例外（Ports list retrieval failed）が発生した場合に、API呼び出しパラメータ（'GET', expectedBaseUrl, '/v2.0/ports'）を正しく引き渡した上で、同じエラーメッセージ（Ports list retrieval failed）の例外を発生させることができる", async () => {
				const error = new Error("Ports list retrieval failed");
				mockExecuteOpenstackApi.mockRejectedValue(error);
				const path = "/v2.0/ports";

				await expect(getNetwork(path)).rejects.toThrow(
					"Ports list retrieval failed",
				);
				expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
					"GET",
					expectedBaseUrl,
					"/v2.0/ports",
				);
			});
		});
	});

	describe("getNetworkByParam", () => {
		const mockResponse = JSON.stringify({
			status: 200,
			statusText: "OK",
			body: {
				ports: [
					{
						id: "port-id-123",
						name: "test-port",
						status: "ACTIVE",
						admin_state_up: true,
					},
				],
			},
		});

		beforeEach(() => {
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);
		});

		it("Network API（/v2.0/ports/{id}）へのGETリクエストで特定のポート（port-id-123）レスポンスを受け取った場合に、正しいURL（https://networking.c3j1.conoha.io）とパス（/v2.0/ports/port-id-123）でモックAPIを呼び出し、API呼び出しパラメータ（'GET', expectedBaseUrl, '/v2.0/ports/port-id-123'）が正しく引き渡されることを確認し、モックレスポンスと一致する文字列を戻り値として返すことができる", async () => {
			const path = "/v2.0/ports";
			const param = "port-id-123";

			const result = await getNetworkByParam(path, param);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/v2.0/ports/port-id-123",
			);
		});

		it("Network API（/v2.0/ports/{id}）へのGETリクエストで異なるポートID（another-port-id）を指定してポート詳細を取得する場合に、正しいURL（https://networking.c3j1.conoha.io）とパス（/v2.0/ports/another-port-id）でモックAPIを呼び出し、API呼び出しパラメータ（'GET', expectedBaseUrl, '/v2.0/ports/another-port-id'）が正しく引き渡されることを確認し、モックレスポンスと一致する戻り値を返すことができる", async () => {
			const path = "/v2.0/ports";
			const param = "another-port-id";

			const result = await getNetworkByParam(path, param);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/v2.0/ports/another-port-id",
			);
		});

		describe("エラーハンドリング", () => {
			it("Network API（/v2.0/ports/{id}）へのGETリクエストでexecuteOpenstackApi実行時に例外（Port not found）が発生した場合に、API呼び出しパラメータ（'GET', expectedBaseUrl, '/v2.0/ports/port-id-123'）を正しく引き渡した上で、同じエラーメッセージ（Port not found）の例外を発生させることができる", async () => {
				const error = new Error("Port not found");
				mockExecuteOpenstackApi.mockRejectedValue(error);
				const path = "/v2.0/ports";
				const param = "port-id-123";

				await expect(getNetworkByParam(path, param)).rejects.toThrow(
					"Port not found",
				);
				expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
					"GET",
					expectedBaseUrl,
					"/v2.0/ports/port-id-123",
				);
			});
		});
	});

	describe("createPort", () => {
		const mockResponse = JSON.stringify({
			status: 201,
			statusText: "Created",
			body: {
				port: [
					{
						id: "port-id-123",
						name: "test-port",
						status: "DOWN",
						admin_state_up: true,
					},
				],
			},
		});

		const mockRequestBody = {
			port: {
				network_id: "network-id-123",
			},
		};

		beforeEach(() => {
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);
		});

		it("Network API（/v2.0/ports）へのPOSTリクエストでポート作成リクエストボディ（port情報）を送信した場合に、正しいURL（https://networking.c3j1.conoha.io）とパス（/v2.0/ports）でモックAPIを呼び出し、API呼び出しパラメータ（'POST', expectedBaseUrl, '/v2.0/ports', portBody）が正しく引き渡されることを確認し、モックレスポンスと一致する文字列を戻り値として返すことができる", async () => {
			const path = "/v2.0/ports";
			const portBody = {
				port: {
					network_id: "network-id-123",
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
			it("Network API（/v2.0/ports）へのPOSTリクエストでexecuteOpenstackApi実行時に例外（Port creation failed）が発生した場合に、API呼び出しパラメータ（'POST', expectedBaseUrl, '/v2.0/ports', mockRequestBody）を正しく引き渡した上で、同じエラーメッセージ（Port creation failed）の例外を発生させることができる", async () => {
				const error = new Error("Port creation failed");
				mockExecuteOpenstackApi.mockRejectedValue(error);
				const path = "/v2.0/ports";

				await expect(createNetwork(path, mockRequestBody)).rejects.toThrow(
					"Port creation failed",
				);
				expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
					"POST",
					expectedBaseUrl,
					"/v2.0/ports",
					mockRequestBody,
				);
			});
		});
	});

	describe("updateNetworkByParam", () => {
		const mockResponse = JSON.stringify({
			status: 200,
			statusText: "OK",
			body: {
				port: [
					{
						id: "port-id-123",
						name: "test-port",
						status: "DOWN",
						admin_state_up: true,
					},
				],
			},
		});

		const mockRequestBody = {
			port: {
				security_groups: ["security-group-id-1"],
			},
		};

		beforeEach(() => {
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);
		});

		it("Network API（/v2.0/ports/{id}）へのPUTリクエストで特定のポート（port-id-123）を更新するリクエストボディ（port情報）を送信した場合に、正しいURL（https://networking.c3j1.conoha.io）とパス（/v2.0/ports/port-id-123）でモックAPIを呼び出し、API呼び出しパラメータ（'PUT', expectedBaseUrl, '/v2.0/ports/port-id-123', portBody）が正しく引き渡されることを確認し、モックレスポンスと一致する文字列を戻り値として返すことができる", async () => {
			const path = "/v2.0/ports";
			const param = "port-id-123";
			const portBody = {
				port: {
					security_groups: ["security-group-id-1"],
				},
			};

			const result = await updateNetworkByParam(path, param, portBody);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"PUT",
				expectedBaseUrl,
				"/v2.0/ports/port-id-123",
				portBody,
			);
		});

		it("Network API（/v2.0/ports/{id}）へのPUTリクエストで異なるポートID（another-port-id）を指定してポート更新を実行する場合に、正しいURL（https://networking.c3j1.conoha.io）とパス（/v2.0/ports/another-port-id）でモックAPIを呼び出し、API呼び出しパラメータ（'PUT', expectedBaseUrl, '/v2.0/ports/another-port-id', mockRequestBody）が正しく引き渡されることを確認し、モックレスポンスと一致する戻り値を返すことができる", async () => {
			const path = "/v2.0/ports";
			const param = "another-port-id";

			const result = await updateNetworkByParam(path, param, mockRequestBody);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"PUT",
				expectedBaseUrl,
				"/v2.0/ports/another-port-id",
				mockRequestBody,
			);
		});

		describe("エラーハンドリング", () => {
			it("Network API（/v2.0/ports/{id}）へのPUTリクエストでexecuteOpenstackApi実行時に例外（Port update failed）が発生した場合に、API呼び出しパラメータ（'PUT', expectedBaseUrl, '/v2.0/ports/port-id-123', mockRequestBody）を正しく引き渡した上で、同じエラーメッセージ（Port update failed）の例外を発生させることができる", async () => {
				const error = new Error("Port update failed");
				mockExecuteOpenstackApi.mockRejectedValue(error);
				const path = "/v2.0/ports";
				const param = "port-id-123";

				await expect(
					updateNetworkByParam(path, param, mockRequestBody),
				).rejects.toThrow("Port update failed");
				expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
					"PUT",
					expectedBaseUrl,
					"/v2.0/ports/port-id-123",
					mockRequestBody,
				);
			});
		});
	});

	describe("deleteNetworkByParam", () => {
		const mockResponse = "";

		beforeEach(() => {
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);
		});

		it("Network API（/v2.0/ports/{id}）へのDELETEリクエストで特定のポート（port-id-123）を削除した場合に、正しいURL（https://networking.c3j1.conoha.io）とパス（/v2.0/ports/port-id-123）でモックAPIを呼び出し、API呼び出しパラメータ（'DELETE', expectedBaseUrl, '/v2.0/ports/port-id-123'）が正しく引き渡されることを確認し、モックレスポンス（空文字列）と一致する戻り値を返すことができる", async () => {
			const path = "/v2.0/ports";
			const param = "port-id-123";

			const result = await deleteNetworkByParam(path, param);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"DELETE",
				expectedBaseUrl,
				"/v2.0/ports/port-id-123",
			);
		});

		it("Network API（/v2.0/ports/{id}）へのDELETEリクエストで異なるポートID（another-port-id）を指定して削除する場合に、正しいURL（https://networking.c3j1.conoha.io）とパス（/v2.0/ports/another-port-id）でモックAPIを呼び出し、API呼び出しパラメータ（'DELETE', expectedBaseUrl, '/v2.0/ports/another-port-id'）が正しく引き渡されることを確認し、モックレスポンス（空文字列）と一致する戻り値を返すことができる", async () => {
			const path = "/v2.0/ports";
			const param = "another-port-id";

			const result = await deleteNetworkByParam(path, param);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"DELETE",
				expectedBaseUrl,
				"/v2.0/ports/another-port-id",
			);
		});

		describe("エラーハンドリング", () => {
			it("Network API（/v2.0/ports/{id}）へのDELETEリクエストでexecuteOpenstackApi実行時に例外（Port delete failed）が発生した場合に、API呼び出しパラメータ（'DELETE', expectedBaseUrl, '/v2.0/ports/port-id-123'）を正しく引き渡した上で、同じエラーメッセージ（Port delete failed）の例外を発生させることができる", async () => {
				const error = new Error("Port delete failed");
				mockExecuteOpenstackApi.mockRejectedValue(error);
				const path = "/v2.0/ports";
				const param = "port-id-123";

				await expect(deleteNetworkByParam(path, param)).rejects.toThrow(
					"Port delete failed",
				);
				expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
					"DELETE",
					expectedBaseUrl,
					"/v2.0/ports/port-id-123",
				);
			});
		});
	});

	describe("レスポンスの型", () => {
		it("Network API（/v2.0/ports）へのGETリクエストで単純な文字列レスポンス（'simple string response'）を受け取った場合に、モックAPIから返された文字列と一致する戻り値を返し、TypeScriptの型システムで文字列型として正しく型付けされること", async () => {
			const stringResponse = "simple string response";
			mockExecuteOpenstackApi.mockResolvedValue(stringResponse);
			const path = "/v2.0/ports";

			const result = await getNetwork(path);

			expect(result).toBe(stringResponse);
			expect(typeof result).toBe("string");
		});

		it("Network API（/v2.0/ports）へのGETリクエストでJSON形式のポート一覧レスポンス（{ports: [{id: 'test', name: 'test-port'}]}）を文字列として受け取った場合に、モックAPIから返されたJSON文字列と一致する戻り値を返し、TypeScriptの型システムで文字列型として正しく型付けされること", async () => {
			const jsonResponse = JSON.stringify({
				ports: [{ id: "test", name: "test-port" }],
			});
			mockExecuteOpenstackApi.mockResolvedValue(jsonResponse);
			const path = "/v2.0/ports";

			const result = await getNetwork(path);

			expect(result).toBe(jsonResponse);
			expect(typeof result).toBe("string");
		});
	});

	describe("パフォーマンス", () => {
		it("Network API（長いパス）へのGETリクエストで非常に長いパス（100回繰り返された'very-long-id-'を含むパス）を処理する場合に、パス長の制限なく正しい長いパス（/v2.0/ports/very-long-id-...123）でモックAPIを呼び出し、API呼び出しパラメータ（'GET', expectedBaseUrl, longPath）が正しく引き渡されることを確認し、モックレスポンスと一致する戻り値を返すことができる", async () => {
			const longPath = `/v2.0/ports/${"very-long-id-".repeat(100)}123`;
			const mockResponse = JSON.stringify({ port: { id: "test" } });
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
		it("getNetworkByParamでポートID（port-123）とベースパス（/v2.0/ports）を指定した場合に、正しく結合されたパス（/v2.0/ports/port-123）でモックAPIを呼び出し、API呼び出しパラメータ（'GET', expectedBaseUrl, '/v2.0/ports/port-123'）が正しく引き渡されることを確認し、パス結合処理が正しく動作すること", async () => {
			const mockResponse = JSON.stringify({ port: { id: "test" } });
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);

			const path = "/v2.0/ports";
			const param = "port-123";

			await getNetworkByParam(path, param);

			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/v2.0/ports/port-123",
			);
		});

		it("updateNetworkByParamでポートID（port-123）とベースパス（/v2.0/ports）とリクエストボディ（{port: {security_groups: ['security-group-id-1']}}）を指定した場合に、正しく結合されたパス（/v2.0/ports/port-123）でモックAPIを呼び出し、API呼び出しパラメータ（'PUT', expectedBaseUrl, '/v2.0/ports/port-123', requestBody）が正しく引き渡されることを確認し、パス結合処理が正しく動作すること", async () => {
			const mockResponse = JSON.stringify({ port: { id: "test" } });
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);

			const path = "/v2.0/ports";
			const param = "port-123";
			const requestBody = {
				port: { security_groups: ["security-group-id-1"] },
			};

			await updateNetworkByParam(path, param, requestBody);

			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"PUT",
				expectedBaseUrl,
				"/v2.0/ports/port-123",
				requestBody,
			);
		});

		it("deleteNetworkByParamでポートID（port-123）とベースパス（/v2.0/ports）を指定した場合に、正しく結合されたパス（/v2.0/ports/port-123）でモックAPIを呼び出し、API呼び出しパラメータ（'DELETE', expectedBaseUrl, '/v2.0/ports/port-123'）が正しく引き渡されることを確認し、パス結合処理が正しく動作すること", async () => {
			const mockResponse = "";
			mockExecuteOpenstackApi.mockResolvedValue(mockResponse);

			const path = "/v2.0/ports";
			const param = "port-123";

			await deleteNetworkByParam(path, param);

			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"DELETE",
				expectedBaseUrl,
				"/v2.0/ports/port-123",
			);
		});
	});
});
