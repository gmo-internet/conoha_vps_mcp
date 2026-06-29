/**
 * MCP Apps ツール定義（オブジェクトストレージ）
 *
 * @remarks
 * ConoHa VPS のオブジェクトストレージを操作する MCP Apps ツール群です。
 * 各ツールは単一責務・冪等性・ドライラン対応を原則とします。
 *
 * - 参照系（list_containers / list_objects）と変更系（create / delete / upload）
 * - features/openstack/storage/storage-client を介して実APIを呼び出す
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
import {
	deleteStorageContainer,
	deleteStorageObject,
	getStorageContainerInfo,
	getStorageContainerList,
	getStorageObjectList,
	setPostStorageMetadata,
	setPutStorageMetadata,
	uploadStorageObjectDecoded,
} from "../features/openstack/storage/storage-client.js";
import {
	type AppContainer,
	AppContainerSchema,
	type AppObject,
	AppObjectSchema,
} from "./apps-types.js";
import {
	CONTAINER_NAME_MAX_LENGTH,
	CONTAINER_NAME_MIN_LENGTH,
	CONTAINER_NAME_PATTERN,
} from "./container-name-rules.js";

/** UI リソース URI */
const UI_RESOURCE_URI = "ui://conoha-vps/mcp-app.html";

/**
 * storage-client が返す JSON 文字列をパースした最小レスポンス型
 *
 * @remarks
 * storage-client の各関数は `JSON.stringify({ status, body?, headers? })` 形式の
 * 文字列を返す。ステータス判定のみを行う箇所はこの共通型で `JSON.parse` 結果を
 * 受け、無名の inline 型（`as { status: number }`）の散在を防ぐ。
 * body / headers を参照する箇所はこの型を拡張する。
 */
interface StorageRawResponse {
	/** HTTP ステータスコード */
	status: number;
}

/**
 * MCP Apps ツールをサーバーに登録
 *
 * @param server - McpServerインスタンス
 */
export function registerAppsTools(server: McpServer): void {
	registerAppUiResource(server);
	registerListContainers(server);
	registerCreateContainer(server);
	registerDeleteContainer(server);
	registerListObjects(server);
	registerUploadObject(server);
	registerDeleteObject(server);
	registerGetContainerPublicState(server);
	registerEnableWebPublish(server);
	registerDisableWebPublish(server);
}

/**
 * 公開URLを組み立てる
 *
 * @internal
 */
function buildPublicUrl(tenantId: string, container: string): string {
	return `https://object-storage.c3j1.conoha.io/v1/AUTH_${tenantId}/${encodeURIComponent(container)}`;
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
 * ストレージコンテナ一覧を解決（実API）
 *
 * @returns コンテナ情報の配列
 * @internal
 */
async function resolveContainers(): Promise<AppContainer[]> {
	const TENANT_ID = process.env.OPENSTACK_TENANT_ID;
	if (!TENANT_ID) return [];
	const raw = await getStorageContainerList(
		`/v1/AUTH_${TENANT_ID}?format=json`,
	);
	const parsed = JSON.parse(raw) as StorageRawResponse & { body: unknown };
	if (parsed.status !== 200) return [];
	const list = Array.isArray(parsed.body) ? parsed.body : [];
	return list.map(mapSwiftContainerToAppContainer);
}

/**
 * Swift container オブジェクトを AppContainer に変換
 *
 * @internal
 */
function mapSwiftContainerToAppContainer(c: unknown): AppContainer {
	const obj = (c ?? {}) as Record<string, unknown>;
	return {
		name: String(obj.name ?? ""),
		count: Number(obj.count ?? 0),
		bytes: Number(obj.bytes ?? 0),
		...(obj.last_modified ? { last_modified: String(obj.last_modified) } : {}),
	};
}

/**
 * list_containers: ストレージコンテナ一覧を取得（MCP App UI 付き）
 *
 * @remarks
 * 冪等: はい（参照のみ）
 * ドライラン: 不要（副作用なし）
 * UI: ConoHa VPS Storage ダッシュボード（コンテナ一覧 + 詳細パネル）
 * @internal
 */
function registerListContainers(server: McpServer): void {
	registerAppTool(
		server,
		"list_containers",
		{
			title: "ストレージコンテナ一覧取得",
			description:
				"オブジェクトストレージのコンテナ一覧（名前・オブジェクト数・サイズ）を取得します。",
			inputSchema: {},
			outputSchema: {
				containers: z.array(AppContainerSchema),
				total: z.number(),
			},
			_meta: {
				ui: {
					resourceUri: UI_RESOURCE_URI,
				},
			},
		},
		async () => {
			const containers = await resolveContainers();
			const output = { containers, total: containers.length };
			return {
				content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
				structuredContent: output,
			};
		},
	);
}

/**
 * create_container: ストレージコンテナを作成
 *
 * @remarks
 * 冪等: はい（既存コンテナへの PUT は 202 Accepted で no-op）
 * ドライラン: 非対応（実APIで即作成）
 * @internal
 */
function registerCreateContainer(server: McpServer): void {
	server.registerTool(
		"create_container",
		{
			title: "ストレージコンテナ作成",
			description:
				"オブジェクトストレージにコンテナを新規作成します。既存名への PUT は 202 で no-op です。",
			inputSchema: {
				// 命名規則は container-name-rules.ts を単一の真実源とし、
				// UI 側 validate-container-name.ts と規則を共有する
				name: z
					.string()
					.min(CONTAINER_NAME_MIN_LENGTH)
					.max(CONTAINER_NAME_MAX_LENGTH)
					.regex(
						CONTAINER_NAME_PATTERN,
						"コンテナ名は英数字とハイフン・アンダースコア・ピリオドのみ使用できます",
					)
					.describe("作成するコンテナ名"),
			},
		},
		async ({ name }) => {
			const TENANT_ID = process.env.OPENSTACK_TENANT_ID;
			if (!TENANT_ID) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								error: "OPENSTACK_TENANT_ID が設定されていません",
							}),
						},
					],
					isError: true,
				};
			}
			const raw = await setPutStorageMetadata(
				`/v1/AUTH_${TENANT_ID}/${encodeURIComponent(name)}`,
			);
			const parsed = JSON.parse(raw) as StorageRawResponse;
			// PUT は 201 Created（新規）または 202 Accepted（既存・no-op）が成功
			if (parsed.status !== 201 && parsed.status !== 202) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								error: `コンテナ作成に失敗しました (${parsed.status})`,
								detail: raw,
							}),
						},
					],
					isError: true,
				};
			}
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({
							container: { name },
							created: parsed.status === 201,
						}),
					},
				],
			};
		},
	);
}

