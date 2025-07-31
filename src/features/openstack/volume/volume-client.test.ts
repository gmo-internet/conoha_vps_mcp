import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createVolume,
	deleteVolumeByParam,
	getVolume,
	updateVolumeByParam,
} from "./volume-client";

vi.mock("../common/response-formatter", () => ({
	formatResponse: vi.fn(),
}));

// executeOpenstackApi のモック
vi.mock("../common/openstack-client", () => ({
	executeOpenstackApi: vi.fn(),
}));

// モック関数の型定義
const mockExecuteOpenstackApi = vi.mocked(
	await import("../common/openstack-client"),
).executeOpenstackApi;

const mockFormatResponse = vi.mocked(
	await import("../common/response-formatter"),
).formatResponse;

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
						status: "in-use",
						size: 100,
					},
				],
			},
		});

		beforeEach(() => {
			mockFormatResponse.mockResolvedValue(mockResponse);
		});

		it("Volume API（/volumes/detail）へのGETリクエストでボリューム一覧レスポンスを受け取った場合に、正しいURL（https://block-storage.c3j1.conoha.io/v3/{tenant_id}）とパス（/volumes/detail）でモックAPIを呼び出し、API呼び出しパラメータ（'GET', expectedBaseUrl, '/volumes/detail'）が正しく引き渡されることを確認し、モックレスポンスと一致する文字列を戻り値として返すことができる", async () => {
			const path = "/volumes/detail";

			const result = await getVolume(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledTimes(1);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/volumes/detail",
			);
		});

		it("Volume API（/volumes/detail）へのGETリクエストでクエリパラメータ（limit=10）付きのボリューム検索を実行する場合に、正しいURL（https://block-storage.c3j1.conoha.io/v3/{tenant_id}）とパス（/volumes?limit=10）でモックAPIを呼び出し、API呼び出しパラメータ（'GET', expectedBaseUrl, '/volumes?limit=10'）が正しく引き渡されることを確認し、モックレスポンスと一致する戻り値を返すことができる", async () => {
			const path = "/volumes/detail?limit=10";

			const result = await getVolume(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/volumes/detail?limit=10",
			);
		});

		it("パスの先頭にスラッシュがない場合（volumes/detail）でも正しくVolume APIを呼び出せる", async () => {
			const path = "volumes/detail";

			const result = await getVolume(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"volumes/detail",
			);
		});

		it("空のパス（''）でもVolume APIを正しく呼び出せる", async () => {
			const path = "";

			const result = await getVolume(path);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"",
			);
		});
	});

	describe("createVolume", () => {
		const mockResponse = JSON.stringify({
			status: 202,
			statusText: "Created",
			body: {
				volume: {
					id: "new-volume-id",
					name: "new-volume",
					status: "creating",
					size: 30,
				},
			},
		});

		const mockRequestBody = {
			volume: {
				name: "new-volume",
				size: 30,
				description: "New volume description",
				volume_type: "standard",
				imageRef: "image-id-123",
			},
		};

		beforeEach(() => {
			mockFormatResponse.mockResolvedValue(mockResponse);
		});

		it("Volume API（/volumes）へのPOSTリクエストでボリューム作成リクエストボディ（volume情報）を送信した場合に、正しいURL（https://block-storage.c3j1.conoha.io/v3/{tenant_id}）とパス（/volumes）でモックAPIを呼び出し、API呼び出しパラメータ（'POST', expectedBaseUrl, '/volumes', volumeBody）が正しく引き渡されることを確認し、モックレスポンスと一致する文字列を戻り値として返すことができる", async () => {
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
	});

	describe("updateVolumeByParam", () => {
		const mockResponse = JSON.stringify({
			status: 200,
			statusText: "OK",
			body: {
				volume: {
					id: "volume-id-123",
					name: "updated-volume",
					status: "available",
					size: 100,
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
			mockFormatResponse.mockResolvedValue(mockResponse);
		});

		it("Volume API（/volumes/{id}）へのPUTリクエストで特定のボリューム（volume-id-123）を更新するリクエストボディ（volume情報）を送信した場合に、正しいURL（https://block-storage.c3j1.conoha.io/v3/{tenant_id}）とパス（/volumes/volume-id-123）でモックAPIを呼び出し、API呼び出しパラメータ（'PUT', expectedBaseUrl, '/volumes/volume-id-123', volumeBody）が正しく引き渡されることを確認し、モックレスポンスと一致する文字列を戻り値として返すことができる", async () => {
			const path = "/volumes";
			const param = "volume-id-123";

			const result = await updateVolumeByParam(path, param, mockRequestBody);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledTimes(1);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"PUT",
				expectedBaseUrl,
				"/volumes/volume-id-123",
				mockRequestBody,
			);
		});

		it("Volume API（/volumes/{id}）へのPUTリクエストで異なるボリュームID（another-volume-id）を指定してボリューム更新を実行する場合に、正しいURL（https://block-storage.c3j1.conoha.io/v3/{tenant_id}）とパス（/volumes/another-volume-id）でモックAPIを呼び出し、API呼び出しパラメータ（'PUT', expectedBaseUrl, '/volumes/another-volume-id', mockRequestBody）が正しく引き渡されることを確認し、モックレスポンスと一致する戻り値を返すことができる", async () => {
			const path = "/volumes";
			const param = "another-volume-id";

			const result = await updateVolumeByParam(path, param, mockRequestBody);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"PUT",
				expectedBaseUrl,
				"/volumes/another-volume-id",
				mockRequestBody,
			);
		});

		it("パスの末尾にスラッシュがある場合（/volumes/）でもボリューム更新APIを正しく呼び出せる", async () => {
			const path = "/volumes/";
			const param = "volume-id-123";

			const result = await updateVolumeByParam(path, param, mockRequestBody);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"PUT",
				expectedBaseUrl,
				"/volumes//volume-id-123",
				mockRequestBody,
			);
		});
	});

	describe("deleteVolumeByParam", () => {
		const mockResponse = "";

		beforeEach(() => {
			mockFormatResponse.mockResolvedValue(mockResponse);
		});

		it("Volume API（/volumes/{id}）へのDELETEリクエストで特定のボリューム（volume-id-123）を削除した場合に、正しいURL（https://block-storage.c3j1.conoha.io/v3/{tenant_id}）とパス（/volumes/volume-id-123）でモックAPIを呼び出し、API呼び出しパラメータ（'DELETE', expectedBaseUrl, '/volumes/volume-id-123'）が正しく引き渡されることを確認し、モックレスポンス（空文字列）と一致する戻り値を返すことができる", async () => {
			const path = "/volumes";
			const param = "volume-id-123";

			const result = await deleteVolumeByParam(path, param);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledTimes(1);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"DELETE",
				expectedBaseUrl,
				"/volumes/volume-id-123",
			);
		});

		it("Volume API（/volumes/{id}）へのDELETEリクエストで異なるボリュームID（another-volume-id）を指定して削除する場合に、正しいURL（https://block-storage.c3j1.conoha.io/v3/{tenant_id}）とパス（/volumes/another-volume-id）でモックAPIを呼び出し、API呼び出しパラメータ（'DELETE', expectedBaseUrl, '/volumes/another-volume-id'）が正しく引き渡されることを確認し、モックレスポンス（空文字列）と一致する戻り値を返すことができる", async () => {
			const path = "/volumes";
			const param = "another-volume-id";

			const result = await deleteVolumeByParam(path, param);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"DELETE",
				expectedBaseUrl,
				"/volumes/another-volume-id",
			);
		});

		it("パスの末尾にスラッシュがある場合（/volumes/）でもボリューム削除APIを正しく呼び出せる", async () => {
			const path = "/volumes/";
			const param = "volume-id-123";

			const result = await deleteVolumeByParam(path, param);

			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"DELETE",
				expectedBaseUrl,
				"/volumes//volume-id-123",
			);
		});
	});

	describe("レスポンスの型", () => {
		it("Volume API（/volumes/detail）へのGETリクエストで単純な文字列レスポンス（'simple string response'）を受け取った場合に、モックAPIから返された文字列と一致する戻り値を返し、TypeScriptの型システムで文字列型として正しく型付けされること", async () => {
			const stringResponse = "simple string response";
			mockFormatResponse.mockResolvedValue(stringResponse);
			const path = "/volumes/detail";

			const result = await getVolume(path);

			expect(result).toBe(stringResponse);
			expect(typeof result).toBe("string");
		});

		it("Volume API（/volumes/detail）へのGETリクエストでJSON形式のボリューム一覧レスポンス（{volumes: [{id: 'test', name: 'test-volume'}]}）を文字列として受け取った場合に、モックAPIから返されたJSON文字列と一致する戻り値を返し、TypeScriptの型システムで文字列型として正しく型付けされること", async () => {
			const jsonResponse = JSON.stringify({
				volumes: [{ id: "test", name: "test-volume" }],
			});
			mockFormatResponse.mockResolvedValue(jsonResponse);
			const path = "/volumes/detail";

			const result = await getVolume(path);

			expect(result).toBe(jsonResponse);
			expect(typeof result).toBe("string");
		});
	});

	describe("パフォーマンス", () => {
		it("Volume API（/volumes/detail）へのGETリクエストで大量のボリュームデータ（1000件のボリューム一覧）を処理する場合に、データ量の制限なく正しいパス（/volumes/detail?limit=1000）でモックAPIを呼び出し、API呼び出しパラメータ（'GET', expectedBaseUrl, '/volumes/detail?limit=1000'）が正しく引き渡されることを確認し、モックレスポンスと一致する戻り値を返すことができる", async () => {
			const largeResponse = JSON.stringify({
				volumes: Array.from({ length: 1000 }, (_, i) => ({
					id: `volume-${i}`,
					name: `test-volume-${i}`,
					status: "available",
					size: 100,
				})),
			});
			mockFormatResponse.mockResolvedValue(largeResponse);
			const path = "/volumes/detail?limit=1000";

			const result = await getVolume(path);

			expect(result).toBe(largeResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/volumes/detail?limit=1000",
			);
		});

		it("Volume API（長いパス）へのGETリクエストで非常に長いパス（100回繰り返された'very-long-id-'を含むパス）を処理する場合に、パス長の制限なく正しい長いパス（/volumes/very-long-id-...123）でモックAPIを呼び出し、API呼び出しパラメータ（'GET', expectedBaseUrl, longPath）が正しく引き渡されることを確認し、モックレスポンスと一致する戻り値を返すことができる", async () => {
			const longPath = `/volumes/detail/${"very-long-id-".repeat(100)}123`;
			const mockResponse = JSON.stringify({ volume: { id: "test" } });
			mockFormatResponse.mockResolvedValue(mockResponse);

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
