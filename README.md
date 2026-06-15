# biome-md

Format code blocks in Markdown files using [Biome](https://biomejs.dev).

## Usage

```sh
npx biome-md ./README.md
npx biome-md ./docs
npx biome-md ./README.md ./docs ./CONTRIBUTING.md
```

`biome-md` finds all `.md` and `.mdx` files in the given paths (recursing into directories) and formats any fenced code blocks whose language is `js`, `javascript`, `ts`, `typescript`, `jsx`, `tsx`, or `json` using `biome format`.

## Requirements

Biome must be available — either installed locally (`@biomejs/biome` in your project's `node_modules`) or on your `PATH`.

If you have a local Biome installation with `biome.json` or `biome.jsonc` files, `biome-md` will use it. Otherwise, it will fall back to whatever configuration comes with your `biome` CLI.

## Check active Biome config

When you need to verify which Biome setup is being picked up, run with `--rage`:

```sh
npx biome-md --rage ./README.md
```

This prints extra Biome diagnostics (via `biome rage`) before formatting so you can inspect the config being used.
