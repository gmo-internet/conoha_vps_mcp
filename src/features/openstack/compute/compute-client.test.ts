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

		it("Compute API（/flavors）へのGETリクエストでフレーバー一覧レスポンスを受け取った場合に、正しいURL（https://compute.c3j1.conoha.io/v2.1）とパス（/flavors）でモックAPIを呼び出し、API呼び出しパラメータ（'GET', expectedBaseUrl, '/flavors'）が正しく引き渡されることを確認し、モックレスポンスと一致する文字列を戻り値として返すことができる", async () => {
			const path = "/flavors";

			const result = await getCompute(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/flavors",
			);
		});

		it("Compute API（/servers）への先頭スラッシュなしパス指定でGETリクエストした場合に、パス文字列（servers）をそのままモックAPIに渡してリクエストし、API呼び出しパラメータ（'GET', expectedBaseUrl, 'servers'）が正しく引き渡されることを確認し、モックレスポンスと一致する文字列を戻り値として返すことができる", async () => {
			const path = "servers";

			const result = await getCompute(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"servers",
			);
		});

		it("Compute APIへの空文字列パス指定でGETリクエストした場合に、空文字列パス（''）をそのまま正しいURL（https://compute.c3j1.conoha.io/v2.1）とともにモックAPIに渡してリクエストし、API呼び出しパラメータ（'GET', expectedBaseUrl, ''）が正しく引き渡されることを確認し、モックレスポンスと一致する文字列を戻り値として返すことができる", async () => {
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
			it("モックAPIがネットワークエラー例外を投げた場合に、API呼び出しパラメータ（'GET', expectedBaseUrl, '/servers'）でリクエストは送信されるがgetComputeから同じエラーメッセージ（Network error）の例外が投げられること", async () => {
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

		it("Compute API（/servers/server-id-123）への特定サーバーID（server-id-123）指定GETリクエストで個別サーバーレスポンスを受け取った場合に、正しいURL（https://compute.c3j1.conoha.io/v2.1）とパス（/servers/server-id-123）でモックAPIを呼び出し、API呼び出しパラメータ（'GET', expectedBaseUrl, '/servers/server-id-123'）が正しく引き渡されることを確認し、モックレスポンス（'{status: 200, statusText: 'OK', body: {server: {...}}}'）と一致する文字列を戻り値として返すことができる", async () => {
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

		it("Compute API（/servers/server-id-123/detail）への特定サーバーID（server-id-123）の詳細情報パス（/detail）指定GETリクエストでサーバー詳細レスポンスを受け取った場合に、正しいパス（/servers/server-id-123/detail）でモックAPIを呼び出し、API呼び出しパラメータ（'GET', expectedBaseUrl, '/servers/server-id-123/detail'）が正しく引き渡されることを確認し、モックレスポンスと一致する文字列を戻り値として返すことができる", async () => {
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

		it("Compute API（/servers/server-id-123/os-instance-actions）への特定サーバーID（server-id-123）のアクション履歴パス（/os-instance-actions）指定GETリクエストでインスタンスアクション履歴レスポンスを受け取った場合に、正しいパス（/servers/server-id-123/os-instance-actions）でモックAPIを呼び出し、レスポンスを文字列形式で正しく返すことができる", async () => {
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

		it("Compute API（/servers/another-server-id）への異なるサーバーID（another-server-id）指定GETリクエストで個別サーバーレスポンスを受け取った場合に、指定されたIDを含む正しいパス（/servers/another-server-id）でモックAPIを呼び出し、レスポンスを文字列形式で正しく返すことができる", async () => {
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
			it("モックAPIがサーバー検索エラー例外を投げた場合に、API呼び出しパラメータ（'GET', expectedBaseUrl, '/servers/server-id-123'）でリクエストは送信されるがgetComputeByIdから同じエラーメッセージ（Server not found）の例外が投げられること", async () => {
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

		it("Compute API（/servers）へのサーバー作成リクエストボディ（{server: {name, imageRef, flavorRef, networks}}）を含むPOSTリクエストで新規サーバー作成レスポンス（status: 202）を受け取った場合に、正しいURL（https://compute.c3j1.conoha.io/v2.1）とパス（/servers）とリクエストボディでモックAPIを呼び出し、API呼び出しパラメータ（'POST', expectedBaseUrl, '/servers', mockRequestBody）が正しく引き渡されることを確認し、モックレスポンス（'{status: 202, statusText: 'Accepted', body: {server: {...}}}'）と一致する文字列を戻り値として返すことができる", async () => {
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

		it("Compute API（/os-keypairs）へのキーペア作成リクエストボディ（{keypair: {name: 'test-keypair', public_key: 'ssh-rsa AAAAB3...'}}）を含むPOSTリクエストでキーペア作成レスポンスを受け取った場合に、正しいパス（/os-keypairs）とリクエストボディでモックAPIを呼び出し、API呼び出しパラメータ（'POST', expectedBaseUrl, '/os-keypairs', keypairBody）が正しく引き渡されることを確認し、モックレスポンスと一致する文字列を戻り値として返すことができる", async () => {
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
			it("モックAPIがリソース作成失敗エラー例外を投げた場合に、API呼び出しパラメータ（'POST', expectedBaseUrl, '/servers', mockRequestBody）でリクエストは送信されるがcreateComputeから同じエラーメッセージ（Creation failed）の例外が投げられること", async () => {
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

		it("Compute API（/servers/server-id-123/action）への特定サーバーID（server-id-123）のアクション実行リクエストボディ（{reboot: {type: 'SOFT'}}）を含むPOSTリクエストでサーバーアクション実行レスポンス（status: 202）を受け取った場合に、正しいURL（https://compute.c3j1.conoha.io/v2.1）とパス（/servers/server-id-123/action）とリクエストボディでモックAPIを呼び出し、API呼び出しパラメータ（'POST', expectedBaseUrl, '/servers/server-id-123/action', mockRequestBody）が正しく引き渡されることを確認し、モックレスポンス（'{status: 202, statusText: 'Accepted', body: {message: 'Action performed successfully'}}'）と一致する文字列を戻り値として返すことができる", async () => {
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

		it("Compute API（/servers/server-id-123/action）への特定サーバーID（server-id-123）のリブートアクションリクエストボディ（{reboot: {type: 'HARD'}}）を含むPOSTリクエストでサーバーハードリブート実行レスポンスを受け取った場合に、正しいパス（/servers/server-id-123/action）とリクエストボディでモックAPIを呼び出し、レスポンスを文字列形式で正しく返すことができる", async () => {
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

		it("Compute API（/servers/another-server-id/action）への異なるサーバーID（another-server-id）のアクション実行リクエストボディ（{reboot: {type: 'SOFT'}}）を含むPOSTリクエストで別サーバーアクション実行レスポンスを受け取った場合に、指定されたIDを含む正しいパス（/servers/another-server-id/action）とリクエストボディでモックAPIを呼び出し、レスポンスを文字列形式で正しく返すことができる", async () => {
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
			it("モックAPIがアクション実行失敗エラー例外を投げた場合に、API呼び出しパラメータ（'POST', expectedBaseUrl, '/servers/server-id-123/action', mockRequestBody）でリクエストは送信されるがcreateComputeByIdから同じエラーメッセージ（Action failed）の例外が投げられること", async () => {
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

		it("Compute API（/servers/server-id-123）への特定のサーバーID（server-id-123）を持つサーバーを削除するDELETEリクエストで、サーバー削除レスポンス（空文字列）を受け取った場合に、正しいURL（https://compute.c3j1.conoha.io/v2.1）とパス（/servers/server-id-123）でモックAPIを呼び出し、API呼び出しパラメータ（'DELETE', expectedBaseUrl, '/servers/server-id-123'）が正しく引き渡されることを確認し、モックレスポンス（空文字列）と一致する戻り値を返すことができる", async () => {
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

		it("Compute API（/os-keypairs/keypair-name）への特定のサーバーID（server-id-123）を持つサーバーを削除するDELETEリクエストでキーペア削除レスポンス（空文字列）を受け取った場合に、正しいパス（/os-keypairs/keypair-name）でモックAPIを呼び出し、モックレスポンス（空文字列）と一致する戻り値を返すことができる", async () => {
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

		it("Compute API（/servers/another-server-id）への特定のサーバーID（server-id-123）を持つサーバーを削除するDELETEリクエストで別サーバー削除レスポンス（空文字列）を受け取った場合に、指定されたIDを含む正しいパス（/servers/another-server-id）でモックAPIを呼び出し、モックレスポンス（空文字列）と一致する戻り値を返すことができる", async () => {
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
			it("モックAPIがリソース削除失敗エラー例外を投げた場合に、API呼び出しパラメータ（'DELETE', expectedBaseUrl, '/servers/server-id-123'）でリクエストは送信されるがdeleteComputeByIdから同じエラーメッセージ（Delete failed）の例外が投げられること", async () => {
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
		it("getComputeが単純な文字列レスポンス（'simple string response'）を受け取った場合に、モックAPIから返された文字列と一致する戻り値を返し、TypeScriptの型システムで文字列型として正しく型付けされること", async () => {
			const stringResponse = "simple string response";
			mockExecuteOpenstackApi.mockResolvedValue(stringResponse);
			const path = "/servers";

			const result = await getCompute(path);

			expect(result).toBe(stringResponse);
			expect(typeof result).toBe("string");
		});

		it("getComputeがJSON形式のサーバー一覧レスポンス（{servers: [{id: 'test', name: 'test-server'}]}）を文字列として受け取った場合に、モックAPIから返されたJSON文字列と一致する戻り値を返し、TypeScriptの型システムで文字列型として正しく型付けされること", async () => {
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
		it("getComputeが大量サーバーデータ（1000件のサーバー配列）を含むJSON文字列レスポンスを受け取った場合に、パフォーマンスの問題なく正しいパス（/servers?limit=1000）でモックAPIを呼び出し、API呼び出しパラメータ（'GET', expectedBaseUrl, '/servers?limit=1000'）が正しく引き渡されることを確認し、大量データモックレスポンスと一致する戻り値を返すことができる", async () => {
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

		it("getComputeが非常に長いパス（100回繰り返された'very-long-id-'を含むパス）を処理する場合に、パス長の制限なく正しい長いパス（/servers/very-long-id-...123）でモックAPIを呼び出し、API呼び出しパラメータ（'GET', expectedBaseUrl, longPath）が正しく引き渡されることを確認し、モックレスポンスと一致する戻り値を返すことができる", async () => {
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
		it("getComputeByIdでサーバーID（server-123）と詳細パス（/detail）を指定した場合に、正しく結合されたパス（/servers/server-123/detail）でモックAPIを呼び出し、API呼び出しパラメータ（'GET', expectedBaseUrl, '/servers/server-123/detail'）が正しく引き渡されることを確認し、パス結合処理が正しく動作すること", async () => {
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

		it("createComputeByIdでサーバーID（server-123）とアクションパス（/action）とリクエストボディ（{reboot: {type: 'SOFT'}}）を指定した場合に、正しく結合されたパス（/servers/server-123/action）でモックAPIを呼び出し、API呼び出しパラメータ（'POST', expectedBaseUrl, '/servers/server-123/action', requestBody）が正しく引き渡されることを確認し、パス結合処理が正しく動作すること", async () => {
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

		it("deleteComputeByIdでサーバーベースパス（/servers）とサーバーID（server-123）を指定した場合に、正しく結合されたパス（/servers/server-123）でモックAPIを呼び出し、API呼び出しパラメータ（'DELETE', expectedBaseUrl, '/servers/server-123'）が正しく引き渡されることを確認し、パス結合処理が正しく動作すること", async () => {
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
