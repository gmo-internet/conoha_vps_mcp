import { z } from "zod";

export const CreateVolumeRequestSchema = z
	.object({
		volume: z
			.object({
				size: z.number().int().gt(0).describe("ボリュームのサイズ (GB単位)"), // サイズは正の整数
				description: z
					.string()
					.nullable()
					.optional()
					.describe("ボリュームの説明 (nullable)"),
				name: z
					.string()
					.regex(/^[A-Za-z0-9_-]{1,255}$/)
					.describe(
						"ボリュームの名前 (1-255文字の英数字、アンダースコア、ハイフン)",
					), //1文字以上255文字以下の英数字、アンダースコア、ハイフン
				volume_type: z.string().describe("ボリュームのタイプ (名前またはID)"), //volume_typeは仕様上はoptionalだが、意図しない動作を防止するため、必須に設定
				imageRef: z
					.string()
					.optional()
					.describe(
						"ボリュームを作成する際のイメージID (任意、ブートボリューム作成時には必須)",
					), //imageRefはブートボリューム作成時には必須
			})
			.strict(),
	})
	.strict();

export const UpdateVolumeRequestSchema = z
	.object({
		volume: z
			.object({
				name: z
					.string()
					.regex(/^[A-Za-z0-9_-]{1,255}$/) //1文字以上255文字以下の英数字、アンダースコア、ハイフン
					.optional()
					.describe(
						"ボリュームの名前 (任意) (1-255文字の英数字、アンダースコア、ハイフン)",
					),
				description: z.string().optional().describe("ボリュームの説明 (任意)"),
			})
			.strict(),
	})
	.strict();
