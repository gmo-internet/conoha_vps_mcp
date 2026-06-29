/**
 * MCP App ⇔ サーバーツール呼び出しの型付きラッパー
 *
 * @remarks
 * `@modelcontextprotocol/ext-apps` の {@link App} インスタンスを単一保持し、
 * 9 種類のオブジェクトストレージ系ツール呼び出しを React から扱いやすい形に整える。
 *
 * - 参照系: {@link fetchContainers}, {@link fetchObjects}, {@link fetchContainerPublicState}
 * - 変更系: {@link createContainer}, {@link deleteContainer}, {@link uploadObject},
 *   {@link deleteObject}, {@link enableWebPublish}, {@link disableWebPublish}
 *
 * 変更系はすべて {@link MutationResult} を返し、UI 側で `ok` を見て分岐できる。
 *
 * @packageDocumentation
 */

import { App, applyDocumentTheme } from "@modelcontextprotocol/ext-apps";
import type { AppContainer, AppObject } from "../apps-types.js";
import { fileToBase64 } from "./file-to-base64.js";

// ──────────────────────────────────────────────
// App シングルトン
// ──────────────────────────────────────────────

const app = new App({ name: "ConoHa VPS Storage", version: "0.2.0" });
const connected = app.connect();

// ──────────────────────────────────────────────
// ホストテーマ連携
// ──────────────────────────────────────────────

/**
 * ホスト（Claude Desktop 等）のテーマ（light/dark）を document に適用する。
 *
 * @remarks
 * `getHostContext()` の `theme` で `data-theme` を設定する。テーマが渡らない
 * ホストでは OS の prefers-color-scheme にフォールバックする。
 * 外枠の具体的な配色は CSS 側で `--outer-bg`（Claude の地色に一致させた明示値）
 * を data-theme 別に持つため、ここでは色値そのものは扱わない。
 *
 * @internal
 */
function applyHostContext(): void {
	const ctx = app.getHostContext();
	if (ctx?.theme) {
		applyDocumentTheme(ctx.theme);
	} else {
		const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
		applyDocumentTheme(dark ? "dark" : "light");
	}
}

/**
 * ホストのテーマを起動時とテーマ変更時に取り込む
 *
 * @remarks
 * 1. 即時に一度適用（フォールバック/既取得分）
 * 2. connect 完了後にホストコンテキストを適用
 * 3. `onhostcontextchanged` でテーマ切替に追従
 * 4. ホストがテーマ非対応のときのみ OS テーマ変更にも追従
 *
 * @returns 監視を解除するクリーンアップ関数
 */
export function initHostTheming(): () => void {
	applyHostContext();
	void connected.then(applyHostContext);
	app.onhostcontextchanged = () => applyHostContext();

	const mql = window.matchMedia("(prefers-color-scheme: dark)");
	const onOsThemeChange = () => {
		if (!app.getHostContext()?.theme) applyHostContext();
	};
	mql.addEventListener("change", onOsThemeChange);
	return () => mql.removeEventListener("change", onOsThemeChange);
}

// ──────────────────────────────────────────────
// 型定義
// ──────────────────────────────────────────────

/**
 * 変更系操作の結果（成功/失敗を ok で分岐）
 *
 * @remarks
 * モジュール外には関数の戻り値型として推論されるためエクスポートしない。
 */
type MutationResult =
	| { ok: true; publicUrl?: string }
	| { ok: false; error: string; hint?: string };

/**
 * コンテナの Web 公開状態
 *
 * @remarks
 * モジュール外には fetchContainerPublicState の戻り値型として推論される。
 */
interface ContainerPublicState {
	/** 匿名読み取り可能か */
	isPublic: boolean;
	/** 公開時のフル URL（非公開時は未設定） */
	publicUrl?: string;
}

// ──────────────────────────────────────────────
// 内部ユーティリティ
// ──────────────────────────────────────────────

interface CallToolResult {
	content?: Array<{ type: string; text?: string; [k: string]: unknown }>;
}

function extractText(result: CallToolResult): string | null {
	const item = result.content?.find((c) => c.type === "text");
	return item?.text ?? null;
}

function failure(message: unknown): { ok: false; error: string } {
	return {
		ok: false,
		error: message instanceof Error ? message.message : String(message),
	};
}

// ──────────────────────────────────────────────
// 参照系
// ──────────────────────────────────────────────

/**
 * ストレージコンテナの一覧を取得する
 *
 * @remarks
 * サーバー側ツール `list_containers` を呼び出し、コンテナ配列を返す。
 * エラー時は空配列にフォールバックする（UI を壊さないため）。
 *
 * @returns コンテナ配列（取得不可なら空配列）
 */
export async function fetchContainers(): Promise<AppContainer[]> {
	try {
		const result = await app.callServerTool({
			name: "list_containers",
			arguments: {},
		});
		const text = extractText(result);
		if (text) {
			const parsed = JSON.parse(text) as { containers?: AppContainer[] };
			return parsed.containers ?? [];
		}
	} catch {
		/* ignore — UI 側でロード失敗時の空表示を行う */
	}
	return [];
}

