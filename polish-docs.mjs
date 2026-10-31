import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const replacements = {
  Form: [
    ["Fields1..1000, arrays1..10000", "Fields: 1–1,000; arrays: 1–10,000"],
    ["at most1MiB", "at most 1 MiB"],
    ["at most128", "at most 128"],
    ["at most1024", "at most 1,024"],
  ],
  Combobox: [
    ["defaults200ms (0..5000)", "defaults to 200 ms (0–5,000 ms)"],
    [
      "maxOptions10000, maxSelected1000, maxVisible100",
      "maxOptions: 10,000, maxSelected: 1,000, and maxVisible: 100",
    ],
    ["caps are10000/1000/1000", "caps are 10,000/1,000/1,000"],
    ["text256 characters", "text to 256 characters"],
  ],
  Upload: [
    [
      "maxFiles=10, maxFileSize=10MiB, maxTotalSize=50MiB, concurrency=2",
      "maxFiles: 10, maxFileSize: 10 MiB, maxTotalSize: 50 MiB, and concurrency: 2",
    ],
    ["default120s, range1s..1h", "default: 120 s; range: 1 s–1 h"],
    [
      "Hard caps:1000 files,1GiB per file,2GiB total,8 workers",
      "Hard caps: 1,000 files, 1 GiB per file, 2 GiB total, and 8 workers",
    ],
  ],
  DatePicker: [
    ["Supported years1900..2100", "Supported years: 1,900–2,100"],
    ["Range limits1..3660 days", "Range limits: 1–3,660 days"],
    ["bounded to366 attempts", "bounded to 366 attempts"],
  ],
  Tabs: [
    [
      "At most100 uniquely identified tabs; IDs1..128 characters",
      "At most 100 uniquely identified tabs; IDs: 1–128 characters",
    ],
  ],
  Hotkeys: [
    [
      "At most100 bindings, 4 sequence steps and100 characters per shortcut; timeout100..5000ms",
      "At most 100 bindings, 4 sequence steps, and 100 characters per shortcut; timeout: 100–5,000 ms",
    ],
  ],
  Idle: [
    [
      "Timeout100ms..24h, warningBefore below timeout, throttle0..timeout, channel names up to128 characters",
      "Timeout: 100 ms–24 h; warningBefore must be below timeout; throttle: 0–timeout; channel names: up to 128 characters",
    ],
  ],
  ImageViewer: [
    ["At most1000 images, maxZoom1..16", "At most 1,000 images; maxZoom: 1–16"],
    [
      "URL strings cap at8192 characters",
      "URL strings are capped at 8,192 characters",
    ],
    ["data URLs cap at2MiB", "data URLs are capped at 2 MiB"],
  ],
  InlineEdit: [["maxLength1..1,048,576", "maxLength: 1–1,048,576"]],
  NumberInput: [
    [
      "Input length128, precision0..12",
      "Input length: 128 characters; precision: 0–12",
    ],
  ],
  OverflowMenu: [
    [
      "At most100 actions, gap0..100 pixels",
      "At most 100 actions; gap: 0–100 pixels",
    ],
  ],
  Storage: [
    ["Keys are1..128", "Keys are 1–128"],
    ["default to64KiB UTF-8", "default to 64 KiB UTF-8"],
    ["up to1MiB", "up to 1 MiB"],
    [
      "capped at10,000 values and20 levels",
      "capped at 10,000 values and 20 levels",
    ],
  ],
  Toast: [
    [
      "Visible1..10, queue up to1000, duration0..600000ms, IDs1..128 characters",
      "Visible count: 1–10; queue: up to 1,000; duration: 0–600,000 ms; IDs: 1–128 characters",
    ],
  ],
  TransferList: [
    [
      "At most10,000 options, maxVisible1..1000, search256 characters",
      "At most 10,000 options; maxVisible: 1–1,000; search: 256 characters",
    ],
  ],
};
for (const [folder, pairs] of Object.entries(replacements)) {
  const path = resolve(root, folder, "README.md");
  let text = await readFile(path, "utf8");
  for (const [before, after] of pairs) {
    assert.ok(
      text.includes(before),
      `${folder}: expected documentation fragment missing: ${before}`,
    );
    text = text.replace(before, after);
  }
  await writeFile(path, text);
}
