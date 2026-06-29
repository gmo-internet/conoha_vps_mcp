/**
 * ConoHa VPS MCP Server
 *
 * @remarks
 * Model Context Protocol (MCP) サーバーのエントリポイント。
 * AIアシスタントにConoHa VPS OpenStack APIへのアクセスを提供します。
 *
 * 提供するMCPツール:
 * - `fetch_url` - URL取得
 * - `encode_base64` - Base64エンコード
 * - `conoha_get` - ConoHa API取得（一覧取得）
 * - `conoha_get_by_param` - ConoHa API取得（パラメータ指定）
 * - `conoha_post` - ConoHa APIリソース作成
 * - `conoha_post_put_by_param` - ConoHa API更新・操作
 * - `conoha_delete_by_param` - ConoHa APIリソース削除
 * - `conoha_head` - ConoHa アカウント情報・コンテナ詳細取得
 *
 * @packageDocumentation
 */

import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { registerAppsTools } from "./apps/apps-tools.js";
import { formatErrorMessage } from "./features/openstack/common/error-handler.js";
import {
	AttachVolumeRequestSchema,
	CreateServerRequestSchema,
	CreateSSHKeyPairRequestSchema,
	OperateServerRequestSchema,
	RemoteConsoleRequestSchema,
} from "./features/openstack/compute/compute-schema.js";
import { USER_AGENT } from "./features/openstack/constants.js";
import {
	CreateSecurityGroupRequestSchema,
	CreateSecurityGroupRuleRequestSchema,
	UpdatePortRequestSchema,
	UpdateSecurityGroupRequestSchema,
} from "./features/openstack/network/network-schema.js";
import {
	CreateVolumeRequestSchema,
	UpdateVolumeRequestSchema,
} from "./features/openstack/volume/volume-schema.js";
import {
	conohaDeleteByParamDescription,
	conohaGetByParamDescription,
	conohaGetDescription,
	conohaHeadDescription,
	conohaPostDescription,
	conohaPostPutByParamByHeaderbodyDescription,
	conohaPostPutByParamDescription,
	conohaPostPutDescription,
	createServerDescription,
	encodeBase64Description,
	fetchUrlDescription,
} from "./tool-descriptions.js";
import {
	conohaDeleteByParamHandlers,
	conohaGetByParamHandlers,
	conohaGetHandlers,
	conohaHeadHandlers,
	conohaPostHandlers,
	conohaPostPutByHeaderparamHandlers,
	conohaPostPutByParamHandlers,
	conohaPostPutHandlers,
} from "./tool-routing-tables.js";
import type { ConoHaGetPaths, ConoHaPostPutPaths } from "./types.js";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json");

// リソースID（UUID等）。パストラバーサルやエンドポイント逸脱を防ぐため英数・ハイフン・アンダースコアのみ許可
const resourceIdSchema = z
	.string()
	.regex(
		/^[A-Za-z0-9_-]+$/,
		"IDは英数字・ハイフン・アンダースコアのみ使用できます",
	);

// オブジェクトストレージの削除対象パス。conoha_get / conoha_post_put のストレージパスと同形式（/v1/AUTH_{tenantId}/{container}[/{object}]）を許可
const storageObjectPathSchema = z
	.string()
	.regex(
		/^\/v1\/AUTH_\{tenantId\}\/.+$/,
		"オブジェクトストレージのパスは /v1/AUTH_{tenantId}/{container}[/{object}] の形式で指定してください",
	);

const server = new McpServer({
	name: "ConoHa VPS MCP",
	version: packageJson.version,
});

// MCP Apps ツール登録（参照系6ツール）
registerAppsTools(server);

server.registerTool(
	"fetch_url",
	{
		title: "URL取得",
		description: fetchUrlDescription.trim(),
		inputSchema: {
			url: z.string().url(),
		},
		outputSchema: {
			text: z.string(),
		},
	},
	async ({ url }) => {
		try {
			const response = await fetch(url, {
				headers: { "User-Agent": USER_AGENT },
			});
			if (!response.ok) {
				throw new Error(
					`Failed to fetch: ${response.status} ${response.statusText}`,
				);
			}
			const text = await response.text();
			const output = { text };
			return {
				content: [{ type: "text", text: JSON.stringify(output) }],
				structuredContent: output,
			};
		} catch (error) {
			const errorMessage = formatErrorMessage(error);
			return {
				content: [{ type: "text", text: errorMessage }],
				isError: true,
			};
		}
	},
);

