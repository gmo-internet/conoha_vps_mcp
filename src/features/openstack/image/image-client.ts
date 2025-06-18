import { executeOpenstackApi } from "../common/openstack-client";
import { OPENSTACK_IMAGE_BASE_URL } from "../constants";

export async function getImage(path: string) {
	return executeOpenstackApi("GET", OPENSTACK_IMAGE_BASE_URL, path);
}
