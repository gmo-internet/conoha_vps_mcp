import { executeOpenstackApi } from "../common/openstack-client.js";
import type { JsonObject } from "../common/types.js";
import { OPENSTACK_COMPUTE_BASE_URL } from "../constants.js";

export async function getCompute(path: string) {
	return executeOpenstackApi("GET", OPENSTACK_COMPUTE_BASE_URL, path);
}

export async function getComputeByParam(path: string, param: string) {
	return executeOpenstackApi(
		"GET",
		OPENSTACK_COMPUTE_BASE_URL,
		`/servers/${param}${path}`,
	);
}

export async function createCompute(path: string, requestBody: JsonObject) {
	return executeOpenstackApi(
		"POST",
		OPENSTACK_COMPUTE_BASE_URL,
		path,
		requestBody,
	);
}

export async function createComputeByParam(
	path: string,
	param: string,
	requestBody: JsonObject,
) {
	return executeOpenstackApi(
		"POST",
		OPENSTACK_COMPUTE_BASE_URL,
		`/servers/${param}${path}`,
		requestBody,
	);
}

export async function deleteComputeByParam(path: string, param: string) {
	return executeOpenstackApi(
		"DELETE",
		OPENSTACK_COMPUTE_BASE_URL,
		`${path}/${param}`,
	);
}