/**
 * delete_container: ストレージコンテナを削除
 *
 * @remarks
 * 冪等: いいえ（存在しないコンテナへの DELETE は 404）
 * ドライラン: 非対応
 * Swift は空でないコンテナを削除できないため、事前にオブジェクトを空にする必要がある
 * @internal
 */
function registerDeleteContainer(server: McpServer): void {
	server.registerTool(
		"delete_container",
		{
			title: "ストレージコンテナ削除",
			description:
				"オブジェクトストレージのコンテナを削除します。空でないコンテナは削除できません。",
			inputSchema: {
				name: z.string().min(1).describe("削除するコンテナ名"),
			},
		},
		async ({ name }) => {
			const raw = await deleteStorageContainer(
				`/v1/AUTH_{tenantId}/${encodeURIComponent(name)}`,
			);
			const parsed = JSON.parse(raw) as StorageRawResponse;
			if (parsed.status !== 204) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								error: `コンテナ削除に失敗しました (${parsed.status})`,
								detail: raw,
								...(parsed.status === 409 && {
									hint: "コンテナが空ではありません。先にオブジェクトを全て削除してください。",
								}),
							}),
						},
					],
					isError: true,
				};
			}
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({ container: { name }, deleted: true }),
					},
				],
			};
		},
	);
}

/**
 * 指定コンテナ内のオブジェクト一覧を解決（実API）
 *
 * @internal
 */
async function resolveObjects(containerName: string): Promise<AppObject[]> {
	const TENANT_ID = process.env.OPENSTACK_TENANT_ID;
	if (!TENANT_ID) return [];
	const raw = await getStorageObjectList(
		`/v1/AUTH_${TENANT_ID}/${encodeURIComponent(containerName)}?format=json`,
	);
	const parsed = JSON.parse(raw) as StorageRawResponse & { body: unknown };
	if (parsed.status !== 200) return [];
	const list = Array.isArray(parsed.body) ? parsed.body : [];
	return list.map(mapSwiftObjectToAppObject);
}

/**
 * Swift object オブジェクトを AppObject に変換
 *
 * @internal
 */
function mapSwiftObjectToAppObject(o: unknown): AppObject {
	const obj = (o ?? {}) as Record<string, unknown>;
	return {
		name: String(obj.name ?? ""),
		bytes: Number(obj.bytes ?? 0),
		content_type: String(obj.content_type ?? "application/octet-stream"),
		...(obj.last_modified ? { last_modified: String(obj.last_modified) } : {}),
		...(obj.hash ? { hash: String(obj.hash) } : {}),
	};
}

