import { z } from "zod";

export const CreateVolumeRequestSchema = z
	.object({
		volume: z
			.object({
				size: z.number().int(),
				description: z.string().nullable().optional(),
				name: z.string().regex(/^[A-Za-z0-9_-]{1,255}$/), //1文字以上255文字以下の英数字、アンダースコア、ハイフン
				volume_type: z.string(),
				imageRef: z.string(),
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
