import { Buffer } from "node:buffer";
import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { formatErrorMessage } from "./features/openstack/common/error-handler.js";
import {
	CreateServerRequestSchema,
	CreateSSHKeyPairRequestSchema,
	OperateServerRequestSchema,
	RemoteConsoleRequestSchema,
} from "./features/openstack/compute/compute-schema.js";
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
	conohaPostDescription,
	conohaPostPutByParamDescription,
	createServerDescription,
	encodeBase64Description,
	fetchUrlDescription,
} from "./tool-descriptions.js";
import {
	conohaDeleteByParamHandlers,
	conohaGetByParamHandlers,
	conohaGetHandlers,
	conohaPostHandlers,
	conohaPostPutByParamHandlers,
} from "./tool-routing-tables.js";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json");
const server = new McpServer({
	name: "ConoHa VPS MCP",
	version: packageJson.version,
});

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
			const response = await fetch(url);
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
			path: z.enum([
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
			]),
		},
		outputSchema: {
			response: z.string(),
		},
	},
	async ({ path }) => {
		try {
			const handler = conohaGetHandlers[path];
			const response = await handler();
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
			param: z.string(),
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
	"conoha_post_put_by_param",
	{
		title: "ConoHa API更新・操作",
		description: conohaPostPutByParamDescription.trim(),
		inputSchema: {
			input: z.discriminatedUnion("path", [
				z.object({
					path: z.literal("/action"),
					param: z.string(),
					requestBody: OperateServerRequestSchema,
				}),
				z.object({
					path: z.literal("/remote-consoles"),
					param: z.string(),
					requestBody: RemoteConsoleRequestSchema,
				}),
				z.object({
					path: z.literal("/v2.0/security-groups"),
					param: z.string(),
					requestBody: UpdateSecurityGroupRequestSchema,
				}),
				z.object({
					path: z.literal("/v2.0/ports"),
					param: z.string(),
					requestBody: UpdatePortRequestSchema,
				}),
				z.object({
					path: z.literal("/volumes"),
					param: z.string(),
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
			]),
			param: z.string(),
		},
		outputSchema: {
			response: z.string(),
		},
	},
	async ({ path, param }) => {
		try {
			const handler = conohaDeleteByParamHandlers[path];
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
