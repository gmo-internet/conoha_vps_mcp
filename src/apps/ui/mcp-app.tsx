/**
 * MCP App React エントリポイント
 *
 * mcp-app.html から <script type="module" src="./mcp-app.tsx"> として読み込まれる。
 * CSS と React Root のマウントのみを行い、ロジックは {@link App} に委譲する。
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app.js";
import "./mcp-app.css";

const root = document.getElementById("root");
if (!root) {
	throw new Error("#root element is missing in mcp-app.html");
}
createRoot(root).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
