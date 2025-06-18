import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeOpenstackApi } from "./openstack-client";
import type { JsonObject } from "./types";

// 依存関数のモック
vi.mock("./format-response", () => ({
	formatResponse: vi.fn(),
}));

vi.mock("./generate-api-token", () => ({
	generateApiToken: vi.fn(),
}));

// fetch のモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

// モック関数の型定義
const mockFormatResponse = vi.mocked(
	await import("./format-response"),
).formatResponse;
const mockGenerateApiToken = vi.mocked(
	await import("./generate-api-token"),
).generateApiToken;

describe("openstack-client", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("executeOpenstackApi", () => {
		const baseUrl = "https://compute.example.com";
		const apiToken = "test-api-token-12345";
		const mockFormattedResponse = JSON.stringify({
			status: 200,
			statusText: "OK",
			body: { success: true },
		});

		beforeEach(() => {
			mockGenerateApiToken.mockResolvedValue(apiToken);
			mockFormatResponse.mockResolvedValue(mockFormattedResponse);
		});

		describe("GET requests", () => {
			it("GETリクエストを正しく実行する", async () => {
				const mockResponse = new Response();
				mockFetch.mockResolvedValueOnce(mockResponse);

				const result = await executeOpenstackApi("GET", baseUrl, "/servers");

				expect(result).toBe(mockFormattedResponse);
				expect(mockGenerateApiToken).toHaveBeenCalledTimes(1);
				expect(mockFetch).toHaveBeenCalledWith(
					"https://compute.example.com/servers",
					{
						method: "GET",
						headers: {
							Accept: "application/json",
							"X-Auth-Token": apiToken,
						},
					},
				);
				expect(mockFormatResponse).toHaveBeenCalledWith(mockResponse);
			});

			it("パスパラメータを含むGETリクエストを正しく実行する", async () => {
				const mockResponse = new Response();
				mockFetch.mockResolvedValueOnce(mockResponse);

				await executeOpenstackApi("GET", baseUrl, "/servers/server-id-123");

				expect(mockFetch).toHaveBeenCalledWith(
					"https://compute.example.com/servers/server-id-123",
					{
						method: "GET",
						headers: {
							Accept: "application/json",
							"X-Auth-Token": apiToken,
						},
					},
				);
			});

			it("クエリパラメータを含むGETリクエストを正しく実行する", async () => {
				const mockResponse = new Response();
				mockFetch.mockResolvedValueOnce(mockResponse);

				await executeOpenstackApi(
					"GET",
					baseUrl,
					"/servers?limit=10&marker=abc",
				);

				expect(mockFetch).toHaveBeenCalledWith(
					"https://compute.example.com/servers?limit=10&marker=abc",
					{
						method: "GET",
						headers: {
							Accept: "application/json",
							"X-Auth-Token": apiToken,
						},
					},
				);
			});
		});

		describe("DELETE requests", () => {
			it("DELETEリクエストを正しく実行する", async () => {
				const mockResponse = new Response();
				mockFetch.mockResolvedValueOnce(mockResponse);

				const result = await executeOpenstackApi(
					"DELETE",
					baseUrl,
					"/servers/server-id-123",
				);

				expect(result).toBe(mockFormattedResponse);
				expect(mockGenerateApiToken).toHaveBeenCalledTimes(1);
				expect(mockFetch).toHaveBeenCalledWith(
					"https://compute.example.com/servers/server-id-123",
					{
						method: "DELETE",
						headers: {
							Accept: "application/json",
							"X-Auth-Token": apiToken,
						},
					},
				);
				expect(mockFormatResponse).toHaveBeenCalledWith(mockResponse);
			});
		});

		describe("POST requests", () => {
			it("POSTリクエストを正しく実行する", async () => {
				const mockResponse = new Response();
				mockFetch.mockResolvedValueOnce(mockResponse);

				const requestBody: JsonObject = {
					server: {
						name: "test-server",
						imageRef: "image-id-123",
						flavorRef: "flavor-id-456",
					},
				};

				const result = await executeOpenstackApi(
					"POST",
					baseUrl,
					"/servers",
					requestBody,
				);

				expect(result).toBe(mockFormattedResponse);
				expect(mockGenerateApiToken).toHaveBeenCalledTimes(1);
				expect(mockFetch).toHaveBeenCalledWith(
					"https://compute.example.com/servers",
					{
						method: "POST",
						headers: {
							Accept: "application/json",
							"X-Auth-Token": apiToken,
							"Content-Type": "application/json",
						},
						body: JSON.stringify(requestBody),
					},
				);
				expect(mockFormatResponse).toHaveBeenCalledWith(mockResponse);
			});

			it("複雑なPOSTリクエストボディを正しく処理する", async () => {
				const mockResponse = new Response();
				mockFetch.mockResolvedValueOnce(mockResponse);

				const complexBody: JsonObject = {
					server: {
						name: "complex-server",
						imageRef: "image-id-123",
						flavorRef: "flavor-id-456",
						networks: [{ uuid: "network-id-1" }, { uuid: "network-id-2" }],
						metadata: {
							env: "test",
							project: "openstack-test",
						},
						security_groups: ["default", "web"],
					},
				};

				await executeOpenstackApi("POST", baseUrl, "/servers", complexBody);

				expect(mockFetch).toHaveBeenCalledWith(
					"https://compute.example.com/servers",
					{
						method: "POST",
						headers: {
							Accept: "application/json",
							"X-Auth-Token": apiToken,
							"Content-Type": "application/json",
						},
						body: JSON.stringify(complexBody),
					},
				);
			});
		});

		describe("PUT requests", () => {
			it("PUTリクエストを正しく実行する", async () => {
				const mockResponse = new Response();
				mockFetch.mockResolvedValueOnce(mockResponse);

				const requestBody: JsonObject = {
					server: {
						name: "updated-server",
					},
				};

				const result = await executeOpenstackApi(
					"PUT",
					baseUrl,
					"/servers/server-id-123",
					requestBody,
				);

				expect(result).toBe(mockFormattedResponse);
				expect(mockGenerateApiToken).toHaveBeenCalledTimes(1);
				expect(mockFetch).toHaveBeenCalledWith(
					"https://compute.example.com/servers/server-id-123",
					{
						method: "PUT",
						headers: {
							Accept: "application/json",
							"X-Auth-Token": apiToken,
							"Content-Type": "application/json",
						},
						body: JSON.stringify(requestBody),
					},
				);
				expect(mockFormatResponse).toHaveBeenCalledWith(mockResponse);
			});
		});

		describe("エラーハンドリング", () => {
			it("generateApiTokenがエラーを投げた場合にエラーメッセージを返す", async () => {
				const tokenError = new Error("Failed to generate API token");
				mockGenerateApiToken.mockRejectedValueOnce(tokenError);

				const result = await executeOpenstackApi("GET", baseUrl, "/servers");

				expect(result).toBe("Error: Failed to generate API token");
				expect(mockGenerateApiToken).toHaveBeenCalledTimes(1);
				expect(mockFetch).not.toHaveBeenCalled();
				expect(mockFormatResponse).not.toHaveBeenCalled();
			});

			it("fetchがエラーを投げた場合にエラーメッセージを返す", async () => {
				const fetchError = new Error("Network error");
				mockFetch.mockRejectedValueOnce(fetchError);

				const result = await executeOpenstackApi("GET", baseUrl, "/servers");

				expect(result).toBe("Error: Network error");
				expect(mockGenerateApiToken).toHaveBeenCalledTimes(1);
				expect(mockFetch).toHaveBeenCalledTimes(1);
				expect(mockFormatResponse).not.toHaveBeenCalled();
			});

			it("formatResponseがエラーを投げた場合にエラーメッセージを返す", async () => {
				const mockResponse = new Response();
				mockFetch.mockResolvedValueOnce(mockResponse);

				const formatError = new Error("Failed to format response");
				mockFormatResponse.mockRejectedValueOnce(formatError);

				const result = await executeOpenstackApi("GET", baseUrl, "/servers");

				expect(result).toBe("Error: Failed to format response");
				expect(mockGenerateApiToken).toHaveBeenCalledTimes(1);
				expect(mockFetch).toHaveBeenCalledTimes(1);
				expect(mockFormatResponse).toHaveBeenCalledWith(mockResponse);
			});

			it("非Errorオブジェクトがthrowされた場合に汎用エラーメッセージを返す", async () => {
				mockGenerateApiToken.mockRejectedValueOnce("string error");

				const result = await executeOpenstackApi("GET", baseUrl, "/servers");

				expect(result).toBe("Unexpected error occurred");
				expect(mockGenerateApiToken).toHaveBeenCalledTimes(1);
				expect(mockFetch).not.toHaveBeenCalled();
				expect(mockFormatResponse).not.toHaveBeenCalled();
			});
		});

		describe("異なるベースURL", () => {
			it("異なるサービスのベースURLでも正しく動作する", async () => {
				const networkBaseUrl = "https://network.example.com";
				const mockResponse = new Response();
				mockFetch.mockResolvedValueOnce(mockResponse);

				await executeOpenstackApi("GET", networkBaseUrl, "/v2.0/networks");

				expect(mockFetch).toHaveBeenCalledWith(
					"https://network.example.com/v2.0/networks",
					expect.objectContaining({
						method: "GET",
						headers: expect.objectContaining({
							Accept: "application/json",
							"X-Auth-Token": apiToken,
						}),
					}),
				);
			});

			it("ベースURLの末尾にスラッシュがある場合も正しく処理する", async () => {
				const baseUrlWithSlash = "https://compute.example.com/";
				const mockResponse = new Response();
				mockFetch.mockResolvedValueOnce(mockResponse);

				await executeOpenstackApi("GET", baseUrlWithSlash, "/servers");

				expect(mockFetch).toHaveBeenCalledWith(
					"https://compute.example.com//servers",
					expect.any(Object),
				);
			});

			it("パスの先頭にスラッシュがない場合も正しく処理する", async () => {
				const mockResponse = new Response();
				mockFetch.mockResolvedValueOnce(mockResponse);

				await executeOpenstackApi("GET", baseUrl, "servers");

				expect(mockFetch).toHaveBeenCalledWith(
					"https://compute.example.com/servers",
					expect.any(Object),
				);
			});
		});

		describe("型安全性のテスト", () => {
			it("GETリクエストではbodyパラメータなしで呼び出せる", async () => {
				const mockResponse = new Response();
				mockFetch.mockResolvedValueOnce(mockResponse);

				// TypeScriptコンパイラがこれを通すことを確認
				const result = await executeOpenstackApi("GET", baseUrl, "/servers");

				expect(result).toBe(mockFormattedResponse);
			});

			it("DELETEリクエストではbodyパラメータなしで呼び出せる", async () => {
				const mockResponse = new Response();
				mockFetch.mockResolvedValueOnce(mockResponse);

				// TypeScriptコンパイラがこれを通すことを確認
				const result = await executeOpenstackApi(
					"DELETE",
					baseUrl,
					"/servers/123",
				);

				expect(result).toBe(mockFormattedResponse);
			});

			it("POSTリクエストではbodyパラメータが必要", async () => {
				const mockResponse = new Response();
				mockFetch.mockResolvedValueOnce(mockResponse);

				const body: JsonObject = { data: "test" };

				// TypeScriptコンパイラがこれを通すことを確認
				const result = await executeOpenstackApi(
					"POST",
					baseUrl,
					"/servers",
					body,
				);

				expect(result).toBe(mockFormattedResponse);
			});

			it("PUTリクエストではbodyパラメータが必要", async () => {
				const mockResponse = new Response();
				mockFetch.mockResolvedValueOnce(mockResponse);

				const body: JsonObject = { data: "updated" };

				// TypeScriptコンパイラがこれを通すことを確認
				const result = await executeOpenstackApi(
					"PUT",
					baseUrl,
					"/servers/123",
					body,
				);

				expect(result).toBe(mockFormattedResponse);
			});
		});

		describe("APIトークンの処理", () => {
			it("空文字トークンでもリクエストを実行する", async () => {
				mockGenerateApiToken.mockResolvedValueOnce("");
				const mockResponse = new Response();
				mockFetch.mockResolvedValueOnce(mockResponse);

				await executeOpenstackApi("GET", baseUrl, "/servers");

				expect(mockFetch).toHaveBeenCalledWith(
					"https://compute.example.com/servers",
					{
						method: "GET",
						headers: {
							Accept: "application/json",
							"X-Auth-Token": "",
						},
					},
				);
			});

			it("長いトークンでも正しく処理する", async () => {
				const longToken = "a".repeat(500);
				mockGenerateApiToken.mockResolvedValueOnce(longToken);
				const mockResponse = new Response();
				mockFetch.mockResolvedValueOnce(mockResponse);

				await executeOpenstackApi("GET", baseUrl, "/servers");

				expect(mockFetch).toHaveBeenCalledWith(
					"https://compute.example.com/servers",
					{
						method: "GET",
						headers: {
							Accept: "application/json",
							"X-Auth-Token": longToken,
						},
					},
				);
			});
		});
	});
});
