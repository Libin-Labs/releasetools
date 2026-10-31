import assert from "node:assert/strict";
import { readFile, readdir, access, mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const catalog = JSON.parse(await readFile(resolve(here, "catalog.json")));
const fence = String.fromCodePoint(96).repeat(3);
const results = [];
async function localImports(directory, folder) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await localImports(path, folder);
    else if (/\.(tsx?|mjs|js)$/.test(entry.name)) {
      const text = await readFile(path, "utf8");
      for (const other of catalog) {
        if (other.folder === folder) continue;
        assert.equal(
          text.includes(`../${other.folder}/`),
          false,
          `Cross-project import: ${path}`,
        );
      }
      assert.equal(
        text.includes("../ReleaseTools/"),
        false,
        `Shared tooling dependency: ${path}`,
      );
    }
  }
}
for (const project of catalog) {
  const folder = resolve(root, project.folder);
  const pkg = JSON.parse(
    await readFile(resolve(folder, "package.json"), "utf8"),
  );
  const text = await readFile(resolve(folder, "README.md"), "utf8");
  const lock = JSON.parse(
    await readFile(resolve(folder, "package-lock.json"), "utf8"),
  );
  assert.equal(pkg.name, `@lp-labs/${project.name}`);
  assert.equal(lock.name, pkg.name);
  assert.equal(Object.keys(pkg.dependencies ?? {}).length, 0);
  assert.ok(text.startsWith(`# ${pkg.name}`));
  for (const section of [
    "Installation",
    "Quick Start",
    "API",
    "Security And Limits",
    "Support",
  ])
    assert.ok(text.includes(`## ${section}`));
  assert.ok(text.includes(`npm install ${pkg.name}`));
  assert.ok(text.includes("https://www.paypal.me/LibinPrasanth"));
  assert.ok(text.includes("https://www.linkedin.com/in/libinprasanth/"));
  const blocks = text.split(fence);
  assert.equal(blocks.length % 2, 1);
  const require = createRequire(resolve(folder, "package.json"));
  assert.ok(require.resolve("react").startsWith(join(folder, "node_modules")));
  const { transformSync } = require("esbuild");
  const { createElement } = require("react");
  const { renderToString } = require("react-dom/server");
  let examples = 0;
  for (let index = 1; index < blocks.length; index += 2) {
    const block = blocks[index];
    const newline = block.indexOf("\n");
    const language = block.slice(0, newline).trim();
    if (!["jsx", "tsx", "js", "ts"].includes(language)) continue;
    const compiled = transformSync(block.slice(newline + 1), {
      loader: language,
      jsx: "automatic",
      format: "cjs",
      target: "es2022",
    });
    const module = { exports: {} };
    new Function("require", "module", "exports", compiled.code)(
      require,
      module,
      module.exports,
    );
    assert.equal(
      typeof module.exports.default,
      "function",
      `${project.folder}: quick-start must export a component`,
    );
    assert.equal(
      typeof renderToString(createElement(module.exports.default)),
      "string",
    );
    examples++;
  }
  assert.ok(examples, `${project.folder}: no parsed examples`);
  for (const file of [
    "scripts/build.mjs",
    "scripts/verify.mjs",
    "scripts/package.mjs",
    "SECURITY.md",
    ".github/workflows/ci.yml",
    ".gitignore",
  ])
    await access(resolve(folder, file));
  for (const directory of ["src", "test", "scripts"])
    await localImports(resolve(folder, directory), project.folder);
  const size = gzipSync(
    await readFile(resolve(folder, "dist/index.js")),
  ).length;
  results.push({
    folder: project.folder,
    name: pkg.name,
    examples,
    gzipBytes: size,
    standalone: true,
  });
  console.log(
    `${pkg.name}: docs examples, standalone files, lockfile and imports verified (${size} gzip bytes).`,
  );
}
await mkdir(resolve(here, ".reports"), { recursive: true });
await writeFile(
  resolve(here, ".reports", "docs.json"),
  JSON.stringify(results, null, 2),
);
