import { OPENSTACK_IDENTITY_BASE_URL } from "../constants";

async function fetchOpenstackAuthHeaders(path: string) {
	const USER_ID = process.env.OPENSTACK_USER_ID;
	const PASSWORD = process.env.OPENSTACK_PASSWORD;
	const TENANT_ID = process.env.OPENSTACK_TENANT_ID;

	if (!USER_ID || !PASSWORD || !TENANT_ID)
		throw new Error("USER_ID, PASSWORD, or TENANT_ID envs are not defined");

	const response = await fetch(`${OPENSTACK_IDENTITY_BASE_URL}${path}`, {
		method: "POST",
		headers: { Accept: "application/json" },
		body: JSON.stringify({
			auth: {
				identity: {
					methods: ["password"],
					password: {
						user: {
							id: USER_ID,
							password: PASSWORD,
						},
					},
				},
				scope: {
					project: {
						id: TENANT_ID,
					},
				},
			},
		}),
	});
	return response.headers;
}

export async function generateApiToken() {
	const response = await fetchOpenstackAuthHeaders("/auth/tokens");
	const apiToken = response.get("x-subject-token") as string;
	return apiToken;
}
