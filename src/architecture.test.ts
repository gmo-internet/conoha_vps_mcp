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
	// 参照: harness/patterns/naming-conventions.md, harness/patterns/file-structure.md
	describe("A-3/H-1: ファイル名はkebab-caseのみ", () => {
		const kebabPattern = /^[a-z0-9]+(-[a-z0-9]+)*(\.test)?\.ts$/;

		it.each(allTsFiles)("%s がkebab-caseであること", (file) => {
			const name = basename(file);
			expect(
				name,
				`"${name}" がkebab-caseではありません。修正: ファイル名を小文字・ハイフン区切りにリネームしてください（例: myFile.ts → my-file.ts）。参照: harness/patterns/naming-conventions.md`,
			).toMatch(kebabPattern);
		});
	});

	// 参照: harness/patterns/file-structure.md
	describe("A-2: テストファイルはソースと同一ディレクトリに配置", () => {
		it.each(
			testFiles,
		)("%s の同一ディレクトリに非テスト.tsが存在すること", (testFile) => {
			const dir = dirname(testFile);
			const siblingSources = sourceFiles.filter((f) => dirname(f) === dir);
			expect(
				siblingSources.length,
				`${testFile} の同一ディレクトリにソースファイルがありません。修正: テストファイルは対応するソースファイルと同じディレクトリに配置してください。参照: harness/patterns/file-structure.md`,
			).toBeGreaterThan(0);
		});
	});

	// 参照: harness/patterns/schema.md
	describe("C-1: スキーマのz.object()に.strict()が付与されている", () => {
		it.each(
			schemaFiles,
		)("%s のz.object()数が.strict()数以下であること", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			const objectCount = (content.match(/z\.object\(\s*\{/g) || []).length;
			const strictCount = (content.match(/\.strict\(\)/g) || []).length;
			expect(
				strictCount,
				`${file}: z.object()が${objectCount}個に対し.strict()が${strictCount}個です。修正: すべてのz.object({...})に.strict()をチェーンしてください（例: z.object({...}).strict()）。参照: harness/patterns/schema.md`,
			).toBeGreaterThanOrEqual(objectCount);
		});
	});

	// 参照: harness/patterns/import-rules.md
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
					`import "${importPath}" に.js拡張子がありません。修正: 相対インポートパスの末尾に.jsを追加してください（例: "./foo" → "./foo.js"）。参照: harness/patterns/import-rules.md`,
				).toMatch(/\.js$/);
			}
		});
	});

	// 参照: harness/patterns/import-rules.md, harness/patterns/test-patterns.md
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
				expect(
					m[1],
					`import "${m[1]}" に.jsが付いています。修正: テストファイルの相対インポートから.js拡張子を削除してください。参照: harness/patterns/import-rules.md`,
				).not.toMatch(/\.js$/);
			}
			for (const m of mockMatches) {
				expect(
					m[1],
					`vi.mock("${m[1]}") に.jsが付いています。修正: vi.mock()のパスから.js拡張子を削除してください。参照: harness/patterns/test-patterns.md`,
				).not.toMatch(/\.js$/);
			}
		});
	});

	// 参照: harness/patterns/jsdoc.md
	describe("F-1: 全ソースファイルに@packageDocumentationが含まれる", () => {
		it.each(sourceFiles)("%s に@packageDocumentationが含まれること", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			expect(
				content,
				`${file} に@packageDocumentationがありません。修正: ファイル先頭に /** @packageDocumentation ファイルの説明 */ JSDocブロックを追加してください。参照: harness/patterns/jsdoc.md`,
			).toContain("@packageDocumentation");
		});
	});

	// 参照: harness/patterns/naming-conventions.md
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
				expect(
					m[1],
					`関数名 "${m[1]}" がcamelCaseではありません。修正: 小文字始まりのcamelCaseにリネームしてください（例: GetData → getData）。参照: harness/patterns/naming-conventions.md`,
				).toMatch(camelCasePattern);
			}
		});
	});

	// 参照: harness/patterns/file-structure.md
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
				`${file} はfeatureディレクトリまたは許可されたルートファイルではありません。修正: src/features/openstack/{service}/ 配下に移動するか、srcルートの許可リスト（${allowedRootFiles.join(", ")}）を更新してください。参照: harness/patterns/file-structure.md`,
			).toBe(true);
		});
	});

	// 参照: harness/patterns/schema.md
	describe("C-2: スキーマフィールドに.describe()が付与されている", () => {
		it.each(
			schemaFiles,
		)("%s のスキーマフィールドに.describe()があること", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			const describeCount = (content.match(/\.describe\(/g) || []).length;
			expect(
				describeCount,
				`${file} にスキーマフィールドの.describe()がありません。修正: 各フィールドに.describe("日本語の説明")を追加してください（例: z.string().describe("サーバー名")）。参照: harness/patterns/schema.md`,
			).toBeGreaterThan(0);
		});
	});

	// 参照: harness/patterns/schema.md
	describe("C-3: スキーマ名が命名パターンに従う", () => {
		const schemaExportPattern = /export\s+const\s+([A-Za-z]+Schema)\b/g;
		const validNamePattern =
			/^(Create|Update|Operate|Attach|RemoteConsole)([A-Z][a-zA-Z]+)?RequestSchema$/;

		it.each(
			schemaFiles,
		)("%s のスキーマ名が{Action}{Resource}RequestSchema形式であること", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			const matches = [...content.matchAll(schemaExportPattern)];
			expect(
				matches.length,
				`${file} にexport constスキーマが見つかりません。修正: スキーマは export const {Action}{Resource}RequestSchema の形式でエクスポートしてください。参照: harness/patterns/schema.md`,
			).toBeGreaterThan(0);
			for (const m of matches) {
				expect(
					m[1],
					`スキーマ名 "${m[1]}" が命名パターンに従っていません。修正: {Create|Update|Operate|Attach|RemoteConsole}{Resource}RequestSchema 形式にリネームしてください。参照: harness/patterns/schema.md`,
				).toMatch(validNamePattern);
			}
		});
	});

	// 参照: harness/patterns/schema.md
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
					`${file} の z.enum() (行${lineIdx + 1}) にmessageオプションがありません。修正: z.enum([...], { message: "許可された値: ..." }) の形式でエラーメッセージを追加してください。参照: harness/patterns/schema.md`,
				).toContain("message");
			}
		});
	});

	// 参照: harness/patterns/response-formatter.md
	describe("D-1/D-2/D-3/D-4: カスタムレスポンスフォーマッターのパターン", () => {
		it.each(
			customFormatterFiles,
		)("%s にinterface定義があること (D-1)", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			expect(
				content,
				`${file} にinterface定義がありません。修正: APIレスポンス型のinterfaceを定義してフィールドをスリム化してください。参照: harness/patterns/response-formatter.md`,
			).toContain("interface ");
		});

		it.each(
			customFormatterFiles,
		)("%s にJSON.stringifyがあること (D-2)", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			expect(
				content,
				`${file} にJSON.stringifyがありません。修正: フォーマット結果をJSON.stringify()で文字列化して返却してください。参照: harness/patterns/response-formatter.md`,
			).toContain("JSON.stringify");
		});

		it.each(customFormatterFiles)("%s にtry/catchがあること (D-3)", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			expect(
				content,
				`${file} にtry/catchがありません。修正: フォーマッター関数をtry/catchで囲み、catchでJSON.stringify({ status, statusText, body: "<error>" })を返却してください。参照: harness/patterns/response-formatter.md`,
			).toMatch(/try\s*\{/);
			expect(
				content,
				`${file} にcatch節がありません。修正: try/catchブロックを追加してください。参照: harness/patterns/response-formatter.md`,
			).toMatch(/catch\s*\(/);
		});

		it.each(customFormatterFiles)("%s にsatisfiesがあること (D-4)", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			expect(
				content,
				`${file} にsatisfiesがありません。修正: フォーマット結果オブジェクトに satisfies キーワードで型安全性を確保してください。参照: harness/patterns/response-formatter.md`,
			).toContain("satisfies");
		});
	});

	// 参照: harness/patterns/test-patterns.md
	describe("E-3: vi.mock()使用テストにbeforeEachでclearAllMocksがある", () => {
		const testFilesWithMock = testFiles.filter((f) => {
			const content = readFileSync(join(SRC_DIR, f), "utf-8");
			return content.includes("vi.mock(");
		});

		it.each(testFilesWithMock)("%s にclearAllMocksがあること", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			expect(
				content,
				`${file} にclearAllMocksがありません。修正: beforeEach(() => { vi.clearAllMocks(); }) を追加してテスト間のモック状態をリセットしてください。参照: harness/patterns/test-patterns.md`,
			).toContain("clearAllMocks");
		});
	});

	// 参照: harness/patterns/test-patterns.md
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
					`it("${m[1].substring(0, 50)}...") に日本語が含まれていません。修正: テスト記述を日本語の詳細な1文で書いてください（例: it("正常なレスポンスをフォーマットできること", ...)）。参照: harness/patterns/test-patterns.md`,
				).toMatch(japanesePattern);
			}
		});
	});

	// 参照: harness/patterns/naming-conventions.md
	describe("H-3: エクスポートされた型名・インターフェース名はPascalCaseである", () => {
		const typePattern = /export\s+(?:type|interface)\s+([A-Za-z0-9_]+)/g;
		const pascalCasePattern = /^[A-Z][a-zA-Z0-9]*$/;

		it.each(
			sourceFiles,
		)("%s のエクスポート型名がPascalCaseであること", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			const matches = [...content.matchAll(typePattern)];
			for (const m of matches) {
				expect(
					m[1],
					`型名 "${m[1]}" がPascalCaseではありません。修正: 大文字始まりのPascalCaseにリネームしてください（例: serverResponse → ServerResponse）。参照: harness/patterns/naming-conventions.md`,
				).toMatch(pascalCasePattern);
			}
		});
	});

	// 参照: harness/patterns/jsdoc.md
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
				`${file}: JSDocブロック数 (${jsDocBlocks.length}) がエクスポート関数数 (${exportFuncs.length}) と一致しません。修正: 各export functionの直前に /** @param / @returns を含むJSDocブロックを追加してください。参照: harness/patterns/jsdoc.md`,
			).toBe(exportFuncs.length);

			for (const block of jsDocBlocks) {
				const jsdoc = block[0];
				expect(
					jsdoc.includes("@param") || jsdoc.includes("@returns"),
					`${file}: JSDocに@paramまたは@returnsがありません。修正: JSDocブロックに@paramまたは@returnsタグを追加してください。参照: harness/patterns/jsdoc.md`,
				).toBe(true);
			}
		});
	});

	// 参照: harness/patterns/client-module.md
	describe("B-4: クライアント関数名が{verb}{Resource}パターンに従う", () => {
		const featureClientFiles = sourceFiles.filter(
			(f) => basename(f).endsWith("-client.ts") && !f.includes("common/"),
		);
		const exportFunctionPattern =
			/export\s+(?:async\s+)?function\s+([a-zA-Z0-9_]+)/g;
		const clientFuncPattern =
			/^(get|create|delete|update|operate|set|upload)[A-Z][a-zA-Z]*(ByParam)?$/;

		it.each(
			featureClientFiles,
		)("%s のエクスポート関数名が{verb}{Resource}パターンに従うこと", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			const matches = [...content.matchAll(exportFunctionPattern)];
			expect(
				matches.length,
				`${file} にエクスポート関数が見つかりません。`,
			).toBeGreaterThan(0);
			for (const m of matches) {
				expect(
					m[1],
					`関数名 "${m[1]}" が命名パターンに従っていません。修正: {get|create|delete|update|operate}{Resource}(ByParam)? 形式にリネームしてください（例: fetchServer → getCompute）。参照: harness/patterns/client-module.md`,
				).toMatch(clientFuncPattern);
			}
		});
	});

	// 参照: harness/patterns/response-formatter.md
	describe("D-5: カスタムフォーマッターのcatchブロックがstatus/statusTextを含むJSON.stringifyを返す", () => {
		it.each(
			customFormatterFiles,
		)("%s のcatchブロックにstatus/statusTextを含むJSON.stringifyがあること", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			const catchIndex = content.indexOf("catch");
			expect(
				catchIndex,
				`${file} にcatchブロックが見つかりません。修正: try/catchを追加し、catchでJSON.stringify({ status, statusText, body: "<error>" })を返却してください。参照: harness/patterns/response-formatter.md`,
			).toBeGreaterThan(-1);
			const catchBlock = content.slice(catchIndex, catchIndex + 300);
			expect(
				catchBlock,
				`${file} のcatchブロックにJSON.stringifyがありません。修正: catch内でJSON.stringify({ status, statusText, body: "<error>" })を返却してください。参照: harness/patterns/response-formatter.md`,
			).toContain("JSON.stringify");
			expect(
				catchBlock,
				`${file} のcatchブロックにstatusがありません。修正: JSON.stringifyの引数にstatusを含めてください。参照: harness/patterns/response-formatter.md`,
			).toMatch(/status/);
			expect(
				catchBlock,
				`${file} のcatchブロックにstatusTextがありません。修正: JSON.stringifyの引数にstatusTextを含めてください。参照: harness/patterns/response-formatter.md`,
			).toMatch(/statusText/);
		});
	});

	// 参照: harness/patterns/naming-conventions.md
	describe("H-4: constants.tsの定数はUPPER_SNAKE_CASEである", () => {
		const constantsFiles = sourceFiles.filter(
			(f) => basename(f) === "constants.ts",
		);
		const upperSnakePattern = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/;
		const exportConstPattern = /export\s+const\s+([A-Za-z_][A-Za-z0-9_]*)/g;

		it.each(
			constantsFiles,
		)("%s のexport constがUPPER_SNAKE_CASEであること", (file) => {
			const content = readFileSync(join(SRC_DIR, file), "utf-8");
			const matches = [...content.matchAll(exportConstPattern)];
			expect(
				matches.length,
				`${file} にexport constが見つかりません。`,
			).toBeGreaterThan(0);
			for (const m of matches) {
				expect(
					m[1],
					`定数名 "${m[1]}" がUPPER_SNAKE_CASEではありません。修正: 大文字・アンダースコア区切りにリネームしてください（例: baseUrl → BASE_URL）。参照: harness/patterns/naming-conventions.md`,
				).toMatch(upperSnakePattern);
			}
		});
	});

	// 参照: harness/ESCALATION.md
	describe("ドキュメント整合性バリデーション", () => {
		const ESCALATION_FILE = "harness/ESCALATION.md";
		const PATTERNS_DIR = "harness/patterns";

		const escalationContent = readFileSync(ESCALATION_FILE, "utf-8");
		const claudeMdContent = readFileSync("CLAUDE.md", "utf-8");

		describe("CLAUDE.mdのルールIDがESCALATION.mdに存在すること", () => {
			const claudeRuleIdPattern = /\|\s*([A-Z]-\d+)\s*\|/g;
			const claudeRuleIds = [
				...new Set(
					[...claudeMdContent.matchAll(claudeRuleIdPattern)].map((m) => m[1]),
				),
			];

			it.each(
				claudeRuleIds,
			)("ルールID %s がESCALATION.mdに存在すること", (ruleId) => {
				expect(
					escalationContent,
					`ルールID "${ruleId}" がCLAUDE.mdに記載されていますがESCALATION.mdに見つかりません。修正: ESCALATION.mdのルール→レベル対応表に "${ruleId}" を追加してください。参照: harness/ESCALATION.md`,
				).toContain(`| ${ruleId} |`);
			});
		});

		describe("パターンファイルのrelated-rulesがESCALATION.mdに存在すること", () => {
			const patternFiles = readdirSync(PATTERNS_DIR).filter((f) =>
				f.endsWith(".md"),
			);

			const patternRuleEntries: { file: string; ruleId: string }[] = [];
			for (const file of patternFiles) {
				const content = readFileSync(join(PATTERNS_DIR, file), "utf-8");
				const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
				if (!frontmatterMatch) continue;
				const relatedMatch = frontmatterMatch[1].match(
					/related-rules:\s*\[([^\]]*)\]/,
				);
				if (!relatedMatch || !relatedMatch[1].trim()) continue;
				const ruleIds = relatedMatch[1].split(",").map((r) => r.trim());
				for (const ruleId of ruleIds) {
					if (ruleId) {
						patternRuleEntries.push({ file, ruleId });
					}
				}
			}

			it.each(
				patternRuleEntries,
			)("$file のrelated-rule $ruleId がESCALATION.mdに存在すること", ({
				file,
				ruleId,
			}) => {
				expect(
					escalationContent,
					`パターンファイル "${file}" のrelated-rulesに含まれる "${ruleId}" がESCALATION.mdに見つかりません。修正: ESCALATION.mdのルール→レベル対応表に "${ruleId}" を追加するか、パターンファイルのrelated-rulesを修正してください。参照: harness/ESCALATION.md`,
				).toContain(`| ${ruleId} |`);
			});
		});

		describe("ESCALATION.mdで参照されるルールIDに対応するパターンファイルが存在すること", () => {
			const patternFiles = readdirSync(PATTERNS_DIR).filter((f) =>
				f.endsWith(".md"),
			);

			const allPatternRuleIds = new Set<string>();
			for (const file of patternFiles) {
				const content = readFileSync(join(PATTERNS_DIR, file), "utf-8");
				const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
				if (!frontmatterMatch) continue;
				const relatedMatch = frontmatterMatch[1].match(
					/related-rules:\s*\[([^\]]*)\]/,
				);
				if (!relatedMatch || !relatedMatch[1].trim()) continue;
				const ruleIds = relatedMatch[1].split(",").map((r) => r.trim());
				for (const ruleId of ruleIds) {
					if (ruleId) allPatternRuleIds.add(ruleId);
				}
			}

			// カテゴリ I/J/K はCIツール専用（dependency-cruiser, knip, jscpd等）のため
			// パターンファイルのrelated-rulesには含まれない
			// カテゴリ L はメタ検証ルール（このテスト自身が執行）のため除外
			const CI_ONLY_CATEGORIES = new Set(["I", "J", "K", "L"]);

			const escalationRuleIdPattern = /\|\s*([A-Z]-\d+)\s*\|/g;
			const escalationRuleIds = [
				...new Set(
					[...escalationContent.matchAll(escalationRuleIdPattern)].map(
						(m) => m[1],
					),
				),
			].filter((id) => !CI_ONLY_CATEGORIES.has(id.split("-")[0]));

			it.each(
				escalationRuleIds,
			)("ESCALATION.mdのルールID %s に対応するパターンファイルが存在すること", (ruleId) => {
				expect(
					allPatternRuleIds.has(ruleId),
					`ESCALATION.mdのルールID "${ruleId}" を related-rules に含むパターンファイルが harness/patterns/ に見つかりません。修正: 対応するパターンファイルの related-rules に "${ruleId}" を追加してください。参照: harness/ESCALATION.md`,
				).toBe(true);
			});
		});
	});
});
