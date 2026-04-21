/**
 * MCP Apps ツール統合テスト
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
	const registeredTools = (server as any)._registeredTools;
	const tool = registeredTools[toolName];
	if (!tool) {
		throw new Error(`ツール "${toolName}" が見つかりません`);
	}
	return await tool.handler(args, {} as any);
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

	it("6個のツールが登録される", () => {
		const registeredTools = (server as any)._registeredTools;
		const toolNames = Object.keys(registeredTools);
		expect(toolNames).toContain("list_servers");
		expect(toolNames).toContain("get_server");
		expect(toolNames).toContain("list_volumes");
		expect(toolNames).toContain("list_images");
		expect(toolNames).toContain("list_security_groups");
		expect(toolNames).toContain("get_server_metrics");
	});
});

describe("list_servers", () => {
	let server: McpServer;

	beforeEach(() => {
		process.env.CONOHA_MCP_MOCK = "1";
		server = new McpServer({ name: "test", version: "0.0.1" });
		registerAppsTools(server);
	});

	afterEach(() => {
		delete process.env.CONOHA_MCP_MOCK;
	});

	it("引数なしで全サーバーを返す", async () => {
		const result = await callTool(server, "list_servers", {});
		expect(result.structuredContent.total).toBe(5);
		expect(result.structuredContent.servers).toHaveLength(5);
	});

	it("status=runningでフィルタリングできる", async () => {
		const result = await callTool(server, "list_servers", {
			status: "running",
		});
		expect(result.structuredContent.total).toBe(3);
		for (const s of result.structuredContent.servers) {
			expect(s.status).toBe("running");
		}
	});

	it("status=stoppedでフィルタリングできる", async () => {
		const result = await callTool(server, "list_servers", {
			status: "stopped",
		});
		expect(result.structuredContent.total).toBe(1);
		expect(result.structuredContent.servers[0].name).toBe("batch-worker-02");
	});

	it("status=buildingでフィルタリングできる", async () => {
		const result = await callTool(server, "list_servers", {
			status: "building",
		});
		expect(result.structuredContent.total).toBe(1);
		expect(result.structuredContent.servers[0].name).toBe("ml-experiment-03");
	});

	it("冪等性: 同じ引数で複数回呼んでも同じ結果を返す", async () => {
		const result1 = await callTool(server, "list_servers", {});
		const result2 = await callTool(server, "list_servers", {});
		expect(result1.structuredContent).toEqual(result2.structuredContent);
	});
});

describe("get_server", () => {
	let server: McpServer;

	beforeEach(() => {
		process.env.CONOHA_MCP_MOCK = "1";
		server = new McpServer({ name: "test", version: "0.0.1" });
		registerAppsTools(server);
	});

	afterEach(() => {
		delete process.env.CONOHA_MCP_MOCK;
	});

	it("存在するサーバーIDで詳細を返す", async () => {
		const result = await callTool(server, "get_server", {
			server_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
		});
		expect(result.structuredContent.server).not.toBeNull();
		expect(result.structuredContent.server.name).toBe("web-prod-01");
		expect(result.structuredContent.server.vcpu).toBe(4);
	});

	it("存在しないサーバーIDでエラーを返す", async () => {
		const result = await callTool(server, "get_server", {
			server_id: "nonexistent-id",
		});
		expect(result.isError).toBe(true);
	});

	it("冪等性: 同じIDで複数回呼んでも同じ結果を返す", async () => {
		const id = "c3d4e5f6-a7b8-9012-cdef-123456789012";
		const result1 = await callTool(server, "get_server", { server_id: id });
		const result2 = await callTool(server, "get_server", { server_id: id });
		expect(result1.structuredContent).toEqual(result2.structuredContent);
	});
});

describe("list_volumes", () => {
	let server: McpServer;

	beforeEach(() => {
		process.env.CONOHA_MCP_MOCK = "1";
		server = new McpServer({ name: "test", version: "0.0.1" });
		registerAppsTools(server);
	});

	afterEach(() => {
		delete process.env.CONOHA_MCP_MOCK;
	});

	it("引数なしで全ボリュームを返す", async () => {
		const result = await callTool(server, "list_volumes", {});
		expect(result.structuredContent.total).toBe(3);
	});

	it("status=in-useでフィルタリングできる", async () => {
		const result = await callTool(server, "list_volumes", {
			status: "in-use",
		});
		expect(result.structuredContent.total).toBe(2);
		for (const v of result.structuredContent.volumes) {
			expect(v.status).toBe("in-use");
		}
	});

	it("status=availableでフィルタリングできる", async () => {
		const result = await callTool(server, "list_volumes", {
			status: "available",
		});
		expect(result.structuredContent.total).toBe(1);
	});

	it("各ボリュームに必須フィールドが含まれる", async () => {
		const result = await callTool(server, "list_volumes", {});
		for (const v of result.structuredContent.volumes) {
			expect(v.id).toBeTypeOf("string");
			expect(v.name).toBeTypeOf("string");
			expect(v.size_gb).toBeTypeOf("number");
			expect(v.volume_type).toBeTypeOf("string");
			expect(v.created_at).toBeTypeOf("string");
		}
	});

	it("in-useボリュームにはattached_toが設定される", async () => {
		const result = await callTool(server, "list_volumes", {
			status: "in-use",
		});
		for (const v of result.structuredContent.volumes) {
			expect(v.attached_to).not.toBeNull();
		}
	});
});

describe("list_images", () => {
	let server: McpServer;

	beforeEach(() => {
		process.env.CONOHA_MCP_MOCK = "1";
		server = new McpServer({ name: "test", version: "0.0.1" });
		registerAppsTools(server);
	});

	afterEach(() => {
		delete process.env.CONOHA_MCP_MOCK;
	});

	it("引数なしで全イメージを返す", async () => {
		const result = await callTool(server, "list_images", {});
		expect(result.structuredContent.total).toBe(5);
	});

	it("os_type=linuxでフィルタリングできる", async () => {
		const result = await callTool(server, "list_images", {
			os_type: "linux",
		});
		expect(result.structuredContent.total).toBe(4);
		for (const i of result.structuredContent.images) {
			expect(i.os_type).toBe("linux");
		}
	});

	it("os_type=windowsでフィルタリングできる", async () => {
		const result = await callTool(server, "list_images", {
			os_type: "windows",
		});
		expect(result.structuredContent.total).toBe(1);
	});

	it("各イメージにサイズと最小ディスク情報が含まれる", async () => {
		const result = await callTool(server, "list_images", {});
		for (const i of result.structuredContent.images) {
			expect(i.size_mb).toBeTypeOf("number");
			expect(i.min_disk_gb).toBeTypeOf("number");
			expect(i.size_mb).toBeGreaterThanOrEqual(0);
		}
	});
});

describe("list_security_groups", () => {
	let server: McpServer;

	beforeEach(() => {
		process.env.CONOHA_MCP_MOCK = "1";
		server = new McpServer({ name: "test", version: "0.0.1" });
		registerAppsTools(server);
	});

	afterEach(() => {
		delete process.env.CONOHA_MCP_MOCK;
	});

	it("全セキュリティグループを返す", async () => {
		const result = await callTool(server, "list_security_groups", {});
		expect(result.structuredContent.total).toBe(3);
		expect(result.structuredContent.security_groups).toHaveLength(3);
	});

	it("各グループにルールが含まれる", async () => {
		const result = await callTool(server, "list_security_groups", {});
		for (const sg of result.structuredContent.security_groups) {
			expect(sg.rules).toBeInstanceOf(Array);
			expect(sg.rules.length).toBeGreaterThan(0);
		}
	});

	it("ルールにdirection・protocol・port_range・remote_ipが含まれる", async () => {
		const result = await callTool(server, "list_security_groups", {});
		for (const sg of result.structuredContent.security_groups) {
			for (const rule of sg.rules) {
				expect(rule.direction).toMatch(/^(ingress|egress)$/);
				expect(rule).toHaveProperty("protocol");
				expect(rule).toHaveProperty("port_range");
				expect(rule.remote_ip).toBeTypeOf("string");
			}
		}
	});

	it("rules_countがルール配列の長さと一致する", async () => {
		const result = await callTool(server, "list_security_groups", {});
		for (const sg of result.structuredContent.security_groups) {
			expect(sg.rules_count).toBe(sg.rules.length);
		}
	});
});

describe("get_server_metrics", () => {
	let server: McpServer;

	beforeEach(() => {
		process.env.CONOHA_MCP_MOCK = "1";
		server = new McpServer({ name: "test", version: "0.0.1" });
		registerAppsTools(server);
	});

	afterEach(() => {
		delete process.env.CONOHA_MCP_MOCK;
	});

	it("存在するサーバーIDでメトリクスを返す", async () => {
		const result = await callTool(server, "get_server_metrics", {
			server_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
		});
		const metrics = result.structuredContent.metrics;
		expect(metrics).not.toBeNull();
		expect(metrics.cpu_usage_percent).toBeTypeOf("number");
		expect(metrics.memory_usage_percent).toBeTypeOf("number");
		expect(metrics.disk_usage_percent).toBeTypeOf("number");
		expect(metrics.network_in_mbps).toBeTypeOf("number");
		expect(metrics.network_out_mbps).toBeTypeOf("number");
		expect(metrics.timestamp).toBeTypeOf("string");
	});

	it("存在しないサーバーIDでエラーを返す", async () => {
		const result = await callTool(server, "get_server_metrics", {
			server_id: "nonexistent-id",
		});
		expect(result.isError).toBe(true);
	});

	it("冪等性: 同じIDで複数回呼んでも同じ結果を返す", async () => {
		const id = "c3d4e5f6-a7b8-9012-cdef-123456789012";
		const r1 = await callTool(server, "get_server_metrics", {
			server_id: id,
		});
		const r2 = await callTool(server, "get_server_metrics", {
			server_id: id,
		});
		expect(r1.structuredContent).toEqual(r2.structuredContent);
	});
});
