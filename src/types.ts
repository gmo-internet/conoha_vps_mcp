/**
 * 共通型定義
 *
 * @remarks
 * MCPサーバー全体で使用される型定義を提供します。
 *
 * @packageDocumentation
 */

/**
 * サポートされるHTTPメソッド
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
/**
 * JSONプリミティブ型
 */
type JsonPrimitive = string | number | boolean | null;

/**
 * JSONオブジェクト型
 *
 * @remarks
 * OpenStack APIへのリクエストボディやレスポンスボディの型として使用されます。
 */
export type JsonObject = {
	[key: string]: JsonPrimitive | JsonObject | JsonObject[] | string[];
};

/**
 * conoha_getツールで利用可能なAPIパス
 */
export type ConoHaGetPaths =
	| "/servers/detail"
	| "/flavors/detail"
	| "/os-keypairs"
	| "/types"
	| "/volumes/detail"
	| "/v2/images?limit=200"
	| "/v2.0/security-groups"
	| "/v2.0/security-group-rules"
	| "/v2.0/ports"
	| "/startup-scripts"
	| "/v1/AUTH_{tenantId}"
	| "/v1/AUTH_{tenantId}/{container}"
	| "/v1/AUTH_{tenantId}/{container}/{object}";

/**
 * conoha_get_by_paramツールで利用可能なAPIパス
 */
export type ConoHaGetByParamsPaths =
	| "/ips"
	| "/os-security-groups"
	| "/rrd/cpu"
	| "/rrd/disk"
	| "/v2.0/security-groups"
	| "/v2.0/security-group-rules";

/**
 * conoha_postツールで利用可能なAPIパス
 */
export type ConoHaPostPaths =
	| "/servers"
	| "/os-keypairs"
	| "/volumes"
	| "/v2.0/security-groups"
	| "/v2.0/security-group-rules";

export type ConoHaPostPutPaths =
	| "/v1/AUTH_{tenantId}/{container}"
	| "/v1/AUTH_{tenantId}/{container}/{object}";

/**
 * conoha_post_put_by_paramツールで利用可能なAPIパス
 */
export type ConoHaPostPutByParamPaths =
	| "/action"
	| "/remote-consoles"
	| "/os-volume_attachments"
	| "/v2.0/security-groups"
	| "/v2.0/ports"
	| "/volumes";

export type ConoHaPostPutByParamByHeaderparamPaths = "/v1";

/**
 * conoha_delete_by_paramツールで利用可能なAPIパス
 */
export type ConoHaDeleteByParamPaths =
	| "/servers"
	| "/os-keypairs"
	| "/v2.0/security-groups"
	| "/v2.0/security-group-rules"
	| "/volumes"
	| "/v1/AUTH_{tenantId}/{container}"
	| "/v1/AUTH_{tenantId}/{container}/{object}";

/**
 * conoha_headツールで利用可能なAPIパス
 */
export type ConoHaHeadPaths = "/v1";
