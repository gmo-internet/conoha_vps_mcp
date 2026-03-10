/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
	forbidden: [
		{
			name: "no-circular",
			severity: "error",
			comment: "Circular dependencies are not allowed",
			from: {},
			to: { circular: true },
		},
		{
			name: "no-cross-feature-imports",
			severity: "error",
			comment: "Feature modules must not import from each other directly",
			from: {
				path: "^src/features/openstack/(compute|network|image|volume|storage)/",
			},
			to: {
				path: "^src/features/openstack/(compute|network|image|volume|storage)/",
				pathNot: "$1",
			},
		},
		{
			name: "no-feature-to-root",
			severity: "warn",
			comment:
				"Feature modules should not import from src/ root files (except types.ts)",
			from: { path: "^src/features/" },
			to: {
				path: "^src/(index|tool-routing-tables|tool-descriptions)\\.ts$",
			},
		},
	],
	options: {
		doNotFollow: { path: "node_modules" },
		tsPreCompilationDeps: true,
		tsConfig: { fileName: "tsconfig.json" },
		enhancedResolveOptions: {
			exportsFields: ["exports"],
			conditionNames: ["import", "require", "node", "default"],
		},
	},
};
