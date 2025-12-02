import { describe, expect, it } from "vitest";
import {
	CreateVolumeRequestSchema,
	UpdateVolumeRequestSchema,
} from "./volume-schema";

describe("Volume Schema Tests", () => {
	describe("CreateVolumeRequestSchema", () => {
		it("CreateVolumeRequestSchemaが完全なボリューム作成リクエストデータ（size、description、name、volume_type、imageRef）を受け取った場合に、すべての必須フィールドとオプションフィールドが正しく検証され、safeParse結果のsuccessがtrueになること", () => {
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

		it("CreateVolumeRequestSchemaが必須フィールドのみのボリューム作成リクエストデータ（size、name、volume_type、imageRef）を受け取った場合に、オプションフィールドなしでも正しく検証され、safeParse結果のsuccessがtrueになること", () => {
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

		it("CreateVolumeRequestSchemaがimageRefを省略したボリューム作成リクエストデータ（size、name、volume_type）を受け取った場合に、imageRefなしでも正しく検証され、safeParse結果のsuccessがtrueになること", () => {
			const requestWithoutImageRef = {
				volume: {
					size: 30,
					name: "data-volume",
					volume_type: "Standard",
				},
			};

			const result = CreateVolumeRequestSchema.safeParse(
				requestWithoutImageRef,
			);
			expect(result.success).toBe(true);
		});

		it("CreateVolumeRequestSchemaがnullのdescriptionを含むボリューム作成リクエストデータを受け取った場合に、nullableフィールドが正しく許可され、safeParse結果のsuccessがtrueになること", () => {
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

		it("CreateVolumeRequestSchemaがdescriptionフィールドを省略したボリューム作成リクエストデータを受け取った場合に、オプションフィールドの欠如が正しく許可され、safeParse結果のsuccessがtrueになること", () => {
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

		it("CreateVolumeRequestSchemaが名前フィールドで有効なパターン（英数字、アンダースコア、ハイフン、1-255文字）を含むボリューム作成リクエストデータを受け取った場合に、正規表現検証が正しく通り、safeParse結果のsuccessがtrueになること", () => {
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

		it("CreateVolumeRequestSchemaが名前フィールドで無効なパターン（不正な文字、長さ超過、空文字等）を含むボリューム作成リクエストデータを受け取った場合に、正規表現検証が失敗し、safeParse結果のsuccessがfalseになること", () => {
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

		it("CreateVolumeRequestSchemaがサイズフィールドで負の値（-1）を含むボリューム作成リクエストデータを受け取った場合に、gt(0)バリデーションが失敗し、safeParse結果のsuccessがfalseになること", () => {
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

		it("CreateVolumeRequestSchemaがサイズフィールドで小数値（10.5）を含むボリューム作成リクエストデータを受け取った場合に、int()バリデーションが失敗し、safeParse結果のsuccessがfalseになること", () => {
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

		it("CreateVolumeRequestSchemaがサイズフィールドでゼロ値（0）を含むボリューム作成リクエストデータを受け取った場合に、gt(0)バリデーションが失敗し、safeParse結果のsuccessがfalseになること", () => {
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

		it("CreateVolumeRequestSchemaが文字列以外の型（数値のname、volume_type、imageRef）を含むボリューム作成リクエストデータを受け取った場合に、型検証が失敗し、safeParse結果のsuccessがfalseになること", () => {
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

		it("CreateVolumeRequestSchemaが未定義フィールド（extra_field）を含むボリューム作成リクエストデータを受け取った場合に、strict validationにより余分なフィールドが拒否され、safeParse結果のsuccessがfalseになること", () => {
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

		it("CreateVolumeRequestSchemaが必須フィールド（size、name、volume_type、imageRef）を欠いたボリューム作成リクエストデータを受け取った場合に、必須フィールド検証が失敗し、safeParse結果のsuccessがfalseになること", () => {
			const incompleteRequests = [
				{
					volume: {
						// size が欠けている
						name: "test-volume",
						volume_type: "SSD",
					},
				},
				{
					volume: {
						size: 10,
						// name が欠けている
						volume_type: "SSD",
					},
				},
				{
					volume: {
						size: 10,
						name: "test-volume",
						// volume_type が欠けている
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
		it("UpdateVolumeRequestSchemaが完全なボリューム更新リクエストデータ（name、description）を受け取った場合に、すべてのオプションフィールドが正しく検証され、safeParse結果のsuccessがtrueになること", () => {
			const validRequest = {
				volume: {
					name: "updated-volume",
					description: "Updated description",
				},
			};

			const result = UpdateVolumeRequestSchema.safeParse(validRequest);
			expect(result.success).toBe(true);
		});

		it("UpdateVolumeRequestSchemaがnameフィールドのみのボリューム更新リクエストデータを受け取った場合に、部分的な更新が正しく許可され、safeParse結果のsuccessがtrueになること", () => {
			const nameOnlyRequest = {
				volume: {
					name: "updated-name",
				},
			};

			const result = UpdateVolumeRequestSchema.safeParse(nameOnlyRequest);
			expect(result.success).toBe(true);
		});

		it("UpdateVolumeRequestSchemaがdescriptionフィールドのみのボリューム更新リクエストデータを受け取った場合に、部分的な更新が正しく許可され、safeParse結果のsuccessがtrueになること", () => {
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

		it("UpdateVolumeRequestSchemaが空のvolumeオブジェクトを含むボリューム更新リクエストデータを受け取った場合に、空オブジェクトが正しく許可され、safeParse結果のsuccessがtrueになること", () => {
			const emptyRequest = {
				volume: {},
			};

			const result = UpdateVolumeRequestSchema.safeParse(emptyRequest);
			expect(result.success).toBe(true);
		});

		it("UpdateVolumeRequestSchemaが名前フィールドで有効なパターン（英数字、アンダースコア、ハイフン、1-255文字）を含むボリューム更新リクエストデータを受け取った場合に、正規表現検証が正しく通り、safeParse結果のsuccessがtrueになること", () => {
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

		it("UpdateVolumeRequestSchemaが名前フィールドで無効なパターン（不正な文字、長さ超過、空文字等）を含むボリューム更新リクエストデータを受け取った場合に、正規表現検証が失敗し、safeParse結果のsuccessがfalseになること", () => {
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

		it("UpdateVolumeRequestSchemaが文字列以外の型（数値、boolean、null）を含むボリューム更新リクエストデータを受け取った場合に、型検証が失敗し、safeParse結果のsuccessがfalseになること", () => {
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

		it("UpdateVolumeRequestSchemaが未定義フィールド（extra_field）を含むボリューム更新リクエストデータを受け取った場合に、strict validationにより余分なフィールドが拒否され、safeParse結果のsuccessがfalseになること", () => {
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

		it("UpdateVolumeRequestSchemaが空文字列のdescriptionを含むボリューム更新リクエストデータを受け取った場合に、空文字列が正しく許可され、safeParse結果のsuccessがtrueになること", () => {
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
