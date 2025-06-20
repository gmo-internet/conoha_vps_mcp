import { formatResponse } from "./format-response.js";
import { generateApiToken } from "./generate-api-token.js";
import type { HttpMethod, JsonObject } from "./types.js";

export async function executeOpenstackApi(
	method: "GET" | "DELETE",
	baseUrl: string,
	path: string,
): Promise<string>;

export async function executeOpenstackApi(
	method: "POST" | "PUT",
	baseUrl: string,
	path: string,
	body: JsonObject,
): Promise<string>;

export async function executeOpenstackApi(
	method: HttpMethod,
	baseUrl: string,
	path: string,
	body?: JsonObject,
): Promise<string> {
	try {
		const apiToken = await generateApiToken();

		// baseUrlの末尾やpathの先頭のスラッシュの有無に関わらず、正しいURLを生成
		const normalizedPath = path.startsWith("/") ? path : `/${path}`;
		const url = `${baseUrl}${normalizedPath}`;

		const response = await fetch(url, {
			method,
			headers: {
				Accept: "application/json",
				"X-Auth-Token": apiToken,
				...(body ? { "Content-Type": "application/json" } : {}),
			},
			...(body ? { body: JSON.stringify(body) } : {}),
		});

		return await formatResponse(response);
	} catch (error) {
		if (error instanceof Error) {
			return `Error: ${error.message}`;
		}
		return "Unexpected error occurred";
	}
}
