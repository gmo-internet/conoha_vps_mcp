/**
 * MCP Apps ツール統合テスト（オブジェクトストレージ）
 *
 * @remarks
 * McpServer にツール登録し、ハンドラーの動作を検証します。
 * データ源は実 API（storage-client）であり、storage-client を vi.mock して
 * 各 Swift レスポンス（status / body / headers）を差し込み、ハンドラーが
 * 正しいパスで呼び出し・整形・ステータス判定を行うことを確認します。
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerAppsTools } from "./apps-tools";

vi.mock("../features/openstack/storage/storage-client", () => ({
	getStorageContainerList: vi.fn(),
	getStorageObjectList: vi.fn(),
	getStorageContainerInfo: vi.fn(),
	setPutStorageMetadata: vi.fn(),
	setPostStorageMetadata: vi.fn(),
	deleteStorageContainer: vi.fn(),
	deleteStorageObject: vi.fn(),
	uploadStorageObjectDecoded: vi.fn(),
}));

const storage = vi.mocked(
	await import("../features/openstack/storage/storage-client"),
);

/**
 * McpServer の内部ツールハンドラーを直接呼び出すヘルパー
 *
 * @remarks
 * registerTool で登録されたハンドラーを取り出して実行するため、
 * トランスポート接続なしでツール動作を検証できます。
 */
async function callTool(
	server: McpServer,
	toolName: string,
	args: Record<string, unknown>,
) {
	// biome-ignore lint/suspicious/noExplicitAny: SDK内部の_registeredToolsへのアクセス
	const registeredTools = (server as any)._registeredTools;
	const tool = registeredTools[toolName];
	if (!tool) {
		throw new Error(`ツール "${toolName}" が見つかりません`);
	}
	return await tool.handler(args, {});
}

let server: McpServer;

beforeEach(() => {
	vi.clearAllMocks();
	process.env.OPENSTACK_TENANT_ID = "test-tenant";
	server = new McpServer({ name: "test", version: "0.0.1" });
	registerAppsTools(server);
});

afterEach(() => {
	delete process.env.OPENSTACK_TENANT_ID;
});

describe("MCP Apps ツール登録", () => {
	it("ストレージ系の全ツールが登録される（公開トグル含む）", () => {
		// biome-ignore lint/suspicious/noExplicitAny: SDK内部の_registeredToolsへのアクセス
		const registeredTools = (server as any)._registeredTools;
		const toolNames = Object.keys(registeredTools);
		expect(toolNames).toContain("list_containers");
		expect(toolNames).toContain("create_container");
		expect(toolNames).toContain("delete_container");
		expect(toolNames).toContain("list_objects");
		expect(toolNames).toContain("upload_object");
		expect(toolNames).toContain("delete_object");
		expect(toolNames).toContain("get_container_public_state");
		expect(toolNames).toContain("enable_web_publish");
		expect(toolNames).toContain("disable_web_publish");
	});
});

describe("list_containers", () => {
	it("実APIの200レスポンスからコンテナ一覧と総数を返すことができる", async () => {
		storage.getStorageContainerList.mockResolvedValue(
			JSON.stringify({
				status: 200,
				body: [
					{ name: "backups", count: 24, bytes: 4_823_756_902 },
					{ name: "media-assets", count: 142, bytes: 12_456_789_012 },
					{ name: "logs-archive", count: 87, bytes: 392_485_127 },
				],
			}),
		);
		const result = await callTool(server, "list_containers", {});
		expect(result.structuredContent.total).toBe(3);
		expect(result.structuredContent.containers).toHaveLength(3);
		expect(storage.getStorageContainerList).toHaveBeenCalledWith(
			"/v1/AUTH_test-tenant?format=json",
		);
	});

	it("各コンテナに name/count/bytes が数値・文字列として整形されて含まれる", async () => {
		storage.getStorageContainerList.mockResolvedValue(
			JSON.stringify({
				status: 200,
				body: [{ name: "backups", count: 24, bytes: 4_823_756_902 }],
			}),
		);
		const result = await callTool(server, "list_containers", {});
		for (const c of result.structuredContent.containers) {
			expect(c.name).toBeTypeOf("string");
			expect(c.count).toBeTypeOf("number");
			expect(c.bytes).toBeTypeOf("number");
		}
	});

	it("実APIが200以外を返す場合は空のコンテナ一覧を返すことができる", async () => {
		storage.getStorageContainerList.mockResolvedValue(
			JSON.stringify({ status: 401, body: {} }),
		);
		const result = await callTool(server, "list_containers", {});
		expect(result.structuredContent.total).toBe(0);
		expect(result.structuredContent.containers).toEqual([]);
	});

	it("OPENSTACK_TENANT_ID 未設定では実APIを呼ばず空一覧を返すことができる", async () => {
		delete process.env.OPENSTACK_TENANT_ID;
		const result = await callTool(server, "list_containers", {});
		expect(result.structuredContent.total).toBe(0);
		expect(storage.getStorageContainerList).not.toHaveBeenCalled();
	});
});

