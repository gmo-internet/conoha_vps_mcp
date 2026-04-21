import { resolve } from "node:path";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
	plugins: [viteSingleFile()],
	build: {
		outDir: "dist/ui",
		rollupOptions: {
			input: {
				"mcp-app": resolve(__dirname, "src/apps/ui/mcp-app.html"),
			},
		},
	},
});
