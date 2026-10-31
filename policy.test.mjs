import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateCatalog, projectPath, assertPublishable } from "./policy.mjs";
const catalog = JSON.parse(
  await readFile(new URL("./catalog.json", import.meta.url)),
);
test("catalog contains 22 unique constrained project names", () => {
  assert.equal(validateCatalog(catalog).length, 22);
  assert.throws(() => validateCatalog([...catalog, catalog[0]]));
});
test("release paths cannot escape the root", () => {
  assert.throws(() => projectPath("D:/animation", "../secret"));
});
test("publishing fails closed for wrong names, missing license and insecure TLS", () => {
  const pkg = {
    name: "@lp-labs/react-form",
    license: "MIT",
    files: ["dist", "README.md", "LICENSE"],
    publishConfig: { registry: "https://registry.npmjs.org/" },
  };
  assertPublishable(pkg, "react-form", {});
  assert.throws(
    () =>
      assertPublishable({ ...pkg, license: "Apache-2.0" }, "react-form", {}),
    /approved MIT license/,
  );
  assert.throws(
    () => assertPublishable({ ...pkg, files: ["dist"] }, "react-form", {}),
    /packaged LICENSE/,
  );
  assert.throws(
    () =>
      assertPublishable({ ...pkg, license: "UNLICENSED" }, "react-form", {}),
    /license/,
  );
  assert.throws(
    () =>
      assertPublishable(pkg, "react-form", {
        NODE_TLS_REJECT_UNAUTHORIZED: "0",
      }),
    /TLS/,
  );
  assert.throws(() => assertPublishable(pkg, "react-toast", {}), /Unexpected/);
});
