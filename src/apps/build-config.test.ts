/**
 * MCPサーバー本体のビルド設定（vite.config.server.ts）に対する不変条件テスト
 *
 * @remarks
 * esbuild を撤廃し vite に統合した結果、過去の挙動を担保するために
 * shebang 注入・SSR バンドル・Node ターゲット指定が継続して有効であることを検証する。
 */

import { describe, expect, it } from "vitest";
import serverConfig from "../../vite.config.server";

describe("vite.config.server.ts", () => {
	it("MCPサーバーバンドルの先頭にシェバン #!/usr/bin/env node を rollup banner で注入する", () => {
		const banner = (
			serverConfig.build?.rollupOptions?.output as
				| { banner?: string }
				| undefined
		)?.banner;
		expect(banner).toBe("#!/usr/bin/env node");
	});

	it("Node.js >= 22 LTS をターゲットにビルドする", () => {
		expect(serverConfig.build?.target).toBe("node22");
	});

	it("依存パッケージを全てバンドルする SSR モードを有効にする（esbuildのpackages:bundle相当）", () => {
		expect(serverConfig.build?.ssr).toBe(true);
		expect(serverConfig.ssr?.noExternal).toBe(true);
	});

	it("ESM 形式の単一エントリ index.js として library mode で出力する", () => {
		const lib = serverConfig.build?.lib;
		expect(lib).toBeDefined();
		expect((lib as { formats?: string[] }).formats).toEqual(["es"]);
		const fileName = (lib as { fileName?: () => string }).fileName;
		expect(typeof fileName === "function" && fileName()).toBe("index.js");
	});

	it("UI ビルド成果物を消さないため emptyOutDir を無効化する", () => {
		expect(serverConfig.build?.emptyOutDir).toBe(false);
	});

	it("出力先は dist ディレクトリ直下", () => {
		expect(serverConfig.build?.outDir).toBe("dist");
	});
});
