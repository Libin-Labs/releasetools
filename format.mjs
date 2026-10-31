import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const require = createRequire(resolve(root, "Form/package.json"));
const ts = require("typescript");
const catalog = JSON.parse(await readFile(resolve(here, "catalog.json")));
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
for (const project of catalog) {
  const path = resolve(root, project.folder, "src/index.tsx");
  const text = await readFile(path, "utf8");
  const file = ts.createSourceFile(
    path,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  if (file.parseDiagnostics.length)
    throw new Error(`Cannot format invalid syntax: ${project.folder}`);
  await writeFile(path, printer.printFile(file));
  console.log(`Formatted ${project.folder}`);
}