server.registerTool(
	"encode_base64",
	{
		title: "Base64エンコード",
		description: encodeBase64Description.trim(),
		inputSchema: {
			text: z.string().min(1).max(10000),
		},
		outputSchema: {
			encoded: z.string(),
		},
	},
	async ({ text }) => {
		try {
			const encoded = Buffer.from(text, "utf-8").toString("base64");
			const output = { encoded };
			return {
				content: [{ type: "text", text: JSON.stringify(output) }],
				structuredContent: output,
			};
		} catch (error) {
			const errorMessage = formatErrorMessage(error);
			return {
				content: [{ type: "text", text: errorMessage }],
				isError: true,
			};
		}
	},
);

server.registerTool(
	"conoha_get",
	{
		title: "ConoHa API取得",
		description: conohaGetDescription.trim(),
		inputSchema: {
			path: z.union([
				z.enum([
					"/servers/detail",
					"/flavors/detail",
					"/os-keypairs",
					"/types",
					"/volumes/detail",
					"/v2/images?limit=200",
					"/v2.0/security-groups",
					"/v2.0/security-group-rules",
					"/v2.0/ports",
					"/startup-scripts",
					"/v1/AUTH_{tenantId}",
				]),
				z.string().regex(/^\/v1\/AUTH_\{tenantId\}\/.+$/),
			]),
		},
		outputSchema: {
			response: z.string(),
		},
	},
	async ({ path }) => {
		try {
			const TENANT_ID = process.env.OPENSTACK_TENANT_ID;
			if (!TENANT_ID) {
				throw new Error("OPENSTACK_TENANT_ID is not defined");
			}

			let resolvedPath: string = path;
			let handlerKey: ConoHaGetPaths = path as ConoHaGetPaths;

			if (path === "/v1/AUTH_{tenantId}") {
				resolvedPath = path.replace("{tenantId}", TENANT_ID);
			} else if (path.startsWith("/v1/AUTH_{tenantId}/")) {
				resolvedPath = path.replace("{tenantId}", TENANT_ID);

				const pathParts = path.split("/");
				if (pathParts.length >= 5 && pathParts[4]) {
					handlerKey = "/v1/AUTH_{tenantId}/{container}/{object}";
				} else {
					handlerKey = "/v1/AUTH_{tenantId}/{container}";
				}
			}

			const handler = conohaGetHandlers[handlerKey];
			const response = await handler(resolvedPath);
			const output = { response };
			return {
				content: [{ type: "text", text: JSON.stringify(output) }],
				structuredContent: output,
			};
		} catch (error) {
			const errorMessage = formatErrorMessage(error);
			return {
				content: [{ type: "text", text: errorMessage }],
				isError: true,
			};
		}
	},
);

server.registerTool(
	"conoha_get_by_param",
	{
		title: "ConoHa API取得（パラメータ指定）",
		description: conohaGetByParamDescription.trim(),
		inputSchema: {
			path: z.enum([
				"/ips",
				"/os-security-groups",
				"/rrd/cpu",
				"/rrd/disk",
				"/v2.0/security-groups",
				"/v2.0/security-group-rules",
			]),
			param: resourceIdSchema,
		},
		outputSchema: {
			response: z.string(),
		},
	},
	async ({ path, param }) => {
		try {
			const handler = conohaGetByParamHandlers[path];
			const response = await handler(param);
			const output = { response };
			return {
				content: [{ type: "text", text: JSON.stringify(output) }],
				structuredContent: output,
			};
		} catch (error) {
			const errorMessage = formatErrorMessage(error);
			return {
				content: [{ type: "text", text: errorMessage }],
				isError: true,
			};
		}
	},
);

server.registerTool(
	"conoha_post",
	{
		title: "ConoHa API作成",
		description: conohaPostDescription.trim(),
		inputSchema: {
			input: z.discriminatedUnion("path", [
				z.object({
					path: z.literal("/servers"),
					requestBody: CreateServerRequestSchema,
				}),
				z.object({
					path: z.literal("/os-keypairs"),
					requestBody: CreateSSHKeyPairRequestSchema,
				}),
				z.object({
					path: z.literal("/volumes"),
					requestBody: CreateVolumeRequestSchema,
				}),
				z.object({
					path: z.literal("/v2.0/security-groups"),
					requestBody: CreateSecurityGroupRequestSchema,
				}),
				z.object({
					path: z.literal("/v2.0/security-group-rules"),
					requestBody: CreateSecurityGroupRuleRequestSchema,
				}),
			]),
		},
		outputSchema: {
			response: z.string(),
		},
	},
	async ({ input }) => {
		try {
			const { path, requestBody } = input;
			const handler = conohaPostHandlers[path];
			const response = await handler(requestBody);
			const output = { response };
			return {
				content: [{ type: "text", text: JSON.stringify(output) }],
				structuredContent: output,
			};
		} catch (error) {
			const errorMessage = formatErrorMessage(error);
			return {
				content: [{ type: "text", text: errorMessage }],
				isError: true,
			};
		}
	},
);

