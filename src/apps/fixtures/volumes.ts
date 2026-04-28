/**
 * モックボリューム一覧フィクスチャ
 *
 * @packageDocumentation
 */

import type { AppVolume } from "../apps-types.js";

export const volumes: AppVolume[] = [
	{
		id: "vol-a1b2c3d4-0001",
		name: "web-prod-01-root",
		status: "in-use",
		size_gb: 100,
		volume_type: "SSD",
		attached_to: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
		attached_server_name: "web-prod-01",
		created_at: "2026-01-10",
	},
	{
		id: "vol-b2c3d4e5-0002",
		name: "db-master-01-data",
		status: "in-use",
		size_gb: 500,
		volume_type: "SSD",
		attached_to: "c3d4e5f6-a7b8-9012-cdef-123456789012",
		attached_server_name: "db-master-01",
		created_at: "2025-11-20",
	},
	{
		id: "vol-c3d4e5f6-0003",
		name: "backup-storage-01",
		status: "available",
		size_gb: 200,
		volume_type: "SSD",
		attached_to: null,
		attached_server_name: null,
		created_at: "2026-02-15",
	},
];
