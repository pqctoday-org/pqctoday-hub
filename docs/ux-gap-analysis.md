# UX Gap Analysis — PQC Timeline App

> **Cross-reference**: This document maps concrete violations to the rules defined in [`docs/ux-standard.md`](./ux-standard.md).
> All violations were identified by static analysis of `src/` as of February 2026.
> Violations are grouped by category. Fix them in priority order: A3 → A1 → A2 → A4 → A5 → A6.

---

## Overview

| Category                            | Severity | Violations   | Files Affected  |
| ----------------------------------- | -------- | ------------ | --------------- |
| A1. Hardcoded status/accent colors  | Critical | 80+          | 25              |
| A2. Hardcoded surface colors        | Critical | 20+          | 12              |
| A3. CSS token definition bug        | Critical | 2 rules      | 1 (`index.css`) |
| A4. Missing shared components       | High     | 4 components | 0 (to create)   |
| A5. Native `<select>` elements      | Medium   | 20+          | 11              |
| A6. Hardcoded color in data objects | Medium   | 8+           | 4               |

**Total**: ~130+ individual violations across 29+ files.

---

## A1. Hardcoded Status / Accent Colors

**Standard rule violated**: S1.2 — MUST use `.text-status-*` / `.bg-status-*` or brand tokens for all semantic color.

These files use raw Tailwind palette classes (`text-blue-400`, `bg-green-500/10`, etc.) instead of the semantic token system. Each breaks dark/light/print mode correctness.

### Threats Dashboard

