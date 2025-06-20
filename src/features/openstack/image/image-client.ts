import { executeOpenstackApi } from "../common/openstack-client.js";
import { OPENSTACK_IMAGE_BASE_URL } from "../constants.js";

export async function getImage(path: string) {
	return executeOpenstackApi("GET", OPENSTACK_IMAGE_BASE_URL, path);
}
