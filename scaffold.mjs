import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { validateCatalog, projectPath } from "./policy.mjs";
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const catalog = validateCatalog(
  JSON.parse(await readFile(resolve(here, "catalog.json"))),
);
const devDependencies = {
  "@types/react": "^19.0.0",
  esbuild: "^0.25.0",
  jsdom: "^26.0.0",
  prettier: "^3.9.10",
  react: "^19.0.0",
  "react-dom": "^19.0.0",
  typescript: "^5.7.0",
};
async function absent(path) {
  try {
    await access(path);
    return false;
  } catch {
    return true;
  }
}
for (const project of catalog) {
  const folder = projectPath(root, project.folder);
  for (const directory of ["src", "scripts", "test", ".github/workflows"])
    await mkdir(resolve(folder, directory), { recursive: true });
  const pkg = {
    name: `@lp-labs/${project.name}`,
    version: "0.1.0",
    description: project.description,
    author: {
      name: "Libin Prasanth",
      url: "https://www.linkedin.com/in/libinprasanth/",
    },
    license: "MIT",
    type: "module",
    main: "./dist/cjs/index.js",
    module: "./dist/index.js",
    browser: "./dist/index.js",
    types: "./dist/index.d.ts",
    exports: {
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/index.js",
        require: "./dist/cjs/index.js",
        default: "./dist/index.js",
      },
    },
    files: ["dist", "README.md", "SECURITY.md", "LICENSE"],
    sideEffects: false,
    scripts: {
      build: "node scripts/build.mjs",
      check: "tsc --noEmit",
      test: "node --test test/*.test.mjs",
      verify: "node scripts/verify.mjs",
      "test:package": "node scripts/package.mjs",
      format:
        'prettier --write "src/**/*.{ts,tsx}" "test/**/*.{mjs,ts,tsx}" "scripts/**/*.mjs" "README.md" "SECURITY.md" "LICENSE" "package.json" "tsconfig.json" ".prettierrc.json" ".github/workflows/*.yml"',
      "format:check":
        'prettier --check "src/**/*.{ts,tsx}" "test/**/*.{mjs,ts,tsx}" "scripts/**/*.mjs" "README.md" "SECURITY.md" "LICENSE" "package.json" "tsconfig.json" ".prettierrc.json" ".github/workflows/*.yml"',
      prepack: "node scripts/verify.mjs",
    },
    peerDependencies: { react: ">=18.0.0" },
    devDependencies,
    engines: { node: ">=18.18" },
    publishConfig: {
      access: "public",
      registry: "https://registry.npmjs.org/",
    },
    funding: { type: "paypal", url: "https://www.paypal.me/LibinPrasanth" },
  };
  if (await absent(resolve(folder, "package.json")))
    await writeFile(
      resolve(folder, "package.json"),
      JSON.stringify(pkg, null, 2) + "\n",
    );
  for (const [template, target] of [
    ["build.mjs", "scripts/build.mjs"],
    ["verify.mjs", "scripts/verify.mjs"],
    ["package.mjs", "scripts/package.mjs"],
    ["helpers.mjs", "test/helpers.mjs"],
    ["tsconfig.json", "tsconfig.json"],
    ["SECURITY.md", "SECURITY.md"],
    ["LICENSE", "LICENSE"],
    ["prettierrc.json", ".prettierrc.json"],
    ["ci.yml", ".github/workflows/ci.yml"],
    ["gitignore", ".gitignore"],
  ]) {
    if (await absent(resolve(folder, target)))
      await copyFile(
        resolve(here, "templates", template),
        resolve(folder, target),
      );
  }
  console.log(`Prepared independent project: ${project.folder}`);
}
