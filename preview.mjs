import { createServer } from "node:http";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const require = createRequire(resolve(root, "Form/package.json"));
const { build } = require("esbuild");
const result = await build({
  entryPoints: [resolve(here, "preview.tsx")],
  bundle: true,
  write: false,
  platform: "browser",
  format: "iife",
  jsx: "automatic",
  alias: {
    react: resolve(root, "Form/node_modules/react"),
    "react-dom": resolve(root, "Form/node_modules/react-dom"),
  },
  define: { "process.env.NODE_ENV": '"development"' },
  logLevel: "silent",
});
const bundle = result.outputFiles[0].text;
const html =
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LP Labs component workbench</title><style>*{box-sizing:border-box}body{margin:0;color:#20242a;background:#f4f6f7;font:15px "Trebuchet MS",sans-serif;letter-spacing:0}header.app{padding:16px 24px;background:#fff;border-bottom:1px solid #ccd3d9;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}h1{font-size:20px;margin:0}main{max-width:1000px;margin:auto;padding:24px}h2{font-size:18px}button,input,select{font:inherit;max-width:100%}button{padding:6px 10px;border:1px solid #adb7c1;border-radius:4px;background:#fff;color:#20242a;cursor:pointer}button:disabled{opacity:.5;cursor:default}input,select{padding:6px;border:1px solid #8797a2;border-radius:4px}button:focus-visible,input:focus-visible{outline:2px solid #007b65;outline-offset:2px}label{display:block;margin:8px 0}output{display:block;margin:8px 0;color:#12654d}fieldset{min-width:0}section.case{padding:16px 0;border-top:1px solid #ccd3d9}p[role=alert]{color:#a32222}@media(max-width:500px){main{padding:16px}header.app{padding:12px 16px}button{padding:6px 8px}}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>';
const server = createServer((request, response) => {
  if (request.method !== "GET") {
    response.writeHead(405);
    response.end();
    return;
  }
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'",
  );
  if (request.url === "/") {
    response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
    response.end(html);
  } else if (request.url === "/bundle.js") {
    response.writeHead(200, {
      "Content-Type": "text/javascript;charset=utf-8",
    });
    response.end(bundle);
  } else {
    response.writeHead(404);
    response.end();
  }
});
server.listen(0, "127.0.0.1", () =>
  console.log(`Workbench: http://127.0.0.1:${server.address().port}/`),
);
