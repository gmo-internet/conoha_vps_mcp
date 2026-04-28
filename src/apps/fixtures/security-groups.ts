/**
 * モックセキュリティグループ一覧フィクスチャ
 *
 * @packageDocumentation
 */

import type { AppSecurityGroup } from "../apps-types.js";

export const securityGroups: AppSecurityGroup[] = [
	{
		id: "sg-default-001",
		name: "default",
		description: "デフォルトセキュリティグループ",
		rules_count: 4,
		rules: [
			{
				direction: "ingress",
				protocol: "tcp",
				port_range: "22",
				remote_ip: "0.0.0.0/0",
			},
			{
				direction: "ingress",
				protocol: "tcp",
				port_range: "80",
				remote_ip: "0.0.0.0/0",
			},
			{
				direction: "ingress",
				protocol: "tcp",
				port_range: "443",
				remote_ip: "0.0.0.0/0",
			},
			{
				direction: "egress",
				protocol: null,
				port_range: null,
				remote_ip: "0.0.0.0/0",
			},
		],
		created_at: "2025-01-01",
	},
	{
		id: "sg-web-002",
		name: "web-server",
		description: "Webサーバー用（HTTP/HTTPS許可）",
		rules_count: 3,
		rules: [
			{
				direction: "ingress",
				protocol: "tcp",
				port_range: "80",
				remote_ip: "0.0.0.0/0",
			},
			{
				direction: "ingress",
				protocol: "tcp",
				port_range: "443",
				remote_ip: "0.0.0.0/0",
			},
			{
				direction: "egress",
				protocol: null,
				port_range: null,
				remote_ip: "0.0.0.0/0",
			},
		],
		created_at: "2025-06-15",
	},
	{
		id: "sg-db-003",
		name: "database",
		description: "DB用（内部ネットワークのみ）",
		rules_count: 2,
		rules: [
			{
				direction: "ingress",
				protocol: "tcp",
				port_range: "3306",
				remote_ip: "10.0.0.0/8",
			},
			{
				direction: "egress",
				protocol: null,
				port_range: null,
				remote_ip: "0.0.0.0/0",
			},
		],
		created_at: "2025-08-20",
	},
];
