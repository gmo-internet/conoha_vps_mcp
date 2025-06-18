import { z } from "zod";

export const CreateVolumeRequestSchema = z
	.object({
		volume: z
			.object({
				size: z.number().int().gt(0), // サイズは正の整数
				description: z.string().nullable().optional(),
				name: z.string().regex(/^[A-Za-z0-9_-]{1,255}$/), //1文字以上255文字以下の英数字、アンダースコア、ハイフン
				volume_type: z.string(), //volume_typeは仕様上はoptionalだが、意図しない動作を防止するため、必須に設定
				imageRef: z.string(), //imageRefはブートボリューム以外のときは仕様上はoptionalだが、今回はブートボリューム作成でしか使用しないため必須に設定
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
					.optional(),
				description: z.string().optional(),
			})
			.strict(),
	})
	.strict();
