import { fetchOpenstackApi } from "./api-client";

const OPENSTACK_IMAGE_BASE_URL = process.env.OPENSTACK_IMAGE_BASE_URL;

export async function getOpenstackImageApi(path: string) {
	return fetchOpenstackApi("GET", OPENSTACK_IMAGE_BASE_URL, path);
}
