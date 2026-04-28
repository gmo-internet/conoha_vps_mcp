/**
 * モックイメージ一覧フィクスチャ
 *
 * @packageDocumentation
 */

import type { AppImage } from "../apps-types.js";

export const images: AppImage[] = [
	{
		id: "img-ubuntu-2404",
		name: "vmi-ubuntu-24.04-amd64",
		status: "active",
		os_type: "linux",
		min_disk_gb: 30,
		min_ram_mb: 512,
		size_mb: 1024,
		created_at: "2024-04-25",
		dst_name: "Ubuntu",
		dst_version: "24.04",
		service_type: "vps",
	},
	{
		id: "img-ubuntu-2204",
		name: "vmi-ubuntu-22.04-amd64",
		status: "active",
		os_type: "linux",
		min_disk_gb: 30,
		min_ram_mb: 512,
		size_mb: 980,
		created_at: "2022-04-22",
	},
	{
		id: "img-alma-94",
		name: "vmi-almalinux-9.4-amd64",
		status: "active",
		os_type: "linux",
		min_disk_gb: 30,
		min_ram_mb: 512,
		size_mb: 1100,
		created_at: "2024-05-10",
	},
	{
		id: "img-rocky-94",
		name: "vmi-rocky-9.4-amd64",
		status: "active",
		os_type: "linux",
		min_disk_gb: 30,
		min_ram_mb: 512,
		size_mb: 1050,
		created_at: "2024-06-01",
	},
	{
		id: "img-windows-2022",
		name: "vmi-windows-server-2022",
		status: "active",
		os_type: "windows",
		min_disk_gb: 100,
		min_ram_mb: 2048,
		size_mb: 8192,
		created_at: "2023-10-15",
	},
];
