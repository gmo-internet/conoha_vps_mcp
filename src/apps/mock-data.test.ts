/**
 * MCP Apps モックデータプロバイダーのテスト
 */

import { describe, expect, it } from "vitest";
import {
	getMockImages,
	getMockSecurityGroups,
	getMockServer,
	getMockServerMetrics,
	getMockServers,
	getMockVolumes,
	isMockMode,
} from "./mock-data";

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

describe("getMockServers", () => {
	it("5件のサーバーを返す", () => {
		const servers = getMockServers();
		expect(servers).toHaveLength(5);
	});

	it("各サーバーに必須フィールドが存��する", () => {
		const servers = getMockServers();
		for (const server of servers) {
			expect(server).toHaveProperty("id");
			expect(server).toHaveProperty("name");
			expect(server).toHaveProperty("status");
			expect(server).toHaveProperty("vcpu");
			expect(server).toHaveProperty("memory_gb");
			expect(server).toHaveProperty("disk_gb");
			expect(server).toHaveProperty("plan");
			expect(server).toHaveProperty("os");
			expect(server).toHaveProperty("region");
			expect(server).toHaveProperty("created_at");
		}
	});

	it("ステータスがrunning/stopped/buildingのいずれか", () => {
		const servers = getMockServers();
		const validStatuses = ["running", "stopped", "building"];
		for (const server of servers) {
			expect(validStatuses).toContain(server.status);
		}
	});
});

describe("getMockServer", () => {
	it("存在するIDを指定するとサーバーを返す", () => {
		const server = getMockServer("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
		expect(server).not.toBeNull();
		expect(server?.name).toBe("web-prod-01");
	});

	it("存在しないIDを指定するとnullを返す", () => {
		const server = getMockServer("nonexistent-id");
		expect(server).toBeNull();
	});
});

describe("getMockVolumes", () => {
	it("3��のボリュームを返す", () => {
		const volumes = getMockVolumes();
		expect(volumes).toHaveLength(3);
	});

	it("各ボリュ��ムに必須フィールドが存��する", () => {
		const volumes = getMockVolumes();
		for (const volume of volumes) {
			expect(volume).toHaveProperty("id");
			expect(volume).toHaveProperty("name");
			expect(volume).toHaveProperty("status");
			expect(volume).toHaveProperty("size_gb");
			expect(volume).toHaveProperty("volume_type");
		}
	});
});

describe("getMockImages", () => {
	it("5件のイメージを返す", () => {
		const images = getMockImages();
		expect(images).toHaveLength(5);
	});

	it("os_typeがlinuxまたはwindows", () => {
		const images = getMockImages();
		for (const image of images) {
			expect(["linux", "windows"]).toContain(image.os_type);
		}
	});
});

describe("getMockSecurityGroups", () => {
	it("3件のセキュリティグループを返す", () => {
		const groups = getMockSecurityGroups();
		expect(groups).toHaveLength(3);
	});

	it("各グループにルールが含まれる", () => {
		const groups = getMockSecurityGroups();
		for (const group of groups) {
			expect(group.rules).toBeInstanceOf(Array);
			expect(group.rules.length).toBeGreaterThan(0);
		}
	});
});

describe("getMockServerMetrics", () => {
	it("存在するサーバーIDでメトリクスを返す", () => {
		const metrics = getMockServerMetrics(
			"a1b2c3d4-e5f6-7890-abcd-ef1234567890",
		);
		expect(metrics).not.toBeNull();
		expect(metrics?.cpu_usage_percent).toBeTypeOf("number");
		expect(metrics?.memory_usage_percent).toBeTypeOf("number");
		expect(metrics?.disk_usage_percent).toBeTypeOf("number");
	});

	it("存在しないサー��ーIDでnullを返す", () => {
		const metrics = getMockServerMetrics("nonexistent-id");
		expect(metrics).toBeNull();
	});
});