| File                                            | Line(s)  | Violation                                                                                                         | Correct replacement                                                                                        |
| ----------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/components/Threats/ThreatsDashboard.tsx`   | ~100–109 | `text-red-400`, `text-orange-400`, `text-yellow-400`, `text-blue-400`, `text-green-400` (criticality icon colors) | `.text-status-error`, `.text-status-error`, `.text-status-warning`, `text-primary`, `.text-status-success` |
| `src/components/Threats/ThreatsDashboard.tsx`   | ~380     | `bg-red-500/10 text-red-400 border-red-500/20` (Critical badge)                                                   | `.bg-status-error .text-status-error`                                                                      |
| `src/components/Threats/ThreatsDashboard.tsx`   | ~381     | `bg-orange-500/10 text-orange-400 border-orange-500/20` (High badge)                                              | `.bg-status-error .text-status-error`                                                                      |
| `src/components/Threats/ThreatsDashboard.tsx`   | ~382     | `bg-yellow-500/10 text-yellow-400 border-yellow-500/20` (Medium badge)                                            | `.bg-status-warning .text-status-warning`                                                                  |
| `src/components/Threats/ThreatsDashboard.tsx`   | ~383     | `bg-blue-500/10 text-blue-400 border-blue-500/20` (Low badge)                                                     | `.bg-status-info .text-status-info` _(pending A3 fix)_                                                     |
| `src/components/Threats/ThreatDetailDialog.tsx` | ~79–82   | `bg-red-500/20 text-red-400`, `bg-orange-500/20 text-orange-400`, `bg-yellow-500/20 text-yellow-400`              | `.bg-status-error`, `.bg-status-error`, `.bg-status-warning`                                               |
| `src/components/Threats/MobileThreatsList.tsx`  | ~19, 23  | `bg-orange-500/10 text-orange-400`, `bg-yellow-500/10 text-yellow-400`                                            | `.bg-status-error`, `.bg-status-warning`                                                                   |

### PKI Learning

| File                                                                         | Line(s)             | Violation                                                             | Correct replacement                                            |
| ---------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------- |
| `src/components/PKILearning/ModuleCard.tsx`                                  | ~54                 | `bg-yellow-500/10 text-yellow-400 border-yellow-500/20` (WIP badge)   | `.bg-status-warning .text-status-warning`                      |
| `src/components/PKILearning/ModuleCard.tsx`                                  | ~62                 | `bg-green-500/10 text-green-400 border-green-500/20` (completed)      | `.bg-status-success .text-status-success`                      |
| `src/components/PKILearning/ModuleCard.tsx`                                  | ~63                 | `bg-blue-500/10 text-blue-400 border-blue-500/20` (in-progress)       | `.bg-status-info .text-status-info` _(pending A3)_             |
| `src/components/PKILearning/ModuleCard.tsx`                                  | ~65                 | `bg-purple-500/10 text-purple-400 border-purple-500/20` (not-started) | `bg-secondary/10 text-secondary border-secondary/30`           |
| `src/components/PKILearning/SaveRestorePanel.tsx`                            | ~112                | `text-green-400` (success message)                                    | `.text-status-success`                                         |
| `src/components/PKILearning/SaveRestorePanel.tsx`                            | ~114                | `text-red-400` (error message)                                        | `.text-status-error`                                           |
| `src/components/PKILearning/SaveRestorePanel.tsx`                            | ~137                | `bg-blue-600 hover:bg-blue-700` (Import button)                       | `<Button variant="secondary">` or `<Button variant="outline">` |
| `src/components/PKILearning/SaveRestorePanel.tsx`                            | ~138                | `bg-purple-600 hover:bg-purple-700` (Export button)                   | `<Button variant="secondary">`                                 |
| `src/components/PKILearning/SaveRestorePanel.tsx`                            | ~174                | `bg-red-600/20 border border-red-600/50 text-red-400`                 | `.bg-status-error .text-status-error`                          |
| `src/components/PKILearning/modules/Module1-Introduction/PQC101Module.tsx`   | ~193, 200, 213, 220 | `text-green-400` (table header cells)                                 | `text-accent` or `text-foreground`                             |
| `src/components/PKILearning/modules/Module1-Introduction/PQC101Module.tsx`   | ~303                | `text-green-400` (success output)                                     | `.text-status-success`                                         |
| `src/components/PKILearning/modules/Module1-Introduction/KeyGenWorkshop.tsx` | ~136, 143           | `text-green-400` (success output)                                     | `.text-status-success`                                         |
| `src/components/PKILearning/modules/Module1-Introduction/SignatureDemo.tsx`  | ~77                 | `text-blue-300` (code display label)                                  | `text-primary`                                                 |

### Playground

| File                                                  | Line(s)   | Violation                                                                   | Correct replacement                                   |
| ----------------------------------------------------- | --------- | --------------------------------------------------------------------------- | ----------------------------------------------------- |
| `src/components/Playground/InteractivePlayground.tsx` | ~76       | `text-green-400` (fast exec time)                                           | `.text-status-success`                                |
| `src/components/Playground/InteractivePlayground.tsx` | ~77       | `text-yellow-400` (medium exec time)                                        | `.text-status-warning`                                |
| `src/components/Playground/InteractivePlayground.tsx` | ~78       | `text-red-400` (slow exec time)                                             | `.text-status-error`                                  |
| `src/components/Playground/InteractivePlayground.tsx` | ~230      | `bg-red-500/10 border border-red-500/20` (error panel)                      | `.bg-status-error`                                    |
| `src/components/Playground/KeyStoreView.tsx`          | ~76       | `text-red-400 hover:text-red-300` (delete icon)                             | `.text-status-error hover:text-destructive`           |
| `src/components/Playground/keystore/KeyDetails.tsx`   | ~230, 295 | `text-green-400` (copy checkmark)                                           | `.text-status-success`                                |
| `src/components/Playground/tabs/HashingTab.tsx`       | ~70       | `text-cyan-500 dark:text-cyan-300`                                          | `text-primary`                                        |
| `src/components/Playground/tabs/HashingTab.tsx`       | ~88       | `bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30` | `bg-primary/10 text-primary border border-primary/30` |
| `src/components/Playground/tabs/HashingTab.tsx`       | ~131      | `bg-blue-500/10 border border-blue-500/20`                                  | `bg-primary/10 border border-primary/20`              |
| `src/components/Playground/tabs/SymmetricTab.tsx`     | ~67       | `text-cyan-500 dark:text-cyan-300`                                          | `text-primary`                                        |
| `src/components/Playground/tabs/SymmetricTab.tsx`     | ~81       | `bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30` | `bg-primary/10 text-primary border border-primary/30` |
| `src/components/Playground/tabs/KemOpsTab.tsx`        | ~212      | `text-emerald-700 dark:text-emerald-300`                                    | `text-accent`                                         |
| `src/components/Playground/tabs/KemOpsTab.tsx`        | ~214, 227 | `text-blue-700 dark:text-blue-300`, `bg-blue-700/10`                        | `text-primary`, `bg-primary/10`                       |

### Migrate

| File                                             | Line(s) | Violation                                                               | Correct replacement                       |
| ------------------------------------------------ | ------- | ----------------------------------------------------------------------- | ----------------------------------------- |
| `src/components/Migrate/SoftwareTable.tsx`       | ~69     | `bg-green-500/10 text-green-500 border border-green-500/20` (Yes badge) | `.bg-status-success .text-status-success` |
| `src/components/Migrate/SoftwareTable.tsx`       | ~88     | `bg-blue-500/10 text-blue-400 border-blue-500/20` (Limited badge)       | `.bg-status-warning .text-status-warning` |
| `src/components/Migrate/SoftwareTable.tsx`       | ~89     | `bg-yellow-500/10 text-yellow-500 border-yellow-500/20` (Planned badge) | `.bg-status-warning .text-status-warning` |
| `src/components/Migrate/InfrastructureStack.tsx` | ~29     | `text-blue-400` (iconColor field)                                       | See A6                                    |
| `src/components/Migrate/InfrastructureStack.tsx` | ~49     | `text-purple-400` (iconColor field)                                     | See A6                                    |
| `src/components/Migrate/InfrastructureStack.tsx` | ~80     | `text-orange-400` (iconColor field)                                     | See A6                                    |

### Common / UI

| File                                      | Line(s) | Violation                                                          | Correct replacement                                                               |
| ----------------------------------------- | ------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `src/components/common/Glossary.tsx`      | ~9      | `bg-green-500/10 text-green-400 border-green-500/20` (Beginner)    | `<CategoryBadge category="beginner">` → `.bg-status-success .text-status-success` |
| `src/components/common/Glossary.tsx`      | ~10     | `bg-blue-500/10 text-blue-400 border-blue-500/20` (Intermediate)   | `<CategoryBadge category="intermediate">` → `.bg-status-info` _(pending A3)_      |
| `src/components/common/Glossary.tsx`      | ~11     | `bg-purple-500/10 text-purple-400 border-purple-500/20` (Advanced) | `<CategoryBadge category="advanced">` → `bg-secondary/10 text-secondary`          |
| `src/components/ui/SourcesModal.tsx`      | ~18     | `bg-blue-500/20 text-blue-400 border-blue-500/50` (Americas)       | `<CategoryBadge category="americas">` → `bg-primary/10 text-primary`              |
| `src/components/ui/SourcesModal.tsx`      | ~19     | `bg-green-500/20 text-green-400 border-green-500/50` (EMEA)        | `<CategoryBadge category="emea">` → `bg-accent/10 text-accent`                    |
| `src/components/ui/SourcesModal.tsx`      | ~20     | `bg-purple-500/20 text-purple-400 border-purple-500/50` (APAC)     | `<CategoryBadge category="apac">` → `bg-secondary/10 text-secondary`              |
| `src/components/ui/SourcesModal.tsx`      | ~21     | `bg-gray-500/20 text-gray-400 border-gray-500/50` (Global)         | `<CategoryBadge category="global">` → `bg-muted text-muted-foreground`            |
| `src/components/Leaders/LeadersGrid.tsx`  | ~76     | `text-blue-400` (Academic sector icon)                             | `text-secondary`                                                                  |
| `src/components/Library/DocumentCard.tsx` | ~15     | `bg-orange-500/10 text-orange-400 border-orange-500/20`            | `.bg-status-warning .text-status-warning`                                         |
| `src/components/Library/DocumentCard.tsx` | ~16     | `bg-yellow-500/10 text-yellow-400 border-yellow-500/20`            | `.bg-status-warning .text-status-warning`                                         |
| `src/components/About/AboutView.tsx`      | ~300    | `bg-green-500/5 border border-green-500/20`                        | `bg-success/5 border border-success/20`                                           |
| `src/components/About/AboutView.tsx`      | ~303    | `text-green-500`                                                   | `.text-status-success`                                                            |
| `src/components/About/AboutView.tsx`      | ~362    | `bg-yellow-500/10 text-yellow-500`                                 | `.bg-status-warning .text-status-warning`                                         |

### Algorithms

| File                                                  | Line(s) | Violation                                                      | Correct replacement                                         |
| ----------------------------------------------------- | ------- | -------------------------------------------------------------- | ----------------------------------------------------------- |
| `src/components/Algorithms/InteractivePlayground.tsx` | ~360    | `bg-blue-500/20 text-blue-300 border border-blue-500/30`       | `bg-primary/10 text-primary border border-primary/20`       |
| `src/components/Algorithms/InteractivePlayground.tsx` | ~387    | `bg-purple-500/20 text-purple-300 border border-purple-500/30` | `bg-secondary/10 text-secondary border border-secondary/20` |
| `src/components/Algorithms/InteractivePlayground.tsx` | ~419    | `bg-cyan-500/20 text-cyan-300 border border-cyan-500/30`       | `bg-primary/10 text-primary border border-primary/20`       |
| `src/components/Algorithms/InteractivePlayground.tsx` | ~472    | `bg-green-500/20 text-green-300 border border-green-500/30`    | `.bg-status-success .text-status-success`                   |
| `src/components/Algorithms/MobileAlgorithmList.tsx`   | ~28     | `bg-blue-500/10 text-blue-400`                                 | `bg-primary/10 text-primary`                                |
| `src/components/Algorithms/MobileAlgorithmList.tsx`   | ~57     | `bg-red-500/10 border-red-500/30 text-red-400`                 | `.bg-status-error .text-status-error`                       |

### OpenSSL Studio

| File                                                               | Line(s)                  | Violation                                                                 | Correct replacement                   |
| ------------------------------------------------------------------ | ------------------------ | ------------------------------------------------------------------------- | ------------------------------------- |
| `src/components/OpenSSLStudio/components/WorkbenchFileManager.tsx` | ~221                     | `bg-red-500 text-foreground hover:bg-red-600 border border-red-500`       | `<Button variant="destructive">`      |
| `src/components/OpenSSLStudio/components/WorkbenchFileManager.tsx` | ~222                     | `bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20` | `.bg-status-error .text-status-error` |
| `src/components/OpenSSLStudio/components/configs/LmsConfig.tsx`    | ~346, 357, 368, 376, 387 | Various `bg-blue-500/20 text-blue-400` badges                             | `bg-primary/10 text-primary`          |

---

## A2. Hardcoded Surface Colors

**Standard rule violated**: S1.2 — MUST NOT use `bg-black/40`, `border-white/10`, `bg-zinc-950`, etc. for surfaces.

These bypass the theme system and break in light mode.

| File                                                                                    | Violation                                                             | Correct replacement                                                    |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/components/ui/input.tsx:12`                                                        | `bg-black/40 border border-white/10`                                  | `bg-muted border border-input`                                         |
| `src/components/ui/code-block.tsx:16`                                                   | `bg-zinc-950 dark:bg-zinc-900`                                        | `bg-muted`                                                             |
| `src/components/ui/button-variants.ts:10`                                               | `border-white/20 hover:bg-white/10` (outline variant)                 | `border-border hover:bg-muted/20`                                      |
| `src/components/ui/button-variants.ts:12`                                               | `hover:bg-white/10` (ghost variant)                                   | `hover:bg-muted/20`                                                    |
| `src/components/Algorithms/InteractivePlayground.tsx` (5 instances)                     | `bg-black/40 border border-white/20` (native select + input elements) | `bg-muted border border-input` (after migrating to `<FilterDropdown>`) |
| `src/components/Algorithms/AlgorithmComparison.tsx:210`                                 | `bg-white/10` (table header row)                                      | `bg-muted`                                                             |
| `src/components/Algorithms/AlgorithmComparison.tsx:220,248`                             | `hover:bg-white/5` (header sort cells)                                | `hover:bg-muted/50`                                                    |
| `src/components/Library/LibraryView.tsx:381`                                            | `border-b border-white/10` (divider)                                  | `border-b border-border`                                               |
| `src/components/Migrate/InfrastructureStack.tsx:152`                                    | `border-white/5` (layer border)                                       | `border-border/30`                                                     |
| `src/components/Migrate/InfrastructureStack.tsx:183,184`                                | `border-white/20` (card border)                                       | `border-border`                                                        |
| `src/components/PKILearning/modules/Module1-Introduction/KeyGenWorkshop.tsx:89,106,135` | `bg-black/20 border border-white/10` (output areas)                   | `bg-muted border border-border`                                        |
| `src/components/PKILearning/modules/Module1-Introduction/SignatureDemo.tsx:59,75`       | `bg-black/20 border border-white/10` (output areas)                   | `bg-muted border border-border`                                        |
| `src/components/OpenSSLStudio/components/configs/LmsConfig.tsx` (multiple)              | `border-white/10` (section separators)                                | `border-border`                                                        |

