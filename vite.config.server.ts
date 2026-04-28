import { resolve } from "node:path";
import { defineConfig } from "vite";

/**
 * MCPサーバー本体（dist/index.js）のビルド設定
 *
 * @remarks
 * Node.js CLI として直接実行されるため:
 *   - shebang `#!/usr/bin/env node` を rollup banner で先頭に注入
 *   - SSR ビルド + `noExternal: true` で全依存をインライン化（esbuildの`packages:"bundle"`相当）
 *   - target は engines の Node.js >= 22 に合わせ ES2024 構文を維持
 *   - 出力ファイル名は固定（library mode の自動命名を上書き）
 */
export default defineConfig({
	build: {
		target: "node22",
		minify: true,
		outDir: "dist",
		// UI ビルドの成果物を消さないため。CI では server ビルドを先に走らせる
		emptyOutDir: false,
		ssr: true,
		lib: {
			entry: resolve(__dirname, "src/index.ts"),
			formats: ["es"],
			fileName: () => "index.js",
		},
		rollupOptions: {
			output: {
				banner: "#!/usr/bin/env node",
			},
		},
	},
	ssr: {
		noExternal: true,
	},
});
