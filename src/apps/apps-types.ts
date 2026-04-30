/**
 * MCP Apps 型定義
 *
 * @remarks
 * MCP Appsツールのレスポンス型を定義します。
 *
 * @packageDocumentation
 */

/**
 * ストレージコンテナ情報
 */
export interface AppContainer {
	/** コンテナ名 */
	name: string;
	/** 含まれるオブジェクト数 */
	count: number;
	/** 合計サイズ（バイト） */
	bytes: number;
	/** 最終更新日時（ISO 8601） */
	last_modified?: string;
}

/**
 * ストレージオブジェクト情報
 */
export interface AppObject {
	/** オブジェクト名 */
	name: string;
	/** サイズ（バイト） */
	bytes: number;
	/** MIMEタイプ */
	content_type: string;
	/** 最終更新日時（ISO 8601） */
	last_modified?: string;
	/** ETag（ハッシュ） */
	hash?: string;
}
