import type { JsonObject } from "../../../types.js";
import { executeOpenstackApi } from "../common/openstack-client.js";
import { formatResponse } from "../common/response-formatter.js";
import { OPENSTACK_COMPUTE_BASE_URL } from "../constants.js";
import { formatGetFlavorResponse } from "./get-flavor-response-formatter.js";

export async function getCompute(path: string) {
	const response = await executeOpenstackApi(
		"GET",
		OPENSTACK_COMPUTE_BASE_URL,
		path,
	);
	return await formatResponse(response);
}

export async function getFlavor(path: string) {
	const response = await executeOpenstackApi(
		"GET",
		OPENSTACK_COMPUTE_BASE_URL,
		path,
	);
	return await formatGetFlavorResponse(response);
}

export async function getComputeByParam(path: string, param: string) {
	const response = await executeOpenstackApi(
		"GET",
		OPENSTACK_COMPUTE_BASE_URL,
		`/servers/${param}${path}`,
	);
	return await formatResponse(response);
}

export async function createCompute(path: string, requestBody: JsonObject) {
	const response = await executeOpenstackApi(
		"POST",
		OPENSTACK_COMPUTE_BASE_URL,
		path,
		requestBody,
	);
	return await formatResponse(response);
}

export async function createComputeByParam(
	path: string,
	param: string,
	requestBody: JsonObject,
) {
	const response = await executeOpenstackApi(
		"POST",
		OPENSTACK_COMPUTE_BASE_URL,
		`/servers/${param}${path}`,
		requestBody,
	);
	return await formatResponse(response);
}

export async function deleteComputeByParam(path: string, param: string) {
	const response = await executeOpenstackApi(
		"DELETE",
		OPENSTACK_COMPUTE_BASE_URL,
		`${path}/${param}`,
	);
	return await formatResponse(response);
}
