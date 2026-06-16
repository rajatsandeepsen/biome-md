import { spawnSync } from "node:child_process";

export function getBiomeConfigFromRage(biomeBin: string): string | null {
	const result = spawnSync(biomeBin, ["rage"], { encoding: "utf8" });

	if (result.error || result.status !== 0) {
		return null;
	}

	const output = `${result.stdout}\n${result.stderr}`;
	return output.trim();
}

export const extractConfigPath = (
	biomeRageConfig: NonNullable<ReturnType<typeof getBiomeConfigFromRage>>,
) => {
	const key = "Path:";

	const configLine = biomeRageConfig
		.split("\n")
		.find((line) => line.includes(key));

	if (!configLine) return null;

	const path = configLine.replace(key, "").trim();

	if (path === "unset") return null;

	return path;
};
