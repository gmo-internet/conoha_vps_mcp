import { describe, expect, it } from "vitest";
import {
	CreateSecurityGroupRequestSchema,
	CreateSecurityGroupRuleRequestSchema,
	UpdatePortRequestSchema,
	UpdateSecurityGroupRequestSchema,
} from "./network-schema";

describe("Network Schema Tests", () => {
	describe("CreateSecurityGroupRuleRequestSchema", () => {
		it("有効なセキュリティグループルール作成リクエストを検証する", () => {
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

		it("必須フィールドのみでリクエストを検証する", () => {
			const minimalRequest = {
				security_group_rule: {
					security_group_id: "sg-12345",
					direction: "egress" as const,
				},
			};

			const result =
				CreateSecurityGroupRuleRequestSchema.safeParse(minimalRequest);
			expect(result.success).toBe(true);
		});

		it("nullプロトコルを許可する", () => {
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

		it("無効なdirectionを拒否する", () => {
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

		it("無効なethertypeを拒否する", () => {
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

		it("負のポート番号を拒否する", () => {
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
		});

		it("小数のポート番号を拒否する", () => {
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
		});

		it("無効なプロトコルを拒否する", () => {
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

		it("余分なフィールドを拒否する", () => {
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

		it("必須フィールドの欠如を拒否する", () => {
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
	});

	describe("CreateSecurityGroupRequestSchema", () => {
		it("有効なセキュリティグループ作成リクエストを検証する", () => {
			const validRequest = {
				security_group: {
					name: "test-security-group",
					description: "Test security group description",
				},
			};

			const result = CreateSecurityGroupRequestSchema.safeParse(validRequest);
			expect(result.success).toBe(true);
		});

		it("必須フィールドのみでリクエストを検証する", () => {
			const minimalRequest = {
				security_group: {
					name: "test-security-group",
				},
			};

			const result = CreateSecurityGroupRequestSchema.safeParse(minimalRequest);
			expect(result.success).toBe(true);
		});

		it("空の文字列を許可する", () => {
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

		it("余分なフィールドを拒否する", () => {
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

		it("必須フィールドの欠如を拒否する", () => {
			const incompleteRequest = {
				security_group: {
					// name が欠けている
				},
			};

			const result =
				CreateSecurityGroupRequestSchema.safeParse(incompleteRequest);
			expect(result.success).toBe(false);
		});

		it("文字列以外の型を拒否する", () => {
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
		it("有効なセキュリティグループ更新リクエストを検証する", () => {
			const validRequest = {
				security_group: {
					name: "updated-security-group",
					description: "Updated description",
				},
			};

			const result = UpdateSecurityGroupRequestSchema.safeParse(validRequest);
			expect(result.success).toBe(true);
		});

		it("nameのみの更新を許可する", () => {
			const nameOnlyRequest = {
				security_group: {
					name: "updated-name",
				},
			};

			const result =
				UpdateSecurityGroupRequestSchema.safeParse(nameOnlyRequest);
			expect(result.success).toBe(true);
		});

		it("descriptionのみの更新を許可する", () => {
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

		it("空のsecurity_groupオブジェクトを許可する", () => {
			const emptyRequest = {
				security_group: {},
			};

			const result = UpdateSecurityGroupRequestSchema.safeParse(emptyRequest);
			expect(result.success).toBe(true);
		});

		it("余分なフィールドを拒否する", () => {
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

		it("文字列以外の型を拒否する", () => {
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
		it("有効なポート更新リクエストを検証する", () => {
			const validRequest = {
				port: {
					security_groups: ["sg-12345", "sg-67890"],
				},
			};

			const result = UpdatePortRequestSchema.safeParse(validRequest);
			expect(result.success).toBe(true);
		});

		it("空のsecurity_groups配列を許可する", () => {
			const emptyArrayRequest = {
				port: {
					security_groups: [],
				},
			};

			const result = UpdatePortRequestSchema.safeParse(emptyArrayRequest);
			expect(result.success).toBe(true);
		});

		it("security_groupsフィールドなしを許可する", () => {
			const emptyRequest = {
				port: {},
			};

			const result = UpdatePortRequestSchema.safeParse(emptyRequest);
			expect(result.success).toBe(true);
		});

		it("単一のセキュリティグループIDを許可する", () => {
			const singleGroupRequest = {
				port: {
					security_groups: ["sg-12345"],
				},
			};

			const result = UpdatePortRequestSchema.safeParse(singleGroupRequest);
			expect(result.success).toBe(true);
		});

		it("余分なフィールドを拒否する", () => {
			const requestWithExtraFields = {
				port: {
					security_groups: ["sg-12345"],
					extra_field: "not allowed",
				},
			};

			const result = UpdatePortRequestSchema.safeParse(requestWithExtraFields);
			expect(result.success).toBe(false);
		});

		it("security_groupsが配列でない場合を拒否する", () => {
			const invalidRequest = {
				port: {
					security_groups: "sg-12345",
				},
			};

			const result = UpdatePortRequestSchema.safeParse(invalidRequest);
			expect(result.success).toBe(false);
		});

		it("security_groups配列に文字列以外の要素がある場合を拒否する", () => {
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