---

## A3. CSS Token Definition Bug

**Standard rule violated**: S1.3 — `.text-status-info` / `.bg-status-info` must resolve to the `--info` CSS variable, not `text-blue-400`.

**File**: `src/styles/index.css`

| Line | Current (violation)                                             | Required fix                                                                    |
| ---- | --------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 458  | `.text-status-info { @apply text-blue-400; }`                   | Add `--info` HSL variable to `@theme`; change to `color: hsl(var(--info));`     |
| 463  | `.bg-status-info { @apply bg-blue-500/10 border-blue-500/20; }` | Use `background: hsl(var(--info) / 0.1); border-color: hsl(var(--info) / 0.2);` |

**Fix steps**:

1. In the `@layer base` `:root` block, add: `--info: 221 83% 53%;` (same hue as `--primary`, less saturated)
2. In the `.dark` block, add: `--info: 217 91% 70%;` (lighter for dark mode)
3. Rewrite `.text-status-info` and `.bg-status-info` to use `hsl(var(--info))` instead of `@apply text-blue-400`

**Impact**: Unblocks proper use of `.text-status-info` / `.bg-status-info` across Threats (Low badge), ModuleCard (In Progress), Glossary (Intermediate), Migrate (Limited badge), and ~15 other locations.

---

## A4. Missing Shared Components

