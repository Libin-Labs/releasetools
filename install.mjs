import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateCatalog, projectPath } from "./policy.mjs";
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const catalog = validateCatalog(
  JSON.parse(await readFile(resolve(here, "catalog.json"))),
);
const only = process.argv
  .find((arg) => arg.startsWith("--only="))
  ?.slice(7)
  .split(",");
if (only?.some((folder) => !catalog.some((item) => item.folder === folder)))
  throw new Error("Unknown project.");
const projects = only
  ? catalog.filter((item) => only.includes(item.folder))
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
if (!npm) throw new Error("Cannot locate npm.");
await mkdir(resolve(here, ".reports"), { recursive: true });
let cursor = 0;
const results = [];
async function worker() {
  while (cursor < projects.length) {
    const project = projects[cursor++];
    console.log(`Installing ${project.folder}`);
    const args = [
      npm,
      "--prefix",
      projectPath(root, project.folder),
      "install",
      "--no-audit",
      "--no-fund",
      "--registry",
      "https://registry.npmjs.org/",
    ];
    if (!process.argv.includes("--online")) args.push("--offline");
    let output = "";
    const status = await new Promise((resolveStatus) => {
      const child = spawn(process.execPath, args, {
        env: {
          ...process.env,
          NODE_TLS_REJECT_UNAUTHORIZED: "1",
          npm_config_strict_ssl: "true",
        },
        stdio: ["ignore", "pipe", "pipe"],
      });
      child.stdout.on("data", (data) => (output += data));
      child.stderr.on("data", (data) => (output += data));
      child.on("error", (error) => {
        output += error.message;
        resolveStatus(1);
      });
      child.on("close", resolveStatus);
    });
    await writeFile(
      resolve(here, ".reports", `${project.folder}.install.log`),
      output,
    );
    results.push({ folder: project.folder, passed: status === 0 });
    console.log(`${project.folder} install: ${status === 0 ? "PASS" : "FAIL"}`);
  }
}
await Promise.all([worker(), worker()]);
await writeFile(
  resolve(here, ".reports", "install-results.json"),
  JSON.stringify(results, null, 2),
);
if (results.some((item) => !item.passed)) process.exitCode = 1;
