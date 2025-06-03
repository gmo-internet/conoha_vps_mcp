import { type JsonObject, fetchOpenstackApi } from "./api-client";

const OPENSTACK_VOLUME_BASE_URL = process.env.OPENSTACK_VOLUME_BASE_URL;
const TENANT_ID = process.env.OPENSTACK_TENANT_ID;

const OPENSTACK_VOLUME_TENANT_BASE_URL = `${OPENSTACK_VOLUME_BASE_URL}/${TENANT_ID}`;

export async function getOpenstackVolumeApi(path: string) {
	return fetchOpenstackApi("GET", OPENSTACK_VOLUME_TENANT_BASE_URL, path);
}

export async function postOpenstackVolumeApiRequestBody(
	path: string,
	requestBody: JsonObject,
) {
	return fetchOpenstackApi(
		"POST",
		OPENSTACK_VOLUME_TENANT_BASE_URL,
		path,
		requestBody,
	);
}

export async function putOpenstackVolumeApiRequestBody1Id(
	path: string,
	id: string,
	requestBody: JsonObject,
) {
	return fetchOpenstackApi(
		"PUT",
		OPENSTACK_VOLUME_TENANT_BASE_URL,
		`${path}/${id}`,
		requestBody,
	);
}

export async function deleteOpenstackVolumeApiId(path: string, id: string) {
	return fetchOpenstackApi(
		"DELETE",
		OPENSTACK_VOLUME_TENANT_BASE_URL,
		`${path}/${id}`,
	);
}
