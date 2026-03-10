/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
	testRunner: "vitest",
	vitest: {
		configFile: "vitest.config.ts",
	},
	mutate: [
		"src/**/*.ts",
		"!src/**/*.test.ts",
		"!src/index.ts",
		"!src/tool-descriptions.ts",
	],
	reporters: ["html", "clear-text", "progress", "json"],
	htmlReporter: {
		fileName: "reports/mutation/index.html",
	},
	jsonReporter: {
		fileName: "reports/mutation/mutation-report.json",
	},
	thresholds: {
		high: 80,
		low: 60,
		break: 40,
	},
	timeoutMS: 30000,
	concurrency: 2,
	ignorePatterns: [".cursor", "issues", "harness", "skills", ".github"],
};
