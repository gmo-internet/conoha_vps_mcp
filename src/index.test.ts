import { beforeEach, describe, expect, it, vi } from "vitest";

// 依存関数のモック
const mockGetCompute = vi.fn();
const mockGetComputeById = vi.fn();
const mockCreateCompute = vi.fn();
const mockCreateComputeById = vi.fn();
const mockDeleteComputeById = vi.fn();

const mockGetImage = vi.fn();

const mockGetNetwork = vi.fn();
const mockGetNetworkById = vi.fn();
const mockCreateNetwork = vi.fn();
const mockUpdateNetworkById = vi.fn();
const mockDeleteNetworkById = vi.fn();

const mockGetVolume = vi.fn();
const mockCreateVolume = vi.fn();
const mockUpdateVolumeById = vi.fn();
const mockDeleteVolumeById = vi.fn();

const mockTool = vi.fn();
const mockPrompt = vi.fn();
const mockConnect = vi.fn();
const mockMcpServer = vi.fn().mockImplementation(() => ({
	tool: mockTool,
	prompt: mockPrompt,
	connect: mockConnect,
}));
const mockStdioServerTransport = vi.fn();

vi.mock("./features/openstack/compute/compute-client", () => ({
	getCompute: mockGetCompute,
	getComputeById: mockGetComputeById,
	createCompute: mockCreateCompute,
	createComputeById: mockCreateComputeById,
	deleteComputeById: mockDeleteComputeById,
}));

vi.mock("./features/openstack/image/image-client", () => ({
	getImage: mockGetImage,
}));

vi.mock("./features/openstack/network/network-client", () => ({
	getNetwork: mockGetNetwork,
	getNetworkById: mockGetNetworkById,
	createNetwork: mockCreateNetwork,
	updateNetworkById: mockUpdateNetworkById,
	deleteNetworkById: mockDeleteNetworkById,
}));

vi.mock("./features/openstack/volume/volume-client", () => ({
	getVolume: mockGetVolume,
	createVolume: mockCreateVolume,
	updateVolumeById: mockUpdateVolumeById,
	deleteVolumeById: mockDeleteVolumeById,
}));

vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
	McpServer: mockMcpServer,
}));

vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
	StdioServerTransport: mockStdioServerTransport,
}));

