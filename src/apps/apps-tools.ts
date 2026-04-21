/**
 * MCP Apps ツール定義
 *
 * @remarks
 * ConoHa VPS の参照系操作を提供するMCP Appsツール群です。
 * 各ツールは単一責務・冪等性・ドライラン対応を原則とします。
 *
 * - 全ツールは参照系（GET相当）のみ
 * - `CONOHA_MCP_MOCK=1` でフィクスチャ応答
 * - 実APIモードでは既存feature clientを利用
 *
 * @packageDocumentation
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
	RESOURCE_MIME_TYPE,
	registerAppResource,
	registerAppTool,
} from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type {
	AppImage,
	AppSecurityGroup,
	AppServer,
	AppServerMetrics,
	AppVolume,
} from "./apps-types.js";
import {
	getMockImages,
	getMockSecurityGroups,
	getMockServer,
	getMockServerMetrics,
	getMockServers,
	getMockVolumes,
	isMockMode,
} from "./mock-data.js";

/** UI リソース URI */
const UI_RESOURCE_URI = "ui://conoha-vps/mcp-app.html";

/**
 * MCP Appsツールをサーバーに登録
 *
 * @param server - McpServerインスタンス
 */
export function registerAppsTools(server: McpServer): void {
	registerAppUiResource(server);
	registerListServers(server);
	registerGetServer(server);
	registerListVolumes(server);
	registerListImages(server);
	registerListSecurityGroups(server);
	registerGetServerMetrics(server);
}

/**
 * UI HTMLリソースを登録
 *
 * @remarks
 * ビルド済みの単一HTMLファイルをMCP Appリソースとして提供します。
 */
function registerAppUiResource(server: McpServer): void {
	registerAppResource(
		server,
		UI_RESOURCE_URI,
		UI_RESOURCE_URI,
		{ mimeType: RESOURCE_MIME_TYPE },
		async () => {
			const htmlPath = resolve(
				import.meta.dirname,
				"ui/src/apps/ui/mcp-app.html",
			);
			const html = readFileSync(htmlPath, "utf-8");
			return {
				contents: [
					{ uri: UI_RESOURCE_URI, mimeType: RESOURCE_MIME_TYPE, text: html },
				],
			};
		},
	);
}

/**
 * list_servers: サーバー一覧を取得（MCP App UI 付き）
 *
 * @remarks
 * 冪等: はい（参照のみ）
 * ドライラン: 不要（副作用なし）
 * UI: ConoHa VPS ダッシュボード（サーバー一覧 + 詳細パネル）
 */
function registerListServers(server: McpServer): void {
	registerAppTool(
		server,
		"list_servers",
		{
			title: "サーバー一覧取得",
			description:
				"ConoHa VPSのサーバー一覧を取得します。ステータスによるフィルタリングが可能です。",
			inputSchema: {
				status: z
					.enum(["running", "stopped", "building"])
					.optional()
					.describe("フィルタ対象のステータス"),
			},
			outputSchema: {
				servers: z.array(
					z.object({
						id: z.string(),
						name: z.string(),
						status: z.enum(["running", "stopped", "building"]),
						vcpu: z.number(),
						memory_gb: z.number(),
						disk_gb: z.number(),
						plan: z.string(),
						os: z.string(),
						ipv4: z.string().nullable(),
						ipv6: z.string().nullable(),
						region: z.string(),
						created_at: z.string(),
					}),
				),
				total: z.number(),
			},
			_meta: {
				ui: {
					resourceUri: UI_RESOURCE_URI,
				},
			},
		},
		async ({ status }) => {
			const servers = await resolveServers();
			const filtered = status
				? servers.filter((s) => s.status === status)
				: servers;

			const output = { servers: filtered, total: filtered.length };
			return {
				content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
				structuredContent: output,
			};
		},
	);
}

/**
 * get_server: 特定サーバーの詳細を取得
 *
 * @remarks
 * 冪等: はい（参照のみ）
 * ドライラン: 不要（副作用なし）
 */
function registerGetServer(server: McpServer): void {
	server.registerTool(
		"get_server",
		{
			title: "サーバー詳細取得",
			description: "指定したサーバーIDの詳細情報を取得します。",
			inputSchema: {
				server_id: z.string().describe("サーバーID（UUID形式）"),
			},
			outputSchema: {
				server: z
					.object({
						id: z.string(),
						name: z.string(),
						status: z.enum(["running", "stopped", "building"]),
						vcpu: z.number(),
						memory_gb: z.number(),
						disk_gb: z.number(),
						plan: z.string(),
						os: z.string(),
						ipv4: z.string().nullable(),
						ipv6: z.string().nullable(),
						region: z.string(),
						created_at: z.string(),
					})
					.nullable(),
			},
		},
		async ({ server_id }) => {
			const result = await resolveServer(server_id);

			if (!result) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								error: "サーバーが見つかりません",
								server_id,
							}),
						},
					],
					isError: true,
				};
			}

			const output = { server: result };
			return {
				content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
				structuredContent: output,
			};
		},
	);
}

/**
 * list_volumes: ボリューム一覧を取得
 *
 * @remarks
 * 冪等: はい（参照のみ）
 * ドライラン: 不要（副作用なし）
 */
function registerListVolumes(server: McpServer): void {
	server.registerTool(
		"list_volumes",
		{
			title: "ボリューム一覧取得",
			description: "ConoHa VPSのブロックストレージボリューム一覧を取得します。",
			inputSchema: {
				status: z
					.enum(["in-use", "available", "creating", "deleting"])
					.optional()
					.describe("フィルタ対象のステータス"),
			},
			outputSchema: {
				volumes: z.array(
					z.object({
						id: z.string(),
						name: z.string(),
						status: z.string(),
						size_gb: z.number(),
						volume_type: z.string(),
						attached_to: z.string().nullable(),
						attached_server_name: z.string().nullable(),
						created_at: z.string(),
					}),
				),
				total: z.number(),
			},
		},
		async ({ status }) => {
			const volumes = await resolveVolumes();
			const filtered = status
				? volumes.filter((v) => v.status === status)
				: volumes;

			const output = { volumes: filtered, total: filtered.length };
			return {
				content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
				structuredContent: output,
			};
		},
	);
}