describe("create_container", () => {
	it("PUT が201を返す場合は created:true で作成成功応答を返すことができる", async () => {
		storage.setPutStorageMetadata.mockResolvedValue(
			JSON.stringify({ status: 201 }),
		);
		const result = await callTool(server, "create_container", {
			name: "my-bucket",
		});
		const data = JSON.parse(result.content[0].text);
		expect(data.container.name).toBe("my-bucket");
		expect(data.created).toBe(true);
		expect(storage.setPutStorageMetadata).toHaveBeenCalledWith(
			"/v1/AUTH_test-tenant/my-bucket",
		);
	});

	it("PUT が202（既存・no-op）を返す場合は created:false で成功応答を返すことができる", async () => {
		storage.setPutStorageMetadata.mockResolvedValue(
			JSON.stringify({ status: 202 }),
		);
		const result = await callTool(server, "create_container", {
			name: "my-bucket",
		});
		const data = JSON.parse(result.content[0].text);
		expect(data.created).toBe(false);
	});

	it("PUT が201/202以外を返す場合は isError のエラー応答を返すことができる", async () => {
		storage.setPutStorageMetadata.mockResolvedValue(
			JSON.stringify({ status: 500 }),
		);
		const result = await callTool(server, "create_container", {
			name: "my-bucket",
		});
		expect(result.isError).toBe(true);
	});

	it("zod inputSchema にコンテナ名の正規表現バリデーションが登録されている", () => {
		// biome-ignore lint/suspicious/noExplicitAny: SDK内部の_registeredToolsへのアクセス
		const registeredTools = (server as any)._registeredTools;
		const tool = registeredTools.create_container;
		expect(tool).toBeDefined();
		const nameSchema = tool.inputSchema?.shape?.name ?? tool.inputSchema?.name;
		expect(nameSchema).toBeDefined();
	});

	it("zod inputSchema が UI と同じ規則で 3 文字未満のコンテナ名を拒否する", () => {
		// biome-ignore lint/suspicious/noExplicitAny: SDK内部の_registeredToolsへのアクセス
		const registeredTools = (server as any)._registeredTools;
		const inputSchema = registeredTools.create_container.inputSchema;
		// 1〜2 文字は不可（旧 .min(1) ではすり抜けていた境界を検証）
		expect(inputSchema.safeParse({ name: "a" }).success).toBe(false);
		expect(inputSchema.safeParse({ name: "ab" }).success).toBe(false);
	});

	it("zod inputSchema が 3 文字以上 63 文字以下の正当なコンテナ名を受理する", () => {
		// biome-ignore lint/suspicious/noExplicitAny: SDK内部の_registeredToolsへのアクセス
		const registeredTools = (server as any)._registeredTools;
		const inputSchema = registeredTools.create_container.inputSchema;
		expect(inputSchema.safeParse({ name: "abc" }).success).toBe(true);
		expect(inputSchema.safeParse({ name: "a".repeat(63) }).success).toBe(true);
		// 64 文字超過は不可
		expect(inputSchema.safeParse({ name: "a".repeat(64) }).success).toBe(false);
	});
});

describe("delete_container", () => {
	it("DELETE が204を返す場合は deleted:true で削除成功応答を返すことができる", async () => {
		storage.deleteStorageContainer.mockResolvedValue(
			JSON.stringify({ status: 204 }),
		);
		const result = await callTool(server, "delete_container", {
			name: "my-bucket",
		});
		const data = JSON.parse(result.content[0].text);
		expect(data.container.name).toBe("my-bucket");
		expect(data.deleted).toBe(true);
	});

	it("DELETE が409（空でない）を返す場合は isError でオブジェクト削除を促す hint を返すことができる", async () => {
		storage.deleteStorageContainer.mockResolvedValue(
			JSON.stringify({ status: 409 }),
		);
		const result = await callTool(server, "delete_container", {
			name: "my-bucket",
		});
		const data = JSON.parse(result.content[0].text);
		expect(result.isError).toBe(true);
		expect(data.hint).toBeDefined();
	});
});

