import { defineConfig } from "tsdown";

export default defineConfig([
	{
		entry: ["src/index.ts"],
		format: ["cjs", "esm"],
		dts: {
			sourcemap: false,
		},
	},
	{
		entry: ["src/cli.ts"],
		format: ["esm"],
		dts: false,
		banner: {
			js: "#!/usr/bin/env node",
		},
	},
]);
