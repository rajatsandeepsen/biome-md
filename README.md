<a href="https://github.com/rajatsandeepsen/biome-md">
    <img alt="cover" src="https://github.com/rajatsandeepsen/biome-md/blob/main/cover.png?raw=true" />
</a>

# biome-md

A simple CLI that format code-block inside your markdown files using [Biome](https://biomejs.dev).

## Usage

```bash
npx biome-md ./
```

```bash
npx biome-md ./README.md
npx biome-md ./docs
npx biome-md ./README.md ./docs ./CONTRIBUTING.md
```

`biome-md` finds all `.md` and `.mdx` files in the given paths (recursing into directories) and formats any fenced code blocks whose language is `js`, `javascript`, `ts`, `typescript`, `jsx`, `tsx`, or `json` using `biome format`.

## Example

````diff
```js
- function 
- 	greet(
- 		name) {console
- 			.log(`Hello, ${name}!`
- 	);
- 		}
```

```js
+ function greet(name) {
+ 	 console.log(`Hello, ${name}!`);
+ }
```
````

## Requirements

Biome must be available — either installed locally (`@biomejs/biome` in your project's `node_modules`) or on your `PATH`.

If you have a local Biome installation with `biome.json` or `biome.jsonc` files, `biome-md` will use it. Otherwise, it will fall back to whatever configuration comes with your `biome` CLI.

## Check active Biome config

When you need to verify which Biome setup is being picked up, run with `--rage`:

```bash
npx biome-md --rage
```

This prints extra Biome diagnostics (via `biome rage`) before formatting so you can inspect the config being used.

---

When you just want to see the active config Biome will be using, run with `--show-config`:

```bash
npx biome-md --show-config
```

This uses `biome rage` and we'll print the active config in your project if present.

## Ignore Code Blocks

Just use ```` instead of ```

Eg:
`````
````
(__)
oo )_______
|_/\       |\
    ||___  | \
    ||   W||
````
``````

````
```js
const dontFormatMe = please ( . . . . )
// Because it's a code-block inside code-block
```
````
