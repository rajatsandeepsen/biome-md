import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, extname } from "node:path";

const SUPPORTED_LANGS = new Set([
	"js",
	"javascript",
	"ts",
	"typescript",
	"json",
	"jsx",
	"tsx",
]);

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
	if (lang === "json") return "json";
	if (lang === "tsx") return "tsx";
	if (lang === "jsx") return "jsx";
	if (lang.includes("ts")) return "ts";
	return "js";
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

function formatMarkdownFile(filePath: string, biomeBin: string): boolean {
	let content = readFileSync(filePath, "utf8");

	// Match fenced code blocks — allow up to 3 spaces of indentation on the
	// fence lines, which is valid per the CommonMark spec. Capture the leading
	// whitespace so it can be preserved in the replacement.
	const codeBlockRegex = /(^[ \t]{0,3})```(\w+)\n([\s\S]*?)^\1```/gm;
	let updated = false;

	content = content.replace(
		codeBlockRegex,
		(match, indent: string, lang: string, code: string) => {
			if (!SUPPORTED_LANGS.has(lang.toLowerCase())) {
				return match;
			}

			const formatted = formatCodeBlock(code, lang.toLowerCase(), biomeBin);

			// Compare the full strings (both end with \n) so trailing-whitespace
			// differences within the block are also detected.
			if (formatted !== null && formatted !== code) {
				updated = true;
				return `${indent}\`\`\`${lang}\n${formatted.trimEnd()}\n${indent}\`\`\``;
			}

			return match;
		},
	);

	if (updated) {
		writeFileSync(filePath, content, "utf8");
	}

	return updated;
}

function findMarkdownFiles(targetPath: string): string[] {
	const stat = statSync(targetPath);

	if (stat.isFile()) {
		return extname(targetPath).toLowerCase() === ".md" ? [targetPath] : [];
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

if (args.length === 0) {
	console.error(
		"Usage: biome-md <file-or-folder> [file-or-folder...]\nFormat code blocks in Markdown files using Biome.",
	);
	process.exit(1);
}

const bin = findBiome();
let hasError = false;

for (const target of args) {
	let files: string[];
	try {
		files = findMarkdownFiles(target);
	} catch (error) {
		console.error(`Cannot access path "${target}":`, (error as Error).message);
		hasError = true;
		continue;
	}

	if (files.length === 0) {
		console.warn(`No markdown files found: ${target}`);
		continue;
	}

	for (const file of files) {
		try {
			const updated = formatMarkdownFile(file, bin);
			if (updated) {
				console.log(`Formatted: ${file}`);
			} else {
				console.log(`No changes: ${file}`);
			}
		} catch (error) {
			console.error(`Error processing "${file}":`, (error as Error).message);
			hasError = true;
		}
	}
}

if (hasError) {
	process.exit(1);
}

