import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { codeBlockRegex, getLangExt, SUPPORTED_LANGS } from "./config";

type FormatResult = {
	updated: boolean;
	totalBlocks: number;
	formattedBlocks: number;
	unchangedBlocks: number;
	skippedBlocks: number;
};

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

export function formatMarkdownFile(
	filePath: string,
	biomeBin: string,
): FormatResult {
	let content = readFileSync(filePath, "utf8");

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
