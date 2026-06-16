import { basename } from "node:path";
import { findBiome, findMarkdownFiles } from "./find";
import { formatMarkdownFile } from "./format";
import { getBiomeConfigFromRage } from "./rage";
import { trys } from "./utils";

const args = process.argv.slice(2);
const shouldPrintRage = args.includes("--rage");
const targets = args.filter((arg) => arg !== "--rage");

const bin = findBiome();

if (shouldPrintRage) {
	const biomeRageConfig = getBiomeConfigFromRage(bin);
	console.log(`Using Biome binary: ${bin}\n`);

	if (biomeRageConfig) console.log(`Biome rage: ${biomeRageConfig}`);
	else console.error("Biome rage: <unable to detect config line>");

	if (targets.length === 0) process.exit(0);
}

if (targets.length === 0) {
	console.error(
		"Usage: biome-md [--rage] <file-or-folder> [file-or-folder...]",
	);
	console.error("Format code blocks in Markdown files using Biome.\n");
	process.exit(1);
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
