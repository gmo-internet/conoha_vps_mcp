/**
 * MCP Apps 型定義
 *
 * @remarks
 * MCP Appsツールのレスポンス型を定義します。
 *
 * コンテナ／オブジェクトの形は zod スキーマを単一の真実源とし、
 * 型（AppContainer / AppObject）は {@link https://zod.dev | z.infer} で導出する。
 * apps-tools.ts の outputSchema は同じスキーマを再利用するため、
 * 型と zod スキーマの二重定義を解消する。
 *
 * @packageDocumentation
 */

import { z } from "zod";

/**
 * ストレージコンテナ情報の zod スキーマ
 *
 * @remarks
 * list_containers の outputSchema 要素および AppContainer 型の単一の真実源。
 */
export const AppContainerSchema = z.object({
	/** コンテナ名 */
	name: z.string(),
	/** 含まれるオブジェクト数 */
	count: z.number(),
	/** 合計サイズ（バイト） */
	bytes: z.number(),
	/** 最終更新日時（ISO 8601） */
	last_modified: z.string().optional(),
});

/**
 * ストレージオブジェクト情報の zod スキーマ
 *
 * @remarks
 * list_objects の outputSchema 要素および AppObject 型の単一の真実源。
 */
export const AppObjectSchema = z.object({
	/** オブジェクト名 */
	name: z.string(),
	/** サイズ（バイト） */
	bytes: z.number(),
	/** MIMEタイプ */
	content_type: z.string(),
	/** 最終更新日時（ISO 8601） */
	last_modified: z.string().optional(),
	/** ETag（ハッシュ） */
	hash: z.string().optional(),
});

/** ストレージコンテナ情報 */
export type AppContainer = z.infer<typeof AppContainerSchema>;

/** ストレージオブジェクト情報 */
export type AppObject = z.infer<typeof AppObjectSchema>;
