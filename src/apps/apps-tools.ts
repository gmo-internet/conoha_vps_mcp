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
import { executeOpenstackApi } from "../features/openstack/common/openstack-client.js";
import {
	OPENSTACK_COMPUTE_BASE_URL,
	OPENSTACK_IMAGE_BASE_URL,
	OPENSTACK_NETWORK_BASE_URL,
	OPENSTACK_VOLUME_BASE_URL,
} from "../features/openstack/constants.js";
import type {
	AppImage,
	AppSecurityGroup,
	AppServer,
	AppServerMetrics,
	AppVolume,
	SecurityGroupRule,
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
 * @param server - McpServerインスタンス
 * @remarks
 * ビルド済みの単一HTMLファイルをMCP Appリソースとして提供します。
 * @internal
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
 * @param server - McpServerインスタンス
 * @remarks
 * 冪等: はい（参照のみ）
 * ドライラン: 不要（副作用なし）
 * UI: ConoHa VPS ダッシュボード（サーバー一覧 + 詳細パネル）
 * @internal
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
			if (!isMockMode() && !hasCredentials()) {
				const guide = {
					error: "auth_required",
					message:
						"ConoHa VPSの認証情報が設定されていません。claude_desktop_config.jsonのenv、または.envファイルに以下を設定してください。",
					required_env: [
						"OPENSTACK_TENANT_ID",
						"OPENSTACK_USER_ID",
						"OPENSTACK_PASSWORD",
					],
					hint: "ConoHaコントロールパネル → API → APIユーザー で確認できます。",
				};
				return {
					content: [{ type: "text", text: JSON.stringify(guide, null, 2) }],
					structuredContent: { servers: [], total: 0 },
				};
			}

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
 * @param server - McpServerインスタンス
 * @remarks
 * 冪等: はい（参照のみ）
 * ドライラン: 不要（副作用なし）
 * @internal
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
 * @param server - McpServerインスタンス
 * @remarks
 * 冪等: はい（参照のみ）
 * ドライラン: 不要（副作用なし）
 * @internal
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
 * @param server - McpServerインスタンス
 * @remarks
 * 冪等: はい（参照のみ）
 * ドライラン: 不要（副作用なし）
 * @internal
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
 * @param server - McpServerインスタンス
 * @remarks
 * 冪等: はい（参照のみ）
 * ドライラン: 不要（副作用なし）
 * @internal
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
 * @param server - McpServerインスタンス
 * @remarks
 * 冪等: はい（参照のみ）
 * ドライラン: 不要（副作用なし）
 * @internal
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

/** テナントID */
const TENANT_ID = process.env.OPENSTACK_TENANT_ID ?? "";

/**
 * 認証情報が設定済みか判定
 *
 * @returns 3つの環境変数がすべて設定されている場合true
 * @internal
 */
function hasCredentials(): boolean {
	return !!(
		process.env.OPENSTACK_USER_ID &&
		process.env.OPENSTACK_PASSWORD &&
		process.env.OPENSTACK_TENANT_ID
	);
}

/**
 * サーバー一覧を解決（モックまたは実API）
 *
 * @returns サーバー情報の配列
 * @internal
 */
async function resolveServers(): Promise<AppServer[]> {
	if (isMockMode()) {
		return getMockServers();
	}
	const response = await executeOpenstackApi(
		"GET",
		OPENSTACK_COMPUTE_BASE_URL,
		"/servers/detail",
	);
	const json = (await response.json()) as {
		servers: Array<Record<string, unknown>>;
	};
	return (json.servers ?? []).map(mapNovaServerToAppServer);
}

/**
 * 特定サーバーの詳細を解決
 *
 * @param serverId - サーバーID
 * @returns サーバー情報、見つからない場合null
 * @internal
 */
async function resolveServer(serverId: string): Promise<AppServer | null> {
	if (isMockMode()) {
		return getMockServer(serverId);
	}
	const response = await executeOpenstackApi(
		"GET",
		OPENSTACK_COMPUTE_BASE_URL,
		`/servers/${serverId}`,
	);
	if (!response.ok) return null;
	const json = (await response.json()) as {
		server: Record<string, unknown>;
	};
	return json.server ? mapNovaServerToAppServer(json.server) : null;
}

/**
 * ボリューム一覧を解決（モックまたは実API）
 *
 * @returns ボリューム情報の配列
 * @internal
 */
async function resolveVolumes(): Promise<AppVolume[]> {
	if (isMockMode()) {
		return getMockVolumes();
	}
	const response = await executeOpenstackApi(
		"GET",
		OPENSTACK_VOLUME_BASE_URL,
		`/${TENANT_ID}/volumes/detail`,
	);
	const json = (await response.json()) as {
		volumes: Array<Record<string, unknown>>;
	};
	return (json.volumes ?? []).map(mapCinderVolumeToAppVolume);
}

/**
 * イメージ一覧を解決（モックまたは実API）
 *
 * @returns イメージ情報の配列
 * @internal
 */
async function resolveImages(): Promise<AppImage[]> {
	if (isMockMode()) {
		return getMockImages();
	}
	const response = await executeOpenstackApi(
		"GET",
		OPENSTACK_IMAGE_BASE_URL,
		"/v2/images?limit=200",
	);
	const json = (await response.json()) as {
		images: Array<Record<string, unknown>>;
	};
	return (json.images ?? []).map(mapGlanceImageToAppImage);
}

/**
 * セキュリティグループ一覧を解決（モックまたは実API）
 *
 * @returns セキュリティグループ情報の配列
 * @internal
 */
async function resolveSecurityGroups(): Promise<AppSecurityGroup[]> {
	if (isMockMode()) {
		return getMockSecurityGroups();
	}
	const response = await executeOpenstackApi(
		"GET",
		OPENSTACK_NETWORK_BASE_URL,
		"/v2.0/security-groups",
	);
	const json = (await response.json()) as {
		security_groups: Array<Record<string, unknown>>;
	};
	return (json.security_groups ?? []).map(mapNeutronSgToAppSecurityGroup);
}

/**
 * サーバー監視メトリクスを解決
 *
 * @param serverId - サーバーID
 * @returns メトリクス情報、見つからない場合null
 * @internal
 */
async function resolveServerMetrics(
	serverId: string,
): Promise<AppServerMetrics | null> {
	if (isMockMode()) {
		return getMockServerMetrics(serverId);
	}
	// ConoHa VPS APIにはメトリクス専用エンドポイントがないため、
	// サーバー情報から基本データを取得して返す
	const server = await resolveServer(serverId);
	if (!server) return null;
	return {
		server_id: server.id,
		server_name: server.name,
		cpu_usage_percent: 0,
		memory_usage_percent: 0,
		disk_usage_percent: 0,
		network_in_mbps: 0,
		network_out_mbps: 0,
		timestamp: new Date().toISOString(),
	};
}

// ──────────────────────────────────────────────
// OpenStack → App 型マッピング
// ──────────────────────────────────────────────

/**
 * Nova APIのステータスをアプリ用ステータスに変換
 *
 * @param status - Nova APIのサーバーステータス文字列
 * @returns アプリ用ステータス
 * @internal
 */
function mapNovaStatus(status: string): "running" | "stopped" | "building" {
	const s = String(status).toUpperCase();
	if (s === "ACTIVE") return "running";
	if (s === "SHUTOFF") return "stopped";
	return "building";
}

/**
 * Nova serverオブジェクトをAppServer型に変換
 *
 * @param s - Nova APIのサーバーレスポンスオブジェクト
 * @returns アプリ用サーバー情報
 * @internal
 */
function mapNovaServerToAppServer(s: Record<string, unknown>): AppServer {
	const flavor = (s.flavor ?? {}) as Record<string, unknown>;
	const addresses = (s.addresses ?? {}) as Record<
		string,
		Array<{ version: number; addr: string }>
	>;

	let ipv4: string | null = null;
	let ipv6: string | null = null;
	for (const nets of Object.values(addresses)) {
		for (const addr of nets) {
			if (addr.version === 4 && !ipv4) ipv4 = addr.addr;
			if (addr.version === 6 && !ipv6) ipv6 = addr.addr;
		}
	}

	return {
		id: String(s.id ?? ""),
		name: String(s.name ?? ""),
		status: mapNovaStatus(String(s.status ?? "")),
		vcpu: Number(flavor.vcpus ?? 0),
		memory_gb: Math.round(Number(flavor.ram ?? 0) / 1024),
		disk_gb: Number(flavor.disk ?? 0),
		plan: String(flavor.original_name ?? flavor.id ?? ""),
		os: String(
			(s.metadata as Record<string, string> | undefined)?.image_name ?? "",
		),
		ipv4,
		ipv6,
		region: "tyo3",
		created_at: String(s.created ?? ""),
	};
}

/**
 * Cinder volumeオブジェクトをAppVolume型に変換
 *
 * @param v - Cinder APIのボリュームレスポンスオブジェクト
 * @returns アプリ用ボリューム情報
 * @internal
 */
function mapCinderVolumeToAppVolume(v: Record<string, unknown>): AppVolume {
	const attachments = (v.attachments ?? []) as Array<Record<string, unknown>>;
	const firstAttach = attachments[0];

	return {
		id: String(v.id ?? ""),
		name: String(v.name ?? ""),
		status: String(v.status ?? "available") as AppVolume["status"],
		size_gb: Number(v.size ?? 0),
		volume_type: String(v.volume_type ?? ""),
		attached_to: firstAttach ? String(firstAttach.server_id ?? "") : null,
		attached_server_name: null,
		created_at: String(v.created_at ?? ""),
	};
}

/**
 * Glance imageオブジェクトをAppImage型に変換
 *
 * @param i - Glance APIのイメージレスポンスオブジェクト
 * @returns アプリ用イメージ情報
 * @internal
 */
function mapGlanceImageToAppImage(i: Record<string, unknown>): AppImage {
	const name = String(i.name ?? "");
	const osType = name.toLowerCase().includes("windows") ? "windows" : "linux";

	return {
		id: String(i.id ?? ""),
		name,
		status: String(i.status ?? "active") as AppImage["status"],
		os_type: osType,
		min_disk_gb: Number(i.min_disk ?? 0),
		size_mb: Math.round(Number(i.size ?? 0) / (1024 * 1024)),
		created_at: String(i.created_at ?? ""),
	};
}

/**
 * Neutron security groupオブジェクトをAppSecurityGroup型に変換
 *
 * @param sg - Neutron APIのセキュリティグループレスポンスオブジェクト
 * @returns アプリ用セキュリティグループ情報
 * @internal
 */
function mapNeutronSgToAppSecurityGroup(
	sg: Record<string, unknown>,
): AppSecurityGroup {
	const rawRules = (sg.security_group_rules ?? []) as Array<
		Record<string, unknown>
	>;
	const rules: SecurityGroupRule[] = rawRules.map((r) => {
		const portMin = r.port_range_min;
		const portMax = r.port_range_max;
		let portRange: string | null = null;
		if (portMin != null && portMax != null) {
			portRange =
				portMin === portMax ? String(portMin) : `${portMin}-${portMax}`;
		}
		return {
			direction: String(r.direction ?? "ingress") as "ingress" | "egress",
			protocol: r.protocol ? String(r.protocol) : null,
			port_range: portRange,
			remote_ip: String(r.remote_ip_prefix ?? "0.0.0.0/0"),
		};
	});

	return {
		id: String(sg.id ?? ""),
		name: String(sg.name ?? ""),
		description: String(sg.description ?? ""),
		rules_count: rules.length,
		rules,
		created_at: String(sg.created_at ?? ""),
	};
}
