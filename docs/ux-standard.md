# UX Standard — PQC Timeline App

> **Status**: Authoritative. All rules expressed with **MUST** are non-negotiable. Rules expressed with **SHOULD** represent strong defaults requiring explicit justification to override. Rules expressed with **MAY** indicate acceptable variation within constraints.
>
> This document governs all files under `src/components/`, `src/styles/index.css`, and `src/components/ui/`. Violations are catalogued in [`docs/ux-gap-analysis.md`](./ux-gap-analysis.md).

---

## Table of Contents

- [Part I — Shared Standards](#part-i--shared-standards)
  - [S1. Semantic Token System](#s1-semantic-token-system)
  - [S2. Typography](#s2-typography)
    - [S2.4 Prose / Markdown Styling](#s24-prose--markdown-styling)
  - [S3. Spacing and Layout](#s3-spacing-and-layout)
    - [S3.5 Icon + Text Layout Conventions](#s35-icon--text-layout-conventions)
  - [S4. Component Contracts](#s4-component-contracts)
    - [S4.9 Modal / Popover / Dialog](#s49-modal--popover--dialog)
    - [S4.10 Data Table Structure](#s410-data-table-structure)
    - [S4.11 Form Input Variants](#s411-form-input-variants)
  - [S5. Interaction States](#s5-interaction-states)
  - [S6. Responsive Design and Mobile UX](#s6-responsive-design-and-mobile-ux)
    - [S6.11 Text Overflow and Truncation](#s611-text-overflow-and-truncation)
  - [S7. Accessibility](#s7-accessibility)
  - [S8. Icons](#s8-icons)
  - [S9. Animation and Motion](#s9-animation-and-motion)
  - [S10. Data Loading, Empty, and Error States](#s10-data-loading-empty-and-error-states)
- [Part II — Per-Page Sub-Standards](#part-ii--per-page-sub-standards)
  - [P1. Landing (`/`)](#p1-landing-)
  - [P2. Timeline (`/timeline`)](#p2-timeline-timeline)
  - [P3. Algorithms (`/algorithms`)](#p3-algorithms-algorithms)
  - [P4. Library (`/library`)](#p4-library-library)
  - [P5. Learn (`/learn/*`)](#p5-learn-learn)
  - [P6. Playground (`/playground`)](#p6-playground-playground)
  - [P7. OpenSSL Studio (`/openssl`)](#p7-openssl-studio-openssl)
  - [P8. Threats (`/threats`)](#p8-threats-threats)
  - [P9. Leaders (`/leaders`)](#p9-leaders-leaders)
  - [P10. Compliance (`/compliance`)](#p10-compliance-compliance)
  - [P11. Migrate (`/migrate`)](#p11-migrate-migrate)
  - [P12. Assess (`/assess`)](#p12-assess-assess)
  - [P13. About (`/about`)](#p13-about-about)

---

## Part I — Shared Standards

### S1. Semantic Token System

All color values in the UI **MUST** be expressed through the semantic token system defined in `src/styles/index.css`. The token system provides automatic light/dark mode switching, print mode overrides, and design cohesion across the entire app. Using raw Tailwind palette classes bypasses all three.

#### S1.1 Token Catalogue

**Background tokens**

| Token           | Usage                                                    |
| --------------- | -------------------------------------------------------- |
| `bg-background` | Page / root background                                   |
| `bg-card`       | Card and panel fill                                      |
| `bg-muted`      | Secondary surfaces, table header rows, input backgrounds |
| `bg-popover`    | Dropdown menus, tooltips, floating surfaces              |

**Text tokens**

| Token                     | Usage                                    |
| ------------------------- | ---------------------------------------- |
| `text-foreground`         | Primary readable text                    |
| `text-muted-foreground`   | Metadata, captions, de-emphasized labels |
| `text-card-foreground`    | Text on card surfaces                    |
| `text-primary-foreground` | Text on primary-colored backgrounds      |

**Brand accent tokens**

| Token                             | Hue     | Semantic meaning                                   |
| --------------------------------- | ------- | -------------------------------------------------- |
| `text-primary` / `bg-primary`     | Cyan    | Primary brand, CTAs, active states, links          |
| `text-secondary` / `bg-secondary` | Purple  | Secondary accent, features, algorithm highlights   |
| `text-accent` / `bg-accent`       | Teal    | Confirmation, success-adjacent, signing operations |
| `text-tertiary` / `bg-tertiary`   | Magenta | Tertiary accent — use sparingly                    |

**Status tokens (use the class helpers, not the raw token)**

| Class                                         | Semantic meaning                                         |
| --------------------------------------------- | -------------------------------------------------------- |
| `.text-status-error` / `.bg-status-error`     | Error, failure, MUST NOT                                 |
| `.text-status-warning` / `.bg-status-warning` | Warning, degraded, caution                               |
| `.text-status-success` / `.bg-status-success` | Success, confirmed, ready                                |
| `.text-status-info` / `.bg-status-info`       | Informational, neutral notice _(see S1.3 for known bug)_ |

**Phase tokens** — timeline domain only

`text-phase-discovery`, `text-phase-testing`, `text-phase-poc`, `text-phase-migration`,
`text-phase-standardization`, `text-phase-guidance`, `text-phase-policy`,
`text-phase-regulation`, `text-phase-research`, `text-phase-deadline`

**File type tokens** — OpenSSL Studio and file-handling contexts only

`text-file-key`, `text-file-cert`, `text-file-csr` (and their `-foreground` counterparts)

**Border tokens**

| Token           | Usage                           |
| --------------- | ------------------------------- |
| `border-border` | Default borders on all surfaces |
| `border-input`  | Input field borders             |
| `border-ring`   | Focus ring color                |

#### S1.2 Mandatory Rules

- **MUST**: Every color applied to text, background, or border **MUST** use a semantic token from the catalogue above.

- **MUST NOT**: Do not use hardcoded Tailwind palette classes: `text-blue-400`, `text-green-500`, `text-red-400`, `text-yellow-300`, `text-orange-400`, `text-purple-400`, `text-gray-500`, `text-cyan-400`, `text-emerald-400`, or any equivalents. These bypass dark/light mode switching and print overrides.

- **MUST NOT**: Do not use opacity-modified absolute colors for surfaces: `bg-black/40`, `bg-white/5`, `bg-white/10`, `bg-zinc-950`, `bg-zinc-900`, `border-white/10`, `border-white/20`. Replace with the appropriate muted token: `bg-muted`, `bg-muted/50`, `border-border`, `border-border/50`.

- **EXCEPTION — Full-screen overlays**: `fixed inset-0` backdrop overlays **MAY** use `bg-black/60` because they intentionally darken regardless of theme. This is the only permitted use of a hardcoded background color.

- **EXCEPTION — Print**: CSS inside `@media print` blocks may force specific HSL values for print legibility. Do not change print-mode CSS without reviewing the print architecture in `MEMORY.md`.

#### S1.3 Info Token: `--info`

The `.text-status-info` and `.bg-status-info` classes resolve via a `--info` CSS custom property defined in `src/styles/index.css`:

- Light mode: `--info: 217 91% 60%`
- Dark mode: `--info: 213 93% 68%`

```css
.text-status-info {
  color: hsl(var(--info));
}
.bg-status-info {
  background-color: hsl(var(--info) / 0.1);
  border-color: hsl(var(--info) / 0.2);
}
```

Use `.text-status-info` / `.bg-status-info` for informational notices, neutral state chips, and "In Progress" badges.

---

### S2. Typography

#### S2.1 Type Scale

| Level            | Tailwind classes                                                    | Usage                                        |
| ---------------- | ------------------------------------------------------------------- | -------------------------------------------- |
| Hero title       | `text-3xl md:text-5xl lg:text-6xl font-bold`                        | Landing hero `<h1>` only                     |
| Page title       | `text-2xl md:text-4xl font-bold text-gradient`                      | Primary `<h1>` / `<h2>` on each content page |
| Section title    | `text-xl font-semibold text-foreground`                             | Major sections within a page                 |
| Subsection title | `text-lg font-semibold text-foreground`                             | Panel headers, card titles, sub-sections     |
| Body             | `text-sm text-foreground` or `text-base text-foreground`            | Paragraphs, descriptive copy                 |
| Caption / helper | `text-xs text-muted-foreground`                                     | Metadata, dates, data source attributions    |
| Mono label       | `font-mono text-xs uppercase tracking-widest text-muted-foreground` | Version tags, data source lines              |
| Code inline      | `font-mono text-sm`                                                 | Inline code, hex strings, key values         |

#### S2.2 Gradient Headings

- **MUST**: The `.text-gradient` utility **MUST** be used on the primary page title of every content page.
- **MUST NOT**: Do not apply `.text-gradient` to text smaller than `text-lg` — gradient text at small sizes is illegible and fails contrast requirements.
- **MUST NOT**: Do not apply `.text-gradient` to body copy, labels, or secondary headings.

#### S2.3 Font Family

The font stack is `Inter, system-ui, sans-serif` set in `@theme`. **MUST NOT** introduce additional font families via inline styles or additional CSS imports.

#### S2.4 Prose / Markdown Styling

The app renders markdown in `ChangelogView` and `AboutView` using `@tailwindcss/typography`. Canonical token mapping:

```tsx
className="prose prose-invert max-w-none
  prose-headings:text-foreground
  prose-p:text-muted-foreground
  prose-li:text-muted-foreground
  prose-a:text-primary
  prose-strong:text-foreground
  prose-code:text-primary prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
  prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-h2:mt-8
  prose-h3:text-lg prose-h3:text-primary"
```

**Rules**:

- **MUST** use `prose-invert` — without it, prose produces light-mode colors on dark backgrounds
- **MUST** apply the full token-mapping class string above — never use bare `prose` or `prose prose-invert` alone
- **MUST NOT** override prose styles with raw palette classes — use `prose-*:` modifier syntax to stay semantic
- **MUST** use `max-w-none` to allow the prose container to fill its parent (do not rely on prose's default width cap)

---

### S3. Spacing and Layout

#### S3.1 Container

All pages are already wrapped by the `.container` class on `<main>` in `MainLayout.tsx` (`max-w-7xl mx-auto px-4 md:px-8`). Page components **SHOULD NOT** re-wrap their outermost element in another `.container`.

Pages with focused content **MAY** use a narrower max-width internally (e.g., `max-w-4xl mx-auto` for About, `max-w-2xl mx-auto` for wizard steps) but **MUST** remain within the outer `max-w-7xl` container.

#### S3.2 Vertical Rhythm

| Context                        | Classes                                                        |
| ------------------------------ | -------------------------------------------------------------- |
| Between major page sections    | `space-y-16 md:space-y-24` (Landing), `space-y-6` (data pages) |
| Between cards in a grid        | `gap-4` standard, `gap-3` compact                              |
| Header → first content section | `mb-8 md:mb-12`                                                |
| Description paragraph width    | `max-w-2xl` centered, `max-w-3xl` wide layouts                 |
| Paragraph blocks               | `mb-2`, `mb-4` between paragraphs                              |

#### S3.3 Glass Panel

The `.glass-panel` utility **MUST** be used for all card containers, modal dialogs, pane containers, and sidebar panels.

```css
/* Definition in src/styles/index.css */
.glass-panel {
  @apply bg-card/80 backdrop-blur-md border border-border rounded-2xl shadow-2xl;
}
```

- **MUST NOT**: Do not add redundant background color classes (`bg-card`, `bg-background`) on top of `.glass-panel` — creates double-paint artifacts.
- **MUST NOT**: Do not add explicit border-radius classes that override `rounded-2xl`.
- Internal panel sub-headers **MAY** use `bg-muted border-b border-border` as a secondary surface within a `.glass-panel`.

#### S3.4 Page Header Structure

Every content page (all routes except Landing and About) **MUST** follow this header structure:

```tsx
<div className="mb-8 md:mb-12">
  {/* Title row */}
  <div className="flex items-center gap-3 mb-3">
    <Icon size={28} className="text-primary" aria-hidden="true" />
    <h1 className="text-2xl md:text-4xl font-bold text-gradient">Page Title</h1>
  </div>

  {/* Description + utility cluster */}
  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
    <p className="text-muted-foreground max-w-2xl text-sm md:text-base">Page description.</p>
    <div className="hidden md:flex items-center gap-2">
      {/* Data source attribution (where applicable) */}
      <span className="text-xs text-muted-foreground/60 font-mono hidden lg:block">
        source-file.csv · Jan 2026
      </span>
      <SourcesButton viewType="PageName" /> {/* where data provenance applies */}
      <ShareButton />
      <GlossaryButton />
    </div>
  </div>
</div>
```

- **MUST**: Utility button cluster (`SourcesButton`, `ShareButton`, `GlossaryButton`) **MUST** appear on `hidden md:flex` on most pages.
- **EXCEPTION — Timeline**: Use `hidden lg:flex` because the `md:` breakpoint is claimed by the filter controls row.
- **MUST NOT**: Do not render the utility cluster on Landing or About — these are not data pages.

#### S3.5 Icon + Text Layout Conventions

Three canonical forms:

**Page header** (icon + `text-gradient` h1):

```tsx
<div className="flex items-center gap-3">
  <Icon size={28} className="text-primary" aria-hidden="true" />
  <h1 className="text-2xl md:text-4xl font-bold text-gradient">Title</h1>
</div>
```

**Section header** (icon + `text-lg` h2/h3):

```tsx
<div className="flex items-center gap-2">
  <Icon size={18} className="text-primary" aria-hidden="true" />
  <h2 className="text-lg font-semibold text-foreground">Section</h2>
</div>
```

**Inline label** (metadata, status, badges):

```tsx
<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
  <Icon size={14} aria-hidden="true" />
  <span>Label text</span>
</div>
```

**Gap conventions**:

| Context         | Gap       |
| --------------- | --------- |
| Inline metadata | `gap-1.5` |
| Section header  | `gap-2`   |
| Page header     | `gap-3`   |
| Feature card    | `gap-4`   |

**Rules**:

- **MUST** use `flex items-center` (never `inline-flex` unless inside `<span>`)
- **MUST** mark decorative icons `aria-hidden="true"` — including all page header and feature card icons
- **MUST NOT** use `gap-1` for icon+text — minimum is `gap-1.5` to prevent icon/text collision at small sizes

---

### S4. Component Contracts

#### S4.1 Button

**MUST** use `<Button>` from `src/components/ui/button.tsx` for all interactive click targets that trigger actions. Raw `<button>` elements **MUST NOT** appear in production component code.

| Variant       | When to use                                                  |
| ------------- | ------------------------------------------------------------ |
| `gradient`    | Primary CTA — one per section maximum                        |
| `outline`     | Secondary CTA alongside a `gradient` button                  |
| `ghost`       | Navigation items, toolbar actions, icon-only controls        |
| `secondary`   | Alternate filled action, lower visual weight than `gradient` |
| `destructive` | Irreversible actions: delete, reset, revoke                  |
| `link`        | Inline text links with external navigation                   |
| `default`     | Direct background-colored button; use sparingly              |

Size rules:

- `size="lg"` — Hero CTAs only
- `size="default"` — Standard actions
- `size="sm"` — Compact filter bars, toolbar actions
- `size="icon"` — Square icon-only buttons (`aria-label` required)

#### S4.2 Input

**MUST** use `<Input>` from `src/components/ui/input.tsx` for all single-line text entry. Native `<input>` elements **MUST NOT** be used unless inside a component that wraps `<Input>` (e.g., hidden file inputs — `type="file" className="hidden"`).

`Input` currently uses `bg-muted border border-input`.

#### S4.3 Select / Dropdown

**MUST** use `<FilterDropdown>` from `src/components/common/FilterDropdown.tsx` for all dropdown selection controls. This component handles keyboard navigation, `aria-expanded`, `aria-labelledby`, and click-outside dismissal.

**MUST NOT** use native `<select>` elements in new code. All 20+ existing native `<select>` elements are legacy violations pending replacement (see gap analysis A5).

`FilterDropdown` supports both single-select (`selectedId` / `onSelect`) and multi-select (`multiSelectedIds` / `onMultiSelect`) via the same component.

#### S4.4 Tabs

**MUST** use `<Tabs>`, `<TabsList>`, `<TabsTrigger>`, `<TabsContent>` from `src/components/ui/tabs.tsx`.

- `TabsList` **MUST** receive `className="bg-muted/50 border border-border"`.
- `TabsContent` adjacent to tables **MUST** use `className="mt-0"` to avoid double spacing.

#### S4.5 CodeBlock

**MUST** use `<CodeBlock>` from `src/components/ui/code-block.tsx` for all multi-line code display.

`CodeBlock` currently uses `bg-muted py-4`.

Inline code snippets (short values, hex strings, keys) **MUST** use `<code className="font-mono text-sm">` directly rather than `<CodeBlock>`.

#### S4.6 Badge / StatusBadge

- **MUST** use `<StatusBadge>` from `src/components/common/StatusBadge.tsx` for "New" / "Updated" content freshness markers.
- **MUST** use `.text-status-*` and `.bg-status-*` classes for criticality and level badges (Threats, Compliance, Assess risk tiers).
- **MUST** use `<CategoryBadge>` from `src/components/ui/category-badge.tsx` for region and classification badges (SourcesModal, Glossary).

Category → token mapping for `<CategoryBadge>`:

| Category             | Token                                                |
| -------------------- | ---------------------------------------------------- |
| Americas / Algorithm | `text-primary bg-primary/10 border-primary/30`       |
| APAC / Protocol      | `text-secondary bg-secondary/10 border-secondary/30` |
| EMEA / Standard      | `text-accent bg-accent/10 border-accent/30`          |
| Global / Concept     | `text-muted-foreground bg-muted border-border`       |
| Beginner             | `.bg-status-success .text-status-success`            |
| Intermediate         | `.bg-status-info .text-status-info`                  |
| Advanced             | `text-secondary bg-secondary/10 border-secondary/30` |

#### S4.7 Utility Cluster Components

`SourcesButton`, `ShareButton`, and `GlossaryButton` **MUST** compose identically:

```tsx
className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30
           text-primary text-sm font-medium transition-colors border border-primary/30"
```

Do not alter this pattern — it is already fully semantic.

#### S4.8 UI Utility Components

These components exist in `src/components/ui/`:

| Component         | Path                                   | Purpose                                                                                    |
| ----------------- | -------------------------------------- | ------------------------------------------------------------------------------------------ |
| `<Skeleton>`      | `src/components/ui/skeleton.tsx`       | Inline loading placeholder — `animate-pulse bg-muted rounded`                              |
| `<EmptyState>`    | `src/components/ui/empty-state.tsx`    | Zero-results state with icon, title, description, optional action button                   |
| `<ErrorAlert>`    | `src/components/ui/error-alert.tsx`    | Inline recoverable-error display — glass-panel with `border-l-4 border-l-destructive`      |
| `<CategoryBadge>` | `src/components/ui/category-badge.tsx` | Region/classification badges — replaces hardcoded `regionColors` / `complexityColors` maps |

**Rules**:

- **MUST** use `<Skeleton>` for all inline loading placeholders (not `animate-pulse` directly)
- **MUST** use `<EmptyState>` for all zero-result states (not ad-hoc centered divs)
- **MUST** use `<ErrorAlert>` for all inline error display (not raw `bg-red-*` divs)
- **MUST** use `<CategoryBadge>` for region and complexity/level classification badges

#### S4.9 Modal / Popover / Dialog

Two canonical variants:

**Variant A — Centered overlay modal** (SourcesModal, Glossary):

```tsx
{
  /* Backdrop */
}
;<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
{
  /* Container */
}
;<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <motion.div
    className="glass-panel p-6 max-w-4xl w-full max-h-[85vh] overflow-y-auto"
    initial={{ opacity: 0, scale: 0.95, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: 20 }}
  >
    {/* content */}
  </motion.div>
</div>
```

**Variant B — Positioned popover** (LibraryDetailPopover, GanttDetailPopover):

```tsx
<div
  className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
             w-[90vw] max-w-[36rem] bg-popover text-popover-foreground
             border border-border rounded-xl shadow-2xl overflow-hidden
             animate-in zoom-in-95 duration-200"
  style={{ zIndex: 9999 }}
>
```

**Close button canonical**:

```tsx
<button
  onClick={onClose}
  aria-label="Close"
  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
>
  <X size={18} aria-hidden="true" />
</button>
```

**Rules**:

- **MUST** use `style={{ zIndex: 9999 }}` on Variant B popover containers — Tailwind's `z-` scale does not reach this value
- **MUST** use `backdrop-blur-sm` on all overlay backdrops
- **MUST** trap focus and close on `Escape` (follow `SourcesModal` / `Glossary` patterns)
- **MUST** use Framer Motion or `animate-in zoom-in-95 duration-200` for entry animation
- **MUST** use `.glass-panel` for Variant A centered modals
- **MUST** use `bg-popover` for Variant B positioned popovers
- **MAY** use `bg-black/60` for backdrop — the only permitted hardcoded background color (see S1.2 exception)
- **MUST NOT** use `rounded-2xl` on Variant B — use `rounded-xl` to distinguish from glass-panel cards

---

#### S4.10 Data Table Structure

Canonical table skeleton:

```tsx
<div className="glass-panel overflow-hidden">
  <table className="w-full text-left border-collapse">
    <thead>
      <tr className="border-b border-border bg-muted/20">
        <th className="p-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Column
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-border/40">
      <tr className="hover:bg-muted/50 transition-colors">
        <td className="p-4 text-sm text-foreground">Value</td>
      </tr>
    </tbody>
  </table>
</div>
```

**Sticky headers** (tall tables): `<thead className="sticky top-0 backdrop-blur-md z-10 ...">`.

**Sortable columns**: add `cursor-pointer hover:text-primary transition-colors` to `<th>`. Sort indicator: `<ChevronUp size={14} className="inline ml-1" />`.

**Row states**:

| State    | Class                                             |
| -------- | ------------------------------------------------- |
| Default  | (inherits glass-panel)                            |
| Hover    | `hover:bg-muted/50 transition-colors`             |
| Selected | `bg-primary/10`                                   |
| Error    | `bg-status-error` (via `.bg-status-error` helper) |

**Dense tables** (logs, ACVP, OpenSSL output): use `p-2` instead of `p-4` for cells; `text-xs` for body text.

**Rules**:

- **MUST** wrap all tables in `glass-panel overflow-hidden`
- **MUST** use `divide-y divide-border/40` on `<tbody>` — not `border-b` per row
- **MUST** use `bg-muted/20` on thead background
- **MUST NOT** use `border-white/5` or `divide-white/5` on table rows

---

#### S4.11 Form Input Variants

**Checkbox** (canonical from AttributeTable / CSRGenerator):

```tsx
<input
  type="checkbox"
  className="rounded border-border bg-muted text-primary focus:ring-primary cursor-pointer w-4 h-4"
/>
```

**Textarea**:

```tsx
<textarea
  rows={4}
  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground
             focus:outline-none focus:border-primary/50 resize-none
             placeholder:text-muted-foreground/50"
/>
```

**Input with leading icon** (search bars — canonical across Library, Threats, Algorithms, Learn):

```tsx
<div className="relative">
  <Search
    size={16}
    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
    aria-hidden="true"
  />
  <input
    type="text"
    className="w-full bg-muted border border-border rounded-lg pl-9 pr-3 py-2 text-sm
               focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground/50"
  />
</div>
```

**Input validation states**:

| State   | Border class                                     | Note                                                       |
| ------- | ------------------------------------------------ | ---------------------------------------------------------- |
| Default | `border-border focus:border-primary/50`          | —                                                          |
| Error   | `border-destructive/50 focus:border-destructive` | Pair with `<p className="text-xs text-status-error mt-1">` |
| Success | `border-accent/50 focus:border-accent`           | Use sparingly — only after explicit validation             |

**Rules**:

- **MUST** use `bg-muted border border-border` as baseline surface for ALL form inputs
- **MUST NOT** use `bg-black/40` or `bg-background` on any form input
- All search inputs in mobile views **MUST** use the leading-icon pattern (see S6.7)
- All search inputs in desktop views **SHOULD** use the leading-icon pattern
- Checkboxes **MUST** use `text-primary` as their checked-color to match the brand accent

---

### S5. Interaction States

#### S5.1 Hover

Standard hover pattern:

| Element         | Classes                                                 |
| --------------- | ------------------------------------------------------- |
| Card / panel    | `hover:border-primary/30 transition-colors`             |
| Background fill | `hover:bg-primary/10` or `hover:bg-muted/50`            |
| Text in a group | `group-hover:text-primary transition-colors`            |
| CTA button lift | `hover:-translate-y-0.5` (built into `gradient` Button) |

- **MUST NOT**: Use `hover:bg-white/10` — replace with `hover:bg-muted/50` or `hover:bg-primary/10`.

#### S5.2 Focus

All interactive elements **MUST** have a visible focus ring:

```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
```

This is built into `Button`, `FilterDropdown`, `Input`, and `Tabs`. Custom interactive elements **MUST** manually add this pattern.

- **MUST NOT**: Suppress focus outlines with `outline-none` alone without providing a visible alternative.

#### S5.3 Disabled

```
disabled:pointer-events-none disabled:opacity-50
```

Built into `Button` and `Input`. Custom elements must replicate this pattern.

#### S5.4 Active / Selected

| Context                  | Classes                                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| Tab (active)             | `data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm` |
| Nav item (active)        | `bg-primary/10 text-foreground border border-primary/20`                                              |
| Filter option (selected) | `text-primary bg-muted/30`                                                                            |

#### S5.5 Touch Targets

All interactive elements **MUST** have a minimum touch target of 44×44 px on mobile. Use `min-h-[44px]` on elements that may be smaller at mobile breakpoints. The canonical pattern from `MainLayout` is `min-h-[44px] lg:min-h-0`.

---

### S6. Responsive Design and Mobile UX

#### S6.1 Mobile / Desktop Split Strategy

The app is **desktop-first in data density but mobile-first in base styles**. Complex data-heavy pages ship two separate component trees — a lightweight mobile view and a full-featured desktop view — toggled by breakpoint:

```tsx
{
  /* Mobile — shown below lg breakpoint */
}
;<div className="lg:hidden">
  <MobileFooView />
</div>
{
  /* Desktop — shown at lg and above */
}
;<div className="hidden lg:block">
  <DesktopFooView />
</div>
```

> **Note**: The primary split breakpoint is `lg:` (1024 px), not `md:`. `md:` is used only for secondary layout adjustments (padding, column count). All mobile component filenames follow the `Mobile<PageName>View.tsx` convention.

Pages that currently have a Mobile component:

| Page       | Mobile component           |
| ---------- | -------------------------- |
| Timeline   | `MobileTimelineList.tsx`   |
| Algorithms | `MobileAlgorithmList.tsx`  |
| Threats    | `MobileThreatsList.tsx`    |
| Compliance | `MobileComplianceView.tsx` |
| Playground | `MobilePlaygroundView.tsx` |
| About      | `MobileAboutView.tsx`      |

Pages with intrinsically responsive content (Landing, Library, Leaders, Assess, Migrate, Changelog) **MAY** use responsive Tailwind classes without a separate Mobile component.

- **MUST NOT**: Add a complex data table or multi-pane layout to a page without also creating a corresponding Mobile component.
- **MUST NOT**: Hide content from mobile users without providing a mobile-appropriate equivalent.

#### S6.2 Breakpoints

| Prefix | Width   | Role                                                                          |
| ------ | ------- | ----------------------------------------------------------------------------- |
| `sm:`  | 640 px  | Rarely needed; prefer `lg:` for major shifts                                  |
| `md:`  | 768 px  | Secondary adjustments: padding, column count, container width                 |
| `lg:`  | 1024 px | **Primary breakpoint** — mobile/desktop component split, nav label visibility |
| `xl:`  | 1280 px | Wide table columns, extended layouts                                          |

#### S6.3 Navigation Mobile Behavior

The `MainLayout` nav is the canonical mobile navigation pattern. All rules are derived from `src/components/layout/MainLayout.tsx`.

- **Structure**: `flex flex-row flex-nowrap overflow-x-auto no-scrollbar` — icons scroll horizontally if the viewport is narrow.
- **Touch targets**: Nav buttons use `min-h-[44px] lg:min-h-0` — 44 px on mobile, auto on desktop.
- **Labels**: Icon always visible; text label uses `hidden lg:inline` — hidden on mobile.
- **Active state**: `bg-primary/10 text-foreground border border-primary/20`.
- **Routes hidden on mobile**: `/playground` and `/openssl` use `hidden lg:block` in the nav item because they require desktop-level screen space. They MUST NOT appear in the mobile nav.
- **Brand**: Abbreviated "PQC" on mobile (`lg:hidden`), full "PQC Today" on desktop (`hidden lg:block`).
- **`no-scrollbar`**: Defined in `src/styles/index.css`; hides the scrollbar track while preserving scroll function. **MUST** be used on any horizontally scrollable nav or tab bar on mobile.

#### S6.4 Mobile Card Standards

Mobile component cards **MUST** follow this structure:

```tsx
<div className="glass-panel p-4 [flex or grid internals]">{/* content */}</div>
```

| Rule                    | Value                                                                |
| ----------------------- | -------------------------------------------------------------------- |
| Container               | `glass-panel p-4`                                                    |
| Card list gap           | `space-y-3` or `gap-3`                                               |
| Internal element gap    | `gap-2` (tight) to `gap-4` (loose)                                   |
| Bottom scroll clearance | `pb-8` on the outermost scrollable container                         |
| Active tap feedback     | `active:scale-[0.98] transition-transform` on tappable cards         |
| Line clamping           | `line-clamp-2` or `line-clamp-3` on descriptions to prevent overflow |

- **MUST**: Every tappable card **MUST** use `active:scale-[0.98] transition-transform` to provide haptic-like tap feedback.
- **MUST NOT**: Do not use `hover:` states as the sole affordance on mobile — they do not fire on touch. Pair with `active:` states.

#### S6.5 Mobile Touch Targets

| Element type                                      | Minimum size | Implementation                                                        |
| ------------------------------------------------- | ------------ | --------------------------------------------------------------------- |
| Primary interactive (buttons, nav, card tap area) | 44×44 px     | `min-h-[44px]` or full-width `w-full` card                            |
| Secondary controls (filter chips, tab triggers)   | 36×36 px     | `h-9 px-3` (Button `size="sm"`)                                       |
| Tertiary indicators (phase dots, icon toggles)    | 28×28 px     | `min-w-[28px] min-h-[28px]` — acceptable only when keyboard-navigable |

- **MUST**: Primary interactive elements on mobile **MUST** meet 44×44 px.
- **MUST NOT**: Do not use `size="icon"` (40×40 px) for standalone tap targets without adding `min-h-[44px] min-w-[44px]`.

#### S6.6 Mobile Typography

| Level                | Classes                         | Notes                                             |
| -------------------- | ------------------------------- | ------------------------------------------------- |
| Page / section title | `text-2xl font-bold`            | Used in `MobilePlaygroundView`, `MobileAboutView` |
| Sub-heading          | `text-lg font-semibold`         | Card group headings                               |
| Body                 | `text-sm text-foreground`       | Standard card body copy                           |
| Metadata / labels    | `text-xs text-muted-foreground` | Dates, counts, category labels                    |

- **MUST NOT**: Use `text-[10px]` or smaller — below 12 px fails WCAG minimum font size guidance.
- **MUST NOT**: Use `text-xs` for primary readable content — it is reserved for metadata only.

#### S6.7 Mobile Form Inputs

On mobile, inputs need adequate size and spacing for finger interaction:

- `<Input>` height is `h-10` (40 px) — acceptable but not ideal. Do not reduce below this.
- Search inputs in mobile views **MUST** include a leading icon (`pl-9` with positioned `<Search>` icon) for visual affordance.
- Filter chips (compact toggle buttons) use `px-3 py-1.5 rounded-full border text-xs font-medium` — this is the canonical mobile filter pattern.
- **MUST NOT**: Use `size="sm"` buttons (`h-9`) as the sole primary action on a mobile view — use `size="default"` (`h-10`) or `size="lg"` (`h-11`).

#### S6.8 Safe Area and Scroll Clearance

- **Footer**: **MUST** apply `.safe-bottom` class (`padding-bottom: env(safe-area-inset-bottom)`) to prevent content from being obscured by iPhone notch/home indicator.
- **Scrollable lists**: **MUST** apply `pb-8` as bottom clearance on any vertically scrollable mobile content container.
- **Horizontal scroll containers**: **MUST** use `overflow-x-auto no-scrollbar` to allow scroll without visible scrollbar chrome.

#### S6.9 Desktop-Only Features

Some features are intentionally unavailable on mobile due to screen space constraints:

| Feature                                | Breakpoint gate                      | Reason                                             |
| -------------------------------------- | ------------------------------------ | -------------------------------------------------- |
| `/playground` route                    | `hidden lg:block` in nav             | Full WASM crypto REPL requires side-by-side panels |
| `/openssl` route                       | `hidden lg:block` in nav             | 3-pane IDE layout requires ≥1024 px                |
| Utility cluster (`SourcesButton` etc.) | `hidden md:flex` or `hidden lg:flex` | Secondary controls deprioritised on small screens  |
| Data source attribution line           | `hidden lg:block`                    | Fine-print metadata not essential on mobile        |
| Gantt chart                            | `hidden lg:block`                    | Replaced by `MobileTimelineList`                   |

- **MUST NOT**: Expose `/openssl` or `/playground` routes in mobile navigation.
- **MUST**: Any feature hidden on mobile **MUST** have an accessible mobile-appropriate equivalent OR be clearly non-essential secondary functionality.

#### S6.10 Grid Patterns

| Pattern                   | Classes                                                                          |
| ------------------------- | -------------------------------------------------------------------------------- |
| Feature card grid         | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`                           |
| Two-column equal          | `grid grid-cols-1 md:grid-cols-2 gap-4`                                          |
| Stats row                 | `grid grid-cols-2 md:grid-cols-4 gap-4`                                          |
| Mobile internal card grid | `grid grid-cols-2 gap-2` (e.g., risk/replacement columns in MobileThreatsList)   |
| OpenSSL 3-pane            | `grid grid-cols-12 gap-6` → left `col-span-4`, right `col-span-8` (desktop only) |

#### S6.11 Text Overflow and Truncation

| Pattern              | Class                 | When to use                                                           |
| -------------------- | --------------------- | --------------------------------------------------------------------- |
| Single-line truncate | `truncate`            | Table cells, card titles, file names — single-line overflow           |
| 2-line clamp         | `line-clamp-2`        | Card body descriptions in grid layouts                                |
| 3-line clamp         | `line-clamp-3`        | Mobile card descriptions, expanded preview text                       |
| Anywhere break       | `break-all`           | Hex strings, keys, addresses, Base58/Base64 — no natural break points |
| Word break           | `break-words`         | URLs, path names — breaks at word boundaries when possible            |
| Pre-wrap mono        | `whitespace-pre-wrap` | Terminal/log output, raw PEM display                                  |
| No wrap              | `whitespace-nowrap`   | Labels that must stay on one line (Gantt labels, badge text)          |

**Rules**:

- **MUST** use `truncate` (not `overflow-hidden` alone) for single-line — `overflow-hidden` clips without ellipsis
- **MUST** use `break-all` for all cryptographic output values — they contain no natural word-break points
- **MUST** add `min-w-0` to flex children that use `truncate` — flex children don't shrink by default
- **MUST NOT** use `line-clamp-*` on primary content users need to read in full — only for preview/teaser text

---

### S7. Accessibility

#### S7.1 ARIA Landmarks

`MainLayout` sets `role="banner"` (header), `role="navigation"` + `aria-label="Main navigation"` (nav), and `role="main"` (main). Page components **MUST NOT** add a second `role="main"`.

Filter control bars and tab panels **MUST** carry appropriate `aria-label` attributes.

#### S7.2 Interactive Elements

- All `<button>` elements without visible text **MUST** have `aria-label`.
- Icon-only buttons **MUST** mark the icon `aria-hidden="true"` and provide `aria-label` on the `<button>`.
- All `<a>` elements opening in a new tab **MUST** include `rel="noopener noreferrer"`.
- Modal dialogs **MUST** trap focus and close on `Escape` — follow the pattern in `SourcesModal` and `Glossary`.

#### S7.3 Color and Contrast

- **MUST NOT**: Use color as the sole differentiator for status information. Always pair color with an icon or text label (e.g., `<AlertOctagon aria-hidden="true" /> Critical`, not just a red dot).
- The semantic token system maintains WCAG AA contrast for foreground-on-background pairs in both light and dark modes. Hardcoded palette colors at low opacity may fail contrast — this is a secondary reason to prohibit them.

#### S7.4 Form Labels

All form inputs **MUST** be associated with a visible label via `htmlFor`/`id` pairing or `aria-labelledby`. `FilterDropdown`'s `label` prop generates a label ID automatically — use the prop rather than an adjacent `<span>`.

---

### S8. Icons

**MUST** use `lucide-react` exclusively. Do not import icons from any other package.

#### S8.1 Size Conventions

| Context                   | Size                       |
| ------------------------- | -------------------------- |
| Inline with text / labels | `size={14}` or `size={16}` |
| Standard button icons     | `size={18}`                |
| Section / feature icons   | `size={22}` – `size={28}`  |
| Hero / large display      | `size={32}` or higher      |

#### S8.2 Color Conventions

| Role             | Token                                     |
| ---------------- | ----------------------------------------- |
| Primary action   | `text-primary`                            |
| Secondary accent | `text-secondary`                          |
| Tertiary accent  | `text-accent`                             |
| Muted / helper   | `text-muted-foreground`                   |
| Status icons     | `.text-status-*` class matching the state |

Icons used purely for decoration **MUST** have `aria-hidden="true"`. Icons that convey meaning without adjacent text require an `aria-label` on their parent interactive element.

---

### S9. Animation and Motion

#### S9.1 Page Entry

`MainLayout` applies a Framer Motion entry animation to every route:

```tsx
<motion.div
  key={location.pathname}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
```

Page components **MUST NOT** add their own full-page entry animation on the outermost wrapper — this would double-animate. Components **MAY** add staggered child animations internally via `variants`.

#### S9.2 Stagger Pattern

```tsx
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}
// Parent: staggerChildren: 0.08 (card grids), 0.1 (section sequences)
```

#### S9.3 Transition Classes

| Pattern                      | Classes                       |
| ---------------------------- | ----------------------------- |
| Color changes                | `transition-colors`           |
| Combined transform + opacity | `transition-all duration-200` |
| Opacity only                 | `transition-opacity`          |

Permitted duration values:

| Duration               | Permitted uses                                                    |
| ---------------------- | ----------------------------------------------------------------- |
| `duration-100`         | Snap micro-interactions: checkbox toggle, copy-confirmation flash |
| `duration-200`         | **Standard** — hover color changes, show/hide, border transitions |
| `duration-300`         | **Standard** — modal entry/exit, panel slide, card lift           |
| `duration-500`         | Progress bars, animated status indicators                         |
| Framer `duration: 0.n` | Page entry (0.3), stagger children (0.4) — Framer Motion only     |

**MUST NOT** use `duration-700` or longer in Tailwind utility classes — use Framer Motion for complex sequences.

#### S9.4 Print Mode

In `@media print`, all Framer Motion transforms are suppressed. Components that render in a print context **MUST NOT** add new Framer Motion animations — they will create invisible content in PDF output.

---

### S10. Data Loading, Empty, and Error States

#### S10.1 Page-Level Loading

`MainLayout`'s route-level Suspense boundary renders a spinning ring + "Loading..." during code-split chunk loading. Page components **MUST NOT** add a second full-screen loading state that conflicts with this.

#### S10.2 Inline Data Loading

For async data sections within an already-rendered page (e.g., compliance table refresh), use skeleton placeholders in place of content. Use `<Skeleton>` component once created; until then, use `animate-pulse bg-muted rounded` directly.

**MUST NOT** use the spinner pattern for inline data loading — spinner is reserved for page-level transitions.

#### S10.3 Empty States

When a filtered list produces zero results, render:

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <Icon size={32} className="text-muted-foreground mb-3" aria-hidden="true" />
  <p className="text-muted-foreground font-medium mb-1">No results found</p>
  <p className="text-sm text-muted-foreground/70">Try adjusting your filters.</p>
  {/* optional */}
  <Button variant="ghost" className="mt-4" onClick={clearFilters}>
    Clear filters
  </Button>
</div>
```

**MUST NOT** render an empty `<div>` or `<table>` body without an empty state message.

#### S10.4 Error States

For recoverable errors (failed API call, WASM init failure), render inline using the accent-border banner pattern:

```tsx
<div className="glass-panel p-4 border-l-4 border-l-destructive">
  <p className="text-status-error text-sm font-medium">{errorMessage}</p>
  {onRetry && (
    <Button variant="ghost" size="sm" className="mt-2" onClick={onRetry}>
      Retry
    </Button>
  )}
</div>
```

Use `border-l-4 border-l-[token]` for all contextual banner variants (also used in Assess resume banner with `border-l-primary`).

---

## Part II — Per-Page Sub-Standards

### P1. Landing (`/`)

**Layout**: Hero + staggered feature card grid. No sidebar.
**Primary interaction**: Navigation to other pages via feature cards and CTA buttons.
**Mobile strategy**: No separate Mobile component — fully responsive via Tailwind classes.

#### Key Components

- Hero section: centered, Framer Motion stagger, `text-center pt-8 md:pt-16`
- Stats bar: `glass-panel p-4` with `text-gradient` stat value + `text-muted-foreground` label
- Feature cards: `glass-panel p-6 h-full hover:border-primary/30 transition-colors group` wrapped in `<Link>`
- CTA section: `glass-panel p-8 md:p-12` centered

#### Page-Specific Rules

- **MUST**: Primary hero CTA **MUST** use `<Button variant="gradient" size="lg">`. Secondary CTA **MUST** use `<Button variant="outline" size="lg">`.
- **MUST**: Feature card icon colors **MUST** come from the feature data object (mapped to `text-primary`, `text-secondary`, `text-accent`) — not hardcoded per-icon.
- **MUST**: Stats display `'...'` while data is loading. Do not block initial render waiting for counts.
- **MUST NOT**: Do not render the utility cluster (`SourcesButton`, `ShareButton`, `GlossaryButton`) on Landing — this is a discovery surface, not a data page.
- **MUST NOT**: Do not apply `.text-gradient` to feature card body text.

#### Mobile Rules

- Feature card grid collapses to single column on mobile (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`).
- CTA buttons stack vertically (`flex-col sm:flex-row`) — each **MUST** be full-width on mobile (`w-full sm:w-auto`).
- Hero title uses `text-3xl md:text-5xl lg:text-6xl` — never use a fixed size that doesn't scale down.
- Stats bar uses `grid-cols-2 md:grid-cols-4` — 2 columns on mobile is the minimum; never 4-across on small screens.

---

### P2. Timeline (`/timeline`)

**Layout**: Full-width Gantt chart (desktop) / simplified list (mobile). Split via `hidden lg:block` / `lg:hidden`.
**Primary interaction**: Country/region filter drives Gantt view. Clicking a Gantt cell opens `GanttDetailPopover`.
**Mobile strategy**: Separate `MobileTimelineList` component — swipeable phase cards per country.

#### Key Components

- `SimpleGanttChart` — sticky header (`z-30`), phase cells (`z-20`), filter controls bar (`relative z-40`)
- `GanttDetailPopover` — inline style `z-index: 9999`
- `GanttLegend` — phase color key using `text-phase-*` tokens
- `DocumentTable` — shown below Gantt when `selectedCountry !== 'All'`
- `MobileTimelineList` — `lg:hidden` swipeable card-based view

#### Page-Specific Rules

- **MUST**: Phase colors in chart cells **MUST** use `text-phase-*` and `bg-phase-*` tokens. Never hardcode phase colors.
- **MUST**: Filter controls bar **MUST** be `relative z-40` to render dropdowns above sticky table headers.
- **MUST**: `GanttDetailPopover` **MUST** use inline `style={{ zIndex: 9999 }}` — Tailwind's `z-` scale does not reach 9999.
- **MUST**: Utility cluster **MUST** appear on `hidden lg:flex` (not `md:flex`) — the `md` breakpoint is claimed by filter controls.
- **MUST NOT**: Do not alter the z-index layering without updating the notes in `MEMORY.md`.

#### Mobile Rules (`MobileTimelineList`)

- Cards use `glass-panel p-4 flex flex-col gap-3` with `space-y-4` between country cards.
- Phase content is a **horizontal swipeable carousel** driven by Framer Motion drag — **MUST NOT** replace with a vertical list; the swipe interaction is intentional.
- Phase indicator dots use `min-w-[28px] min-h-[28px]` — below the 44 px ideal, but acceptable since they are supplementary to the swipe gesture.
- Country flag + name row uses `flex items-center gap-2 text-sm font-semibold`.
- Bottom clearance: `pb-8` on the outermost container.
- Phase badge colors **MUST** use `text-phase-*` tokens — same rule as desktop.

---

### P3. Algorithms (`/algorithms`)

**Layout**: Centered page header + tabs (Transition Guide / Detailed Comparison). Horizontal-scroll tables inside tabs.
**Primary interaction**: Tab selection; column sort on comparison table; optional URL param `?highlight=` pre-selects algorithms.
**Mobile strategy**: Separate `MobileAlgorithmList` — compact tap cards, no sortable table.

#### Key Components

- `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent`
- `AlgorithmComparison` — sortable scrolling table
- `AlgorithmDetailedComparison` — per-algorithm deep-dive view
- `MobileAlgorithmList` — `lg:hidden` card list
- `InteractivePlayground` (within Algorithms) — inline WASM sandbox, desktop only

#### Page-Specific Rules

- **MUST**: `TabsList` **MUST** use `className="bg-muted/50 border border-border"`.
- **MUST**: Algorithm security level badges **MUST** use `.text-status-success` (strong), `.text-status-warning` (transitional), `.text-status-error` (broken). Never `text-green-400`, `text-yellow-400`, `text-red-400`.
- **MUST**: Column header sort controls **MUST** use `hover:bg-muted/50 transition-colors`. Current `hover:bg-white/5` is a violation.
- **MUST**: The `InteractivePlayground` component in this folder **MUST** replace its native `<select>` and `bg-black/40` inputs with `<FilterDropdown>` and `bg-muted border-input`.
- **MUST NOT**: Do not use `bg-zinc-950` or any dark-hardcoded background for algorithm comparison table cells.

#### Mobile Rules (`MobileAlgorithmList`)

- Cards use `glass-panel p-4 flex items-center justify-between` with `active:scale-[0.98] transition-transform`.
- Algorithm type badge (KEM vs Signature) **MUST** use `bg-primary/10 text-primary` (KEM) and `bg-accent/10 text-accent` (Signature) — not hardcoded `text-blue-400` / `text-emerald-400`.
- Deprecated algorithm badge **MUST** use `.bg-status-error .text-status-error`.
- The `InteractivePlayground` WASM sandbox is **hidden on mobile** — do not attempt to surface it on `MobileAlgorithmList`.

---

### P4. Library (`/library`)

**Layout**: Persistent left sidebar (`CategorySidebar`) + right content area with view toggle.
**Primary interaction**: Category sidebar + FilterDropdown controls narrow the document list. View toggle switches between card grid, tree table, and activity feed.
**Mobile strategy**: No separate Mobile component — sidebar collapses, content goes full-width. Responsive via Tailwind classes.

#### Key Components

- `CategorySidebar` — `glass-panel`, persistent on desktop, collapsed/hidden on mobile
- `DocumentCardGrid` / `LibraryTreeTable` — swapped by `ViewToggle`
- `SortControl` — sort dropdown
- `ActivityFeed` — "New / Updated" feed panel
- `LibraryDetailPopover` — document detail on click

#### Page-Specific Rules

- **MUST**: Left sidebar + right content split on desktop: `lg:grid-cols-[220px_1fr]`. Sidebar **MUST** use `glass-panel`.
- **MUST**: "New" / "Updated" markers **MUST** use `<StatusBadge>` — not inline color classes.
- **MUST**: The `border-b border-white/10` separator **MUST** be corrected to `border-b border-border`.
- **MUST**: Search input **MUST** use `<Input>` composed with a `<Search>` icon (currently uses a raw `<input>`).
- **SHOULD**: Zero-results state **MUST** use the `<EmptyState>` pattern.
- **MUST NOT**: Do not add `bg-black/40` or similar to the search input wrapper.

#### Mobile Rules

- `CategorySidebar` is hidden on mobile (`lg:hidden`) — category filtering on mobile is via a horizontally scrollable chip bar or a sheet/modal trigger instead.
- The tree table view (`LibraryTreeTable`) is unsuitable for mobile — on narrow viewports, default to the card grid view regardless of the user's last selected view mode.
- Search input **MUST** be full-width on mobile (`w-full`), placed above the filter chip bar.
- `ViewToggle` and `SortControl` **SHOULD** be hidden or replaced with a single sort/filter sheet trigger on mobile — do not crowd the header row with multiple dropdowns at narrow widths.

---

### P5. Learn (`/learn/*`)

**Layout**: Module dashboard (card grid) at `/learn`; individual modules at subroutes with their own internal layout (tabs, steps, REPL).
**Primary interaction**: Browse module cards → click → navigate to module subroute. Modules have internal tab/step navigation. Quiz at `/learn/quiz`.
**Mobile strategy**: No separate Mobile component — responsive via Tailwind classes. Module card grid collapses to single column. Interactive REPL modules are usable on mobile but not optimised for it.

#### Key Components

- `ModuleCard` — `glass-panel`, progress indicator, `StatusBadge`
- `SaveRestorePanel` — artifact persistence
- Per-module layouts (highly variable)
- `GlossaryButton` — available on all module pages

#### Page-Specific Rules

- **MUST**: Module cards **MUST** use `glass-panel` with `hover:border-primary/30 transition-colors`.
- **MUST**: Progress indicators **MUST** use `.text-status-success` (completed), `.text-status-warning` (in-progress).
- **MUST**: Difficulty badges in `ModuleCard` **MUST** use `.text-status-*` classes. Current `bg-blue-500/10 text-blue-400` (Intermediate) is a violation.
- **MUST**: Terminal and output areas within modules **MUST** use `bg-muted border border-border`, not `bg-black/20 border-white/10`.
- **MUST**: All module-level `<select>` elements **MUST** be replaced with `<FilterDropdown>`.
- **MUST**: Quiz module **MUST** announce current question number via `aria-live="polite"` and support keyboard navigation between questions.
- **SHOULD**: Each module **MUST** have a consistent header: module title + icon + description + optional `<GlossaryButton>`. No `SourcesButton` or `ShareButton` within individual module views.
- **MUST NOT**: Color values in `cryptoConstants.ts` and `outputFormatters.ts` **MUST NOT** return hardcoded Tailwind palette strings like `'text-blue-400'`.

#### Mobile Rules

- Module card grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`.
- `ModuleCard` tap area **MUST** be fully tappable (entire card is a `<Link>` or `<button>`), not just the title text.
- Within interactive modules, action buttons **MUST** use `size="lg"` (`h-11`) on mobile to meet the 44 px touch target.
- Code/terminal output areas use `font-mono text-sm` with `overflow-x-auto` so long output scrolls horizontally rather than overflowing.
- `SaveRestorePanel` buttons **MUST** be `w-full` on mobile, stacked vertically.

---

### P6. Playground (`/playground`)

**Layout**: Tabbed interface (desktop: `InteractivePlayground`; mobile: `MobilePlaygroundView`). Full WASM capability on desktop only.
**Primary interaction**: Tab selection between KEM, DSA, hashing, symmetric, sign/verify operations. Each tab provides step-by-step crypto operations with output display.

#### Key Components

- `InteractivePlayground` — desktop tabbed WASM interface
- `MobilePlaygroundView` — simplified mobile experience
- `KeyStoreView` — saved key management panel
- `KemOpsTab`, `HashingTab`, `SymmetricTab`, `SignVerifyTab`, `KeyGenSection`

#### Page-Specific Rules

- **MUST**: Output surfaces (hex strings, encoded keys, terminal-style output) **MUST** use `bg-muted border border-border rounded-lg font-mono text-sm`.
- **MUST**: Primary action buttons within tabs (Generate, Encapsulate, Decrypt) **MUST** use `<Button variant="gradient">`. Secondary actions **MUST** use `<Button variant="outline">`.
- **MUST**: `KeyStoreView` table row separators **MUST** use `bg-muted/50` — not `bg-white/5`.
- **MUST**: Execution time indicators **MUST** use `.text-status-success` (<100 ms), `.text-status-warning` (<500 ms), `.text-status-error` (>500 ms) — not `text-green-400`, `text-yellow-400`, `text-red-400`.
- **MUST NOT**: `HashingTab` and `SymmetricTab` **MUST NOT** use `text-cyan-500`, `bg-cyan-500/20` — replace with `text-primary`, `bg-primary/10`.

#### Mobile Rules (`MobilePlaygroundView`, breakpoint: `md:hidden`)

- **MUST**: Mobile renders an informational layout only — no WASM operations. A "Desktop Required" card **MUST** be present explaining that the interactive playground requires a desktop computer.
- **MUST**: The info card **MUST** use `glass-panel p-6` with a centered layout (`text-center`).
- **MUST**: Algorithm name chips below the info card **MUST** use a `grid grid-cols-2 gap-3` layout.
- Layout: `flex flex-col gap-6 pb-8` with `pb-8` bottom clearance.
- **MUST NOT**: WASM crypto operations **MUST NOT** be rendered or attempted on mobile — the `MobilePlaygroundView` replaces the entire desktop experience.
- **MUST NOT**: The `KeyStoreView` panel **MUST NOT** render in the mobile view.

---

### P7. OpenSSL Studio (`/openssl`)

**Layout**: 3-pane desktop IDE — Workbench (left, `col-span-4`) + File Manager / Editor / Terminal (right, `col-span-8`). No mobile equivalent (route hidden on mobile in navigation).
**Primary interaction**: Select operation category in Workbench → configure parameters → run → view output in Terminal. File Manager shows generated files contextually.

#### Key Components

- `Workbench` — left pane with category selector and config forms
- `WorkbenchFileManager` — file list with type-colored icons
- `FileEditor` / `FileViewer` — contextual file panels (rendered when `editingFile` is set)
- `TerminalOutput` — command output display
- `LogsTab` — operation log (collapsible)

#### Page-Specific Rules

- **MUST**: File type icons **MUST** use `text-file-key`, `text-file-cert`, `text-file-csr` tokens. Current `text-blue-400` for `.csr` is a violation.
- **MUST**: All panes **MUST** use `glass-panel` as their container. Internal pane sub-headers use `bg-muted border-b border-border`.
- **MUST**: Terminal output area **MUST** use `bg-muted font-mono text-sm`. Never `bg-zinc-900` or `bg-black`.
- **MUST**: Config form section separators (`LmsConfig`, `KdfConfig`, etc.) **MUST** use `border-border` — not `border-white/10`.
- **MUST**: `LmsConfig` blue-themed UI elements **MUST** use `text-primary` and `bg-primary/20 hover:bg-primary/30 border-primary/30`.
- **MUST NOT**: `WorkbenchFileManager` file state icons **MUST NOT** use hardcoded green/yellow. Use `.text-status-success` and `.text-status-warning`.

#### Mobile Rules (nav hidden, breakpoint: `hiddenOnMobile: true`)

- **MUST NOT**: OpenSSL Studio **MUST NOT** render on mobile. The route is excluded from mobile navigation via `hiddenOnMobile: true` in `MainLayout` nav config.
- No `Mobile*` component exists or is needed — the 3-pane IDE is inherently desktop-only.
- If a user navigates directly to `/openssl` on mobile (e.g., via a bookmarked URL), the desktop layout will still render. No special mobile fallback is required beyond the existing navigation exclusion.

---

### P8. Threats (`/threats`)

**Layout**: Full-width filterable dashboard (table on desktop, card list on mobile).
**Primary interaction**: Industry filter (multi-select) + criticality filter + search. Clicking a row opens `ThreatDetailDialog`.

#### Key Components

- `ThreatsDashboard` — filter controls + data table
- `ThreatDetailDialog` — modal on row click
- `MobileThreatsList` — `md:hidden` card list
- `FilterDropdown` (multi-select mode for industries)

#### Page-Specific Rules

- **MUST**: Criticality icons **MUST** use status tokens: Critical → `.text-status-error`, High → `.text-status-error`, Medium → `.text-status-warning`, Low → `.text-status-success`. Current `text-red-400`, `text-orange-400`, `text-yellow-400` are violations.
- **MUST**: Row-level criticality badges **MUST** use `.bg-status-*` / `.text-status-*` semantic classes.
- **MUST**: `ThreatDetailDialog` backdrop **MUST** use `bg-black/60 backdrop-blur-sm` (permitted overlay exception per S1.2).
- **MUST**: Table rows **MUST** use `hover:bg-muted/50 transition-colors` — not `hover:bg-white/5`.
- **MUST NOT**: Do not add `SourcesButton` without a corresponding entry in `authoritativeSourcesData.ts`.

#### Mobile Rules (`MobileThreatsList`, breakpoint: `md:hidden`)

- **MUST**: Each threat renders as a full-width `<button>` card with `active:scale-[0.99] transition-transform` tap feedback.
- **MUST**: Criticality badge and industry label appear in the top row of each card; crypto fields appear in a `grid grid-cols-2 gap-2` footer row.
- **MUST**: Description text **MUST** use a 3-line clamp (`line-clamp-3`) to keep cards uniform height.
- **MUST**: Criticality badges in `MobileThreatsList` **MUST** use the same `.bg-status-*` / `.text-status-*` classes as the desktop table — no separate mobile color map.
- Layout: `space-y-3` vertical list; card padding `p-4`.

---

### P9. Leaders (`/leaders`)

**Layout**: Filterable card grid. Country flag filter + sector filter + search.
**Primary interaction**: Filter controls narrow the `LeaderCard` grid. Cards are non-navigable (no click-to-detail).

#### Key Components

- `LeadersGrid` — filter controls + responsive card grid
- `LeaderCard` — individual organization/person card
- `FilterDropdown` for country and sector selectors

#### Page-Specific Rules

- **MUST**: Sector icon colors **MUST** use semantic tokens: Academic → `text-secondary`, Public → `text-primary`, Private → `text-accent`.
- **MUST**: Any readiness/status badges on `LeaderCard` **MUST** use `.text-status-*` and `.bg-status-*` classes.
- **SHOULD**: Zero-results state **MUST** use the `<EmptyState>` pattern with an appropriate icon and "No leaders match your filters" message.
- **MUST NOT**: `LeaderCard` **MUST NOT** apply inline border-left accent colors without using a phase or status token.

#### Mobile Rules (responsive-only, no `Mobile*` component)

- No dedicated `MobileLeadersGrid` component exists. The single `LeadersGrid` component is fully responsive via Tailwind breakpoint classes.
- Card grid **MUST** use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (or equivalent) so cards stack on small screens.
- Filter controls (country, sector, search) **MUST** stack vertically (`flex-col`) on mobile and switch to `flex-row` on `md:` breakpoint.
- Each `LeaderCard` **MUST** have sufficient padding (`p-4` minimum) to form an implicit 44 px touch target height.

---

### P10. Compliance (`/compliance`)

**Layout**: Multi-tab table view (All / FIPS 140-3 / ACVP / Common Criteria). Persona hint banner renders conditionally above tabs.
**Primary interaction**: Tab selection drives the certification table shown. Table is sortable/filterable. Clicking a row expands detail.

#### Key Components

- `ComplianceTable` — sortable table with PQC readiness badge column
- `MobileComplianceView` — `md:hidden` card list
- Persona hint banner (`border border-primary/20 bg-primary/5`)
- External source link grid (5-column responsive)

#### Page-Specific Rules

- **MUST**: Persona hint banner **MUST** use `border border-primary/20 bg-primary/5` — never a hardcoded background.
- **MUST**: PQC readiness badges **MUST** use `.text-status-success` (ready), `.text-status-warning` (partial/planned), `.text-status-error` (not ready).
- **MUST**: External source link cards **MUST** use `bg-card hover:bg-muted/50 border border-border`.
- **MUST**: Loading overlay within `ComplianceTable` **MUST** use `bg-card/90 backdrop-blur-sm` — not `bg-black/60` (not a full-screen overlay, so the exception from S1.2 does not apply).
- **MUST NOT**: Do not render `SourcesButton` on this page — data sourcing is handled by the explicit external link grid.

#### Mobile Rules (`MobileComplianceView`, breakpoint: `md:hidden`)

- **MUST**: Mobile renders a search bar + PQC-only toggle chip + stacked card list — no tabs.
- **MUST**: The PQC-only toggle chip **MUST** use `active:scale-[0.99] transition-transform` tap feedback.
- **MUST**: Each certification card **MUST** use `glass-panel p-4` with a `flex items-center gap-3` footer row for cert ID and date.
- **MUST**: PQC readiness badge within cards **MUST** use the same `.bg-status-*` / `.text-status-*` tokens as the desktop table.
- List renders a maximum of 50 records (`MOBILE_PAGE_SIZE = 50`) with a count message below the list.
- Layout: `space-y-4` outer, `space-y-3` card list; search + filter in `flex flex-col gap-3`.

---

### P11. Migrate (`/migrate`)

**Layout**: Multi-section scrolling page — Infrastructure layer visualization → migration workflow steps → software table.
**Primary interaction**: Infrastructure layer selector drives `InfrastructureStack` visualization. Filter controls narrow `SoftwareTable`.

#### Key Components

- `InfrastructureStack` — visual layer diagram
- `MigrationWorkflow` — clickable step cards that pre-filter the table
- `SoftwareTable` — filterable software list with PQC support column
- `FilterDropdown` for category and PQC support

#### Page-Specific Rules

- **MUST**: PQC support badges in `SoftwareTable` **MUST** use `.bg-status-success / .text-status-success` (Yes), `.bg-status-warning / .text-status-warning` (Limited/Planned), `.bg-status-error / .text-status-error` (No).
- **MUST**: `InfrastructureStack` layer borders **MUST** use `border-border`, `border-border/50` — not `border-white/5`, `border-white/10`.
- **MUST**: Layer icon color data (`iconColor`) **MUST** be replaced with semantic tokens (`text-primary`, `text-secondary`, `text-accent`).
- **MUST**: Step filter active state **MUST** use `bg-primary/10 border-primary/30 text-primary`.
- **SHOULD**: Migration step filter banner (currently `border-l-4 border-l-yellow-400`) **MUST** use `border-l-warning`.

#### Mobile Rules (responsive-only, no `Mobile*` component)

- No dedicated mobile component. `MigrateView` is fully responsive via Tailwind breakpoint classes.
- `InfrastructureStack` layer visualization collapses to a single-column vertical stack on mobile (`flex-col`); the horizontal multi-column layout is `md:` and above.
- `SoftwareTable` uses `overflow-x-auto` so the table scrolls horizontally on narrow viewports — the horizontal scroll container **MUST** be a `glass-panel` with `overflow-x-auto`.
- `MigrationWorkflow` step cards **MUST** use `w-full` on mobile and `active:scale-[0.98] transition-transform` tap feedback.
- Filter controls (category, PQC support) **MUST** stack vertically on mobile.

---

### P12. Assess (`/assess`)

**Layout**: Multi-phase: mode selector → wizard steps → report. Print is a distinct layout governed by `@media print`.
**Primary interaction**: 13-step linear wizard (or 6-step quick mode). Each step is a full-focus form panel. On completion, transitions to the report view which supports PDF export.

#### Key Components

- `ModeSelector` — Quick vs Comprehensive choice cards
- `AssessWizard` — step-by-step form with progress indicator
- `AssessReport` — results with risk score, priorities, recommendations
- `MigrationRoadmap`, `ReportThreatsAppendix`, `ReportTimelineStrip` — report sections
- Resume banner: `glass-panel border-l-4 border-l-primary`

#### Page-Specific Rules

- **MUST**: Mode selector cards **MUST** use `glass-panel` with `hover:border-primary/40 transition-colors`.
- **MUST**: Wizard step option cards (radio/checkbox) **MUST** use `glass-panel`, with `border-primary/40` when selected.
- **MUST**: Resume banner **MUST** use `border-l-4 border-l-primary` (already semantic — do not change).
- **MUST**: Risk score display **MUST** use `.text-status-error` (high risk), `.text-status-warning` (medium), `.text-status-success` (low risk) based on score tier.
- **MUST NOT**: Do not alter the print CSS without reading the anti-clipping `<table class="print-report-table">` architecture in `MEMORY.md` — the pattern is non-obvious and must be preserved.
- **MUST NOT**: Do not add Framer Motion animations to `AssessReport` — they are suppressed in `@media print` and create invisible elements in PDF output.

#### Mobile Rules (responsive-only, no `Mobile*` component)

- No dedicated mobile component. `AssessView`, `AssessWizard`, and `AssessReport` are fully responsive via Tailwind breakpoint classes.
- Mode selector cards **MUST** be `w-full` on mobile, switching to `grid-cols-2` on `sm:` breakpoint.
- Wizard step option cards **MUST** be `w-full` stacked vertically on mobile; `grid-cols-2` layout is `md:` and above.
- The wizard progress indicator **MUST** use a compact horizontal scrolling stepper on mobile (`overflow-x-auto no-scrollbar`) — not a full-width multi-row layout.
- Report sections **MUST** collapse to single-column on mobile; `grid-cols-2` and `grid-cols-3` layouts apply at `md:` and above.
- `AssessWizard` nav footer (Previous / Reset / Next buttons) **MUST** remain `fixed bottom-0 w-full` on mobile with `pb-safe` for notched devices.

---

### P13. About (`/about`)

**Layout**: Stacked `glass-panel` cards (desktop). `MobileAboutView` (mobile: `md:hidden`). Static read-only content.
**Primary interaction**: External links (GitHub, LinkedIn, Changelog). Theme toggle.

#### Key Components

- SBOM grid (`columns-1 md:columns-3`)
- Dependency version rows (`font-mono text-sm`)
- GitHub / security badge links

#### Page-Specific Rules

- **MUST**: All external links **MUST** use `text-primary hover:underline` with `rel="noopener noreferrer"`.
- **MUST**: SBOM grid sections **MUST** use `glass-panel` containers with `break-inside-avoid`.
- **MUST**: Dependency library names **MUST** use `font-mono text-sm`.
- **MUST NOT**: Do not render the utility cluster (`SourcesButton`, `ShareButton`, `GlossaryButton`) on About — it is a static informational page.

#### Mobile Rules (`MobileAboutView`, breakpoint: `md:hidden`)

- **MUST**: Mobile renders `MobileAboutView` — a vertically stacked `flex flex-col gap-6 pb-8` layout replacing the desktop multi-column grid.
- Content sections in order: version header (centered) → mission card → community card → creator/LinkedIn card → theme toggle → copyright disclaimer.
- **MUST**: Theme toggle buttons **MUST** meet the 44 px touch target minimum via explicit padding (`px-3 py-1.5` at `text-xs` is borderline — prefer `px-4 py-2`).
- **MUST**: The creator/LinkedIn card **MUST** be fully tappable (entire card is an `<a>` or wraps a `<Button>`), not just the name text.
- The SBOM dependency grid (`columns-1 md:columns-3`) is desktop-only; the mobile view omits it in favour of the condensed summary cards.
- **MUST NOT**: Do not duplicate the SBOM grid inside `MobileAboutView` — it is intentionally excluded to keep the mobile view lightweight.

---

_See [`docs/ux-gap-analysis.md`](./ux-gap-analysis.md) for the full violation inventory and remediation priority matrix._
