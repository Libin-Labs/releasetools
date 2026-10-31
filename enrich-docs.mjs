import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateCatalog } from "./policy.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = validateCatalog(
  JSON.parse(await readFile(resolve(root, "ReleaseTools/catalog.json"))),
);
const tables = {
  Form: {
    benefits: [
      ["Bounded form state", "Field and array limits are explicit."],
      [
        "Async-safe validation",
        "Validation and submit work receive cancellation signals.",
      ],
      [
        "Framework-free rules",
        "Use custom field validators without a schema runtime.",
      ],
    ],
    custom: [
      ["Validation", "Combine field validators and whole-form validation."],
      ["Validation timing", "Choose submit, blur, or change validation."],
      ["Array fields", "Set per-form item limits and update rows immutably."],
    ],
  },
  Combobox: {
    benefits: [
      [
        "Async options",
        "Search requests are debounced and stale requests abort.",
      ],
      [
        "Single and multiple selection",
        "Use the same control and option model.",
      ],
      [
        "Customization hooks",
        "Render options without taking over list behavior.",
      ],
    ],
    custom: [
      [
        "Option data",
        "Provide unique values, labels, disabled state, and custom rendering.",
      ],
      [
        "Remote loading",
        "Set loader, debounce, option, selection, and visible-row caps.",
      ],
      ["Presentation", "Configure labels, placeholder, class name, and mode."],
    ],
  },
  Upload: {
    benefits: [
      [
        "Explicit resource caps",
        "Bound file count, individual size, total bytes, and concurrency.",
      ],
      ["Cancelable transport", "Track progress and cancel active requests."],
      [
        "Extension point",
        "Use custom upload transport or the built-in multipart request.",
      ],
    ],
    custom: [
      [
        "Validation",
        "Set accepted types, count, per-file size, and aggregate size.",
      ],
      [
        "Transport",
        "Configure URL, safe headers, credentials, timeout, or custom upload.",
      ],
      ["Concurrency", "Limit simultaneous uploads from one to eight."],
    ],
  },
  Dialog: {
    benefits: [
      [
        "Native modal behavior",
        "Use browser modal and focus containment semantics.",
      ],
      [
        "Nested dialogs",
        "Keep cancel and close events isolated to the dialog that emitted them.",
      ],
      [
        "No overlay dependency",
        "Customize children and styles without a portal runtime.",
      ],
    ],
    custom: [
      ["State", "Use controlled open state or the included state hook."],
      ["Dismissal", "Configure Escape and backdrop dismissal."],
      [
        "Focus and content",
        "Set initial focus, accessible title, description, styles, and error handler.",
      ],
    ],
  },
  Toast: {
    benefits: [
      [
        "Bounded queue",
        "Control visible notifications and total queued entries.",
      ],
      [
        "Timer awareness",
        "Pause dismissal while hovered, focused, or the document is hidden.",
      ],
      ["Action feedback", "Render async actions and their errors accessibly."],
    ],
    custom: [
      [
        "Queue",
        "Set visible and total limits, placement, and default duration.",
      ],
      ["Toast data", "Choose variant, individual duration, ID, and action."],
      [
        "Rendering",
        "Replace the renderer while retaining provider queue controls.",
      ],
    ],
  },
  DatePicker: {
    benefits: [
      [
        "Date-only arithmetic",
        "Use canonical ISO dates and UTC calendar calculations.",
      ],
      [
        "Single and range modes",
        "Share one calendar and disabled-date policy.",
      ],
      [
        "Bounded calendar",
        "Limit years, range length, and disabled-day searching.",
      ],
    ],
    custom: [
      [
        "Availability",
        "Set minimum, maximum, disabled weekdays, and a disabled-date predicate.",
      ],
      ["Locale", "Choose formatting locale and first weekday."],
      [
        "Selection",
        "Choose single/range mode, controlled value, name, and initial month.",
      ],
    ],
  },
  Tabs: {
    benefits: [
      [
        "Keyboard access",
        "Provide roving tab focus and linked ARIA tab/panel IDs.",
      ],
      [
        "Loading strategy",
        "Choose lazy rendering and whether visited panels remain mounted.",
      ],
      ["Controlled state", "Integrate with routers or application state."],
    ],
    custom: [
      ["Activation", "Choose automatic or manual tab activation."],
      ["Navigation", "Set orientation, RTL direction, and wrapping."],
      ["Panels", "Choose lazy rendering and retained visited panels."],
    ],
  },
  Undo: {
    benefits: [
      ["Memory bounded", "Limit retained history entries."],
      ["Batchable changes", "Group a transaction into one undo step."],
      ["Optional shortcuts", "Install scoped shortcuts only when requested."],
    ],
    custom: [
      ["History", "Set depth and a custom equality function."],
      ["Transactions", "Begin/end nested batches or cancel the current batch."],
      ["Keyboard", "Opt into shortcuts and an element scope."],
    ],
  },
  Hotkeys: {
    benefits: [
      [
        "Scoped listeners",
        "Attach to an element or document and clean up on unmount.",
      ],
      ["Sequence support", "Handle bounded multi-key sequences."],
      [
        "Typing safeguards",
        "Ignore editable fields, composition, repeat, and prevented events by default.",
      ],
    ],
    custom: [
      [
        "Binding",
        "Configure shortcut, handler, enabled, repeat, and preventDefault.",
      ],
      ["Scope", "Choose a referenced element or document."],
      [
        "Sequences",
        "Set timeout and explicitly allow editable-field shortcuts if needed.",
      ],
    ],
  },
  OverflowMenu: {
    benefits: [
      [
        "Responsive actions",
        "Measure available width and retain overflowed actions.",
      ],
      [
        "Accessible controls",
        "Keep keyboard navigation through toolbar and overflow menu.",
      ],
      [
        "Async-safe actions",
        "Prevent duplicate invocation while an action is pending.",
      ],
    ],
    custom: [
      ["Measurement", "Configure actions, gap, labels, and parent width."],
      ["Actions", "Set ID, label, disabled state, and callback."],
      [
        "Presentation",
        "Customize class name; menu uses native in-place rendering.",
      ],
    ],
  },
  Stepper: {
    benefits: [
      [
        "Validation gates",
        "Block forward navigation until an async step passes.",
      ],
      ["Cancel-aware", "Give pending validation an AbortSignal."],
      [
        "Controlled progress",
        "Synchronize active steps with application state.",
      ],
    ],
    custom: [
      [
        "Step model",
        "Provide IDs, labels, content, disabled state, and validator.",
      ],
      ["Workflow", "Choose linear navigation and controlled active step."],
      ["Completion", "Set step-change and final-completion callbacks."],
    ],
  },
  TreeSelect: {
    benefits: [
      [
        "Tree-aware state",
        "Derive checked and indeterminate state from selected leaves.",
      ],
      ["Search paths", "Show matching entries and their ancestors."],
      ["Predictable resource use", "Cap nodes, depth, and query length."],
    ],
    custom: [
      ["Data", "Set node hierarchy, disabled state, and expansion defaults."],
      ["Selection", "Control selected leaf IDs and receive changes."],
      ["Search", "Configure label, query, and clear behavior."],
    ],
  },
  TransferList: {
    benefits: [
      ["Bulk movement", "Move checked or all matching enabled entries."],
      ["Independent filters", "Search source and destination separately."],
      ["Controlled state", "Integrate target IDs with application state."],
    ],
    custom: [
      ["Options", "Provide unique IDs, labels, and disabled flags."],
      ["Limits", "Set visible match prefix and disabled overall state."],
      ["Labels", "Customize source/destination names and option rendering."],
    ],
  },
  InlineEdit: {
    benefits: [
      [
        "Safe commit flow",
        "Validate and await save before changing the displayed value.",
      ],
      ["Cancelable async work", "Pass a signal and ignore late results."],
      ["Accessible controls", "Expose edit, save, cancel, and error states."],
    ],
    custom: [
      ["Validation", "Provide synchronous validation and a text length cap."],
      ["Persistence", "Implement async onSave and optional onChange."],
      ["Display", "Customize label, placeholder, and display renderer."],
    ],
  },
  Clipboard: {
    benefits: [
      ["No legacy fallback", "Use the secure Clipboard API only."],
      ["Explicit failures", "Expose permission and write errors."],
      ["Bounded input", "Limit clipboard text and status timer."],
    ],
    custom: [
      ["Limits", "Set maximum text length and success reset time."],
      ["Permission", "Query permission when supported."],
      ["UX", "Use status/error state and reset explicitly."],
    ],
  },
  Idle: {
    benefits: [
      ["Transition callbacks", "Respond to active, warning, and idle phases."],
      ["Cross-tab option", "Share activity timestamps only when enabled."],
      ["Lifecycle cleanup", "Remove timers and listeners on unmount."],
    ],
    custom: [
      ["Timing", "Set idle timeout, warning lead, and event throttle."],
      ["Coordination", "Opt into BroadcastChannel and choose a channel name."],
      [
        "Responses",
        "Handle phase callbacks and call reset from an explicit action.",
      ],
    ],
  },
  Storage: {
    benefits: [
      ["Schema validation", "Validate stored and new data before exposing it."],
      [
        "Version migration",
        "Transform older records through an explicit migration.",
      ],
      [
        "Size and structure caps",
        "Reject oversized/deep JSON and unsafe property names.",
      ],
    ],
    custom: [
      ["Schema", "Provide a type-guard validator and version."],
      ["Migration", "Add a migration function for known older versions."],
      [
        "Backend",
        "Supply a synchronous adapter and configure byte/listener limits.",
      ],
    ],
  },
  UrlState: {
    benefits: [
      ["Typed codecs", "Parse and serialize values through explicit schemas."],
      ["Safe URL updates", "Preserve unrelated parameters, path, and hash."],
      ["Bounded input", "Limit schema count, key lengths, and query bytes."],
    ],
    custom: [
      ["Schema", "Choose string, number, boolean, or custom codecs."],
      ["History", "Select push or replace navigation behavior."],
      ["Validation", "Set bounds in codecs and query-length cap."],
    ],
  },
  Selection: {
    benefits: [
      ["Stable IDs", "Keep selection separate from rendering."],
      ["Modifier ranges", "Support additive and range selection."],
      ["Disabled filtering", "Skip disabled records consistently."],
    ],
    custom: [
      ["Controlled state", "Pass selected IDs and onChange."],
      ["Behavior", "Set single/multiple mode and disabled IDs."],
      [
        "Integration",
        "Use returned key handler and item props in your own accessible widget.",
      ],
    ],
  },
  ImageViewer: {
    benefits: [
      ["Constrained transforms", "Clamp zoom and pan to configured bounds."],
      ["Safe source protocols", "Reject script URLs and SVG data URLs."],
      ["Native modal", "Use dialog focus behavior and keyboard controls."],
    ],
    custom: [
      ["Gallery", "Provide source/alt pairs and controlled index/open state."],
      ["Interaction", "Set zoom maximum and callbacks."],
      [
        "Security",
        "Apply an application domain allowlist and CSP to remote images.",
      ],
    ],
  },
  NumberInput: {
    benefits: [
      ["Native locale formatting", "Use Intl for display and locale digits."],
      [
        "Explicit numeric bounds",
        "Clamp values and expose spinbutton semantics.",
      ],
      ["Precision caps", "Avoid unbounded decimal scaling."],
    ],
    custom: [
      ["Range", "Set min, max, step, and precision."],
      ["Locale", "Choose locale and accessible label."],
      [
        "State",
        "Use controlled value, callbacks, and required/disabled modes.",
      ],
    ],
  },
  RovingFocus: {
    benefits: [
      ["One tab stop", "Keep arrow-navigation groups compact in tab order."],
      ["RTL support", "Reverse horizontal navigation when configured."],
      ["No global listeners", "Apply returned props to your own items."],
    ],
    custom: [
      ["Navigation", "Set IDs, orientation, wrapping, and direction."],
      ["Disabled items", "Provide disabled IDs to skip."],
      ["Controlled focus", "Pass active ID and receive changes."],
    ],
  },
};
for (const project of catalog) {
  const path = resolve(root, project.folder, "README.md");
  let text = await readFile(path, "utf8");
  if (text.includes("## Benefits") || text.includes("## Customization"))
    throw new Error(
      `${project.folder} already has generated feature tables; review before rerun.`,
    );
  const data = tables[project.folder];
  const table = (items) =>
    "| Area | Details |\n| --- | --- |\n" +
    items.map(([a, b]) => `| ${a} | ${b} |`).join("\n");
  const addition = `## Benefits\n\n${table(data.benefits)}\n\n## Customization\n\n${table(data.custom)}\n\n`;
  if (!text.includes("## Security And Limits"))
    throw new Error(`${project.folder}: expected security section is missing.`);
  text = text.replace(
    "## Security And Limits",
    addition + "## Security And Limits",
  );
  await writeFile(path, text);
}
