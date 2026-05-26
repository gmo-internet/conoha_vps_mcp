/**
 * mcp-bridge の単体テスト
 *
 * @remarks
 * `@modelcontextprotocol/ext-apps` の {@link App} クラスを vi.mock で差し替え、
 * 各エクスポート関数の応答パースと失敗フォールバック挙動を検証する。
 *
 * @packageDocumentation
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// hoist された vi.fn() — 全テストから共有して mock 戻り値を制御する
const callServerToolMock = vi.hoisted(() => vi.fn());

// vitest は constructable な実装（class / function 宣言）を要求するため class を渡す
vi.mock("@modelcontextprotocol/ext-apps", () => ({
	App: class MockApp {
		connect = vi.fn();
		callServerTool = callServerToolMock;
	},
}));

const {
	fetchContainers,
	fetchObjects,
	fetchContainerPublicState,
	createContainer,
	deleteContainer,
	deleteObject,
	uploadObject,
	enableWebPublish,
	disableWebPublish,
} = await import("./mcp-bridge");

/** ツール戻り値の content[0].text に JSON を載せるヘルパー */
function textResult(payload: unknown): {
	content: Array<{ type: string; text: string }>;
} {
	return {
		content: [{ type: "text", text: JSON.stringify(payload) }],
	};
}

