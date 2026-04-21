/**
 * MCP Apps モックデータプロバイダー
 *
 * @remarks
 * `CONOHA_MCP_MOCK=1` 環境変数が設定されている場合、
 * 実APIの代わりにフィクスチャJSONを返します。
 * esbuildバンドル時にJSONがインライン化されるよう、importで読み込みます。
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
import imagesFixture from "./fixtures/images.json";
import metricsFixture from "./fixtures/metrics.json";
import securityGroupsFixture from "./fixtures/security-groups.json";
import serversFixture from "./fixtures/servers.json";
import volumesFixture from "./fixtures/volumes.json";

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
	return serversFixture.servers as AppServer[];
}

/**
 * 特定サーバーを取得（モック）
 *
 * @param serverId - サーバーID
 * @returns サーバー情報。見つからない場合はnull
 */
export function getMockServer(serverId: string): AppServer | null {
	const servers = serversFixture.servers as AppServer[];
	return servers.find((s) => s.id === serverId) ?? null;
}

/**
 * ボリューム一覧を取得（モック）
 *
 * @returns モックボリューム一覧
 */
export function getMockVolumes(): AppVolume[] {
	return volumesFixture.volumes as AppVolume[];
}

/**
 * イメージ一覧を取得（モック）
 *
 * @returns モックイメージ一覧
 */
export function getMockImages(): AppImage[] {
	return imagesFixture.images as AppImage[];
}

/**
 * セキュリティグループ一覧を取得（モック）
 *
 * @returns モックセキュリティグループ一覧
 */
export function getMockSecurityGroups(): AppSecurityGroup[] {
	return securityGroupsFixture.security_groups as AppSecurityGroup[];
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
	const metrics = metricsFixture.metrics as Record<string, AppServerMetrics>;
	return metrics[serverId] ?? null;
}
