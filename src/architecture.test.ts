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
const customFormatterFiles = sourceFiles.filter(
	(f) =>
		basename(f).endsWith("-response-formatter.ts") && !f.includes("common/"),
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

	describe("A-1: ソースファイルはfeatureディレクトリまたはsrcルートに配置", () => {
		const allowedRootFiles = [
			"index.ts",
			"types.ts",
			"tool-routing-tables.ts",
			"tool-descriptions.ts",
		];
		const featurePattern = /^features\/openstack\//;

		it.each(sourceFiles)("%s が許可されたパスに配置されていること", (file) => {
			const isRootFile = !file.includes("/") && allowedRootFiles.includes(file);
			const isFeatureFile = featurePattern.test(file);
			expect(
				isRootFile || isFeatureFile,
				`${file} はfeatureディレクトリまたは許可されたルートファイルではありません`,
			).toBe(true);
		});
	});

	describe("C-2: スキーマフィールドに.describe()が付与されている", () => {
		it.each(
			schemaFiles,
		)("%s のスキーマフィールドに.describe()があること", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			const describeCount = (content.match(/\.describe\(/g) || []).length;
			expect(
				describeCount,
				"スキーマファイルに.describe()が1つもありません",
			).toBeGreaterThan(0);
		});
	});

	describe("C-3: スキーマ名が命名パターンに従う", () => {
		const schemaExportPattern = /export\s+const\s+([A-Za-z]+Schema)\b/g;
		const validNamePattern =
			/^(Create|Update|Operate|Attach|RemoteConsole)([A-Z][a-zA-Z]+)?RequestSchema$/;

		it.each(
			schemaFiles,
		)("%s のスキーマ名が{Action}{Resource}RequestSchema形式であること", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			const matches = [...content.matchAll(schemaExportPattern)];
			expect(matches.length).toBeGreaterThan(0);
			for (const m of matches) {
				expect(
					m[1],
					`スキーマ名 "${m[1]}" が命名パターンに従っていません`,
				).toMatch(validNamePattern);
			}
		});
	});

	describe("C-4: z.enum()にmessageオプションが付与されている", () => {
		it.each(
			schemaFiles,
		)("%s のz.enum()にmessageオプションがあること", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			const lines = content.split("\n");
			const enumLineIndices: number[] = [];
			for (let i = 0; i < lines.length; i++) {
				if (lines[i].includes(".enum(")) {
					enumLineIndices.push(i);
				}
			}
			for (const lineIdx of enumLineIndices) {
				const nearby = lines.slice(lineIdx, lineIdx + 5).join("\n");
				expect(
					nearby,
					`z.enum() (行${lineIdx + 1}) にmessageオプションがありません`,
				).toContain("message");
			}
		});
	});

	describe("D-1/D-2/D-3/D-4: カスタムレスポンスフォーマッターのパターン", () => {
		it.each(
			customFormatterFiles,
		)("%s にinterface定義があること (D-1)", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			expect(content).toContain("interface ");
		});

		it.each(
			customFormatterFiles,
		)("%s にJSON.stringifyがあること (D-2)", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			expect(content).toContain("JSON.stringify");
		});

		it.each(customFormatterFiles)("%s にtry/catchがあること (D-3)", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			expect(content).toMatch(/try\s*\{/);
			expect(content).toMatch(/catch\s*\(/);
		});

		it.each(customFormatterFiles)("%s にsatisfiesがあること (D-4)", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			expect(content).toContain("satisfies");
		});
	});

	describe("E-3: vi.mock()使用テストにbeforeEachでclearAllMocksがある", () => {
		const testFilesWithMock = testFiles.filter((f) => {
			const content = readFileSync(join(SRC_DIR, f), "utf-8");
			return content.includes("vi.mock(");
		});

		it.each(testFilesWithMock)("%s にclearAllMocksがあること", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			expect(content).toContain("clearAllMocks");
		});
	});

	describe("E-4: テストのit()記述が日本語で書かれている", () => {
		const japanesePattern = /[\u3000-\u9FFF\uF900-\uFAFF]/;
		const itPattern = /\bit\(\s*["'`]([^"'`]+)["'`]/g;
		const nonArchTestFiles = testFiles.filter(
			(f) => !f.endsWith("architecture.test.ts"),
		);

		it.each(nonArchTestFiles)("%s のit()記述に日本語が含まれること", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			const matches = [...content.matchAll(itPattern)];
			for (const m of matches) {
				expect(
					m[1],
					`it("${m[1].substring(0, 50)}...") に日本語が含まれていません`,
				).toMatch(japanesePattern);
			}
		});
	});

	describe("H-3: エクスポートされた型名・インターフェース名はPascalCaseである", () => {
		const typePattern = /export\s+(?:type|interface)\s+([A-Za-z0-9_]+)/g;
		const pascalCasePattern = /^[A-Z][a-zA-Z0-9]*$/;

		it.each(
			sourceFiles,
		)("%s のエクスポート型名がPascalCaseであること", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			const matches = [...content.matchAll(typePattern)];
			for (const m of matches) {
				expect(m[1], `型名 "${m[1]}" がPascalCaseではありません`).toMatch(
					pascalCasePattern,
				);
			}
		});
	});

	describe("F-2: エクスポート関数にJSDocの@paramまたは@returnsがある", () => {
		const funcWithJsDocPattern =
			/\/\*\*[\s\S]*?\*\/\s*\nexport\s+(?:async\s+)?function/g;
		const exportFuncPattern = /export\s+(?:async\s+)?function\s+[a-zA-Z0-9_]+/g;

		it.each(
			sourceFiles,
		)("%s のエクスポート関数にJSDocの@param/@returnsがあること", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			const exportFuncs = [...content.matchAll(exportFuncPattern)];
			if (exportFuncs.length === 0) return;

			const jsDocBlocks = [...content.matchAll(funcWithJsDocPattern)];
			expect(
				jsDocBlocks.length,
				`JSDocブロック数 (${jsDocBlocks.length}) がエクスポート関数数 (${exportFuncs.length}) と一致しません`,
			).toBe(exportFuncs.length);

			for (const block of jsDocBlocks) {
				const jsdoc = block[0];
				expect(
					jsdoc.includes("@param") || jsdoc.includes("@returns"),
					"JSDocに@paramまたは@returnsがありません",
				).toBe(true);
			}
		});
	});
});
