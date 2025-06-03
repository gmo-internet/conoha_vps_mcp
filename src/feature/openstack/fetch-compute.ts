import { type JsonObject, fetchOpenstackApi } from "./api-client";

const OPENSTACK_COMPUTE_BASE_URL = process.env.OPENSTACK_COMPUTE_BASE_URL;

export async function getOpenstackComputeApi(path: string) {
	return fetchOpenstackApi("GET", OPENSTACK_COMPUTE_BASE_URL, path);
}

export async function getOpenstackComputeApiId(path: string, id: string) {
	return fetchOpenstackApi(
		"GET",
		OPENSTACK_COMPUTE_BASE_URL,
		`/servers/${id}${path}`,
	);
}

export async function postOpenstackComputeApiRequestBody(
	path: string,
	requestBody: JsonObject,
) {
	return fetchOpenstackApi(
		"POST",
		OPENSTACK_COMPUTE_BASE_URL,
		path,
		requestBody,
	);
}

export async function postOpenstackComputeApiRequestBody1Id(
	path: string,
	id: string,
	requestBody: JsonObject,
) {
	return fetchOpenstackApi(
		"POST",
		OPENSTACK_COMPUTE_BASE_URL,
		`/servers/${id}${path}`,
		requestBody,
	);
}

export async function deleteOpenstackComputeApiId(path: string, id: string) {
	return fetchOpenstackApi(
		"DELETE",
		OPENSTACK_COMPUTE_BASE_URL,
		`${path}/${id}`,
	);
}
