# PRD-TIME-001 — Timeline Page

## Header

| Field         | Value                                                |
|---------------|------------------------------------------------------|
| Document ID   | PRD-TIME-001                                         |
| Title         | Timeline Page                                        |
| Version       | 2.1                                                  |
| Date          | 2026-03-27                                           |
| Route         | `/timeline`                                          |
| Status        | Current                                              |
| Component     | `src/components/Timeline/TimelineView.tsx`           |
| Author        | PQC Today Product Team                               |
| Stakeholders  | Executives, Security Architects, Developers, Researchers, Ops/Security Engineers |

---

## Table of Contents

1. [Overview](#1-overview)
2. [User Stories](#2-user-stories)
3. [Functional Requirements](#3-functional-requirements)
   - 3.1 Page Header and Layout
   - 3.2 Region Filtering
   - 3.3 Country Filtering
   - 3.4 Gantt Chart Display
   - 3.5 Gantt Chart Filtering and Sorting
   - 3.6 Phase Cell Rendering
   - 3.7 Milestone Rendering
   - 3.8 GanttDetailPopover
   - 3.9 Document Table
   - 3.10 Document Card View
   - 3.11 Document Detail Popover
   - 3.12 Mobile Support
   - 3.13 Header Action Buttons
   - 3.14 Gantt Legend
   - 3.15 CSV Export
   - 3.16 Deep Linking
   - 3.17 Persona Integration
   - 3.18 Data Loading and Status Tracking
   - 3.19 Document Enrichment
   - 3.20 Analytics Events
   - 3.21 Empty and Loading States
   - 3.22 Keyboard Navigation
4. [UI Components](#4-ui-components)
5. [Data Sources](#5-data-sources)
6. [Data Model](#6-data-model)
7. [Filtering and Search](#7-filtering-and-search)
8. [State Management](#8-state-management)
9. [Cross-Page Integration](#9-cross-page-integration)
10. [Persona Behavior](#10-persona-behavior)
11. [Mobile and Responsive Design](#11-mobile-and-responsive-design)
12. [Accessibility](#12-accessibility)
13. [Print and Export](#13-print-and-export)
14. [Performance](#14-performance)
15. [Technical Architecture](#15-technical-architecture)
16. [Testing Requirements](#16-testing-requirements)
17. [Analytics](#17-analytics)
18. [Security Considerations](#18-security-considerations)
19. [Non-Functional Requirements](#19-non-functional-requirements)
20. [Cross-References](#20-cross-references)
21. [Appendix A — Phase Color System](#appendix-a--phase-color-system)
22. [Appendix B — CSV Column Schema](#appendix-b--csv-column-schema)
23. [Appendix C — Region-Country Mapping](#appendix-c--region-country-mapping)
24. [Appendix D — Wireframes](#appendix-d--wireframes)

---

## 1. Overview

The Timeline page visualizes global Post-Quantum Cryptography (PQC) milestones, government mandates, and standardization events on an interactive Gantt chart. It serves as a central planning tool for users who need to understand when PQC-related deadlines, standards, and migration phases are scheduled across jurisdictions worldwide.

Users can filter the Gantt chart by geographic region and individual country to see jurisdiction-specific PQC roadmaps. When a specific country is selected, a detailed Document Table appears below the Gantt chart, showing all timeline documents (phases and milestones) for that country with sortable columns, card and table view modes, and document detail inspection via a popover with AI-enriched metadata.

The page supports deep-linking via URL parameters (`?country=` and `?q=`) for seamless navigation from the PQC Assistant chatbot, assessment reports, and other pages. It integrates with the persona store for automatic region pre-selection based on user preferences.

The Timeline is one of three always-visible pages (along with Learn and Threats) that appear in navigation regardless of which persona is selected, reflecting its universal importance across all user roles.

### 1.1 Business Context

PQC migration is a global, multi-year initiative driven by government mandates, international standards bodies, and industry consortia. Organizations operating across jurisdictions need to track:

- When PQC standards become mandatory in each country
- Which regulatory bodies are driving migration timelines
- How different countries' timelines compare for multi-jurisdiction planning
- Key milestones such as NIST standard publications, CNSA 2.0 deadlines, and EU regulatory mandates

### 1.2 Scope

This PRD covers all functionality rendered at the `/timeline` route, including:

- Interactive Gantt chart with phase and milestone visualization
- Region and country filtering with persona-aware defaults
- Document table with card and table view modes
- Phase and document detail popovers with enrichment data
- Mobile-optimized vertical list view
- CSV export of filtered timeline data
- Deep-linking via URL parameters
- Accessibility and keyboard navigation

### 1.3 Out of Scope

- Editing or contributing timeline data (read-only view)
- Comparison between two CSV versions (handled by data loader, not UI)
- Print-specific layout (uses default browser print; dedicated print layout is out of scope)

---

## 2. User Stories

### 2.1 Executive / CISO

**US-TIME-001**: As an Executive, I want to see my country's PQC compliance deadlines so I can plan organizational migration timelines and budget allocation.

**US-TIME-002**: As an Executive, I want a quick "Deadlines" filter so I can focus on mandatory compliance dates without scrolling through all phases.

**US-TIME-003**: As an Executive, I want to export the filtered timeline as CSV so I can include it in board presentations and compliance reports.

### 2.2 Developer / Engineer

**US-TIME-004**: As a Developer, I want to understand when PQC standards become mandatory so I can prioritize implementation work and library upgrades.

**US-TIME-005**: As a Developer, I want to click on a timeline phase to see its source document and publication date so I can read the original specification.

**US-TIME-006**: As a Developer, I want to search the timeline by keyword so I can quickly find events related to specific standards (e.g., ML-KEM, FIPS 203).

### 2.3 Security Architect

**US-TIME-007**: As an Architect, I want to compare country timelines side-by-side so I can design multi-jurisdiction migration plans that meet the earliest deadline.

**US-TIME-008**: As an Architect, I want to filter by phase type (Migration, Standardization, Policy) so I can focus on the category most relevant to my current planning.

**US-TIME-009**: As an Architect, I want to see the organizations driving each country's timeline so I can identify which regulatory bodies to monitor.

### 2.4 Researcher / Academic

**US-TIME-010**: As a Researcher, I want to track all global PQC standardization events chronologically so I can understand the progression of PQC adoption worldwide.

**US-TIME-011**: As a Researcher, I want to view AI-enriched document analysis for timeline entries so I can quickly understand the significance of each document.

**US-TIME-012**: As a Researcher, I want to ask the PQC Assistant about specific timeline events directly from the detail popover so I can get deeper context.

### 2.5 All Users

**US-TIME-013**: As a user arriving from the PQC Assistant chatbot via a `?country=` link, I want the timeline to automatically display the referenced country so I can see the relevant data without manual filtering.

**US-TIME-014**: As a mobile user, I want to browse country timelines in a swipeable card format so I can explore PQC phases on my phone without horizontal scrolling.

**US-TIME-015**: As a user, I want clear visual indicators (New/Updated badges) on recently changed timeline entries so I know what data has been added or modified since the last CSV update.

---

## 3. Functional Requirements

### 3.1 Page Header and Layout

**FR-TIME-001**: The page SHALL display a centered header with the title "Global Migration Timeline" using the `.text-gradient` class.
- **AC**: Title renders at `text-xl` on mobile, `text-4xl` on desktop (`md:` breakpoint), with `font-bold` and `.text-gradient`.

**FR-TIME-002**: The page SHALL display a descriptive subtitle below the title: "Compare Post-Quantum Cryptography migration roadmaps across nations. Track phases from discovery to full migration and key regulatory milestones."
- **AC**: Subtitle is visible on `lg:` breakpoint and above (`hidden lg:block`). It uses `text-muted-foreground` and `max-w-2xl mx-auto`.

**FR-TIME-003**: The page SHALL display data source metadata below the subtitle, including the CSV filename and last update date.
- **AC**: Metadata line reads "Data Source: {filename} . Updated: {date}" in `font-mono text-[10px] md:text-xs text-muted-foreground`. Visible only on `lg:` breakpoint and above.

**FR-TIME-004**: The header metadata row SHALL include SourcesButton, ShareButton, and GlossaryButton action buttons in a horizontal cluster.
- **AC**: Buttons render inline with the metadata text in a `flex justify-center items-center gap-3` container. Hidden on mobile (visibility controlled by parent `hidden lg:flex`).

**FR-TIME-005**: The page SHALL use the `data-testid="timeline-view-root"` attribute on the root container for testing purposes.
- **AC**: Root `<div>` carries `data-testid="timeline-view-root"`.

### 3.2 Region Filtering

**FR-TIME-006**: The page SHALL provide a region filter dropdown with the following options: "All Regions", "Americas", "EU", "APAC", "Global".
- **AC**: `FilterDropdown` component renders with 5 items. Default label is "Region". Items use the `REGION_LABELS` mapping: `americas` -> "Americas", `eu` -> "EU", `apac` -> "APAC", `global` -> "Global".

**FR-TIME-007**: The region filter SHALL be pre-populated from `usePersonaStore.selectedRegion` on initial load, unless a `?country=` URL parameter is present.
- **AC**: If persona store has a non-null `selectedRegion` and no `?country=` URL param exists, the region dropdown defaults to that region. If `?country=` param is present and matches a valid country in `timelineData`, region defaults to "All".

**FR-TIME-008**: Changing the region filter SHALL reset the country selection to "All".
- **AC**: Calling `handleRegionChange(region)` sets `regionFilter` to the new region and `countryFilter` to "All". This prevents stale country selections when the region changes.

**FR-TIME-009**: The region filter SHALL scope the country dropdown to only show countries belonging to the selected region.
- **AC**: When `regionFilter !== 'All'`, the country dropdown items are filtered using `REGION_COUNTRIES_MAP[regionFilter]`. Only countries in the selected region appear in the dropdown.

**FR-TIME-010**: The region filter SHALL also filter the Gantt chart data to show only countries in the selected region.
- **AC**: `processedData` useMemo in `SimpleGanttChart` filters by `REGION_COUNTRIES_MAP[regionFilter]` when `regionFilter !== 'All'` and `selectedCountry === 'All'`.

### 3.3 Country Filtering

**FR-TIME-011**: The page SHALL provide a country filter dropdown showing all countries present in the timeline dataset, scoped by the currently selected region.
- **AC**: `FilterDropdown` component renders with "All Countries" as the first option, followed by country names sorted alphabetically. Each country item includes a flag icon rendered by the `CountryFlag` component (16x12px).

**FR-TIME-012**: The country filter SHALL support deep-link pre-selection via the `?country=<CountryName>` URL parameter.
- **AC**: On initial load, if `?country=` param is present and the value matches a `countryName` in `timelineData`, the country filter initializes to that value instead of "All". The region filter is set to "All" to avoid conflict.

**FR-TIME-013**: The country filter SHALL synchronize with URL parameter changes during same-route navigation (e.g., chatbot deep links that update `?country=` without a full page reload).
- **AC**: A `useEffect` hook watches `searchParams` from `useSearchParams()`. When `searchParams.get('country')` changes and matches a valid country, `countryFilter` updates accordingly.

**FR-TIME-014**: When a specific country is selected (not "All"), the Gantt chart SHALL display only that country's timeline data.
- **AC**: `processedData` filters to `d.country.countryName === selectedCountry` when `selectedCountry !== 'All'`, regardless of the region filter.

**FR-TIME-015**: Country selection SHALL drive Document Table visibility.
- **AC**: `DocumentTable` renders below the Gantt chart when `selectedCountry !== 'All'` AND `processedData.length > 0`. Hidden when "All Countries" or "All" is selected.

### 3.4 Gantt Chart Display

**FR-TIME-016**: The Gantt chart SHALL render as a horizontally scrollable HTML table with fixed-position columns for Country and Organization.
- **AC**: Table uses `table-fixed` layout with `min-w-[1000px]`. Container has `overflow-x-auto rounded-xl border border-border bg-card`.

**FR-TIME-017**: The Gantt chart SHALL display a year axis spanning from 2024 to 2035 (12 years), with each year as a column header.
- **AC**: Column headers render years 2024 through 2035. The year 2024 displays as "<2024" to indicate events starting before the chart's visible range. The current year is rendered in `text-foreground font-bold`; other years use `text-muted-foreground`.

**FR-TIME-018**: The Country column SHALL be sticky-positioned at `left: 0` with `z-index: 30` and a width of 180px.
- **AC**: Country header `<th>` has classes `sticky left-0 z-30 bg-background` with `w-[180px]`. Country data cells `<td>` have `sticky left-0 z-20 bg-background`.

**FR-TIME-019**: The Organization column SHALL be sticky-positioned at `left: 180px` with `z-index: 30` and a width of 200px.
- **AC**: Organization header `<th>` has classes `sticky left-[180px] z-30 bg-background` with `w-[200px]`. Organization data cells `<td>` have `sticky left-[180px] z-20 bg-background`.

**FR-TIME-020**: Country cells SHALL use `rowSpan` to group all phases for a country under a single country label.
- **AC**: The Country and Organization `<td>` elements render only on the first phase row (`idx === 0`) with `rowSpan={totalRows}` where `totalRows` is the number of phases for that country.

**FR-TIME-021**: Each country cell SHALL display a flag icon (20x14px, rendered by `CountryFlag`) alongside the country name in bold text.
- **AC**: Country cell contains a `flex items-center gap-2` layout with `CountryFlag` (width=20, height=14) and a `font-bold text-foreground text-sm` span.

**FR-TIME-022**: Organization cells SHALL display the name of the first regulatory body for each country.
- **AC**: Organization cell renders `country.bodies[0].name` in `text-xs text-muted-foreground`.

### 3.5 Gantt Chart Filtering and Sorting

**FR-TIME-023**: The Gantt chart SHALL provide a filter controls bar above the table with Region, Country, Phase Type, Event Type dropdowns, a text search field, a Deadlines quick-filter button, and an Export CSV button.
- **AC**: Controls bar renders in a `bg-card border border-border rounded-lg shadow-lg p-2 mb-2 flex flex-col md:flex-row items-center gap-4 relative z-40` container.

**FR-TIME-024**: The Phase Type dropdown SHALL offer options: Discovery, Testing, POC, Migration, Standardization, Guidance, Policy, Regulation, Research, Deadline.
- **AC**: `FilterDropdown` renders with 10 phase type items. Default label is "All Phases" with a `Layers` icon. Selecting a phase type filters the Gantt chart to show only phases of that type.

**FR-TIME-025**: The Event Type dropdown SHALL offer options: "Phases" (id: `Phase`) and "Milestones" (id: `Milestone`).
- **AC**: `FilterDropdown` renders with 2 event type items. Default label is "All Types" with a `Filter` icon. Selecting an event type filters phases to show only Phase-type or Milestone-type rows.

**FR-TIME-026**: The text search field SHALL filter countries by country name or organization name (case-insensitive substring match).
- **AC**: Input field with `Search` icon, placeholder "Filter by country...", bound to `filterText` state. Filtering occurs in `processedData` useMemo. Matches against `d.country.countryName` and `d.country.bodies[].name`.

**FR-TIME-027**: The Deadlines quick-filter button SHALL toggle the phase type filter between "Deadline" and "All".
- **AC**: Button with `Flag` icon labeled "Deadlines". When `selectedPhaseType === 'Deadline'`, button has destructive styling (`bg-destructive/20 border-destructive/50 text-destructive`). Clicking toggles `selectedPhaseType` between "Deadline" and "All".

**FR-TIME-028**: For Executive persona users, the Phase Type filter SHALL default to "Deadline" instead of "All".
- **AC**: `selectedPhaseType` initial state is computed: if `usePersonaStore.getState().selectedPersona === 'executive'`, it defaults to `'Deadline'`; otherwise `'All'`.

**FR-TIME-029**: The Country and Organization columns SHALL be sortable by clicking the column header.
- **AC**: Clicking the Country header sorts all rows alphabetically by `country.countryName`. Clicking the Organization header sorts by the first body name. Clicking the same header again toggles between ascending and descending order. Sort indicators (`ArrowUp`, `ArrowDown`, `ArrowUpDown`) display the current sort state.

**FR-TIME-030**: All filters (Region, Country, Phase Type, Event Type, Search Text) SHALL work independently and compose together.
- **AC**: `processedData` applies all active filters in sequence: region/country scoping, text search match, phase type filter, event type filter. Only data matching ALL active filters is displayed.

**FR-TIME-031**: Active filters SHALL be displayed as removable filter chips below the controls bar.
- **AC**: When `hasActiveFilters` is true, a row of `FilterChip` components renders showing each active filter with an "X" button to remove it. A result count displays: "{N} results . {M} of {T} countries".

**FR-TIME-032**: A "Clear all filters" link SHALL appear when no results match the current filter combination.
- **AC**: Empty state renders centered text "No results match your filters." with a "Clear all filters" button that calls `clearAllFilters()`, resetting all filter states.

**FR-TIME-033**: Phases within each country SHALL be sorted by start year, then by type (Milestones before Phases), then by phase order (Guidance, Policy, Regulation, Research, Discovery, Testing, POC, Migration, Standardization).
- **AC**: Phase sorting uses the `PHASE_ORDER` array for tiebreaking. Phases starting before 2025 are clamped to 2024 for sorting purposes.

**FR-TIME-034**: Countries with no phases matching the current filters SHALL be hidden from the chart.
- **AC**: After filtering phases within each country, `processedData` filters out countries where `c.phases.length === 0`.

### 3.6 Phase Cell Rendering

**FR-TIME-035**: Phase bars SHALL render across the appropriate year columns using colored background cells.
- **AC**: For each year in a phase's range `[startYear, endYear]`, the corresponding `<td>` cell receives the phase's color from `phaseColors[phase]` as `backgroundColor`. Phase colors use CSS custom properties (e.g., `hsl(var(--phase-discovery))`).

**FR-TIME-036**: Phase bars SHALL have a glow effect using `box-shadow`.
- **AC**: Phase cells receive `boxShadow: '0 0 8px {colors.glow}'` where `colors.glow` is the phase's glow color (e.g., `hsl(var(--phase-discovery) / 0.5)`).

**FR-TIME-037**: The first cell of each phase bar SHALL display the phase name label.
- **AC**: On the first cell (`isFirst`), a label renders with `text-[10px] font-bold text-foreground bg-background/70 px-1 rounded whitespace-nowrap drop-shadow-md select-none z-20 pointer-events-none`.

**FR-TIME-038**: Phase cells with a `status` of "New" or "Updated" SHALL display a `StatusBadge` indicator.
- **AC**: When `phaseData.status` is set, a `StatusBadge` component renders at `size="sm"` positioned absolutely on the phase bar's first cell.

**FR-TIME-039**: Phase cells SHALL be interactive buttons that open the `GanttDetailPopover` on click.
- **AC**: Each phase cell contains a `<button>` with `cursor-pointer` and `hover:scale-[1.02]` transition. Clicking fires `handlePhaseClick(phaseData, e)` which sets `selectedPhase`.

**FR-TIME-040**: Phase cell z-indexing SHALL follow the layering discipline: phase cells at `z-20`, sticky headers at `z-30`, filter controls at `z-40`, popovers at `z-9999`.
- **AC**: First cells and milestones have `z-index: 20`. Sticky header cells have `z-30`. Controls bar has `relative z-40`. `GanttDetailPopover` has inline style `z-index: 9999`.

### 3.7 Milestone Rendering

**FR-TIME-041**: Milestones SHALL render as flag icons (`Flag` from lucide-react) instead of colored phase bars.
- **AC**: When `phaseData.type === 'Milestone'`, the cell has `backgroundColor: 'transparent'` and `boxShadow: 'none'`. A `Flag` icon renders with `style={{ color: colors.start, fill: colors.start }}`.

**FR-TIME-042**: Milestone flags SHALL display the phase name label to the right of the flag icon.
- **AC**: A `<span>` with the phase name renders with `absolute left-full ml-1 text-[10px] font-semibold whitespace-nowrap select-none pointer-events-none z-20 drop-shadow-md` and the phase's start color.

**FR-TIME-043**: Milestones SHALL support `StatusBadge` indicators identical to phase bars.
- **AC**: When `phaseData.status` is set on a milestone, a `StatusBadge` renders at `scale-75` positioned above the flag icon.

### 3.8 GanttDetailPopover

**FR-TIME-044**: Clicking any phase cell or milestone SHALL open a centered `GanttDetailPopover` modal displaying the event's details.
- **AC**: Popover renders via `createPortal` to `document.body`. Positioned at `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2` with `z-index: 9999`.

**FR-TIME-045**: The popover SHALL display: phase badge (color-coded), title, status badge, description, start year, end year, source link, source date.
- **AC**: Header section shows phase badge styled with phase color and the event title. Content section shows description text. Detail grid shows Start, End, Source (link), and Date in a `grid grid-cols-2 sm:grid-cols-4` layout.

**FR-TIME-046**: The popover SHALL include an "Ask about this" button that opens the PQC Assistant with a pre-formed question about the event.
- **AC**: `AskAssistantButton` renders with `variant="text"` and a question string that includes the event title, phase name, year range, and description.

**FR-TIME-047**: The popover SHALL close when the user clicks outside the popover content area.
- **AC**: A `mousedown` event listener on `document` checks if the click target is outside `popoverRef.current` and calls `onClose()`.

**FR-TIME-048**: The popover SHALL close when the user presses the Escape key.
- **AC**: A `keydown` event listener on `document` checks for `event.key === 'Escape'` and calls `onClose()`.

**FR-TIME-049**: The source link in the popover SHALL open in a new tab with security attributes.
- **AC**: Source link renders as `<a href={sourceUrl} target="_blank" rel="noopener noreferrer">` with an `ExternalLink` icon. Displays "View" label.

### 3.9 Document Table

**FR-TIME-050**: When a specific country is selected (not "All"), a Document Table SHALL render below the Gantt chart.
- **AC**: `<DocumentTable data={processedData} title={'Documents . ${selectedCountry}'}/>` renders when `selectedCountry !== 'All' && processedData.length > 0`.

**FR-TIME-051**: The Document Table SHALL flatten `GanttCountryData[]` phases into individual rows containing: country name, organization, phase, type, title, start year, end year, description, source URL, source date, and status.
- **AC**: `rows` array is computed by `data.flatMap()` over `countryData.phases`, extracting fields from both the phase and its first event. Each row conforms to the `TimelineDocumentRow` interface.

**FR-TIME-052**: The Document Table SHALL support two view modes: "Cards" and "Table", toggleable via a `ViewToggle` component.
- **AC**: `ViewToggle` renders with `role="radiogroup"` and two options. Default view mode is "cards". View mode state is local to `DocumentTable`.

**FR-TIME-053**: The Document Table header SHALL display the title (e.g., "Documents . Canada") with an entry count and the view mode toggle.
- **AC**: Header shows `text-gradient` title, entry count ("N entries"), and `ViewToggle` aligned right.

**FR-TIME-054**: In table view, the Document Table SHALL have sortable columns: Phase, Title, Type, Organization, Period.
- **AC**: Each column header is a clickable button with sort direction indicators (`ArrowUp`, `ArrowDown`, `ArrowUpDown`). Sorting uses `localeCompare` with `{ numeric: true }`. Default sort: `startYear` ascending.

**FR-TIME-055**: In table view, each row SHALL display: phase badge (color-coded), title with source link and status badge, type with flag icon for milestones, organization in monospace primary color, formatted period, and a details action button.
- **AC**: Phase column shows `inline-flex` badge with `backgroundColor: colors.start`. Title column includes `ExternalLink` anchor for source URL and `StatusBadge`. Type column shows `Flag` icon for milestones. Organization shows in `font-mono text-primary/80`. Period formats: `< 2024`, `2026`, or `2026 - 2028`.

**FR-TIME-056**: The details action button SHALL show a `Sparkles` icon for enriched documents and an `Info` icon for non-enriched documents.
- **AC**: Button checks `hasSubstantiveEnrichment(enrichment)` using `getTimelineEnrichmentKey(countryName, org, title)`. Enriched rows show `Sparkles`; others show `Info`. Tooltip text differs accordingly.

**FR-TIME-057**: Clicking the details action button or card SHALL open the `TimelineDocumentDetailPopover`.
- **AC**: `setSelectedRow(row)` is called on click, which causes `TimelineDocumentDetailPopover` to render with `isOpen={!!selectedRow}`.

### 3.10 Document Card View

**FR-TIME-058**: In cards view, documents SHALL render as responsive grid cards with animated entrance transitions.
- **AC**: Grid layout: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`. Cards use `motion.article` from `framer-motion` with staggered fade-in (`delay: index * 0.03`).

**FR-TIME-059**: Each document card SHALL display: organization (monospace), title (2-line clamp), phase badge (color-coded), type badge (info color), enrichment badge (if applicable), period with calendar icon, country pill, and footer action buttons.
- **AC**: Organization renders as `font-mono text-sm text-primary/80`. Title uses `line-clamp-2`. Phase badge uses phase color background. Type badge uses `bg-status-info text-status-info`. Enriched docs show an "Enriched" badge with `Sparkles` icon.

**FR-TIME-060**: Each document card SHALL have a "Details" button and a "Source" link (when source URL exists).
- **AC**: Footer shows "Details" button with `Info`/`Sparkles` icon (based on enrichment) and optional "Source" external link. Both are styled as small action buttons.

**FR-TIME-061**: Document cards with "New" or "Updated" status SHALL display a `StatusBadge` in the top-right corner.
- **AC**: When `row.status` is set, `StatusBadge` renders with `absolute top-3 right-3` positioning.

**FR-TIME-062**: Cards SHALL use `AnimatePresence mode="popLayout"` for smooth layout transitions when filtering changes the visible set.
- **AC**: Card grid wraps items in `AnimatePresence` from `framer-motion`.

### 3.11 Document Detail Popover

**FR-TIME-063**: Clicking a document card's "Details" button or a table row's details icon SHALL open a `TimelineDocumentDetailPopover` modal.
- **AC**: Modal renders via `createPortal` to `document.body` with `z-index: 9999`. Centered fixed positioning with responsive width: `w-[95vw] sm:w-[85vw] md:w-[60vw] max-w-[1200px] max-h-[85vh]`.

**FR-TIME-064**: The detail popover SHALL display a header with phase badge, type badge, organization name, document title, Ask Assistant button, and close button.
- **AC**: Header contains badges, title (`text-lg font-bold`), and action buttons. `AskAssistantButton` generates a context-aware question including the document title, type, organization, country, and description.

**FR-TIME-065**: The detail popover SHALL display scrollable content with: description section, metadata grid (Organization, Country, Phase, Type, Period, Source Date), source link, and document analysis (if enriched).
- **AC**: Content area uses `overflow-y-auto`. Metadata grid uses `grid grid-cols-1 sm:grid-cols-2 gap-1`. Source link opens in new tab. `DocumentAnalysis` component renders when `isEnriched` is true.

**FR-TIME-066**: The detail popover SHALL implement focus trapping using `react-focus-lock`.
- **AC**: Modal content is wrapped in `<FocusLock returnFocus>`. Focus returns to the triggering element on close.

**FR-TIME-067**: The detail popover SHALL have `role="dialog"` and `aria-modal="true"` attributes.
- **AC**: Popover container has `role="dialog" aria-modal="true" aria-labelledby="timeline-doc-popover-title"`. Title element has `id="timeline-doc-popover-title"`.

**FR-TIME-068**: The detail popover SHALL close on click outside or Escape key press.
- **AC**: `mousedown` listener on `document` detects clicks outside `popoverRef`. `keydown` listener detects Escape key. Both call `onClose()`.

### 3.12 Mobile Support

**FR-TIME-069**: On mobile viewports (below `md` breakpoint / 768px), the page SHALL display a `MobileTimelineList` instead of the Gantt chart.
- **AC**: Desktop view container has `hidden md:block`. Mobile view container has `md:hidden`. Both exist in the DOM simultaneously; visibility is controlled by CSS.

**FR-TIME-070**: The `MobileTimelineList` SHALL display one card per country with the country flag, name, and primary organization.
- **AC**: Each country card uses `glass-panel p-4` container with flag (32x24px), country name (`font-bold text-foreground`), and organization name (`text-xs text-muted-foreground`).

**FR-TIME-071**: Each mobile country card SHALL display a swipeable phase carousel showing one phase at a time.
- **AC**: Phase content uses `motion.div` from `framer-motion` with `drag="x"` and `dragConstraints`. Swipe threshold is 50px. Phase displays: phase icon (dot or flag), phase name, status badge, and year range.

**FR-TIME-072**: The mobile phase carousel SHALL display dot indicators below the current phase showing total phases and current position.
- **AC**: Dot indicators render as `rounded-full` buttons with 44x44px touch targets. Active dot is 6x1.5 (pill shape) in the phase's color; inactive dots are 1.5x1.5 in muted color.

**FR-TIME-073**: Clicking a mobile phase card SHALL open the `GanttDetailPopover` with the phase details.
- **AC**: Phase card is wrapped in a `<button>` with `onClick={() => handleCardClick(currentPhase)}`. The same `GanttDetailPopover` used on desktop renders.

**FR-TIME-074**: The mobile view SHALL respect the region filter, showing only countries in the selected region.
- **AC**: `mobileGanttData` is computed via useMemo: when `regionFilter !== 'All' && regionFilter !== 'global'`, data is filtered to countries in `REGION_COUNTRIES_MAP[regionFilter]`.

**FR-TIME-075**: When a region filter is active on mobile, a label SHALL display the filtered region name and country count.
- **AC**: Text reads "Filtered: {RegionLabel} ({N} countries)" in `text-xs text-primary/90 mb-3`.

### 3.13 Header Action Buttons

**FR-TIME-076**: The SourcesButton SHALL open a `SourcesModal` showing authoritative sources filtered for the "Timeline" view type.
- **AC**: `<SourcesButton viewType="Timeline" />` renders. Clicking opens `SourcesModal` with `viewType="Timeline"`. Button label: "Sources" with `BookOpen` icon.

**FR-TIME-077**: The ShareButton SHALL enable sharing the Timeline page with a pre-configured title and description.
- **AC**: `<ShareButton title="PQC Migration Timeline -- Global Post-Quantum Cryptography Roadmap" text="Compare PQC migration timelines across nations -- track phases from discovery to full migration." />`. Uses native share API when available; falls back to copy-link.

**FR-TIME-078**: The GlossaryButton SHALL open the PQC glossary modal.
- **AC**: `<GlossaryButton />` renders. Clicking opens `Glossary` modal. Button label: "Glossary" with `BookOpenText` icon.

### 3.14 Gantt Legend

**FR-TIME-079**: A `GanttLegend` component SHALL render below the main content area showing all 10 phase color codes.
- **AC**: Legend renders in a `glass-panel p-4` container with title "Phase Color Code". A single-row table shows all phases: Discovery, Testing, POC, Migration, Standardization, Guidance, Policy, Regulation, Research, Deadline.

**FR-TIME-080**: Each phase legend cell SHALL display the phase name over a gradient background matching the phase's color scheme.
- **AC**: Each `<td>` has `background: linear-gradient(90deg, colors.start, colors.end)` with `box-shadow: inset 0 0 10px colors.glow`. Phase name renders in `text-xs font-bold text-foreground drop-shadow-md`.

**FR-TIME-081**: The legend SHALL include a milestones explanation section below the color table.
- **AC**: Below the color table, a section shows two colored `Flag` icons (primary and secondary) with text: "Milestones: Flag markers indicate key events, colored according to their phase."

### 3.15 CSV Export

**FR-TIME-082**: The Export CSV button SHALL generate a downloadable CSV file from the currently filtered timeline data.
- **AC**: Button with `Download` icon labeled "Export CSV". Disabled when `processedData.length === 0` with `disabled:opacity-50 disabled:cursor-not-allowed`.

**FR-TIME-083**: The exported CSV SHALL contain columns: Country, Organization, Phase, Type, Title, Start Year, End Year, Description, Status.
- **AC**: CSV header row lists all 9 column names. Data rows correspond to the flattened `processedData` (each phase becomes a row). Values containing commas, quotes, or newlines are properly escaped.

**FR-TIME-084**: The CSV file SHALL be named `pqc_timeline_YYYY-MM-DD.csv` using the current date.
- **AC**: Filename uses `new Date().toISOString().split('T')[0]` for the date portion.

**FR-TIME-085**: The export SHALL be initiated via a client-side Blob download (no server request).
- **AC**: CSV is assembled as a string, wrapped in a `Blob` with MIME type `text/csv;charset=utf-8;`, converted to an object URL, and triggered via a programmatic `<a>` click. Object URL is revoked after download.

### 3.16 Deep Linking

**FR-TIME-086**: The page SHALL support the `?country=<CountryName>` URL parameter for pre-selecting a country on load.
- **AC**: `countryFilter` initial state checks `window.location.search` for `country` param. If the value matches a `countryName` in `timelineData`, the filter initializes to that country. `regionFilter` is set to "All" to avoid conflicting filters.

**FR-TIME-087**: The page SHALL support the `?q=<SearchText>` URL parameter for pre-populating the text search field.
- **AC**: `SimpleGanttChart` receives `initialFilter={searchParams.get('q') ?? undefined}`. The `filterText` state initializes from `initialFilter`.

**FR-TIME-088**: The page SHALL react to URL parameter changes during same-route navigation (e.g., when the chatbot updates `?country=` without a full page navigation).
- **AC**: `useEffect` hook depends on `searchParams` from `useSearchParams()`. When `searchParams.get('country')` changes to a valid country name, `countryFilter` is updated.

### 3.17 Persona Integration

**FR-TIME-089**: The Timeline page SHALL be accessible to all personas and SHALL appear in the navigation regardless of persona selection.
- **AC**: Timeline route `/timeline` is included in `ALWAYS_VISIBLE_PATHS`. The page renders identically for all personas, except for region pre-selection and phase type default.

**FR-TIME-090**: The region filter SHALL pre-populate from the persona store's `selectedRegion` field.
- **AC**: `usePersonaStore.getState().selectedRegion` is read during `regionFilter` initialization. If non-null and no `?country=` param is present, the region filter defaults to the persona's region.

**FR-TIME-091**: The phase type filter SHALL default to "Deadline" for Executive persona users.
- **AC**: `selectedPhaseType` initial state checks `usePersonaStore.getState().selectedPersona`. If `'executive'`, defaults to `'Deadline'`; otherwise `'All'`.

**FR-TIME-092**: The Timeline page SHALL be listed as "Recommended" for Executive and Architect personas on the landing page.
- **AC**: `PERSONA_RECOMMENDED_PATHS.executive` includes `/timeline`. `PERSONA_RECOMMENDED_PATHS.architect` includes `/timeline`.

### 3.18 Data Loading and Status Tracking

**FR-TIME-093**: The page SHALL load timeline data from the latest dated CSV file discovered via `import.meta.glob('./timeline_*.csv')`.
- **AC**: `getLatestTimelineFiles()` uses `import.meta.glob` with `eager: true` and `?raw` query to load CSV files. Files are sorted by embedded date (MMDDYYYY format) in descending order. The latest file is used as the current dataset.

**FR-TIME-094**: The page SHALL compute "New" and "Updated" status badges by comparing the current CSV against the previous CSV version.
- **AC**: If two or more CSV files exist, `compareDatasets()` is called with the flattened event lists from both versions. The resulting `statusMap` is injected into the event data structure. Events present in the current but not the previous CSV are marked "New". Events with changed fields are marked "Updated".

**FR-TIME-095**: Status badges SHALL propagate from individual events to their aggregated phase rows.
- **AC**: In `transformToGanttData()`, `aggregatedStatus` is computed: if ANY event in a phase group has `status === 'New'`, the phase is marked "New"; else if any event has `status === 'Updated'`, the phase is marked "Updated".

**FR-TIME-096**: The data loader SHALL gracefully handle missing or malformed CSV files without crashing.
- **AC**: `try/catch` block wraps the CSV loading and parsing logic. On error, `parsedData` falls back to an empty array and `console.error` is called. The UI displays a "Loading Timeline Data..." fallback message when data is empty.

**FR-TIME-097**: The data loader SHALL support mock data for testing via the `VITE_MOCK_DATA` environment variable.
- **AC**: When `import.meta.env.VITE_MOCK_DATA === 'true'`, `getLatestTimelineFiles()` returns mock CSV content from `MOCK_CSV_CONTENT` instead of reading real files.

### 3.19 Document Enrichment

**FR-TIME-098**: Timeline documents SHALL support AI-enriched metadata loaded from enrichment markdown files.
- **AC**: `loadTimelineEnrichments()` uses `import.meta.glob('./doc-enrichments/timeline_doc_enrichments_*.md')` to discover enrichment files. The latest file (by embedded date) is parsed via `parseEnrichmentMarkdown()`.

**FR-TIME-099**: Enrichment lookup keys SHALL follow the format `"{countryName}:{org} -- {title}"`.
- **AC**: `getTimelineEnrichmentKey(countryName, org, title)` returns the correctly formatted key for lookup in the `timelineEnrichments` dictionary.

**FR-TIME-100**: Documents with substantive enrichment data SHALL be visually distinguished with a `Sparkles` icon and "Enriched" badge.
- **AC**: `hasSubstantiveEnrichment(enrichment)` checks whether the enrichment contains meaningful content beyond empty fields. Enriched documents show `Sparkles` instead of `Info` icons, and card view shows an "Enriched" badge.

**FR-TIME-101**: The `TimelineDocumentDetailPopover` SHALL display a `DocumentAnalysis` section for enriched documents.
- **AC**: When `isEnriched` is true, `<DocumentAnalysis enrichment={enrichment} />` renders below the metadata and source link sections, showing multi-dimensional analysis of the document.

### 3.20 Analytics Events

**FR-TIME-102**: The following user interactions SHALL fire analytics events via `logEvent()`:
- **AC**:
  - `logEvent('Timeline', 'Sort {field}', direction)` — on column sort.
  - `logEvent('Timeline', 'View Phase Details', '{phase}: {title}')` — on phase cell click.
  - `logEvent('Timeline', 'Filter Text', filterText)` — on search field blur.
  - `logEvent('Timeline', 'Filter Phase Type', id)` — on phase type dropdown change.
  - `logEvent('Timeline', 'Filter Event Type', id)` — on event type dropdown change.
  - `logEvent('Timeline', 'Quick Filter Deadlines', next)` — on Deadlines button toggle.
  - `logEvent('Timeline', 'Export CSV', '{N} rows')` — on CSV export.

### 3.21 Empty and Loading States

**FR-TIME-103**: When timeline data is loading or unavailable, the page SHALL display a loading message instead of a blank screen.
- **AC**: When `!timelineData || timelineData.length === 0 || ganttData.length === 0`, the page renders "Loading Timeline Data..." heading with "Please wait while we load the migration timeline." description.

**FR-TIME-104**: When filters produce no results, the Gantt chart SHALL display an empty state with a "Clear all filters" action.
- **AC**: When `processedData.length === 0`, a centered empty state renders with text "No results match your filters." and a "Clear all filters" link button.

### 3.22 Keyboard Navigation

**FR-TIME-105**: Phase cells in the Gantt chart SHALL be keyboard navigable using arrow keys, Home, and End.
- **AC**: `handlePhaseKeyDown` callback handles: `ArrowUp` (move to previous row), `ArrowDown` (move to next row), `ArrowLeft` (move to previous phase in row), `ArrowRight` (move to next phase in row), `Home` (first phase in row), `End` (last phase in row). Navigation uses `data-phase-row` and `data-phase-col` attributes for element targeting.

**FR-TIME-106**: Phase cells SHALL be activatable via Enter or Space key.
- **AC**: Pressing Enter or Space on a focused phase cell calls `handlePhaseClick()`, opening the `GanttDetailPopover`.

**FR-TIME-107**: Only the first cell of each phase bar SHALL be in the tab order; subsequent cells in the same phase SHALL have `tabIndex={-1}`.
- **AC**: First cell (`isFirst`) has `tabIndex={0}`; all other cells have `tabIndex={-1}`. Arrow key navigation moves focus between cells.

---

## 4. UI Components

| Component | File Path | Purpose | Size |
|-----------|-----------|---------|------|
| TimelineView | `src/components/Timeline/TimelineView.tsx` | Page-level container; owns region/country filter state; orchestrates desktop and mobile layouts | ~192 lines |
| SimpleGanttChart | `src/components/Timeline/SimpleGanttChart.tsx` | Desktop Gantt chart renderer with filter controls, sorting, phase cell rendering, CSV export | ~663 lines |
| GanttDetailPopover | `src/components/Timeline/GanttDetailPopover.tsx` | Phase/milestone detail modal; shows event description, dates, source link, Ask Assistant button | ~162 lines |
| DocumentTable | `src/components/Timeline/DocumentTable.tsx` | Country-scoped document table with card/table view toggle, sortable columns, enrichment indicators | ~273 lines |
| TimelineDocumentCard | `src/components/Timeline/TimelineDocumentCard.tsx` | Individual document card with phase/type badges, enrichment indicator, footer actions | ~131 lines |
| TimelineDocumentDetailPopover | `src/components/Timeline/TimelineDocumentDetailPopover.tsx` | Document detail modal with focus trap, metadata grid, source link, DocumentAnalysis section | ~229 lines |
| GanttLegend | `src/components/Timeline/GanttLegend.tsx` | Phase color legend table with milestone explanation | ~71 lines |
| MobileTimelineList | `src/components/Timeline/MobileTimelineList.tsx` | Mobile vertical list with swipeable phase carousel and dot indicators | ~193 lines |

### 4.1 Shared Components Used

| Component | File Path | Usage |
|-----------|-----------|-------|
| FilterDropdown | `src/components/common/FilterDropdown.tsx` | Region, Country, Phase Type, Event Type dropdowns |
| CountryFlag | `src/components/common/CountryFlag.tsx` | Flag icons in country dropdowns and Gantt rows |
| StatusBadge | `src/components/common/StatusBadge.tsx` | "New" / "Updated" badges on phases and documents |
| ViewToggle | `src/components/Library/ViewToggle.tsx` | Cards/Table view toggle in DocumentTable |
| DocumentAnalysis | `src/components/Library/DocumentAnalysis.tsx` | AI enrichment display in document detail popover |
| SourcesButton | `src/components/ui/SourcesButton.tsx` | Authoritative sources modal trigger |
| ShareButton | `src/components/ui/ShareButton.tsx` | Share/copy-link action |
| GlossaryButton | `src/components/ui/GlossaryButton.tsx` | PQC glossary modal trigger |
| AskAssistantButton | `src/components/ui/AskAssistantButton.tsx` | Context-aware PQC Assistant question trigger |
| Button | `src/components/ui/button.tsx` | Standard button component (used in AskAssistantButton) |

### 4.2 Internal Subcomponents

| Component | Location | Purpose |
|-----------|----------|---------|
| FilterChip | Inline in `SimpleGanttChart.tsx` | Removable active filter indicator pill |

---

## 5. Data Sources

### 5.1 Primary Data

| Source | Path | Description |
|--------|------|-------------|
| Timeline CSV | `src/data/timeline_MMDDYYYY.csv` | Main timeline data (auto-discovered; latest two versions kept) |
| Timeline enrichments | `src/data/doc-enrichments/timeline_doc_enrichments_MMDDYYYY.md` | AI-analyzed document metadata |
| Mock timeline data | `src/data/mockTimelineData.ts` | Mock CSV content for testing (`VITE_MOCK_DATA=true`) |

### 5.2 Configuration Data

| Source | Path | Description |
|--------|------|-------------|
| Persona config | `src/data/personaConfig.ts` | `REGION_COUNTRIES_MAP`, `ALWAYS_VISIBLE_PATHS`, `PERSONA_RECOMMENDED_PATHS` |
| Authoritative sources CSV | `src/data/pqc_authoritative_sources_reference_MMDDYYYY.csv` | Source references for SourcesButton (filtered by `ViewType = 'Timeline'`) |

### 5.3 Cached Documents

| Directory | Description |
|-----------|-------------|
| `public/timeline/` | Archived HTML/PDF copies of government PQC milestone documents, named `{Country}_{Org}_{Title}.{html\|pdf}`. Populated by `npm run download:timeline`. Contains `manifest.json` and `skip-list.json`. |

### 5.4 CSV Column Schema

The timeline CSV has 14 columns:

```
Country, FlagCode, OrgName, OrgFullName, OrgLogoUrl, Type, Category, StartYear, EndYear, Title, Description, SourceUrl, SourceDate, Status
```

See [Appendix B](#appendix-b--csv-column-schema) for detailed column descriptions.

---

## 6. Data Model

### 6.1 Type Definitions

All types are defined in `src/types/timeline.ts`.

```typescript
type Phase =
  | 'Discovery' | 'Testing' | 'POC' | 'Migration'
  | 'Standardization' | 'Guidance' | 'Policy'
  | 'Regulation' | 'Research' | 'Deadline'

type EventType = 'Phase' | 'Milestone'

interface TimelineEvent {
  startYear: number
  endYear: number
  phase: Phase
  type: EventType
  title: string
  description: string
  sourceUrl?: string
  sourceDate?: string
  status?: string
  orgName: string
  orgFullName: string
  orgLogoUrl?: string
  countryName: string
  flagCode: string
}

interface TimelinePhase {
  startYear: number
  endYear: number
  phase: string
  type: EventType
  title: string
  description: string
  events: TimelineEvent[]
  status?: 'New' | 'Updated'
}

interface RegulatoryBody {
  name: string
  fullName: string
  logoUrl?: string
  countryCode: string
  events: TimelineEvent[]
  status?: 'New' | 'Updated'
}

interface CountryData {
  countryName: string
  flagCode: string
  bodies: RegulatoryBody[]
  status?: 'New' | 'Updated'
}

interface GanttCountryData {
  country: CountryData
  phases: TimelinePhase[]
}
```

### 6.2 Document Row Type

Defined in `TimelineDocumentDetailPopover.tsx`:

```typescript
interface TimelineDocumentRow {
  countryName: string
  org: string
  phase: string
  type: string
  title: string
  startYear: number
  endYear: number
  description: string
  sourceUrl?: string
  sourceDate?: string
  status?: string
}
```

### 6.3 Data Transformation Pipeline

1. **CSV Loading**: `getLatestTimelineFiles()` discovers and loads the latest two timeline CSV files via `import.meta.glob`.
2. **CSV Parsing**: `parseTimelineCSV()` converts raw CSV into `CountryData[]`. Special handling: United States + NSA org creates a separate "United States (CNSA)" country lane.
3. **Status Computation**: `compareDatasets()` compares current and previous CSV events to produce "New"/"Updated" statuses.
4. **Status Injection**: Statuses are injected back into the `CountryData[]` structure.
5. **Gantt Transformation**: `transformToGanttData()` converts `CountryData[]` into `GanttCountryData[]`, grouping events into phase rows with aggregated statuses.
6. **Filtering/Sorting**: `processedData` useMemo applies region, country, phase type, event type, and text filters, then sorts by the selected field.

---

## 7. Filtering and Search

### 7.1 Filter Hierarchy

| Level | Filter | Owner | Scope |
|-------|--------|-------|-------|
| 1 | Region | `TimelineView` | Scopes country dropdown and Gantt data to a geographic region |
| 2 | Country | `TimelineView` | Filters to a single country; triggers DocumentTable |
| 3 | Phase Type | `SimpleGanttChart` | Filters phases by category (10 options) |
| 4 | Event Type | `SimpleGanttChart` | Filters by Phase or Milestone |
| 5 | Text Search | `SimpleGanttChart` | Substring match on country name or organization name |

### 7.2 Filter Composition

All filters compose via logical AND in the `processedData` useMemo. The filter chain is:

1. Text search match (country name OR org name)
2. Region/Country scope (country > region > all)
3. Phase type match (if not "All")
4. Event type match (if not "All")
5. Remove countries with zero matching phases

### 7.3 URL Parameter Filters

| Parameter | Example | Effect |
|-----------|---------|--------|
| `?country=Canada` | Pre-selects country filter to "Canada", sets region to "All" |
| `?q=NIST` | Pre-populates the text search field with "NIST" |

### 7.4 Filter Defaults

| Persona | Region Default | Phase Type Default |
|---------|---------------|-------------------|
| None | "All" | "All" |
| Executive | persona's `selectedRegion` | "Deadline" |
| Developer | persona's `selectedRegion` | "All" |
| Architect | persona's `selectedRegion` | "All" |
| Researcher | persona's `selectedRegion` | "All" |

---

## 8. State Management

### 8.1 External Stores

| Store | localStorage Key | Fields Used | Access Pattern |
|-------|-----------------|-------------|----------------|
| `usePersonaStore` | `pqc-learning-persona` | `selectedRegion`, `selectedPersona` | Read-only on initialization via `getState()` |

### 8.2 Local State (TimelineView)

| State | Type | Initial Value | Purpose |
|-------|------|---------------|---------|
| `regionFilter` | `string` | From persona store or "All" | Currently selected region |
| `countryFilter` | `string` | From `?country=` param or "All" | Currently selected country |

### 8.3 Local State (SimpleGanttChart)

| State | Type | Initial Value | Purpose |
|-------|------|---------------|---------|
| `filterText` | `string` | From `initialFilter` prop or `''` | Text search query |
| `sortField` | `'country' \| 'organization'` | `'country'` | Active sort column |
| `sortDirection` | `'asc' \| 'desc'` | `'asc'` | Sort order |
| `selectedPhase` | `TimelinePhase \| null` | `null` | Phase for GanttDetailPopover |
| `selectedPhaseType` | `string` | `'Deadline'` for executive, `'All'` otherwise | Phase type filter |
| `selectedEventType` | `string` | `'All'` | Event type filter |

### 8.4 Local State (DocumentTable)

| State | Type | Initial Value | Purpose |
|-------|------|---------------|---------|
| `viewMode` | `'cards' \| 'table'` | `'cards'` | Card vs. table view toggle |
| `selectedRow` | `TimelineDocumentRow \| null` | `null` | Row for detail popover |
| `sortConfig` | `{ key: SortKey; direction: SortDirection }` | `{ key: 'startYear', direction: 'asc' }` | Table sort configuration |

### 8.5 Local State (MobileTimelineList)

| State | Type | Initial Value | Purpose |
|-------|------|---------------|---------|
| `selectedPhase` | `TimelinePhase \| null` | `null` | Phase for GanttDetailPopover |
| `phaseIndices` | `Record<string, number>` | `{}` | Current phase carousel index per country |

### 8.6 Computed State (Memoized)

| Variable | Location | Dependencies | Purpose |
|----------|----------|-------------|---------|
| `ganttData` | `TimelineView` | `[]` (static) | Transformed `GanttCountryData[]` from raw `timelineData` |
| `mobileGanttData` | `TimelineView` | `ganttData`, `regionFilter` | Region-filtered Gantt data for mobile |
| `regionItems` | `TimelineView` | `[]` (static) | Region dropdown items |
| `countryItems` | `TimelineView` | `regionFilter` | Country dropdown items (scoped by region) |
| `processedData` | `SimpleGanttChart` | `data`, `filterText`, `sortField`, `sortDirection`, `regionFilter`, `selectedCountry`, `selectedPhaseType`, `selectedEventType` | Fully filtered and sorted Gantt data |
| `totalPhaseCount` | `SimpleGanttChart` | `processedData` | Total visible phases across all countries |

---

## 9. Cross-Page Integration

### 9.1 Inbound Navigation

| Source | Mechanism | Parameters |
|--------|-----------|------------|
| PQC Assistant chatbot | URL navigation | `?country=<CountryName>` |
| Assessment Report | Link | `?country=<CountryName>` |
| Landing page journey steps | Router navigation | Direct `/timeline` link |
| Navigation bar | Router link | `/timeline` |
| Learn modules (inline tooltips) | URL navigation | Direct `/timeline` link |

### 9.2 Outbound Navigation

| Destination | Trigger | Mechanism |
|-------------|---------|-----------|
| PQC Glossary | GlossaryButton click | Modal overlay |
| Authoritative Sources | SourcesButton click | Modal overlay (filtered by ViewType "Timeline") |
| PQC Assistant | AskAssistantButton click | Navigates to assistant with pre-formed question |
| External source documents | Source link click | New tab (`target="_blank"`) |
| Cached documents | Source link (if cached) | `public/timeline/` directory |

### 9.3 Shared Data

| Data | Shared With | Direction |
|------|-------------|-----------|
| `timelineData` (CountryData[]) | RAG corpus (`rag-corpus.json`) | Timeline data is included in the unified search index |
| Authoritative sources CSV | SourcesButton/SourcesModal | Read-only consumption |
| Persona store | Landing page, Assessment, all pages | Read-only |

---

## 10. Persona Behavior

### 10.1 Visibility

The Timeline page is in `ALWAYS_VISIBLE_PATHS` and appears in navigation for all personas, including when no persona is selected.

### 10.2 Persona-Specific Defaults

5 personas are supported. The platform uses 5-persona profiling (Executive, Architect, Developer, Researcher, Ops/Security Engineer).

| Persona | Region Pre-Selection | Phase Type Default | Recommended Path |
|---------|---------------------|-------------------|-----------------|
| Executive | Yes (from `selectedRegion`) | "Deadline" | Yes (landing page badge) |
| Developer | Yes (from `selectedRegion`) | "All" | No |
| Architect | Yes (from `selectedRegion`) | "All" | Yes (landing page badge) |
| Researcher | Yes (from `selectedRegion`) | "All" | No |
| Ops/Security Engineer | Yes (from `selectedRegion`) | "All" | Secondary path (operational compliance deadlines) |
| None | "All" | "All" | N/A |

**Document archive**: `public/timeline/` contains 110+ archived HTML/PDF copies of government PQC milestone documents, named `{Country}_{Org}_{Title}.{html|pdf}`. These are gitignored and populated on fresh clone by running `npm run download:timeline`. The manifest (`public/timeline/manifest.json`) tracks 110+ entries. Ops/Security Engineers use these archived source documents to verify deadline dates and authority of compliance mandates for operational planning.

### 10.3 Journey Step Mapping

The Timeline page maps to the "Explore" step in the landing page's 7-step journey progression (Learn > Assess > **Explore** > Test > Deploy > Ramp Up > Stay Agile).

---

## 11. Mobile and Responsive Design

### 11.1 Breakpoints

| Breakpoint | Layout | Components Visible |
|------------|--------|-------------------|
| < 768px (mobile) | Vertical card list | MobileTimelineList, GanttLegend |
| >= 768px (md) | Full Gantt chart | SimpleGanttChart (with DocumentTable when country selected), GanttLegend |
| >= 1024px (lg) | Full Gantt + header details | All desktop components + subtitle + metadata + action buttons |

### 11.2 Responsive Behaviors

| Element | Mobile (<768px) | Desktop (>=768px) |
|---------|----------------|-------------------|
| Title | `text-xl`, `mb-1` | `text-4xl`, `mb-4` |
| Subtitle | Hidden | Visible (`hidden lg:block`) |
| Metadata + action buttons | Hidden | Visible (`hidden lg:flex`) |
| Filter controls | Stack vertically | Horizontal row |
| Gantt chart | Hidden (`hidden md:block`) | Visible |
| Mobile list | Visible (`md:hidden`) | Hidden |
| Deadlines button label | Icon only (label hidden) | Icon + "Deadlines" text (`hidden md:inline`) |
| Export CSV button label | Icon only (label hidden) | Icon + "Export CSV" text (`hidden md:inline`) |
| Search label | Hidden (`hidden md:inline`) | Visible |

---

## 12. Accessibility

### 12.1 WCAG 2.1 Compliance

The Timeline page targets WCAG 2.1 Level AA compliance with the following accommodations:

| Requirement | Implementation |
|-------------|---------------|
| Keyboard navigation | Arrow keys navigate between phase cells; Enter/Space activate; Escape closes popovers |
| Focus management | Popovers use `react-focus-lock` for focus trapping; focus returns to trigger on close |
| ARIA roles | Popover: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`; Sort headers: `aria-sort`; View toggle: `role="radiogroup"`, `role="radio"`, `aria-checked`; Filter dropdown: `aria-expanded`, `role="listbox"`, `role="option"` |
| Accessible labels | Phase cells: `aria-label="{phase}: {title}"`; Filter chips: `aria-label="Remove {label} filter"`; Deadlines button: `aria-label="Show deadlines only"`; Export button: `aria-label="Export filtered timeline as CSV"`; Country flags: `aria-label="Flag of {countryName}"` |
| Color contrast | Known issue: phase colors across the Gantt chart fail contrast ratios on 124 nodes. Tracked separately; `color-contrast` rule disabled in axe audits. |
| Touch targets | Mobile phase dots: minimum 44x44px touch targets |
| Screen readers | Decorative icons have `aria-hidden="true"`; semantic content uses proper heading hierarchy |

### 12.2 Known Accessibility Exceptions

| Exception | Reason | Tracking |
|-----------|--------|----------|
| Color contrast on phase cells | Phase color palette is integral to the visualization; contrast remediation requires a design review | Disabled in axe audits |
| Scrollable region focusable | Mobile Gantt horizontal scroll container; tracked separately | Disabled in mobile axe audit |

---

## 13. Print and Export

### 13.1 CSV Export

See [FR-TIME-082 through FR-TIME-085](#315-csv-export) for detailed CSV export requirements.

### 13.2 Browser Print

The Timeline page does not have a dedicated print layout. Standard browser print applies:

- The Gantt chart prints as a horizontally scrollable table (may clip on standard paper)
- DocumentTable prints in standard table format
- GanttLegend prints below the main content
- No special `@media print` rules are applied specific to this page

---

## 14. Performance

### 14.1 Lazy Loading

**FR-TIME-108**: The TimelineView component SHALL be lazy-loaded via `React.lazy()` with automatic retry on chunk fetch failures.
- **AC**: `App.tsx` uses `lazyWithRetry(() => import('./components/Timeline/TimelineView'))`. A `Suspense` boundary with a "Loading..." fallback wraps the route.

### 14.2 Memoization

| Computation | Strategy | Dependencies |
|-------------|----------|-------------|
| `ganttData` | `useMemo` | `[]` (computed once) |
| `mobileGanttData` | `useMemo` | `ganttData`, `regionFilter` |
| `regionItems` | `useMemo` | `[]` (computed once) |
| `countryItems` | `useMemo` | `regionFilter` |
| `processedData` | `useMemo` | 8 dependencies (all filter/sort states) |
| `totalPhaseCount` | `useMemo` | `processedData` |
| `clearAllFilters` | `useCallback` | `onRegionSelect`, `onCountrySelect` |
| `handleExportCSV` | `useCallback` | `processedData` |
| `handlePhaseKeyDown` | `useCallback` | `[]` |

### 14.3 Rendering Optimizations

| Optimization | Location | Purpose |
|-------------|----------|---------|
| CSS `contain: layout style` | Phase cells | Optimize WebKit rendering of many small elements |
| `will-change: transform` | Sticky headers | Promote to compositor layer for smooth scrolling |
| `table-fixed` layout | Gantt table | Avoid layout recalculation on horizontal scroll |
| Eager CSV loading | `import.meta.glob` | CSV content loaded at module evaluation time, not on demand |

---

## 15. Technical Architecture

### 15.1 Component Tree

```
App.tsx
  MainLayout
    TimelineView (lazy-loaded)
      [Header: title, subtitle, metadata, SourcesButton, ShareButton, GlossaryButton]
      [Desktop: hidden md:block]
        SimpleGanttChart
          FilterDropdown (x4: Region, Country, Phase Type, Event Type)
          FilterChip (dynamic, per active filter)
          <table> (Gantt chart)
            CountryFlag (per country row)
            Phase cells (buttons)
          DocumentTable (conditional: when country selected)
            ViewToggle
            TimelineDocumentCard (card view, x N)
            <table> (table view)
            TimelineDocumentDetailPopover
              DocumentAnalysis (if enriched)
              AskAssistantButton
          GanttDetailPopover
            AskAssistantButton
      [Mobile: md:hidden]
        MobileTimelineList
          CountryFlag (per country)
          motion.div (swipeable phase carousel)
          GanttDetailPopover
      GanttLegend
```

### 15.2 Z-Index Layering

| Layer | Z-Index | Components |
|-------|---------|------------|
| Phase cells (first/milestone) | 20 | Phase bar first cell, milestone flags |
| Sticky table headers | 30 | Country and Organization `<th>` elements |
| Filter controls bar | 40 (`relative z-40`) | Dropdowns, search, buttons |
| Popovers | 9999 (inline style) | GanttDetailPopover, TimelineDocumentDetailPopover |

### 15.3 Route Definition

```tsx
// App.tsx
<Route
  path="/timeline"
  element={
    <ErrorBoundary>
      <TimelineView />
    </ErrorBoundary>
  }
/>
```

### 15.4 Data Flow

```
CSV files (src/data/timeline_*.csv)
  --> import.meta.glob (eager, raw)
  --> getLatestTimelineFiles() picks latest 2
  --> parseTimelineCSV() --> CountryData[]
  --> compareDatasets() --> statusMap
  --> Status injection --> timelineData (module-level export)
  --> transformToGanttData() --> ganttData (useMemo in TimelineView)
  --> processedData (useMemo in SimpleGanttChart, applies all filters)
  --> Renders: Gantt table, DocumentTable, MobileTimelineList
```

### 15.5 CNSA Lane Handling

The CSV parser has special handling for the United States NSA entries: when `countryName === 'United States'` and `orgName === 'NSA'`, it creates a separate country lane named `"United States (CNSA)"`. This allows CNSA 2.0 migration timelines to display separately from other US government timelines (e.g., NIST, OMB).

---

## 16. Testing Requirements

### 16.1 Unit Tests

**File**: `src/components/Timeline/TimelineView.test.tsx`

| Test | Description | Status |
|------|-------------|--------|
| Desktop: renders main heading | Verifies "Global Migration Timeline" text | Implemented |
| Desktop: renders description | Verifies subtitle text | Implemented |
| Desktop: displays metadata | Verifies "Data Source:" and "Updated:" labels | Implemented |
| Desktop: renders Gantt chart | Verifies `data-testid="simple-gantt-chart"` presence | Implemented |
| Desktop: mobile list exists in DOM | Verifies mobile list is in DOM (hidden via CSS) | Implemented |
| Desktop: renders legend | Verifies `data-testid="gantt-legend"` presence | Implemented |
| Desktop: passes data to Gantt | Verifies data row count is passed | Implemented |
| Desktop: initializes with "All" | Verifies default country selection | Implemented |
| Mobile: renders heading | Verifies heading on mobile viewport | Implemented |
| Mobile: hides description | Verifies description has hidden class | Implemented |
| Mobile: renders mobile list | Verifies `data-testid="mobile-timeline-list"` presence | Implemented |
| Mobile: Gantt hidden via CSS | Verifies Gantt exists but hidden | Implemented |
| Mobile: renders legend | Verifies legend on mobile | Implemented |
| Mobile: passes data to list | Verifies data row count | Implemented |
| Responsive: desktop classes | Verifies `hidden md:block` on desktop container | Implemented |
| Responsive: mobile classes | Verifies `md:hidden` on mobile container | Implemented |
| Layout: container classes | Verifies root element exists | Implemented |
| Layout: header spacing | Verifies `text-center` on header | Implemented |
| Layout: legend section | Verifies `mt-8` on legend container | Implemented |

### 16.2 E2E Tests

**File**: `e2e/timeline.spec.ts`

| Test | Description | Status |
|------|-------------|--------|
| Displays gantt chart table | Verifies Country/Organization headers and US data visible | Implemented |
| Displays phase details in popover | Clicks Discovery phase, verifies Start/End/Source/Date labels | Implemented |
| Renders deadlines as milestones | Verifies Flag SVG icons are visible | Implemented |
| Renders country flags as SVGs | Verifies flag images with `alt$=" flag"` and US flag specifically | Implemented |
| Does not display org logos | Verifies no logo images in table | Implemented |
| Country selector updates view | Selects Canada, verifies Canada visible and US hidden | Implemented |
| Accessibility audit (desktop) | axe-playwright WCAG 2.1 audit (color-contrast disabled) | Implemented |
| Accessibility audit (popover) | axe audit with popover open | Implemented |
| Accessibility audit (mobile) | axe audit at 375x667 viewport (scrollable-region-focusable disabled) | Implemented |

### 16.3 Test Mocking Strategy

| Dependency | Mock Strategy |
|------------|--------------|
| `react-router-dom` (useSearchParams) | `vi.mock` returning empty URLSearchParams |
| `SimpleGanttChart` | Mocked as simplified div showing data counts |
| `MobileTimelineList` | Mocked as simplified div showing data counts |
| `GanttLegend` | Mocked as simple div with test ID |
| Timeline CSV data | Real data used in unit tests; mock data available via `VITE_MOCK_DATA` |
| E2E localStorage | Seeded with theme storage to bypass WelcomeRedirect |

---

## 17. Analytics

### 17.1 Google Analytics Events

All events use the `logEvent(category, action, label)` pattern via `react-ga4`.

| Category | Action | Label | Trigger |
|----------|--------|-------|---------|
| Timeline | Sort country | `asc` or `desc` | Click Country header |
| Timeline | Sort organization | `asc` or `desc` | Click Organization header |
| Timeline | View Phase Details | `{phase}: {title}` | Click any phase cell |
| Timeline | Filter Text | `{filterText}` | Search field blur (when non-empty) |
| Timeline | Filter Phase Type | Phase type ID | Phase type dropdown change |
| Timeline | Filter Event Type | Event type ID | Event type dropdown change |
| Timeline | Quick Filter Deadlines | `Deadline` or `All` | Deadlines button click |
| Timeline | Export CSV | `{N} rows` | Export CSV button click |

### 17.2 Page View Tracking

Page view is automatically tracked by the router-level analytics integration when navigating to `/timeline`.

---

## 18. Security Considerations

### 18.1 External Links

All external links (source URLs from timeline data) open with `target="_blank" rel="noopener noreferrer"` per OWASP tabnabbing prevention requirements.

### 18.2 Content Rendering

No `dangerouslySetInnerHTML` is used anywhere in the Timeline components. All text content is rendered through React's auto-escaping mechanisms.

### 18.3 URL Parameter Handling

The `?country=` parameter value is validated against `timelineData` entries before use. Invalid values are silently ignored (country filter remains "All").

### 18.4 CSV Export

CSV export is entirely client-side. No data is sent to external servers. The export uses `Blob` and `URL.createObjectURL()` for download.

---

## 19. Non-Functional Requirements

### 19.1 Performance Targets

| Metric | Target |
|--------|--------|
| Initial render (lazy load) | < 3 seconds including WASM loading |
| Filter interaction response | < 100ms |
| Phase cell click to popover | < 200ms |
| CSV export (full dataset) | < 1 second |
| Mobile swipe animation | 60fps |

### 19.2 Browser Support

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | Latest 2 versions | Primary development target |
| Firefox | Latest 2 versions | E2E tested |
| Safari / WebKit | Latest 2 versions | E2E tested; CSS `contain` applied for rendering optimization |
| Mobile Safari | iOS 15+ | Mobile layout tested |
| Mobile Chrome | Android 12+ | Mobile layout tested |

### 19.3 Data Freshness

| Aspect | Policy |
|--------|--------|
| CSV update frequency | Manual update; two versions kept per `CSVmaintenance.md` |
| New/Updated badges | Computed by comparing latest two CSV files |
| Enrichment data | Updated independently via enrichment markdown files |
| Cache policy | No client-side caching; data loaded from bundled assets |

---

## 20. Cross-References

| Document | Relationship |
|----------|-------------|
| PRD-LAND-001 (Landing Page) | Timeline is mapped to the "Explore" journey step; badge "Recommended" for Executive and Architect |
| PRD-ASSESS-001 (Assessment) | Assessment report links to Timeline via `?country=` for the user's selected country |
| PRD-CHAT-001 (PQC Assistant) | Chatbot deep-links to Timeline via `?country=<CountryName>` when discussing country-specific timelines |
| BRD-EXEC-001 (Executive Persona) | Timeline is a recommended path; deadlines default filter supports executive workflow |
| BRD-ARCH-001 (Architect Persona) | Timeline is a recommended path; multi-country comparison supports architecture planning |
| PRD-LIB-001 (Library Page) | Shares `ViewToggle`, `DocumentAnalysis`, enrichment infrastructure |
| PRD-COMPLY-001 (Compliance Page) | Timeline and compliance pages share authoritative sources data; compliance page references timeline events |
| `docs/ux-standard.md` | Defines semantic token system and component contracts used by Timeline |
| `docs/CSVmaintenance.md` | Governs timeline CSV update procedures |
| `docs/maintenance-guide.md` | Documents data sources and update procedures for the Timeline page |

---

## Appendix A -- Phase Color System

All phase colors are defined as CSS custom properties in `src/styles/index.css` within the `@theme` block and referenced in `src/data/timelineData.ts` via the `phaseColors` record.

| Phase | CSS Variable | Start Color | Glow |
|-------|-------------|-------------|------|
| Discovery | `--phase-discovery` | `hsl(var(--phase-discovery))` | `hsl(var(--phase-discovery) / 0.5)` |
| Testing | `--phase-testing` | `hsl(var(--phase-testing))` | `hsl(var(--phase-testing) / 0.5)` |
| POC | `--phase-poc` | `hsl(var(--phase-poc))` | `hsl(var(--phase-poc) / 0.5)` |
| Migration | `--phase-migration` | `hsl(var(--phase-migration))` | `hsl(var(--phase-migration) / 0.5)` |
| Standardization | `--phase-standardization` | `hsl(var(--phase-standardization))` | `hsl(var(--phase-standardization) / 0.5)` |
| Guidance | `--phase-guidance` | `hsl(var(--phase-guidance))` | `hsl(var(--phase-guidance) / 0.5)` |
| Policy | `--phase-policy` | `hsl(var(--phase-policy))` | `hsl(var(--phase-policy) / 0.5)` |
| Regulation | `--phase-regulation` | `hsl(var(--phase-regulation))` | `hsl(var(--phase-regulation) / 0.5)` |
| Research | `--phase-research` | `hsl(var(--phase-research))` | `hsl(var(--phase-research) / 0.5)` |
| Deadline | `--phase-deadline` | `hsl(var(--phase-deadline))` | `hsl(var(--phase-deadline) / 0.5)` |

Each phase color entry in `phaseColors` has three properties:
- `start`: Primary phase color (used for bar background, badge background, milestone icon color)
- `end`: End gradient color (currently set equal to `start` for all phases)
- `glow`: Semi-transparent version used for `box-shadow` glow effects

---

## Appendix B -- CSV Column Schema

| Index | Column | Type | Description | Example |
|-------|--------|------|-------------|---------|
| 0 | Country | string | Country name | "United States" |
| 1 | FlagCode | string | ISO country code for flag SVG | "us" |
| 2 | OrgName | string | Organization abbreviation | "NIST" |
| 3 | OrgFullName | string | Full organization name | "National Institute of Standards and Technology" |
| 4 | OrgLogoUrl | string | Logo URL (not rendered in Gantt; retained in data model) | "" |
| 5 | Type | EventType | "Phase" or "Milestone" | "Phase" |
| 6 | Category | Phase | Phase category (10 values) | "Migration" |
| 7 | StartYear | number | Start year (integer) | 2025 |
| 8 | EndYear | number | End year (integer) | 2030 |
| 9 | Title | string | Event title | "CNSA 2.0 Algorithm Migration" |
| 10 | Description | string | Event description (may contain commas, quoted) | "Full migration to PQC algorithms for national security systems" |
| 11 | SourceUrl | string | URL to source document | "https://example.gov/document.pdf" |
| 12 | SourceDate | string | Source publication date | "2024-09-01" |
| 13 | Status | string | Optional status field (used for comparison, not directly rendered from CSV) | "" |

### Special Parsing Rules

- **CNSA Lane**: Rows with `Country = "United States"` and `OrgName = "NSA"` are remapped to country name `"United States (CNSA)"` to create a separate Gantt lane.
- **Quoted Fields**: Title and Description fields may be quoted to handle embedded commas. The parser strips leading/trailing quotes.
- **Year Clamping**: Start years before 2025 are displayed as "<2024" in the Gantt chart header.

---

## Appendix C -- Region-Country Mapping

Defined in `REGION_COUNTRIES_MAP` in `src/data/personaConfig.ts`.

### Americas
- United States
- Canada

### EU
- European Union
- France
- Germany
- Italy
- Spain
- United Kingdom
- Czech Republic
- Israel
- United Arab Emirates
- Saudi Arabia
- Bahrain
- Jordan

### APAC
- Japan
- Singapore
- Australia
- South Korea
- Taiwan
- India
- China
- New Zealand
- Hong Kong
- Malaysia

### Global
- Global
- International
- G7
- NATO
- BIS
- GSMA

---

## Appendix D -- Wireframes

### D.1 Desktop Layout

```
+------------------------------------------------------------------+
|  [MainLayout Navigation Bar]                                      |
+------------------------------------------------------------------+
|                                                                    |
|            Global Migration Timeline  (.text-gradient)             |
|     Compare PQC migration roadmaps across nations...               |
|     Data Source: timeline_02282026.csv . Updated: 2/28/2026        |
|     [Sources] [Share] [Glossary]                                   |
|                                                                    |
+------------------------------------------------------------------+
| [Region v] [Country v] [Phase v] [Type v] Search: [...] [Deadlines] [Export] |
+------------------------------------------------------------------+
| [Active Filter Chips]  N results . M of T countries               |
+------------------------------------------------------------------+
| Country    | Organization |<2024| 2025 | 2026 | ... | 2035 |      |
|------------|-------------|------|------|------|-----|------|      |
| US Flag US | NIST        | ==Discovery== | ==Migration==> |      |
|            |             |  F Deadline   | ==Testing=====> |      |
| CA Flag CA | CCCS        |       | ==Policy==== |          |      |
| ...        | ...         |       |       |       |     |    |      |
+------------------------------------------------------------------+
|                                                                    |
| [Documents . Canada - 12 entries]           [Cards|Table]          |
| +--------+ +--------+ +--------+ +--------+                       |
| | Card 1 | | Card 2 | | Card 3 | | Card 4 |                       |
| +--------+ +--------+ +--------+ +--------+                       |
|                                                                    |
+------------------------------------------------------------------+
| Phase Color Code                                                   |
| [Discovery|Testing|POC|Migration|Standard|Guidance|Policy|Reg|Res|Dead] |
| F Milestones: Flag markers indicate key events...                  |
+------------------------------------------------------------------+
```

### D.2 Mobile Layout

```
+----------------------+
| [Nav]                |
+----------------------+
|                      |
| Global Migration     |
| Timeline             |
|                      |
| Filtered: EU (8)     |
|                      |
| +------------------+ |
| | FR Flag France   | |
| | ANSSI            | |
| |                  | |
| | [Migration    >] | |
| | 2025 - 2030      | |
| |                  | |
| |   o . . o o      | |
| +------------------+ |
|                      |
| +------------------+ |
| | DE Flag Germany  | |
| | BSI              | |
| | ...              | |
| +------------------+ |
|                      |
| Phase Color Code     |
| [...]                |
+----------------------+
```

### D.3 GanttDetailPopover

```
+--------------------------------------+
| [Phase Badge] Event Title [Status]   |
|--------------------------------------|
| Description text that explains the   |
| event in detail, wrapping as needed. |
|                                      |
| Start    End      Source    Date      |
| 2025     2030     [View]   2024-09   |
|                                      |
| [Ask about this]                     |
+--------------------------------------+
```

### D.4 TimelineDocumentDetailPopover

```
+--------------------------------------------------+
| [Phase] [Type] OrgName        [Ask] [X]          |
| Document Title (large, bold)                      |
|--------------------------------------------------|
| Description                                       |
| Full description text...                           |
|                                                    |
| Organization: NIST    Country: United States       |
| Phase: [Migration]    Type: Phase                  |
| Period: 2025 - 2030   Source Date: 2024-09-01      |
|                                                    |
| [View Source]                                      |
|                                                    |
| --- Document Analysis (if enriched) ---            |
| [Sparkles] AI-analyzed metadata dimensions...      |
+--------------------------------------------------+
```

---

*End of PRD-TIME-001 v1.0*
