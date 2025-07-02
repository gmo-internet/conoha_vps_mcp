import { describe, expect, it } from "vitest";
import {
	CreateServerRequestSchema,
	CreateSSHKeyPairRequestSchema,
	OperateServerRequestSchema,
	RemoteConsoleRequestSchema,
} from "./compute-schema";

describe("Compute Schema Tests", () => {
	describe("CreateServerRequestSchema", () => {
		it("CreateServerRequestSchemaが完全なサーバー作成リクエストデータ（flavorRef、adminPass、block_device_mapping_v2、metadata、security_groups、key_name）を受け取った場合に、すべての必須フィールドとオプションフィールドが正しく検証され、safeParse結果のsuccessがtrueになること", () => {
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

		it("CreateServerRequestSchemaが必須フィールドのみのサーバー作成リクエストデータ（flavorRef、adminPass、block_device_mapping_v2、metadata）を受け取った場合に、オプションフィールドなしでも正しく検証され、safeParse結果のsuccessがtrueになること", () => {
			const minimalRequest = {
				server: {
					flavorRef: "flavor-12345",
					adminPass: "MinimalPass123@",
					block_device_mapping_v2: [
						{
							uuid: "volume-uuid-456",
						},
					],
					metadata: {},
				},
			};

			const result = CreateServerRequestSchema.safeParse(minimalRequest);
			expect(result.success).toBe(true);
		});

		it("CreateServerRequestSchemaが複数のblock_device_mapping_v2エントリを含むサーバー作成リクエストデータを受け取った場合に、配列内の複数のボリュームマッピングが正しく検証され、safeParse結果のsuccessがtrueになること", () => {
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

		it("CreateServerRequestSchemaが複数のsecurity_groupsエントリを含むサーバー作成リクエストデータを受け取った場合に、セキュリティグループ配列内の複数のグループ名が正しく検証され、safeParse結果のsuccessがtrueになること", () => {
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

		it("CreateServerRequestSchemaが有効なadminPassパターン（大文字、小文字、数字、記号を含む9-70文字）を含むサーバー作成リクエストデータを受け取った場合に、adminPassの正規表現検証が成功し、safeParse結果のsuccessがtrueになること", () => {
			const validPasswords = [
				"TestPass123!",
				"ComplexP@ssw0rd",
				"MySecure123$",
				"Another1Pass#",
				"ValidPass9&",
				"A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v2W3x4Y5z6A7b8C9d0E1f2G3h4!@", // 70文字
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

		it("CreateServerRequestSchemaが無効なadminPassパターン（長さ不足、文字種不足、禁止文字を含む）を含むサーバー作成リクエストデータを受け取った場合に、adminPassの正規表現検証が失敗し、safeParse結果のsuccessがfalseになること", () => {
			const invalidPasswords = [
				"short1A!", // 8文字（短すぎ）
				"nouppercase123!", // 大文字なし
				"NOLOWERCASE123!", // 小文字なし
				"NoNumbers!", // 数字なし
				"NoSymbols123", // 記号なし
				"A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v2W3x4Y5z6A7b8C9d0E1f2G3h4I!@", // 71文字（長すぎ）
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

		it("CreateServerRequestSchemaが有効なinstance_name_tagパターン（1-255文字の英数字、アンダースコア、ハイフン）を含むmetadataを持つサーバー作成リクエストデータを受け取った場合に、instance_name_tagの正規表現検証が成功し、safeParse結果のsuccessがtrueになること", () => {
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

		it("CreateServerRequestSchemaが無効なinstance_name_tagパターン（空文字、スペース、特殊文字、256文字以上）を含むmetadataを持つサーバー作成リクエストデータを受け取った場合に、instance_name_tagの正規表現検証が失敗し、safeParse結果のsuccessがfalseになること", () => {
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

		it("CreateServerRequestSchemaがスキーマで定義されていない余分なフィールドを含むサーバー作成リクエストデータを受け取った場合に、厳密なスキーマ検証により余分なフィールドが拒否され、safeParse結果のsuccessがfalseになること", () => {
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

		it("CreateServerRequestSchemaが必須フィールド（flavorRef、adminPass、block_device_mapping_v2、metadata）のいずれかが欠落したサーバー作成リクエストデータを受け取った場合に、必須フィールド検証が失敗し、safeParse結果のsuccessがfalseになること", () => {
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
		it("CreateSSHKeyPairRequestSchemaが有効なSSHキーペア作成リクエストデータ（name、public_key）を受け取った場合に、必須フィールドが正しく検証され、safeParse結果のsuccessがtrueになること", () => {
			const validRequest = {
				keypair: {
					name: "my-ssh-key",
					public_key: "ssh-rsa AAAAB3NzaC1yc2EAAAA...",
				},
			};

			const result = CreateSSHKeyPairRequestSchema.safeParse(validRequest);
			expect(result.success).toBe(true);
		});

		it("CreateSSHKeyPairRequestSchemaが有効なnameパターン（英数字、アンダースコア、ハイフン）を含むSSHキーペア作成リクエストデータを受け取った場合に、nameの正規表現検証が成功し、safeParse結果のsuccessがtrueになること", () => {
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

		it("CreateSSHKeyPairRequestSchemaが無効なnameパターン（空文字、スペース、特殊文字）を含むSSHキーペア作成リクエストデータを受け取った場合に、nameの正規表現検証が失敗し、safeParse結果のsuccessがfalseになること", () => {
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

		it("CreateSSHKeyPairRequestSchemaがスキーマで定義されていない余分なフィールドを含むSSHキーペア作成リクエストデータを受け取った場合に、厳密なスキーマ検証により余分なフィールドが拒否され、safeParse結果のsuccessがfalseになること", () => {
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

		it("CreateSSHKeyPairRequestSchemaが必須フィールド（name、public_key）のいずれかが欠落したSSHキーペア作成リクエストデータを受け取った場合に、必須フィールド検証が失敗し、safeParse結果のsuccessがfalseになること", () => {
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
		it("OperateServerRequestSchemaがサーバー開始操作リクエストデータ（os-start: null）を受け取った場合に、サーバー開始操作の型検証が成功し、safeParse結果のsuccessがtrueになること", () => {
			const startRequest = { "os-start": null };

			const result = OperateServerRequestSchema.safeParse(startRequest);
			expect(result.success).toBe(true);
		});

		it("OperateServerRequestSchemaが通常のサーバー停止操作リクエストデータ（os-stop: null）を受け取った場合に、サーバー停止操作の型検証が成功し、safeParse結果のsuccessがtrueになること", () => {
			const stopRequest = { "os-stop": null };

			const result = OperateServerRequestSchema.safeParse(stopRequest);
			expect(result.success).toBe(true);
		});

		it("OperateServerRequestSchemaが強制シャットダウンオプション付きサーバー停止操作リクエストデータ（os-stop: {force_shutdown: true/false}）を受け取った場合に、force_shutdownブール値検証が成功し、safeParse結果のsuccessがtrueになること", () => {
			const forceStopRequests = [
				{ "os-stop": { force_shutdown: true } },
				{ "os-stop": { force_shutdown: false } },
			];

			for (const request of forceStopRequests) {
				const result = OperateServerRequestSchema.safeParse(request);
				expect(result.success).toBe(true);
			}
		});

		it("OperateServerRequestSchemaがサーバー再起動操作リクエストデータ（reboot: {type: 'SOFT' | 'HARD'}）を受け取った場合に、再起動タイプの列挙値検証が成功し、safeParse結果のsuccessがtrueになること", () => {
			const rebootRequests = [
				{ reboot: { type: "SOFT" } },
				{ reboot: { type: "HARD" } },
			];

			for (const request of rebootRequests) {
				const result = OperateServerRequestSchema.safeParse(request);
				expect(result.success).toBe(true);
			}
		});

		it("OperateServerRequestSchemaがサーバーリサイズ操作リクエストデータ（resize: {flavorRef: string}）を受け取った場合に、フレーバー参照の文字列検証が成功し、safeParse結果のsuccessがtrueになること", () => {
			const resizeRequest = { resize: { flavorRef: "new-flavor-123" } };

			const result = OperateServerRequestSchema.safeParse(resizeRequest);
			expect(result.success).toBe(true);
		});

		it("OperateServerRequestSchemaがリサイズ確認操作リクエストデータ（confirmResize: null）を受け取った場合に、リサイズ確認操作の型検証が成功し、safeParse結果のsuccessがtrueになること", () => {
			const confirmResizeRequest = { confirmResize: null };

			const result = OperateServerRequestSchema.safeParse(confirmResizeRequest);
			expect(result.success).toBe(true);
		});

		it("OperateServerRequestSchemaがリサイズ取り消し操作リクエストデータ（revertResize: null）を受け取った場合に、リサイズ取り消し操作の型検証が成功し、safeParse結果のsuccessがtrueになること", () => {
			const revertResizeRequest = { revertResize: null };

			const result = OperateServerRequestSchema.safeParse(revertResizeRequest);
			expect(result.success).toBe(true);
		});

		it("OperateServerRequestSchemaが無効な再起動タイプ（INVALID）を含むリクエストデータを受け取った場合に、再起動タイプの列挙値検証が失敗し、safeParse結果のsuccessがfalseになること", () => {
			const invalidRebootRequest = { reboot: { type: "INVALID" } };

			const result = OperateServerRequestSchema.safeParse(invalidRebootRequest);
			expect(result.success).toBe(false);
		});

		it("OperateServerRequestSchemaが無効な操作（未定義の操作名、不正な型、空オブジェクト）を含むリクエストデータを受け取った場合に、操作種別の検証が失敗し、safeParse結果のsuccessがfalseになること", () => {
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

		it("OperateServerRequestSchemaがスキーマで定義されていない余分なフィールドを含むサーバー操作リクエストデータを受け取った場合に、厳密なスキーマ検証により余分なフィールドが拒否され、safeParse結果のsuccessがfalseになること", () => {
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
		it("RemoteConsoleRequestSchemaが有効なリモートコンソールリクエストデータ（protocol: 'vnc'|'serial'|'web', type: 'novnc'|'serial'）を受け取った場合に、プロトコルとタイプの列挙値検証が成功し、safeParse結果のsuccessがtrueになること", () => {
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

		it("RemoteConsoleRequestSchemaが無効なprotocol値（invalid）を含むリモートコンソールリクエストデータを受け取った場合に、protocolの列挙値検証が失敗し、safeParse結果のsuccessがfalseかつ特定のエラーメッセージ（'protocol は vnc、serial、web のいずれかを指定してください'）が出力されること", () => {
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

		it("RemoteConsoleRequestSchemaが無効なtype値（invalid）を含むリモートコンソールリクエストデータを受け取った場合に、typeの列挙値検証が失敗し、safeParse結果のsuccessがfalseかつ特定のエラーメッセージ（'type は novnc または serial を指定してください'）が出力されること", () => {
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

		it("RemoteConsoleRequestSchemaがスキーマで定義されていない余分なフィールドを含むリモートコンソールリクエストデータを受け取った場合に、スキーマ検証により余分なフィールドが拒否され、safeParse結果のsuccessがfalseになること", () => {
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

		it("RemoteConsoleRequestSchemaが必須フィールド（protocol、type）のいずれかが欠落したリモートコンソールリクエストデータを受け取った場合に、必須フィールド検証が失敗し、safeParse結果のsuccessがfalseになること", () => {
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
