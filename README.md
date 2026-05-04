# biome-md

Format code blocks in Markdown files using [Biome](https://biomejs.dev).

## Usage

```sh
npx biome-md ./README.md
npx biome-md ./docs
npx biome-md ./README.md ./docs ./CONTRIBUTING.md
```

`biome-md` finds all `.md` files in the given paths (recursing into directories) and formats any fenced code blocks whose language is `js`, `javascript`, `ts`, `typescript`, `jsx`, `tsx`, or `json` using `biome format`.

## Requirements

Biome must be available — either installed locally (`@biomejs/biome` in your project's `node_modules`) or on your `PATH`.
