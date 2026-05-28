/**
 * clipboard ユーティリティのテスト
 *
 * @remarks
 * node 環境には navigator / document が無いため vi.stubGlobal で差し替える。
 *
 * @packageDocumentation
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { copyToClipboard } from "./clipboard";

/** execCommand 経路で使う document スタブを組み立てる */
function stubExecCommandDocument(execResult: boolean) {
	const select = vi.fn();
	const setAttribute = vi.fn();
	const textarea = {
		value: "",
		style: {} as Record<string, string>,
		select,
		setAttribute,
	};
	const appendChild = vi.fn();
	const removeChild = vi.fn();
	const execCommand = vi.fn(() => execResult);
	vi.stubGlobal("document", {
		createElement: vi.fn(() => textarea),
		body: { appendChild, removeChild },
		execCommand,
	});
	return { textarea, execCommand, appendChild, removeChild };
}

describe("copyToClipboard", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.clearAllMocks();
	});

	it("navigator.clipboard.writeText が成功したら true を返し execCommand は使わない", async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		vi.stubGlobal("navigator", { clipboard: { writeText } });
		const { execCommand } = stubExecCommandDocument(true);

		expect(await copyToClipboard("https://example/site")).toBe(true);
		expect(writeText).toHaveBeenCalledWith("https://example/site");
		expect(execCommand).not.toHaveBeenCalled();
	});

	it("navigator.clipboard が無い環境では execCommand フォールバックを使う", async () => {
		vi.stubGlobal("navigator", {});
		const { textarea, execCommand, removeChild } =
			stubExecCommandDocument(true);

		expect(await copyToClipboard("hello")).toBe(true);
		expect(textarea.value).toBe("hello");
		expect(execCommand).toHaveBeenCalledWith("copy");
		// コピー後に一時要素を確実に除去する
		expect(removeChild).toHaveBeenCalled();
	});

	it("clipboard.writeText が reject したら execCommand にフォールバックする", async () => {
		const writeText = vi.fn().mockRejectedValue(new Error("NotAllowed"));
		vi.stubGlobal("navigator", { clipboard: { writeText } });
		const { execCommand } = stubExecCommandDocument(true);

		expect(await copyToClipboard("x")).toBe(true);
		expect(execCommand).toHaveBeenCalledWith("copy");
	});

	it("execCommand が false を返したら false を返す", async () => {
		vi.stubGlobal("navigator", {});
		stubExecCommandDocument(false);

		expect(await copyToClipboard("x")).toBe(false);
	});

	it("execCommand 経路で例外が出たら false を返す", async () => {
		vi.stubGlobal("navigator", {});
		vi.stubGlobal("document", {
			createElement: vi.fn(() => {
				throw new Error("no document");
			}),
			body: { appendChild: vi.fn(), removeChild: vi.fn() },
			execCommand: vi.fn(),
		});

		expect(await copyToClipboard("x")).toBe(false);
	});
});
