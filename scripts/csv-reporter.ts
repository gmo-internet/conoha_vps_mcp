import { mkdirSync, writeFileSync } from "node:fs";
import type { TestModule } from "vitest/node";
import type { Reporter } from "vitest/reporters";

interface TestCaseData {
	fileName: string;
	suiteName: string;
	testName: string;
	category: string;
	functionalArea: string;
	priority: string;
	status: string;
	duration: number;
}

export class CSVReporter implements Reporter {
	private testCases: TestCaseData[] = [];

	onTestRunEnd(testModules: ReadonlyArray<TestModule>) {
		console.log("\n📊 Generating CSV test report...");

		for (const module of testModules) {
			this.processModule(module);
		}

		this.generateCSVReport();
	}

	private processModule(module: TestModule) {
		const fileName = module.moduleId
			.replace(process.cwd(), "")
			.replace(/\\/g, "/");

		for (const child of module.children) {
			if (child.type === "suite") {
				this.processSuite(child, fileName, "");
			} else if (child.type === "test") {
				this.processTest(child, fileName, "");
			}
		}
	}

	private processSuite(suite: any, fileName: string, parentSuite: string) {
		const currentSuite = parentSuite
			? `${parentSuite} > ${suite.name}`
			: suite.name;

		for (const child of suite.children) {
			if (child.type === "suite") {
				this.processSuite(child, fileName, currentSuite);
			} else if (child.type === "test") {
				this.processTest(child, fileName, currentSuite);
			}
		}
	}

	private processTest(test: any, fileName: string, suiteName: string) {
		const result = test.result();
		const diagnostic = test.diagnostic();

		const testCase: TestCaseData = {
			fileName,
			suiteName,
			testName: test.name,
			category: this.categorizeTest(test.name, fileName),
			functionalArea: this.determineFunctionalArea(fileName),
			status: this.getTestStatus(result),
			duration: diagnostic?.duration || 0,
			priority: this.assessPriority(test.name),
		};

		this.testCases.push(testCase);
	}

	private getTestStatus(result: any): string {
		if (!result || result.state === "pending") return "pending";

		switch (result.state) {
			case "passed":
				return "passed";
			case "failed":
				return "failed";
			case "skipped":
				return "skipped";
			default:
				return "unknown";
		}
	}

	private categorizeTest(testName: string, fileName: string): string {
		const name = testName.toLowerCase();

		if (
			name.includes("エラー") ||
			name.includes("例外") ||
			name.includes("失敗") ||
			name.includes("error") ||
			name.includes("exception")
		) {
			return "ErrorHandling";
		}
		if (
			name.includes("パフォーマンス") ||
			name.includes("大量") ||
			name.includes("長い") ||
			name.includes("performance")
		) {
			return "Performance";
		}
		if (fileName.includes("schema")) {
			return "Schema";
		}
		if (
			name.includes("api") ||
			name.includes("呼び出") ||
			name.includes("リクエスト") ||
			name.includes("レスポンス")
		) {
			return "API";
		}
		if (
			name.includes("検証") ||
			name.includes("許可") ||
			name.includes("拒否")
		) {
			return "Validation";
		}
		if (name.includes("モック") || name.includes("mock")) {
			return "Mock";
		}

		return "Functional";
	}

	private determineFunctionalArea(fileName: string): string {
		if (fileName.includes("/compute/")) return "Compute";
		if (fileName.includes("/network/")) return "Network";
		if (fileName.includes("/volume/")) return "Volume";
		if (fileName.includes("/image/")) return "Image";
		if (fileName.includes("/common/")) return "Common";
		if (fileName.includes("index.test.ts")) return "Core";

		return "General";
	}

	private assessPriority(testName: string): string {
		const name = testName.toLowerCase();

		// Critical: Error handling, security
		if (
			name.includes("エラー") ||
			name.includes("例外") ||
			name.includes("セキュリティ")
		) {
			return "Critical";
		}

		// Important: Core functionality
		if (
			name.includes("作成") ||
			name.includes("削除") ||
			name.includes("api")
		) {
			return "Important";
		}

		// Normal: Everything else
		return "Normal";
	}

	private generateCSVReport() {
		const csvHeader = [
			"Category",
			"FunctionalArea",
			"SuiteName",
			"TestName",
			"Priority",
			"Status",
			"Duration(ms)",
		].join(",");

		const csvRows = this.testCases.map((testCase) =>
			[
				testCase.category,
				testCase.functionalArea,
				`"${testCase.suiteName}"`,
				`"${testCase.testName}"`,
				testCase.priority,
				testCase.status,
				testCase.duration,
			].join(","),
		);

		const csvContent = [csvHeader, ...csvRows].join("\n");

		// Ensure reports directory exists
		const reportDir = "./reports";
		mkdirSync(reportDir, { recursive: true });

		const csvFilePath = `${reportDir}/test-result.csv`;
		writeFileSync(csvFilePath, csvContent, "utf-8");

		console.log(`✅ CSV report generated: ${csvFilePath}`);
		console.log(`📈 Total test cases: ${this.testCases.length}`);

		// Summary statistics
		const stats = this.generateStats();
		console.log("\n📊 Test Summary:");
		console.log(`  - Passed: ${stats.passed}`);
		console.log(`  - Failed: ${stats.failed}`);
		console.log(`  - Skipped: ${stats.skipped}`);
		console.log(`  - Critical Priority: ${stats.critical}`);
	}

	private generateStats() {
		return {
			passed: this.testCases.filter((t) => t.status === "passed").length,
			failed: this.testCases.filter((t) => t.status === "failed").length,
			skipped: this.testCases.filter((t) => t.status === "skipped").length,
			critical: this.testCases.filter((t) => t.priority === "Critical").length,
		};
	}
}
