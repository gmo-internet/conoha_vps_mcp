import { executeOpenstackApi } from "../common/openstack-client.js";
import { formatResponse } from "../common/response-formatter.js";
import { OPENSTACK_IMAGE_BASE_URL } from "../constants.js";

export async function getImage(path: string) {
	const response = await executeOpenstackApi(
		"GET",
		OPENSTACK_IMAGE_BASE_URL,
		path,
	);
	return await formatResponse(response);
}
