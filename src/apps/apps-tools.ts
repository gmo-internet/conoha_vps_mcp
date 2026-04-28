/**
 * MCP Apps ツール定義
 *
 * @remarks
 * ConoHa VPS の参照系操作を提供するMCP Appsツール群です。
 * 各ツールは単一責務・冪等性・ドライラン対応を原則とします。
 *
 * - 参照系ツール + サーバー作成（LLM非経由でセキュア）
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
	registerListFlavors(server);
	registerListKeypairs(server);
	registerCreateServer(server);
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
						min_ram_mb: z.number(),
						size_mb: z.number(),
						created_at: z.string(),
						dst_name: z.string().optional(),
						dst_version: z.string().optional(),
						app_name: z.string().optional(),
						app_version: z.string().optional(),
						service_type: z.string().optional(),
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
 * フレーバーIDからスペック情報へのキャッシュ
 * @internal
 */
let flavorCache: Map<
	string,
	{ vcpus: number; ram: number; disk: number }
> | null = null;

/**
 * フレーバー一覧を取得してキャッシュに格納
 *
 * @returns フレーバーID→スペック情報のMap
 * @internal
 */
async function resolveFlavorMap(): Promise<
	Map<string, { vcpus: number; ram: number; disk: number }>
> {
	if (flavorCache) return flavorCache;
	const response = await executeOpenstackApi(
		"GET",
		OPENSTACK_COMPUTE_BASE_URL,
		"/flavors/detail",
	);
	const json = (await response.json()) as {
		flavors: Array<Record<string, unknown>>;
	};
	flavorCache = new Map();
	for (const f of json.flavors ?? []) {
		flavorCache.set(String(f.id ?? ""), {
			vcpus: Number(f.vcpus ?? 0),
			ram: Number(f.ram ?? 0),
			disk: Number(f.disk ?? 0),
		});
	}
	return flavorCache;
}

/**
 * ボリュームID→サイズ(GB)のMapを取得
 *
 * @returns ボリュームID→サイズのMap
 * @internal
 */
