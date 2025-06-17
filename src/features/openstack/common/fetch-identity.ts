import "dotenv/config";

const IDENTITY_BASE_URL = process.env.OPENSTACK_IDENTITY_BASE_URL;
const USER_ID = process.env.OPENSTACK_USER_ID;
const PASSWORD = process.env.OPENSTACK_PASSWORD;
const TENANT_ID = process.env.OPENSTACK_TENANT_ID;

export async function getOpenstackIdentityApi(path: string) {
	if (!IDENTITY_BASE_URL || !USER_ID || !PASSWORD || !TENANT_ID)
		throw new Error("IDENTITY envs are not defined in .env file");

	const response = await fetch(`${IDENTITY_BASE_URL}${path}`, {
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

export async function fetchOpenstackToken() {
	const response = await getOpenstackIdentityApi("/auth/tokens");
	const apiToken = response.get("x-subject-token") as string;
	return apiToken;
}
