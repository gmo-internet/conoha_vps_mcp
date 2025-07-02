import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
	createCompute,
	createComputeByParam,
	deleteComputeByParam,
	getCompute,
	getComputeByParam,
} from "./features/openstack/compute/compute-client.js";
import {
	CreateServerRequestSchema,
	CreateSSHKeyPairRequestSchema,
	OperateServerRequestSchema,
	RemoteConsoleRequestSchema,
} from "./features/openstack/compute/compute-schema.js";
import { getImage } from "./features/openstack/image/image-client.js";
import {
	createNetwork,
	deleteNetworkByParam,
	getNetwork,
	getNetworkByParam,
	updateNetworkByParam,
} from "./features/openstack/network/network-client.js";
import {
	CreateSecurityGroupRequestSchema,
	CreateSecurityGroupRuleRequestSchema,
	UpdatePortRequestSchema,
	UpdateSecurityGroupRequestSchema,
} from "./features/openstack/network/network-schema.js";
import {
	createVolume,
	deleteVolumeByParam,
	getVolume,
	updateVolumeByParam,
} from "./features/openstack/volume/volume-client.js";
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
		let response: string;

		switch (path) {
			case "/servers/detail":
			case "/flavors/detail":
			case "/os-keypairs":
				response = await getCompute(path);
				break;

			case "/types":
			case "/volumes/detail":
				response = await getVolume(path);
				break;

			case "/v2/images?limit=200":
				response = await getImage(path);
				break;

			case "/v2.0/security-groups":
			case "/v2.0/security-group-rules":
			case "/v2.0/ports":
				response = await getNetwork(path);
				break;

			default:
				throw new Error(`Unhandled path: ${path}`);
		}
		return { content: [{ type: "text", text: response }] };
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
		let response: string;

		switch (path) {
			case "/ips":
			case "/os-security-groups":
			case "/rrd/cpu":
			case "/rrd/disk":
				response = await getComputeByParam(path, param);
				break;

			case "/v2.0/security-groups":
			case "/v2.0/security-group-rules":
				response = await getNetworkByParam(path, param);
				break;

			default:
				throw new Error(`Unhandled path: ${path}`);
		}
		return { content: [{ type: "text", text: response }] };
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
		const { path, requestBody } = input;

		let response: string;

		switch (path) {
			case "/servers":
			case "/os-keypairs":
				response = await createCompute(path, requestBody);
				break;

			case "/volumes":
				response = await createVolume(path, requestBody);
				break;

			case "/v2.0/security-groups":
			case "/v2.0/security-group-rules":
				response = await createNetwork(path, requestBody);
				break;

			default:
				throw new Error(`Unhandled path: ${path}`);
		}
		return { content: [{ type: "text", text: response }] };
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
		const { path, param, requestBody } = input;

		let response: string;

		switch (path) {
			case "/action":
			case "/remote-consoles":
				response = await createComputeByParam(path, param, requestBody);
				break;

			case "/v2.0/security-groups":
			case "/v2.0/ports":
				response = await updateNetworkByParam(path, param, requestBody);
				break;

			case "/volumes":
				response = await updateVolumeByParam(path, param, requestBody);
				break;

			default:
				throw new Error(`Unhandled path: ${path}`);
		}
		return { content: [{ type: "text", text: response }] };
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
		let response: string;

		switch (path) {
			case "/servers":
			case "/os-keypairs":
				response = await deleteComputeByParam(path, param);
				break;

			case "/v2.0/security-groups":
			case "/v2.0/security-group-rules":
				response = await deleteNetworkByParam(path, param);
				break;

			case "/volumes":
				response = await deleteVolumeByParam(path, param);
				break;

			default:
				throw new Error(`Unhandled path: ${path}`);
		}
		return { content: [{ type: "text", text: response }] };
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
