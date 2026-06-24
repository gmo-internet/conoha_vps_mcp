/**
 * OpenStack API認証モジュール
 *
 * @remarks
 * ConoHa OpenStack APIへの認証トークンを生成します。
 * 環境変数からユーザー認証情報を取得し、Identity APIを呼び出します。
 *
 * @packageDocumentation
 */

import { OPENSTACK_IDENTITY_BASE_URL, USER_AGENT } from "../constants.js";

/**
 * OpenStack認証ヘッダーを取得する内部関数
 *
 * @param path - Identity APIのパス
 * @returns 認証レスポンスのヘッダー
 * @throws 環境変数が未設定の場合にエラーをスロー
 * @internal
 */
async function fetchOpenstackAuthHeaders(path: string) {
	const USER_ID = process.env.OPENSTACK_USER_ID;
	const PASSWORD = process.env.OPENSTACK_PASSWORD;
	const TENANT_ID = process.env.OPENSTACK_TENANT_ID;

	if (!USER_ID || !PASSWORD || !TENANT_ID)
		throw new Error("USER_ID, PASSWORD, or TENANT_ID envs are not defined");

	const response = await fetch(`${OPENSTACK_IDENTITY_BASE_URL}${path}`, {
		method: "POST",
		headers: { Accept: "application/json", "User-Agent": USER_AGENT },
		body: JSON.stringify({
			auth: {
				identity: {
					methods: ["password"],
					password: {
						user: {
							id: USER_ID,
							password: PASSWORD,
						},
					},
				},
				scope: {
					project: {
						id: TENANT_ID,
					},
				},
			},
		}),
	});
	return response.headers;
}

/**
 * OpenStack APIトークンを生成
 *
 * @remarks
 * 環境変数 `OPENSTACK_USER_ID`、`OPENSTACK_PASSWORD`、`OPENSTACK_TENANT_ID` が必要です。
 * 取得したトークンは後続のAPI呼び出しの `X-Auth-Token` ヘッダーに使用されます。
 *
 * @returns APIトークン文字列
 * @throws 環境変数が未設定の場合
 *
 * @example
 * ```typescript
 * const token = await generateApiToken();
 * // token: "gAAAAABl..."
 * ```
 */
export async function generateApiToken(): Promise<string> {
	const response = await fetchOpenstackAuthHeaders("/auth/tokens");
	const apiToken = response.get("x-subject-token");
	if (!apiToken) {
		throw new Error(
			"認証トークンを取得できませんでした。OPENSTACK_USER_ID / OPENSTACK_PASSWORD / OPENSTACK_TENANT_ID が正しいか確認してください",
		);
	}
	return apiToken;
}
