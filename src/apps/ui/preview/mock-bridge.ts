/**
 * MCP App プレビュー用モックブリッジ（開発専用）
 *
 * @remarks
 * 本番 `mcp-bridge.ts` と同一の export 面を提供する drop-in 代替。
 * `vite.config.preview.ts` の resolveId プラグインが `./mcp-bridge.js` の import を
 * 本ファイルへ差し替えることで、ConoHa の認証情報なしに `npm run preview:ui` で
 * UI 全体をブラウザ確認できる。サーバー実行時には一切使われない。
 *
 * サンプルデータは本ファイルに直書きし（旧 fixtures を集約）、create / delete /
 * upload / 公開トグルはモジュールスコープのインメモリ状態へ反映するため、
 * プレビュー上でも操作結果が見た目に反映される「触れるプレビュー」になる。
 *
 * @packageDocumentation
 */

import { applyDocumentTheme } from "@modelcontextprotocol/ext-apps";
import type { AppContainer, AppObject } from "../../apps-types.js";

// 変更系の結果（本番 mcp-bridge.ts の MutationResult と同形）
type MutationResult =
	| { ok: true; publicUrl?: string }
	| { ok: false; error: string; hint?: string };

// 公開状態（本番 mcp-bridge.ts の ContainerPublicState と同形）
interface ContainerPublicState {
	isPublic: boolean;
	publicUrl?: string;
}

// ──────────────────────────────────────────────
// インメモリ状態（サンプルデータ直書き）
// ──────────────────────────────────────────────

const containers: AppContainer[] = [
	{
		name: "backups",
		count: 2,
		bytes: 3_207_376_384,
		last_modified: "2026-04-20T08:15:32.123456",
	},
	{
		name: "media-assets",
		count: 2,
		bytes: 126_913_578,
		last_modified: "2026-04-22T14:42:01.987654",
	},
	{
		name: "logs-archive",
		count: 1,
		bytes: 8_192_000,
		last_modified: "2026-04-25T03:00:55.555555",
	},
];

const objectsByContainer: Record<string, AppObject[]> = {
	backups: [
		{
			name: "db-2026-04-01.tar.gz",
			bytes: 1_572_864_000,
			content_type: "application/gzip",
			last_modified: "2026-04-01T03:00:12.345678",
		},
		{
			name: "db-2026-04-15.tar.gz",
			bytes: 1_634_512_384,
			content_type: "application/gzip",
			last_modified: "2026-04-15T03:00:08.123456",
		},
	],
	"media-assets": [
		{
			name: "hero.jpg",
			bytes: 2_456_789,
			content_type: "image/jpeg",
			last_modified: "2026-04-22T14:42:01.987654",
		},
		{
			name: "promo-video.mp4",
			bytes: 124_456_789,
			content_type: "video/mp4",
			last_modified: "2026-04-22T14:30:00.000000",
		},
	],
	"logs-archive": [
		{
			name: "2026-04-25.log.gz",
			bytes: 8_192_000,
			content_type: "application/gzip",
			last_modified: "2026-04-25T03:00:55.555555",
		},
	],
};

// 既定で公開状態のコンテナ（公開・非公開トグルの確認用）
const publicContainers = new Set<string>(["media-assets"]);

// 公開URLを組み立てる（本番と同じスキーム、テナントはダミー）
const buildPublicUrl = (container: string): string =>
	`https://object-storage.c3j1.conoha.io/v1/AUTH_mock-tenant/${encodeURIComponent(container)}`;

// コンテナの count / bytes をオブジェクト一覧から再計算する
const recomputeStats = (container: string): void => {
	const target = containers.find((c) => c.name === container);
	if (!target) return;
	const objects = objectsByContainer[container] ?? [];
	target.count = objects.length;
	target.bytes = objects.reduce((sum, o) => sum + o.bytes, 0);
};

// ──────────────────────────────────────────────
// ホストテーマ連携（プレビューでは OS テーマのみ）
// ──────────────────────────────────────────────

/**
 * OS の prefers-color-scheme を document に適用する（プレビュー用）
 *
 * @remarks
 * 本番はホスト（Claude Desktop）のテーマを取り込むが、プレビューでは
 * ホストが存在しないため OS テーマにのみ追従する。
 *
 * @returns 監視を解除するクリーンアップ関数
 */
export function initHostTheming(): () => void {
	const mql = window.matchMedia("(prefers-color-scheme: dark)");
	const apply = () => applyDocumentTheme(mql.matches ? "dark" : "light");
	apply();
	mql.addEventListener("change", apply);
	return () => mql.removeEventListener("change", apply);
}

// ──────────────────────────────────────────────
// 参照系
// ──────────────────────────────────────────────

