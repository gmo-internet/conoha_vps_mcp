import { z } from "zod";

export const CreateServerRequestSchema = z
	.object({
		server: z
			.object({
				flavorRef: z.string().describe("Flavor ID"),
				adminPass: z
					.string()
					.regex(
						/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[\\^$+\-*/|()[\]{}.,?!_=&@~%#:;'"])[A-Za-z0-9\\^$+\-*/|()[\]{}.,?!_=&@~%#:;'"]{9,70}$/, // 9文字以上70文字以下で、英大文字、英小文字、数字、記号を含む、利用可能な記号は \^$+-*/|()[]{}.,?!_=&@~%#:;'"
					)
					.describe(
						"サーバーの管理者/rootパスワード: ユーザーが必ず指定する必要があります。自動設定しないでください。(9-70文字、英大文字、英小文字、数字、記号をそれぞれ含む、利用可能な記号は ^$+-*/|()[]{}.,?!_=&@~%#:;'\" です)",
					),
				block_device_mapping_v2: z
					.array(
						z
							.object({
								uuid: z.string().describe("起動元となるボリュームのUUID"),
							})
							.strict(),
					)
					.describe("1つ以上のボリュームマッピング"),
				metadata: z
					.object({
						instance_name_tag: z
							.string()
							.regex(/^[A-Za-z0-9_-]{1,255}$/)
							.optional()
							.describe(
								"サーバーの表示名 (1-255文字の英数字、アンダースコア、ハイフン) (任意)",
							), // 1文字以上255文字以下の英数字、アンダースコア、ハイフン
					})
					.strict(),
				security_groups: z
					.array(
						z
							.object({
								name: z.string().describe("セキュリティグループ名"),
							})
							.strict(),
					)
					.optional()
					.describe("セキュリティグループのリスト (任意)"),
				key_name: z.string().optional().describe("SSHキーペアの名前 (任意)"),
				user_data: z
					.string()
					.optional()
					.describe("Base64エンコードされたスタートアップスクリプト (任意)"),
			})
			.strict(),
	})
	.strict();

// public_keyをoptionalに設定した場合、APIの仕様により省略した際に新しいキーが生成され、そのレスポンス内容の秘密鍵がLLMに返されしまうためoptionalを外しています。
export const CreateSSHKeyPairRequestSchema = z
	.object({
		keypair: z
			.object({
				name: z
					.string()
					.regex(/^[A-Za-z0-9_-]+$/)
					.describe("SSHキーペアの名前 (英数字、アンダースコア、ハイフン)"), // アルファベット、数字、アンダースコア、ハイフンのみを含む
				public_key: z.string().describe("SSHキーペアの公開鍵"),
			})
			.strict(),
	})
	.strict();

export const OperateServerRequestSchema = z.union([
	z.object({ "os-start": z.null() }).strict().describe("サーバーを起動する"),
	z.object({ "os-stop": z.null() }).strict().describe("サーバーを停止する"),
	z
		.object({
			"os-stop": z
				.object({
					force_shutdown: z.boolean(),
				})
				.strict(),
		})
		.strict()
		.describe("サーバーを強制シャットダウンする"),
	z
		.object({
			reboot: z
				.object({
					type: z
						.enum(["SOFT", "HARD"])
						.describe("再起動のタイプ (ソフトまたはハード)"),
				})
				.strict(),
		})
		.strict()
		.describe("サーバーを再起動する"),
	z
		.object({
			resize: z
				.object({
					flavorRef: z.string().describe("リサイズ先のFlavor ID"),
				})
				.strict(),
		})
		.strict()
		.describe("サーバーをリサイズする"),
	z.object({ confirmResize: z.null() }).strict().describe("リサイズを確定する"),
	z.object({ revertResize: z.null() }).strict().describe("リサイズを取り消す"),
]);

export const RemoteConsoleRequestSchema = z
	.object({
		remote_console: z
			.object({
				protocol: z
					.enum(["vnc", "serial", "web"], {
						message:
							"protocol は 'vnc', 'serial', 'web' のいずれかを指定してください",
					})
					.describe("リモートコンソールのプロトコル"),
				type: z
					.enum(["novnc", "serial"], {
						message: "type は 'novnc' または 'serial' を指定してください", //protocolで指定したプロトコル名の組み合わせと一致している必要あり
					})
					.describe("リモートコンソールのタイプ"),
			})
			.strict(),
	})
	.strict();

export const AttachVolumeRequestSchema = z
	.object({
		volumeAttachment: z
			.object({
				volumeId: z.string().describe("アタッチするボリュームのID"),
			})
			.strict(),
	})
	.strict();
