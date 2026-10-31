import { execFileSync } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertPublishable, projectPath, validateCatalog } from "./policy.mjs";
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const catalog = validateCatalog(
  JSON.parse(await readFile(resolve(here, "catalog.json"))),
);
const args = process.argv.slice(2);
for (const arg of args)
  if (
    !["--dry-run", "--publish", "--confirm"].includes(arg) &&
    !arg.startsWith("--only=") &&
    !arg.startsWith("--tag=")
  )
    throw new Error(`Unknown option: ${arg}`);
const publishing = args.includes("--publish");
if (publishing && !args.includes("--confirm"))
  throw new Error("Actual publishing requires --publish --confirm.");
if (publishing && args.includes("--dry-run"))
  throw new Error("Choose dry-run or publish, not both.");
const only = args
  .find((arg) => arg.startsWith("--only="))
  ?.slice(7)
  .split(",");
if (only?.some((folder) => !catalog.some((item) => item.folder === folder)))
  throw new Error("Unknown project allowlist entry.");
const projects = only
  ? catalog.filter((item) => only.includes(item.folder))
  : catalog;
const tag = args.find((arg) => arg.startsWith("--tag="))?.slice(6) ?? "latest";
if (!/^[a-z][a-z0-9-]{0,31}$/.test(tag)) throw new Error("Invalid npm tag.");
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
    "Cannot locate npm. Set npm_execpath or invoke from an npm environment.",
  );
const manifests = [];
for (const project of projects) {
  const folder = projectPath(root, project.folder);
  const pkg = JSON.parse(
    await readFile(resolve(folder, "package.json"), "utf8"),
  );
  if (
    pkg.name !== `@lp-labs/${project.name}` ||
    pkg.private ||
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[a-zA-Z0-9.-]+)?$/.test(
      pkg.version,
    )
  )
    throw new Error(`Invalid identity/version for ${project.folder}.`);
  if (publishing) assertPublishable(pkg, project.name, process.env);
  manifests.push({ project, folder, pkg });
}
const environment = {
  ...process.env,
  NODE_TLS_REJECT_UNAUTHORIZED: "1",
  npm_config_strict_ssl: "true",
};
const run = (options, capture = false) =>
  execFileSync(process.execPath, [npm, ...options], {
    env: environment,
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf8",
    maxBuffer: 10485760,
  });
console.log(
  `${publishing ? "PUBLISH" : "DRY RUN"}: ${manifests.length} independent packages. Validation completes before any publishing.`,
);
for (const { folder, pkg } of manifests) {
  console.log(`Verify ${pkg.name}@${pkg.version}`);
  run(["--prefix", folder, "run", "verify"]);
  const [packed] = JSON.parse(
    run(["pack", folder, "--dry-run", "--ignore-scripts", "--json"], true),
  );
  if (!packed.files.some((file) => file.path === "LICENSE"))
    throw new Error(`${pkg.name}: the packed npm archive is missing LICENSE.`);
  if (
    packed.files.some((file) =>
      /(^|\/)\.env(?:\.|$)|\.(pem|key)$|(^|\/)\.npmrc$/.test(file.path),
    )
  )
    throw new Error("Sensitive filename found in package.");
}
if (publishing) {
  run(["whoami", "--registry", "https://registry.npmjs.org/"]);
  for (const { pkg } of manifests) {
    try {
      run(
        [
          "view",
          `${pkg.name}@${pkg.version}`,
          "version",
          "--registry",
          "https://registry.npmjs.org/",
          "--json",
        ],
        true,
      );
      throw new Error(
        `${pkg.name}@${pkg.version} already exists. Bump versions before release.`,
      );
    } catch (error) {
      if (!String(error.stderr ?? "").includes("E404")) throw error;
    }
  }
  const published = [];
  await mkdir(resolve(here, ".reports"), { recursive: true });
  for (const { folder, pkg } of manifests) {
    run([
      "publish",
      folder,
      "--access",
      "public",
      "--tag",
      tag,
      "--registry",
      "https://registry.npmjs.org/",
    ]);
    published.push(`${pkg.name}@${pkg.version}`);
    await writeFile(
      resolve(here, ".reports", "published.json"),
      JSON.stringify(published, null, 2),
    );
  }
  console.log(
    "Selected packages published. npm releases cannot be rolled back atomically.",
  );
} else
  console.log(
    "Dry run complete. Nothing published. Choose licenses and rerun with --publish --confirm only when ready.",
  );
