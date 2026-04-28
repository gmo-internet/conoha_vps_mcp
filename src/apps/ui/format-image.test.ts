/**
 * MCP Apps UI 表示整形ユーティリティのテスト
 */

import { describe, expect, it } from "vitest";
import {
	bootVolumeSizeGb,
	flavorOsType,
	formatImageDisplay,
	isImageCompatibleWithFlavor,
	isPublicApiFlavor,
} from "./format-image";

describe("flavorOsType", () => {
	it("g2l-t-* のフレーバー名はLinuxプランと判定する", () => {
		expect(flavorOsType("g2l-t-c2m1")).toBe("linux");
		expect(flavorOsType("g2l-t-c4m16g1-l4")).toBe("linux");
		expect(flavorOsType("g2l-t-c88m912g4-h100")).toBe("linux");
	});

	it("g2w-t-* のフレーバー名はWindowsプランと判定する", () => {
		expect(flavorOsType("g2w-t-c2m1")).toBe("windows");
		expect(flavorOsType("g2w-t-c24m64")).toBe("windows");
	});

	it("g2l-t-*-kusanagi は専用プラン扱いでnullを返す", () => {
		expect(flavorOsType("g2l-t-c2m4-kusanagi")).toBeNull();
		expect(flavorOsType("g2l-t-c64m128-kusanagi")).toBeNull();
	});

	it("長期プラン (g2l-p-*, g2w-p-*) は公開API利用不可でnullを返す", () => {
		expect(flavorOsType("g2l-p-c2m1")).toBeNull();
		expect(flavorOsType("g2w-p-c4m4")).toBeNull();
	});

	it("DBaaS専用プラン (g2d-t-*) はnullを返す", () => {
		expect(flavorOsType("g2d-t-c2m4d60")).toBeNull();
		expect(flavorOsType("g2d-t-c16m64d1000")).toBeNull();
	});

	it("未知の命名規約のフレーバー名はnullを返す", () => {
		expect(flavorOsType("unknown-flavor")).toBeNull();
		expect(flavorOsType("")).toBeNull();
	});
});

describe("isPublicApiFlavor", () => {
	it("Linux/Windowsの-t-プランはtrueを返す", () => {
		expect(isPublicApiFlavor("g2l-t-c2m1")).toBe(true);
		expect(isPublicApiFlavor("g2w-t-c4m4")).toBe(true);
	});

	it("kusanagi/長期/DBaaSはfalseを返す", () => {
		expect(isPublicApiFlavor("g2l-t-c2m4-kusanagi")).toBe(false);
		expect(isPublicApiFlavor("g2l-p-c2m1")).toBe(false);
		expect(isPublicApiFlavor("g2d-t-c2m4d60")).toBe(false);
	});
});

describe("bootVolumeSizeGb", () => {
	it("RAM 512MB以下のフレーバーは30GBを返す", () => {
		expect(bootVolumeSizeGb(512)).toBe(30);
		expect(bootVolumeSizeGb(256)).toBe(30);
	});

	it("RAM 512MB超のフレーバーは100GBを返す", () => {
		expect(bootVolumeSizeGb(1024)).toBe(100);
		expect(bootVolumeSizeGb(16384)).toBe(100);
	});
});

