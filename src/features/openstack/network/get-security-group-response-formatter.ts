interface SecurityGroupRuleData {
	ethertype?: "IPv4" | "IPv6";
	direction?: "ingress" | "egress";
	protocol?: "tcp" | "udp" | "icmp" | null | string;
	port_range_min?: number | null;
	port_range_max?: number | null;
	remote_ip_prefix?: string | null;
	remote_group_id?: string | null;
}

interface SecurityGroupData {
	id?: string;
	name?: string;
	description?: string;
	security_group_rules?: SecurityGroupRuleData[];
}

interface ApiResponse {
	security_groups?: SecurityGroupData[];
}

export async function formatGetSecurityGroupResponse(response: Response) {
	const status = response.status;
	const statusText = response.statusText;

	try {
		const body = (await response.json()) as ApiResponse;

		if (!body?.security_groups || !Array.isArray(body?.security_groups)) {
			return JSON.stringify({ status, statusText, body });
		}

		const slimmed = {
			security_groups: body.security_groups.map((sg: SecurityGroupData) => {
				const slim = {
					id: sg?.id,
					name: sg?.name,
					description: sg?.description,
					security_group_rules: sg?.security_group_rules?.map(
						(rule: SecurityGroupRuleData) => ({
							ethertype: rule?.ethertype,
							direction: rule?.direction,
							protocol: rule?.protocol ?? null,
							port_range_min: rule?.port_range_min ?? null,
							port_range_max: rule?.port_range_max ?? null,
							remote_ip_prefix: rule?.remote_ip_prefix ?? null,
							remote_group_id: rule?.remote_group_id ?? null,
						}),
					),
				};
				return slim;
			}),
		} satisfies ApiResponse;
		return JSON.stringify({ status, statusText, body: slimmed });
	} catch (error) {
		console.error("Error formatting response:", error);
		return JSON.stringify({ status, statusText, body: "<error>" });
	}
}
