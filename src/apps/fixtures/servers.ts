/**
 * モックサーバー一覧フィクスチャ
 *
 * @remarks
 * 型注釈で AppServer[] を直接表明することで、import 側での as cast を不要にする。
 *
 * @packageDocumentation
 */

import type { AppServer } from "../apps-types.js";

export const servers: AppServer[] = [
	{
		id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
		name: "web-prod-01",
		status: "running",
		vcpu: 4,
		memory_gb: 8,
		disk_gb: 100,
		plan: "V4H-8G",
		os: "Ubuntu 24.04",
		ipv4: "150.95.183.12",
		ipv6: "2400:8500:1302:810::1",
		region: "tyo3",
		created_at: "2026-01-10",
	},
	{
		id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
		name: "api-staging-01",
		status: "running",
		vcpu: 2,
		memory_gb: 4,
		disk_gb: 50,
		plan: "V2H-4G",
		os: "AlmaLinux 9.4",
		ipv4: "150.95.183.45",
		ipv6: "2400:8500:1302:810::2",
		region: "tyo3",
		created_at: "2026-02-05",
	},
	{
		id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
		name: "db-master-01",
		status: "running",
		vcpu: 8,
		memory_gb: 16,
		disk_gb: 200,
		plan: "V8H-16G",
		os: "Ubuntu 22.04",
		ipv4: "150.95.183.78",
		ipv6: "2400:8500:1302:810::3",
		region: "tyo3",
		created_at: "2025-11-20",
	},
	{
		id: "d4e5f6a7-b8c9-0123-defa-234567890123",
		name: "batch-worker-02",
		status: "stopped",
		vcpu: 2,
		memory_gb: 2,
		disk_gb: 50,
		plan: "V2H-2G",
		os: "Ubuntu 24.04",
		ipv4: "150.95.184.10",
		ipv6: "2400:8500:1302:810::4",
		region: "tyo3",
		created_at: "2026-03-01",
	},
	{
		id: "e5f6a7b8-c9d0-1234-efab-345678901234",
		name: "ml-experiment-03",
		status: "building",
		vcpu: 4,
		memory_gb: 8,
		disk_gb: 100,
		plan: "V4H-8G",
		os: "Ubuntu 24.04",
		ipv4: null,
		ipv6: null,
		region: "tyo3",
		created_at: "2026-04-21",
	},
];
