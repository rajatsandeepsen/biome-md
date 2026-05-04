import { formatMarkdownFile, findMarkdownFiles } from "./index.js";

const args = process.argv.slice(2);

if (args.length === 0) {
	console.error("Usage: biome-md <file-or-folder> [file-or-folder...]");
	process.exit(1);
}

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
			const updated = formatMarkdownFile(file);
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
