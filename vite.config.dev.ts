import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import svgr from "vite-plugin-svgr";

// 認証情報なしで MCP App UI をプレビューするための開発専用 Vite 設定。
// `npm run dev:ui` で起動し、ブラウザでサンプルデータの全画面を確認できる。
// 本番ビルド（vite.config.ts）とは独立しており、app.tsx / mcp-bridge.ts は無改変。

const mockBridge = resolve(__dirname, "src/apps/ui/mock-bridge.ts");

// app.tsx の `./mcp-bridge.js` import を mock-bridge.ts へ差し替えるプラグイン。
// 相対 alias は不安定なため resolveId で specifier を捕捉する。
const mockBridgePlugin: Plugin = {
	name: "conoha-mock-bridge",
	enforce: "pre",
	resolveId(source) {
		if (source === "./mcp-bridge.js" || source.endsWith("/mcp-bridge.js")) {
			return mockBridge;
		}
		return null;
	},
};

export default defineConfig({
	plugins: [mockBridgePlugin, svgr(), react()],
	server: { open: "/src/apps/ui/mcp-app.dev.html" },
});
