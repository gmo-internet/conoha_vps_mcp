import { z } from "zod";

export const CreateSecurityGroupRuleRequestSchema = z
	.object({
		security_group_rule: z
			.object({
				security_group_id: z.string().describe("セキュリティグループのID"),
				direction: z
					.enum(["ingress", "egress"], {
						message:
							"通信の向きは 'ingress' または 'egress' を指定してください",
					})
					.describe("ルールの方向 (ingressまたはegress)"),
				ethertype: z
					.enum(["IPv4", "IPv6"], {
						message: "イーサタイプは 'IPv4' または 'IPv6' を指定してください",
					})
					.describe("イーサタイプ (IPv4またはIPv6) (任意、デフォルトはIPv4)"),
				port_range_min: z
					.number({ message: "ポート番号は数値で指定してください" })
					.int({
						message: "ポート番号は整数で指定してください",
					})
					.nonnegative({
						message: "ポート番号は0以上の値を指定してください",
					})
					.max(65535, {
						message: "ポート番号は65535以下の値を指定してください",
					})
					.optional()
					.describe(
						"最小ポート範囲 (任意): ユーザーが必ず指定する必要があります。自動設定しないでください。",
					),
				port_range_max: z
					.number({ message: "ポート番号は数値で指定してください" })
					.int({
						message: "ポート番号は整数で指定してください",
					})
					.nonnegative({
						message: "ポート番号は0以上の値を指定してください",
					})
					.max(65535, {
						message: "ポート番号は65535以下の値を指定してください",
					})
					.optional()
					.describe(
						"最大ポート範囲 (任意): ユーザーが必ず指定する必要があります。自動設定しないでください。",
					),
				protocol: z
					.union([z.enum(["tcp", "udp", "icmp"]), z.null()])
					.optional()
					.describe("プロトコル (任意)"),
				remote_ip_prefix: z
					.string()
					.optional()
					.describe("リモートIPのCIDR (任意)"),
				remote_group_id: z
					.string()
					.optional()
					.describe("リモートセキュリティグループのID (任意)"),
			})
			.strict(),
	})
	.strict();

export const CreateSecurityGroupRequestSchema = z
	.object({
		security_group: z
			.object({
				name: z.string().describe("セキュリティグループの名前"),
				description: z
					.string()
					.optional()
					.describe("セキュリティグループの説明 (任意)"),
			})
			.strict(),
	})
	.strict();

export const UpdateSecurityGroupRequestSchema = z
	.object({
		security_group: z
			.object({
				name: z
					.string()
					.optional()
					.describe("セキュリティグループの名前 (任意)"),
				description: z
					.string()
					.optional()
					.describe("セキュリティグループの説明 (任意)"),
			})
			.strict(),
	})
	.strict();

export const UpdatePortRequestSchema = z
	.object({
		port: z
			.object({
				security_groups: z
					.array(z.string())
					.optional()
					.describe("ポートに関連付けるセキュリティグループIDのリスト (任意)"),
			})
			.strict(),
	})
	.strict();