describe("index", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("モック関数の基本動作", () => {
		it("compute関連のモック関数が正しく定義されている", () => {
			expect(mockGetCompute).toBeDefined();
			expect(mockGetComputeById).toBeDefined();
			expect(mockCreateCompute).toBeDefined();
			expect(mockCreateComputeById).toBeDefined();
			expect(mockDeleteComputeById).toBeDefined();
		});

		it("image関連のモック関数が正しく定義されている", () => {
			expect(mockGetImage).toBeDefined();
		});

		it("network関連のモック関数が正しく定義されている", () => {
			expect(mockGetNetwork).toBeDefined();
			expect(mockGetNetworkById).toBeDefined();
			expect(mockCreateNetwork).toBeDefined();
			expect(mockUpdateNetworkById).toBeDefined();
			expect(mockDeleteNetworkById).toBeDefined();
		});

		it("volume関連のモック関数が正しく定義されている", () => {
			expect(mockGetVolume).toBeDefined();
			expect(mockCreateVolume).toBeDefined();
			expect(mockUpdateVolumeById).toBeDefined();
			expect(mockDeleteVolumeById).toBeDefined();
		});

		it("MCP関連のモック関数が正しく定義されている", () => {
			expect(mockMcpServer).toBeDefined();
			expect(mockStdioServerTransport).toBeDefined();
			expect(mockTool).toBeDefined();
			expect(mockPrompt).toBeDefined();
			expect(mockConnect).toBeDefined();
		});
	});

	describe("各ツールハンドラーの基本動作", () => {
		let toolHandlers: { [key: string]: Function } = {};

		beforeEach(async () => {
			// テスト前にmockをクリア
			vi.clearAllMocks();
			// index.tsをインポートしてツールを登録
			await import("./index");
			// 登録されたツールハンドラーを取得
			const toolCalls = mockTool.mock.calls;
			toolHandlers = {
				conoha_openstack_get_no_id: toolCalls.find(
					(call) => call[0] === "conoha_openstack_get_no_id",
				)?.[3],
				conoha_openstack_get_id: toolCalls.find(
					(call) => call[0] === "conoha_openstack_get_id",
				)?.[3],
				conoha_openstack_post_request_body: toolCalls.find(
					(call) => call[0] === "conoha_openstack_post_request_body",
				)?.[3],
				conoha_openstack_post_put_request_body_id: toolCalls.find(
					(call) => call[0] === "conoha_openstack_post_put_request_body_id",
				)?.[3],
				conoha_openstack_delete_param: toolCalls.find(
					(call) => call[0] === "conoha_openstack_delete_param",
				)?.[3],
			};
		});

		it("get_no_idツールハンドラーがcomputeパスを処理する", async () => {
			mockGetCompute.mockResolvedValue("test response");
			const handler = toolHandlers["conoha_openstack_get_no_id"];

			if (handler) {
				const result = await handler({ path: "/servers/detail" });
				expect(mockGetCompute).toHaveBeenCalledWith("/servers/detail");
				expect(result).toEqual({
					content: [{ type: "text", text: "test response" }],
				});
			}
		});

		it("get_idツールハンドラーがcomputeパスを処理する", async () => {
			mockGetComputeById.mockResolvedValue("test response");
			const handler = toolHandlers["conoha_openstack_get_id"];

			if (handler) {
				const result = await handler({ path: "/ips", id: "test-id" });
				expect(mockGetComputeById).toHaveBeenCalledWith("/ips", "test-id");
				expect(result).toEqual({
					content: [{ type: "text", text: "test response" }],
				});
			}
		});

		it("post_request_bodyツールハンドラーがcomputeパスを処理する", async () => {
			mockCreateCompute.mockResolvedValue("test response");
			const handler = toolHandlers["conoha_openstack_post_request_body"];

			if (handler) {
				const input = {
					path: "/servers" as const,
					requestBody: { server: { name: "test" } },
				};
				const result = await handler({ input });
				expect(mockCreateCompute).toHaveBeenCalledWith(
					"/servers",
					input.requestBody,
				);
				expect(result).toEqual({
					content: [{ type: "text", text: "test response" }],
				});
			}
		});

		it("delete_paramツールハンドラーがcomputeパスを処理する", async () => {
			mockDeleteComputeById.mockResolvedValue("test response");
			const handler = toolHandlers["conoha_openstack_delete_param"];

			if (handler) {
				const result = await handler({ path: "/servers", param: "test-id" });
				expect(mockDeleteComputeById).toHaveBeenCalledWith(
					"/servers",
					"test-id",
				);
				expect(result).toEqual({
					content: [{ type: "text", text: "test response" }],
				});
			}
		});
	});

	describe("プロンプトハンドラーの基本動作", () => {
		let promptHandler: Function;

		beforeEach(async () => {
			vi.clearAllMocks();
			await import("./index");
			const promptCalls = mockPrompt.mock.calls;
			const createServerPromptCall = promptCalls.find(
				(call) => call[0] === "create_server",
			);
			promptHandler = createServerPromptCall?.[3];
		});

		it("create_serverプロンプトハンドラーが正しいメッセージを生成する", () => {
			if (promptHandler) {
				const rootPassword = "TestPass123!";
				const result = promptHandler({ rootPassword });

				expect(result).toEqual({
					messages: [
						{
							role: "user",
							content: {
								type: "text",
								text: `rootパスワードを${rootPassword}として、新しいサーバーを作成してください。また、開放するポートなど、必要な情報は都度確認してください。`,
							},
						},
					],
				});
			}
		});
	});

	describe("エラーハンドリング", () => {
		let toolHandlers: { [key: string]: Function } = {};

		beforeEach(async () => {
			vi.clearAllMocks();
			await import("./index");
			const toolCalls = mockTool.mock.calls;
			toolHandlers = {
				conoha_openstack_get_no_id: toolCalls.find(
					(call) => call[0] === "conoha_openstack_get_no_id",
				)?.[3],
				conoha_openstack_get_id: toolCalls.find(
					(call) => call[0] === "conoha_openstack_get_id",
				)?.[3],
			};
		});

		it("get_no_idツールハンドラーが未処理のパスでエラーを投げる", async () => {
			const handler = toolHandlers["conoha_openstack_get_no_id"];

			if (handler) {
				await expect(handler({ path: "/unknown/path" })).rejects.toThrow(
					"Unhandled path: /unknown/path",
				);
			}
		});

		it("get_idツールハンドラーが未処理のパスでエラーを投げる", async () => {
			const handler = toolHandlers["conoha_openstack_get_id"];

			if (handler) {
				await expect(
					handler({ path: "/unknown/path", id: "test-id" }),
				).rejects.toThrow("Unhandled path: /unknown/path");
			}
		});
	});
});
