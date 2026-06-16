export const LANGUAGE_EXTENSION_MAP = new Map<string, string>([
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

export function getLangExt(lang: string): string {
	return LANGUAGE_EXTENSION_MAP.get(lang) ?? "js";
}

export const SUPPORTED_LANGS = new Set(LANGUAGE_EXTENSION_MAP.keys());

// Match fenced code blocks — allow up to 3 spaces of indentation on the
// fence lines, which is valid per the CommonMark spec. Capture the leading
// whitespace so it can be preserved in the replacement.
export const codeBlockRegex =
	/(^[ \t]{0,3})```(\w+)\r?\n([\s\S]*?)^\1```\r?(?=\n|$)/gm;
