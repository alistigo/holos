import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { parse as parseYaml } from "yaml";

const filepath = process.argv[2];

if (!filepath) {
  console.error("Usage: bun scripts/validate-file.ts <filepath>");
  console.error("Supported extensions: .json, .yaml, .yml");
  process.exit(1);
}

const abs = resolve(filepath);
let content: string;

try {
  content = readFileSync(abs, "utf-8");
} catch {
  console.error(`Cannot read file: ${abs}`);
  process.exit(1);
}

const ext = extname(abs).toLowerCase();

try {
  if (ext === ".json") {
    JSON.parse(content);
    console.log(`✓ ${filepath} is valid JSON`);
  } else if (ext === ".yaml" || ext === ".yml") {
    parseYaml(content);
    console.log(`✓ ${filepath} is valid YAML`);
  } else {
    console.error(`Unsupported extension "${ext}". Supported: .json, .yaml, .yml`);
    process.exit(1);
  }
} catch (err) {
  console.error(`✗ ${filepath} is invalid:`);
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
