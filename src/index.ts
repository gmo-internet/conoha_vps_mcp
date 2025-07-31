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

server.tool(
	"conoha_get",
	conohaGetDescription,
	{
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
		]),
	},
	async ({ path }) => {
		try {
			const handler = conohaGetHandlers[path];
			const response = await handler();
			return { content: [{ type: "text", text: response }] };
		} catch (error) {
			const errorMessage = formatErrorMessage(error);
			return {
				content: [{ type: "text", text: errorMessage }],
				isError: true,
			};
		}
	},
);

server.tool(
	"conoha_get_by_param",
	conohaGetByParamDescription,
	{
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
	async ({ path, param }) => {
		try {
			const handler = conohaGetByParamHandlers[path];
			const response = await handler(param);
			return { content: [{ type: "text", text: response }] };
		} catch (error) {
			const errorMessage = formatErrorMessage(error);
			return {
				content: [{ type: "text", text: errorMessage }],
				isError: true,
			};
		}
	},
);

server.tool(
	"conoha_post",
	conohaPostDescription,
	{
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
	async ({ input }) => {
		try {
			const { path, requestBody } = input;
			const handler = conohaPostHandlers[path];
			const response = await handler(requestBody);
			return { content: [{ type: "text", text: response }] };
		} catch (error) {
			const errorMessage = formatErrorMessage(error);
			return {
				content: [{ type: "text", text: errorMessage }],
				isError: true,
			};
		}
	},
);

server.tool(
	"conoha_post_put_by_param",
	conohaPostPutByParamDescription,
	{
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
	async ({ input }) => {
		try {
			const { path, param, requestBody } = input;
			const handler = conohaPostPutByParamHandlers[path];
			const response = await handler(param, requestBody);
			return { content: [{ type: "text", text: response }] };
		} catch (error) {
			const errorMessage = formatErrorMessage(error);
			return {
				content: [{ type: "text", text: errorMessage }],
				isError: true,
			};
		}
	},
);

server.tool(
	"conoha_delete_by_param",
	conohaDeleteByParamDescription,
	{
		path: z.enum([
			"/servers",
			"/os-keypairs",
			"/v2.0/security-groups",
			"/v2.0/security-group-rules",
			"/volumes",
		]),
		param: z.string(),
	},
	async ({ path, param }) => {
		try {
			const handler = conohaDeleteByParamHandlers[path];
			const response = await handler(param);
			return { content: [{ type: "text", text: response }] };
		} catch (error) {
			const errorMessage = formatErrorMessage(error);
			return {
				content: [{ type: "text", text: errorMessage }],
				isError: true,
			};
		}
	},
);

server.prompt(
	"create_server",
	createServerDescription,
	{
		rootPassword: z.string().regex(
			/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[\\^$+\-*/|()[\]{}.,?!_=&@~%#:;'"])[A-Za-z0-9\\^$+\-*/|()[\]{}.,?!_=&@~%#:;'"]{9,70}$/, // 9文字以上70文字以下で、英大文字、英小文字、数字、記号を含む、利用可能な記号は \^$+-*/|()[]{}.,?!_=&@~%#:;'"
		),
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
