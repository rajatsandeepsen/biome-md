import { spawnSync } from "node:child_process";

export function getBiomeConfigFromRage(biomeBin: string): string | null {
	const result = spawnSync(biomeBin, ["rage"], { encoding: "utf8" });

	if (result.error || result.status !== 0) {
		return null;
	}

	const output = `${result.stdout}\n${result.stderr}`;
	return output.trim();
}