/**
 * list_objects: コンテナ内のオブジェクト一覧を取得
 *
 * @internal
 */
function registerListObjects(server: McpServer): void {
	server.registerTool(
		"list_objects",
		{
			title: "コンテナ内オブジェクト一覧取得",
			description:
				"指定したストレージコンテナ内のオブジェクト一覧（名前・サイズ・MIMEタイプ）を取得します。",
			inputSchema: {
				container: z.string().min(1).describe("コンテナ名"),
			},
			outputSchema: {
				container: z.string(),
				objects: z.array(AppObjectSchema),
				total: z.number(),
			},
		},
		async ({ container }) => {
			const objects = await resolveObjects(container);
			const output = { container, objects, total: objects.length };
			return {
				content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
				structuredContent: output,
			};
		},
	);
}

/**
 * upload_object: コンテナにオブジェクトをアップロード
 *
 * @remarks
 * ブラウザの File API で読み出した内容を Base64 エンコードして渡す。
 * MCP メッセージサイズの制約があるため大きなファイル（おおむね 10MB 超）は推奨しない。
 * @internal
 */
function registerUploadObject(server: McpServer): void {
	server.registerTool(
		"upload_object",
		{
			title: "オブジェクトアップロード",
			description:
				"指定コンテナにオブジェクトをアップロードします。content_base64 はブラウザの File API で得たバイト列の Base64 エンコード文字列を渡してください。",
			inputSchema: {
				container: z.string().min(1).describe("アップロード先のコンテナ名"),
				object_name: z.string().min(1).describe("オブジェクト名"),
				content_base64: z
					.string()
					.min(1)
					.describe("Base64 エンコードされたオブジェクト本体"),
				content_type: z
					.string()
					.optional()
					.describe("MIMEタイプ（省略時は application/octet-stream 相当）"),
			},
		},
		async ({ container, object_name, content_base64, content_type }) => {
			const TENANT_ID = process.env.OPENSTACK_TENANT_ID;
			if (!TENANT_ID) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								error: "OPENSTACK_TENANT_ID が設定されていません",
							}),
						},
					],
					isError: true,
				};
			}
			const path = `/v1/AUTH_${TENANT_ID}/${encodeURIComponent(container)}/${encodeURIComponent(object_name)}`;
			const raw = await uploadStorageObjectDecoded(
				path,
				content_base64,
				content_type,
			);
			const parsed = JSON.parse(raw) as StorageRawResponse;
			// PUT は 201 Created（新規）または 202 Accepted（上書き）が成功
			if (parsed.status !== 201 && parsed.status !== 202) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								error: `アップロードに失敗しました (${parsed.status})`,
								detail: raw,
							}),
						},
					],
					isError: true,
				};
			}
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({
							object: {
								name: object_name,
								bytes: Math.floor((content_base64.length * 3) / 4),
								content_type: content_type ?? "application/octet-stream",
							},
							uploaded: true,
						}),
					},
				],
			};
		},
	);
}

/**
 * delete_object: コンテナ内のオブジェクトを削除
 *
 * @internal
 */
function registerDeleteObject(server: McpServer): void {
	server.registerTool(
		"delete_object",
		{
			title: "オブジェクト削除",
			description: "指定コンテナ内のオブジェクトを削除します。",
			inputSchema: {
				container: z.string().min(1).describe("コンテナ名"),
				object_name: z.string().min(1).describe("削除するオブジェクト名"),
			},
		},
		async ({ container, object_name }) => {
			const path = `/v1/AUTH_{tenantId}/${encodeURIComponent(container)}/${encodeURIComponent(object_name)}`;
			const raw = await deleteStorageObject(path);
			const parsed = JSON.parse(raw) as StorageRawResponse;
			if (parsed.status !== 204) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								error: `オブジェクト削除に失敗しました (${parsed.status})`,
								detail: raw,
							}),
						},
					],
					isError: true,
				};
			}
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({
							object: { name: object_name },
							deleted: true,
						}),
					},
				],
			};
		},
	);
}

/**
 * get_container_public_state: コンテナのWeb公開状態を取得
 *
 * @remarks
 * 冪等: はい（参照のみ）
 * HEAD で X-Container-Read ヘッダを取得し、`.r:*` の有無で公開状態を判定する。
 * @internal
 */
