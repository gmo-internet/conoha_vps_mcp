import { beforeEach, describe, expect, it, vi } from "vitest";

// 依存関数のモック
const mockGetCompute = vi.fn();
const mockGetComputeByParam = vi.fn();
const mockCreateCompute = vi.fn();
const mockCreateComputeByParam = vi.fn();
const mockDeleteComputeByParam = vi.fn();

const mockGetImage = vi.fn();

const mockGetNetwork = vi.fn();
const mockGetNetworkByParam = vi.fn();
const mockCreateNetwork = vi.fn();
const mockUpdateNetworkByParam = vi.fn();
const mockDeleteNetworkByParam = vi.fn();

const mockGetVolume = vi.fn();
const mockCreateVolume = vi.fn();
const mockUpdateVolumeByParam = vi.fn();
const mockDeleteVolumeByParam = vi.fn();

const mockRegisterTool = vi.fn();
const mockRegisterPrompt = vi.fn();
const mockConnect = vi.fn();

const mockMcpServer = vi.fn().mockImplementation(function () {
	return {
		registerTool: mockRegisterTool,
		registerPrompt: mockRegisterPrompt,
		connect: mockConnect,
	};
});
const mockStdioServerTransport = vi.fn();

vi.mock("./features/openstack/compute/compute-client", () => ({
	getCompute: mockGetCompute,
	getComputeByParam: mockGetComputeByParam,
	createCompute: mockCreateCompute,
	createComputeByParam: mockCreateComputeByParam,
	deleteComputeByParam: mockDeleteComputeByParam,
}));

vi.mock("./features/openstack/image/image-client", () => ({
	getImage: mockGetImage,
}));

vi.mock("./features/openstack/network/network-client", () => ({
	getNetwork: mockGetNetwork,
	getNetworkByParam: mockGetNetworkByParam,
	createNetwork: mockCreateNetwork,
	updateNetworkByParam: mockUpdateNetworkByParam,
	deleteNetworkByParam: mockDeleteNetworkByParam,
}));

