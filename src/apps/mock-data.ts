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

import type { AppContainer, AppObject } from "./apps-types.js";
import { containers } from "./fixtures/containers.js";
import { objectsByContainer } from "./fixtures/objects.js";

/**
 * モックモードが有効か判定
 *
 * @returns CONOHA_MCP_MOCK=1の場合true
 */
export function isMockMode(): boolean {
	return process.env.CONOHA_MCP_MOCK === "1";
}

/**
 * ストレージコンテナ一覧を取得（モック）
 *
 * @returns モックコンテナ一覧
 */
export function getMockContainers(): AppContainer[] {
	return containers;
}

/**
 * 指定コンテナ内のオブジェクト一覧を取得（モック）
 *
 * @param containerName - コンテナ名
 * @returns 該当コンテナのオブジェクト一覧。存在しないコンテナでは空配列
 */
export function getMockObjects(containerName: string): AppObject[] {
	return objectsByContainer[containerName] ?? [];
}