async function resolveVolumeSizeMap(): Promise<Map<string, number>> {
	const response = await executeOpenstackApi(
		"GET",
		OPENSTACK_VOLUME_BASE_URL,
		`/${TENANT_ID}/volumes/detail`,
	);
	const json = (await response.json()) as {
		volumes: Array<Record<string, unknown>>;
	};
	const map = new Map<string, number>();
	for (const v of json.volumes ?? []) {
		map.set(String(v.id ?? ""), Number(v.size ?? 0));
	}
	return map;
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
	const [serversResponse, flavorMap, volumeSizeMap] = await Promise.all([
		executeOpenstackApi("GET", OPENSTACK_COMPUTE_BASE_URL, "/servers/detail"),
		resolveFlavorMap(),
		resolveVolumeSizeMap(),
	]);
	const json = (await serversResponse.json()) as {
		servers: Array<Record<string, unknown>>;
	};
	return (json.servers ?? []).map((s) =>
		mapNovaServerToAppServer(s, flavorMap, volumeSizeMap),
	);
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
	const [response, flavorMap, volumeSizeMap] = await Promise.all([
		executeOpenstackApi(
			"GET",
			OPENSTACK_COMPUTE_BASE_URL,
			`/servers/${serverId}`,
		),
		resolveFlavorMap(),
		resolveVolumeSizeMap(),
	]);
	if (!response.ok) return null;
	const json = (await response.json()) as {
		server: Record<string, unknown>;
	};
	return json.server
		? mapNovaServerToAppServer(json.server, flavorMap, volumeSizeMap)
		: null;
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
 * @param flavorMap - フレーバーID→スペック情報のMap
 * @param volumeSizeMap - ボリュームID→サイズ(GB)のMap
 * @returns アプリ用サーバー情報
 * @internal
 */
export function mapNovaServerToAppServer(
	s: Record<string, unknown>,
	flavorMap?: Map<string, { vcpus: number; ram: number; disk: number }>,
	volumeSizeMap?: Map<string, number>,
): AppServer {
	const flavorRef = (s.flavor ?? {}) as Record<string, unknown>;
	const flavorId = String(flavorRef.id ?? "");
	const flavorSpec = flavorMap?.get(flavorId);
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

	// ディスクサイズ: フレーバーのdiskが0の場合、接続ボリュームの合計サイズを使用
	let diskGb = flavorSpec?.disk ?? Number(flavorRef.disk ?? 0);
	if (diskGb === 0 && volumeSizeMap) {
		const attachedVolumes = (s["os-extended-volumes:volumes_attached"] ??
			[]) as Array<{ id: string }>;
		for (const vol of attachedVolumes) {
			diskGb += volumeSizeMap.get(vol.id) ?? 0;
		}
	}

	// ConoHaは Nova の `name` を `vm-xxxxxxxx-xx` 形式に強制上書きし、ユーザー指定名は
	// `metadata.instance_name_tag` に格納する。表示用には instance_name_tag を優先する
	const metadata = (s.metadata ?? {}) as Record<string, string | undefined>;
	const displayName = metadata.instance_name_tag || String(s.name ?? "");

	return {
		id: String(s.id ?? ""),
		name: displayName,
		status: mapNovaStatus(String(s.status ?? "")),
		vcpu: flavorSpec?.vcpus ?? Number(flavorRef.vcpus ?? 0),
		memory_gb: Math.round(
			(flavorSpec?.ram ?? Number(flavorRef.ram ?? 0)) / 1024,
		),
		disk_gb: diskGb,
		plan: String(flavorRef.original_name ?? flavorRef.id ?? ""),
		os: String(metadata.image_name ?? ""),
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
export function mapGlanceImageToAppImage(i: Record<string, unknown>): AppImage {
	const name = String(i.name ?? "");
	// osType は ConoHa の osType フィールド優先、なければ name から推定
	const osTypeRaw = String(i.osType ?? i.os_type ?? "").toLowerCase();
	const osType: "linux" | "windows" =
		osTypeRaw === "windows" || name.toLowerCase().includes("windows")
			? "windows"
			: "linux";

	// tags から `key=value` 形式のメタデータを抽出
	const tagMap = parseConohaTags(i.tags);

	return {
		id: String(i.id ?? ""),
		name,
		status: String(i.status ?? "active") as AppImage["status"],
		os_type: osType,
		min_disk_gb: Number(i.min_disk ?? i.minDisk ?? 0),
		min_ram_mb: Number(i.min_ram ?? i.minRam ?? 0),
		size_mb: Math.round(Number(i.size ?? 0) / (1024 * 1024)),
		created_at: String(i.created_at ?? ""),
		...(tagMap.dst_name && { dst_name: tagMap.dst_name }),
		...(tagMap.dst_version && { dst_version: tagMap.dst_version }),
		...(tagMap.app_name && { app_name: tagMap.app_name }),
		...(tagMap.app_version && { app_version: tagMap.app_version }),
		...(tagMap.service_type && { service_type: tagMap.service_type }),
	};
}

/**
 * ConoHa Glance APIの tags 配列を key=value で分解してマップに変換
 *
 * @param tags - 例: ["dst_name=Ubuntu", "dst_version=24.04", "service_type=vps"]
 * @returns key→value のマップ
 * @internal
 */
function parseConohaTags(tags: unknown): Record<string, string> {
	if (!Array.isArray(tags)) return {};
	const map: Record<string, string> = {};
	for (const t of tags) {
		if (typeof t !== "string") continue;
		const eq = t.indexOf("=");
		if (eq <= 0) continue;
		const key = t.slice(0, eq);
		const value = t.slice(eq + 1);
		if (key && value) map[key] = value;
	}
	return map;
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

// ──────────────────────────────────────────────
// フレーバー・キーペア一覧 / サーバー作成
// ──────────────────────────────────────────────

/**
 * list_flavors: フレーバー（プラン）一覧を取得
 *
 * @param server - McpServerインスタンス
 * @internal
 */
function registerListFlavors(server: McpServer): void {
	server.registerTool(
		"list_flavors",
		{
			title: "フレーバー一覧取得",
			description: "利用可能なサーバープラン（フレーバー）の一覧を取得します。",
			inputSchema: {},
			outputSchema: {
				flavors: z.array(
					z.object({
						id: z.string(),
						name: z.string(),
						vcpus: z.number(),
						ram_mb: z.number(),
						disk_gb: z.number(),
					}),
				),
				total: z.number(),
			},
		},
		async () => {
			if (isMockMode()) {
				const mockFlavors = [
					{
						id: "mock-flavor-1",
						name: "g2l-t-c2m1",
						vcpus: 2,
						ram_mb: 1024,
						disk_gb: 0,
					},
					{
						id: "mock-flavor-2",
						name: "g2l-t-c3m2",
						vcpus: 3,
						ram_mb: 2048,
						disk_gb: 0,
					},
					{
						id: "mock-flavor-3",
						name: "g2l-t-c4m4",
						vcpus: 4,
						ram_mb: 4096,
						disk_gb: 0,
					},
				];
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								flavors: mockFlavors,
								total: mockFlavors.length,
							}),
						},
					],
					structuredContent: {
						flavors: mockFlavors,
						total: mockFlavors.length,
					},
				};
			}
			const response = await executeOpenstackApi(
				"GET",
				OPENSTACK_COMPUTE_BASE_URL,
				"/flavors/detail",
			);
			const json = (await response.json()) as {
				flavors: Array<Record<string, unknown>>;
			};
			const flavors = (json.flavors ?? []).map((f) => ({
				id: String(f.id ?? ""),
				name: String(f.name ?? ""),
				vcpus: Number(f.vcpus ?? 0),
				ram_mb: Number(f.ram ?? 0),
				disk_gb: Number(f.disk ?? 0),
			}));
			const output = { flavors, total: flavors.length };
			return {
				content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
				structuredContent: output,
			};
		},
	);
}

