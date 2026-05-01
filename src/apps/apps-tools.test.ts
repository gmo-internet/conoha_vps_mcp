/**
 * MCP Apps ツール統合テスト（オブジェクトストレージ）
 *
 * @remarks
 * McpServerにツール登録し、ハンドラーの動作を検証します。
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { registerAppsTools } from "./apps-tools";

/**
 * McpServerの内部ツールハンドラーを直接呼び出すヘルパー
 *
 * @remarks
 * registerToolで登録されたハンドラーを取り出して実行するため、
 * トランスポート接続なしでツール動作を検証できます。
 */
async function callTool(
	server: McpServer,
	toolName: string,
	args: Record<string, unknown>,
) {
	// biome-ignore lint/suspicious/noExplicitAny: SDK内部の_registeredToolsへのアクセス
	const registeredTools = (server as any)._registeredTools;
	const tool = registeredTools[toolName];
	if (!tool) {
		throw new Error(`ツール "${toolName}" が見つかりません`);
	}
	return await tool.handler(args, {});
}

describe("MCP Apps ツール登録", () => {
	let server: McpServer;

	beforeEach(() => {
		process.env.CONOHA_MCP_MOCK = "1";
		server = new McpServer({ name: "test", version: "0.0.1" });
		registerAppsTools(server);
	});

	afterEach(() => {
		delete process.env.CONOHA_MCP_MOCK;
	});

	it("ストレージ系の全ツールが登録される", () => {
		// biome-ignore lint/suspicious/noExplicitAny: SDK内部の_registeredToolsへのアクセス
		const registeredTools = (server as any)._registeredTools;
		const toolNames = Object.keys(registeredTools);
		expect(toolNames).toContain("list_containers");
		expect(toolNames).toContain("create_container");
		expect(toolNames).toContain("delete_container");
		expect(toolNames).toContain("list_objects");
		expect(toolNames).toContain("upload_object");
		expect(toolNames).toContain("delete_object");
	});
});

describe("list_containers", () => {
	let server: McpServer;

	beforeEach(() => {
		process.env.CONOHA_MCP_MOCK = "1";
		server = new McpServer({ name: "test", version: "0.0.1" });
		registerAppsTools(server);
	});

	afterEach(() => {
		delete process.env.CONOHA_MCP_MOCK;
	});

	it("モックモードで全コンテナを返す", async () => {
		const result = await callTool(server, "list_containers", {});
		expect(result.structuredContent.total).toBe(3);
		expect(result.structuredContent.containers).toHaveLength(3);
	});

	it("各コンテナにname/count/bytesが含まれる", async () => {
		const result = await callTool(server, "list_containers", {});
		for (const c of result.structuredContent.containers) {
			expect(c.name).toBeTypeOf("string");
			expect(c.count).toBeTypeOf("number");
			expect(c.bytes).toBeTypeOf("number");
		}
	});
});

describe("create_container", () => {
	let server: McpServer;

	beforeEach(() => {
		process.env.CONOHA_MCP_MOCK = "1";
		server = new McpServer({ name: "test", version: "0.0.1" });
		registerAppsTools(server);
	});

	afterEach(() => {
		delete process.env.CONOHA_MCP_MOCK;
	});

	it("正しい名前のコンテナを作成できる", async () => {
		const result = await callTool(server, "create_container", {
			name: "my-bucket",
		});
		const text = result.content[0].text;
		const data = JSON.parse(text);
		expect(data.container.name).toBe("my-bucket");
		expect(data.created).toBe(true);
	});

	it("zod inputSchema にコンテナ名の正規表現バリデーションが登録されている", () => {
		// biome-ignore lint/suspicious/noExplicitAny: SDK内部の_registeredToolsへのアクセス
		const registeredTools = (server as any)._registeredTools;
		const tool = registeredTools.create_container;
		expect(tool).toBeDefined();
		const nameSchema = tool.inputSchema?.shape?.name ?? tool.inputSchema?.name;
		expect(nameSchema).toBeDefined();
	});
});

