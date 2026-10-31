import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateCatalog } from "./policy.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = validateCatalog(
  JSON.parse(
    await readFile(resolve(root, "ReleaseTools/catalog.json"), "utf8"),
  ),
);
for (const project of catalog) {
  const packagePath = resolve(root, project.folder, "package.json");
  const pkg = JSON.parse(await readFile(packagePath, "utf8"));
  assert.equal(pkg.license, "MIT");
  assert.ok(pkg.files.includes("LICENSE"));

  const verifyPath = resolve(root, project.folder, "scripts/verify.mjs");
  let verify = await readFile(verifyPath, "utf8");
  const npmInstall = "assert.ok(readme.includes(`npm install ${pkg.name}`));";
  assert.ok(verify.includes(npmInstall));
  if (!verify.includes('pkg.license, "MIT"')) {
    verify = verify.replace(
      npmInstall,
      `${npmInstall}\nassert.equal(pkg.license, "MIT", "Use the approved package license.");\nassert.ok(pkg.files?.includes("LICENSE"), "LICENSE must be included in the npm package.");`,
    );
    await writeFile(verifyPath, verify);
  }

  const packagePathScript = resolve(
    root,
    project.folder,
    "scripts/package.mjs",
  );
  let packageScript = await readFile(packagePathScript, "utf8");
  if (!packageScript.includes("    'LICENSE',")) {
    const marker = "    'SECURITY.md',";
    assert.ok(
      packageScript.includes(marker),
      `${project.folder}: expected SECURITY tarball check.`,
    );
    packageScript = packageScript.replace(marker, `${marker}\n    'LICENSE',`);
    await writeFile(packagePathScript, packageScript);
  }
  console.log(`License gates configured for ${project.name}`);
}
