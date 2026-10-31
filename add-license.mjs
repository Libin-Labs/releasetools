import assert from "node:assert/strict";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateCatalog } from "./policy.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = validateCatalog(
  JSON.parse(
    await readFile(resolve(root, "ReleaseTools/catalog.json"), "utf8"),
  ),
);
const template = resolve(root, "ReleaseTools/templates/LICENSE");
for (const project of catalog) {
  const folder = resolve(root, project.folder);
  const packagePath = resolve(folder, "package.json");
  const manifest = JSON.parse(await readFile(packagePath, "utf8"));
  assert.equal(manifest.name, `@lp-labs/${project.name}`);
  assert.equal(
    manifest.license,
    "UNLICENSED",
    `${project.folder}: license was already changed; review manually.`,
  );
  assert.ok(Array.isArray(manifest.files));
  manifest.license = "MIT";
  if (!manifest.files.includes("LICENSE")) manifest.files.push("LICENSE");
  await writeFile(packagePath, `${JSON.stringify(manifest, null, 2)}\n`);

  const licensePath = resolve(folder, "LICENSE");
  try {
    const existing = await readFile(licensePath, "utf8");
    const expected = await readFile(template, "utf8");
    assert.equal(
      existing,
      expected,
      `${project.folder}: existing LICENSE differs; review manually.`,
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await copyFile(template, licensePath);
  }

  const readmePath = resolve(folder, "README.md");
  let readme = await readFile(readmePath, "utf8");
  assert.match(
    readme,
    /## License\s+UNLICENSED pending the owner's license choice\./,
  );
  readme = readme.replace(
    /## License\s+UNLICENSED pending the owner's license choice\.[^\n]*/,
    "## License\n\nMIT License. See the packaged [LICENSE](LICENSE) file.",
  );
  await writeFile(readmePath, readme);

  const securityPath = resolve(folder, "SECURITY.md");
  let security = await readFile(securityPath, "utf8");
  const previous =
    "The initial package is UNLICENSED until the owner selects an explicit distribution license.";
  assert.ok(
    security.includes(previous),
    `${project.folder}: existing security license note differs.`,
  );
  security = security.replace(
    previous,
    "This package is distributed under the MIT License; see the packaged LICENSE file. The license does not grant access to data, services, or third-party assets used by an application.",
  );
  await writeFile(securityPath, security);
  console.log(`Applied MIT license to ${project.name}`);
}
