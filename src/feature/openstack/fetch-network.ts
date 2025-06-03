import { type JsonObject, fetchOpenstackApi } from "./api-client";

const OPENSTACK_NETWORK_BASE_URL = process.env.OPENSTACK_NETWORK_BASE_URL;

export async function getOpenstackNetworkApi(path: string) {
	return fetchOpenstackApi("GET", OPENSTACK_NETWORK_BASE_URL, path);
}

export async function getOpenstackNetworkApiId(path: string, id: string) {
	return fetchOpenstackApi("GET", OPENSTACK_NETWORK_BASE_URL, `${path}/${id}`);
}

export async function postOpenstackNetworkApiRequestBody(
	path: string,
	requestBody: JsonObject,
) {
	return fetchOpenstackApi(
		"POST",
		OPENSTACK_NETWORK_BASE_URL,
		path,
		requestBody,
	);
}

export async function putOpenstackNetworkApiRequestBody1Id(
	path: string,
	id: string,
	requestBody: JsonObject,
) {
	return fetchOpenstackApi(
		"PUT",
		OPENSTACK_NETWORK_BASE_URL,
		`${path}/${id}`,
		requestBody,
	);
}

export async function deleteOpenstackNetworkApiId(path: string, id: string) {
	return fetchOpenstackApi(
		"DELETE",
		OPENSTACK_NETWORK_BASE_URL,
		`${path}/${id}`,
	);
}
