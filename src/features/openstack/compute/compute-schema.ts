import { z } from "zod";

export const CreateServerRequestSchema = z
	.object({
		server: z
			.object({
				flavorRef: z.string(),
				adminPass: z.string().regex(
					/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[\\^$+\-*/|()[\]{}.,?!_=&@~%#:;'"])[A-Za-z0-9\\^$+\-*/|()[\]{}.,?!_=&@~%#:;'"]{9,70}$/, // 9文字以上70文字以下で、英大文字、英小文字、数字、記号を含む、利用可能な記号は \^$+-*/|()[]{}.,?!_=&@~%#:;'"
				),
				block_device_mapping_v2: z.array(
					z
						.object({
							uuid: z.string(),
						})
						.strict(),
				),
				metadata: z
					.object({
						instance_name_tag: z
							.string()
							.regex(/^[A-Za-z0-9_-]{1,255}$/)
							.optional(), // 1文字以上255文字以下の英数字、アンダースコア、ハイフン
					})
					.strict(),
				security_groups: z
					.array(
						z
							.object({
								name: z.string(),
							})
							.strict(),
					)
					.optional(),
				key_name: z.string().optional(),
			})
			.strict(),
	})
	.strict();

// public_keyをoptionalに設定した場合、APIの仕様により省略した際に新しいキーが生成され、そのレスポンス内容の秘密鍵がLLMに返されしまうためoptionalを外しています。
export const CreateSSHKeyPairRequestSchema = z
	.object({
		keypair: z
			.object({
				name: z.string().regex(/^[A-Za-z0-9_-]+$/), // アルファベット、数字、アンダースコア、ハイフンのみを含む
				public_key: z.string(),
			})
			.strict(),
	})
	.strict();

export const OperateServerRequestSchema = z.union([
	z.object({ "os-start": z.null() }).strict(),
	z.object({ "os-stop": z.null() }).strict(),
	z
		.object({ "os-stop": z.object({ force_shutdown: z.boolean() }).strict() })
		.strict(),
	z
		.object({ reboot: z.object({ type: z.enum(["SOFT", "HARD"]) }).strict() })
		.strict(),
	z.object({ resize: z.object({ flavorRef: z.string() }).strict() }).strict(),
	z.object({ confirmResize: z.null() }).strict(),
	z.object({ revertResize: z.null() }).strict(),
]);

export const RemoteConsoleRequestSchema = z
	.object({
		remote_console: z
			.object({
				protocol: z.enum(["vnc", "serial", "web"], {
					errorMap: () => ({
						message:
							"protocol は 'vnc', 'serial', 'web' のいずれかを指定してください",
					}),
				}),
				type: z.enum(["novnc", "serial"], {
					errorMap: () => ({
						message: "type は 'novnc' または 'serial' を指定してください", //protocolで指定したプロトコル名の組み合わせと一致している必要あり
					}),
				}),
			})
			.strict(),
	})
	.strict();
