#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate NOTICE file from package-lock.json
 */
function generateNotice() {
	try {
		// Read package.json and package-lock.json
		const packageJson = JSON.parse(
			fs.readFileSync(path.join(__dirname, "../package.json"), "utf8"),
		);
		const packageLock = JSON.parse(
			fs.readFileSync(path.join(__dirname, "../package-lock.json"), "utf8"),
		);

		// Header with project information
		const header = `ConoHa VPS MCP
Copyright 2024 GMO Internet

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

This product includes software developed by third parties:

`;

		// Collect unique licenses and packages
		const licenses = new Map();

		// Get production dependencies from package.json
		const prodDeps = new Set([
			...Object.keys(packageJson.dependencies || {}),
			...Object.keys(packageJson.peerDependencies || {}),
			...Object.keys(packageJson.optionalDependencies || {}),
		]);

		// Process dependencies from package-lock.json
		for (const [pkgPath, pkg] of Object.entries(packageLock.packages || {})) {
			// Skip root package (empty path)
			if (!pkgPath) continue;

			// Extract package name from path for nested dependencies
			let pkgName = pkg.name;
			if (!pkgName && pkgPath.startsWith("node_modules/")) {
				// Extract name from path like "node_modules/@scope/package" or "node_modules/package"
				const pathParts = pkgPath.split("/");
				if (pathParts[1].startsWith("@")) {
					pkgName = `${pathParts[1]}/${pathParts[2]}`;
				} else {
					pkgName = pathParts[1];
				}
			}

			if (!pkgName) continue;

			// Include production dependencies and their transitive dependencies
			// Skip dev dependencies (marked with dev: true)
			if (pkg.dev === true) continue;

			// Include if it's a direct production dependency or any transitive dependency
			const isProductionDep =
				prodDeps.has(pkgName) || pkgPath.startsWith("node_modules/");

			if (!isProductionDep) continue;

			const license = pkg.license || "Unknown";
			const version = pkg.version || "Unknown";

			if (!licenses.has(license)) {
				licenses.set(license, []);
			}

			licenses.get(license).push(`${pkgName} (${version})`);
		}

		// Build notice content
		let noticeContent = header;

		// Sort licenses alphabetically
		const sortedLicenses = Array.from(licenses.entries()).sort();

		for (const [license, packages] of sortedLicenses) {
			noticeContent += `\n${license} Licensed:\n`;
			for (const pkg of packages.sort()) {
				noticeContent += `  - ${pkg}\n`;
			}
		}

		// Add footer
		noticeContent +=
			"\nFor the full license text of these dependencies, please refer to their respective repositories or the node_modules directory.\n";

		return noticeContent;
	} catch (error) {
		console.error("Error generating NOTICE file:", error);
		process.exit(1);
	}
}

// Generate and write NOTICE file
const noticeContent = generateNotice();
const noticePath = path.join(__dirname, "../NOTICE");

fs.writeFileSync(noticePath, noticeContent, "utf8");
console.log(`NOTICE file generated successfully at ${noticePath}`);
