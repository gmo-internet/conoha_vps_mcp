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

	it("各イメージにサイズと最小ディスク・最小メモリ情報が含まれる", async () => {
		const result = await callTool(server, "list_images", {});
		for (const i of result.structuredContent.images) {
			expect(i.size_mb).toBeTypeOf("number");
			expect(i.min_disk_gb).toBeTypeOf("number");
			expect(i.min_ram_mb).toBeTypeOf("number");
			expect(i.size_mb).toBeGreaterThanOrEqual(0);
		}
	});

	it("dst_name/dst_version/service_typeなどのメタデータがレスポンスに含まれる", async () => {
		const result = await callTool(server, "list_images", {});
		const ubuntu = result.structuredContent.images.find(
			(i: { id: string }) => i.id === "img-ubuntu-2404",
		);
		expect(ubuntu?.dst_name).toBe("Ubuntu");
		expect(ubuntu?.dst_version).toBe("24.04");
		expect(ubuntu?.service_type).toBe("vps");
	});
});

describe("mapNovaServerToAppServer", () => {
	it("ConoHa が vm-xxxxxxxx-xx 形式に上書きした name よりも metadata.instance_name_tag をユーザー表示名として優先する", async () => {
		const { mapNovaServerToAppServer } = await import("./apps-tools");
		const result = mapNovaServerToAppServer({
			id: "srv-1",
			name: "vm-0cfcbb00-1d",
			status: "ACTIVE",
			metadata: { instance_name_tag: "ConoHa-MCPApp-PoC-test-02" },
			flavor: { id: "flv-1" },
			addresses: {},
			created: "2026-04-28T02:31:40Z",
		});
		expect(result.name).toBe("ConoHa-MCPApp-PoC-test-02");
	});

	it("instance_name_tag が未設定の場合は Nova の name にフォールバックする", async () => {
		const { mapNovaServerToAppServer } = await import("./apps-tools");
		const result = mapNovaServerToAppServer({
			id: "srv-2",
			name: "vm-fallback",
			status: "ACTIVE",
			metadata: {},
			flavor: { id: "flv-1" },
			addresses: {},
			created: "2026-04-28T02:31:40Z",
		});
		expect(result.name).toBe("vm-fallback");
	});

	it("metadata.image_name を OS フィールドにマップする", async () => {
		const { mapNovaServerToAppServer } = await import("./apps-tools");
		const result = mapNovaServerToAppServer({
			id: "srv-3",
			name: "vm-3",
			status: "ACTIVE",
			metadata: {
				instance_name_tag: "test-server",
				image_name: "vmi-ubuntu-24.04-amd64",
			},
			flavor: { id: "flv-1" },
			addresses: {},
			created: "2026-04-28T02:31:40Z",
		});
		expect(result.os).toBe("vmi-ubuntu-24.04-amd64");
	});
});

describe("mapGlanceImageToAppImage", () => {
	it("ConoHa Glance APIの tags 配列を AppImage のメタデータフィールドに展開する", async () => {
		const { mapGlanceImageToAppImage } = await import("./apps-tools");
		const result = mapGlanceImageToAppImage({
			id: "img-1",
			name: "vmi-rails-8.1.0-ubuntu-24.04-amd64",
			osType: "linux",
			minDisk: 30,
			minRam: 1024,
			tags: [
				"service_type=vps",
				"app_version=8.1.0",
				"app_name=Ruby_on_Rails",
				"display_order=280",
			],
		});
		expect(result.app_name).toBe("Ruby_on_Rails");
		expect(result.app_version).toBe("8.1.0");
		expect(result.service_type).toBe("vps");
		// display_order のような未対応キーは AppImage に展開されない
		expect(result).not.toHaveProperty("display_order");
	});

	it("ConoHa の osType フィールドからLinux/Windowsを判定する", async () => {
		const { mapGlanceImageToAppImage } = await import("./apps-tools");
		const win = mapGlanceImageToAppImage({
			id: "img-2",
			name: "vmi-win-2022dce-amd64",
			osType: "windows",
		});
		expect(win.os_type).toBe("windows");

		const linux = mapGlanceImageToAppImage({
			id: "img-3",
			name: "vmi-ubuntu-24.04-amd64",
			osType: "linux",
		});
		expect(linux.os_type).toBe("linux");
	});

	it("tags が未定義でもクラッシュせず、メタデータ無しのAppImageを返す", async () => {
		const { mapGlanceImageToAppImage } = await import("./apps-tools");
		const result = mapGlanceImageToAppImage({
			id: "img-4",
			name: "vmi-custom",
		});
		expect(result.id).toBe("img-4");
		expect(result.dst_name).toBeUndefined();
		expect(result.app_name).toBeUndefined();
	});

	it("'='を含む tag 値は最初の'='のみ区切りとして扱う", async () => {
		const { mapGlanceImageToAppImage } = await import("./apps-tools");
		const result = mapGlanceImageToAppImage({
			id: "img-5",
			name: "vmi-test",
			tags: ["app_version=1.0=beta"],
		});
		expect(result.app_version).toBe("1.0=beta");
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
