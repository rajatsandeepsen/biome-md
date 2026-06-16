import { readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";

export function findMarkdownFiles(targetPath: string): string[] {
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

export function findBiome(): string {
	const localBiome = join(process.cwd(), "node_modules", ".bin", "biome");
	try {
		statSync(localBiome);
		return localBiome;
	} catch {
		return "biome";
	}
}
