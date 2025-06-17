import { fetchOpenstackToken } from "./fetch-identity";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type JsonPrimitive = string | number | boolean | null;
export type JsonObject = {
	[key: string]: JsonPrimitive | JsonObject | JsonObject[] | string[];
};

export async function fetchOpenstackApi(
	method: "GET" | "DELETE",
	baseUrl: string,
	path: string,
): Promise<string>;

export async function fetchOpenstackApi(
	method: "POST" | "PUT",
	baseUrl: string,
	path: string,
	body: JsonObject,
): Promise<string>;

export async function fetchOpenstackApi(
	method: HttpMethod,
	baseUrl: string,
	path: string,
	body?: JsonObject,
): Promise<string> {
	try {
		if (!baseUrl) throw new Error("Base URL is not defined in .env file");

		const apiToken = await fetchOpenstackToken();

		const response = await fetch(`${baseUrl}${path}`, {
			method,
			headers: {
				Accept: "application/json",
				"X-Auth-Token": apiToken,
				...(body ? { "Content-Type": "application/json" } : {}),
			},
			...(body ? { body: JSON.stringify(body) } : {}),
		});

		async function formatResponse(response: Response) {
			const raw = await response.text();
			try {
				return JSON.parse(raw);
			} catch (error) {
				return raw;
			}
		}
		const responseBody = await formatResponse(response);
		return JSON.stringify({
			status: response.status,
			statusText: response.statusText,
			body: responseBody,
		});
	} catch (error) {
		if (error instanceof Error) {
			return `Error: ${error.message}`;
		}
		return "Unexpected error occurred";
	}
}
