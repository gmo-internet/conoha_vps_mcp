import { z } from "zod";

export const CreateSecurityGroupRuleRequestSchema = z
	.object({
		security_group_rule: z
			.object({
				security_group_id: z.string(),
				direction: z.enum(["ingress", "egress"], {
					errorMap: () => ({
						message:
							"通信の向きは 'ingress' または 'egress' を指定してください",
					}),
				}),
				ethertype: z.enum(["IPv4", "IPv6"], {
					errorMap: () => ({
						message: "イーサタイプは 'IPv4' または 'IPv6' を指定してください",
					}),
				}),
				port_range_min: z
					.number({
						errorMap: () => ({
							message: "ポート番号は数値で指定してください",
						}),
					})
					.int({
						message: "ポート番号は整数で指定してください",
					})
					.nonnegative({
						message: "ポート番号は0以上の値を指定してください",
					})
					.max(65535, {
						message: "ポート番号は65535以下の値を指定してください",
					})
					.optional(),
				port_range_max: z
					.number({
						errorMap: () => ({
							message: "ポート番号は数値で指定してください",
						}),
					})
					.int({
						message: "ポート番号は整数で指定してください",
					})
					.nonnegative({
						message: "ポート番号は0以上の値を指定してください",
					})
					.max(65535, {
						message: "ポート番号は65535以下の値を指定してください",
					})
					.optional(),
				protocol: z
					.union([z.enum(["tcp", "udp", "icmp"]), z.null()])
					.optional(),
				remote_ip_prefix: z.string().optional(),
				remote_group_id: z.string().optional(),
			})
			.strict(),
	})
	.strict();

export const CreateSecurityGroupRequestSchema = z
	.object({
		security_group: z
			.object({
				name: z.string(),
				description: z.string().optional(),
			})
			.strict(),
	})
	.strict();

export const UpdateSecurityGroupRequestSchema = z
	.object({
		security_group: z
			.object({
				name: z.string().optional(),
				description: z.string().optional(),
			})
			.strict(),
	})
	.strict();

export const UpdatePortRequestSchema = z
	.object({
		port: z
			.object({
				security_groups: z.array(z.string()).optional(),
			})
			.strict(),
	})
	.strict();
