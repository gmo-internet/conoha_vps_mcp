import type { JsonObject } from "../../../types.js";
import { executeOpenstackApi } from "../common/openstack-client.js";
import { formatResponse } from "../common/response-formatter.js";
import { OPENSTACK_NETWORK_BASE_URL } from "../constants.js";
import { formatGetSecurityGroupResponse } from "./get-security-group-response-formatter.js";

export async function getNetwork(path: string) {
	const response = await executeOpenstackApi(
		"GET",
		OPENSTACK_NETWORK_BASE_URL,
		path,
	);
	return await formatResponse(response);
}

export async function getNetworkByParam(path: string, param: string) {
	const response = await executeOpenstackApi(
		"GET",
		OPENSTACK_NETWORK_BASE_URL,
		`${path}/${param}`,
	);
	return await formatResponse(response);
}

export async function getSecurityGroup(path: string) {
	const response = await executeOpenstackApi(
		"GET",
		OPENSTACK_NETWORK_BASE_URL,
		path,
	);
	return await formatGetSecurityGroupResponse(response);
}

export async function createNetwork(path: string, requestBody: JsonObject) {
	const response = await executeOpenstackApi(
		"POST",
		OPENSTACK_NETWORK_BASE_URL,
		path,
		requestBody,
	);
	return await formatResponse(response);
}

export async function updateNetworkByParam(
	path: string,
	param: string,
	requestBody: JsonObject,
) {
	const response = await executeOpenstackApi(
		"PUT",
		OPENSTACK_NETWORK_BASE_URL,
		`${path}/${param}`,
		requestBody,
	);
	return await formatResponse(response);
}

export async function deleteNetworkByParam(path: string, param: string) {
	const response = await executeOpenstackApi(
		"DELETE",
		OPENSTACK_NETWORK_BASE_URL,
		`${path}/${param}`,
	);
	return await formatResponse(response);
}
