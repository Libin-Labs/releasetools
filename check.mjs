import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateCatalog, projectPath } from "./policy.mjs";
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const catalog = validateCatalog(
  JSON.parse(await readFile(resolve(here, "catalog.json"))),
);
const requested = process.argv
  .find((arg) => arg.startsWith("--only="))
  ?.slice(7)
  .split(",");
if (
  requested?.some((folder) => !catalog.some((entry) => entry.folder === folder))
)
  throw new Error("Unknown project.");
const projects = requested
  ? catalog.filter((entry) => requested.includes(entry.folder))
  : catalog;
let npm = process.env.npm_execpath;
for (const candidate of [
  resolve(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js"),
  resolve(dirname(process.execPath), "../lib/node_modules/npm/bin/npm-cli.js"),
  "/usr/share/nodejs/npm/bin/npm-cli.js",
]) {
  if (npm) break;
  try {
    await access(candidate);
    npm = candidate;
  } catch {}
}
if (!npm)
  throw new Error(
    "Cannot locate npm; invoke through npm exec or set npm_execpath.",
  );
await mkdir(resolve(here, ".reports"), { recursive: true });
const results = [];
for (const project of projects) {
  console.log(`Verifying ${project.folder}`);
  let output = "";
  let passed = false;
  try {
    output = execFileSync(
      process.execPath,
      [npm, "--prefix", projectPath(root, project.folder), "run", "verify"],
      {
        encoding: "utf8",
        timeout: 180000,
        maxBuffer: 10485760,
        env: {
          ...process.env,
          NODE_TLS_REJECT_UNAUTHORIZED: "1",
          npm_config_strict_ssl: "true",
        },
      },
    );
    passed = true;
  } catch (error) {
    output =
      String(error.stdout ?? "") +
      "\n" +
      String(error.stderr ?? "") +
      "\n" +
      error.message;
  }
  await writeFile(resolve(here, ".reports", `${project.folder}.log`), output);
  results.push({
    folder: project.folder,
    name: `@lp-labs/${project.name}`,
    passed,
  });
  await writeFile(
    resolve(here, ".reports", "results.json"),
    JSON.stringify(results, null, 2),
  );
  console.log(
    `${project.folder}: ${passed ? "PASS" : "FAIL"} (see .reports/${project.folder}.log)`,
  );
}
if (results.some((result) => !result.passed)) process.exitCode = 1;
else if (projects.length === catalog.length) {
  execFileSync(process.execPath, [resolve(here, "docs.mjs")], {
    stdio: "inherit",
  });
  execFileSync(
    process.execPath,
    [
      "--test",
      resolve(here, "policy.test.mjs"),
      resolve(here, "release.test.mjs"),
    ],
    { stdio: "inherit" },
  );
  execFileSync(process.execPath, [resolve(here, "summary.mjs")], {
    stdio: "inherit",
  });
  console.log(
    "All 22 package gates, README examples, independence audit and release safety tests passed.",
  );
}
