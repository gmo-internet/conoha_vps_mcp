/**
 * MCPツールのルーティングテーブル
 *
 * @remarks
 * 各MCPツールのパスとハンドラー関数のマッピングを定義します。
 * ツールはGET、POST、PUT、DELETEの各HTTPメソッドに対応しています。
 *
 * @packageDocumentation
 */

import {
	createCompute,
	createComputeByParam,
	deleteComputeByParam,
	getCompute,
	getComputeByParam,
	getFlavor,
} from "./features/openstack/compute/compute-client.js";
import { getImage } from "./features/openstack/image/image-client.js";
import {
	createNetwork,
	deleteNetworkByParam,
	getNetwork,
	getNetworkByParam,
	getSecurityGroup,
	updateNetworkByParam,
} from "./features/openstack/network/network-client.js";
import {
	deleteStorageContainer,
	deleteStorageObject,
	getStorageAccountInfo,
	getStorageContainerInfo,
	getStorageContainerList,
	getStorageObjectInfo,
	getStorageObjectList,
	setPostStorageMetadata,
	setPutStorageMetadata,
	uploadStorageObject,
} from "./features/openstack/storage/storage-client.js";
import {
	createVolume,
	deleteVolumeByParam,
	getVolume,
	updateVolumeByParam,
} from "./features/openstack/volume/volume-client.js";
import type {
	ConoHaDeleteByParamPaths,
	ConoHaGetByParamsPaths,
	ConoHaGetPaths,
	ConoHaHeadPaths,
	ConoHaPostPaths,
	ConoHaPostPutByParamByHeaderparamPaths,
	ConoHaPostPutByParamPaths,
	ConoHaPostPutPaths,
	JsonObject,
} from "./types.js";

/**
 * ConoHa GET APIのハンドラーマッピング
 *
 * @remarks
 * パスをキーとし、対応するハンドラー関数を値とするレコードです。
 * サーバー一覧、フレーバー一覧、ボリューム一覧などの取得処理を提供します。
 */
export const conohaGetHandlers: Record<
	ConoHaGetPaths,
	(path: string) => Promise<string>
> = {
	"/servers/detail": () => getCompute("/servers/detail"),
	"/flavors/detail": () => getFlavor("/flavors/detail"),
	"/os-keypairs": () => getCompute("/os-keypairs"),
	"/types": () => getVolume("/types"),
	"/volumes/detail": () => getVolume("/volumes/detail"),
	"/v2/images?limit=200": () => getImage("/v2/images?limit=200"),
	"/v2.0/security-groups": () => getSecurityGroup("/v2.0/security-groups"),
	"/v2.0/security-group-rules": () => getNetwork("/v2.0/security-group-rules"),
	"/v2.0/ports": () => getNetwork("/v2.0/ports"),
	"/startup-scripts": () => getCompute("/startup-scripts"),
	"/v1/AUTH_{tenantId}": (path) => getStorageContainerList(path),
	"/v1/AUTH_{tenantId}/{container}": (path) => getStorageObjectList(path),
	"/v1/AUTH_{tenantId}/{container}/{object}": (path) =>
		getStorageObjectInfo(path),
};

/**
 * パラメータ付きConoHa GET APIのハンドラーマッピング
 *
 * @remarks
 * サーバーIDなどのパラメータを受け取り、特定リソースの詳細を取得します。
 */
export const conohaGetByParamHandlers: Record<
	ConoHaGetByParamsPaths,
	(param: string) => Promise<string>
> = {
	"/ips": (param) => getComputeByParam("/ips", param),
	"/os-security-groups": (param) =>
		getComputeByParam("/os-security-groups", param),
	"/rrd/cpu": (param) => getComputeByParam("/rrd/cpu", param),
	"/rrd/disk": (param) => getComputeByParam("/rrd/disk", param),
	"/v2.0/security-groups": (param) =>
		getNetworkByParam("/v2.0/security-groups", param),
	"/v2.0/security-group-rules": (param) =>
		getNetworkByParam("/v2.0/security-group-rules", param),
};

/**
 * ConoHa POST APIのハンドラーマッピング
 *
 * @remarks
 * リソース作成用のハンドラーです。サーバー、ボリューム、セキュリティグループなどを作成します。
 */
export const conohaPostHandlers: Record<
	ConoHaPostPaths,
	(requestBody: JsonObject) => Promise<string>
