import { describe, expect, it } from "vitest";
import {
	CreateSSHKeyPairRequestSchema,
	CreateServerRequestSchema,
	OperateServerRequestSchema,
	RemoteConsoleRequestSchema,
} from "./compute-schema";

describe("Compute Schema Tests", () => {
	describe("CreateServerRequestSchema", () => {
		it("有効なサーバー作成リクエストを検証する", () => {
			const validRequest = {
				server: {
					flavorRef: "flavor-12345",
					adminPass: "TestPass123!",
					block_device_mapping_v2: [
						{
							uuid: "volume-uuid-123",
						},
					],
					metadata: {
						instance_name_tag: "test-server-01",
					},
					security_groups: [
						{
							name: "default",
						},
					],
					key_name: "my-key-pair",
				},
			};

			const result = CreateServerRequestSchema.safeParse(validRequest);
			expect(result.success).toBe(true);
		});

		it("オプションフィールドなしでリクエストを検証する", () => {
			const minimalRequest = {
				server: {
					flavorRef: "flavor-12345",
					adminPass: "MinimalPass123@",
					block_device_mapping_v2: [
						{
							uuid: "volume-uuid-456",
						},
					],
					metadata: {
						instance_name_tag: "minimal-server",
					},
				},
			};

			const result = CreateServerRequestSchema.safeParse(minimalRequest);
			expect(result.success).toBe(true);
		});

		it("複数のblock_device_mapping_v2を許可する", () => {
			const requestWithMultipleDevices = {
				server: {
					flavorRef: "flavor-12345",
					adminPass: "MultiDevice123#",
					block_device_mapping_v2: [
						{
							uuid: "volume-uuid-1",
						},
						{
							uuid: "volume-uuid-2",
						},
						{
							uuid: "volume-uuid-3",
						},
					],
					metadata: {
						instance_name_tag: "multi-device-server",
					},
				},
			};

			const result = CreateServerRequestSchema.safeParse(
				requestWithMultipleDevices,
			);
			expect(result.success).toBe(true);
		});

		it("複数のsecurity_groupsを許可する", () => {
			const requestWithMultipleSecurityGroups = {
				server: {
					flavorRef: "flavor-12345",
					adminPass: "SecurityPass123$",
					block_device_mapping_v2: [
						{
							uuid: "volume-uuid-123",
						},
					],
					metadata: {
						instance_name_tag: "secure-server",
					},
					security_groups: [
						{
							name: "default",
						},
						{
							name: "web-server",
						},
						{
							name: "database",
						},
					],
				},
			};

			const result = CreateServerRequestSchema.safeParse(
				requestWithMultipleSecurityGroups,
			);
			expect(result.success).toBe(true);
		});

		it("有効なadminPassパターンを許可する", () => {
			const validPasswords = [
				"TestPass123!",
				"ComplexP@ssw0rd",
				"MySecure123$",
				"Another1Pass#",
				"ValidPass9&",
				"A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v2W3x4Y5z6A7b8C9d0E1f2G3h4", // 70文字
			];

			for (const password of validPasswords) {
				const request = {
					server: {
						flavorRef: "flavor-12345",
						adminPass: password,
						block_device_mapping_v2: [
							{
								uuid: "volume-uuid-123",
							},
						],
						metadata: {
							instance_name_tag: "test-server",
						},
					},
				};

				const result = CreateServerRequestSchema.safeParse(request);
				expect(result.success).toBe(true);
			}
		});

		it("無効なadminPassパターンを拒否する", () => {
			const invalidPasswords = [
				"short1A!", // 8文字（短すぎ）
				"nouppercase123!", // 大文字なし
				"NOLOWERCASE123!", // 小文字なし
				"NoNumbers!", // 数字なし
				"NoSymbols123", // 記号なし
				"A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v2W3x4Y5z6A7b8C9d0E1f2G3h4I", // 71文字（長すぎ）
				"", // 空文字
				"Test Pass123!", // スペース含む
				"TestPass123あ", // 日本語含む
			];

			for (const password of invalidPasswords) {
				const request = {
					server: {
						flavorRef: "flavor-12345",
						adminPass: password,
						block_device_mapping_v2: [
							{
								uuid: "volume-uuid-123",
							},
						],
						metadata: {
							instance_name_tag: "test-server",
						},
					},
				};

				const result = CreateServerRequestSchema.safeParse(request);
				expect(result.success).toBe(false);
			}
		});

		it("有効なinstance_name_tagパターンを許可する", () => {
			const validNames = [
				"server1",
				"test-server",
				"my_server",
				"Server_123-test",
				"A",
				"a" + "b".repeat(254), // 255文字
			];

			for (const name of validNames) {
				const request = {
					server: {
						flavorRef: "flavor-12345",
						adminPass: "TestPass123!",
						block_device_mapping_v2: [
							{
								uuid: "volume-uuid-123",
							},
						],
						metadata: {
							instance_name_tag: name,
						},
					},
				};

				const result = CreateServerRequestSchema.safeParse(request);
				expect(result.success).toBe(true);
			}
		});

		it("無効なinstance_name_tagパターンを拒否する", () => {
			const invalidNames = [
				"", // 空文字
				" server", // スペースで開始
				"server ", // スペースで終了
				"serv er", // 中間にスペース
				"server@test", // 特殊文字
				"server.test", // ドット
				"サーバー", // 日本語
				"a".repeat(256), // 256文字（長すぎ）
			];

			for (const name of invalidNames) {
				const request = {
					server: {
						flavorRef: "flavor-12345",
						adminPass: "TestPass123!",
						block_device_mapping_v2: [
							{
								uuid: "volume-uuid-123",
							},
						],
						metadata: {
							instance_name_tag: name,
						},
					},
				};

				const result = CreateServerRequestSchema.safeParse(request);
				expect(result.success).toBe(false);
			}
		});

		it("余分なフィールドを拒否する", () => {
			const requestWithExtraFields = {
				server: {
					flavorRef: "flavor-12345",
					adminPass: "TestPass123!",
					block_device_mapping_v2: [
						{
							uuid: "volume-uuid-123",
							extra_field: "not allowed",
						},
					],
					metadata: {
						instance_name_tag: "test-server",
					},
				},
			};

			const result = CreateServerRequestSchema.safeParse(
				requestWithExtraFields,
			);
			expect(result.success).toBe(false);
		});

		it("必須フィールドの欠如を拒否する", () => {
			const incompleteRequests = [
				{
					server: {
						// flavorRef が欠けている
						adminPass: "TestPass123!",
						block_device_mapping_v2: [
							{
								uuid: "volume-uuid-123",
							},
						],
						metadata: {
							instance_name_tag: "test-server",
						},
					},
				},
				{
					server: {
						flavorRef: "flavor-12345",
						// adminPass が欠けている
						block_device_mapping_v2: [
							{
								uuid: "volume-uuid-123",
							},
						],
						metadata: {
							instance_name_tag: "test-server",
						},
					},
				},
			];

			for (const request of incompleteRequests) {
				const result = CreateServerRequestSchema.safeParse(request);
				expect(result.success).toBe(false);
			}
		});
	});

	describe("CreateSSHKeyPairRequestSchema", () => {
		it("有効なSSHキーペア作成リクエストを検証する", () => {
			const validRequest = {
				keypair: {
					name: "my-ssh-key",
					public_key: "ssh-rsa AAAAB3NzaC1yc2EAAAA...",
				},
			};

			const result = CreateSSHKeyPairRequestSchema.safeParse(validRequest);
			expect(result.success).toBe(true);
		});

		it("有効な名前パターンを許可する", () => {
			const validNames = [
				"key1",
				"test-key",
				"my_key",
				"Key_123-test",
				"A",
				"UPPERCASE_KEY",
				"lowercase_key",
				"mixed_Case-Key123",
			];

			for (const name of validNames) {
				const request = {
					keypair: {
						name: name,
						public_key: "ssh-rsa AAAAB3NzaC1yc2EAAAA...",
					},
				};

				const result = CreateSSHKeyPairRequestSchema.safeParse(request);
				expect(result.success).toBe(true);
			}
		});

		it("無効な名前パターンを拒否する", () => {
			const invalidNames = [
				"", // 空文字
				" key", // スペースで開始
				"key ", // スペースで終了
				"k ey", // 中間にスペース
				"key@test", // 特殊文字
				"key.test", // ドット
				"キー", // 日本語
				"key#123", // ハッシュ
				"key$test", // ドル記号
			];

			for (const name of invalidNames) {
				const request = {
					keypair: {
						name: name,
						public_key: "ssh-rsa AAAAB3NzaC1yc2EAAAA...",
					},
				};

				const result = CreateSSHKeyPairRequestSchema.safeParse(request);
				expect(result.success).toBe(false);
			}
		});

		it("余分なフィールドを拒否する", () => {
			const requestWithExtraFields = {
				keypair: {
					name: "test-key",
					public_key: "ssh-rsa AAAAB3NzaC1yc2EAAAA...",
					extra_field: "not allowed",
				},
			};

			const result = CreateSSHKeyPairRequestSchema.safeParse(
				requestWithExtraFields,
			);
			expect(result.success).toBe(false);
		});

		it("必須フィールドの欠如を拒否する", () => {
			const incompleteRequests = [
				{
					keypair: {
						// name が欠けている
						public_key: "ssh-rsa AAAAB3NzaC1yc2EAAAA...",
					},
				},
				{
					keypair: {
						name: "test-key",
						// public_key が欠けている
					},
				},
			];

			for (const request of incompleteRequests) {
				const result = CreateSSHKeyPairRequestSchema.safeParse(request);
				expect(result.success).toBe(false);
			}
		});
	});

	describe("OperateServerRequestSchema", () => {
		it("os-start操作を検証する", () => {
			const startRequest = { "os-start": null };

			const result = OperateServerRequestSchema.safeParse(startRequest);
			expect(result.success).toBe(true);
		});

		it("os-stop操作（通常）を検証する", () => {
			const stopRequest = { "os-stop": null };

			const result = OperateServerRequestSchema.safeParse(stopRequest);
			expect(result.success).toBe(true);
		});

		it("os-stop操作（強制シャットダウン）を検証する", () => {
			const forceStopRequests = [
				{ "os-stop": { force_shutdown: true } },
				{ "os-stop": { force_shutdown: false } },
			];

			for (const request of forceStopRequests) {
				const result = OperateServerRequestSchema.safeParse(request);
				expect(result.success).toBe(true);
			}
		});

		it("reboot操作を検証する", () => {
			const rebootRequests = [
				{ reboot: { type: "SOFT" } },
				{ reboot: { type: "HARD" } },
			];

			for (const request of rebootRequests) {
				const result = OperateServerRequestSchema.safeParse(request);
				expect(result.success).toBe(true);
			}
		});

		it("resize操作を検証する", () => {
			const resizeRequest = { resize: { flavorRef: "new-flavor-123" } };

			const result = OperateServerRequestSchema.safeParse(resizeRequest);
			expect(result.success).toBe(true);
		});

		it("confirmResize操作を検証する", () => {
			const confirmResizeRequest = { confirmResize: null };

			const result = OperateServerRequestSchema.safeParse(confirmResizeRequest);
			expect(result.success).toBe(true);
		});

		it("revertResize操作を検証する", () => {
			const revertResizeRequest = { revertResize: null };

			const result = OperateServerRequestSchema.safeParse(revertResizeRequest);
			expect(result.success).toBe(true);
		});

		it("無効なrebootタイプを拒否する", () => {
			const invalidRebootRequest = { reboot: { type: "INVALID" } };

			const result = OperateServerRequestSchema.safeParse(invalidRebootRequest);
			expect(result.success).toBe(false);
		});

		it("無効な操作を拒否する", () => {
			const invalidRequests = [
				{ "invalid-operation": null },
				{ "os-start": "not null" },
				{ resize: { invalidField: "value" } },
				{},
			];

			for (const request of invalidRequests) {
				const result = OperateServerRequestSchema.safeParse(request);
				expect(result.success).toBe(false);
			}
		});

		it("余分なフィールドを拒否する", () => {
			const requestWithExtraFields = {
				"os-start": null,
				extra_field: "not allowed",
			};

			const result = OperateServerRequestSchema.safeParse(
				requestWithExtraFields,
			);
			expect(result.success).toBe(false);
		});
	});

	describe("RemoteConsoleRequestSchema", () => {
		it("有効なリモートコンソールリクエストを検証する", () => {
			const validRequests = [
				{
					remote_console: {
						protocol: "vnc",
						type: "novnc",
					},
				},
				{
					remote_console: {
						protocol: "serial",
						type: "serial",
					},
				},
				{
					remote_console: {
						protocol: "web",
						type: "novnc",
					},
				},
			];

			for (const request of validRequests) {
				const result = RemoteConsoleRequestSchema.safeParse(request);
				expect(result.success).toBe(true);
			}
		});

		it("無効なprotocolを拒否する", () => {
			const invalidRequest = {
				remote_console: {
					protocol: "invalid",
					type: "novnc",
				},
			};

			const result = RemoteConsoleRequestSchema.safeParse(invalidRequest);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"protocol は 'vnc', 'serial', 'web' のいずれかを指定してください",
				);
			}
		});

		it("無効なtypeを拒否する", () => {
			const invalidRequest = {
				remote_console: {
					protocol: "vnc",
					type: "invalid",
				},
			};

			const result = RemoteConsoleRequestSchema.safeParse(invalidRequest);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"type は 'novnc' または 'serial' を指定してください",
				);
			}
		});

		it("余分なフィールドを拒否する", () => {
			const requestWithExtraFields = {
				remote_console: {
					protocol: "vnc",
					type: "novnc",
					extra_field: "not allowed",
				},
			};

			const result = RemoteConsoleRequestSchema.safeParse(
				requestWithExtraFields,
			);
			expect(result.success).toBe(false);
		});

		it("必須フィールドの欠如を拒否する", () => {
			const incompleteRequests = [
				{
					remote_console: {
						// protocol が欠けている
						type: "novnc",
					},
				},
				{
					remote_console: {
						protocol: "vnc",
						// type が欠けている
					},
				},
			];

			for (const request of incompleteRequests) {
				const result = RemoteConsoleRequestSchema.safeParse(request);
				expect(result.success).toBe(false);
			}
		});
	});
});