server.registerTool(
	"conoha_post_put",
	{
		title: "ConoHa API更新・操作",
		description: conohaPostPutDescription.trim(),
		inputSchema: {
			input: z.union([
				z.object({
					path: z.string().regex(/^\/v1\/AUTH_\{tenantId\}\/[^/]+$/),
				}),
				z.object({
					path: z.string().regex(/^\/v1\/AUTH_\{tenantId\}\/.+\/.+$/),
					content: z.string(),
					contentType: z.string().optional(),
				}),
			]),
		},
		outputSchema: {
			response: z.string(),
		},
	},
	async ({ input }) => {
		try {
			const TENANT_ID = process.env.OPENSTACK_TENANT_ID;
			if (!TENANT_ID) {
				throw new Error("OPENSTACK_TENANT_ID is not defined");
			}

			const path = input.path.replace("{tenantId}", TENANT_ID);

			const pathParts = input.path.split("/");
			let handlerKey: ConoHaPostPutPaths;

			if (pathParts.length >= 5 && pathParts[4]) {
				handlerKey = "/v1/AUTH_{tenantId}/{container}/{object}";
			} else {
				handlerKey = "/v1/AUTH_{tenantId}/{container}";
			}

			const handler = conohaPostPutHandlers[handlerKey];

			let base64Content: string | undefined;
			if ("content" in input && input.content) {
				const fileBuffer = await readFile(input.content);
				base64Content = fileBuffer.toString("base64");
			}

			const response = await handler(
				path,
				base64Content,
				"contentType" in input ? input.contentType : undefined,
			);
			const output = { response };
			return {
				content: [{ type: "text", text: JSON.stringify(output) }],
				structuredContent: output,
			};
		} catch (error) {
			const errorMessage = formatErrorMessage(error);
			return {
				content: [{ type: "text", text: errorMessage }],
				isError: true,
			};
		}
	},
);

server.registerTool(
	"conoha_post_put_by_param",
	{
		title: "ConoHa API更新・操作",
		description: conohaPostPutByParamDescription.trim(),
		inputSchema: {
			input: z.discriminatedUnion("path", [
				z.object({
					path: z.literal("/action"),
					param: resourceIdSchema,
					requestBody: OperateServerRequestSchema,
				}),
				z.object({
					path: z.literal("/remote-consoles"),
					param: resourceIdSchema,
					requestBody: RemoteConsoleRequestSchema,
				}),
				z.object({
					path: z.literal("/os-volume_attachments"),
					param: resourceIdSchema,
					requestBody: AttachVolumeRequestSchema,
				}),
				z.object({
					path: z.literal("/v2.0/security-groups"),
					param: resourceIdSchema,
					requestBody: UpdateSecurityGroupRequestSchema,
				}),
				z.object({
					path: z.literal("/v2.0/ports"),
					param: resourceIdSchema,
					requestBody: UpdatePortRequestSchema,
				}),
				z.object({
					path: z.literal("/volumes"),
					param: resourceIdSchema,
					requestBody: UpdateVolumeRequestSchema,
				}),
			]),
		},
		outputSchema: {
			response: z.string(),
		},
	},
	async ({ input }) => {
		try {
			const { path, param, requestBody } = input;
			const handler = conohaPostPutByParamHandlers[path];
			const response = await handler(param, requestBody);
			const output = { response };
			return {
				content: [{ type: "text", text: JSON.stringify(output) }],
				structuredContent: output,
			};
		} catch (error) {
			const errorMessage = formatErrorMessage(error);
			return {
				content: [{ type: "text", text: errorMessage }],
				isError: true,
			};
		}
	},
);

