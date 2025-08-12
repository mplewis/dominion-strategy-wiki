import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const headerPath = join(process.cwd(), "src", "wiki", "header.txt");
const jsPath = join(process.cwd(), "dist", "common.js");

const header = readFileSync(headerPath, "utf8");
const js = readFileSync(jsPath, "utf8");
const headerLines = header.split("\n").length;
const newJs = `${header}\n${js}`;
writeFileSync(jsPath, newJs);
process.stdout.write(`Added header (${headerLines} lines)\n`);
