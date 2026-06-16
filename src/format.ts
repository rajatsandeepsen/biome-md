import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import {
	codeBlockRegex,
	getLangExt,
	type MatchedRegexData,
	recreateCodeBlock,
	SUPPORTED_LANGS,
} from "./config";

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

export function formatMarkdownFile(filePath: string, biomeBin: string) {
	let content = readFileSync(filePath, "utf8");

	let updated = false;
	let totalBlocks = 0;
	let formattedBlocks = 0;
	let unchangedBlocks = 0;
	let skippedBlocks = 0;
	let ignoredBlocks = 0;

	content = content.replaceAll(codeBlockRegex, (original, ...rest) => {
		const [indent, fence, language, code] = rest as MatchedRegexData;

		totalBlocks += 1;

		if (fence.length > 3) {
			ignoredBlocks += 1;
			return original;
		}

		const normalizedLang = language.toLowerCase();

		if (!SUPPORTED_LANGS.has(normalizedLang)) {
			skippedBlocks += 1;
			return original;
		}

		const formattedCode = formatCodeBlock(code, normalizedLang, biomeBin);

		if (formattedCode !== null) {
			if (formattedCode !== code) {
				updated = true;
				formattedBlocks += 1;
				return recreateCodeBlock({
					language: normalizedLang,
					code: formattedCode.trimEnd(),
					indent,
					fence,
				});
			}
		}

		unchangedBlocks += 1;
		return original;
	});

	if (updated) {
		writeFileSync(filePath, content, "utf8");
	}

	return {
		updated,
		totalBlocks,
		formattedBlocks,
		unchangedBlocks,
		skippedBlocks,
		ignoredBlocks,
	};
}