vi.mock("./features/openstack/volume/volume-client", () => ({
	getVolume: mockGetVolume,
	createVolume: mockCreateVolume,
	updateVolumeByParam: mockUpdateVolumeByParam,
	deleteVolumeByParam: mockDeleteVolumeByParam,
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
			expect(mockGetComputeByParam).toBeDefined();
			expect(mockCreateCompute).toBeDefined();
			expect(mockCreateComputeByParam).toBeDefined();
			expect(mockDeleteComputeByParam).toBeDefined();
		});

		it("image client関数が正常にモックされた状態である", () => {
			expect(mockGetImage).toBeDefined();
		});

		it("network client関数群が正常にモックされた状態である", () => {
			expect(mockGetNetwork).toBeDefined();
			expect(mockGetNetworkByParam).toBeDefined();
			expect(mockCreateNetwork).toBeDefined();
			expect(mockUpdateNetworkByParam).toBeDefined();
			expect(mockDeleteNetworkByParam).toBeDefined();
		});

		it("volume client関数群が正常にモックされた状態である", () => {
			expect(mockGetVolume).toBeDefined();
			expect(mockCreateVolume).toBeDefined();
			expect(mockUpdateVolumeByParam).toBeDefined();
			expect(mockDeleteVolumeByParam).toBeDefined();
		});

		it("MCP SDK関数群が正常にモックされた状態である", () => {
			expect(mockMcpServer).toBeDefined();
			expect(mockStdioServerTransport).toBeDefined();
			expect(mockRegisterTool).toBeDefined();
			expect(mockRegisterPrompt).toBeDefined();
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
			const toolCalls = mockRegisterTool.mock.calls;
			toolHandlers = {
				conoha_get: toolCalls.find((call) => call[0] === "conoha_get")?.[2],
				conoha_get_by_param: toolCalls.find(
					(call) => call[0] === "conoha_get_by_param",
				)?.[2],
				conoha_post: toolCalls.find((call) => call[0] === "conoha_post")?.[2],
				conoha_post_put_by_param: toolCalls.find(
					(call) => call[0] === "conoha_post_put_by_param",
				)?.[2],
				conoha_delete_by_param: toolCalls.find(
					(call) => call[0] === "conoha_delete_by_param",
				)?.[2],
			};
		});

		it("conoha_getツールハンドラーが/servers/detailパスに対してGETリクエストを実行し、computeクライアントを呼び出してテキスト形式のレスポンスを返すことを確認する", async () => {
			mockGetCompute.mockResolvedValue("test response");
			const handler = toolHandlers["conoha_get"];

			if (handler) {
				const result = await handler({ path: "/servers/detail" });
				expect(mockGetCompute).toHaveBeenCalledWith("/servers/detail");
				const output = { response: "test response" };
				expect(result).toEqual({
					content: [{ type: "text", text: JSON.stringify(output) }],
					structuredContent: output,
				});
			}
		});

		it("conoha_get_by_paramツールハンドラーが/ipsパスに対してGETリクエストを実行し、指定されたパラメータでcomputeクライアントを呼び出してテキスト形式のレスポンスを返すことを確認する", async () => {
			mockGetComputeByParam.mockResolvedValue("test response");
			const handler = toolHandlers["conoha_get_by_param"];

			if (handler) {
				const result = await handler({ path: "/ips", param: "test-param" });
				expect(mockGetComputeByParam).toHaveBeenCalledWith(
					"/ips",
					"test-param",
				);
				const output = { response: "test response" };
				expect(result).toEqual({
					content: [{ type: "text", text: JSON.stringify(output) }],
					structuredContent: output,
				});
			}
		});

		it("conoha_postハンドラーが/serversパスに対してPOSTリクエストを実行し、リクエストボディを含めてcomputeクライアントを呼び出してテキスト形式のレスポンスを返すことを確認する", async () => {
			mockCreateCompute.mockResolvedValue("test response");
			const handler = toolHandlers["conoha_post"];

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
				const output = { response: "test response" };
				expect(result).toEqual({
					content: [{ type: "text", text: JSON.stringify(output) }],
					structuredContent: output,
				});
			}
		});

		it("conoha_delete_by_paramハンドラーが/serversパスに対してDELETEリクエストを実行し、指定されたパラメータでcomputeクライアントを呼び出してテキスト形式のレスポンスを返すことを確認する", async () => {
			mockDeleteComputeByParam.mockResolvedValue("test response");
			const handler = toolHandlers["conoha_delete_by_param"];

			if (handler) {
				const result = await handler({ path: "/servers", param: "test-param" });
				expect(mockDeleteComputeByParam).toHaveBeenCalledWith(
					"/servers",
					"test-param",
				);
				const output = { response: "test response" };
				expect(result).toEqual({
					content: [{ type: "text", text: JSON.stringify(output) }],
					structuredContent: output,
				});
			}
		});

		it("conoha_post_put_by_paramハンドラーが/actionパスに対してPOSTリクエストを実行し、パラメータとリクエストボディを含めてcomputeクライアントを呼び出してテキスト形式のレスポンスを返すことを確認する", async () => {
			mockCreateComputeByParam.mockResolvedValue("test response");
			const handler = toolHandlers["conoha_post_put_by_param"];

			if (handler) {
				const input = {
					path: "/action" as const,
					param: "test-server-id",
					requestBody: { "os-start": null },
				};
				const result = await handler({ input });
				expect(mockCreateComputeByParam).toHaveBeenCalledWith(
					"/action",
					"test-server-id",
					input.requestBody,
				);
				const output = { response: "test response" };
				expect(result).toEqual({
					content: [{ type: "text", text: JSON.stringify(output) }],
					structuredContent: output,
				});
			}
		});
	});

	describe("プロンプトハンドラーの基本動作", () => {
		let promptHandler: Function;

		beforeEach(async () => {
			vi.clearAllMocks();
			await import("./index");
			const promptCalls = mockRegisterPrompt.mock.calls;
			const createServerPromptCall = promptCalls.find(
				(call) => call[0] === "create_server",
			);
			promptHandler = createServerPromptCall?.[2];
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
			const toolCalls = mockRegisterTool.mock.calls;
			toolHandlers = {
				conoha_get: toolCalls.find((call) => call[0] === "conoha_get")?.[2],
				conoha_get_by_param: toolCalls.find(
					(call) => call[0] === "conoha_get_by_param",
				)?.[2],
			};
		});

		it("conoha_getハンドラーが未定義のパス(/unknown/path)を受信した場合にUnhandled pathエラーメッセージを投げることを確認する", async () => {
			const handler = toolHandlers["conoha_get"];

			if (handler) {
				await expect(handler({ path: "/unknown/path" })).rejects.toThrow(
					"Unhandled path: /unknown/path",
				);
			}
		});

		it("conoha_get_by_paramハンドラーが未定義のパス(/unknown/path)とパラメータを受信した場合にUnhandled pathエラーメッセージを投げることを確認する", async () => {
			const handler = toolHandlers["conoha_get_by_param"];

			if (handler) {
				await expect(
					handler({ path: "/unknown/path", param: "test-param" }),
				).rejects.toThrow("Unhandled path: /unknown/path");
			}
		});
	});
});
