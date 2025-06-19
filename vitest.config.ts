import path from "node:path";
import { defineConfig } from "vitest/config";
import { CSVReporter } from "./scripts/csv-reporter";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.test.ts"],
		reporters: ["default", new CSVReporter()],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "json-summary", "html", "lcov"],
			reportsDirectory: "./reports/coverage",
			exclude: [
				"node_modules/**",
				"dist/**",
				"**/*.d.ts",
				"**/*.config.{js,ts}",
				"**/index.ts",
				".github/**",
				"scripts/**",
			],
		},
	},
});
