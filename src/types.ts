export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
export type JsonPrimitive = string | number | boolean | null;

export type JsonObject = {
	[key: string]: JsonPrimitive | JsonObject | JsonObject[] | string[];
};

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
	| "/startup-scripts";

export type ConoHaGetByParamsPaths =
	| "/ips"
	| "/os-security-groups"
	| "/rrd/cpu"
	| "/rrd/disk"
	| "/v2.0/security-groups"
	| "/v2.0/security-group-rules";

export type ConoHaPostPaths =
	| "/servers"
	| "/os-keypairs"
	| "/volumes"
	| "/v2.0/security-groups"
	| "/v2.0/security-group-rules";

export type ConoHaPostPutByParamPaths =
	| "/action"
	| "/remote-consoles"
	| "/v2.0/security-groups"
	| "/v2.0/ports"
	| "/volumes";

export type ConoHaDeleteByParamPaths =
	| "/servers"
	| "/os-keypairs"
	| "/v2.0/security-groups"
	| "/v2.0/security-group-rules"
	| "/volumes";