**Standard rule violated**: S4.8 — these components are called for in the standard but do not yet exist.

| Component         | Proposed path                          | Purpose                                                                                                                          | Unblocks                                                                |
| ----------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `<Skeleton>`      | `src/components/ui/skeleton.tsx`       | Animated loading placeholder (`animate-pulse bg-muted rounded`); props: `className`, `width`, `height`                           | Inline data loading in Compliance table, Landing stats, Library refresh |
| `<EmptyState>`    | `src/components/ui/empty-state.tsx`    | Zero-results centered state; props: `icon`, `title`, `description`, `action?` (renders a ghost Button)                           | Library, Leaders, Threats, Migrate filtered lists                       |
| `<ErrorAlert>`    | `src/components/ui/error-alert.tsx`    | Inline recoverable error with accent border; props: `message`, `onRetry?`                                                        | Playground WASM failures, OpenSSL Studio command errors                 |
| `<CategoryBadge>` | `src/components/ui/category-badge.tsx` | Maps a category string to semantic token classes; replaces 10+ hardcoded badge objects in SourcesModal, Glossary, and ModuleCard | A1 fixes for all region/complexity/difficulty badges                    |

**`<CategoryBadge>` token map** (to implement as a lookup inside the component):

| `category` prop | Classes                                              |
| --------------- | ---------------------------------------------------- |
| `americas`      | `bg-primary/10 text-primary border-primary/30`       |
| `emea`          | `bg-accent/10 text-accent border-accent/30`          |
| `apac`          | `bg-secondary/10 text-secondary border-secondary/30` |
| `global`        | `bg-muted text-muted-foreground border-border`       |
| `beginner`      | `.bg-status-success .text-status-success`            |
| `intermediate`  | `.bg-status-info .text-status-info`                  |
| `advanced`      | `bg-secondary/10 text-secondary border-secondary/30` |