function registerGetContainerPublicState(server: McpServer): void {
	server.registerTool(
		"get_container_public_state",
		{
			title: "コンテナのWeb公開状態取得",
			description:
				"指定コンテナがWeb公開（匿名読み取り可）になっているか、公開URLとともに返します。",
			inputSchema: {
				container: z.string().min(1).describe("対象コンテナ名"),
			},
			outputSchema: {
				container: z.string(),
				public: z.boolean(),
				public_url: z.string().optional(),
				read_acl: z.string().optional(),
			},
		},
		async ({ container }) => {
			const TENANT_ID = process.env.OPENSTACK_TENANT_ID;
			if (!TENANT_ID) {
				const output = { container, public: false };
				return {
					content: [{ type: "text", text: JSON.stringify(output) }],
					structuredContent: output,
				};
			}
			const raw = await getStorageContainerInfo(
				`/v1/AUTH_${TENANT_ID}/${encodeURIComponent(container)}`,
			);
			const parsed = JSON.parse(raw) as StorageRawResponse & {
				headers?: Record<string, string>;
			};
			const readAcl = parsed.headers?.["x-container-read"] ?? "";
			const isPublic = readAcl.includes(".r:*");
			const output: {
				container: string;
				public: boolean;
				public_url?: string;
				read_acl?: string;
			} = { container, public: isPublic };
			if (isPublic) {
				output.public_url = buildPublicUrl(TENANT_ID, container);
			}
			if (readAcl) {
				output.read_acl = readAcl;
			}
			return {
				content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
				structuredContent: output,
			};
		},
	);
}

/**
 * enable_web_publish: コンテナをWeb公開する（匿名読み取り許可）
 *
 * @remarks
 * 冪等: はい（同じ ACL を再設定しても結果は同じ）
 * `X-Container-Read: .r:*,.rlistings` を設定し、コンテナ内のオブジェクトを
 * 認証なしで取得可能にする。静的サイトホスティングの起点として利用する。
 * @internal
 */
function registerEnableWebPublish(server: McpServer): void {
	server.registerTool(
		"enable_web_publish",
		{
			title: "コンテナのWeb公開を有効化",
			description:
				"コンテナを匿名読み取り可能にし、静的サイトとして配信できるようにします (X-Container-Read: .r:*,.rlistings)。",
			inputSchema: {
				container: z.string().min(1).describe("公開するコンテナ名"),
			},
		},
		async ({ container }) => {
			const TENANT_ID = process.env.OPENSTACK_TENANT_ID;
			if (!TENANT_ID) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								error: "OPENSTACK_TENANT_ID が設定されていません",
							}),
						},
					],
					isError: true,
				};
			}
			const raw = await setPostStorageMetadata(
				`/v1/AUTH_${TENANT_ID}/${encodeURIComponent(container)}`,
				{ "X-Container-Read": ".r:*,.rlistings" },
			);
			const parsed = JSON.parse(raw) as StorageRawResponse;
			// POST のメタデータ設定は 204 No Content が成功
			if (parsed.status !== 204 && parsed.status !== 202) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								error: `Web公開の有効化に失敗しました (${parsed.status})`,
								detail: raw,
							}),
						},
					],
					isError: true,
				};
			}
			const publicUrl = buildPublicUrl(TENANT_ID, container);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({
							container: {
								name: container,
								public: true,
								public_url: publicUrl,
							},
							published: true,
						}),
					},
				],
			};
		},
	);
}

/**
 * disable_web_publish: コンテナのWeb公開を無効化する
 *
 * @remarks
 * 冪等: はい（既に非公開でも同じ結果）
 * `X-Container-Read` を空にして匿名アクセスを停止する。
 * @internal
 */
function registerDisableWebPublish(server: McpServer): void {
	server.registerTool(
		"disable_web_publish",
		{
			title: "コンテナのWeb公開を無効化",
			description: "コンテナの匿名読み取りを停止し、Web公開状態を解除します。",
			inputSchema: {
				container: z.string().min(1).describe("非公開化するコンテナ名"),
			},
		},
		async ({ container }) => {
			const TENANT_ID = process.env.OPENSTACK_TENANT_ID;
			if (!TENANT_ID) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								error: "OPENSTACK_TENANT_ID が設定されていません",
							}),
						},
					],
					isError: true,
				};
			}
			const raw = await setPostStorageMetadata(
				`/v1/AUTH_${TENANT_ID}/${encodeURIComponent(container)}`,
				{ "X-Container-Read": "" },
			);
			const parsed = JSON.parse(raw) as StorageRawResponse;
			if (parsed.status !== 204 && parsed.status !== 202) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								error: `Web公開の無効化に失敗しました (${parsed.status})`,
								detail: raw,
							}),
						},
					],
					isError: true,
				};
			}
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({
							container: { name: container, public: false },
							published: false,
						}),
					},
				],
			};
		},
	);
}
