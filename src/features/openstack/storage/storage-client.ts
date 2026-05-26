/**
 * OpenStack Object Storage (Swift) APIクライアント
 *
 * @remarks
 * オブジェクトストレージのコンテナ、オブジェクト、メタデータを管理するAPIクライアントです。
 *
 * @packageDocumentation
 */

import { readFile } from "node:fs/promises";
import type { JsonObject } from "../../../types.js";
import { generateApiToken } from "../common/generate-api-token.js";
import { formatResponse } from "../common/response-formatter.js";
import { OPENSTACK_OBJECT_STORAGE_BASE_URL } from "../constants.js";
import {
	formatHeadResponse,
	formatObjectGetResponse,
} from "./response-formatter.js";

const TENANT_ID = process.env.OPENSTACK_TENANT_ID;

/**
 * ストレージメタデータを設定（POST）
 *
 * @param path - APIパス
 * @param headerparam - ヘッダーパラメータ
 * @returns フォーマット済みJSONレスポンス
 */
export async function setPostStorageMetadata(
	path: string,
	headerparam: JsonObject,
) {
	const apiToken = await generateApiToken();

	const url = `${OPENSTACK_OBJECT_STORAGE_BASE_URL}${path}`;

	const headers: Record<string, string> = {
		Accept: "application/json",
		"X-Auth-Token": apiToken,
	};

	for (const [key, value] of Object.entries(headerparam)) {
		if (value !== undefined) {
			headers[key] = value as string;
		}
	}

	const response = await fetch(url, {
		method: "POST",
		headers,
	});

	return await formatResponse(response);
}

/**
 * ストレージメタデータを設定（PUT）
 *
 * @param path - APIパス
 * @returns フォーマット済みJSONレスポンス
 */
export async function setPutStorageMetadata(path: string) {
	const apiToken = await generateApiToken();

	const url = `${OPENSTACK_OBJECT_STORAGE_BASE_URL}${path}`;

	const headers: Record<string, string> = {
		Accept: "application/json",
		"X-Auth-Token": apiToken,
	};

	const response = await fetch(url, {
		method: "PUT",
		headers,
	});

	return await formatResponse(response);
}

/**
 * ストレージアカウント情報を取得
 *
 * @param path - APIパス（例: "/v1/AUTH_{tenantId}"）
 * @returns アカウント情報を含むJSONレスポンス（ヘッダー情報を含む）
 */
export async function getStorageAccountInfo(path: string) {
	const apiToken = await generateApiToken();

	const url = `${OPENSTACK_OBJECT_STORAGE_BASE_URL}${path}`;

	const headers: Record<string, string> = {
		Accept: "application/json",
		"X-Auth-Token": apiToken,
	};

	const response = await fetch(url, {
		method: "HEAD",
		headers,
	});

	return formatHeadResponse(response);
}

/**
 * ストレージコンテナ情報を取得
 *
 * @param path - APIパス（例: "/v1/AUTH_{tenantId}/{container}"）
 * @returns コンテナ情報を含むJSONレスポンス（ヘッダー情報を含む）
 */
export async function getStorageContainerInfo(path: string) {
	const apiToken = await generateApiToken();

	const url = `${OPENSTACK_OBJECT_STORAGE_BASE_URL}${path}`;

	const headers: Record<string, string> = {
		Accept: "application/json",
		"X-Auth-Token": apiToken,
	};

	const response = await fetch(url, {
		method: "HEAD",
		headers,
	});

	return formatHeadResponse(response);
}

/**
 * ストレージコンテナ一覧を取得
 *
 * @param path - APIパス（例: "/v1/AUTH_{tenantId}"）
 * @returns フォーマット済みJSONレスポンス
 */
export async function getStorageContainerList(path: string) {
	const apiToken = await generateApiToken();

	const url = `${OPENSTACK_OBJECT_STORAGE_BASE_URL}${path}`;

	const headers: Record<string, string> = {
		Accept: "application/json",
		"X-Auth-Token": apiToken,
	};

	const response = await fetch(url, {
		method: "GET",
		headers,
	});

	return await formatResponse(response);
}

/**
 * ストレージオブジェクト一覧を取得
 *
 * @param path - APIパス（例: "/v1/AUTH_{tenantId}/{container}"）
 * @returns フォーマット済みJSONレスポンス
 */
export async function getStorageObjectList(path: string) {
	const apiToken = await generateApiToken();

	const url = `${OPENSTACK_OBJECT_STORAGE_BASE_URL}${path}`;

	const headers: Record<string, string> = {
		Accept: "application/json",
		"X-Auth-Token": apiToken,
	};

	const response = await fetch(url, {
		method: "GET",
		headers,
	});

	return await formatResponse(response);
}

/**
 * ストレージオブジェクト情報を取得（ダウンロード）
 *
 * @param path - APIパス（例: "/v1/AUTH_{tenantId}/{container}/{object}"）
 * @returns オブジェクト情報とコンテンツを含むJSONレスポンス（バイナリはbase64エンコード）
 */