/**
 * 指定コンテナ内のオブジェクト一覧を取得する
 *
 * @remarks
 * サーバー側ツール `list_objects` を呼び出す。エラー時は空配列。
 *
 * @param container - コンテナ名
 * @returns オブジェクト配列（取得不可なら空配列）
 */
export async function fetchObjects(container: string): Promise<AppObject[]> {
	try {
		const result = await app.callServerTool({
			name: "list_objects",
			arguments: { container },
		});
		const text = extractText(result);
		if (text) {
			const parsed = JSON.parse(text) as { objects?: AppObject[] };
			return parsed.objects ?? [];
		}
	} catch {
		/* ignore */
	}
	return [];
}

/**
 * コンテナの Web 公開状態を取得する
 *
 * @remarks
 * サーバー側ツール `get_container_public_state` を呼び出す。
 * 取得不可の場合は `{ isPublic: false }` を返す。
 *
 * @param container - コンテナ名
 * @returns 公開状態と公開URL
 */
export async function fetchContainerPublicState(
	container: string,
): Promise<ContainerPublicState> {
	try {
		const result = await app.callServerTool({
			name: "get_container_public_state",
			arguments: { container },
		});
		const text = extractText(result);
		if (text) {
			const parsed = JSON.parse(text) as {
				public?: boolean;
				public_url?: string;
			};
			return {
				isPublic: Boolean(parsed.public),
				...(parsed.public_url && { publicUrl: parsed.public_url }),
			};
		}
	} catch {
		/* ignore */
	}
	return { isPublic: false };
}

// ──────────────────────────────────────────────
// 変更系
// ──────────────────────────────────────────────

interface ErrorBody {
	error?: string;
	hint?: string;
	container?: { public_url?: string };
}

async function runMutation(
	name: string,
	args: Record<string, unknown>,
): Promise<MutationResult> {
	try {
		const result = await app.callServerTool({ name, arguments: args });
		const text = extractText(result);
		if (!text) return { ok: false, error: "応答が空でした" };
		const data = JSON.parse(text) as ErrorBody;
		if (data.error) {
			return {
				ok: false,
				error: data.error,
				...(data.hint && { hint: data.hint }),
			};
		}
		return {
			ok: true,
			...(data.container?.public_url && {
				publicUrl: data.container.public_url,
			}),
		};
	} catch (e) {
		return failure(e);
	}
}

/**
 * コンテナを新規作成する
 *
 * @remarks
 * サーバー側ツール `create_container` を呼び出す。既存名への作成は 202 で no-op。
 *
 * @param name - 作成するコンテナ名
 * @returns 作成結果
 */
export async function createContainer(name: string): Promise<MutationResult> {
	return runMutation("create_container", { name });
}

/**
 * コンテナを削除する
 *
 * @remarks
 * サーバー側ツール `delete_container` を呼び出す。空でないコンテナは 409 で
 * 失敗し `hint` メッセージを伴う。
 *
 * @param name - 削除するコンテナ名
 * @returns 削除結果
 */
export async function deleteContainer(name: string): Promise<MutationResult> {
	return runMutation("delete_container", { name });
}

/**
 * コンテナにオブジェクトをアップロードする
 *
 * @remarks
 * サーバー側ツール `upload_object` を呼び出す。`content_type` は MIME タイプ。
 * 省略時はサーバー側で `application/octet-stream` 相当となる。
 *
 * @param container - 対象コンテナ名
 * @param objectName - 作成するオブジェクト名
 * @param contentBase64 - 本体を Base64 化した文字列
 * @param contentType - MIME タイプ（任意）
 * @returns アップロード結果
 */
export async function uploadObject(
	container: string,
	objectName: string,
	contentBase64: string,
	contentType?: string,
): Promise<MutationResult> {
	return runMutation("upload_object", {
		container,
		object_name: objectName,
		content_base64: contentBase64,
		...(contentType && { content_type: contentType }),
	});
}

/**
 * コンテナ内のオブジェクトを削除する
 *
 * @param container - コンテナ名
 * @param objectName - 削除するオブジェクト名
 * @returns 削除結果
 */
export async function deleteObject(
	container: string,
	objectName: string,
): Promise<MutationResult> {
	return runMutation("delete_object", {
		container,
		object_name: objectName,
	});
}

/**
 * コンテナの Web 公開を有効化する
 *
 * @remarks
 * `X-Container-Read: .r:*,.rlistings` を設定し、匿名読み取り可能にする。
 * 成功時は `publicUrl` を返す。
 *
 * @param container - 公開するコンテナ名
 * @returns 公開有効化結果（成功時は publicUrl 付き）
 */
export async function enableWebPublish(
	container: string,
): Promise<MutationResult> {
	return runMutation("enable_web_publish", { container });
}

/**
 * コンテナの Web 公開を無効化する
 *
 * @param container - 非公開化するコンテナ名
 * @returns 無効化結果
 */
export async function disableWebPublish(
	container: string,
): Promise<MutationResult> {
	return runMutation("disable_web_publish", { container });
}

// ──────────────────────────────────────────────
// File API ヘルパー
// ──────────────────────────────────────────────

// File → Base64 変換は file-to-base64.ts に集約（プレビューと共有）。
// app.tsx は本モジュール経由で import するため再エクスポートで公開面を保つ。
export { fileToBase64 };