describe("list_objects", () => {
	it("実APIの200レスポンスから指定コンテナのオブジェクト一覧を返すことができる", async () => {
		storage.getStorageObjectList.mockResolvedValue(
			JSON.stringify({
				status: 200,
				body: [
					{
						name: "db.tar.gz",
						bytes: 1_572_864_000,
						content_type: "application/gzip",
					},
				],
			}),
		);
		const result = await callTool(server, "list_objects", {
			container: "backups",
		});
		expect(result.structuredContent.container).toBe("backups");
		expect(result.structuredContent.total).toBe(1);
		expect(storage.getStorageObjectList).toHaveBeenCalledWith(
			"/v1/AUTH_test-tenant/backups?format=json",
		);
	});

	it("実APIが404を返す場合は空のオブジェクト一覧を返すことができる", async () => {
		storage.getStorageObjectList.mockResolvedValue(
			JSON.stringify({ status: 404, body: {} }),
		);
		const result = await callTool(server, "list_objects", {
			container: "nonexistent",
		});
		expect(result.structuredContent.total).toBe(0);
		expect(result.structuredContent.objects).toEqual([]);
	});

	it("各オブジェクトに name/bytes/content_type が整形されて含まれる", async () => {
		storage.getStorageObjectList.mockResolvedValue(
			JSON.stringify({
				status: 200,
				body: [
					{ name: "hero.jpg", bytes: 2_456_789, content_type: "image/jpeg" },
				],
			}),
		);
		const result = await callTool(server, "list_objects", {
			container: "media-assets",
		});
		for (const o of result.structuredContent.objects) {
			expect(o.name).toBeTypeOf("string");
			expect(o.bytes).toBeTypeOf("number");
			expect(o.content_type).toBeTypeOf("string");
		}
	});
});

describe("upload_object", () => {
	it("PUT が201を返す場合は Base64 長からサイズを計算しアップロード成功応答を返すことができる", async () => {
		storage.uploadStorageObjectDecoded.mockResolvedValue(
			JSON.stringify({ status: 201 }),
		);
		// "hello" の Base64
		const result = await callTool(server, "upload_object", {
			container: "backups",
			object_name: "hello.txt",
			content_base64: "aGVsbG8=",
			content_type: "text/plain",
		});
		const data = JSON.parse(result.content[0].text);
		expect(data.uploaded).toBe(true);
		expect(data.object.name).toBe("hello.txt");
		expect(data.object.content_type).toBe("text/plain");
		expect(storage.uploadStorageObjectDecoded).toHaveBeenCalledWith(
			"/v1/AUTH_test-tenant/backups/hello.txt",
			"aGVsbG8=",
			"text/plain",
		);
	});

	it("content_type 省略時は application/octet-stream を返すことができる", async () => {
		storage.uploadStorageObjectDecoded.mockResolvedValue(
			JSON.stringify({ status: 201 }),
		);
		const result = await callTool(server, "upload_object", {
			container: "backups",
			object_name: "binary.bin",
			content_base64: "AQID",
		});
		const data = JSON.parse(result.content[0].text);
		expect(data.object.content_type).toBe("application/octet-stream");
	});

	it("PUT が201/202以外を返す場合は isError のエラー応答を返すことができる", async () => {
		storage.uploadStorageObjectDecoded.mockResolvedValue(
			JSON.stringify({ status: 500 }),
		);
		const result = await callTool(server, "upload_object", {
			container: "backups",
			object_name: "hello.txt",
			content_base64: "aGVsbG8=",
		});
		expect(result.isError).toBe(true);
	});
});

describe("delete_object", () => {
	it("DELETE が204を返す場合は deleted:true で削除成功応答を返すことができる", async () => {
		storage.deleteStorageObject.mockResolvedValue(
			JSON.stringify({ status: 204 }),
		);
		const result = await callTool(server, "delete_object", {
			container: "backups",
			object_name: "hello.txt",
		});
		const data = JSON.parse(result.content[0].text);
		expect(data.deleted).toBe(true);
		expect(data.object.name).toBe("hello.txt");
	});
});

describe("get_container_public_state", () => {
	it("read_acl に .r:* を含む場合は public:true で公開URLを返すことができる", async () => {
		storage.getStorageContainerInfo.mockResolvedValue(
			JSON.stringify({
				status: 204,
				headers: { "x-container-read": ".r:*,.rlistings" },
			}),
		);
		const result = await callTool(server, "get_container_public_state", {
			container: "media-assets",
		});
		expect(result.structuredContent.public).toBe(true);
		expect(result.structuredContent.public_url).toContain("media-assets");
	});

	it("read_acl が空の場合は public:false を返し、public_url は含まれない", async () => {
		storage.getStorageContainerInfo.mockResolvedValue(
			JSON.stringify({ status: 204, headers: {} }),
		);
		const result = await callTool(server, "get_container_public_state", {
			container: "backups",
		});
		expect(result.structuredContent.public).toBe(false);
		expect(result.structuredContent.public_url).toBeUndefined();
	});

	it("公開コンテナは read_acl に .r:* を含み、誰でも読める設定であることを示す", async () => {
		storage.getStorageContainerInfo.mockResolvedValue(
			JSON.stringify({
				status: 204,
				headers: { "x-container-read": ".r:*,.rlistings" },
			}),
		);
		const result = await callTool(server, "get_container_public_state", {
			container: "media-assets",
		});
		expect(result.structuredContent.read_acl).toContain(".r:*");
	});

	it("非公開コンテナは read_acl フィールドを返さない", async () => {
		storage.getStorageContainerInfo.mockResolvedValue(
			JSON.stringify({ status: 204, headers: {} }),
		);
		const result = await callTool(server, "get_container_public_state", {
			container: "backups",
		});
		expect(result.structuredContent.read_acl).toBeUndefined();
	});
});

