/**
 * コンテナ名バリデーションのテスト
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";
import { validateContainerName } from "./validate-container-name";

describe("validateContainerName", () => {
	it("空文字は state=empty を返す", () => {
		expect(validateContainerName("", [])).toEqual({ state: "empty" });
	});

	it("3文字未満は state=error で文字数メッセージを返す", () => {
		expect(validateContainerName("ab", [])).toEqual({
			state: "error",
			message: "3文字以上で入力してください",
		});
	});

	it("63文字を超える名前は state=error で文字数メッセージを返す", () => {
		const longName = "a".repeat(64);
		expect(validateContainerName(longName, [])).toEqual({
			state: "error",
			message: "63文字以下で入力してください",
		});
	});

	it("63文字ちょうどは state=ok を返す", () => {
		const exact = "a".repeat(63);
		expect(validateContainerName(exact, [])).toEqual({
			state: "ok",
			message: "命名 OK",
		});
	});

	it("英数字・ハイフン・アンダースコア・ピリオドのみは state=ok", () => {
		expect(validateContainerName("My-bucket_1.v2", [])).toEqual({
			state: "ok",
			message: "命名 OK",
		});
	});

	it("スラッシュや記号を含む名前は state=error で文字種メッセージを返す", () => {
		expect(validateContainerName("bad/name", [])).toEqual({
			state: "error",
			message: "使用できない文字が含まれています",
		});
		expect(validateContainerName("bad name", [])).toEqual({
			state: "error",
			message: "使用できない文字が含まれています",
		});
	});

	it("既存名と完全一致した場合は state=error で重複メッセージを返す", () => {
		expect(validateContainerName("backups", ["assets", "backups"])).toEqual({
			state: "error",
			message: "同じ名前のコンテナが既に存在します",
		});
	});

	it("文字数・文字種の不正は重複より優先して報告する", () => {
		// 文字数違反 → 文字数メッセージのみ
		expect(validateContainerName("ab", ["ab"])).toEqual({
			state: "error",
			message: "3文字以上で入力してください",
		});
		// 文字種違反 → 文字種メッセージのみ
		expect(validateContainerName("a/b", ["a/b"])).toEqual({
			state: "error",
			message: "使用できない文字が含まれています",
		});
	});
});
