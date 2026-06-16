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
	/(?<indent>^[ \t]{0,3})(?<fence>`{3,})(?<language>\w+)\r?\n(?<code>[\s\S]*?)^\k<indent>\k<fence>\r?(?=\n|$)/gm;

export type MatchedRegexData = [
	indent: string,
	fence: string,
	language: string,
	code: string,
];

export const recreateCodeBlock = ({
	indent,
	fence,
	language,
	code,
}: Record<"indent" | "fence" | "language" | "code", string>) => {
	return `${indent}${fence}${language}\n${code}\n${indent}${fence}`;
};
