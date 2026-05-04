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

	// Return the raw stdout; caller will compare against the original code
	// (which also ends with \n) so trailing-whitespace changes are detected.
	return result.stdout;
}

/**
 * Format all supported code blocks in a single markdown file using Biome.
 * Returns true if the file was modified.
 */
export function formatMarkdownFile(
	filePath: string,
	biomeBin?: string,
): boolean {
	const bin = biomeBin ?? findBiome();
	let content = readFileSync(filePath, "utf8");

	// Match fenced code blocks — allow up to 3 spaces of indentation on the
	// fence lines, which is valid per the CommonMark spec.
	const codeBlockRegex = /^[ \t]{0,3}```(\w+)\n([\s\S]*?)^[ \t]{0,3}```/gm;
	let updated = false;

	content = content.replace(
		codeBlockRegex,
		(match, lang: string, code: string) => {
			if (!SUPPORTED_LANGS.has(lang.toLowerCase())) {
				return match;
			}

			const formatted = formatCodeBlock(code, lang.toLowerCase(), bin);

			// Compare the full strings (both end with \n) so trailing-whitespace
			// differences within the block are also detected.
			if (formatted !== null && formatted !== code) {
				updated = true;
				return `\`\`\`${lang}\n${formatted.trimEnd()}\n\`\`\``;
			}

			return match;
		},
	);

	if (updated) {
		writeFileSync(filePath, content, "utf8");
	}

	return updated;
}

/**
 * Recursively find all markdown files under a given path.
 * If the path is a file, returns it (if it has a .md extension).
 * If the path is a directory, recurses into it (skipping node_modules and dotfiles).
 */
export function findMarkdownFiles(targetPath: string): string[] {
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
