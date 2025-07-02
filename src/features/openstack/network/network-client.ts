import { executeOpenstackApi } from "../common/openstack-client.js";
import type { JsonObject } from "../common/types.js";
import { OPENSTACK_NETWORK_BASE_URL } from "../constants.js";

export async function getNetwork(path: string) {
	return executeOpenstackApi("GET", OPENSTACK_NETWORK_BASE_URL, path);
}

export async function getNetworkByParam(path: string, param: string) {
	return executeOpenstackApi(
		"GET",
		OPENSTACK_NETWORK_BASE_URL,
		`${path}/${param}`,
	);
}

export async function createNetwork(path: string, requestBody: JsonObject) {
	return executeOpenstackApi(
		"POST",
		OPENSTACK_NETWORK_BASE_URL,
		path,
		requestBody,
	);
}

export async function updateNetworkByParam(
	path: string,
	param: string,
	requestBody: JsonObject,
) {
	return executeOpenstackApi(
		"PUT",
		OPENSTACK_NETWORK_BASE_URL,
		`${path}/${param}`,
		requestBody,
	);
}

export async function deleteNetworkByParam(path: string, param: string) {
	return executeOpenstackApi(
		"DELETE",
		OPENSTACK_NETWORK_BASE_URL,
		`${path}/${param}`,
	);
}
