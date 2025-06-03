import { z } from "zod";

export const CreateServerRequestSchema = z.object({
	server: z.object({
		flavorRef: z.string(),
		adminPass: z.string(),
		block_device_mapping_v2: z.array(
			z.object({
				uuid: z.string(),
			}),
		),
		metadata: z.object({
			instance_name_tag: z.string(),
		}),
		security_groups: z
			.array(
				z.object({
					name: z.string(),
				}),
			)
			.optional(),
	}),
});

export const CreateVolumeRequestSchema = z.object({
	volume: z.object({
		size: z.number().int(),
		description: z.string().nullable().optional(),
		name: z.string(),
		volume_type: z.string(),
		imageRef: z.string(),
	}),
});

export const CreateSecurityGroupRuleRequestSchema = z.object({
	security_group_rule: z.object({
		security_group_id: z.string(),
		direction: z.enum(["ingress", "egress"], {
			errorMap: () => ({
				message: "通信の向きは 'ingress' または 'egress' を指定してください",
			}),
		}),
		ethertype: z.enum(["IPv4", "IPv6"], {
			errorMap: () => ({
				message: "イーサタイプは 'IPv4' または 'IPv6' を指定してください",
			}),
		}),
		port_range_min: z.number().int().nonnegative().optional(),
		port_range_max: z.number().int().nonnegative().optional(),
		protocol: z.union([z.enum(["tcp", "udp", "icmp"]), z.null()]).optional(),
		remote_ip_prefix: z.string().optional(),
		remote_group_id: z.string().optional(),
	}),
});

export const CreateSecurityGroupRequestSchema = z.object({
	security_group: z.object({
		name: z.string(),
		description: z.string(),
	}),
});

export const OperateServerRequestSchema = z.union([
	z.object({ "os-start": z.null() }),
	z.object({ "os-stop": z.null() }),
	z.object({ "os-stop": z.object({ force_shutdown: z.boolean() }) }),
	z.object({ reboot: z.object({ type: z.enum(["SOFT", "HARD"]) }) }),
	z.object({ resize: z.object({ flavorRef: z.string() }) }),
	z.object({ confirmResize: z.null() }),
	z.object({ revertResize: z.null() }),
]);

export const RemoteConsoleRequestSchema = z.object({
	remote_console: z.object({
		protocol: z.enum(["vnc", "serial", "web"], {
			errorMap: () => ({
				message:
					"protocol は 'vnc', 'serial', 'web' のいずれかを指定してください",
			}),
		}),
		type: z.enum(["novnc", "serial"], {
			errorMap: () => ({
				message: "type は 'novnc' または 'serial' を指定してください",
			}),
		}),
	}),
});

export const UpdateSecurityGroupRequestSchema = z.object({
	security_group: z.object({
		name: z.string().optional(),
		description: z.string().optional(),
	}),
});

export const UpdateVolumeRequestSchema = z.object({
	volume: z.object({
		name: z.string().optional(),
		description: z.string().optional(),
	}),
});

export const UpdatePortRequestSchema = z.object({
	port: z.object({
		security_groups: z.array(z.string()).optional(),
	}),
});
