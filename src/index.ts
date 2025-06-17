import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import "dotenv/config";
import {
	deleteOpenstackComputeApiId,
	getOpenstackComputeApi,
	getOpenstackComputeApiId,
	postOpenstackComputeApiRequestBody,
	postOpenstackComputeApiRequestBody1Id,
} from "./features/openstack/compute/fetch-compute";
import {
	CreateSSHKeyPairRequestSchema,
	CreateServerRequestSchema,
	OperateServerRequestSchema,
	RemoteConsoleRequestSchema,
} from "./features/openstack/compute/schema-compute";
import { getOpenstackImageApi } from "./features/openstack/image/fetch-image";
import {
	deleteOpenstackNetworkApiId,
	getOpenstackNetworkApi,
	getOpenstackNetworkApiId,
	postOpenstackNetworkApiRequestBody,
	putOpenstackNetworkApiRequestBody1Id,
} from "./features/openstack/network/fetch-network";
import {
	CreateSecurityGroupRequestSchema,
	CreateSecurityGroupRuleRequestSchema,
	UpdatePortRequestSchema,
	UpdateSecurityGroupRequestSchema,
} from "./features/openstack/network/schema-network";
import {
	deleteOpenstackVolumeApiId,
	getOpenstackVolumeApi,
	postOpenstackVolumeApiRequestBody,
	putOpenstackVolumeApiRequestBody1Id,
} from "./features/openstack/volume/fetch-volume";
import {
	CreateVolumeRequestSchema,
	UpdateVolumeRequestSchema,
} from "./features/openstack/volume/schema-volume";
import {
	conohaOpenstackDeleteIdDescription,
	conohaOpenstackGetIdDescription,
	conohaOpenstackGetNoParamDescription,
	conohaOpenstackPostPutRequestBodyIdDescription,
	conohaOpenstackPostRequestBodyDescription,
	createServerDescription,
} from "./tool-descriptions";

const server = new McpServer({ name: "conoha-stdio", version: "0.2.0" });

server.tool(
	"conoha_openstack_get_no_id",
	conohaOpenstackGetNoParamDescription,
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
				response = await getOpenstackComputeApi(path);
				break;

			case "/types":
			case "/volumes/detail":
				response = await getOpenstackVolumeApi(path);
				break;

			case "/v2/images?limit=200":
				response = await getOpenstackImageApi(path);
				break;

			case "/v2.0/security-groups":
			case "/v2.0/security-group-rules":
			case "/v2.0/ports":
				response = await getOpenstackNetworkApi(path);
				break;

			default:
				throw new Error(`Unhandled path: ${path}`);
		}
		return { content: [{ type: "text", text: response }] };
	},
);

server.tool(
	"conoha_openstack_get_id",
	conohaOpenstackGetIdDescription,
	{
		path: z.enum([
			"/ips",
			"/os-security-groups",
			"/rrd/cpu",
			"/rrd/disk",
			"/v2.0/security-groups",
			"/v2.0/security-group-rules",
		]),
		id: z.string(),
	},
	async ({ path, id }) => {
		let response: string;

		switch (path) {
			case "/ips":
			case "/os-security-groups":
			case "/rrd/cpu":
			case "/rrd/disk":
				response = await getOpenstackComputeApiId(path, id);
				break;

			case "/v2.0/security-groups":
			case "/v2.0/security-group-rules":
				response = await getOpenstackNetworkApiId(path, id);
				break;

			default:
				throw new Error(`Unhandled path: ${path}`);
		}
		return { content: [{ type: "text", text: response }] };
	},
);

server.tool(
	"conoha_openstack_post_request_body",
	conohaOpenstackPostRequestBodyDescription,
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
				response = await postOpenstackComputeApiRequestBody(path, requestBody);
				break;

			case "/volumes":
				response = await postOpenstackVolumeApiRequestBody(path, requestBody);
				break;

			case "/v2.0/security-groups":
			case "/v2.0/security-group-rules":
				response = await postOpenstackNetworkApiRequestBody(path, requestBody);
				break;

			default:
				throw new Error(`Unhandled path: ${path}`);
		}
		return { content: [{ type: "text", text: response }] };
	},
);

server.tool(
	"conoha_openstack_post_put_request_body_id",
	conohaOpenstackPostPutRequestBodyIdDescription,
	{
		input: z.discriminatedUnion("path", [
			z.object({
				path: z.literal("/action"),
				id: z.string(),
				requestBody: OperateServerRequestSchema,
			}),
			z.object({
				path: z.literal("/remote-consoles"),
				id: z.string(),
				requestBody: RemoteConsoleRequestSchema,
			}),
			z.object({
				path: z.literal("/v2.0/security-groups"),
				id: z.string(),
				requestBody: UpdateSecurityGroupRequestSchema,
			}),
			z.object({
				path: z.literal("/v2.0/ports"),
				id: z.string(),
				requestBody: UpdatePortRequestSchema,
			}),
			z.object({
				path: z.literal("/volumes"),
				id: z.string(),
				requestBody: UpdateVolumeRequestSchema,
			}),
		]),
	},
	async ({ input }) => {
		const { path, id, requestBody } = input;

		let response: string;

		switch (path) {
			case "/action":
			case "/remote-consoles":
				response = await postOpenstackComputeApiRequestBody1Id(
					path,
					id,
					requestBody,
				);
				break;

			case "/v2.0/security-groups":
			case "/v2.0/ports":
				response = await putOpenstackNetworkApiRequestBody1Id(
					path,
					id,
					requestBody,
				);
				break;

			case "/volumes":
				response = await putOpenstackVolumeApiRequestBody1Id(
					path,
					id,
					requestBody,
				);
				break;

			default:
				throw new Error(`Unhandled path: ${path}`);
		}
		return { content: [{ type: "text", text: response }] };
	},
);

server.tool(
	"conoha_openstack_delete_param",
	conohaOpenstackDeleteIdDescription,
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
				response = await deleteOpenstackComputeApiId(path, param);
				break;

			case "/v2.0/security-groups":
			case "/v2.0/security-group-rules":
				response = await deleteOpenstackNetworkApiId(path, param);
				break;

			case "/volumes":
				response = await deleteOpenstackVolumeApiId(path, param);
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
			/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[\\\^$+\-*/|()\[\]{}.,?!_=&@~%#:;'"])[A-Za-z0-9\\\^$+\-*/|()\[\]{}.,?!_=&@~%#:;'"]{9,70}$/, // 9文字以上70文字以下で、英大文字、英小文字、数字、記号を含む、利用可能な記号は \^$+-*/|()[]{}.,?!_=&@~%#:;'"
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
