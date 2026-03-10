import { readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC_DIR = "src";

const allTsFiles = readdirSync(SRC_DIR, { recursive: true })
	.map((f) => f.toString())
	.filter((f) => f.endsWith(".ts"));

const testFiles = allTsFiles.filter((f) => f.endsWith(".test.ts"));
const sourceFiles = allTsFiles.filter((f) => !f.endsWith(".test.ts"));
const schemaFiles = sourceFiles.filter((f) =>
	basename(f).endsWith("-schema.ts"),
);

describe("アーキテクチャ制約", () => {
	describe("A-3/H-1: ファイル名はkebab-caseのみ", () => {
		const kebabPattern = /^[a-z0-9]+(-[a-z0-9]+)*(\.test)?\.ts$/;

		it.each(allTsFiles)("%s がkebab-caseであること", (file) => {
			const name = basename(file);
			expect(name).toMatch(kebabPattern);
		});
	});

	describe("A-2: テストファイルはソースと同一ディレクトリに配置", () => {
		it.each(
			testFiles,
		)("%s の同一ディレクトリに非テスト.tsが存在すること", (testFile) => {
			const dir = dirname(testFile);
			const siblingSources = sourceFiles.filter((f) => dirname(f) === dir);
			expect(siblingSources.length).toBeGreaterThan(0);
		});
	});

	describe("C-1: スキーマのz.object()に.strict()が付与されている", () => {
		it.each(
			schemaFiles,
		)("%s のz.object()数が.strict()数以下であること", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			const objectCount = (content.match(/z\.object\(\s*\{/g) || []).length;
			const strictCount = (content.match(/\.strict\(\)/g) || []).length;
			expect(strictCount).toBeGreaterThanOrEqual(objectCount);
		});
	});

	describe("G-1: ソースファイルの相対インポートに.js拡張子がある", () => {
		const relativeImportPattern = /from\s+["'](\.[^"']+)["']/g;

		it.each(sourceFiles)("%s の相対インポートが.jsで終わること", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			const matches = [...content.matchAll(relativeImportPattern)];
			const relativeImports = matches
				.map((m) => m[1])
				.filter((p) => !p.endsWith(".json"));

			for (const importPath of relativeImports) {
				expect(
					importPath,
					`import "${importPath}" に.js拡張子がありません`,
				).toMatch(/\.js$/);
			}
		});
	});

	describe("E-5/E-6/G-4: テストファイルのインポート・モックパスに.jsがない", () => {
		const relativeImportPattern = /from\s+["'](\.[^"']+)["']/g;
		const viMockPattern = /vi\.mock\(\s*["'](\.[^"']+)["']/g;

		it.each(
			testFiles,
		)("%s のインポートとvi.mock()パスに.jsがないこと", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			const importMatches = [...content.matchAll(relativeImportPattern)];
			const mockMatches = [...content.matchAll(viMockPattern)];

			for (const m of importMatches) {
				expect(m[1], `import "${m[1]}" に.jsが付いています`).not.toMatch(
					/\.js$/,
				);
			}
			for (const m of mockMatches) {
				expect(m[1], `vi.mock("${m[1]}") に.jsが付いています`).not.toMatch(
					/\.js$/,
				);
			}
		});
	});

	describe("F-1: 全ソースファイルに@packageDocumentationが含まれる", () => {
		it.each(sourceFiles)("%s に@packageDocumentationが含まれること", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			expect(content).toContain("@packageDocumentation");
		});
	});

	describe("H-2: エクスポート関数名はcamelCaseである", () => {
		const exportFunctionPattern =
			/export\s+(?:async\s+)?function\s+([a-zA-Z0-9_]+)/g;
		const camelCasePattern = /^[a-z][a-zA-Z0-9]*$/;

		it.each(
			sourceFiles,
		)("%s のエクスポート関数名がcamelCaseであること", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			const matches = [...content.matchAll(exportFunctionPattern)];

			for (const m of matches) {
				expect(m[1], `関数名 "${m[1]}" がcamelCaseではありません`).toMatch(
					camelCasePattern,
				);
			}
		});
	});
});
