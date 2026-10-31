import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mkdtemp, copyFile, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const script = fileURLToPath(new URL("./release.mjs", import.meta.url));
test("real publish needs explicit confirmation before running any child command", () => {
  const result = spawnSync(process.execPath, [script, "--publish"], {
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--publish --confirm/);
});
test("unknown project selection fails before release work", () => {
  const result = spawnSync(process.execPath, [script, "--only=NotAProject"], {
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unknown project/);
});
test("non-MIT manifests block confirmed publication before registry access", async () => {
  const root = await mkdtemp(join(tmpdir(), "release-refusal-"));
  try {
    await mkdir(join(root, "ReleaseTools"));
    await mkdir(join(root, "Form"));
    for (const file of ["release.mjs", "policy.mjs", "catalog.json"])
      await copyFile(
        new URL(`./${file}`, import.meta.url),
        join(root, "ReleaseTools", file),
      );
    await writeFile(
      join(root, "Form", "package.json"),
      JSON.stringify({
        name: "@lp-labs/react-form",
        version: "0.0.0",
        license: "UNLICENSED",
        publishConfig: { registry: "https://registry.npmjs.org/" },
      }),
    );
    const stub = join(root, "npm-guard.mjs");
    await writeFile(stub, 'throw new Error("TEST_GUARD_NPM_MUST_NOT_RUN");');
    const result = spawnSync(
      process.execPath,
      [
        join(root, "ReleaseTools", "release.mjs"),
        "--publish",
        "--confirm",
        "--only=Form",
      ],
      { encoding: "utf8", env: { ...process.env, npm_execpath: stub } },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /approved MIT license/);
    assert.doesNotMatch(result.stdout, /Verify @/);
    assert.doesNotMatch(result.stderr, /TEST_GUARD_NPM/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