describe("mcp-bridge", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("fetchContainers", () => {
		it("list_containers の応答からコンテナ配列をパースして返す", async () => {
			callServerToolMock.mockResolvedValueOnce(
				textResult({
					containers: [{ name: "assets", count: 3, bytes: 1024 }],
				}),
			);
			const result = await fetchContainers();
			expect(result).toEqual([{ name: "assets", count: 3, bytes: 1024 }]);
			expect(callServerToolMock).toHaveBeenCalledWith({
				name: "list_containers",
				arguments: {},
			});
		});

		it("ツール呼び出しが例外を投げた場合は空配列を返す", async () => {
			callServerToolMock.mockRejectedValueOnce(new Error("ネットワーク断"));
			expect(await fetchContainers()).toEqual([]);
		});

		it("応答に text が含まれない場合は空配列を返す", async () => {
			callServerToolMock.mockResolvedValueOnce({ content: [] });
			expect(await fetchContainers()).toEqual([]);
		});
	});

	describe("fetchObjects", () => {
		it("list_objects の応答からオブジェクト配列をパースする", async () => {
			callServerToolMock.mockResolvedValueOnce(
				textResult({
					objects: [{ name: "a.txt", bytes: 12, content_type: "text/plain" }],
				}),
			);
			const result = await fetchObjects("assets");
			expect(result).toEqual([
				{ name: "a.txt", bytes: 12, content_type: "text/plain" },
			]);
			expect(callServerToolMock).toHaveBeenCalledWith({
				name: "list_objects",
				arguments: { container: "assets" },
			});
		});

		it("失敗時は空配列を返す", async () => {
			callServerToolMock.mockRejectedValueOnce(new Error("x"));
			expect(await fetchObjects("assets")).toEqual([]);
		});
	});

	describe("fetchContainerPublicState", () => {
		it("public:true と public_url を含む応答を camelCase に正規化して返す", async () => {
			callServerToolMock.mockResolvedValueOnce(
				textResult({
					container: "site",
					public: true,
					public_url: "https://example/site",
				}),
			);
			const result = await fetchContainerPublicState("site");
			expect(result).toEqual({
				isPublic: true,
				publicUrl: "https://example/site",
			});
		});

		it("public:false の場合は publicUrl を省略する", async () => {
			callServerToolMock.mockResolvedValueOnce(
				textResult({ container: "site", public: false }),
			);
			const result = await fetchContainerPublicState("site");
			expect(result).toEqual({ isPublic: false });
		});

		it("失敗時は isPublic:false にフォールバックする", async () => {
			callServerToolMock.mockRejectedValueOnce(new Error("x"));
			expect(await fetchContainerPublicState("site")).toEqual({
				isPublic: false,
			});
		});
	});

	describe("createContainer", () => {
		it("成功応答に対し { ok: true } を返す", async () => {
			callServerToolMock.mockResolvedValueOnce(
				textResult({ container: { name: "x" }, created: true }),
			);
			expect(await createContainer("x")).toEqual({ ok: true });
		});

		it("error フィールドがある場合は ok:false でメッセージを返す", async () => {
			callServerToolMock.mockResolvedValueOnce(
				textResult({ error: "コンテナ作成に失敗しました (500)" }),
			);
			expect(await createContainer("x")).toEqual({
				ok: false,
				error: "コンテナ作成に失敗しました (500)",
			});
		});

		it("空応答の場合は ok:false で「応答が空でした」を返す", async () => {
			callServerToolMock.mockResolvedValueOnce({ content: [] });
			expect(await createContainer("x")).toEqual({
				ok: false,
				error: "応答が空でした",
			});
		});

		it("例外時は Error のメッセージを ok:false で返す", async () => {
			callServerToolMock.mockRejectedValueOnce(new Error("壊れた"));
			expect(await createContainer("x")).toEqual({
				ok: false,
				error: "壊れた",
			});
		});
	});

	describe("deleteContainer", () => {
		it("409 のような hint 付き失敗を ok:false で hint まで返す", async () => {
			callServerToolMock.mockResolvedValueOnce(
				textResult({
					error: "コンテナ削除に失敗しました (409)",
					hint: "コンテナが空ではありません。先にオブジェクトを全て削除してください。",
				}),
			);
			expect(await deleteContainer("x")).toEqual({
				ok: false,
				error: "コンテナ削除に失敗しました (409)",
				hint: "コンテナが空ではありません。先にオブジェクトを全て削除してください。",
			});
		});

		it("成功応答に対し { ok: true } を返す", async () => {
			callServerToolMock.mockResolvedValueOnce(
				textResult({ container: { name: "x" }, deleted: true }),
			);
			expect(await deleteContainer("x")).toEqual({ ok: true });
		});
	});

	describe("uploadObject", () => {
		it("contentType 指定時は content_type を引数に含めて呼び出す", async () => {
			callServerToolMock.mockResolvedValueOnce(
				textResult({ object: { name: "a.txt" }, uploaded: true }),
			);
			const result = await uploadObject("c", "a.txt", "QUJD", "text/plain");
			expect(result).toEqual({ ok: true });
			expect(callServerToolMock).toHaveBeenCalledWith({
				name: "upload_object",
				arguments: {
					container: "c",
					object_name: "a.txt",
					content_base64: "QUJD",
					content_type: "text/plain",
				},
			});
		});

		it("contentType 未指定時は content_type を引数から省く", async () => {
			callServerToolMock.mockResolvedValueOnce(
				textResult({ object: { name: "a" }, uploaded: true }),
			);
			await uploadObject("c", "a", "QUJD");
			expect(callServerToolMock).toHaveBeenCalledWith({
				name: "upload_object",
				arguments: {
					container: "c",
					object_name: "a",
					content_base64: "QUJD",
				},
			});
		});
	});

	describe("deleteObject", () => {
		it("成功応答に対し { ok: true } を返す", async () => {
			callServerToolMock.mockResolvedValueOnce(
				textResult({ object: { name: "a" }, deleted: true }),
			);
			expect(await deleteObject("c", "a")).toEqual({ ok: true });
			expect(callServerToolMock).toHaveBeenCalledWith({
				name: "delete_object",
				arguments: { container: "c", object_name: "a" },
			});
		});
	});

	describe("enableWebPublish", () => {
		it("成功時は container.public_url を publicUrl として取り出す", async () => {
			callServerToolMock.mockResolvedValueOnce(
				textResult({
					container: {
						name: "site",
						public: true,
						public_url: "https://example/site",
					},
					published: true,
				}),
			);
			expect(await enableWebPublish("site")).toEqual({
				ok: true,
				publicUrl: "https://example/site",
			});
		});

		it("失敗時は error を ok:false で返す", async () => {
			callServerToolMock.mockResolvedValueOnce(
				textResult({ error: "Web公開の有効化に失敗しました (500)" }),
			);
			expect(await enableWebPublish("site")).toEqual({
				ok: false,
				error: "Web公開の有効化に失敗しました (500)",
			});
		});
	});

	describe("disableWebPublish", () => {
		it("成功応答に対し { ok: true } を返す", async () => {
			callServerToolMock.mockResolvedValueOnce(
				textResult({
					container: { name: "site", public: false },
					published: false,
				}),
			);
			expect(await disableWebPublish("site")).toEqual({ ok: true });
		});
	});
});
