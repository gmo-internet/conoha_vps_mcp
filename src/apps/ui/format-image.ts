/**
 * MCP Apps UI の表示整形ユーティリティ
 *
 * @remarks
 * mcp-app.ts から純粋関数を分離し単体テスト可能にする。
 * フレーバー互換判定とイメージ表示整形を提供する。
 *
 * @packageDocumentation
 */

/**
 * イメージ情報（UIのドロップダウン表示に必要なフィールドのみ）
 */
export interface ImageDisplayInput {
	id: string;
	name: string;
	os_type?: string;
	min_disk_gb?: number;
	min_ram_mb?: number;
	size_mb?: number;
	created_at?: string;
	dst_name?: string;
	dst_version?: string;
	app_name?: string;
	app_version?: string;
	service_type?: string;
}

/**
 * イメージ表示の3要素
 *
 * @property primary - 主表示（人間語、例: "Ubuntu 24.04"）
 * @property secondary - 副次表示（API名、例: "vmi-ubuntu-24.04-amd64"）
 * @property tooltip - ホバー時の詳細（OS/最小要件/サイズ/作成日）
 */
export interface ImageDisplay {
	primary: string;
	secondary: string;
	tooltip: string;
}

/**
 * "Ruby_on_Rails" → "Ruby on Rails" のようにアンダースコアを空白に変換
 *
 * @internal
 */
function humanize(s: string): string {
	return s.replace(/_/g, " ").trim();
}

/**
 * イメージ情報から表示用の3要素（主表示・副次表示・ツールチップ）を生成
 *
 * @remarks
 * 表示優先度:
 *   1. アプリバンドル: "{app_name} {app_version}（OS）"
 *   2. OSのみ: "{dst_name} {dst_version}"
 *   3. フォールバック: name（API名そのもの）
 *
 * @param image - イメージ情報
 * @returns 表示用の3要素
 */
export function formatImageDisplay(image: ImageDisplayInput): ImageDisplay {
	const dstName = image.dst_name ? humanize(image.dst_name) : "";
	const dstVer = image.dst_version ?? "";
	const appName = image.app_name ? humanize(image.app_name) : "";
	const appVer = image.app_version ?? "";

	let primary: string;
	if (appName) {
		const osPart = dstName ? `（${dstName}${dstVer ? ` ${dstVer}` : ""}）` : "";
		primary = appVer ? `${appName} ${appVer}${osPart}` : `${appName}${osPart}`;
	} else if (dstName) {
		primary = dstVer ? `${dstName} ${dstVer}` : dstName;
	} else {
		primary = image.name;
	}

	const tooltipLines: string[] = [];
	if (image.os_type) {
		tooltipLines.push(
			`OS種別: ${image.os_type === "windows" ? "Windows" : "Linux"}`,
		);
	}
	if (image.service_type) {
		tooltipLines.push(`用途: ${image.service_type.toUpperCase()}`);
	}
	if (image.min_ram_mb && image.min_ram_mb > 0) {
		tooltipLines.push(`最小RAM: ${image.min_ram_mb}MB`);
	}
	if (image.min_disk_gb && image.min_disk_gb > 0) {
		tooltipLines.push(`最小ディスク: ${image.min_disk_gb}GB`);
	}
	if (image.size_mb && image.size_mb > 0) {
		const sizeGb = image.size_mb / 1024;
		const sizeText =
			sizeGb >= 1 ? `${sizeGb.toFixed(1)}GB` : `${image.size_mb}MB`;
		tooltipLines.push(`サイズ: ${sizeText}`);
	}
	if (image.created_at) {
		tooltipLines.push(`作成: ${image.created_at.slice(0, 10)}`);
	}

	return {
		primary,
		secondary: image.name,
		tooltip: tooltipLines.join("\n"),
	};
}

/**
 * フレーバー名から OS 種別を判定する
 *
 * @remarks
 * 命名規約:
 *   - g2l-* = Linux、g2w-* = Windows、g2d-* = DBaaS
 *   - *-kusanagi または *-p-* は公開API利用不可
 *
 * @param name - フレーバー名（例: "g2l-t-c2m1"）
 * @returns OS種別、判定不能なら null
 */
export function flavorOsType(name: string): "linux" | "windows" | null {
	if (name.startsWith("g2l-t-") && !name.includes("-kusanagi")) return "linux";
	if (name.startsWith("g2w-t-")) return "windows";
	return null;
}

/**
 * 公開API経由でサーバー作成に使えるフレーバーかを判定
 *
 * @remarks
 * "-t-" (時間課金) かつ kusanagi/dbaas でないものに限られる（実機検証で確認済み）。
 * 長期プラン（"-p-"）は契約購入が必要なため公開APIで作成不可。
 *
 * @param name - フレーバー名
 * @returns 公開APIで作成可能なら true
 */
export function isPublicApiFlavor(name: string): boolean {
	return flavorOsType(name) !== null;
}

/**
 * フレーバーのRAM容量から自動作成すべきブートボリュームのサイズ(GB)を判定
 *
 * @remarks
 * ConoHa制約: 30GBブートボリュームは512MBプラン専用、それ以外は100GB必須。
 *
 * @param ramMb - フレーバーのRAM容量(MB)
 * @returns ブートボリュームのサイズ(GB)
 */
export function bootVolumeSizeGb(ramMb: number): 30 | 100 {
	return ramMb <= 512 ? 30 : 100;
}