describe("formatImageDisplay", () => {
	it("dst_name と dst_version からOSラベルを組み立てる", () => {
		const result = formatImageDisplay({
			id: "img-1",
			name: "vmi-ubuntu-24.04-amd64",
			dst_name: "Ubuntu",
			dst_version: "24.04",
		});
		expect(result.primary).toBe("Ubuntu 24.04");
		expect(result.secondary).toBe("vmi-ubuntu-24.04-amd64");
	});

	it("app_name 優先で OS は括弧書きにフォールバックする", () => {
		const result = formatImageDisplay({
			id: "img-2",
			name: "vmi-rails-8.1.0-ubuntu-24.04-amd64",
			dst_name: "Ubuntu",
			dst_version: "24.04",
			app_name: "Ruby_on_Rails",
			app_version: "8.1.0",
		});
		expect(result.primary).toBe("Ruby on Rails 8.1.0（Ubuntu 24.04）");
	});

	it("アンダースコアはhumanizeで空白に変換する", () => {
		const result = formatImageDisplay({
			id: "img-3",
			name: "vmi-win2022dce-rdsoffice2021",
			dst_name: "Windows_Server_Remote_Desktop_+_Office_Professional_Plus",
			dst_version: "2022",
		});
		expect(result.primary).toBe(
			"Windows Server Remote Desktop + Office Professional Plus 2022",
		);
	});

	it("メタデータ未設定時は API 名をそのまま primary に使う", () => {
		const result = formatImageDisplay({
			id: "img-4",
			name: "vmi-custom-snapshot",
		});
		expect(result.primary).toBe("vmi-custom-snapshot");
	});

	it("ツールチップに OS種別/用途/最小要件/サイズ/作成日を含める", () => {
		const result = formatImageDisplay({
			id: "img-5",
			name: "vmi-ubuntu-24.04-amd64",
			os_type: "linux",
			service_type: "vps",
			min_ram_mb: 1024,
			min_disk_gb: 30,
			size_mb: 3500,
			created_at: "2026-01-15T10:00:00Z",
		});
		expect(result.tooltip).toContain("OS種別: Linux");
		expect(result.tooltip).toContain("用途: VPS");
		expect(result.tooltip).toContain("最小RAM: 1024MB");
		expect(result.tooltip).toContain("最小ディスク: 30GB");
		expect(result.tooltip).toContain("3.4GB");
		expect(result.tooltip).toContain("2026-01-15");
	});

	it("Windows イメージはツールチップに Windows と表示する", () => {
		const result = formatImageDisplay({
			id: "img-6",
			name: "vmi-win-2025dce-amd64",
			os_type: "windows",
		});
		expect(result.tooltip).toContain("OS種別: Windows");
	});

	it("空フィールドはツールチップに含めない", () => {
		const result = formatImageDisplay({
			id: "img-7",
			name: "vmi-x",
			min_ram_mb: 0,
			min_disk_gb: 0,
		});
		expect(result.tooltip).not.toContain("最小RAM");
		expect(result.tooltip).not.toContain("最小ディスク");
	});
});

describe("isImageCompatibleWithFlavor", () => {
	it("OS種別とRAM下限・disk下限が満たされていれば互換と判定する", () => {
		const ok = isImageCompatibleWithFlavor(
			{ os_type: "linux", min_ram_mb: 1024, min_disk_gb: 30 },
			{ name: "g2l-t-c2m1", ram_mb: 1024 },
		);
		expect(ok).toBe(true);
	});

	it("イメージのOS種別がフレーバーのOS種別と一致しない場合は非互換", () => {
		const ok = isImageCompatibleWithFlavor(
			{ os_type: "windows", min_ram_mb: 1024 },
			{ name: "g2l-t-c2m1", ram_mb: 1024 },
		);
		expect(ok).toBe(false);
	});

	it("イメージの最小RAM要件がフレーバーのRAMを超える場合は非互換", () => {
		const ok = isImageCompatibleWithFlavor(
			{ os_type: "linux", min_ram_mb: 2048 },
			{ name: "g2l-t-c1m512", ram_mb: 512 },
		);
		expect(ok).toBe(false);
	});

	it("イメージの最小ディスク要件がブートボリュームサイズを超える場合は非互換", () => {
		// 512MBプランは30GBブートボリューム固定なので、min_disk_gb=100 のイメージは作成不可
		const ok = isImageCompatibleWithFlavor(
			{ os_type: "linux", min_disk_gb: 100 },
			{ name: "g2l-t-c1m512", ram_mb: 512 },
		);
		expect(ok).toBe(false);
	});

	it("min_disk_gb=100 のイメージは100GBプラン以上で互換になる", () => {
		const ok = isImageCompatibleWithFlavor(
			{ os_type: "linux", min_disk_gb: 100 },
			{ name: "g2l-t-c2m1", ram_mb: 1024 },
		);
		expect(ok).toBe(true);
	});

	it("公開API利用不可フレーバー（kusanagi/長期/DBaaS）は常に非互換", () => {
		expect(
			isImageCompatibleWithFlavor(
				{ os_type: "linux" },
				{ name: "g2l-t-c2m4-kusanagi", ram_mb: 4096 },
			),
		).toBe(false);
		expect(
			isImageCompatibleWithFlavor(
				{ os_type: "linux" },
				{ name: "g2l-p-c2m1", ram_mb: 1024 },
			),
		).toBe(false);
		expect(
			isImageCompatibleWithFlavor(
				{ os_type: "linux" },
				{ name: "g2d-t-c2m4d60", ram_mb: 4096 },
			),
		).toBe(false);
	});

	it("イメージのos_type未設定時はOS判定をスキップしてRAM/diskのみで判定する", () => {
		const ok = isImageCompatibleWithFlavor(
			{ min_ram_mb: 512, min_disk_gb: 30 },
			{ name: "g2l-t-c1m512", ram_mb: 512 },
		);
		expect(ok).toBe(true);
	});
});