---

## A5. Native `<select>` Replacements

**Standard rule violated**: S4.3 — MUST use `<FilterDropdown>` from `src/components/common/FilterDropdown.tsx`. Native `<select>` bypasses keyboard nav, focus ring, and theming.

| File                                                                                | Approximate count | Notes                                                   |
| ----------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------- |
| `src/components/Algorithms/InteractivePlayground.tsx`                               | 5                 | Algorithm selectors, key size, mode — all single-select |
| `src/components/Algorithms/AlgorithmComparison.tsx`                                 | 1                 | Sort control                                            |
| `src/components/PKILearning/modules/PKIWorkshop/RootCAGenerator.tsx`                | 2                 | Key algorithm, validity period                          |
| `src/components/PKILearning/modules/PKIWorkshop/CertSigner.tsx`                     | 2                 | Algorithm, hash                                         |
| `src/components/PKILearning/modules/PKIWorkshop/CSRGenerator.tsx`                   | 1                 | Key type                                                |
| `src/components/PKILearning/modules/PKIWorkshop/CRLGenerator.tsx`                   | 1                 | Hash algorithm                                          |
| `src/components/PKILearning/modules/TLSBasics/components/TLSNegotiationResults.tsx` | 1                 | Protocol version                                        |
| `src/components/PKILearning/modules/TLSBasics/components/FileSelectionModal.tsx`    | 1                 | Certificate selection                                   |
| `src/components/OpenSSLStudio/components/configs/LmsConfig.tsx`                     | 3                 | LMS parameter sets                                      |
| `src/components/Compliance/ComplianceTable.tsx`                                     | 1                 | Rows per page                                           |
| `src/components/PKILearning/modules/Quiz/components/TopicSelector.tsx`              | 1                 | Topic selection                                         |

