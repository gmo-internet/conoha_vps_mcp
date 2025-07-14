import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseCSV(csvContent) {
	const lines = csvContent.trim().split("\n");
	const headers = parseLine(lines[0]);
	const rows = lines.slice(1).map((line) => parseLine(line));

	return { headers, rows };
}

function parseLine(line) {
	const result = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];

		if (char === '"') {
			if (inQuotes && line[i + 1] === '"') {
				// Escaped quote
				current += '"';
				i++; // Skip next quote
			} else {
				// Toggle quote state
				inQuotes = !inQuotes;
			}
		} else if (char === "," && !inQuotes) {
			// Field separator
			result.push(current.trim());
			current = "";
		} else {
			current += char;
		}
	}

	// Add the last field
	result.push(current.trim());

	return result;
}

function generateMarkdownTable(csvData) {
	const { headers, rows } = csvData;

	// Create table header
	let markdown =
		"## 📊 Test Results Report\n\n<details>\n<summary>Click to expand</summary>\n";
	markdown += `| ${headers.join(" | ")} |\n`;
	markdown += `| ${headers.map(() => "----------").join("|")} |\n`;

	// Add rows with status emojis
	for (const row of rows) {
		const [
			category,
			functionalArea,
			suiteName,
			priority,
			testName,
			status,
			duration,
		] = row;

		console.log("duration", duration);

		markdown += `| ${category} | ${functionalArea} | ${suiteName} | ${priority} | ${testName} | ${status} | ${duration} |\n`;
	}

	// Add summary statistics
	const totalTests = rows.length;
	const passedTests = rows.filter((row) => row[4] === "passed").length;
	const failedTests = rows.filter((row) => row[4] === "failed").length;
	const skippedTests = rows.filter((row) => row[4] === "skipped").length;

	markdown += "</details>\n---\n\n";
	markdown += "### 📈 Summary\n";
	markdown += `- **Total Tests:** ${totalTests}\n`;
	markdown += `- **✅ Passed:** ${passedTests}\n`;
	markdown += `- **❌ Failed:** ${failedTests}\n`;
	markdown += `- **⏭️ Skipped:** ${skippedTests}\n`;

	if (failedTests === 0) {
		markdown += "- **Status:** 🎉 All tests passed!\n";
	} else {
		markdown += "- **Status:** ⚠️ Some tests failed\n";
	}

	return markdown;
}

function main() {
	const csvFilePath = path.join(process.cwd(), "reports", "test-result.csv");
	const outputPath = path.join(process.cwd(), "test-report.md");

	try {
		if (!fs.existsSync(csvFilePath)) {
			console.error("CSV file not found:", csvFilePath);
			process.exit(1);
		}

		const csvContent = fs.readFileSync(csvFilePath, "utf8");
		const csvData = parseCSV(csvContent);
		const markdown = generateMarkdownTable(csvData);

		fs.writeFileSync(outputPath, markdown, "utf8");

		console.log("Markdown report generated successfully!");
		console.log("Report content:");
		console.log(markdown);
	} catch (error) {
		console.error("Error generating markdown report:", error);
		process.exit(1);
	}
}

// Always run main when this script is executed
main();

export { parseCSV, generateMarkdownTable };
