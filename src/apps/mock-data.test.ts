/**
 * MCP Apps モックデータプロバイダーのテスト
 */

import { describe, expect, it } from "vitest";
import { getMockContainers, getMockObjects, isMockMode } from "./mock-data";

describe("isMockMode", () => {
	it("CONOHA_MCP_MOCK=1 の場合trueを返す", () => {
		process.env.CONOHA_MCP_MOCK = "1";
		expect(isMockMode()).toBe(true);
	});

	it("CONOHA_MCP_MOCK未設定の場合falseを返す", () => {
		delete process.env.CONOHA_MCP_MOCK;
		expect(isMockMode()).toBe(false);
	});

	it("CONOHA_MCP_MOCK=0 の場合falseを返す", () => {
		process.env.CONOHA_MCP_MOCK = "0";
		expect(isMockMode()).toBe(false);
	});
});

describe("getMockContainers", () => {
	it("3件のコンテナを返す", () => {
		const containers = getMockContainers();
		expect(containers).toHaveLength(3);
	});

	it("各コンテナに必須フィールドが存在する", () => {
		const containers = getMockContainers();
		for (const c of containers) {
			expect(c).toHaveProperty("name");
			expect(c).toHaveProperty("count");
			expect(c).toHaveProperty("bytes");
		}
	});

	it("各コンテナの count と bytes は数値型である", () => {
		const containers = getMockContainers();
		for (const c of containers) {
			expect(typeof c.count).toBe("number");
			expect(typeof c.bytes).toBe("number");
			expect(c.count).toBeGreaterThanOrEqual(0);
			expect(c.bytes).toBeGreaterThanOrEqual(0);
		}
	});
});

describe("getMockObjects", () => {
	it("既知のコンテナに対してオブジェクト配列を返す", () => {
		const objects = getMockObjects("backups");
		expect(Array.isArray(objects)).toBe(true);
		expect(objects.length).toBeGreaterThan(0);
	});

	it("存在しないコンテナでは空配列を返す", () => {
		const objects = getMockObjects("nonexistent-container");
		expect(objects).toEqual([]);
	});

	it("各オブジェクトに必須フィールドが存在する", () => {
		const objects = getMockObjects("media-assets");
		for (const o of objects) {
			expect(o).toHaveProperty("name");
			expect(o).toHaveProperty("bytes");
			expect(o).toHaveProperty("content_type");
		}
	});
});