describe("delete_container", () => {
	let server: McpServer;

	beforeEach(() => {
		process.env.CONOHA_MCP_MOCK = "1";
		server = new McpServer({ name: "test", version: "0.0.1" });
		registerAppsTools(server);
	});

	afterEach(() => {
		delete process.env.CONOHA_MCP_MOCK;
	});

	it("モックモードでコンテナ削除が成功する", async () => {
		const result = await callTool(server, "delete_container", {
			name: "my-bucket",
		});
		const data = JSON.parse(result.content[0].text);
		expect(data.container.name).toBe("my-bucket");
		expect(data.deleted).toBe(true);
	});
});

describe("list_objects", () => {
	let server: McpServer;

	beforeEach(() => {
		process.env.CONOHA_MCP_MOCK = "1";
		server = new McpServer({ name: "test", version: "0.0.1" });
		registerAppsTools(server);
	});

	afterEach(() => {
		delete process.env.CONOHA_MCP_MOCK;
	});

	it("モックモードで指定コンテナのオブジェクト一覧を返す", async () => {
		const result = await callTool(server, "list_objects", {
			container: "backups",
		});
		expect(result.structuredContent.container).toBe("backups");
		expect(result.structuredContent.total).toBeGreaterThan(0);
	});

	it("存在しないコンテナでは空の一覧を返す", async () => {
		const result = await callTool(server, "list_objects", {
			container: "nonexistent",
		});
		expect(result.structuredContent.total).toBe(0);
		expect(result.structuredContent.objects).toEqual([]);
	});

	it("各オブジェクトに name/bytes/content_type が含まれる", async () => {
		const result = await callTool(server, "list_objects", {
			container: "media-assets",
		});
		for (const o of result.structuredContent.objects) {
			expect(o.name).toBeTypeOf("string");
			expect(o.bytes).toBeTypeOf("number");
			expect(o.content_type).toBeTypeOf("string");
		}
	});
});

describe("upload_object", () => {
	let server: McpServer;

	beforeEach(() => {
		process.env.CONOHA_MCP_MOCK = "1";
		server = new McpServer({ name: "test", version: "0.0.1" });
		registerAppsTools(server);
	});

	afterEach(() => {
		delete process.env.CONOHA_MCP_MOCK;
	});

	it("モックモードで Base64 を渡すとアップロード成功応答を返す", async () => {
		// "hello" の Base64
		const result = await callTool(server, "upload_object", {
			container: "backups",
			object_name: "hello.txt",
			content_base64: "aGVsbG8=",
			content_type: "text/plain",
		});
		const data = JSON.parse(result.content[0].text);
		expect(data.uploaded).toBe(true);
		expect(data.object.name).toBe("hello.txt");
		expect(data.object.content_type).toBe("text/plain");
	});

	it("content_type 省略時は application/octet-stream を返す", async () => {
		const result = await callTool(server, "upload_object", {
			container: "backups",
			object_name: "binary.bin",
			content_base64: "AQID",
		});
		const data = JSON.parse(result.content[0].text);
		expect(data.object.content_type).toBe("application/octet-stream");
	});
});

describe("delete_object", () => {
	let server: McpServer;

	beforeEach(() => {
		process.env.CONOHA_MCP_MOCK = "1";
		server = new McpServer({ name: "test", version: "0.0.1" });
		registerAppsTools(server);
	});

	afterEach(() => {
		delete process.env.CONOHA_MCP_MOCK;
	});

	it("モックモードで削除成功応答を返す", async () => {
		const result = await callTool(server, "delete_object", {
			container: "backups",
			object_name: "hello.txt",
		});
		const data = JSON.parse(result.content[0].text);
		expect(data.deleted).toBe(true);
		expect(data.object.name).toBe("hello.txt");
	});
});