/**
 * ストレージコンテナの一覧を取得する（モック）
 *
 * @returns サンプルコンテナ配列のスナップショット
 */
export async function fetchContainers(): Promise<AppContainer[]> {
	return containers.map((c) => ({ ...c }));
}

/**
 * 指定コンテナ内のオブジェクト一覧を取得する（モック）
 *
 * @param container - コンテナ名
 * @returns オブジェクト配列（存在しないコンテナでは空配列）
 */
export async function fetchObjects(container: string): Promise<AppObject[]> {
	return (objectsByContainer[container] ?? []).map((o) => ({ ...o }));
}

/**
 * コンテナの Web 公開状態を取得する（モック）
 *
 * @param container - コンテナ名
 * @returns 公開状態と公開URL
 */
export async function fetchContainerPublicState(
	container: string,
): Promise<ContainerPublicState> {
	const isPublic = publicContainers.has(container);
	return {
		isPublic,
		...(isPublic && { publicUrl: buildPublicUrl(container) }),
	};
}

// ──────────────────────────────────────────────
// 変更系（インメモリ状態を更新）
// ──────────────────────────────────────────────

/**
 * コンテナを新規作成する（モック）
 *
 * @param name - 作成するコンテナ名
 * @returns 作成結果（既存名でも成功扱い）
 */
export async function createContainer(name: string): Promise<MutationResult> {
	if (!containers.some((c) => c.name === name)) {
		containers.push({ name, count: 0, bytes: 0 });
		objectsByContainer[name] = [];
	}
	return { ok: true };
}

/**
 * コンテナを削除する（モック）
 *
 * @remarks
 * 空でないコンテナは削除できず、`hint` を伴う失敗を返す（本番 409 相当）。
 *
 * @param name - 削除するコンテナ名
 * @returns 削除結果
 */
export async function deleteContainer(name: string): Promise<MutationResult> {
	if ((objectsByContainer[name] ?? []).length > 0) {
		return {
			ok: false,
			error: "コンテナ削除に失敗しました (409)",
			hint: "コンテナが空ではありません。先にオブジェクトを全て削除してください。",
		};
	}
	const index = containers.findIndex((c) => c.name === name);
	if (index >= 0) containers.splice(index, 1);
	delete objectsByContainer[name];
	publicContainers.delete(name);
	return { ok: true };
}

/**
 * コンテナにオブジェクトをアップロードする（モック）
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
	if (!objectsByContainer[container]) {
		objectsByContainer[container] = [];
	}
	const list = objectsByContainer[container];
	const bytes = Math.floor((contentBase64.length * 3) / 4);
	const existing = list.find((o) => o.name === objectName);
	if (existing) {
		existing.bytes = bytes;
		existing.content_type = contentType ?? "application/octet-stream";
	} else {
		list.push({
			name: objectName,
			bytes,
			content_type: contentType ?? "application/octet-stream",
		});
	}
	recomputeStats(container);
	return { ok: true };
}

/**
 * コンテナ内のオブジェクトを削除する（モック）
 *
 * @param container - コンテナ名
 * @param objectName - 削除するオブジェクト名
 * @returns 削除結果
 */
export async function deleteObject(
	container: string,
	objectName: string,
): Promise<MutationResult> {
	const list = objectsByContainer[container];
	if (list) {
		const index = list.findIndex((o) => o.name === objectName);
		if (index >= 0) list.splice(index, 1);
		recomputeStats(container);
	}
	return { ok: true };
}

/**
 * コンテナの Web 公開を有効化する（モック）
 *
 * @param container - 公開するコンテナ名
 * @returns 公開有効化結果（成功時は publicUrl 付き）
 */
export async function enableWebPublish(
	container: string,
): Promise<MutationResult> {
	publicContainers.add(container);
	return { ok: true, publicUrl: buildPublicUrl(container) };
}

/**
 * コンテナの Web 公開を無効化する（モック）
 *
 * @param container - 非公開化するコンテナ名
 * @returns 無効化結果
 */
export async function disableWebPublish(
	container: string,
): Promise<MutationResult> {
	publicContainers.delete(container);
	return { ok: true };
}

// ──────────────────────────────────────────────
// File API ヘルパー（本番と同一実装）
// ──────────────────────────────────────────────

/**
 * File オブジェクトを Base64 文字列に変換する
 *
 * @param file - ブラウザの File オブジェクト
 * @returns Base64 文字列（data: ヘッダ無し）
 */
export function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result;
			if (typeof result !== "string") {
				reject(new Error("ファイル読み込みに失敗しました"));
				return;
			}
			const comma = result.indexOf(",");
			resolve(comma >= 0 ? result.slice(comma + 1) : result);
		};
		reader.onerror = () => reject(reader.error ?? new Error("読み込みエラー"));
		reader.readAsDataURL(file);
	});
}
