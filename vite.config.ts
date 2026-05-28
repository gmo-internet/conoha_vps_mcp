import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import svgr from "vite-plugin-svgr";

export default defineConfig({
	// svgr は `?react` 付き import を React コンポーネントに変換する。
	// `?react` が無い SVG import は従来どおり URL を返す（top-bar のロゴ等）。
	plugins: [svgr(), react(), viteSingleFile()],
	build: {
		outDir: "dist/ui",
		rollupOptions: {
			input: {
				"mcp-app": resolve(__dirname, "src/apps/ui/mcp-app.html"),
			},
		},
	},
});
