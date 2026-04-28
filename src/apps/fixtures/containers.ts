/**
 * モックストレージコンテナ一覧フィクスチャ
 *
 * @packageDocumentation
 */

import type { AppContainer } from "../apps-types.js";

export const containers: AppContainer[] = [
	{
		name: "backups",
		count: 24,
		bytes: 4_823_756_902,
		last_modified: "2026-04-20T08:15:32.123456",
	},
	{
		name: "media-assets",
		count: 142,
		bytes: 12_456_789_012,
		last_modified: "2026-04-22T14:42:01.987654",
	},
	{
		name: "logs-archive",
		count: 87,
		bytes: 392_485_127,
		last_modified: "2026-04-25T03:00:55.555555",
	},
];