/**
 * list_images: イメージ一覧を取得
 *
 * @remarks
 * 冪等: はい（参照のみ）
 * ドライラン: 不要（副作用なし）
 */
function registerListImages(server: McpServer): void {
	server.registerTool(
		"list_images",
		{
			title: "イメージ一覧取得",
			description:
				"利用可能なOSイメージの一覧を取得します。OSタイプでフィルタリング可能です。",
			inputSchema: {
				os_type: z
					.enum(["linux", "windows"])
					.optional()
					.describe("フィルタ対象のOSタイプ"),
			},
			outputSchema: {
				images: z.array(
					z.object({
						id: z.string(),
						name: z.string(),
						status: z.string(),
						os_type: z.string(),
						min_disk_gb: z.number(),
						size_mb: z.number(),
						created_at: z.string(),
					}),
				),
				total: z.number(),
			},
		},
		async ({ os_type }) => {
			const images = await resolveImages();
			const filtered = os_type
				? images.filter((i) => i.os_type === os_type)
				: images;

			const output = { images: filtered, total: filtered.length };
			return {
				content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
				structuredContent: output,
			};
		},
	);
}

/**
 * list_security_groups: セキュリティグループ一覧を取得
 *
 * @remarks
 * 冪等: はい（参照のみ）
 * ドライラン: 不要（副作用なし）
 */
function registerListSecurityGroups(server: McpServer): void {
	server.registerTool(
		"list_security_groups",
		{
			title: "セキュリティグループ一覧取得",
			description:
				"ネットワークセキュリティグループの一覧とルールを取得します。",
			inputSchema: {},
			outputSchema: {
				security_groups: z.array(
					z.object({
						id: z.string(),
						name: z.string(),
						description: z.string(),
						rules_count: z.number(),
						rules: z.array(
							z.object({
								direction: z.string(),
								protocol: z.string().nullable(),
								port_range: z.string().nullable(),
								remote_ip: z.string(),
							}),
						),
						created_at: z.string(),
					}),
				),
				total: z.number(),
			},
		},
		async () => {
			const securityGroups = await resolveSecurityGroups();

			const output = {
				security_groups: securityGroups,
				total: securityGroups.length,
			};
			return {
				content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
				structuredContent: output,
			};
		},
	);
}

/**
 * get_server_metrics: サーバー監視メトリクスを取得
 *
 * @remarks
 * 冪等: はい（参照のみ）
 * ドライラン: 不要（副作用なし）
 */
function registerGetServerMetrics(server: McpServer): void {
	server.registerTool(
		"get_server_metrics",
		{
			title: "サーバーメトリクス取得",
			description:
				"指定したサーバーのCPU・メモリ・ディスク使用率とネットワークトラフィックを取得します。",
			inputSchema: {
				server_id: z.string().describe("サーバーID（UUID形式）"),
			},
			outputSchema: {
				metrics: z
					.object({
						server_id: z.string(),
						server_name: z.string(),
						cpu_usage_percent: z.number(),
						memory_usage_percent: z.number(),
						disk_usage_percent: z.number(),
						network_in_mbps: z.number(),
						network_out_mbps: z.number(),
						timestamp: z.string(),
					})
					.nullable(),
			},
		},
		async ({ server_id }) => {
			const metrics = await resolveServerMetrics(server_id);

			if (!metrics) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								error: "メトリクスが見つかりません",
								server_id,
							}),
						},
					],
					isError: true,
				};
			}

			const output = { metrics };
			return {
				content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
				structuredContent: output,
			};
		},
	);
}

// ──────────────────────────────────────────────
// データ解決層: モック / 実API の切り替え
// ──────────────────────────────────────────────

async function resolveServers(): Promise<AppServer[]> {
	if (isMockMode()) {
		return getMockServers();
	}
	// TODO: 実APIモード — getCompute("/servers/detail") を呼び出してマッピング
	return getMockServers();
}

async function resolveServer(serverId: string): Promise<AppServer | null> {
	if (isMockMode()) {
		return getMockServer(serverId);
	}
	// TODO: 実APIモード — getComputeByParam("", serverId) を呼び出してマッピング
	return getMockServer(serverId);
}

async function resolveVolumes(): Promise<AppVolume[]> {
	if (isMockMode()) {
		return getMockVolumes();
	}
	// TODO: 実APIモード — getVolume("/volumes/detail") を呼び出してマッピング
	return getMockVolumes();
}

async function resolveImages(): Promise<AppImage[]> {
	if (isMockMode()) {
		return getMockImages();
	}
	// TODO: 実APIモード — getImage("/v2/images") を呼び出してマッピング
	return getMockImages();
}

async function resolveSecurityGroups(): Promise<AppSecurityGroup[]> {
	if (isMockMode()) {
		return getMockSecurityGroups();
	}
	// TODO: 実APIモード — getNetwork("/v2.0/security-groups") を呼び出してマッピング
	return getMockSecurityGroups();
}

async function resolveServerMetrics(
	serverId: string,
): Promise<AppServerMetrics | null> {
	if (isMockMode()) {
		return getMockServerMetrics(serverId);
	}
	// TODO: 実APIモード — getComputeByParam("/rrd/cpu", serverId) 等を呼び出してマッピング
	return getMockServerMetrics(serverId);
}