server.registerTool(
	"conoha_post_by_header_param",
	{
		title: "ConoHa API更新・操作（ヘッダーパラメータ指定）",
		description: conohaPostPutByParamByHeaderbodyDescription.trim(),
		inputSchema: {
			input: z.union([
				z.object({
					path: z.literal("/v1/AUTH_{tenantId}"),
					headerparam: z.object({
						"X-Account-Meta-Quota-Giga-Bytes": z.string(),
					}),
				}),
				z.object({
					path: z.string().regex(/^\/v1\/AUTH_\{tenantId\}\/.+$/),
					headerparam: z.object({
						"X-Container-Read": z.string(),
					}),
				}),
			]),
		},
		outputSchema: {
			response: z.string(),
		},
	},
	async ({ input }) => {
		try {
			const TENANT_ID = process.env.OPENSTACK_TENANT_ID;
			if (!TENANT_ID) {
				throw new Error("OPENSTACK_TENANT_ID is not defined");
			}

			const path = input.path.replace("{tenantId}", TENANT_ID);

			const handler = conohaPostPutByHeaderparamHandlers["/v1"];
			const response = await handler(path, input.headerparam);
			const output = { response };
			return {
				content: [{ type: "text", text: JSON.stringify(output) }],
				structuredContent: output,
			};
		} catch (error) {
			const errorMessage = formatErrorMessage(error);
			return {
				content: [{ type: "text", text: errorMessage }],
				isError: true,
			};
		}
	},
);

server.registerTool(
	"conoha_delete_by_param",
	{
		title: "ConoHa API削除",
		description: conohaDeleteByParamDescription.trim(),
		inputSchema: {
			path: z.enum([
				"/servers",
				"/os-keypairs",
				"/v2.0/security-groups",
				"/v2.0/security-group-rules",
				"/volumes",
				"/v1/AUTH_{tenantId}/{container}",
				"/v1/AUTH_{tenantId}/{container}/{object}",
			]),
			param: z.union([resourceIdSchema, storageObjectPathSchema]),
		},
		outputSchema: {
			response: z.string(),
		},
	},
	async ({ path, param }) => {
		try {
			// ストレージ削除はフルパス、それ以外はリソースIDのみ許可（非ストレージ経路へのパストラバーサルを防止）
			const isStorageDeletePath =
				path === "/v1/AUTH_{tenantId}/{container}" ||
				path === "/v1/AUTH_{tenantId}/{container}/{object}";
			const validatedParam = isStorageDeletePath
				? storageObjectPathSchema.parse(param)
				: resourceIdSchema.parse(param);
			const handler = conohaDeleteByParamHandlers[path];
			const response = await handler(validatedParam);
			const output = { response };
			return {
				content: [{ type: "text", text: JSON.stringify(output) }],
				structuredContent: output,
			};
		} catch (error) {
			const errorMessage = formatErrorMessage(error);
			return {
				content: [{ type: "text", text: errorMessage }],
				isError: true,
			};
		}
	},
);

server.registerTool(
	"conoha_head",
	{
		title: "ConoHa アカウント情報・コンテナ詳細取得",
		description: conohaHeadDescription.trim(),
		inputSchema: {
			path: z.union([
				z.literal("/v1/AUTH_{tenantId}"),
				z.string().regex(/^\/v1\/AUTH_\{tenantId\}\/.+$/),
			]),
		},
		outputSchema: {
			response: z.string(),
		},
	},
	async ({ path }) => {
		try {
			const TENANT_ID = process.env.OPENSTACK_TENANT_ID;
			if (!TENANT_ID) {
				throw new Error("OPENSTACK_TENANT_ID is not defined");
			}

			const resolvedPath = path.replace("{tenantId}", TENANT_ID);

			const handler = conohaHeadHandlers["/v1"];
			const response = await handler(resolvedPath);
			const output = { response };
			return {
				content: [{ type: "text", text: JSON.stringify(output) }],
				structuredContent: output,
			};
		} catch (error) {
			const errorMessage = formatErrorMessage(error);
			return {
				content: [{ type: "text", text: errorMessage }],
				isError: true,
			};
		}
	},
);

server.registerPrompt(
	"create_server",
	{
		title: "サーバー作成",
		description: createServerDescription.trim(),
		argsSchema: {
			rootPassword: z.string().regex(
				/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[\\^$+\-*/|()[\]{}.,?!_=&@~%#:;'"])[A-Za-z0-9\\^$+\-*/|()[\]{}.,?!_=&@~%#:;'"]{9,70}$/, // 9文字以上70文字以下で、英大文字、英小文字、数字、記号を含む、利用可能な記号は \^$+-*/|()[]{}.,?!_=&@~%#:;'"
			),
		},
	},
	({ rootPassword }) => ({
		messages: [
			{
				role: "user",
				content: {
					type: "text",
					text: `rootパスワードを${rootPassword}として、新しいサーバーを作成してください。また、開放するポートなど、必要な情報は都度確認してください。`,
				},
			},
		],
	}),
);

const transport = new StdioServerTransport();
await server.connect(transport);
