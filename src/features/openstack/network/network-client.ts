import { executeOpenstackApi } from "../common/openstack-client.js";
import type { JsonObject } from "../common/types.js";
import { OPENSTACK_NETWORK_BASE_URL } from "../constants.js";

export async function getNetwork(path: string) {
	return executeOpenstackApi("GET", OPENSTACK_NETWORK_BASE_URL, path);
}

export async function getNetworkById(path: string, id: string) {
	return executeOpenstackApi(
		"GET",
		OPENSTACK_NETWORK_BASE_URL,
		`${path}/${id}`,
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

export async function updateNetworkById(
	path: string,
	id: string,
	requestBody: JsonObject,
) {
	return executeOpenstackApi(
		"PUT",
		OPENSTACK_NETWORK_BASE_URL,
		`${path}/${id}`,
		requestBody,
	);
}

export async function deleteNetworkById(path: string, id: string) {
	return executeOpenstackApi(
		"DELETE",
		OPENSTACK_NETWORK_BASE_URL,
		`${path}/${id}`,
	);
}
