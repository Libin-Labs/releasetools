import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(
  await readFile(resolve(root, "ReleaseTools/catalog.json"), "utf8"),
);
for (const project of catalog) {
  const pkg = JSON.parse(
    await readFile(resolve(root, project.folder, "package.json"), "utf8"),
  );
  const license = await readFile(
    resolve(root, project.folder, "LICENSE"),
    "utf8",
  );
  const licenseTemplate = await readFile(
    resolve(root, "ReleaseTools/templates/LICENSE"),
    "utf8",
  );
  const readme = await readFile(
    resolve(root, project.folder, "README.md"),
    "utf8",
  );
  const log = await readFile(
    resolve(root, "ReleaseTools/.reports", `${project.folder}.log`),
    "utf8",
  );
  for (const heading of [
    "## Benefits",
    "## Customization",
    "## Security And Limits",
    "## Support",
  ])
    assert.ok(
      readme.includes(heading),
      `${project.folder}: missing ${heading}`,
    );
  assert.ok(
    /\|\s*Area\s*\|\s*Details\s*\|/.test(readme),
    `${project.folder}: missing benefits/customization table`,
  );
  assert.equal(pkg.author?.name, "Libin Prasanth");
  assert.equal(pkg.author?.url, "https://www.linkedin.com/in/libinprasanth/");
  assert.equal(pkg.license, "MIT");
  assert.ok(pkg.files?.includes("LICENSE"));
  assert.equal(license, licenseTemplate);
  assert.ok(readme.includes("MIT License"));
  assert.ok(readme.includes("https://www.linkedin.com/in/libinprasanth/"));
  assert.ok(
    log.includes("All matched files use Prettier code style!"),
    `${project.folder}: format check did not pass`,
  );
}
const summary = await readFile(
  resolve(root, "ReleaseTools/VERIFICATION.md"),
  "utf8",
);
assert.ok(summary.includes("All 22 standalone package gates passed"));
console.log(
  "Final audit passed: MIT licenses, 22 npm author profiles, README links/tables, and package Prettier gates are verified.",
);
