import { describe, expect, it } from "vitest";
import {
	CreateSecurityGroupRequestSchema,
	CreateSecurityGroupRuleRequestSchema,
	UpdatePortRequestSchema,
	UpdateSecurityGroupRequestSchema,
} from "./network-schema";

describe("Network Schema Tests", () => {
	describe("CreateSecurityGroupRuleRequestSchema", () => {
		it("CreateSecurityGroupRuleRequestSchemaが完全なセキュリティグループルール作成リクエストデータ（security_group_id、direction、ethertype、port_range_min、port_range_max、protocol、remote_ip_prefix、remote_group_id）を受け取った場合に、すべての必須フィールドとオプションフィールドが正しく検証され、safeParse結果のsuccessがtrueになること", () => {
			const validRequest = {
				security_group_rule: {
					security_group_id: "sg-12345",
					direction: "ingress" as const,
					ethertype: "IPv4" as const,
					port_range_min: 80,
					port_range_max: 80,
					protocol: "tcp" as const,
					remote_ip_prefix: "0.0.0.0/0",
					remote_group_id: "sg-67890",
				},
			};

			const result =
				CreateSecurityGroupRuleRequestSchema.safeParse(validRequest);
			expect(result.success).toBe(true);
		});

		it("CreateSecurityGroupRuleRequestSchemaが必須フィールドのみのセキュリティグループルール作成リクエストデータ（security_group_id、direction）を受け取った場合に、オプションフィールドなしでも正しく検証され、safeParse結果のsuccessがtrueになること", () => {
			const minimalRequest = {
				security_group_rule: {
					security_group_id: "sg-12345",
					direction: "egress" as const,
					ethertype: "IPv4" as const,
				},
			};

			const result =
				CreateSecurityGroupRuleRequestSchema.safeParse(minimalRequest);
			expect(result.success).toBe(true);
		});

		it("CreateSecurityGroupRuleRequestSchemaがnullプロトコルを含むセキュリティグループルール作成リクエストデータ（security_group_id、direction、ethertype、protocol: null）を受け取った場合に、nullプロトコルが許可され、safeParse結果のsuccessがtrueになること", () => {
			const requestWithNullProtocol = {
				security_group_rule: {
					security_group_id: "sg-12345",
					direction: "ingress" as const,
					ethertype: "IPv4" as const,
					protocol: null,
				},
			};

			const result = CreateSecurityGroupRuleRequestSchema.safeParse(
				requestWithNullProtocol,
			);
			expect(result.success).toBe(true);
		});

		it("CreateSecurityGroupRuleRequestSchemaが無効なdirection値（'invalid'）を含むセキュリティグループルール作成リクエストデータを受け取った場合に、direction値検証が失敗し、safeParse結果のsuccessがfalseになり、エラーメッセージが'通信の向きは \\'ingress\\' または \\'egress\\' を指定してください'になること", () => {
			const invalidRequest = {
				security_group_rule: {
					security_group_id: "sg-12345",
					direction: "invalid",
					ethertype: "IPv4",
				},
			};

			const result =
				CreateSecurityGroupRuleRequestSchema.safeParse(invalidRequest);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"通信の向きは 'ingress' または 'egress' を指定してください",
				);
			}
		});

		it("CreateSecurityGroupRuleRequestSchemaが無効なethertype値（'IPv5'）を含むセキュリティグループルール作成リクエストデータを受け取った場合に、ethertype値検証が失敗し、safeParse結果のsuccessがfalseになり、エラーメッセージが'EtherTypeは \\'IPv4\\' または \\'IPv6\\' を指定してください'になること", () => {
			const invalidRequest = {
				security_group_rule: {
					security_group_id: "sg-12345",
					direction: "ingress",
					ethertype: "IPv5",
				},
			};

			const result =
				CreateSecurityGroupRuleRequestSchema.safeParse(invalidRequest);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"イーサタイプは 'IPv4' または 'IPv6' を指定してください",
				);
			}
		});

		it("CreateSecurityGroupRuleRequestSchemaが負のport_range_min値（-1）を含むセキュリティグループルール作成リクエストデータを受け取った場合に、ポート番号の範囲検証が失敗し、safeParse結果のsuccessがfalseになり、エラーメッセージが'ポート番号は0以上の値を指定してください'になること", () => {
			const invalidRequest = {
				security_group_rule: {
					security_group_id: "sg-12345",
					direction: "ingress",
					ethertype: "IPv4",
					port_range_min: -1,
				},
			};

			const result =
				CreateSecurityGroupRuleRequestSchema.safeParse(invalidRequest);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"ポート番号は0以上の値を指定してください",
				);
			}
		});

		it("CreateSecurityGroupRuleRequestSchemaが小数のport_range_min値（80.5）を含むセキュリティグループルール作成リクエストデータを受け取った場合に、整数型検証が失敗し、safeParse結果のsuccessがfalseになり、エラーメッセージが'ポート番号は整数で指定してください'になること", () => {
			const invalidRequest = {
				security_group_rule: {
					security_group_id: "sg-12345",
					direction: "ingress",
					ethertype: "IPv4",
					port_range_min: 80.5,
				},
			};

			const result =
				CreateSecurityGroupRuleRequestSchema.safeParse(invalidRequest);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"ポート番号は整数で指定してください",
				);
			}
		});

		it("CreateSecurityGroupRuleRequestSchemaが無効なprotocol値（'invalid-protocol'）を含むセキュリティグループルール作成リクエストデータを受け取った場合に、protocol値検証が失敗し、safeParse結果のsuccessがfalseになること", () => {
			const invalidRequest = {
				security_group_rule: {
					security_group_id: "sg-12345",
					direction: "ingress",
					ethertype: "IPv4",
					protocol: "invalid-protocol",
				},
			};

			const result =
				CreateSecurityGroupRuleRequestSchema.safeParse(invalidRequest);
			expect(result.success).toBe(false);
		});

		it("CreateSecurityGroupRuleRequestSchemaが未定義フィールド（extra_field）を含むセキュリティグループルール作成リクエストデータを受け取った場合に、strict validation により余分なフィールドが拒否され、safeParse結果のsuccessがfalseになること", () => {
			const requestWithExtraFields = {
				security_group_rule: {
					security_group_id: "sg-12345",
					direction: "ingress",
					ethertype: "IPv4",
					extra_field: "not allowed",
				},
			};

			const result = CreateSecurityGroupRuleRequestSchema.safeParse(
				requestWithExtraFields,
			);
			expect(result.success).toBe(false);
		});

		it("CreateSecurityGroupRuleRequestSchemaが必須フィールド（direction）を欠いたセキュリティグループルール作成リクエストデータを受け取った場合に、必須フィールド検証が失敗し、safeParse結果のsuccessがfalseになること", () => {
			const incompleteRequest = {
				security_group_rule: {
					direction: "ingress",
					// security_group_id が欠けている
				},
			};

			const result =
				CreateSecurityGroupRuleRequestSchema.safeParse(incompleteRequest);
			expect(result.success).toBe(false);
		});

		it("CreateSecurityGroupRuleRequestSchemaが境界値のport_range_min値（0）を含むセキュリティグループルール作成リクエストデータを受け取った場合に、最小境界値が正しく検証され、safeParse結果のsuccessがtrueになること", () => {
			const validRequest = {
				security_group_rule: {
					security_group_id: "sg-12345",
					direction: "ingress",
					ethertype: "IPv4",
					port_range_min: 0,
				},
			};

			const result =
				CreateSecurityGroupRuleRequestSchema.safeParse(validRequest);
			expect(result.success).toBe(true);
		});

		it("CreateSecurityGroupRuleRequestSchemaが境界値のport_range_max値（65535）を含むセキュリティグループルール作成リクエストデータを受け取った場合に、最大境界値が正しく検証され、safeParse結果のsuccessがtrueになること", () => {
			const validRequest = {
				security_group_rule: {
					security_group_id: "sg-12345",
					direction: "ingress",
					ethertype: "IPv4",
					port_range_max: 65535,
				},
			};

			const result =
				CreateSecurityGroupRuleRequestSchema.safeParse(validRequest);
			expect(result.success).toBe(true);
		});

		it("CreateSecurityGroupRuleRequestSchemaが境界値を超えるport_range_max値（65536）を含むセキュリティグループルール作成リクエストデータを受け取った場合に、最大値制限により検証が失敗し、safeParse結果のsuccessがfalseになり、エラーメッセージが'ポート番号は65535以下の値を指定してください'になること", () => {
			const requestWithLargePort = {
				security_group_rule: {
					security_group_id: "sg-12345",
					direction: "ingress",
					ethertype: "IPv4",
					port_range_max: 65536,
				},
			};

			const result =
				CreateSecurityGroupRuleRequestSchema.safeParse(requestWithLargePort);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"ポート番号は65535以下の値を指定してください",
				);
			}
		});

		it("CreateSecurityGroupRuleRequestSchemaがport_range_minとport_range_maxの組み合わせ（min: 80, max: 443）を含むセキュリティグループルール作成リクエストデータを受け取った場合に、ポート範囲が正しく検証され、safeParse結果のsuccessがtrueになること", () => {
			const validRangeRequest = {
				security_group_rule: {
					security_group_id: "sg-12345",
					direction: "ingress",
					ethertype: "IPv4",
					port_range_min: 80,
					port_range_max: 443,
				},
			};

			const result =
				CreateSecurityGroupRuleRequestSchema.safeParse(validRangeRequest);
			expect(result.success).toBe(true);
		});

		it("CreateSecurityGroupRuleRequestSchemaが文字列のport_range_min値（'invalid'）を含むセキュリティグループルール作成リクエストデータを受け取った場合に、数値型検証が失敗し、safeParse結果のsuccessがfalseになり、エラーメッセージが'ポート番号は数値で指定してください'になること", () => {
			const invalidRequest = {
				security_group_rule: {
					security_group_id: "sg-12345",
					direction: "ingress",
					ethertype: "IPv4",
					port_range_min: "invalid",
				},
			};

			const result =
				CreateSecurityGroupRuleRequestSchema.safeParse(invalidRequest);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"ポート番号は数値で指定してください",
				);
			}
		});

		it("CreateSecurityGroupRuleRequestSchemaが負のport_range_max値（-5）を含むセキュリティグループルール作成リクエストデータを受け取った場合に、ポート番号の範囲検証が失敗し、safeParse結果のsuccessがfalseになり、エラーメッセージが'ポート番号は0以上の値を指定してください'になること", () => {
			const invalidRequest = {
				security_group_rule: {
					security_group_id: "sg-12345",
					direction: "ingress",
					ethertype: "IPv4",
					port_range_max: -5,
				},
			};

			const result =
				CreateSecurityGroupRuleRequestSchema.safeParse(invalidRequest);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"ポート番号は0以上の値を指定してください",
				);
			}
		});

		it("CreateSecurityGroupRuleRequestSchemaが小数のport_range_max値（443.7）を含むセキュリティグループルール作成リクエストデータを受け取った場合に、整数型検証が失敗し、safeParse結果のsuccessがfalseになり、エラーメッセージが'ポート番号は整数で指定してください'になること", () => {
			const invalidRequest = {
				security_group_rule: {
					security_group_id: "sg-12345",
					direction: "ingress",
					ethertype: "IPv4",
					port_range_max: 443.7,
				},
			};

			const result =
				CreateSecurityGroupRuleRequestSchema.safeParse(invalidRequest);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"ポート番号は整数で指定してください",
				);
			}
		});

		it("CreateSecurityGroupRuleRequestSchemaが文字列のport_range_max値（'8080'）を含むセキュリティグループルール作成リクエストデータを受け取った場合に、数値型検証が失敗し、safeParse結果のsuccessがfalseになり、エラーメッセージが'ポート番号は数値で指定してください'になること", () => {
			const invalidRequest = {
				security_group_rule: {
					security_group_id: "sg-12345",
					direction: "ingress",
					ethertype: "IPv4",
					port_range_max: "8080",
				},
			};

			const result =
				CreateSecurityGroupRuleRequestSchema.safeParse(invalidRequest);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"ポート番号は数値で指定してください",
				);
			}
		});
	});

	describe("CreateSecurityGroupRequestSchema", () => {
		it("CreateSecurityGroupRequestSchemaが完全なセキュリティグループ作成リクエストデータ（name、description）を受け取った場合に、すべての必須フィールドとオプションフィールドが正しく検証され、safeParse結果のsuccessがtrueになること", () => {
			const validRequest = {
				security_group: {
					name: "test-security-group",
					description: "Test security group description",
				},
			};

			const result = CreateSecurityGroupRequestSchema.safeParse(validRequest);
			expect(result.success).toBe(true);
		});

		it("CreateSecurityGroupRequestSchemaが必須フィールドのみのセキュリティグループ作成リクエストデータ（name）を受け取った場合に、オプションフィールドなしでも正しく検証され、safeParse結果のsuccessがtrueになること", () => {
			const minimalRequest = {
				security_group: {
					name: "test-security-group",
				},
			};

			const result = CreateSecurityGroupRequestSchema.safeParse(minimalRequest);
			expect(result.success).toBe(true);
		});

		it("CreateSecurityGroupRequestSchemaが空文字列のnameとdescriptionを含むセキュリティグループ作成リクエストデータを受け取った場合に、空文字列が許可され、safeParse結果のsuccessがtrueになること", () => {
			const requestWithEmptyStrings = {
				security_group: {
					name: "",
					description: "",
				},
			};

			const result = CreateSecurityGroupRequestSchema.safeParse(
				requestWithEmptyStrings,
			);
			expect(result.success).toBe(true);
		});

		it("CreateSecurityGroupRequestSchemaが未定義フィールド（extra_field）を含むセキュリティグループ作成リクエストデータを受け取った場合に、strict validation により余分なフィールドが拒否され、safeParse結果のsuccessがfalseになること", () => {
			const requestWithExtraFields = {
				security_group: {
					name: "test-security-group",
					description: "Test description",
					extra_field: "not allowed",
				},
			};

			const result = CreateSecurityGroupRequestSchema.safeParse(
				requestWithExtraFields,
			);
			expect(result.success).toBe(false);
		});

		it("CreateSecurityGroupRequestSchemaが必須フィールド（name）を欠いたセキュリティグループ作成リクエストデータを受け取った場合に、必須フィールド検証が失敗し、safeParse結果のsuccessがfalseになること", () => {
			const incompleteRequest = {
				security_group: {
					// name が欠けている
				},
			};

			const result =
				CreateSecurityGroupRequestSchema.safeParse(incompleteRequest);
			expect(result.success).toBe(false);
		});

		it("CreateSecurityGroupRequestSchemaが文字列以外の型（name: 123）を含むセキュリティグループ作成リクエストデータを受け取った場合に、型検証が失敗し、safeParse結果のsuccessがfalseになること", () => {
			const invalidRequest = {
				security_group: {
					name: 123,
					description: "Test description",
				},
			};

			const result = CreateSecurityGroupRequestSchema.safeParse(invalidRequest);
			expect(result.success).toBe(false);
		});
	});

	describe("UpdateSecurityGroupRequestSchema", () => {
		it("UpdateSecurityGroupRequestSchemaが完全なセキュリティグループ更新リクエストデータ（name、description）を受け取った場合に、すべてのオプションフィールドが正しく検証され、safeParse結果のsuccessがtrueになること", () => {
			const validRequest = {
				security_group: {
					name: "updated-security-group",
					description: "Updated description",
				},
			};

			const result = UpdateSecurityGroupRequestSchema.safeParse(validRequest);
			expect(result.success).toBe(true);
		});

		it("UpdateSecurityGroupRequestSchemaがnameのみのセキュリティグループ更新リクエストデータを受け取った場合に、部分的な更新が許可され、safeParse結果のsuccessがtrueになること", () => {
			const nameOnlyRequest = {
				security_group: {
					name: "updated-name",
				},
			};

			const result =
				UpdateSecurityGroupRequestSchema.safeParse(nameOnlyRequest);
			expect(result.success).toBe(true);
		});

		it("UpdateSecurityGroupRequestSchemaがdescriptionのみのセキュリティグループ更新リクエストデータを受け取った場合に、部分的な更新が許可され、safeParse結果のsuccessがtrueになること", () => {
			const descriptionOnlyRequest = {
				security_group: {
					description: "updated description",
				},
			};

			const result = UpdateSecurityGroupRequestSchema.safeParse(
				descriptionOnlyRequest,
			);
			expect(result.success).toBe(true);
		});

		it("UpdateSecurityGroupRequestSchemaが空のsecurity_groupオブジェクトを含む更新リクエストデータを受け取った場合に、空オブジェクトが許可され、safeParse結果のsuccessがtrueになること", () => {
			const emptyRequest = {
				security_group: {},
			};

			const result = UpdateSecurityGroupRequestSchema.safeParse(emptyRequest);
			expect(result.success).toBe(true);
		});

		it("UpdateSecurityGroupRequestSchemaが未定義フィールド（extra_field）を含むセキュリティグループ更新リクエストデータを受け取った場合に、strict validation により余分なフィールドが拒否され、safeParse結果のsuccessがfalseになること", () => {
			const requestWithExtraFields = {
				security_group: {
					name: "test-name",
					extra_field: "not allowed",
				},
			};

			const result = UpdateSecurityGroupRequestSchema.safeParse(
				requestWithExtraFields,
			);
			expect(result.success).toBe(false);
		});

		it("UpdateSecurityGroupRequestSchemaが文字列以外の型（name: 123）を含むセキュリティグループ更新リクエストデータを受け取った場合に、型検証が失敗し、safeParse結果のsuccessがfalseになること", () => {
			const invalidRequest = {
				security_group: {
					name: 123,
				},
			};

			const result = UpdateSecurityGroupRequestSchema.safeParse(invalidRequest);
			expect(result.success).toBe(false);
		});
	});

	describe("UpdatePortRequestSchema", () => {
		it("UpdatePortRequestSchemaが有効なポート更新リクエストデータ（security_groups配列）を受け取った場合に、セキュリティグループIDの配列が正しく検証され、safeParse結果のsuccessがtrueになること", () => {
			const validRequest = {
				port: {
					security_groups: ["sg-12345", "sg-67890"],
				},
			};

			const result = UpdatePortRequestSchema.safeParse(validRequest);
			expect(result.success).toBe(true);
		});

		it("UpdatePortRequestSchemaが空のsecurity_groups配列を含むポート更新リクエストデータを受け取った場合に、空配列が許可され、safeParse結果のsuccessがtrueになること", () => {
			const emptyArrayRequest = {
				port: {
					security_groups: [],
				},
			};

			const result = UpdatePortRequestSchema.safeParse(emptyArrayRequest);
			expect(result.success).toBe(true);
		});

		it("UpdatePortRequestSchemaがsecurity_groupsフィールドを含まないポート更新リクエストデータを受け取った場合に、オプションフィールドが許可され、safeParse結果のsuccessがtrueになること", () => {
			const emptyRequest = {
				port: {},
			};

			const result = UpdatePortRequestSchema.safeParse(emptyRequest);
			expect(result.success).toBe(true);
		});

		it("UpdatePortRequestSchemaが単一のセキュリティグループIDを含むポート更新リクエストデータを受け取った場合に、単一要素配列が正しく検証され、safeParse結果のsuccessがtrueになること", () => {
			const singleGroupRequest = {
				port: {
					security_groups: ["sg-12345"],
				},
			};

			const result = UpdatePortRequestSchema.safeParse(singleGroupRequest);
			expect(result.success).toBe(true);
		});

		it("UpdatePortRequestSchemaが未定義フィールド（extra_field）を含むポート更新リクエストデータを受け取った場合に、strict validation により余分なフィールドが拒否され、safeParse結果のsuccessがfalseになること", () => {
			const requestWithExtraFields = {
				port: {
					security_groups: ["sg-12345"],
					extra_field: "not allowed",
				},
			};

			const result = UpdatePortRequestSchema.safeParse(requestWithExtraFields);
			expect(result.success).toBe(false);
		});

		it("UpdatePortRequestSchemaがsecurity_groupsに配列以外の型（文字列）を含むポート更新リクエストデータを受け取った場合に、配列型検証が失敗し、safeParse結果のsuccessがfalseになること", () => {
			const invalidRequest = {
				port: {
					security_groups: "sg-12345",
				},
			};

			const result = UpdatePortRequestSchema.safeParse(invalidRequest);
			expect(result.success).toBe(false);
		});

		it("UpdatePortRequestSchemaがsecurity_groups配列に文字列以外の要素（数値）を含むポート更新リクエストデータを受け取った場合に、配列要素の型検証が失敗し、safeParse結果のsuccessがfalseになること", () => {
			const invalidRequest = {
				port: {
					security_groups: ["sg-12345", 123, "sg-67890"],
				},
			};

			const result = UpdatePortRequestSchema.safeParse(invalidRequest);
			expect(result.success).toBe(false);
		});
	});
});
