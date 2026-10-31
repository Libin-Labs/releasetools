# Verified Package Baseline

All 22 standalone package gates passed: Prettier formatting, strict TypeScript, declaration generation, behavior tests, ESM/CommonJS/browser builds, bundle caps, and isolated packed-consumer imports. All 22 README quick-start examples execute through React server rendering. Each project owns its dependency lockfile, scripts, tests, security policy, and CI; no sibling-project imports were found.

29 package tests and 6 release-policy/CLI refusal tests passed. Browser checks additionally covered 44 desktop/mobile render cases, native nested-modal focus and keyboard behavior, combobox selection, overflow-menu interaction, and image pixels, zoom, and Escape handling. These are targeted automated checks, not a full browser matrix, screen-reader audit, penetration test, or compliance certification.

| Package | Tests | Gzip bytes (React excluded) |
| --- | ---: | ---: |
| [@lp-labs/react-form](../Form/README.md) | 2 | 1723 |
| [@lp-labs/react-combobox](../Combobox/README.md) | 1 | 2112 |
| [@lp-labs/react-upload](../Upload/README.md) | 2 | 2633 |
| [@lp-labs/react-dialog](../Dialog/README.md) | 3 | 1189 |
| [@lp-labs/react-toast](../Toast/README.md) | 2 | 1719 |
| [@lp-labs/react-date-picker](../DatePicker/README.md) | 1 | 2199 |
| [@lp-labs/react-tabs](../Tabs/README.md) | 1 | 1141 |
| [@lp-labs/react-undo](../Undo/README.md) | 1 | 1010 |
| [@lp-labs/react-hotkeys](../Hotkeys/README.md) | 1 | 966 |
| [@lp-labs/react-overflow-menu](../OverflowMenu/README.md) | 1 | 1704 |
| [@lp-labs/react-stepper](../Stepper/README.md) | 1 | 1068 |
| [@lp-labs/react-tree-select](../TreeSelect/README.md) | 1 | 1993 |
| [@lp-labs/react-transfer-list](../TransferList/README.md) | 1 | 1287 |
| [@lp-labs/react-inline-edit](../InlineEdit/README.md) | 1 | 980 |
| [@lp-labs/react-clipboard](../Clipboard/README.md) | 1 | 760 |
| [@lp-labs/react-idle](../Idle/README.md) | 1 | 963 |
| [@lp-labs/react-storage](../Storage/README.md) | 2 | 1160 |
| [@lp-labs/react-url-state](../UrlState/README.md) | 1 | 1229 |
| [@lp-labs/react-selection](../Selection/README.md) | 1 | 998 |
| [@lp-labs/react-image-viewer](../ImageViewer/README.md) | 1 | 2121 |
| [@lp-labs/react-number-input](../NumberInput/README.md) | 2 | 1661 |
| [@lp-labs/react-roving-focus](../RovingFocus/README.md) | 1 | 895 |

No npm package was published and no GitHub repository was created. All new packages are distributed under the MIT License and include the packaged LICENSE file. See the [release instructions](README.md).
