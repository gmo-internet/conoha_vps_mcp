export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
export type JsonPrimitive = string | number | boolean | null;

export type JsonObject = {
	[key: string]: JsonPrimitive | JsonObject | JsonObject[] | string[];
};
