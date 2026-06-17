/**
 * OpenStack Block Storage (Cinder) APIクライアント
 *
 * @remarks
 * ブロックストレージボリュームの作成、取得、更新、削除を行うAPIクライアントです。
 *
 * @packageDocumentation
 */

import type { JsonObject } from "../../../types.js";
import { executeOpenstackApi } from "../common/openstack-client.js";
import { requireTenantId } from "../common/require-tenant-id.js";
import { formatResponse } from "../common/response-formatter.js";
import { OPENSTACK_VOLUME_BASE_URL } from "../constants.js";

/**
 * テナントIDを含むボリュームAPIのベースURLを取得する
 *
 * @remarks
 * テナントIDは {@link requireTenantId} で都度解決し、未設定時は明示エラーとする。
 * モジュール読み込み時ではなく呼び出し時に解決することで、`"undefined"` 混入を防ぐ。
 *
 * @returns テナントIDを含むベースURL
 * @internal
 */
function volumeTenantBaseUrl(): string {
	return `${OPENSTACK_VOLUME_BASE_URL}/${requireTenantId()}`;
}

/**
 * ボリューム情報を取得
 *
 * @param path - APIパス（例: "/volumes/detail", "/types"）
 * @returns フォーマット済みJSONレスポンス
 */
export async function getVolume(path: string) {
	const response = await executeOpenstackApi(
		"GET",
		volumeTenantBaseUrl(),
		path,
	);
	return await formatResponse(response);
}

/**
 * ボリュームを作成
 *
 * @param path - APIパス（"/volumes"）
 * @param requestBody - ボリューム作成設定
 * @returns 作成されたボリューム情報を含むJSONレスポンス
 */
export async function createVolume(path: string, requestBody: JsonObject) {
	const response = await executeOpenstackApi(
		"POST",
		volumeTenantBaseUrl(),
		path,
		requestBody,
	);
	return await formatResponse(response);
}

/**
 * ボリュームを更新
 *
 * @param path - APIパス（"/volumes"）
 * @param param - ボリュームID
 * @param requestBody - 更新内容
 * @returns 更新されたボリューム情報を含むJSONレスポンス
 */
export async function updateVolumeByParam(
	path: string,
	param: string,
	requestBody: JsonObject,
) {
	const response = await executeOpenstackApi(
		"PUT",
		volumeTenantBaseUrl(),
		`${path}/${param}`,
		requestBody,
	);
	return await formatResponse(response);
}

/**
 * ボリュームを削除
 *
 * @param path - APIパス（"/volumes"）
 * @param param - ボリュームID
 * @returns 削除結果を含むJSONレスポンス
 */
export async function deleteVolumeByParam(path: string, param: string) {
	const response = await executeOpenstackApi(
		"DELETE",
		volumeTenantBaseUrl(),
		`${path}/${param}`,
	);
	return await formatResponse(response);
}
