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
	min_ram_mb: number;
	size_mb: number;
	created_at: string;
	/** OSディストリビューション名（例: "Ubuntu", "AlmaLinux", "Windows_Server"） */
	dst_name?: string;
	/** OSディストリビューションバージョン（例: "24.04", "9.6", "2022"） */
	dst_version?: string;
	/** バンドルアプリ名（例: "Ruby_on_Rails", "WordPress(KUSANAGI)"） */
	app_name?: string;
	/** バンドルアプリバージョン（例: "8.1.0", "9.4.2-CentOS-Stream9"） */
	app_version?: string;
	/** 用途種別（例: "vps", "gpu"） */
	service_type?: string;
}

/**
 * ストレージコンテナ情報
 */
export interface AppContainer {
	/** コンテナ名 */
	name: string;
	/** 含まれるオブジェクト数 */
	count: number;
	/** 合計サイズ（バイト） */
	bytes: number;
	/** 最終更新日時（ISO 8601） */
	last_modified?: string;
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
