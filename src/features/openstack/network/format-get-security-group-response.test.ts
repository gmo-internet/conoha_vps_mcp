import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatGetSecurityGroupResponse } from "./get-security-group-response-formatter";

// Responseオブジェクトのモック用ヘルパー関数
function createMockResponse(
	status: number,
	statusText: string,
	body: any,
): Response {
	return {
		status,
		statusText,
		json: vi.fn().mockResolvedValue(body),
	} as unknown as Response;
}

describe("format-get-security-group-response", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("formatGetSecurityGroupResponse", () => {
		it("正常なsecurity_groupレスポンスを'{status: number, statusText: string, body: {security_groups: SecurityGroupData[]}}'形式にフォーマットできる", async () => {
			const mockBody = {
				security_groups: [
					{
						id: "sg-1",
						name: "default",
						description: "Default security group",
						security_group_rules: [
							{
								id: "rule-1",
								direction: "ingress",
								ethertype: "IPv4",
								port_range_min: 80,
								port_range_max: 80,
								protocol: "tcp",
								remote_ip_prefix: "0.0.0.0/0",
							},
						],
						extra_field: "should_be_filtered",
					},
					{
						id: "sg-2",
						name: "web",
						description: "Web server security group",
						security_group_rules: [],
					},
				],
			};
			const mockResponse = createMockResponse(200, "OK", mockBody);

			const result = await formatGetSecurityGroupResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: {
					security_groups: [
						{
							id: "sg-1",
							name: "default",
							description: "Default security group",
							security_group_rules: [
								{
									ethertype: "IPv4",
									direction: "ingress",
									protocol: "tcp",
									port_range_min: 80,
									port_range_max: 80,
									remote_ip_prefix: "0.0.0.0/0",
									remote_group_id: null,
								},
							],
						},
						{
							id: "sg-2",
							name: "web",
							description: "Web server security group",
							security_group_rules: [],
						},
					],
				},
			});
		});

		it("空のsecurity_groupリストを正しくフォーマットできる", async () => {
			const mockBody = {
				security_groups: [],
			};
			const mockResponse = createMockResponse(200, "OK", mockBody);

			const result = await formatGetSecurityGroupResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: {
					security_groups: [],
				},
			});
		});

		it("一部のフィールドが欠けているsecurity_groupデータを正しく処理できる", async () => {
			const mockBody = {
				security_groups: [
					{
						id: "sg-1",
						name: "partial",
						// description と security_group_rules が欠けている
					},
					{
						// id と name が欠けている
						description: "No ID group",
						security_group_rules: [
							{
								id: "rule-1",
								direction: "egress",
								// その他のフィールドが欠けている
							},
						],
					},
				],
			};
			const mockResponse = createMockResponse(200, "OK", mockBody);

			const result = await formatGetSecurityGroupResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: {
					security_groups: [
						{
							id: "sg-1",
							name: "partial",
							description: undefined,
							security_group_rules: undefined,
						},
						{
							id: undefined,
							name: undefined,
							description: "No ID group",
							security_group_rules: [
								{
									direction: "egress",
									ethertype: undefined,
									port_range_min: null,
									port_range_max: null,
									protocol: null,
									remote_ip_prefix: null,
									remote_group_id: null,
								},
							],
						},
					],
				},
			});
		});

		it("security_groupsプロパティが存在しない場合、元のレスポンスボディをそのまま返す", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			const mockBody = {
				error: "No security groups found",
			};
			const mockResponse = createMockResponse(404, "Not Found", mockBody);

			const result = await formatGetSecurityGroupResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 404,
				statusText: "Not Found",
				body: mockBody,
			});
		});

		it("security_groupsが配列でない場合、元のレスポンスボディをそのまま返す", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			const mockBody = {
				security_groups: "invalid_data",
			};
			const mockResponse = createMockResponse(200, "OK", mockBody);

			const result = await formatGetSecurityGroupResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: mockBody,
			});
		});

		it("JSONパースエラーが発生した場合、エラーボディを返す", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			const mockResponse = {
				status: 500,
				statusText: "Internal Server Error",
				json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
			} as unknown as Response;

			const result = await formatGetSecurityGroupResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 500,
				statusText: "Internal Server Error",
				body: "<error>",
			});
		});

		it("さまざまなHTTPステータスコードで正しくフォーマットできる", async () => {
			const testCases = [
				{ status: 201, statusText: "Created" },
				{ status: 400, statusText: "Bad Request" },
				{ status: 401, statusText: "Unauthorized" },
				{ status: 403, statusText: "Forbidden" },
				{ status: 500, statusText: "Internal Server Error" },
			];

			for (const testCase of testCases) {
				const mockBody = {
					security_groups: [
						{
							id: "test-sg",
							name: "test-security-group",
							description: "Test group",
							security_group_rules: [],
						},
					],
				};
				const mockResponse = createMockResponse(
					testCase.status,
					testCase.statusText,
					mockBody,
				);

				const result = await formatGetSecurityGroupResponse(mockResponse);
				const parsed = JSON.parse(result);

				expect(parsed.status).toBe(testCase.status);
				expect(parsed.statusText).toBe(testCase.statusText);
				expect(parsed.body.security_groups[0]).toEqual({
					id: "test-sg",
					name: "test-security-group",
					description: "Test group",
					security_group_rules: [],
				});
			}
		});

		it("nullやundefined値を含むsecurity_groupデータを正しく処理できる", async () => {
			const mockBody = {
				security_groups: [
					{
						id: null,
						name: undefined,
						description: null,
						security_group_rules: null,
					},
				],
			};
			const mockResponse = createMockResponse(200, "OK", mockBody);

			const result = await formatGetSecurityGroupResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: {
					security_groups: [
						{
							id: null,
							name: undefined,
							description: null,
						},
					],
				},
			});
		});

		it("複雑なsecurity_group_rulesを含むsecurity_groupデータを正しく処理できる", async () => {
			const mockBody = {
				security_groups: [
					{
						id: "sg-complex",
						name: "complex-group",
						description: "Complex security group",
						security_group_rules: [
							{
								id: "rule-1",
								direction: "ingress",
								ethertype: "IPv4",
								port_range_min: 22,
								port_range_max: 22,
								protocol: "tcp",
								remote_ip_prefix: "192.168.1.0/24",
								remote_group_id: null,
							},
							{
								id: "rule-2",
								direction: "egress",
								ethertype: "IPv6",
								port_range_min: null,
								port_range_max: null,
								protocol: null,
								remote_ip_prefix: null,
								remote_group_id: "sg-other",
							},
						],
					},
				],
			};
			const mockResponse = createMockResponse(200, "OK", mockBody);

			const result = await formatGetSecurityGroupResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: {
					security_groups: [
						{
							id: "sg-complex",
							name: "complex-group",
							description: "Complex security group",
							security_group_rules: [
								{
									direction: "ingress",
									ethertype: "IPv4",
									port_range_min: 22,
									port_range_max: 22,
									protocol: "tcp",
									remote_ip_prefix: "192.168.1.0/24",
									remote_group_id: null,
								},
								{
									direction: "egress",
									ethertype: "IPv6",
									port_range_min: null,
									port_range_max: null,
									protocol: null,
									remote_ip_prefix: null,
									remote_group_id: "sg-other",
								},
							],
						},
					],
				},
			});
		});

		it("大量のsecurity_groupデータを正しく処理できる", async () => {
			const largeSecurityGroups = Array.from({ length: 50 }, (_, i) => ({
				id: `sg-${i}`,
				name: `security-group-${i}`,
				description: `Security group ${i}`,
				security_group_rules: [
					{
						id: `rule-${i}-1`,
						direction: "ingress",
						ethertype: "IPv4",
						port_range_min: 80 + i,
						port_range_max: 80 + i,
						protocol: "tcp",
						remote_ip_prefix: "0.0.0.0/0",
					},
				],
				extra_data: `extra-${i}`,
			}));

			const mockBody = {
				security_groups: largeSecurityGroups,
			};
			const mockResponse = createMockResponse(200, "OK", mockBody);

			const result = await formatGetSecurityGroupResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed.status).toBe(200);
			expect(parsed.statusText).toBe("OK");
			expect(parsed.body.security_groups).toHaveLength(50);
			expect(parsed.body.security_groups[0]).toEqual({
				id: "sg-0",
				name: "security-group-0",
				description: "Security group 0",
				security_group_rules: [
					{
						ethertype: "IPv4",
						direction: "ingress",
						protocol: "tcp",
						port_range_min: 80,
						port_range_max: 80,
						remote_ip_prefix: "0.0.0.0/0",
						remote_group_id: null,
					},
				],
			});
			// extra_dataが除外されていることを確認
			expect(parsed.body.security_groups[0]).not.toHaveProperty("extra_data");
		});

		it("bodyがnullの場合、元のレスポンスボディをそのまま返す", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			const mockResponse = createMockResponse(204, "No Content", null);

			const result = await formatGetSecurityGroupResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 204,
				statusText: "No Content",
				body: null,
			});
		});

		it("security_group_rulesが配列でない場合でも正しく処理できる", async () => {
			const mockBody = {
				security_groups: [
					{
						id: "sg-1",
						name: "invalid-rules",
						description: "Group with invalid rules",
						security_group_rules: "not an array",
					},
				],
			};
			const mockResponse = createMockResponse(200, "OK", mockBody);

			const result = await formatGetSecurityGroupResponse(mockResponse);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				status: 200,
				statusText: "OK",
				body: "<error>",
			});
		});
	});
});
