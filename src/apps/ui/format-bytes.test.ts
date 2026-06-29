/**
 * バイト整形ユーティリティのテスト
 */

import { describe, expect, it } from "vitest";
import { formatBytes } from "./format-bytes";

describe("formatBytes", () => {
	it("0 バイトは '0 B' を返す", () => {
		expect(formatBytes(0)).toBe("0 B");
	});

	it("1024 未満はバイト単位で整数表示する", () => {
		expect(formatBytes(1)).toBe("1 B");
		expect(formatBytes(512)).toBe("512 B");
		expect(formatBytes(1023)).toBe("1023 B");
	});

	it("1024 以上は KB に繰り上げる", () => {
		expect(formatBytes(1024)).toBe("1.0 KB");
		expect(formatBytes(2048)).toBe("2.0 KB");
		expect(formatBytes(99 * 1024)).toBe("99.0 KB");
		// 100 KB 以上は整数桁
		expect(formatBytes(100 * 1024)).toBe("100 KB");
	});

	it("1MB 以上は MB に繰り上げる", () => {
		expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
		expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
	});

	it("1GB 以上は GB に繰り上げる", () => {
		expect(formatBytes(1024 ** 3)).toBe("1.0 GB");
		expect(formatBytes(4_823_756_902)).toBe("4.5 GB");
	});

	it("1TB 以上は TB に繰り上げる", () => {
		expect(formatBytes(1024 ** 4)).toBe("1.0 TB");
		expect(formatBytes(2 * 1024 ** 4)).toBe("2.0 TB");
	});

	it("100 以上の値は小数を切り捨てて整数表示する", () => {
		expect(formatBytes(100 * 1024 ** 3)).toBe("100 GB");
		expect(formatBytes(150 * 1024 ** 3)).toBe("150 GB");
	});

	it("負の値は '0 B' にフォールバックする", () => {
		expect(formatBytes(-1)).toBe("0 B");
		expect(formatBytes(-1024)).toBe("0 B");
	});

	it("NaN や Infinity は '0 B' にフォールバックする", () => {
		expect(formatBytes(Number.NaN)).toBe("0 B");
		expect(formatBytes(Number.POSITIVE_INFINITY)).toBe("0 B");
	});
});