**Total**: ~19 native `<select>` elements across 11 files.

**Migration approach**: `FilterDropdown` accepts `items: { id: string; label: string }[]`, `selectedId`, and `onSelect`. The `label` prop sets the visible trigger label. No external library needed.

---

## A6. Hardcoded Color in Data Objects

**Standard rule violated**: S1.2 — color class strings stored in data/config objects are still injected into the DOM and bypass the token system.

| File                                                                                | Field        | Violation values                                             | Correct replacement                                   |
| ----------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------ | ----------------------------------------------------- |
| `src/components/PKILearning/modules/DigitalID/utils/cryptoConstants.ts:181`         | `color`      | `'text-blue-400'`                                            | `'text-primary'`                                      |
| `src/components/PKILearning/modules/DigitalID/utils/cryptoConstants.ts:233,240,247` | `color`      | `'text-purple-400'`, `'text-green-400'`, `'text-orange-400'` | `'text-secondary'`, `'text-accent'`, `'text-warning'` |
| `src/components/PKILearning/modules/DigitalID/utils/cryptoConstants.ts:316`         | `color`      | `'text-red-400'`                                             | `'text-destructive'`                                  |
| `src/components/PKILearning/modules/DigitalID/utils/outputFormatters.ts:105`        | return value | `'text-blue-400'`                                            | `'text-primary'`                                      |
| `src/components/PKILearning/modules/DigitalAssets/utils/outputFormatters.ts:105`    | return value | `'text-blue-400'`                                            | `'text-primary'`                                      |
| `src/components/Migrate/InfrastructureStack.tsx:29`                                 | `iconColor`  | `'text-blue-400'`                                            | `'text-primary'`                                      |
| `src/components/Migrate/InfrastructureStack.tsx:49`                                 | `iconColor`  | `'text-purple-400'`                                          | `'text-secondary'`                                    |
| `src/components/Migrate/InfrastructureStack.tsx:80`                                 | `iconColor`  | `'text-orange-400'`                                          | `'text-warning'`                                      |

---

## Priority Matrix

| Category                     | Severity | Fix Effort                                                  | Files   | Why it matters                                                                                            |
| ---------------------------- | -------- | ----------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------- |
| A3. CSS token bug            | Critical | Low (2 CSS rules)                                           | 1       | Blocks correct use of `.text-status-info` everywhere; all A1 "info" rows depend on this being fixed first |
| A1. Hardcoded status colors  | Critical | Medium (80+ class swaps, mostly mechanical)                 | 25      | Breaks light mode and print mode; high visual impact                                                      |
| A2. Hardcoded surface colors | Critical | Low–Medium (20+ swaps; 4 are in foundational UI components) | 12      | `input.tsx` and `button-variants.ts` fixes cascade to fix all consumers; highest leverage                 |
| A4. Missing components       | High     | Medium (4 new components, small)                            | 0→4 new | Required before A1 region/complexity badges can be properly fixed                                         |
| A5. Native `<select>`        | Medium   | Medium (19 replacements; each needs prop mapping)           | 11      | Affects keyboard nav and accessibility; not a visual regression                                           |
| A6. Color in data objects    | Medium   | Low (string replacement in 4 files)                         | 4       | Easy wins; low risk                                                                                       |

### Recommended fix order

1. **A3** — Fix `--info` token in `src/styles/index.css` (unblocks ~15 `.text-status-info` uses)
2. **A2 (UI primitives first)** — Fix `input.tsx`, `button-variants.ts`, `code-block.tsx` (cascades to all consumers)
3. **A4** — Create `<CategoryBadge>`, `<Skeleton>`, `<EmptyState>`, `<ErrorAlert>`
4. **A1** — Mechanical sweep of hardcoded palette classes, file by file (use `<CategoryBadge>` where applicable)
5. **A6** — Replace color strings in data/config objects
6. **A5** — Replace native `<select>` with `<FilterDropdown>` (higher effort, lower urgency)
7. **A2 (remaining)** — Fix surface colors in page components (InfrastructureStack, Library, PKI modules)
