import {
	createCompute,
	createComputeByParam,
	deleteComputeByParam,
	getCompute,
	getComputeByParam,
} from "./features/openstack/compute/compute-client.js";
import { getImage } from "./features/openstack/image/image-client.js";
import {
	createNetwork,
	deleteNetworkByParam,
	getNetwork,
	getNetworkByParam,
	updateNetworkByParam,
} from "./features/openstack/network/network-client.js";
import {
	createVolume,
	deleteVolumeByParam,
	getVolume,
	updateVolumeByParam,
} from "./features/openstack/volume/volume-client.js";
import type {
	ConoHaDeleteByParamPaths,
	ConoHaGetByParamsPaths,
	ConoHaGetPaths,
	ConoHaPostPaths,
	ConoHaPostPutByParamPaths,
} from "./types.js";

export const conohaGetHandlers: Record<ConoHaGetPaths, () => Promise<string>> =
	{
		"/servers/detail": () => getCompute("/servers/detail"),
		"/flavors/detail": () => getCompute("/flavors/detail"),
		"/os-keypairs": () => getCompute("/os-keypairs"),
		"/types": () => getVolume("/types"),
		"/volumes/detail": () => getVolume("/volumes/detail"),
		"/v2/images?limit=200": () => getImage("/v2/images?limit=200"),
		"/v2.0/security-groups": () => getNetwork("/v2.0/security-groups"),
		"/v2.0/security-group-rules": () =>
			getNetwork("/v2.0/security-group-rules"),
		"/v2.0/ports": () => getNetwork("/v2.0/ports"),
	};

export const conohaGetByParamHandlers: Record<
	ConoHaGetByParamsPaths,
	(param: string) => Promise<string>
> = {
	"/ips": (param) => getComputeByParam("/ips", param),
	"/os-security-groups": (param) =>
		getComputeByParam("/os-security-groups", param),
	"/rrd/cpu": (param) => getComputeByParam("/rrd/cpu", param),
	"/rrd/disk": (param) => getComputeByParam("/rrd/disk", param),
	"/v2.0/security-groups": (param) =>
		getNetworkByParam("/v2.0/security-groups", param),
	"/v2.0/security-group-rules": (param) =>
		getNetworkByParam("/v2.0/security-group-rules", param),
};

export const conohaPostHandlers: Record<
	ConoHaPostPaths,
	(requestBody: any) => Promise<string>
> = {
	"/servers": (requestBody) => createCompute("/servers", requestBody),
	"/os-keypairs": (requestBody) => createCompute("/os-keypairs", requestBody),
	"/volumes": (requestBody) => createVolume("/volumes", requestBody),
	"/v2.0/security-groups": (requestBody) =>
		createNetwork("/v2.0/security-groups", requestBody),
	"/v2.0/security-group-rules": (requestBody) =>
		createNetwork("/v2.0/security-group-rules", requestBody),
};

export const conohaPostPutByParamHandlers: Record<
	ConoHaPostPutByParamPaths,
	(param: string, requestBody: any) => Promise<string>
> = {
	"/action": (param, requestBody) =>
		createComputeByParam("/action", param, requestBody),
	"/remote-consoles": (param, requestBody) =>
		createComputeByParam("/remote-consoles", param, requestBody),
	"/v2.0/security-groups": (param, requestBody) =>
		updateNetworkByParam("/v2.0/security-groups", param, requestBody),
	"/v2.0/ports": (param, requestBody) =>
		updateNetworkByParam("/v2.0/ports", param, requestBody),
	"/volumes": (param, requestBody) =>
		updateVolumeByParam("/volumes", param, requestBody),
};

export const conohaDeleteByParamHandlers: Record<
	ConoHaDeleteByParamPaths,
	(param: string) => Promise<string>
> = {
	"/servers": (param) => deleteComputeByParam("/servers", param),
	"/os-keypairs": (param) => deleteComputeByParam("/os-keypairs", param),
	"/v2.0/security-groups": (param) =>
		deleteNetworkByParam("/v2.0/security-groups", param),
	"/v2.0/security-group-rules": (param) =>
		deleteNetworkByParam("/v2.0/security-group-rules", param),
	"/volumes": (param) => deleteVolumeByParam("/volumes", param),
};