/**
 * list_keypairs: SSHキーペア一覧を取得
 *
 * @param server - McpServerインスタンス
 * @internal
 */
function registerListKeypairs(server: McpServer): void {
	server.registerTool(
		"list_keypairs",
		{
			title: "SSHキーペア一覧取得",
			description: "登録済みのSSHキーペア一覧を取得します。",
			inputSchema: {},
			outputSchema: {
				keypairs: z.array(
					z.object({
						name: z.string(),
					}),
				),
				total: z.number(),
			},
		},
		async () => {
			if (isMockMode()) {
				const mockKeypairs = [{ name: "my-key" }];
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({ keypairs: mockKeypairs, total: 1 }),
						},
					],
					structuredContent: { keypairs: mockKeypairs, total: 1 },
				};
			}
			const response = await executeOpenstackApi(
				"GET",
				OPENSTACK_COMPUTE_BASE_URL,
				"/os-keypairs",
			);
			const json = (await response.json()) as {
				keypairs: Array<{ keypair: Record<string, unknown> }>;
			};
			const keypairs = (json.keypairs ?? []).map((k) => ({
				name: String(k.keypair?.name ?? ""),
			}));
			const output = { keypairs, total: keypairs.length };
			return {
				content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
				structuredContent: output,
			};
		},
	);
}

