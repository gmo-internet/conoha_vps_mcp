/**
 * モックストレージオブジェクト（コンテナ別）フィクスチャ
 *
 * @packageDocumentation
 */

import type { AppObject } from "../apps-types.js";

export const objectsByContainer: Record<string, AppObject[]> = {
	backups: [
		{
			name: "db-2026-04-01.tar.gz",
			bytes: 1_572_864_000,
			content_type: "application/gzip",
			last_modified: "2026-04-01T03:00:12.345678",
		},
		{
			name: "db-2026-04-15.tar.gz",
			bytes: 1_634_512_384,
			content_type: "application/gzip",
			last_modified: "2026-04-15T03:00:08.123456",
		},
	],
	"media-assets": [
		{
			name: "hero.jpg",
			bytes: 2_456_789,
			content_type: "image/jpeg",
			last_modified: "2026-04-22T14:42:01.987654",
		},
		{
			name: "promo-video.mp4",
			bytes: 124_456_789,
			content_type: "video/mp4",
			last_modified: "2026-04-22T14:30:00.000000",
		},
	],
	"logs-archive": [
		{
			name: "2026-04-25.log.gz",
			bytes: 8_192_000,
			content_type: "application/gzip",
			last_modified: "2026-04-25T03:00:55.555555",
		},
	],
};
