import { executeOpenstackApi } from "../common/openstack-client.js";
import { OPENSTACK_IMAGE_BASE_URL } from "../constants.js";
import { formatGetImageResponse } from "./get-image-response-formatter.js";

export async function getImage(path: string) {
	const response = await executeOpenstackApi(
		"GET",
		OPENSTACK_IMAGE_BASE_URL,
		path,
	);
	return await formatGetImageResponse(response);
}