describe("enable_web_publish", () => {
	it("POST が204を返す場合は published:true で公開URLを含む応答を返すことができる", async () => {
		storage.setPostStorageMetadata.mockResolvedValue(
			JSON.stringify({ status: 204 }),
		);
		const result = await callTool(server, "enable_web_publish", {
			container: "my-site",
		});
		const data = JSON.parse(result.content[0].text);
		expect(data.published).toBe(true);
		expect(data.container.public).toBe(true);
		expect(data.container.public_url).toContain("my-site");
		expect(storage.setPostStorageMetadata).toHaveBeenCalledWith(
			"/v1/AUTH_test-tenant/my-site",
			{ "X-Container-Read": ".r:*,.rlistings" },
		);
	});

	it("公開URLが ConoHa オブジェクトストレージのスキーム + コンテナ名を含む形式で返る", async () => {
		storage.setPostStorageMetadata.mockResolvedValue(
			JSON.stringify({ status: 204 }),
		);
		const result = await callTool(server, "enable_web_publish", {
			container: "portfolio-site",
		});
		const data = JSON.parse(result.content[0].text);
		expect(data.container.public_url).toMatch(
			/^https:\/\/object-storage\.c3j1\.conoha\.io\/v1\/AUTH_[^/]+\/portfolio-site$/,
		);
	});

	it("特殊文字を含むコンテナ名は URL エンコードされる", async () => {
		storage.setPostStorageMetadata.mockResolvedValue(
			JSON.stringify({ status: 204 }),
		);
		const result = await callTool(server, "enable_web_publish", {
			container: "site.with.dots",
		});
		const data = JSON.parse(result.content[0].text);
		// ピリオドはエンコード対象外で、そのまま含まれる
		expect(data.container.public_url).toContain("site.with.dots");
	});
});

describe("disable_web_publish", () => {
	it("POST が204を返す場合は published:false で非公開化成功応答を返すことができる", async () => {
		storage.setPostStorageMetadata.mockResolvedValue(
			JSON.stringify({ status: 204 }),
		);
		const result = await callTool(server, "disable_web_publish", {
			container: "my-site",
		});
		const data = JSON.parse(result.content[0].text);
		expect(data.published).toBe(false);
		expect(data.container.public).toBe(false);
		expect(storage.setPostStorageMetadata).toHaveBeenCalledWith(
			"/v1/AUTH_test-tenant/my-site",
			{ "X-Container-Read": "" },
		);
	});

	it("非公開化レスポンスには public_url を含めない（公開状態の取り消しを明示）", async () => {
		storage.setPostStorageMetadata.mockResolvedValue(
			JSON.stringify({ status: 204 }),
		);
		const result = await callTool(server, "disable_web_publish", {
			container: "my-site",
		});
		const data = JSON.parse(result.content[0].text);
		expect(data.container.public_url).toBeUndefined();
	});
});

describe("Web公開トグルの往復シナリオ", () => {
	it("enable → disable の順で呼んでも、それぞれ正しい published フラグを返す", async () => {
		storage.setPostStorageMetadata.mockResolvedValue(
			JSON.stringify({ status: 204 }),
		);
		const enabled = await callTool(server, "enable_web_publish", {
			container: "round-trip",
		});
		const disabled = await callTool(server, "disable_web_publish", {
			container: "round-trip",
		});
		expect(JSON.parse(enabled.content[0].text).published).toBe(true);
		expect(JSON.parse(disabled.content[0].text).published).toBe(false);
	});

	it("enable で返る public_url は disable で取り消され同じレスポンス内に持ち越されない", async () => {
		storage.setPostStorageMetadata.mockResolvedValue(
			JSON.stringify({ status: 204 }),
		);
		const enabled = await callTool(server, "enable_web_publish", {
			container: "round-trip",
		});
		const disabled = await callTool(server, "disable_web_publish", {
			container: "round-trip",
		});
		expect(
			JSON.parse(enabled.content[0].text).container.public_url,
		).toBeDefined();
		expect(
			JSON.parse(disabled.content[0].text).container.public_url,
		).toBeUndefined();
	});
});
