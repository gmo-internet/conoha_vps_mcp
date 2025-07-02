import { build } from "esbuild";

const config = {
	entryPoints: ["src/index.ts"],
	bundle: true,
	outfile: "dist/index.js",
	platform: "node",
	target: "node18",
	format: "esm",
	packages: "bundle",
	external: [],
	banner: {
		js: "#!/usr/bin/env node",
	},
	minify: true,
	sourcemap: false,
	tsconfig: "tsconfig.json",
	logLevel: "info",
	metafile: true,
};

build(config).catch(() => process.exit(1));
