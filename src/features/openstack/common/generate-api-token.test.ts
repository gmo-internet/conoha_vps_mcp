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
		it("正常にAPIトークンを生成する", async () => {
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

		it("x-subject-tokenヘッダーが存在しない場合にundefinedを返す", async () => {
			const mockHeaders = new Headers();
			// x-subject-tokenヘッダーを設定しない

			const mockResponse = {
				headers: mockHeaders,
			};

			mockFetch.mockResolvedValueOnce(mockResponse);

			const result = await generateApiToken();

			expect(result).toBeNull();
		});

		it("OPENSTACK_USER_IDが設定されていない場合にエラーを投げる", async () => {
			delete process.env.OPENSTACK_USER_ID;

			await expect(generateApiToken()).rejects.toThrow(
				"USER_ID, PASSWORD, or TENANT_ID envs are not defined",
			);

			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("OPENSTACK_PASSWORDが設定されていない場合にエラーを投げる", async () => {
			delete process.env.OPENSTACK_PASSWORD;

			await expect(generateApiToken()).rejects.toThrow(
				"USER_ID, PASSWORD, or TENANT_ID envs are not defined",
			);

			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("OPENSTACK_TENANT_IDが設定されていない場合にエラーを投げる", async () => {
			delete process.env.OPENSTACK_TENANT_ID;

			await expect(generateApiToken()).rejects.toThrow(
				"USER_ID, PASSWORD, or TENANT_ID envs are not defined",
			);

			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("複数の環境変数が設定されていない場合にエラーを投げる", async () => {
			delete process.env.OPENSTACK_USER_ID;
			delete process.env.OPENSTACK_TENANT_ID;

			await expect(generateApiToken()).rejects.toThrow(
				"USER_ID, PASSWORD, or TENANT_ID envs are not defined",
			);

			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("fetchがエラーを投げた場合にエラーが伝播する", async () => {
			const fetchError = new Error("Network error");
			mockFetch.mockRejectedValueOnce(fetchError);

			await expect(generateApiToken()).rejects.toThrow("Network error");

			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		it("正しいリクエストボディの構造でAPIを呼び出す", async () => {
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

		it("正しいHTTPヘッダーでAPIを呼び出す", async () => {
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

		it("正しいエンドポイントURLでAPIを呼び出す", async () => {
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

		it("長いトークン文字列も正しく処理する", async () => {
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
