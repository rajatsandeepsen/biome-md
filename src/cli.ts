import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";

const trys = <T>(func: () => T): [null, T] | [Error, null] => {
	try {
		return [null, func()] as const;
	} catch (err) {
		return [err as Error, null] as const;
	}
};

const LANGUAGE_EXTENSION_MAP = new Map<string, string>([
	["js", "js"],
	["javascript", "js"],
	["ts", "ts"],
	["typescript", "ts"],
	["jsx", "jsx"],
	["tsx", "tsx"],
	["json", "json"],
	["jsonc", "jsonc"],
	["css", "css"],
	["scss", "scss"],
	["html", "html"],
	["graphql", "graphql"],
	["gql", "graphql"],
]);

const SUPPORTED_LANGS = new Set(LANGUAGE_EXTENSION_MAP.keys());

type FormatResult = {
	updated: boolean;
	totalBlocks: number;
	formattedBlocks: number;
	unchangedBlocks: number;
	skippedBlocks: number;
};

function findBiome(): string {
	const localBiome = join(process.cwd(), "node_modules", ".bin", "biome");
	try {
		statSync(localBiome);
		return localBiome;
	} catch {
		return "biome";
	}
}

function getLangExt(lang: string): string {
	return LANGUAGE_EXTENSION_MAP.get(lang) ?? "js";
}

function getBiomeConfigFromRage(biomeBin: string): string | null {
	const result = spawnSync(biomeBin, ["rage"], { encoding: "utf8" });

	if (result.error || result.status !== 0) {
		return null;
	}

	const output = `${result.stdout}\n${result.stderr}`;
	return output.trim();
}

function formatCodeBlock(
	code: string,
	lang: string,
	biomeBin: string,
): string | null {
	const ext = getLangExt(lang);
	const result = spawnSync(
		biomeBin,
		["format", `--stdin-file-path=stdin.${ext}`],
		{ input: code, encoding: "utf8" },
	);

	if (result.error || result.status !== 0) {
		return null;
	}

	return result.stdout;
}

function formatMarkdownFile(filePath: string, biomeBin: string): FormatResult {
	let content = readFileSync(filePath, "utf8");

	// Match fenced code blocks — allow up to 3 spaces of indentation on the
	// fence lines, which is valid per the CommonMark spec. Capture the leading
	// whitespace so it can be preserved in the replacement.
	const codeBlockRegex =
		/(^[ \t]{0,3})```(\w+)\r?\n([\s\S]*?)^\1```\r?(?=\n|$)/gm;
	let updated = false;
	let totalBlocks = 0;
	let formattedBlocks = 0;
	let unchangedBlocks = 0;
	let skippedBlocks = 0;

	content = content.replace(
		codeBlockRegex,
		(match, indent: string, lang: string, code: string) => {
			totalBlocks += 1;
			const normalizedLang = lang.toLowerCase();

			if (!SUPPORTED_LANGS.has(normalizedLang)) {
				skippedBlocks += 1;
				return match;
			}

			const formatted = formatCodeBlock(code, normalizedLang, biomeBin);

			// Compare the full strings (both end with \n) so trailing-whitespace
			// differences within the block are also detected.
			if (formatted !== null && formatted !== code) {
				updated = true;
				formattedBlocks += 1;
				return `${indent}\`\`\`${lang}\n${formatted.trimEnd()}\n${indent}\`\`\``;
			}

			unchangedBlocks += 1;
			return match;
		},
	);

	if (updated) {
		writeFileSync(filePath, content, "utf8");
	}

	return {
		updated,
		totalBlocks,
		formattedBlocks,
		unchangedBlocks,
		skippedBlocks,
	};
}

function findMarkdownFiles(targetPath: string): string[] {
	const stat = statSync(targetPath);

	if (stat.isFile()) {
		const ext = extname(targetPath).toLowerCase();
		return ext === ".md" || ext === ".mdx" ? [targetPath] : [];
	}

	if (stat.isDirectory()) {
		const files: string[] = [];
		for (const entry of readdirSync(targetPath, { withFileTypes: true })) {
			if (entry.name.startsWith(".") || entry.name === "node_modules") {
				continue;
			}
			files.push(...findMarkdownFiles(join(targetPath, entry.name)));
		}
		return files;
	}

	return [];
}

const args = process.argv.slice(2);
const shouldPrintRage = args.includes("--rage");
const targets = args.filter((arg) => arg !== "--rage");

if (targets.length === 0) {
	console.error(
		"Usage: biome-md [--rage] <file-or-folder> [file-or-folder...]",
		"Format code blocks in Markdown files using Biome.",
	);
	process.exit(1);
}

const bin = findBiome();
if (shouldPrintRage) {
	const biomeRageConfig = getBiomeConfigFromRage(bin);
	console.log(`Using Biome binary: ${bin}\n`);
	console.log(
		biomeRageConfig
			? `Biome rage: ${biomeRageConfig}`
			: "Biome rage: <unable to detect config line>",
	);
}

let hasError = false;

const summary = {
	targets: targets.length,
	formattedFiles: 0,
	unchangedFiles: 0,
	filesWithoutBlocks: 0,
	errorFiles: 0,
	formattedBlocks: 0,
	skippedBlocks: 0,
};

for (const target of targets) {
	console.log(`\n${target.replace("./", "")}`);

	const [error, files] = trys(() => findMarkdownFiles(target));

	if (error) {
		console.error(`✖  Cannot access path`);
		console.error(error);
		hasError = true;
		continue;
	}

	if (files.length === 0) {
		console.error(`⚠️  No markdown files found`);
		continue;
	}

	for (const file of files) {
		const fileName = basename(file);

		const [err, status] = trys(() => {
			const result = formatMarkdownFile(file, bin);
			summary.formattedBlocks += result.formattedBlocks;
			summary.skippedBlocks += result.skippedBlocks;

			if (result.updated) {
				summary.formattedFiles += 1;
				return "formatted";
			} else if (result.totalBlocks > 0) {
				summary.unchangedFiles += 1;
				return "already clean";
			} else {
				summary.filesWithoutBlocks += 1;
				return "no code blocks";
			}
		});

		if (err) {
			console.error(`▸ ${fileName} — error processing`);
			console.error(err.message);
			summary.errorFiles += 1;
			hasError = true;
		} else {
			console.log(`▸ ${fileName} — ${status}`);
		}
	}
}

console.log("\n");
console.log("Summary");
console.log(`▸ Files formatted	: ${summary.formattedFiles}`);
console.log(`▸ Files already clean	: ${summary.unchangedFiles}`);
console.log(`▸ Files without blocks	: ${summary.filesWithoutBlocks}`);
console.log(`▸ Blocks formatted	: ${summary.formattedBlocks}`);
console.log(`▸ Blocks skipped	: ${summary.skippedBlocks}`);
console.log(`▸ Files with errors	: ${summary.errorFiles}`);

console.log("\n");

if (hasError) {
	process.exit(1);
}
