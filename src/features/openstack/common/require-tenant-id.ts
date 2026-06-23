/**
 * テナントID取得ユーティリティ
 *
 * @remarks
 * 環境変数 `OPENSTACK_TENANT_ID` を必須として取得する共有ヘルパーです。
 * storage / volume の両クライアントで同一の流儀（未設定なら明示エラー）に揃えるために使用します。
 *
 * @packageDocumentation
 */

/**
 * 必須のテナントIDを取得する
 *
 * @remarks
 * 環境変数 `OPENSTACK_TENANT_ID` を返します。
 * 未設定または空文字の場合は、空文字フォールバックや `"undefined"` 混入による
 * 壊れたURL生成を防ぐため、明示的にエラーをスローします。
 *
 * @returns テナントID文字列
 * @throws 環境変数 `OPENSTACK_TENANT_ID` が未設定または空文字の場合
 */
export function requireTenantId(): string {
	const tenantId = process.env.OPENSTACK_TENANT_ID;
	if (!tenantId) {
		throw new Error(
			"OPENSTACK_TENANT_ID が設定されていません。環境変数を確認してください",
		);
	}
	return tenantId;
}
