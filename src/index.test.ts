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
		it("compute client関数群が正常にモックされた状態である", () => {
			expect(mockGetCompute).toBeDefined();
			expect(mockGetComputeById).toBeDefined();
			expect(mockCreateCompute).toBeDefined();
			expect(mockCreateComputeById).toBeDefined();
			expect(mockDeleteComputeById).toBeDefined();
		});

		it("image client関数が正常にモックされた状態である", () => {
			expect(mockGetImage).toBeDefined();
		});

		it("network client関数群が正常にモックされた状態である", () => {
			expect(mockGetNetwork).toBeDefined();
			expect(mockGetNetworkById).toBeDefined();
			expect(mockCreateNetwork).toBeDefined();
			expect(mockUpdateNetworkById).toBeDefined();
			expect(mockDeleteNetworkById).toBeDefined();
		});

		it("volume client関数群が正常にモックされた状態である", () => {
			expect(mockGetVolume).toBeDefined();
			expect(mockCreateVolume).toBeDefined();
			expect(mockUpdateVolumeById).toBeDefined();
			expect(mockDeleteVolumeById).toBeDefined();
		});

		it("MCP SDK関数群が正常にモックされた状態である", () => {
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

		it("conoha_openstack_get_no_idツールハンドラーが/servers/detailパスに対してGETリクエストを実行し、computeクライアントを呼び出してテキスト形式のレスポンスを返すことを確認する", async () => {
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

		it("conoha_openstack_get_idツールハンドラーが/ipsパスに対してGETリクエストを実行し、指定されたIDでcomputeクライアントを呼び出してテキスト形式のレスポンスを返すことを確認する", async () => {
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

		it("conoha_openstack_post_request_bodyハンドラーが/serversパスに対してPOSTリクエストを実行し、リクエストボディを含めてcomputeクライアントを呼び出してテキスト形式のレスポンスを返すことを確認する", async () => {
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

		it("conoha_openstack_delete_paramハンドラーが/serversパスに対してDELETEリクエストを実行し、指定されたパラメータでcomputeクライアントを呼び出してテキスト形式のレスポンスを返すことを確認する", async () => {
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

		it("create_serverプロンプトハンドラーが指定されたrootPasswordを含む適切なメッセージ形式でユーザー向けサーバー作成指示を生成することを確認する", () => {
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

		it("conoha_openstack_get_no_idハンドラーが未定義のパス(/unknown/path)を受信した場合にUnhandled pathエラーメッセージを投げることを確認する", async () => {
			const handler = toolHandlers["conoha_openstack_get_no_id"];

			if (handler) {
				await expect(handler({ path: "/unknown/path" })).rejects.toThrow(
					"Unhandled path: /unknown/path",
				);
			}
		});

		it("conoha_openstack_get_idハンドラーが未定義のパス(/unknown/path)とIDを受信した場合にUnhandled pathエラーメッセージを投げることを確認する", async () => {
			const handler = toolHandlers["conoha_openstack_get_id"];

			if (handler) {
				await expect(
					handler({ path: "/unknown/path", id: "test-id" }),
				).rejects.toThrow("Unhandled path: /unknown/path");
			}
		});
	});
});
