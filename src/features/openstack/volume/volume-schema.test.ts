import { describe, expect, it } from "vitest";
import {
	CreateVolumeRequestSchema,
	UpdateVolumeRequestSchema,
} from "./volume-schema";

describe("Volume Schema Tests", () => {
	describe("CreateVolumeRequestSchema", () => {
		it("有効なボリューム作成リクエストを検証する", () => {
			const validRequest = {
				volume: {
					size: 10,
					description: "Test volume description",
					name: "test-volume-01",
					volume_type: "SSD",
					imageRef: "image-12345",
				},
			};

			const result = CreateVolumeRequestSchema.safeParse(validRequest);
			expect(result.success).toBe(true);
		});

		it("必須フィールドのみでリクエストを検証する", () => {
			const minimalRequest = {
				volume: {
					size: 5,
					name: "minimal-volume",
					volume_type: "HDD",
					imageRef: "image-67890",
				},
			};

			const result = CreateVolumeRequestSchema.safeParse(minimalRequest);
			expect(result.success).toBe(true);
		});

		it("nullのdescriptionを許可する", () => {
			const requestWithNullDescription = {
				volume: {
					size: 20,
					description: null,
					name: "null-desc-volume",
					volume_type: "SSD",
					imageRef: "image-99999",
				},
			};

			const result = CreateVolumeRequestSchema.safeParse(
				requestWithNullDescription,
			);
			expect(result.success).toBe(true);
		});

		it("descriptionフィールドなしを許可する", () => {
			const requestWithoutDescription = {
				volume: {
					size: 15,
					name: "no-desc-volume",
					volume_type: "Standard",
					imageRef: "image-11111",
				},
			};

			const result = CreateVolumeRequestSchema.safeParse(
				requestWithoutDescription,
			);
			expect(result.success).toBe(true);
		});

		it("有効な名前パターンを許可する", () => {
			const validNames = [
				"volume1",
				"test-volume",
				"my_volume",
				"Volume_123-test",
				"A",
				"a" + "b".repeat(254), // 255文字
			];

			for (const name of validNames) {
				const request = {
					volume: {
						size: 10,
						name: name,
						volume_type: "SSD",
						imageRef: "image-12345",
					},
				};

				const result = CreateVolumeRequestSchema.safeParse(request);
				expect(result.success).toBe(true);
			}
		});

		it("無効な名前パターンを拒否する", () => {
			const invalidNames = [
				"", // 空文字
				" volume", // スペースで開始
				"volume ", // スペースで終了
				"vol ume", // 中間にスペース
				"volume@test", // 特殊文字
				"volume.test", // ドット
				"ボリューム", // 日本語
				"a".repeat(256), // 256文字（長すぎ）
			];

			for (const name of invalidNames) {
				const request = {
					volume: {
						size: 10,
						name: name,
						volume_type: "SSD",
						imageRef: "image-12345",
					},
				};

				const result = CreateVolumeRequestSchema.safeParse(request);
				expect(result.success).toBe(false);
			}
		});

		it("負のサイズを拒否する", () => {
			const invalidRequest = {
				volume: {
					size: -1,
					name: "test-volume",
					volume_type: "SSD",
					imageRef: "image-12345",
				},
			};

			const result = CreateVolumeRequestSchema.safeParse(invalidRequest);
			expect(result.success).toBe(false);
		});

		it("小数のサイズを拒否する", () => {
			const invalidRequest = {
				volume: {
					size: 10.5,
					name: "test-volume",
					volume_type: "SSD",
					imageRef: "image-12345",
				},
			};

			const result = CreateVolumeRequestSchema.safeParse(invalidRequest);
			expect(result.success).toBe(false);
		});

		it("ゼロサイズを拒否する", () => {
			const invalidRequest = {
				volume: {
					size: 0,
					name: "test-volume",
					volume_type: "SSD",
					imageRef: "image-12345",
				},
			};

			const result = CreateVolumeRequestSchema.safeParse(invalidRequest);
			expect(result.success).toBe(false);
		});

		it("文字列以外の型のフィールドを拒否する", () => {
			const invalidRequests = [
				{
					volume: {
						size: 10,
						name: 123, // 数値
						volume_type: "SSD",
						imageRef: "image-12345",
					},
				},
				{
					volume: {
						size: 10,
						name: "test-volume",
						volume_type: 456, // 数値
						imageRef: "image-12345",
					},
				},
				{
					volume: {
						size: 10,
						name: "test-volume",
						volume_type: "SSD",
						imageRef: 789, // 数値
					},
				},
			];

			for (const request of invalidRequests) {
				const result = CreateVolumeRequestSchema.safeParse(request);
				expect(result.success).toBe(false);
			}
		});

		it("余分なフィールドを拒否する", () => {
			const requestWithExtraFields = {
				volume: {
					size: 10,
					name: "test-volume",
					volume_type: "SSD",
					imageRef: "image-12345",
					extra_field: "not allowed",
				},
			};

			const result = CreateVolumeRequestSchema.safeParse(
				requestWithExtraFields,
			);
			expect(result.success).toBe(false);
		});

		it("必須フィールドの欠如を拒否する", () => {
			const incompleteRequests = [
				{
					volume: {
						// size が欠けている
						name: "test-volume",
						volume_type: "SSD",
						imageRef: "image-12345",
					},
				},
				{
					volume: {
						size: 10,
						// name が欠けている
						volume_type: "SSD",
						imageRef: "image-12345",
					},
				},
				{
					volume: {
						size: 10,
						name: "test-volume",
						// volume_type が欠けている
						imageRef: "image-12345",
					},
				},
				{
					volume: {
						size: 10,
						name: "test-volume",
						volume_type: "SSD",
						// imageRef が欠けている
					},
				},
			];

			for (const request of incompleteRequests) {
				const result = CreateVolumeRequestSchema.safeParse(request);
				expect(result.success).toBe(false);
			}
		});
	});

	describe("UpdateVolumeRequestSchema", () => {
		it("有効なボリューム更新リクエストを検証する", () => {
			const validRequest = {
				volume: {
					name: "updated-volume",
					description: "Updated description",
				},
			};

			const result = UpdateVolumeRequestSchema.safeParse(validRequest);
			expect(result.success).toBe(true);
		});

		it("nameのみの更新を許可する", () => {
			const nameOnlyRequest = {
				volume: {
					name: "updated-name",
				},
			};

			const result = UpdateVolumeRequestSchema.safeParse(nameOnlyRequest);
			expect(result.success).toBe(true);
		});

		it("descriptionのみの更新を許可する", () => {
			const descriptionOnlyRequest = {
				volume: {
					description: "updated description",
				},
			};

			const result = UpdateVolumeRequestSchema.safeParse(
				descriptionOnlyRequest,
			);
			expect(result.success).toBe(true);
		});

		it("空のvolumeオブジェクトを許可する", () => {
			const emptyRequest = {
				volume: {},
			};

			const result = UpdateVolumeRequestSchema.safeParse(emptyRequest);
			expect(result.success).toBe(true);
		});

		it("有効な名前パターンを許可する", () => {
			const validNames = [
				"volume1",
				"test-volume",
				"my_volume",
				"Volume_123-test",
				"A",
				"a" + "b".repeat(254), // 255文字
			];

			for (const name of validNames) {
				const request = {
					volume: {
						name: name,
					},
				};

				const result = UpdateVolumeRequestSchema.safeParse(request);
				expect(result.success).toBe(true);
			}
		});

		it("無効な名前パターンを拒否する", () => {
			const invalidNames = [
				"", // 空文字
				" volume", // スペースで開始
				"volume ", // スペースで終了
				"vol ume", // 中間にスペース
				"volume@test", // 特殊文字
				"volume.test", // ドット
				"ボリューム", // 日本語
				"a".repeat(256), // 256文字（長すぎ）
			];

			for (const name of invalidNames) {
				const request = {
					volume: {
						name: name,
					},
				};

				const result = UpdateVolumeRequestSchema.safeParse(request);
				expect(result.success).toBe(false);
			}
		});

		it("文字列以外の型を拒否する", () => {
			const invalidRequests = [
				{
					volume: {
						name: 123, // 数値
					},
				},
				{
					volume: {
						description: 456, // 数値
					},
				},
				{
					volume: {
						name: true, // boolean
					},
				},
				{
					volume: {
						description: null, // null（descriptionはnullableではない）
					},
				},
			];

			for (const request of invalidRequests) {
				const result = UpdateVolumeRequestSchema.safeParse(request);
				expect(result.success).toBe(false);
			}
		});

		it("余分なフィールドを拒否する", () => {
			const requestWithExtraFields = {
				volume: {
					name: "test-name",
					description: "test description",
					extra_field: "not allowed",
				},
			};

			const result = UpdateVolumeRequestSchema.safeParse(
				requestWithExtraFields,
			);
			expect(result.success).toBe(false);
		});

		it("空文字列のdescriptionを許可する", () => {
			const requestWithEmptyDescription = {
				volume: {
					description: "",
				},
			};

			const result = UpdateVolumeRequestSchema.safeParse(
				requestWithEmptyDescription,
			);
			expect(result.success).toBe(true);
		});
	});
});
