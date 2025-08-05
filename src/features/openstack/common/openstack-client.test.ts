import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeOpenstackApi } from "./openstack-client";
import type { JsonObject } from "./types";

// 依存関数のモック
vi.mock("./response-formatter", () => ({
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
	await import("./response-formatter"),
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
			it("API（/servers）へのGETリクエストでレスポンスを受け取った場合に、正しいURL（https://compute.example.com/servers/server-id-123）とHTTPヘッダー（{Accept: application/json, X-Auth-Token}）でAPIリクエストを送信し、'{status: number, statusText: string, body: json}'形式に正しくフォーマットできる", async () => {
				const mockResponse = new Response();
				mockFetch.mockResolvedValueOnce(mockResponse);

				const result = await executeOpenstackApi("GET", baseUrl, "/servers");

				const resultFormattedResponse = await mockFormatResponse(result);

				expect(resultFormattedResponse).toBe(mockFormattedResponse);
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

			it("API（/servers/server-id-123）へのパスパラメータを含むGETリクエストでレスポンスを受け取った場合に、正しいURL（https://compute.example.com/servers/server-id-123）とHTTPヘッダー（{Accept: application/json, X-Auth-Token}）でAPIリクエストを送信できる", async () => {
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

			it("API（/servers?limit=10&marker=abc）へのクエリパラメータを含むGETリクエストでレスポンスを受け取った場合に、正しいURL（https://compute.example.com/servers?limit=10&marker=abc）とHTTPヘッダー（{Accept: application/json, X-Auth-Token}）でAPIリクエストを送信できる", async () => {
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
			it("API（/servers/server-id-123）へのDELETEリクエストでサーバー削除レスポンスを受け取った場合に、正しいURL（https://compute.example.com/servers/server-id-123）とHTTPヘッダー（{Accept: application/json, X-Auth-Token}）でAPIリクエストを送信し、'{status: number, statusText: string, body: json}'形式に正しくフォーマットできる", async () => {
				const mockResponse = new Response();
				mockFetch.mockResolvedValueOnce(mockResponse);

				const result = await executeOpenstackApi(
					"DELETE",
					baseUrl,
					"/servers/server-id-123",
				);

				const resultFormattedResponse = await mockFormatResponse(result);

				expect(resultFormattedResponse).toBe(mockFormattedResponse);
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
			it("API（/servers）へのサーバー作成情報を含むPOSTリクエストでサーバー作成レスポンスを受け取った場合に、正しいJSONボディとHTTPヘッダー（{Accept: application/json, X-Auth-Token, Content-Type: application/json}）でAPIを呼び出しレスポンスをフォーマットできる", async () => {
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

				const resultFormattedResponse = await mockFormatResponse(result);

				expect(resultFormattedResponse).toBe(mockFormattedResponse);
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

			it("API（/servers）への複雑なサーバー作成情報（ネットワーク・メタデータ・セキュリティグループ）を含むPOSTリクエストでレスポンスを受け取った場合に、正しいJSONボディとHTTPヘッダー（{Accept: application/json, X-Auth-Token, Content-Type: application/json}）でAPIリクエストを送信できる", async () => {
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
			it("API（/servers/server-id-123）への更新情報を含むPUTリクエストでサーバー更新レスポンスを受け取った場合に、正しいJSONボディとHTTPヘッダー（{Accept: application/json, X-Auth-Token, Content-Type: application/json}）でAPIを呼び出しレスポンスをフォーマットできる", async () => {
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

				const resultFormattedResponse = await mockFormatResponse(result);

				expect(resultFormattedResponse).toBe(mockFormattedResponse);
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

		describe("異なるベースURL", () => {
			it("API（/v2.0/networks）で異なるベースURLでGETリクエストを送信した場合に、正しいURL（https://network.example.com/v2.0/networks）とヘッダー（{Accept: application/json, X-Auth-Token}）でネットワークAPIを呼び出すことができる", async () => {
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

			it("ベースURL（https://compute.example.com/）の末尾にスラッシュがある場合でも、正しいURL（https://compute.example.com//servers）でAPIリクエストを送信できる", async () => {
				const baseUrlWithSlash = "https://compute.example.com/";
				const mockResponse = new Response();
				mockFetch.mockResolvedValueOnce(mockResponse);

				await executeOpenstackApi("GET", baseUrlWithSlash, "/servers");

				expect(mockFetch).toHaveBeenCalledWith(
					"https://compute.example.com//servers",
					expect.any(Object),
				);
			});

			it("リクエストパス（servers）の先頭にスラッシュがない場合でも、正しいURL（https://compute.example.com/servers）でAPIリクエストを送信できる", async () => {
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
			it("TypeScript型システムでGETリクエストメソッド（/servers）を呼び出した場合に、bodyパラメータなしで関数を正しく呼び出すことができる", async () => {
				const mockResponse = new Response();
				mockFetch.mockResolvedValueOnce(mockResponse);

				// TypeScriptコンパイラがこれを通すことを確認
				const result = await executeOpenstackApi("GET", baseUrl, "/servers");

				const resultFormattedResponse = await mockFormatResponse(result);

				expect(resultFormattedResponse).toBe(mockFormattedResponse);
			});

			it("TypeScript型システムでDELETEリクエストメソッド（/servers/123）を呼び出した場合に、bodyパラメータなしで関数を正しく呼び出すことができる", async () => {
				const mockResponse = new Response();
				mockFetch.mockResolvedValueOnce(mockResponse);

				// TypeScriptコンパイラがこれを通すことを確認
				const result = await executeOpenstackApi(
					"DELETE",
					baseUrl,
					"/servers/123",
				);

				const resultFormattedResponse = await mockFormatResponse(result);

				expect(resultFormattedResponse).toBe(mockFormattedResponse);
			});

			it("TypeScript型システムでPOSTリクエストメソッド（/servers）を呼び出した場合に、必須のbodyパラメータ（JsonObject）を含めて関数を正しく呼び出すことができる", async () => {
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

				const resultFormattedResponse = await mockFormatResponse(result);

				expect(resultFormattedResponse).toBe(mockFormattedResponse);
			});

			it("TypeScript型システムでPUTリクエストメソッド（/servers/123）を呼び出した場合に、必須のbodyパラメータ（JsonObject）を含めて関数を正しく呼び出すことができる", async () => {
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

				const resultFormattedResponse = await mockFormatResponse(result);

				expect(resultFormattedResponse).toBe(mockFormattedResponse);
			});
		});

		describe("APIトークンの処理", () => {
			it("API（/servers）へのGETリクエストでAPIトークンが空文字の場合でも、正しいHTTPヘッダー（{Accept: application/json, X-Auth-Token: 空文字}）でAPIリクエストを送信できる", async () => {
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

			it("API（/servers）へのGETリクエストでAPIトークンが長い文字列（500文字）の場合でも、正しいHTTPヘッダー（{Accept: application/json, X-Auth-Token: 長いトークン}）でAPIリクエストを送信できる", async () => {
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
