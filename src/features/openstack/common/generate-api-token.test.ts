import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateApiToken } from "./generate-api-token";

// fetch のモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

// 環境変数のモック
const mockEnv = {
	OPENSTACK_USER_ID: "test-user-id",
	OPENSTACK_PASSWORD: "test-password",
	OPENSTACK_TENANT_ID: "test-tenant-id",
};

describe("generate-api-token", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// 環境変数を設定
		process.env = { ...mockEnv };
	});

	describe("generateApiToken", () => {
		it("API（/v3/auth/tokens）へのAPIトークン発行リクエストのレスポンスにあるx-subject-tokenヘッダーから、APIトークンを正しく抽出できる", async () => {
			const expectedToken = "test-api-token-12345";
			const mockHeaders = new Headers();
			mockHeaders.set("x-subject-token", expectedToken);

			const mockResponse = {
				headers: mockHeaders,
			};

			mockFetch.mockResolvedValueOnce(mockResponse);

			const result = await generateApiToken();

			expect(result).toBe(expectedToken);
			expect(mockFetch).toHaveBeenCalledTimes(1);
			expect(mockFetch).toHaveBeenCalledWith(
				"https://identity.c3j1.conoha.io/v3/auth/tokens",
				{
					method: "POST",
					headers: { Accept: "application/json" },
					body: JSON.stringify({
						auth: {
							identity: {
								methods: ["password"],
								password: {
									user: {
										id: "test-user-id",
										password: "test-password",
									},
								},
							},
							scope: {
								project: {
									id: "test-tenant-id",
								},
							},
						},
					}),
				},
			);
		});

		it("認証API（/v3/auth/tokens）へのAPIトークン発行リクエストのレスポンスに、x-subject-tokenヘッダーが存在しない場合にnullを返す", async () => {
			const mockHeaders = new Headers();
			// x-subject-tokenヘッダーを設定しない

			const mockResponse = {
				headers: mockHeaders,
			};

			mockFetch.mockResolvedValueOnce(mockResponse);

			const result = await generateApiToken();

			expect(result).toBeNull();
		});

		it("OPENSTACK_USER_ID環境変数が未設定の場合に、認証API（/v3/auth/tokens）へのAPIトークン発行リクエストが行われず、'USER_ID, PASSWORD, or TENANT_ID envs are not defined'エラーを正しくスローできる", async () => {
			delete process.env.OPENSTACK_USER_ID;

			await expect(generateApiToken()).rejects.toThrow(
				"USER_ID, PASSWORD, or TENANT_ID envs are not defined",
			);

			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("OPENSTACK_PASSWORD環境変数が未設定の場合に、認証API（/v3/auth/tokens）へのAPIトークン発行リクエストが行われず、'USER_ID, PASSWORD, or TENANT_ID envs are not defined'エラーを正しくスローできる", async () => {
			delete process.env.OPENSTACK_PASSWORD;

			await expect(generateApiToken()).rejects.toThrow(
				"USER_ID, PASSWORD, or TENANT_ID envs are not defined",
			);

			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("OPENSTACK_TENANT_ID環境変数が未設定の場合に、認証API（/v3/auth/tokens）へのAPIトークン発行リクエストが行われず、'USER_ID, PASSWORD, or TENANT_ID envs are not defined'エラーを正しくスローできる", async () => {
			delete process.env.OPENSTACK_TENANT_ID;

			await expect(generateApiToken()).rejects.toThrow(
				"USER_ID, PASSWORD, or TENANT_ID envs are not defined",
			);

			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("複数の環境変数（OPENSTACK_USER_IDおよびOPENSTACK_TENANT_ID）が未設定の場合に、認証API（/v3/auth/tokens）へのAPIトークン発行リクエストが行われず、'USER_ID, PASSWORD, or TENANT_ID envs are not defined'エラーを正しくスローできる", async () => {
			delete process.env.OPENSTACK_USER_ID;
			delete process.env.OPENSTACK_TENANT_ID;

			await expect(generateApiToken()).rejects.toThrow(
				"USER_ID, PASSWORD, or TENANT_ID envs are not defined",
			);

			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("fetchがNetwork errorを投げた場合に、そのエラーがgenerateApiTokenの呼び出し元まで正しく伝播される", async () => {
			const fetchError = new Error("Network error");
			mockFetch.mockRejectedValueOnce(fetchError);

			await expect(generateApiToken()).rejects.toThrow("Network error");

			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		it("正しい認証情報を含むリクエストボディの構造で、認証API（/v3/auth/tokens）にAPIトークン発行リクエストを送信できる", async () => {
			const expectedToken = "test-token";
			const mockHeaders = new Headers();
			mockHeaders.set("x-subject-token", expectedToken);

			const mockResponse = {
				headers: mockHeaders,
			};

			mockFetch.mockResolvedValueOnce(mockResponse);

			await generateApiToken();

			const callArgs = mockFetch.mock.calls[0];
			const requestBody = JSON.parse(callArgs[1].body);

			expect(requestBody).toEqual({
				auth: {
					identity: {
						methods: ["password"],
						password: {
							user: {
								id: "test-user-id",
								password: "test-password",
							},
						},
					},
					scope: {
						project: {
							id: "test-tenant-id",
						},
					},
				},
			});
		});

		it("正しいHTTPヘッダーで認証API（/v3/auth/tokens）にAPIトークン発行リクエストを送信できる", async () => {
			const expectedToken = "test-token";
			const mockHeaders = new Headers();
			mockHeaders.set("x-subject-token", expectedToken);

			const mockResponse = {
				headers: mockHeaders,
			};

			mockFetch.mockResolvedValueOnce(mockResponse);

			await generateApiToken();

			const callArgs = mockFetch.mock.calls[0];
			expect(callArgs[1].method).toBe("POST");
			expect(callArgs[1].headers).toEqual({ Accept: "application/json" });
		});

		it("正しいエンドポイントURL（https://identity.c3j1.conoha.io/v3/auth/tokens）で認証API（/v3/auth/tokens）にAPIトークン発行リクエストを送信できる", async () => {
			const expectedToken = "test-token";
			const mockHeaders = new Headers();
			mockHeaders.set("x-subject-token", expectedToken);

			const mockResponse = {
				headers: mockHeaders,
			};

			mockFetch.mockResolvedValueOnce(mockResponse);

			await generateApiToken();

			const callArgs = mockFetch.mock.calls[0];
			expect(callArgs[0]).toBe(
				"https://identity.c3j1.conoha.io/v3/auth/tokens",
			);
		});

		it("長いトークン文字列がx-subject-tokenヘッダーに含まれる認証API（/v3/auth/tokens）のレスポンスを受け取った場合に、そのトークンを正しく抽出し長さも正しく保持できる", async () => {
			const longToken = "a".repeat(1000); // 1000文字の長いトークン
			const mockHeaders = new Headers();
			mockHeaders.set("x-subject-token", longToken);

			const mockResponse = {
				headers: mockHeaders,
			};

			mockFetch.mockResolvedValueOnce(mockResponse);

			const result = await generateApiToken();

			expect(result).toBe(longToken);
			expect(result).toHaveLength(1000);
		});
	});
});
