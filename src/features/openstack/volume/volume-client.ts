import { executeOpenstackApi } from "../common/openstack-client.js";
import type { JsonObject } from "../common/types.js";
import { OPENSTACK_VOLUME_BASE_URL } from "../constants.js";

const TENANT_ID = process.env.OPENSTACK_TENANT_ID;

const OPENSTACK_VOLUME_TENANT_BASE_URL = `${OPENSTACK_VOLUME_BASE_URL}/${TENANT_ID}`;

export async function getVolume(path: string) {
	return executeOpenstackApi("GET", OPENSTACK_VOLUME_TENANT_BASE_URL, path);
}

export async function createVolume(path: string, requestBody: JsonObject) {
	return executeOpenstackApi(
		"POST",
		OPENSTACK_VOLUME_TENANT_BASE_URL,
		path,
		requestBody,
	);
}

export async function updateVolumeById(
	path: string,
	id: string,
	requestBody: JsonObject,
) {
	return executeOpenstackApi(
		"PUT",
		OPENSTACK_VOLUME_TENANT_BASE_URL,
		`${path}/${id}`,
		requestBody,
	);
}

export async function deleteVolumeById(path: string, id: string) {
	return executeOpenstackApi(
		"DELETE",
		OPENSTACK_VOLUME_TENANT_BASE_URL,
		`${path}/${id}`,
	);
}
