import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.test.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "json-summary", "html", "lcov"],
			reportsDirectory: "./coverage",
			exclude: [
				"node_modules/**",
				"dist/**",
				"**/*.d.ts",
				"**/*.config.{js,ts}",
				"**/index.ts",
			],
		},
	},
});
