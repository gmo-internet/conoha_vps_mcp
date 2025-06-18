import { executeOpenstackApi } from "../common/openstack-client";
import type { JsonObject } from "../common/types";
import { OPENSTACK_COMPUTE_BASE_URL } from "../constants";

export async function getCompute(path: string) {
	return executeOpenstackApi("GET", OPENSTACK_COMPUTE_BASE_URL, path);
}

export async function getComputeById(path: string, id: string) {
	return executeOpenstackApi(
		"GET",
		OPENSTACK_COMPUTE_BASE_URL,
		`/servers/${id}${path}`,
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

export async function createComputeById(
	path: string,
	id: string,
	requestBody: JsonObject,
) {
	return executeOpenstackApi(
		"POST",
		OPENSTACK_COMPUTE_BASE_URL,
		`/servers/${id}${path}`,
		requestBody,
	);
}

export async function deleteComputeById(path: string, id: string) {
	return executeOpenstackApi(
		"DELETE",
		OPENSTACK_COMPUTE_BASE_URL,
		`${path}/${id}`,
	);
}
