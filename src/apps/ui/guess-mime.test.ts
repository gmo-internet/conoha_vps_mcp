/**
 * MIME 推定のテスト
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";
import { guessMime } from "./guess-mime";

describe("guessMime", () => {
	it("代表的な拡張子から正しい MIME を返す", () => {
		expect(guessMime("photo.jpg")).toBe("image/jpeg");
		expect(guessMime("PHOTO.JPEG")).toBe("image/jpeg");
		expect(guessMime("logo.svg")).toBe("image/svg+xml");
		expect(guessMime("index.html")).toBe("text/html");
		expect(guessMime("data.json")).toBe("application/json");
		expect(guessMime("report.pdf")).toBe("application/pdf");
		expect(guessMime("clip.mp4")).toBe("video/mp4");
	});

	it("圧縮形式は対応する archive MIME を返す", () => {
		expect(guessMime("archive.tar.gz")).toBe("application/gzip");
		expect(guessMime("dump.tar")).toBe("application/x-tar");
		expect(guessMime("build.zip")).toBe("application/zip");
	});

	it("ピリオドを含むファイル名でも最後の拡張子のみ判定する", () => {
		expect(guessMime("backup.2026-01-01.json")).toBe("application/json");
	});

	it("拡張子が無い場合は application/octet-stream を返す", () => {
		expect(guessMime("README")).toBe("application/octet-stream");
	});

	it("ピリオドで終わるだけのファイル名は application/octet-stream を返す", () => {
		expect(guessMime("trailing.")).toBe("application/octet-stream");
	});

	it("対応外の拡張子は application/octet-stream を返す", () => {
		expect(guessMime("strange.xyz")).toBe("application/octet-stream");
	});
});
