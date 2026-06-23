/**
 * storage-client のアップロード経路テスト
 *
 * @remarks
 * 主眼は upload_object（MCP App）経路の安全性検証:
 * {@link uploadStorageObjectDecoded} がサーバーローカルの readFile を一切呼ばず、
 * Base64 をデコードした本体だけを PUT すること。あわせて汎用ツール用の
 * {@link uploadStorageObject} が従来どおりファイルパス読み込みを試みることも固定する。
 *
 * @packageDocumentation
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	deleteStorageContainer,
	deleteStorageObject,
	uploadStorageObject,
	uploadStorageObjectDecoded,
} from "./storage-client";

vi.mock("../common/generate-api-token", () => ({
	generateApiToken: vi.fn(),
}));
vi.mock("../common/response-formatter", () => ({
	formatResponse: vi.fn(),
}));
vi.mock("node:fs/promises", () => ({
	readFile: vi.fn(),
}));

const mockGenerateApiToken = vi.mocked(
	await import("../common/generate-api-token"),
).generateApiToken;
const mockFormatResponse = vi.mocked(
	await import("../common/response-formatter"),
).formatResponse;
const mockReadFile = vi.mocked(await import("node:fs/promises")).readFile;

const PATH = "/v1/AUTH_tenant/my-container/hello.txt";
const EXPECTED_URL = `https://object-storage.c3j1.conoha.io${PATH}`;

describe("storage-client アップロード経路", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGenerateApiToken.mockResolvedValue("test-token");
		mockFormatResponse.mockResolvedValue(
			JSON.stringify({ status: 201, statusText: "Created" }),
		);
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({ status: 201 } as Response),
		);
	});

	describe("uploadStorageObjectDecoded（App 経路・Base64専用）", () => {
		it("readFile を一切呼ばず Base64 をデコードした本体を PUT する", async () => {
			// "QUJD" === base64("ABC")
			await uploadStorageObjectDecoded(PATH, "QUJD", "text/plain");

			expect(mockReadFile).not.toHaveBeenCalled();

			const fetchMock = vi.mocked(fetch);
			expect(fetchMock).toHaveBeenCalledTimes(1);
			const [calledUrl, init] = fetchMock.mock.calls[0];
			expect(calledUrl).toBe(EXPECTED_URL);
			expect(init?.method).toBe("PUT");
			expect(init?.body).toEqual(new Uint8Array([65, 66, 67])); // "ABC"
		});

		it("X-Auth-Token と Content-Type ヘッダーを付与する", async () => {
			await uploadStorageObjectDecoded(PATH, "QUJD", "text/plain");
			const init = vi.mocked(fetch).mock.calls[0][1];
			const headers = init?.headers as Record<string, string>;
			expect(headers["X-Auth-Token"]).toBe("test-token");
			expect(headers["Content-Type"]).toBe("text/plain");
		});

		it("contentType 省略時は Content-Type ヘッダーを付けない", async () => {
			await uploadStorageObjectDecoded(PATH, "QUJD");
			const init = vi.mocked(fetch).mock.calls[0][1];
			const headers = init?.headers as Record<string, string>;
			expect(headers["Content-Type"]).toBeUndefined();
		});

		it("整形済みレスポンス文字列をそのまま返す", async () => {
			const result = await uploadStorageObjectDecoded(PATH, "QUJD");
			expect(result).toBe(
				JSON.stringify({ status: 201, statusText: "Created" }),
			);
		});
	});

	describe("uploadStorageObject（汎用ツール・ファイルパス対応を維持）", () => {
		it("content をまずファイルパスとして readFile しようとする", async () => {
			mockReadFile.mockResolvedValue(Buffer.from([1, 2, 3]));

			await uploadStorageObject(
				PATH,
				"/abs/path/file.bin",
				"application/octet-stream",
			);

			expect(mockReadFile).toHaveBeenCalledWith("/abs/path/file.bin");
			const init = vi.mocked(fetch).mock.calls[0][1];
			expect(init?.body).toEqual(new Uint8Array([1, 2, 3]));
		});

		it("readFile が失敗した場合は Base64 デコードにフォールバックする", async () => {
			mockReadFile.mockRejectedValue(new Error("ENOENT"));

			await uploadStorageObject(PATH, "QUJD");

			expect(mockReadFile).toHaveBeenCalled();
			const init = vi.mocked(fetch).mock.calls[0][1];
			expect(init?.body).toEqual(new Uint8Array([65, 66, 67])); // "ABC"
		});
	});

	describe("削除経路のテナントID解決", () => {
		const originalEnv = process.env;

		afterEach(() => {
			process.env = originalEnv;
		});

		it("OPENSTACK_TENANT_ID が設定済みの場合、deleteStorageContainer は path 内の {tenantId} を解決して DELETE する", async () => {
			process.env = { ...originalEnv, OPENSTACK_TENANT_ID: "tenant-xyz" };

			await deleteStorageContainer("/v1/AUTH_{tenantId}/my-container");

			const fetchMock = vi.mocked(fetch);
			expect(fetchMock).toHaveBeenCalledTimes(1);
			const [calledUrl, init] = fetchMock.mock.calls[0];
			expect(calledUrl).toBe(
				"https://object-storage.c3j1.conoha.io/v1/AUTH_tenant-xyz/my-container",
			);
			expect(init?.method).toBe("DELETE");
		});

		it("OPENSTACK_TENANT_ID が未設定の場合、deleteStorageContainer は壊れた AUTH_ パスを生成せず日本語メッセージのエラーをスローする", async () => {
			process.env = { ...originalEnv };
			process.env.OPENSTACK_TENANT_ID = undefined;

			await expect(
				deleteStorageContainer("/v1/AUTH_{tenantId}/my-container"),
			).rejects.toThrow(
				"OPENSTACK_TENANT_ID が設定されていません。環境変数を確認してください",
			);

			expect(vi.mocked(fetch)).not.toHaveBeenCalled();
		});

		it("OPENSTACK_TENANT_ID が未設定の場合、deleteStorageObject も同様に日本語メッセージのエラーをスローする", async () => {
			process.env = { ...originalEnv };
			process.env.OPENSTACK_TENANT_ID = undefined;

			await expect(
				deleteStorageObject("/v1/AUTH_{tenantId}/my-container/hello.txt"),
			).rejects.toThrow(
				"OPENSTACK_TENANT_ID が設定されていません。環境変数を確認してください",
			);

			expect(vi.mocked(fetch)).not.toHaveBeenCalled();
		});
	});
});
