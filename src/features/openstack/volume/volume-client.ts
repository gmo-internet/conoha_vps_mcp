import type { JsonObject } from "../../../types.js";
import { executeOpenstackApi } from "../common/openstack-client.js";
import { formatResponse } from "../common/response-formatter.js";
import { OPENSTACK_VOLUME_BASE_URL } from "../constants.js";

const TENANT_ID = process.env.OPENSTACK_TENANT_ID;

const OPENSTACK_VOLUME_TENANT_BASE_URL = `${OPENSTACK_VOLUME_BASE_URL}/${TENANT_ID}`;

export async function getVolume(path: string) {
	const response = await executeOpenstackApi(
		"GET",
		OPENSTACK_VOLUME_TENANT_BASE_URL,
		path,
	);
	return await formatResponse(response);
}

export async function createVolume(path: string, requestBody: JsonObject) {
	const response = await executeOpenstackApi(
		"POST",
		OPENSTACK_VOLUME_TENANT_BASE_URL,
		path,
		requestBody,
	);
	return await formatResponse(response);
}

export async function updateVolumeByParam(
	path: string,
	param: string,
	requestBody: JsonObject,
) {
	const response = await executeOpenstackApi(
		"PUT",
		OPENSTACK_VOLUME_TENANT_BASE_URL,
		`${path}/${param}`,
		requestBody,
	);
	return await formatResponse(response);
}

export async function deleteVolumeByParam(path: string, param: string) {
	const response = await executeOpenstackApi(
		"DELETE",
		OPENSTACK_VOLUME_TENANT_BASE_URL,
		`${path}/${param}`,
	);
	return await formatResponse(response);
}
