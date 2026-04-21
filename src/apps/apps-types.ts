/**
 * MCP Apps 型定義
 *
 * @remarks
 * MCP Appsツールのレスポンス型を定義します。
 *
 * @packageDocumentation
 */

/**
 * サーバー情報
 */
export interface AppServer {
	id: string;
	name: string;
	status: "running" | "stopped" | "building";
	vcpu: number;
	memory_gb: number;
	disk_gb: number;
	plan: string;
	os: string;
	ipv4: string | null;
	ipv6: string | null;
	region: string;
	created_at: string;
}

/**
 * ボリューム情報
 */
export interface AppVolume {
	id: string;
	name: string;
	status: "in-use" | "available" | "creating" | "deleting";
	size_gb: number;
	volume_type: string;
	attached_to: string | null;
	attached_server_name: string | null;
	created_at: string;
}

/**
 * イメージ情報
 */
export interface AppImage {
	id: string;
	name: string;
	status: "active" | "queued" | "saving";
	os_type: "linux" | "windows";
	min_disk_gb: number;
	size_mb: number;
	created_at: string;
}

/**
 * セキュリティグループルール
 */
export interface SecurityGroupRule {
	direction: "ingress" | "egress";
	protocol: string | null;
	port_range: string | null;
	remote_ip: string;
}

/**
 * セキュリティグループ情報
 */
export interface AppSecurityGroup {
	id: string;
	name: string;
	description: string;
	rules_count: number;
	rules: SecurityGroupRule[];
	created_at: string;
}

/**
 * サーバーメトリクス
 */
export interface AppServerMetrics {
	server_id: string;
	server_name: string;
	cpu_usage_percent: number;
	memory_usage_percent: number;
	disk_usage_percent: number;
	network_in_mbps: number;
	network_out_mbps: number;
	timestamp: string;
}
