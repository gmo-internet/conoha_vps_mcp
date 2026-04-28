/**
 * MCP Apps モックデータプロバイダー
 *
 * @remarks
 * `CONOHA_MCP_MOCK=1` 環境変数が設定されている場合、
 * 実APIの代わりにフィクスチャを返します。
 * フィクスチャは TS で型注釈付き定義しており、ランタイム検証なしに型安全に扱えます。
 *
 * @packageDocumentation
 */

import type {
	AppImage,
	AppSecurityGroup,
	AppServer,
	AppServerMetrics,
	AppVolume,
} from "./apps-types.js";
import { images } from "./fixtures/images.js";
import { metrics } from "./fixtures/metrics.js";
import { securityGroups } from "./fixtures/security-groups.js";
import { servers } from "./fixtures/servers.js";
import { volumes } from "./fixtures/volumes.js";

/**
 * モックモードが有効か判定
 *
 * @returns CONOHA_MCP_MOCK=1の場合true
 */
export function isMockMode(): boolean {
	return process.env.CONOHA_MCP_MOCK === "1";
}

/**
 * サーバー一覧を取得（モック）
 *
 * @returns モックサーバー一覧
 */
export function getMockServers(): AppServer[] {
	return servers;
}

/**
 * 特定サーバーを取得（モック）
 *
 * @param serverId - サーバーID
 * @returns サーバー情報。見つからない場合はnull
 */
export function getMockServer(serverId: string): AppServer | null {
	return servers.find((s) => s.id === serverId) ?? null;
}

/**
 * ボリューム一覧を取得（モック）
 *
 * @returns モックボリューム一覧
 */
export function getMockVolumes(): AppVolume[] {
	return volumes;
}

/**
 * イメージ一覧を取得（モック）
 *
 * @returns モックイメージ一覧
 */
export function getMockImages(): AppImage[] {
	return images;
}

/**
 * セキュリティグループ一覧を取得（モック）
 *
 * @returns モックセキュリティグループ一覧
 */
export function getMockSecurityGroups(): AppSecurityGroup[] {
	return securityGroups;
}

/**
 * サーバーメトリクスを取得（モック）
 *
 * @param serverId - サーバーID
 * @returns メトリクス情報。見つからない場合はnull
 */
export function getMockServerMetrics(
	serverId: string,
): AppServerMetrics | null {
	return metrics[serverId] ?? null;
}
