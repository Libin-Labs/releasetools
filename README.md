# Independent Package Release Tools

This folder coordinates the 22 sibling projects. It is not imported by, installed with, or required by any published library. Each package has its own source, scripts, tests, lockfile, TypeScript declarations, security policy, formatter configuration, and GitHub Actions workflow. Each folder can be copied into an independent GitHub repository.

Do not commit `node_modules`, `dist`, release credentials, `.env` files, or npm configuration files containing tokens. The package `.gitignore` files exclude common generated and secret files.

## Install And Verify

Run these commands from the parent folder with Node.js 18.18 or later and npm installed:

```sh
node ReleaseTools/install.mjs
node ReleaseTools/check.mjs
```

The installer uses the local npm cache by default. Pass `--online` when dependencies are not cached. Child npm processes explicitly enable TLS certificate verification, and the installer uses at most two workers.

The checker verifies every selected project independently: formatting, strict TypeScript, declaration generation, tests, ESM/CommonJS/browser builds, bundle limits, README sections, and installation of the packed artifact into a temporary consumer. It writes logs and per-project results to the ignored `ReleaseTools/.reports` directory. CI uses Node.js 22 for modern test-runner timer mocks; packages declare a runtime minimum of Node.js 18.18.

Use `--only=Form,Combobox` with install or check to select catalog folder names. Package names and paths are allowlisted; unknown names and paths that escape the parent directory are rejected.

## Format Sources

```sh
node ReleaseTools/format-all.mjs
```

Each project runs its own pinned Prettier dependency and `.prettierrc.json`. The same check runs as part of `npm run verify` and `prepack`. From an individual project, use `npm run format` or `npm run format:check`.

## Dry-Run Release

```sh
node ReleaseTools/release.mjs
```

Dry-run is the default; `--dry-run` is also accepted. All selected package gates and tarball-content checks run before the command reports success. Dry-run does not authenticate, reserve names, or publish to npm.

Select packages with `--only=Form,Combobox`. Set a distribution tag with `--tag=next`; the default is `latest`. The tag is syntax-checked before release work begins.

## Publish Selected Packages

All 22 packages use the MIT License and include the matching `LICENSE` file in the npm file allowlist. Review the license and copyright notice before redistribution. Then review versions, tests, audit results, and package contents. Confirm your npm account is authorized to publish public packages under the `@lp-labs` scope.

Only after that review, run:

```sh
node ReleaseTools/release.mjs --publish --confirm
```

The script requires both flags for a real publish, accepts only the approved MIT license and a packaged `LICENSE`, rejects private packages, enforces the npmjs registry and TLS verification, confirms npm authentication, and checks all selected versions before the first publish. It publishes sequentially with public access. Complete any npm browser authentication or 2FA prompt directly in the terminal/browser; never put tokens in source files or tool arguments. Existing versions are not overwritten or automatically incremented.

**Publishing multiple npm packages is not atomic.** A network, authentication, or registry failure can leave a partial release. Inspect `ReleaseTools/.reports/published.json` and use `--only` for remaining packages. npm releases cannot be rolled back atomically. For production CI, prefer npm trusted publishing/OIDC and provenance per repository instead of a workstation token.

## Browser Workbench

```sh
node ReleaseTools/preview.mjs
```

The optional localhost-only workbench prints its address and exercises all 22 components. It is neither imported by nor shipped in any package. Restart it after changing library source. The generated image fixture is local and exercises load, pixels, and zoom. This workbench is a development aid, not an accessibility or security certification.

## Verification Evidence

[VERIFICATION.md](VERIFICATION.md) records the current checked test counts and gzip bundle sizes. The aggregate checker also confirms the built source map contains the current source, README examples render, all package lockfiles use the expected package names, and no library imports a sibling package or shared release tooling.

The npm advisory audit is a point-in-time result. CI reruns `npm audit --audit-level=high`; dependency updates can change the result. Automated checks supplement code review, supported-browser and assistive-technology testing, and a security assessment; they do not certify a package as production-safe.

## Maintainer

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Support maintenance through [PayPal](https://www.paypal.me/LibinPrasanth).