> = {
	"/servers": (requestBody) => createCompute("/servers", requestBody),
	"/os-keypairs": (requestBody) => createCompute("/os-keypairs", requestBody),
	"/volumes": (requestBody) => createVolume("/volumes", requestBody),
	"/v2.0/security-groups": (requestBody) =>
		createNetwork("/v2.0/security-groups", requestBody),
	"/v2.0/security-group-rules": (requestBody) =>
		createNetwork("/v2.0/security-group-rules", requestBody),
};

/**
 * ConoHa POST/PUT APIのハンドラーマッピング
 *
 * @remarks
 * オブジェクトストレージのコンテナ作成およびオブジェクトアップロード用のハンドラーです。
 */
export const conohaPostPutHandlers: Record<
	ConoHaPostPutPaths,
	(path: string, content?: string, contentType?: string) => Promise<string>
> = {
	"/v1/AUTH_{tenantId}/{container}": (path) => setPutStorageMetadata(path),
	"/v1/AUTH_{tenantId}/{container}/{object}": (path, content, contentType) => {
		if (content === undefined) {
			throw new Error("content is required for object upload");
		}
		return uploadStorageObject(path, content, contentType);
	},
};

/**
 * パラメータ付きConoHa POST/PUT APIのハンドラーマッピング
 *
 * @remarks
 * リソースの更新や操作用のハンドラーです。サーバーの起動/停止、ボリューム更新などを実行します。
 */
export const conohaPostPutByParamHandlers: Record<
	ConoHaPostPutByParamPaths,
	(param: string, requestBody: JsonObject) => Promise<string>
> = {
	"/action": (param, requestBody) =>
		createComputeByParam("/action", param, requestBody),
	"/remote-consoles": (param, requestBody) =>
		createComputeByParam("/remote-consoles", param, requestBody),
	"/os-volume_attachments": (param, requestBody) =>
		createComputeByParam("/os-volume_attachments", param, requestBody),
	"/v2.0/security-groups": (param, requestBody) =>
		updateNetworkByParam("/v2.0/security-groups", param, requestBody),
	"/v2.0/ports": (param, requestBody) =>
		updateNetworkByParam("/v2.0/ports", param, requestBody),
	"/volumes": (param, requestBody) =>
		updateVolumeByParam("/volumes", param, requestBody),
};

/**
 * ヘッダーパラメータ付きConoHa POST APIのハンドラーマッピング
 *
 * @remarks
 * リクエストヘッダーでメタデータを設定するハンドラーです。アカウント容量設定やコンテナのWeb公開設定を行います。
 */
export const conohaPostPutByHeaderparamHandlers: Record<
	ConoHaPostPutByParamByHeaderparamPaths,
	(path: string, headerparam: JsonObject) => Promise<string>
> = {
	"/v1": (path, headerparam) => setPostStorageMetadata(path, headerparam),
};

/**
 * ConoHa DELETE APIのハンドラーマッピング
 *
 * @remarks
 * リソース削除用のハンドラーです。サーバー、ボリューム、セキュリティグループ、オブジェクトストレージなどを削除します。
 */
export const conohaDeleteByParamHandlers: Record<
	ConoHaDeleteByParamPaths,
	(param: string) => Promise<string>
> = {
	"/servers": (param) => deleteComputeByParam("/servers", param),
	"/os-keypairs": (param) => deleteComputeByParam("/os-keypairs", param),
	"/v2.0/security-groups": (param) =>
		deleteNetworkByParam("/v2.0/security-groups", param),
	"/v2.0/security-group-rules": (param) =>
		deleteNetworkByParam("/v2.0/security-group-rules", param),
	"/volumes": (param) => deleteVolumeByParam("/volumes", param),
	"/v1/AUTH_{tenantId}/{container}": (param) => deleteStorageContainer(param),
	"/v1/AUTH_{tenantId}/{container}/{object}": (param) =>
		deleteStorageObject(param),
};

/**
 * ConoHa HEAD APIのハンドラーマッピング
 *
 * @remarks
 * オブジェクトストレージのアカウント情報およびコンテナ詳細取得用のハンドラーです。
 */
export const conohaHeadHandlers: Record<
	ConoHaHeadPaths,
	(path: string) => Promise<string>
> = {
	"/v1": (path) => {
		const pathParts = path.split("/");
		if (pathParts.length >= 4 && pathParts[3]) {
			return getStorageContainerInfo(path);
		}
		return getStorageAccountInfo(path);
	},
};