export async function getStorageObjectInfo(path: string) {
	const apiToken = await generateApiToken();

	const url = `${OPENSTACK_OBJECT_STORAGE_BASE_URL}${path}`;

	const headers: Record<string, string> = {
		"X-Auth-Token": apiToken,
	};

	const response = await fetch(url, {
		method: "GET",
		headers,
	});

	const content = await response.text();

	return formatObjectGetResponse(response, content);
}

/**
 * ストレージオブジェクトを削除
 *
 * @param path - APIパス（{tenantId}は自動置換される）
 * @returns 削除結果を含むJSONレスポンス
 */
export async function deleteStorageObject(path: string) {
	const apiToken = await generateApiToken();
	const tenantId = TENANT_ID || "";

	const pathWithTenantId = path.replace("{tenantId}", tenantId);

	const url = `${OPENSTACK_OBJECT_STORAGE_BASE_URL}${pathWithTenantId}`;

	const headers: Record<string, string> = {
		Accept: "application/json",
		"X-Auth-Token": apiToken,
	};

	const response = await fetch(url, {
		method: "DELETE",
		headers,
	});

	return await formatResponse(response);
}

/**
 * ストレージコンテナを削除
 *
 * @param path - APIパス（{tenantId}は自動置換される）
 * @returns 削除結果を含むJSONレスポンス
 */
export async function deleteStorageContainer(path: string) {
	const apiToken = await generateApiToken();
	const tenantId = TENANT_ID || "";

	const pathWithTenantId = path.replace("{tenantId}", tenantId);

	const url = `${OPENSTACK_OBJECT_STORAGE_BASE_URL}${pathWithTenantId}`;

	const headers: Record<string, string> = {
		Accept: "application/json",
		"X-Auth-Token": apiToken,
	};

	const response = await fetch(url, {
		method: "DELETE",
		headers,
	});

	return await formatResponse(response);
}

/**
 * Base64 文字列をバイト列へデコードする
 *
 * @internal
 */
function decodeBase64ToBytes(base64: string): Uint8Array {
	const binaryString = Buffer.from(base64, "base64").toString("binary");
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes;
}

/**
 * オブジェクト本体を PUT してレスポンスを整形する
 *
 * @internal
 */
async function putStorageObjectBody(
	path: string,
	body: Uint8Array,
	contentType?: string,
) {
	const apiToken = await generateApiToken();
	const url = `${OPENSTACK_OBJECT_STORAGE_BASE_URL}${path}`;
	const headers: Record<string, string> = {
		Accept: "application/json",
		"X-Auth-Token": apiToken,
	};
	if (contentType) {
		headers["Content-Type"] = contentType;
	}
	const response = await fetch(url, {
		method: "PUT",
		headers,
		body,
	});
	return await formatResponse(response);
}

/**
 * ストレージオブジェクトをアップロード（ファイルパスまたはBase64）
 *
 * @remarks
 * `conoha_post_put` 汎用ツール用。`content` がローカルの絶対パスを指す場合は
 * そのファイルを読み込んでアップロードし、読めなければ Base64 とみなしてデコードする。
 * この二段挙動は tool-descriptions.ts に記載のある正規仕様。埋め込み UI からの
 * アップロードはファイルシステムを触らない {@link uploadStorageObjectDecoded} を使うこと。
 *
 * @param path - APIパス
 * @param content - ファイルパス（絶対パス）またはBase64エンコードされた文字列
 * @param contentType - MIMEタイプ（省略可）
 * @returns アップロード結果を含むJSONレスポンス
 */
export async function uploadStorageObject(
	path: string,
	content: string,
	contentType?: string,
) {
	let body: Uint8Array;
	try {
		const fileContent = await readFile(content);
		body = new Uint8Array(fileContent);
	} catch {
		try {
			body = decodeBase64ToBytes(content);
		} catch {
			body = new TextEncoder().encode(content);
		}
	}
	return putStorageObjectBody(path, body, contentType);
}

/**
 * ストレージオブジェクトをアップロード（Base64専用・ファイルシステム不使用）
 *
 * @remarks
 * MCP App の埋め込み UI 由来のアップロード用。ブラウザの File API で得た本体を
 * Base64 化した文字列のみを受け取り、サーバーローカルファイルの読み込みは一切
 * 行わない。これにより、UI 経路から `content` をパスとして解釈させて任意ファイルを
 * 読ませる経路（多層防御）を塞ぐ。
 *
 * @param path - APIパス
 * @param base64Content - Base64エンコードされたオブジェクト本体
 * @param contentType - MIMEタイプ（省略可）
 * @returns アップロード結果を含むJSONレスポンス
 */
export async function uploadStorageObjectDecoded(
	path: string,
	base64Content: string,
	contentType?: string,
) {
	const body = decodeBase64ToBytes(base64Content);
	return putStorageObjectBody(path, body, contentType);
}
