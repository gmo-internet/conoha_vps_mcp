import { mkdirSync, writeFileSync } from "node:fs";
import type { File, Reporter, Task } from "vitest";

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

	onFinished(files: File[] = []) {
		console.log("\n📊 Generating CSV test report...");

		for (const file of files) {
			this.processFile(file);
		}

		this.generateCSVReport();
	}

	private processFile(file: File) {
		const fileName = file.filepath
			.replace(process.cwd(), "")
			.replace(/\\/g, "/");

		if (file.tasks) {
			for (const task of file.tasks) {
				this.processTask(task, fileName, "");
			}
		}
	}

	private processTask(task: Task, fileName: string, parentSuite: string) {
		if (task.type === "suite") {
			const currentSuite = parentSuite
				? `${parentSuite} > ${task.name}`
				: task.name;

			if (task.tasks) {
				for (const childTask of task.tasks) {
					this.processTask(childTask, fileName, currentSuite);
				}
			}
		} else if (task.type === "test") {
			const testCase: TestCaseData = {
				fileName,
				suiteName: parentSuite,
				testName: task.name,
				category: this.categorizeTest(task.name, fileName),
				functionalArea: this.determineFunctionalArea(fileName),
				status: this.getTaskStatus(task),
				duration: task.result?.duration || 0,
				priority: this.assessPriority(task.name, fileName),
			};

			this.testCases.push(testCase);
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

	private getTaskStatus(task: Task): string {
		if (!task.result) return "pending";

		switch (task.result.state) {
			case "pass":
				return "passed";
			case "fail":
				return "failed";
			case "skip":
				return "skipped";
			case "todo":
				return "todo";
			default:
				return "unknown";
		}
	}

	private assessPriority(testName: string, fileName: string): string {
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