/** パスワード強度バリデーション（ConoHa要件: 9-70文字、大文字・小文字・数字・記号すべて必須） */
function validateServerPassword(pw: string): string | null {
	if (pw.length < 9 || pw.length > 70)
		return "パスワードは9〜70文字で指定してください";
	if (!/[A-Z]/.test(pw)) return "大文字を含めてください";
	if (!/[a-z]/.test(pw)) return "小文字を含めてください";
	if (!/[0-9]/.test(pw)) return "数字を含めてください";
	if (!/[\\^$+\-*/|()[\]{}.,?!_=&@~%#:;'"]/.test(pw))
		return "記号を含めてください（^$+-*/|()[]{}.,?!_=&@~%#:;'\"）";
	return null;
}

/**
 * create_server: サーバーを作成（LLM非経由）
 *
 * @param server - McpServerインスタンス
 * @remarks
 * MCP Apps UIからの直接呼び出し専用。パスワードがLLMコンテキストに入らない。
 * @internal
 */
function registerCreateServer(server: McpServer): void {
	server.registerTool(
		"create_server",
		{
			title: "サーバー作成",
			description:
				"ConoHa VPSサーバーを新規作成します。UIから直接呼び出され、パスワードはLLMを経由しません。",
			inputSchema: {
				name: z
					.string()
					.min(1)
					.describe("サーバー名（英数字・ハイフン・アンダースコア）"),
				password: z.string().min(9).describe("rootパスワード"),
				flavor_id: z.string().describe("フレーバーID"),
				image_id: z
					.string()
					.optional()
					.describe("OSイメージID（自動モード: ボリュームを内部で作成）"),
				boot_volume_id: z
					.string()
					.optional()
					.describe("既存ブートボリュームID（手動モード: 事前作成済みを使用）"),
				boot_volume_size_gb: z
					.number()
					.int()
					.min(30)
					.optional()
					.describe(
						"自動作成するブートボリュームのサイズ（GB）。指定なしは100GB。512MBプランは30GB必須。",
					),
				ssh_key_name: z.string().optional().describe("SSHキーペア名"),
				security_group_name: z
					.string()
					.optional()
					.describe("セキュリティグループ名"),
			},
		},
		async ({
			name,
			password,
			flavor_id,
			image_id,
			boot_volume_id,
			boot_volume_size_gb,
			ssh_key_name,
			security_group_name,
		}) => {
			// パスワードバリデーション
			const pwError = validateServerPassword(password);
			if (pwError) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({ error: pwError }),
						},
					],
					isError: true,
				};
			}

			// image_id と boot_volume_id は排他必須
			if (!image_id && !boot_volume_id) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								error:
									"image_id（自動モード）または boot_volume_id（手動モード）のどちらかを指定してください",
							}),
						},
					],
					isError: true,
				};
			}
			if (image_id && boot_volume_id) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								error: "image_id と boot_volume_id は同時に指定できません",
							}),
						},
					],
					isError: true,
				};
			}

			if (isMockMode()) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								server: {
									id: "mock-new-server-id",
									name,
									status: "building",
								},
								mode: image_id ? "auto" : "manual",
								...(image_id && { boot_volume_id: "mock-boot-volume-id" }),
							}),
						},
					],
				};
			}

			// モード判定: 自動モード(image_id)ならボリューム作成、手動モード(boot_volume_id)ならスキップ
			let bootVolumeId: string;
			const createdByUs = !boot_volume_id;

			if (!createdByUs) {
				// 手動モード: ユーザーが用意したボリュームIDをそのまま使う
				bootVolumeId = boot_volume_id as string;
			} else {
				// 自動モード: ボリュームタイプ取得 → ボリューム作成 → ポーリング
				const typesResponse = await executeOpenstackApi(
					"GET",
					OPENSTACK_VOLUME_BASE_URL,
					`/${TENANT_ID}/types`,
				);
				if (!typesResponse.ok) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									error: `ボリュームタイプ取得に失敗しました (${typesResponse.status})`,
									detail: await typesResponse.text(),
								}),
							},
						],
						isError: true,
					};
				}
				const typesJson = (await typesResponse.json()) as {
					volume_types: Array<{ name: string }>;
				};
				// ConoHa VPSでは "-boot" サフィックス付きがブート用ボリュームタイプ
				const bootType = typesJson.volume_types?.find((t) =>
					t.name?.includes("-boot"),
				);
				const volumeType = bootType?.name ?? typesJson.volume_types?.[0]?.name;
				if (!volumeType) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									error: "利用可能なボリュームタイプがありません",
								}),
							},
						],
						isError: true,
					};
				}

				// ブートボリューム作成
				// ConoHa制約: 512MBプランは30GB、その他は100GB以上が必須
				// image_id は自動モードでは必ず存在（排他バリデーション済み）
				const volumeBody = {
					volume: {
						size: boot_volume_size_gb ?? 100,
						name: `${name}-boot`,
						volume_type: volumeType,
						imageRef: image_id as string,
					},
				};
				const volumeResponse = await executeOpenstackApi(
					"POST",
					OPENSTACK_VOLUME_BASE_URL,
					`/${TENANT_ID}/volumes`,
					volumeBody,
				);
				if (!volumeResponse.ok) {
					const volErrText = await volumeResponse.text();
					const isLimit = volErrText.includes(
						"boot volumes that are not associated",
					);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									error: `ブートボリューム作成に失敗しました (${volumeResponse.status})`,
									detail: volErrText,
									...(isLimit && {
										hint: "サーバー未紐付けのブートボリュームが上限に達しています。ConoHa管理画面または conoha_get /volumes/detail でボリューム一覧を確認し、不要なものを削除してください。",
									}),
								}),
							},
						],
						isError: true,
					};
				}
				const volumeJson = (await volumeResponse.json()) as {
					volume: { id: string };
				};
				const createdId = volumeJson.volume?.id;
				if (!createdId) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									error: "ブートボリュームIDを取得できませんでした",
								}),
							},
						],
						isError: true,
					};
				}
				bootVolumeId = createdId;

				// ボリュームが available 状態になるまでポーリング（最大90秒）
				const maxWaitMs = 90_000;
				const intervalMs = 3_000;
				const start = Date.now();
				let volumeStatus = "creating";
				while (Date.now() - start < maxWaitMs) {
					await new Promise((r) => setTimeout(r, intervalMs));
					const statusResponse = await executeOpenstackApi(
						"GET",
						OPENSTACK_VOLUME_BASE_URL,
						`/${TENANT_ID}/volumes/${bootVolumeId}`,
					);
					if (!statusResponse.ok) continue;
					const statusJson = (await statusResponse.json()) as {
						volume?: { status?: string };
					};
					volumeStatus = statusJson.volume?.status ?? "unknown";
					if (volumeStatus === "available") break;
					if (volumeStatus === "error") {
						await deleteIfOwned();
						return {
							content: [
								{
									type: "text",
									text: JSON.stringify({
										error: "ブートボリュームがエラー状態になりました",
										volume_id: bootVolumeId,
									}),
								},
							],
							isError: true,
						};
					}
				}
				if (volumeStatus !== "available") {
					await deleteIfOwned();
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									error: `ブートボリュームが available になりませんでした (status=${volumeStatus})`,
									volume_id: bootVolumeId,
								}),
							},
						],
						isError: true,
					};
				}
			}

			// 失敗時のクリーンアップ: 自動モードで作成したボリュームのみ削除（手動モードはno-op）
			async function deleteIfOwned(): Promise<void> {
				if (!createdByUs) return;
				try {
					await executeOpenstackApi(
						"DELETE",
						OPENSTACK_VOLUME_BASE_URL,
						`/${TENANT_ID}/volumes/${bootVolumeId}`,
					);
				} catch {
					// 削除失敗は黙殺（元のエラーを優先）
				}
			}

			// サーバー作成（決定したボリュームUUIDを指定）
			const serverBody: Record<
				string,
				| string
				| Array<{ uuid: string }>
				| Record<string, string>
				| Array<{ name: string }>
			> = {
				flavorRef: flavor_id,
				adminPass: password,
				block_device_mapping_v2: [{ uuid: bootVolumeId }],
				metadata: { instance_name_tag: name },
			};
			if (ssh_key_name) serverBody.key_name = ssh_key_name;
			if (security_group_name) {
				serverBody.security_groups = [{ name: security_group_name }];
			}
			const body = { server: serverBody };

			const response = await executeOpenstackApi(
				"POST",
				OPENSTACK_COMPUTE_BASE_URL,
				"/servers",
				body,
			);

			if (!response.ok) {
				const errorText = await response.text();
				await deleteIfOwned();
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								error: `サーバー作成に失敗しました (${response.status})`,
								detail: errorText,
								...(createdByUs && {
									cleanup: `ブートボリューム ${bootVolumeId} を削除しました`,
								}),
							}),
						},
					],
					isError: true,
				};
			}

			const json = (await response.json()) as {
				server: Record<string, unknown>;
			};
			// 作成直後のレスポンスでも `name` は ConoHa が `vm-...` で上書きするため、
			// ユーザー入力名（リクエスト時の name）をそのまま返す
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({
							server: {
								id: String(json.server?.id ?? ""),
								name,
								status: "building",
							},
							mode: createdByUs ? "auto" : "manual",
							boot_volume_id: bootVolumeId,
							...(createdByUs && { boot_volume_created: true }),
						}),
					},
				],
			};
		},
	);
}
