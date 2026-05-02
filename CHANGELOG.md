# Changelog

<!-- markdownlint-disable MD024 -->

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added — Executive PQC Workshop (Workshop tab + Workshop Mode + Video Mode)

- **Workshop tab in the right panel** (`WorkshopPanel.tsx`) — sits next to Assistant /
  Journey / Bookmarks / FAQ. Idle view shows hero, "what to expect" bullets,
  live-validated prerequisites checklist, region picker (US / Canada / Australia),
  collapsible agenda with per-step page URL + activities + minutes, plus
  `Start Workshop` and `Record this workshop (video mode)` CTAs.
- **Workshop Mode (manual, hybrid navigation)** — pinned right panel, step header
  with `Step N / total · chapter · ~min`, body (why-it-matters, deep-link button,
  numbered try-it tasks, expected output, collapsible narration), footer
  `Back · Skip · Mark done · Next`. Auto-detects step completion against existing
  stores (assessment status, bookmarks, module progress).
- **Video Mode (auto-advance, recordable)** — RAF cue scheduler drives a per-step
  cue timeline. Overlays: lower-third caption (`CaptionBar`), SVG-mask spotlight
  (`Spotlight`), anchored callouts (`Callout`). Auto-hide control bar (`VideoControlBar`)
  with Prev / Pause / Restart / step-progress / Skip / Next / Exit. Pause clock
  freezes via `pausedAccumRef` so resumes pick up exactly where the timer stopped.
- **Manual cue stepper in Workshop Mode** (`WorkshopStepCard.tsx`) — when a step
  has `cues[]`, footer shows `[Prev hint] · Hint N/M · [Show next hint ›]`. Same
  cues fire as Video Mode, just driven by user clicks. Idempotent for caption/spotlight;
  click cues replay from start to keep state coherent. Backed by shared
  `useWorkshopOverlayStore`.
- **Persona-keyed flow registry** (`workshopRegistry.ts`) — flows match against
  `{role, proficiency, industry, region}` with most-specific-wins. Most-specific
  flow wins; unmatched contexts show a "planned" state. First flow ships:
  `executive × basics × Finance & Banking × {US|CA|AU}`.
- **Executive flow content** (`executiveFinance.ts`, 22 steps, ~92 min) —
  Welcome (5m) · Pre-flight (3m) · 8 Foundations (40m: Landing, Learn, Threats,
  Timeline, Library, Leaders, Assess, Report) · Region chapter 6 steps (20m:
  US/CA/AU CSWP-39 + Compliance + Timeline + Threats + Leaders + Library + Business) ·
  CSWP-39 4-step action (20m: Governance / Assets / Risk-Mgmt / Migration) · Close (4m).
  Region chapters cite real CSV records: ISM-1917 for AU, ITSM.40.001 phases for CA,
  CNSA 2.0 + PCI 12.3.3 for US.
- **Per-flow fixtures JSON** (`public/workshop-fixtures/executive-finance-amer-apac-v1.json`) —
  fields the Video Mode auto-fills into wizard inputs (assessment answers, RACI roles,
  KPI thresholds, pilot scope, etc.) so the recording demonstrates form-driven flows
  without human input.
- **Cue kinds** (`Workshop.ts`) — `navigate`, `caption`, `spotlight`, `callout`, `click`,
  `highlight-tab`, `select-tab`, `expand-section`, `collapse-section`, `scroll-to`,
  `fill-from-fixture`, `fill-literal`, `select-from-fixture`, `advance`. Authoring
  pattern: 3-7 cues per step on top of automatic step-entry navigation + caption.
- **Stable workshop selectors** — `data-workshop-target="<page>-<element>"` convention
  with `wt(id)` helper (`workshopTarget.ts`). Instrumented: Landing CTAs
  (`landing-cta-primary`/`-secondary`), Assess Quick mode (`assess-mode-quick`),
  Business Center zone tiles (`business-zone-{governance|assets|risk-management|...}`).
- **Reusable collapsible/tab targeting** (`CollapsibleSection.tsx`, `tabs.tsx`) —
  `<CollapsibleSection>` accepts an optional `targetId` prop; toggle button gets
  `data-workshop-target="section-<targetId>"`. `<TabsTrigger>` auto-derives
  `data-workshop-target="tab-<slug>"` from its `value` prop — every existing tab
  in the app is now workshop-targetable with zero per-callsite work. Cues use
  `expand-section` / `select-tab` against these slugs.
- **`/business?zone=…` deep-link** (`BusinessCenterView.tsx`) — fixed: now reads
  `?zone=` query param via `useSearchParams()` and activates the matching CSWP-39
  zone. Previously only `#zone-…` hash worked; cues that drive the four CSWP-39
  action steps now land on the correct zone deterministically.
- **Headless Playwright recorder** (`scripts/record-workshop.ts`) — launches
  Chromium 1920×1080, navigates to `?workshop=video&region=US|CA|AU&autoplay=1`,
  waits for the `workshop-finished` CustomEvent, saves a `.webm` to `dist-videos/`.
  Run via `npm run video:workshop -- --region=AU` or `--all`.
- **Caption export pipeline** (`scripts/finalize-video.ts`) — generates a sidecar
  `.vtt` (WebVTT subtitles) and a structured `.captions.json` (TTS-ready timeline)
  from the registry's narration. Optionally transcodes `.webm → .mp4` (h264) and
  soft-muxes the VTT as a `mov_text` subtitle track when ffmpeg is available.
- **URL auto-start** (`useWorkshopUrlAutostart.ts`) — Playwright recorder hook;
  reads `persona`, `proficiency`, `industry`, `region` from URL params, seeds the
  persona store, resolves the matching flow, calls `startVideo()`. Right panel
  auto-minimises in Video Mode so the camera captures the full main pane plus
  overlays.
- **Registry validator** (`scripts/validate-workshop.ts`, `npm run validate:workshop`) —
  asserts every step has a route + non-empty narration + non-empty tasks; cue
  timelines (when present) end with `'advance'` and total runtime is within ±10%
  of `estMinutes * 60_000`; flatten produces non-zero step lists per declared
  region.
- **17 unit tests** — `useWorkshopStore` (persist + migrate + rehydrate),
  `workshopRegistry` (resolve + flatten + nav helpers + CSWP-39 step count),
  `workshopDeepLink` (URL building + step matching).

### Changed

- **Persona/data alignment in workshop flow** — `industry` query param now uses
  the canonical CSV value `Financial Services / Banking` (not `FIN`); leaders
  steps use `?leader=<full-name>` deep-link instead of `?country=US&sector=Finance`
  since the leaders CSV stores country of residence (Sudha Iyer is `Ireland`,
  not `US`); `?sector=` only accepts `Public|Private|Academic` so finance-sector
  filtering uses `?cat=Industry+Adopter`.

### Added — Workshop Wave 1B: Left navigation + page instrumentation

- **`LeftNavTOC` shared component** (`src/components/common/LeftNavTOC.tsx`) —
  sticky left-rail TOC with grouped items, single-select active highlight,
  and `data-workshop-target="<targetPrefix>-<itemId>"` per entry. 6 unit
  tests cover grouping, empty state, active-item highlighting, click
  dispatch.
- **`/about` section instrumentation** — wraps each of 14 sections in an
  `<AboutSection slug="...">` helper that emits `id="about-<slug>"` +
  `data-workshop-target="section-<slug>"`. Workshop cues use `scroll-to`
  and `spotlight` to walk through Vision → Security Audit → Data Privacy.
- **`/threats` left rail** — sticky list of currently-filtered threats
  grouped by industry. Click syncs the URL (`?id=…`) and scrolls the
  matching card into view. ThreatCard now has `id="threat-<id>"` +
  `data-workshop-target="threats-card-<id>"` for cue targeting.
- **`/timeline` left rail** — country TOC alongside the SimpleGanttChart
  on desktop. Click selects the country filter and scrolls the matching
  Gantt row into view.
- **`/compliance` framework instrumentation** — each FrameworkCard now has
  `data-workshop-target="compliance-framework-<id>"`. Tabs already auto-emit
  `tab-<slug>` selectors via the earlier `tabs.tsx` patch, so workshop cues
  can `select-tab` then click a specific framework cleanly.
- **`/migrate` row instrumentation** — each SoftwareTable row has
  `data-workshop-target="migrate-product-<slug>"` + `id="migrate-row-<slug>"`
  HTML anchor for spotlight after `?vendor=Dell` filter applies.

### Added — Workshop Increment B + C: Cue timelines

- **AU region cue timelines** (6 steps) — exercise the new selectors:
  au-01 `/compliance` (select-tab + spotlight ASD ISM-1917), au-02 `/timeline`
  (Australia row), au-03 `/threats` (FIN-001 → 004 → 005 sequence), au-04
  `/leaders?leader=Rachel+Noble`, au-05 `/migrate` Dell BSAFE rows, au-06
  `/business?zone=risk-management`.
- **Foundations cue timelines** (8 steps F1–F8) — Landing CTAs, Q-Day → HNDL
  → FIPS 203/204 sequence, threats-toc clicks for FIN-001/004/005, timeline
  3-pattern framing, library FIPS bookmarks, leaders Citi+Santander, assess
  Quick mode click, report shareable URL framing.
- **`/about` walk-through step + close-recap cues** — `close-01-about`
  (3 min) walks through Vision → Security Audit → Data Privacy via the
  `section-<slug>` selectors. Total flow time updated 90 → 95 min.
- **Manual cue stepper in Workshop Mode** — already shipped earlier; this
  release adds CSWP-39 `a1-cswp-governance` cue timeline with spotlight,
  callout, and caption beats so the live workshop demonstrates the full
  governance zone.

### Added — Workshop Increment D: JSON-driven flows + manifest

- **`public/workshop/` folder** — date-stamped JSON flow files discoverable
  via a build-time manifest. Filename convention:
  `{role}-{proficiency}-{industry}-{regions}_{MMDDYYYY}.json`.
- **`generic-overview_05022026.json`** — 34-step PQC Today tour, ~5:40 at
  Normal speed (10 s/step). Walks every page used by any persona: Landing
  → persona picker → Learn (overview, foundation, role, workshop, quiz)
  → Timeline (overview, deadlines, rail) → Algorithms (catalogue, FIPS
  picks, Transition tab) → Migrate (catalogue, filters, detail) →
  Compliance (overview, tabs, region) → Threats (overview, rail, bookmarks)
  → Library (overview, bookmark) → Leaders (overview, filters) → About
  (page, mission, privacy, security audit, license/SBOM) → Community feed
  → Changelog → Close. Marked `isGenericFallback: true` for the resolver.
- **`executive-basics-finance-and-banking-amer-apac_05022026.json`** —
  migrated from the TS source via `scripts/migrate-executive-flow-to-json.ts`
  (private). 34 steps, 95 min, full cue timelines for Foundations, AU,
  and close.
- **`public/workshop/index.json` manifest** — auto-generated by
  `scripts/build-workshop-manifest.ts`. Per logical id, only the latest
  dated version is included. Generic fallbacks sort last for the
  Browse-all picker.
- **`workshopFlowLoader` service** (`src/services/workshopFlowLoader.ts`) —
  `loadManifest`, `loadFlow(file)`, `resolveFromManifest(manifest, ctx)`,
  `findEntry(manifest, id)`. Caches manifest + flows in module scope.
- **`useWorkshopManifest` hook** (`src/hooks/useWorkshopManifest.ts`) —
  loads manifest, resolves the matched entry, honors `flowOverrideId`
  (manual override from Browse-all), hydrates the flow JSON. Returns
  `{ manifest, isLoading, error, activeEntry, matchedEntry, activeFlow }`.
- **Step-level `when:` filter** — `WorkshopStep.when?: { industries?, regions? }`
  lets a single role-level flow JSON carry industry/region-conditional steps.
  `flattenFlow` filters steps whose `when:` clause does not include the
  active context. Steps without `when:` always pass.
- **`flowOverrideId` in `useWorkshopStore`** — when set, the panel uses
  the picked flow instead of the auto-matched one. Persisted; included
  in the v2 migration.
- **Speed picker** — fixed-duration presets (slow=20 s/step, normal=10 s/step,
  fast=5 s/step) instead of multipliers. RAF scheduler scales each cue's
  authored `tMs` proportionally into the target window. A 23-step flow at
  Normal completes in ~3:50.

### Added — Workshop Increment E: Interactive cues

The cue infrastructure now serves three uses simultaneously: (1) live
workshop walks (manual stepper), (2) recorded videos (Video Mode),
(3) E2E tests (Playwright recorder). Same `data-workshop-target`
selectors, same `useWorkshopOverlayStore.applyCue`.

- **`/learn` ModuleCard instrumentation** — `data-workshop-target="learn-module-<id>"`
  on each card. Workshop cues can now `click` into a specific module.
- **`/business` ArtifactCard instrumentation** — `data-workshop-target="business-artifact-<type>-create"`
  on each create CTA. Workshop cues can fire artifact-generation by type
  (policy, raci, standards-watch, etc.).
- **F2 Learn cue rewrite** — was caption-only; now scrolls, spotlights,
  and clicks into `exec-quantum-impact` module, then walks Learn → Workshop
  → Reference tabs with caption beats. Demonstrates module structure in
  8 minutes.
- **A1 CSWP-Governance cue rewrite** — keeps the zone-tile click, then
  fires three artifact-create cycles in sequence: Policy → RACI →
  Standards-Watch. Demonstrates artifact generation in 5 minutes.
- **Generic g-04-learn-workshop cue rewrite** — clicks into `pqc-101`
  module + select-tab Workshop, demonstrating the Workshop tab in 10 s.

### Fixed

- **`/threats` runtime crash** — null-guard for `threatDescription` in the
  TOC label builder. Some threat rows have null/undefined description;
  `.split(':')[0]` was crashing.
- **`isWorkshopPinning` export** — RightPanel.tsx imports it to suppress
  close button + Escape during running/paused modes (excluding video mode,
  which auto-minimises).
- **Video Mode panel auto-minimise** — restored `useRightPanelStore.getState().minimize()`
  call on Record click. The panel was staying open during Video Mode,
  blocking the camera view.
- **Video Mode controls visibility** — `VideoControlBar` now starts visible
  for 5 s on entry, then auto-hides after 3 s of inactivity (was hidden
  until first mousemove, which made users think the controls did not exist).
- **Collapsible workshop agenda restored** — was lost during the session-
  transcript recovery; now shows per-step page URL + try-it tasks again.

### Changed

- **Persona/data alignment in workshop flow** — `industry` query param now uses
  the canonical CSV value `Financial Services / Banking` (not `FIN`); leaders
  steps use `?leader=<full-name>` deep-link instead of `?country=US&sector=Finance`
  since the leaders CSV stores country of residence (Sudha Iyer is `Ireland`,
  not `US`); `?sector=` only accepts `Public|Private|Academic` so finance-sector
  filtering uses `?cat=Industry+Adopter`.

### Documentation

- **CLAUDE.md — Multi-Session Safety Rules** — new mandatory section under
  `Git Operations` forbidding `git reset --hard`, `git clean -f*`, `git checkout .`,
  `git stash drop|clear|pop`, `git push --force`, `rm -rf` on code dirs, and
  `git worktree remove --force` unless the user explicitly authorises by phrase.
  Added because a parallel Claude session running `git reset --hard && git clean -fd`
  for unrelated VPN/HSM cleanup destroyed in-progress workshop work; recovery
  required extracting `Write` tool calls from the session transcript at
  `~/.claude/projects/.../{session-id}.jsonl`. Now-mandatory rule prevents
  recurrence: WIP commits early, status-check + confirmation handshake before
  destructive ops, leave unfamiliar files alone (they may belong to another session).

## [3.5.63] - May 2, 2026

Playground UX audit Wave 2A/2B/2C: error UX hardening across workshop tools,
WasmModeIndicator in HSM Key Derivation, isStepComplete gating in all three
blockchain flows, and supporting UX additions (SSH hybrid KEX rationale, Source
Combining FilterDropdown, HD Wallet mnemonic panel, Solana tamper toggle,
Patents full-text search, 5G scenario intro strip, PKI Workshop artifact strip).

### Added

- **Patents — full-text search panel**: `PatentSearchPanel` component uses
  `minisearch` to index all patents by title, assignees, abstract, and PQC
  algorithms. Results appear as cards with algorithm badges and a direct link
  to the patent detail. Keyboard-accessible with `<Input>` and clear button.
  (`PatentSearchPanel.tsx`, `PatentsView.tsx`)

- **5G SUCI — scenario intro strip**: `ScenarioIntroStrip` component renders
  an attacker vs. subscriber perspective toggle (`role="group"`) above the SUCI
  flow, making the scenario context immediately visible without scrolling.
  (`ScenarioIntroStrip.tsx`, `SuciFlow.tsx`)

- **PKI Workshop — artifact summary strip**: `ArtifactSummaryStrip` at the top
  of the workshop surfaces all generated CSRs, CA keys, and certificates as icon
  chips, giving users a persistent view of what they've built across steps.
  (`PKIWorkshop/index.tsx`)

- **HD Wallet — BIP-39 mnemonic word grid**: After Step 0 completes,
  a 24-word mnemonic panel appears with per-word index numbers and a note
  that the final word encodes checksum bits. Conditional on `isStepComplete`.
  (`HDWalletFlow.tsx`)

- **HD Wallet — extractable-key security callout**: After Step 3 completes,
  an `AlertTriangle` callout explains that address derivation required extracting
  the private bytes from the HSM — and why production deployments avoid this.
  (`HDWalletFlow.tsx`)

- **Solana — tamper-signature toggle**: A WCAG-compliant custom checkbox
  (`role="checkbox"`, `aria-checked`, keyboard-navigable) lets users flip one
  signature byte before Step 9, producing a live `❌ INVALID` result to
  demonstrate that even a single-bit change breaks verification. (`SolanaFlow.tsx`)

- **SSH Sim — hybrid KEX rationale callout**: During and after the PQC phase,
  an inline `ShieldCheck` panel explains why `mlkem768x25519-sha256` combines
  X25519 with ML-KEM-768 and what "both algorithms must break" means in practice.
  (`SshSimulationPanel.tsx`)

- **SSH Sim — wire-packets view switcher**: Three-way toggle (list / diagram /
  compare) lets users see packet payloads as a flat list, a visual flow diagram,
  or a side-by-side classical vs. PQC comparison. (`SshSimulationPanel.tsx`)

- **SSH Sim — beginner PKCS#11 mode**: `pkcs11BeginnerMode` toggle (default on)
  hides raw CK handle numbers and replaces them with plain-English operation
  labels. Expert mode reveals all handle IDs. (`SshSimulationPanel.tsx`)

### Fixed

- **VPN Simulator — `translateCryptoError` + `<ErrorAlert>`**: All catch blocks
  in `VpnSimulationPanel.tsx` now route errors through `translateCryptoError()`.
  The top-level error display is upgraded from a bare `<p className="text-xs
text-status-error">` to `<ErrorAlert>` with `role="alert"`. SharedArrayBuffer
  unavailability surfaces as a named inline badge rather than a raw error string.
  (`VpnSimulationPanel.tsx`)

- **Source Combining — `translateCryptoError`**: PKCS#11 error strings from the
  HSM source-combining operations are now routed through `translateCryptoError()`
  before reaching the existing `<ErrorAlert>`. Combination-method selector
  upgraded from a raw `<select>` to `<FilterDropdown>`. (`SourceCombiningDemo.tsx`)

- **SSH Sim — `translateCryptoError` + `<ErrorAlert>`**: Raw error strings in
  the SSH handshake runner replaced with `translateCryptoError()` output;
  the phase-level error display upgraded to `<ErrorAlert>`. (`SshSimulationPanel.tsx`)

- **HSM Key Derivation — `WasmModeIndicator`**: `WasmModeIndicator` added
  beside `LiveHSMToggle` to surface WASM-simulation mode for the SP 800-108
  KDF demo, matching the pattern established in `TokenMigrationLab` and
  `FirmwareSigningMigrator`. (`HSMKeyDerivationDemo.tsx`)

- **Library — staleness badge excludes Expired/Superseded**: `DocumentCard`
  now suppresses the `· verify` staleness badge for documents whose
  `documentStatusBucket` is `Expired` or `Superseded` — they are already
  visually dimmed, so the badge was redundant. (`DocumentCard.tsx`)

### Changed

- **Bitcoin — `isStepComplete` step gating**: `gatedHandleNext` callback
  blocks advancement and surfaces an inline error if the user clicks Next
  before executing the current step. (`BitcoinFlow.tsx`)

- **Solana — `isStepComplete` step gating**: Same `gatedHandleNext` pattern
  as Bitcoin. (`SolanaFlow.tsx`)

- **HD Wallet — `isStepComplete` step gating**: Same `gatedHandleNext` pattern;
  Step 2 action label updated to `'Demonstrate Derivation'`. (`HDWalletFlow.tsx`)

### Internal

- `tsc --noEmit` clean; 2021 unit tests pass.

## [3.5.62] - May 1, 2026

Wave 3 UI audit completion: all P1, P2, and P3 items shipped. Learn module
workshop UX fixes for EntropyTestingDemo, SuciFlow, and MerkleTreeCerts.

### Added

- **OpenSSL Studio — persona cheat sheet strip**: When `developer` persona is
  active, a strip above the workbench shows 6 clickable command shortcuts
  (genpkey / req / x509 / dgst / kem / enc) that switch the active category.
  When `researcher` persona is active, the strip shows quick-jump links to
  ML-KEM, ML-DSA, TLS 1.3, PKCS#12, and X.509 specs in the Library and
  Algorithms pages. (`OpenSSLStudioView.tsx`)

- **Library — citation staleness badge**: Documents with `lastUpdateDate` older
  than 2 years that are still in Active or Draft status show a `· verify`
  warning next to the date in the card. Expired/Superseded/Withdrawn docs are
  excluded (already visually dimmed). (`DocumentCard.tsx`)

- **Assess — "Save link" CTA**: A "Save link" button (Link2 icon) in the wizard
  navigation bar copies `/assess?step=N` to the clipboard with a toast. Wizard
  answers are auto-persisted to localStorage, so the link resumes progress on
  the same device. (`AssessWizard.tsx`)

- **Algorithms — executive "Top 5" shortcut**: A "View Top 5 →" button appears
  in the executive persona hint strip. Clicking it highlights ML-KEM-768,
  ML-DSA-65, SLH-DSA-SHA2-128s, and Falcon-512 in the Detailed tab.
  (`AlgorithmsView.tsx`)

- **Timeline — search auto-scroll**: Each country's first `<tr>` in the Gantt
  gets an `id` attribute. When `filterText` changes and results exist, the first
  matching row scrolls into view with smooth behavior. (`SimpleGanttChart.tsx`)

- **About — deploy timestamp**: `__BUILD_TIMESTAMP__` (injected by Vite at build
  time) shown as a "Deployed: …" sub-line under the version in Release Notes.
  (`ReleaseNotesSection.tsx`)

- **Compliance — cert-records cross-link**: `FrameworkCard` footer now includes
  a "Certs →" chip for frameworks whose `bodyType === 'certification_body'`,
  linking to `/compliance?tab=records&q=<enforcementBody>`. (`ComplianceLandscape.tsx`)

- **Patents — "Explore Related" cross-links**: `PatentDetail` panel gains an
  "Explore Related" section with Algorithms and Library deep-links derived from
  `patent.pqcAlgorithms` and `patent.standardsReferenced`. (`PatentDetail.tsx`)

- **SuciFlow — SUPI input validation**: Live format guard enforces 15-digit
  MCC+MNC+MSIN. An inline error message appears below the field when the value
  is non-empty but not yet 15 digits. (`SuciFlow.tsx`)

- **SuciFlow — Perspective switcher in config panel**: `ScenarioViewSwitcher` now
  appears inline in the configuration panel under a "Perspective" heading, making
  the attacker vs. subscriber toggle discoverable without scrolling to the top.
  (`SuciFlow.tsx`)

- **SuciFlow — HSM/OpenSSL mode indicator**: A status badge below `LiveHSMToggle`
  shows whether the demo is running in PKCS#11/softhsmv3 mode (ShieldCheck,
  success color) or OpenSSL software mode (Shield, muted). (`SuciFlow.tsx`)

- **MerkleTreeCerts — two-stage reset confirmation**: Replaced browser `confirm()`
  with an inline confirmation row ("Reset all steps?" + Yes/Cancel buttons),
  eliminating the native dialog. (`MerkleWorkshopSteps.tsx`)

- **MerkleTreeCerts — step-dependency warning**: When the user navigates to Step 2
  or Step 3 without having built a tree in Step 1, an `AlertTriangle` banner
  prompts them to complete Step 1 first with a direct link. (`MerkleWorkshopSteps.tsx`)

- **MerkleTreeCerts — workshop completion card**: After completing all 5 steps a
  success card ("Workshop complete!") summarises what was covered and links back
  to the theory in the Learn module. (`MerkleWorkshopSteps.tsx`)

- **MerkleTreeCerts — step nav accessibility**: Step navigation buttons gain
  `title` and `aria-label` attributes. (`MerkleWorkshopSteps.tsx`)

- **Entropy Testing — paste-hex error state**: `pasteHexError` state tracks
  malformed paste input and surfaces an inline error message below the test
  results area. (`EntropyTestingDemo.tsx`)

- **Entropy Testing — mode-switch state preservation**: Changed from early-return
  per-mode render to CSS visibility (`block`/`hidden`) so collected samples and
  test results are preserved when switching between "Bit Flip" and "Paste Hex"
  modes without re-generating data. (`EntropyTestingDemo.tsx`)

- **QRNG Demo — live randomization**: Replaced static `QRNG_SAMPLE_64/128`
  constants with `generateSimulatedQrng(bytes)` using `crypto.getRandomValues()`.
  Each page load and sample-size change produces a fresh sample, making the
  entropy visualisation more instructive. (`QRNGDemo.tsx`)

- **Envelope Encryption — per-sub-operation progress labels**: `progressLabel`
  state shows the active sub-operation during execution ("Generating key pair…",
  "Wrapping DEK…", "Encapsulating shared secret…", etc.). Step wizard "Complete &
  Next" is gated on `executedSteps.has(currentStep)` so users must run each
  operation before advancing. Changing the algorithm resets `executedSteps`.
  Flow diagram and artifact table are collapsible panels (ChevronDown animation).
  (`EnvelopeEncryptionDemo.tsx`)

- **Cert Capacity Calculator — relative-size toggle**: A "Relative" toggle above
  the bar chart switches the Y-axis between absolute byte counts and percentages
  relative to the smallest algorithm (ECDSA P-256). An inline narrative below the
  chart describes the storage/bandwidth/CPU trade-offs in plain English using live
  computed values. (`CertCapacityCalculator.tsx`)

### Changed

- **Playground — "Crypto Workshop" → "Crypto Lab"**: Renamed across
  `PlaygroundWorkshop.tsx` and `MobilePlaygroundOps.tsx` to resolve terminology
  overlap with the PKI Learn module's "Workshop" tab.

- **Compliance — Leaders cross-links**: `LeaderDetailPopover` footer now links to
  `/timeline?country=<country>` and `/compliance?industry=…` for each leader.

- **Patents — executive default sort**: When `selectedPersona === 'executive'`
  and no explicit sort preference is stored, Patents defaults to `impactScore`
  descending. (`PatentsView.tsx`)

- **Learn Dashboard — "Path" terminology**: Filter sidebar and mobile drawer now
  show "Path" / "All Paths" (was "Track" / "All Tracks"). (`Dashboard.tsx`)

- **Timeline — persona hint strip**: Each persona sees a one-line context tip
  below the page header. (`TimelineView.tsx`)

- **Algorithms — persona hint strip**: Same pattern as Timeline, with an
  additional "View Top 5 →" shortcut for the executive persona.

### Internal

- `tsc --noEmit` clean; 2021 Vitest unit tests pass.

## [3.5.59] - May 1, 2026

### Added

- **Product catalog module mapping — 100% coverage**: All 743 products in
  `pqc_product_catalog_05012026_r2.csv` now have `learning_modules` values.
  Previously 204 products (27%) were unmapped. New `scripts/enrich-module-mappings-ollama.py`
  ran two passes: Pass 1 tagged 84 products with `slh-dsa` (keyword match on
  SLH-DSA/SPHINCS+/FIPS 205 in description); Pass 2 used `qwen3.6:27b` to
  assign 1–6 module IDs to each unmapped product.

- **`slh-dsa` module fully stocked**: Was EMPTY (0 products). Now has 92
  products — CRITICAL tier — covering libraries, HSMs, CLM tools, and
  blockchain implementations that explicitly support FIPS 205.

- **`scripts/generate-module-gap-report.py`**: One-shot analysis script that
  reads the product catalog and `moduleData.ts`, computes per-module product
  counts by category and infrastructure layer, assigns coverage tiers
  (CRITICAL/GOOD/SPARSE/GAP/EMPTY), and writes `tasks/module-gap-report.md`.

- **`crypto-mgmt-modernization` module cleanup**: Removed 17 misclassified
  products (storage arrays, MDM/endpoint, DLP, messaging apps) that Ollama
  incorrectly tagged as CPM tools. Module now contains 22 accurate entries:
  CLM tools, PKI software, crypto discovery platforms, and KMS.

### Fixed

- **`TEEHSMTrustedChannel.tsx` import syntax error**: `translateCryptoError`
  import was inserted inside another import block, breaking `tsc`. Moved to
  its own import statement.

- **Workshop WASM error messages**: Replaced raw PKCS#11 error codes and
  Emscripten stack traces with user-readable summaries across 8 workshop
  components (`TEEHSMTrustedChannel`, `HybridSignatures`, `SLHDSALiveDemo`,
  `LMSKeyGenDemo`, `FirmwareSigningMigrator`, `HybridCertFormats`,
  `TokenMigrationLab`, `LiveSshHandshakeRunner`) via new shared
  `translateCryptoError()` in `src/utils/cryptoErrorHint.ts`.

- **`cryptoErrorHints.ts` deprecated**: Inline PKI Workshop error-hint
  function consolidated into shared `src/utils/cryptoErrorHint.ts` which adds
  PKCS#11 v3.2 return-code patterns on top of the original OpenSSL patterns.

### Added (components)

- **`WasmModeIndicator`** (`src/components/shared/WasmModeIndicator.tsx`):
  New shared indicator banner that shows live vs simulation fallback state in
  workshop components. Wired into `TokenMigrationLab`, `FirmwareSigningMigrator`,
  `HSMKeyDerivationDemo`, and `SLHDSALiveDemo`.

- **Reset / Start Over buttons**: `HSMKeyDerivationDemo` (QKD module) and
  `SLHDSALiveDemo` gain a `RotateCcw` reset button to restart the demo flow
  without reloading the page.

### Internal

- `tsc --noEmit` clean; all 232 unit tests pass.

## [3.5.33] - May 1, 2026

Wave 1 UX/UI implementation: 8 P0/P1 plans executed covering persona access,
analytics instrumentation, filter UX, table virtualization, compliance tab
overflow, and shareable report URLs.

### Added

- **Developer persona unlocked for /business**: Developer persona can now
  access the Business Center; `KpiPersonaId` widened to include `developer`
  with weighted KPI scores across 10 metrics. `KpiPersonaSelector` gains a
  Code2 icon for the developer tab. (`personaConfig.ts`, `kpiCatalog.ts`)

- **Analytics: persona-labeled events + 4 new event types**: `personaLabel()`
  helper appends `|p=<persona>|x=<level>` to every module-lifecycle event.
  Added `logAchievementUnlocked`, `logBookmarkToggle`, `logEndorsementGiven`,
  `logQuizAnswer` — wired into achievement, bookmark, endorsement stores and
  the Quiz wizard. (`analytics.ts`, all four stores, `QuizWizard.tsx`)

- **FilterDrawer**: New `src/components/common/FilterDrawer.tsx` — universal
  slide-in filter panel. Used by `/migrate` to collapse secondary facets
  (vendor, verification, license, WIP, sort, restore-hidden) out of the
  toolbar, keeping the primary bar to Layer + Category + search + view toggle.

- **Table virtualization**: `/migrate` SoftwareTable and `/compliance` Cert
  Records table now use `@tanstack/react-virtual` for row virtualization
  (`max-h-[72vh]`, sticky `thead`). Eliminates layout jank on large datasets.
  (`SoftwareTable.tsx`, `ComplianceTable.tsx`)

- **Compliance tab overflow menu**: `MoreTabsMenu` component collapses
  Standardization Bodies, Certification Schemes, and CSWP.39 Framework into a
  "More ▾" overflow dropdown, leaving three primary tabs visible. Active
  secondary tab is promoted to the strip. (`MoreTabsMenu.tsx`, `ComplianceView.tsx`)

- **Shareable report URL token**: `/report?share=<base64url>` replaces the
  previous 12-param query string. `encodeShareToken`/`decodeShareToken`
  encode all assessment inputs into a compact JSON blob. `ReportView` decodes
  the token and shows a "Viewing a shared report" read-only banner.
  (`reportShareToken.ts`, `ReportContent.tsx`, `ReportView.tsx`)

- **Removed curious dead config**: `BC_ZONE_EMPHASIS_BY_PERSONA` pruned of its
  unreachable `curious` entry (curious is nav-blocked from /business).
  Type narrowed to `Partial<Record<PersonaId, BCZoneEmphasis>>`.

### Internal

- Added `@tanstack/react-virtual` dependency.
- Global vitest setup mocks `@tanstack/react-virtual` so table tests pass in
  jsdom (no layout engine). Updated `kpiCatalog.test.ts`, `ComplianceView.test.tsx`,
  and `ReportContent.test.tsx` to reflect new developer KPI access and compact
  share token format.
- All 2015 unit tests pass; `tsc --noEmit` clean.

## [3.5.32] - May 1, 2026

Routine dependency hygiene: 5 Dependabot updates landed in one batch after
local CI verification, plus a transitive override that closes the last
remaining moderate-severity vulnerability flagged by GitHub Security. No
runtime or visible behaviour changes.

### Security

- **`postcss` 8.5.6 → 8.5.13** (closes **GHSA-qx2v-qp2m-jg93** — XSS via
  unescaped `</style>` in CSS stringify output). Transitive dependency
  upgraded; no source code touches.

- **`uuid` pinned to ^14.0.0 via `overrides`** (closes **GHSA-w5hq-g745-h8pq**
  — missing buffer-bounds check in `v3`/`v5`/`v6` when a `buf` argument is
  provided). The advisory is theoretical for our usage —
  `vite-plugin-top-level-await` only calls `uuid.v5(seed, namespace)` without
  a `buf` argument — but the override eliminates the dependency-graph signal
  cleanly.

### Changed

- **`lucide-react` 0.577.0 → 1.14.0** (major). The 1.0 cut was an API
  stabilisation, not a breaking icon rename: all 746 icon imports across the
  app continue to resolve, and the icon SVGs render identically.

- **`@tailwindcss/vite` + `tailwindcss` 4.2.2 → 4.2.4** (patch). Bug fixes
  in the vite plugin and core engine; no Tailwind directive surface changes.

- **`@mlc-ai/web-llm` 0.2.81 → 0.2.83** (patch). PQC Assistant model loader.

- **`zustand` 5.0.11 → 5.0.12** (patch).

### Internal

- **Verified locally before push**: full vitest run (2014 / 2014), `tsc -b`,
  `npm run build`, and `npm audit` — all green at every stage of the bump
  sequence in an isolated worktree.

- **Eslint group bump (#175) not yet adopted** — `eslint v10` requires
  `eslint-plugin-jsx-a11y` to publish a release that peers on
  `eslint^10`; current `6.10.2` caps at `eslint^9`. Will pick up
  automatically on the next Dependabot retry once jsx-a11y ships.

## [3.5.31] - May 1, 2026

A second data-substrate sweep on the same day: vendor partnerships now have a
proper schema, SaaS-only products land in their own cross-reference family,
the assessment wizard knows which compliance frameworks and threats each
question maps to, the maturity corpus consolidates into a single canonical
file, and the trust-score tooltip honestly distinguishes verified attribution
from heuristic guesses.

### Added

- **Vendor partnerships table** — joint ventures and integration partnerships
  (Mastercard / Giesecke+Devrient / Thales, SK Telecom / Thales, Renesas /
  Veridify, etc.) are now first-class data: each multi-vendor product gets
  one row per partner in `vendor_partners_05012026.csv` (32 rows across 15
  products), with a "primary" / "partner" role. The catalog row points to
  the primary vendor's `VND-XXX`; the rest of the partnership lives in the
  partner table. 24 new partner vendors added (`VND-333` … `VND-356`)
  including Mastercard, Mozilla, Renesas, IBM Research, CISA, and more.

- **SaaS cross-reference family** — 11 SaaS-only products that have no CPE,
  pURL, or certification representation (AWS Certificate Manager, AnyDesk,
  BeyondTrust Pathfinder, Descope, Galileo, Hex Trust, Komainu, Metaco
  Harmonize, Stytch, etc.) now live in `migrate_saas_xref_05012026.csv` with
  a SaaS URL and a `deployment_model` (`managed-service`, `api-platform`,
  `hybrid-cloud`).

- **Assessment wizard FK columns** — `pqcassessment` gains explicit
  `compliance_id` and `threat_id` columns (semicolon-delimited multi-value)
  so the assessment can link to specific compliance frameworks (CNSA-2,
  FIPS-140-3, HIPAA, GDPR, PCI-DSS, ISO/SAE 21434, eIDAS 2.0, GSMA NG.116,
  etc.) and threat IDs (CROSS-001, AUTO-001, AERO-001, GOV-001, CRYPTO-001,
  IOT-001, ENERGY-001, etc.) per question. New validator checks **N12-B**
  and **N12-C** enforce both FKs.

### Changed

- **Maturity governance corpus consolidated** — the loader previously merged
  five files at runtime (`04232026`, `04242026`, `04302026`, plus two in the
  legacy `YYYYMMDD` format). Those five are merged at build time into one
  canonical `pqc_maturity_governance_requirements_05012026.csv` (1,332 rows /
  189 reference IDs after dedup), and the five sources are archived. Loader
  behaviour is unchanged; only the file layout is cleaner.

- **Assessment wizard content refresh** — all 83 rows now carry an explicit
  `compliance_deadline` and `compliance_notes` anchored on CNSA 2.0 (2025
  preferred / 2030 required / 2035 disallow), CISA Jan 2026 PQC categories,
  and ANSSI PG 083 v3 (Mar 2026, hybrid by 2026-2028, full PQC by 2030).
  Industry-specific use cases get sector deadlines (V2X / OTA aligned with
  ISO/SAE 21434, AVIONICS with RTCA DO-326A, SCADA with IEC 62443).

- **Trust-score cross-reference scoring distinguishes verified vs heuristic
  attribution** — `inferred` and `category-inferred` `trusted_source_xref`
  matches now count at half-weight, and the tooltip rationale explicitly
  reports the split (e.g. _"5 cross-reference(s) (3 verified, 2 heuristic)"_).
  Pure-heuristic attributions are flagged in plain text. Two new dimension
  tests cover the split.

- **Authoritative-source freshness sweep** — 21 auth_sources rows + 43
  trusted_sources rows last verified ≥90 days ago were HEAD-checked against
  their primary URLs. 54 came back live (`Last_Verified_Date` advanced to
  today); 10 returned 404, blocked, or timed out and were either left at
  their old date or marked `Pending` for manual review.

### Fixed

- **CHANGELOG version-number duplicates** — versions 3.5.19 through 3.5.27
  were each defined twice (April 25-26 set vs April 27-30 set). The April
  25-26 entries were superseded by the later releases; both
  `corpus-invariants.test.ts` and `generate-rag-corpus.test.ts` failed on
  the duplicate IDs. Removed the 10 superseded duplicate entries; both tests
  now pass.

- **Validator graph-consistency now recognizes vendor_partners** — `GC-1`
  and `GC-5` previously flagged partner-only vendors (Mozilla, Mastercard,
  IBM Research, etc.) as orphans because they had no direct catalog vendor_id.
  Both checks now count `vendor_partners` edges, so legitimate partner
  vendors no longer appear as orphans.

### Internal

- **Validator: 99 → 101 checks**, 87 → 90 passing, 0 errors. New: N12-B,
  N12-C. Cleared: GC-1, GC-5 partner-vendor false positives. RAG corpus
  regenerated (8511 → 8503 chunks, reflects the deduped CHANGELOG).

- **Test suite: 2010/2012 → 2014/2014** — both stale corpus tests now pass.

## [3.5.30] - May 1, 2026

This release closes a long backlog of cross-reference gaps in the data layer.
The Library now contains every standard, RFC, and policy that the rest of the
site already cited; the Migrate page knows the vendors behind 31 products it
previously labeled with bare names; and the trust-source attribution badges
catch up to the current data after a 32-day lag.

### Added

- **32 missing Library entries** — IEC 62443, IEEE 1609.2 Amendment, ISO/IEC
  18033-2, ISO/IEC NP 29192-8, CAB Forum SC-081v3, ENISA EUDI Wallet Security,
  FIPS 207 (HQC), Samsung-Thales ML-KEM eSE 2026, NSA CSfC PQC Guidance
  Addendum, Australia ASD PQC Guidance, China OSCCA / GB/T / YD/T standards,
  RFC 9142, RFC 9528, W3C WebAuthn Level 3, and 16 others. Compliance pages,
  Leaders bios, and Quiz questions that previously linked to nothing now resolve
  to real reference cards.

- **30 new vendor profiles** — Akamai, Fastly, Mozilla, Opera, Tailscale,
  ZeroTier, Netskope, OVHcloud, Rambus, Quantropi, QNu Labs, IronCore Labs,
  Versa Networks, Forward Networks, SimpleX, Spherity, SWIFT, ASUSTOR, ETAS,
  Dyber (Fraunhofer SIT), Internxt, Postfix Project, QANplatform, Session
  Technology Foundation, SignQuantum, PQSecure Technologies, TrustCloud,
  WinSCP, Applivery, Prestige Systems, backbone-hq. Migrate cards for 31
  products (Qrypt + 30) now have proper vendor attribution instead of the
  raw product name.

### Changed

- **Trusted-source cross-reference refreshed** — `trusted_source_xref` grew
  from 1281 to 1600 rows after a regen against the current Library and Migrate
  catalog. The 63 stale references it carried (35 to renamed Library entries,
  28 to renamed Migrate products) are gone.

- **`migrate_purl_xref` regenerated against the current product catalog** —
  every catalog entry is now represented (155 with detected package URLs,
  588 explicitly marked `not_found`). The previous file was 29 days behind.

- **`migrate_certification_xref` regenerated** — picked up 51 new
  product↔certificate links (754 → 805 rows) including the new vendor profiles.

- **Catalog vendor IDs normalized to `VND-XXX` format** — 31 catalog rows
  that previously stored raw vendor names ("Akamai", "Fastly", "Qrypt") now
  point to proper vendor codes. Vendor lookup, vendor counts, and the trust
  badges all see the same data.

### Fixed

- **Two corrupted Library archive files removed** — `OpenSSL-3x-Docs.html`
  was a 314-byte JavaScript redirect stub (not real content), and
  `ref-joseph-transitioning.pdf` was HTML mislabeled as a PDF. Both deleted;
  the OpenSSL Library card now points only to the live URL since the archive
  was unusable.

- **Trusted-source-xref test was rejecting legitimate cross-resource
  attributions** — the uniqueness check used `(resourceId, sourceId)` as the
  key, which incorrectly flagged `GSMA-NG116` and `ETSI-EN-303645` as
  duplicates because they appear under both `library` and `compliance`
  resource types attributed to the same source. Fixed to include
  `resourceType` so the same standard can legitimately be attributed in
  multiple contexts.

### Internal

- **Data integrity validator: 6 ERRORs → 0**, 86 → 87 checks passing. The
  remaining 2 warnings (1 sparse-enrichment quiz item, 1 enrichment metadata
  referencing a non-existent "Performance" page) are content-quality issues
  for a future enrichment pass, not structural defects.

- **CSV archive hygiene** — 21 obsolete CSV versions moved to
  `src/data/archive/` so each family now keeps only the two latest versions
  in `src/data/` (per CSVmaintenance.md), restoring the New/Updated badge
  diff window.

- **RAG corpus regenerated** — 8463 → 8511 chunks reflecting the merged
  Library and remapped Migrate catalog.

## [3.5.29] - April 30, 2026

The app gets a new logo, the top navigation no longer overflows on standard
laptop screens, and pages stop drifting sideways when wide content is on
screen. The Compliance page is also tidier on phones — filters wrap into
neat rows and overflowing strips show a soft fade so it's clear there's
more to scroll to.

### Added

- **Brand refresh across favicons, PWA icons, and social previews** — Browser
  tab favicon, the Apple "Add to Home Screen" tile, all PWA install icons
  (192/512/1024 px), and the social-share image (Twitter/Slack/LinkedIn
  previews) all use the new "PQC Today — For a Quantum Safe World" artwork.
  The favicon shows a glyph-only crop so it stays readable at 32 px; larger
  icons keep the full wordmark.

- **Android adaptive home-screen icons** — Two new "maskable" icons
  (`pwa-maskable-192.png`, `pwa-maskable-512.png`) let Android render the
  app's home-screen tile as a circle, squircle, or whatever shape your
  launcher uses, with the glyph centered in the safe area so the OS never
  crops the logo.

### Changed

- **Top navigation no longer scrolls horizontally on typical laptops** —
  Each nav item now stacks the icon over a small label (matching the
  existing mobile pattern) instead of icon-next-to-label. The row is
  noticeably narrower so all items fit on common 1440 / 1366 px viewports
  without horizontal scrolling. The active-state border, dividers, and
  touch targets are unchanged.

- **Compliance filter chips on mobile** — Organization, Industry, Region,
  and Deadline filters now collapse to half-width pairs on phones and
  expand to their natural width on tablets and up. Easier to tap and
  scan; nothing wraps awkwardly into a narrow column.

- **Compliance mobile tab strip and CSWP.39 framework matrix show a soft
  right-edge fade** — When the tab list (Bodies, Tech Stds, Cert Schemes,
  Frameworks, Records, CSWP.39) or the framework × maturity table extends
  past the screen edge, a subtle gradient hints there's more content to
  scroll to. Pure visual affordance — no behavior change.

### Fixed

- **Pages no longer drift sideways on phones** — The inner scroll wrapper
  was silently allowing horizontal scroll whenever any child (a wide chart,
  a table, a long code block) extended past the viewport, so the entire
  page could be swiped left/right past the header gutters. Locked the
  wrapper to vertical scrolling only; wide visualizations still scroll
  inside their own bordered containers as intended.

## [3.5.28] - April 30, 2026

The CSWP.39 governance dataset on the Compliance page now covers 1,332 requirements
from 189 source documents (up from 970 / 107). The Library page gained a CSWP.39
filter, and clicking any library card now shows the obligations extracted from
that source inline — with the original quote that justifies each one.

### Added

- **See every CSWP.39 requirement extracted from a library document, inline** —
  Open any library card and a new section lists each obligation grouped by the
  CSWP.39 pillar it serves (Governance, Inventory, Observability, Assurance,
  Lifecycle). Every entry shows its maturity tier, the requirement statement,
  the exact quote from the source document that supports it, and where in the
  document it appears. Library cards without extracted requirements simply
  don't show this section.

- **"CSWP.39" filter on the Library page** — A new toggle next to "My"
  narrows the grid to library documents that carry extracted CSWP.39
  governance obligations. The count next to it (e.g. "CSWP.39 (189)") tells
  you at a glance how broad the coverage is.

- **+362 new CSWP.39 governance obligations** drawn from 80 newly-analyzed
  source documents, including:
  - **Government & Policy** — NSA CNSA 2.0, DoD CIO post-quantum memo, OMB M-23-02,
    Executive Order 14306, the EU NIS Cooperation Group roadmap, ANSSI's PQC
    FAQ, UK NCSC migration timelines, GSA's PQC buyer's guide, and more.
  - **Migration playbooks** — UK NCSC migration timelines, IETF RFC 8555 (ACME),
    IETF RFC 9763 (multi-algorithm certificates), the Cloud Security Alliance
    practitioner's guide, and others.
  - **Protocols** — GSMA PQ.03 telecom guidelines, IETF RFC 8784 (PSK in IKEv2),
    ETSI hybrid key-exchange specs, and similar.
  - **Standards** — ITU-T X.509 (2019), NIST SP 800-131A Rev. 3, ETSI GS
    QKD 008, FIPS 198-1, and more.

### Changed

- **Compliance → CSWP.39 explorer headline** updates automatically: "1,332
  requirements from 189 sources" (was 970 / 107). The pillar × tier matrix
  and the "view requirements from this source" link from a library card both
  pick up the new content with no extra steps.

## [3.5.27] - April 30, 2026

A major Command Center upgrade: every zone is now wired, your assess answers and
"My X" selections flow through to artifact builders, the page copy adapts to
your persona, and artifacts gain an approval workflow + audit trail. Library
cards link to their CSWP.39 zone and the CBOM tool now overlays live CMVP
matches next to its illustrative cert numbers.

### Added

- **All six CSWP.39 zones now have data wires** — Management Tools (the last
  empty zone) shows a 4-tile dashboard: bookmarked products, playground tools,
  infrastructure layers covered, and FIPS-validated count. Mitigation surfaces
  bookmarked playground tools as candidate gateways. Risk Management surfaces
  bookmarked threats. The Command Center is no longer "wires + WIP zones" — it's
  fully populated.

- **Persona-aware Command Center copy** — The page title and tagline change to
  match your selected persona: Executive sees _"Crypto Risk — Board View"_,
  Architect sees _"Crypto Architecture — System View"_, Ops sees _"Migration &
  Mitigation — Run View"_, plus tailored copy for Developer, Researcher, and
  Curious personas.

- **"Suggested by your assessment" badges on missing artifacts** — Every zone's
  missing-artifact list now highlights the ones your assessment answers imply
  you need, with a hover reason like _"You reported current cryptography in the
  assessment"_ or _"Heavy vendor dependency"_. 26 rules cover 21 of 22 artifact
  types, including new rules for industry, country, and data sensitivity.

- **Artifact builders auto-fill from your assessment** — CBOM, Crypto
  Architecture, Risk Register, Migration Roadmap, and Compliance Timeline now
  open with relevant fields already populated based on your assessment answers
  (current crypto, country, data sensitivity, compliance frameworks, etc.) plus
  the NIST algorithm transitions catalog. A "Pre-filled from your assessment"
  banner appears at the top of the form with a "Clear all" button.

- **CBOM "From your assessment" mode** — A new fourth tab in the CBOM tool
  joins the algorithms you reported in the assessment with the NIST transitions
  catalog (deprecation dates, PQC replacements, FIPS standardization status).
  Auto-selected when assessment data is present.

- **Live CMVP / Common Criteria match badges on cert numbers** — When a
  cryptographic library or HSM in the CBOM tool matches a live record from the
  daily NIST CMVP scrape, a green _"live · NIST"_ badge appears next to the
  illustrative cert number. Click it to verify against the official validation
  page.

- **"Sample" badges + disclaimer banner on illustrative data** — Cert numbers
  and firmware revisions in the CBOM tool now carry a clear _"sample"_ badge
  plus a disclaimer banner so executives don't quote teaching data as live
  facts.

- **Approval workflow on artifacts** — Each saved artifact now has a status
  (draft → in-review → approved), an optional reviewer name, and an approval
  timestamp. Surface as a colored chip on artifact cards and as an interactive
  control in the artifact drawer footer. Foundation for compliance defensibility
  and team sign-off.

- **Artifact audit trail** — Each artifact now tracks an "updated" date and an
  append-only revision log. Edited artifacts show _"Updated …"_ and _"Revisions:
  N"_ chips on their cards.

- **§3 / §4 / §5 / §6 NIST CSWP.39 section nav** — A new collapsible accordion
  above the strategic plan groups Command Center zones under the four
  authoritative document sections (Crypto Agility for Protocols, System
  Implementations, Strategic Plan, Future Works incl. Maturity Assessment) so
  auditors can navigate by §-number.

- **§-reference hover popovers** — Hovering a §-ref chip on an artifact (e.g.
  _§5.4_) now opens a small popover with the parent section's title and
  one-paragraph summary. Educational layer over the citations.

- **"Learn this zone →" link in every Command Center zone header** — One click
  jumps to the matching step in the Crypto Management Modernization workshop on
  the Learn page.

- **Half-page / full-page toggle on every artifact builder** — A maximize/
  minimize button in the drawer header expands the builder to the full viewport
  and back. Each open starts at half-page; mobile is always full-width.

- **Glossary hover tooltips on jargon** — First occurrences of CRQC, CBOM,
  FIPS 140-3, and CMVP in the Command Center now expand on hover with the
  definition and a link to the broader glossary.

- **Action Items "why" chips** — Each top-5 next-step item now shows the
  reasons it ranked highly: _"Finance & Banking breach exposure"_, _"Heavy
  vendor dependency"_, _"Risk score 75 (high)"_, _"Executive persona —
  delegated execution"_. The reasoning was already computed; now it's
  visible.

- **"My X" selections from other pages now flow into Command Center** —
  Bookmarked frameworks (Compliance), products (Migrate), threats (Threats),
  Learn modules, timeline countries, and playground tools all surface in the
  appropriate Command Center zone. The Compact Learning Bar gains a
  "Quick resume" group; the Migration Roadmap auto-selects deadlines from your
  bookmarked countries.

- **Bidirectional "Add to My X" chips inside builders** — In the Compliance
  Timeline builder, each PQC-required framework gets a _"+ My Frameworks"_ chip
  that toggles your saved selection without leaving the builder. Same pattern
  for _"+ My Products"_ on Migration Roadmap gateway candidates.

- **Source provenance chips on tracked frameworks** — The Governance and Risk
  Management zones now show _"from /compliance"_ / _"from /assess"_ / _"both"_
  chips next to each tracked framework so you know where it came from.

- **Library cards show CSWP.39 zone link + maturity tier** — Library document
  tiles now expose a pillar-derived link to the relevant Command Center zone
  plus a maturity tier badge derived from the maturity governance dataset.

- **Quick assessment mode now covers all 5 CSWP.39 process steps** — The 6-step
  quick wizard expanded to 8 steps so it reaches "Identify Gaps" and
  "Prioritise" (previously unreachable in quick mode).

### Changed

- **CBOM and Vulnerability Watch artifacts re-classified to the Assets zone** —
  They were previously under Management Tools, but conceptually they're
  inventory of the crypto attack surface. Aligns with NIST CSWP.39 §5.2.

- **Mobile navigation order tweaked** — The "more" menu now uses an explicit
  order field so high-traffic items surface first on small screens.

- **About page** — Added Terms of Use and "Buy me a coffee" links alongside the
  existing GitHub and license references.

- **Changelog page** — Layout refresh and improved version navigation.

### Removed

- **Cyber Insurance Lens panel** — The expandable Cyber Insurance Lens at the
  bottom of `/business` was removed. The component itself remains in the
  codebase for use elsewhere; the panel just no longer surfaces in the
  Command Center.

### Internal

- New persisted store version (v14) with safe migrations for the audit trail
  and approval workflow fields. Existing artifacts keep their `createdAt` and
  default to `draft` approval status.
- Two new test files (`DocumentCard.test.tsx`, `cswp39ZoneData.test.ts`) and
  a new E2E spec (`library-cswp39.spec.ts`) covering the Library ↔ Command
  Center cross-walk.

## [3.5.26] - April 29, 2026

Fixed a production-only crash on the Command Center page.

### Fixed

- **Command Center page no longer crashes in production** — Chrome and Safari were failing to load the Command Center (`/business`) with a JavaScript error in production builds. Dev builds were unaffected. Resolved by reorganising how Business Center tools are loaded so they initialise in the correct order. All 21 tools still work; no behaviour changes for users.

## [3.5.25] - April 29, 2026

Added an FAQ tab to the right panel and turned on usage analytics for several pages.

### Added

- **FAQ tab in the right panel** — Joins Assistant, Journey, and Bookmarks. Click the help icon to browse frequently asked questions without leaving your current view.

- **Usage analytics for Explore, Report, and Business Tools** — Tile clicks, share-link opens, report views, and category filters now emit anonymous events so we can see which features get the most use and improve them.

### Changed

- **Analytics test coverage** — Tests now verify the nine new event helpers fire correctly and stay silent when analytics is disabled.

## [3.5.24] - April 29, 2026

The VPN Simulator is out of "work in progress" — ML-DSA-65 dual-auth IKEv2 with ML-KEM-768 key exchange now establishes successfully every time.

### Removed

- **VPN Simulator's "work in progress" banner** — Removed because the simulator now establishes ML-DSA-65 dual-auth handshakes reliably across all three modes (classical, hybrid, pure-PQC), validated by an end-to-end test matrix that passes in under 3 seconds.

## [3.5.23] - April 29, 2026

Added a "work in progress" banner to the Command Center.

### Added

- **Command Center work-in-progress notice** — A warning banner now appears below the Command Center header letting you know that zone panels, artifact tracking, and wire data are still under active development.

## [3.5.22] - April 29, 2026

CVE snapshots now record total counts so the UI can show "showing 20 of N" when results are capped.

### Changed

- **CVE snapshots now carry total counts** — Each per-product snapshot records the total number of CVEs reported by the source, even when only the top 20 are shown. Older snapshots without the field continue to load normally.

## [3.5.21] - April 29, 2026

Major Command Center expansion: the NIST CSWP.39 zones are now an interactive diagram with per-zone artifact tracking. Adds a daily CVE feed, shared PDF export, and a new architecture diagram.

### Added

- **CSWP.39 zone diagram in the Command Center** — The Command Center now renders the NIST CSWP.39 iterative loop (Governance → Assets / Management Tools / Risk Management → Mitigation / Migration) as an interactive diagram. Each zone shows how many of its artifacts you've created (e.g. "3 of 12 created"). Click a zone to scroll to its panel and see tools grouped by sub-element (Standards, Crypto Policies, Supply Chains, etc.).

- **Live data wires inside Command Center zones** — Each zone panel now surfaces live data — bookmarked products, milestone status, zone progress — without duplicating logic across components.

- **Daily CVE snapshot system** — A new daily snapshot of CVE data ships with the app and refreshes overnight via a scheduled workflow. Pages that need CVE counts share a cached fetch so the network call only happens once per session.

- **Shared markdown viewer** — A new shared component renders markdown consistently with safe links and uniform styling for components that display rich text content.

- **Shared PDF export utility** — Used by artifact exports across the Business Center and PKI Learning so PDF output stays consistent everywhere.

- **PKI Learning — crypto architecture diagram** — A new interactive visualisation of the crypto architecture layers aligned to CSWP.39, inside the Crypto Management Modernization module.

- **Updated product–CPE cross-references** — Refreshed the data linking software products to NVD CPE identifiers (snapshots dated April 28 and April 29).

### Changed

- **PKI Learning artifacts now sync to the Business Center** — Library CBOM Builder and Management Tools Audit exports save to the shared Business Center artifact store, alongside the other generators.

- **CSWP.39 zone definitions consolidated** — The PKI Learning Crypto Agility Process Diagram and the Command Center now share a single source of truth for the zone list, so they can never drift out of sync.

- **HSM Capacity Calculator — multi-location math corrected** — Previously, redundancy was applied once to the global count, which over-counted multi-location deployments. The calculator now sizes each location individually, applies redundancy per location, and totals up the fleet correctly.

### Fixed

- **VPN Simulator — diagnostic noise removed** — Internal debug logging that was forwarded into the simulator panel during development has been stripped from the WASM build (about 11 KB smaller).

- **VPN Simulator — dual-authentication tests rewritten** — The previous URL-driven test setup was incompatible with React 18 StrictMode and was replaced with an explicit-click flow that drives the UI directly. Three named tests now cover classical, hybrid, and pure-PQC modes with ML-DSA dual authentication.

## [3.5.20] - April 28, 2026

Major milestone: ML-DSA-65 dual-auth IKEv2 in the VPN Simulator now completes a full handshake end-to-end with real ML-KEM-768 key exchange, all running in the browser.

### Fixed

- **VPN Simulator — ML-DSA-65 dual-auth handshake completes successfully** — Both peers now sign and verify each other's IKE_AUTH payload using real PKCS#11 ML-DSA in the in-browser HSM, then derive the IKE shared secret with ML-KEM-768. Reaches the ESTABLISHED state in about 2.6 seconds in headless tests. Closes the work that was tracked as in-progress in 3.5.19. (A cosmetic post-establish issue causes the simulation to log a "DESTROYING" state after success — the IKE_SA itself reaches ESTABLISHED with full ML-DSA certificate authentication.)

## [3.5.19] - April 27, 2026

Major VPN Simulator milestone: full IKE_SA reaches ESTABLISHED with real ML-KEM-768 inside the browser. Also unifies the search service shared by ⌘K and the PQC Assistant, and adds a deep-link validator that ensures every link in the corpus actually works.

### Added

- **Unified search service shared by ⌘K and the PQC Assistant** — Both surfaces now share one search index, one entity index, and one cache, so they always return the same results and only load once per session. Direct queries like "deployment-playbook", "core invention patents", or "BIP-32" now resolve through the shared entity index everywhere.

- **Deep-link grammar validator** — A new build-time check ensures every deep link emitted by the search corpus actually points to a real destination. The build now fails if any chunk has a broken deep link (validated 8,184 chunks, zero violations).

- **Strict corpus invariants gate** — A new CI check ensures every data source listed in the corpus has matching labels, route handlers, and intent boosts. Replaces a hardcoded list that silently missed 8 sources.

- **⌘K parity for 8 missing sources** — Patents, vendors, governance maturity, CSWP.39, document enrichment, personas, tracks, and trusted sources now route to real destinations from the ⌘K palette. Previously they fell back to the home page.

- **Persona and intent boosts for 16 more sources** — The PQC Assistant now ranks results from module Q&A, governance maturity, vendors, patents, trusted sources, CSWP.39, and others, with persona-specific tuning for executives, architects, researchers, and ops.

- **FAQ button on every content page header** — A new FAQ icon joins Glossary in the page header action row and the mobile menu, surfacing the FAQ page from every content page.

### Changed

- **RAG corpus deep links — 0 missing (down from 722)** — Catalog enrichments (BTQ Bitcoin Quantum, Hitachi DoMobile, SEALSQ Quantum Shield, etc.) now navigate to their products on the Migrate page. Module content for two new modules (Crypto Management Modernization, SLH-DSA) now resolves correctly. Glossary terms without a related module (ECDH, IKE_SA_INIT, etc.) now fall back to the Learn page instead of having no link.

- **PQC Assistant deep-link grammar refreshed** — The assistant's system prompt documents the full deep-link grammar for every route, including the 17 business tool IDs, 13 assessment wizard steps, and all 14 patent filter parameters. The model now validates each `?param=` against the documented grammar before emitting a link.

- **Track and persona filters on the Learn page now work from URL** — Visiting `/learn?track=…` or `/learn?persona=…` preselects the track and persona dropdowns, so the assistant can deep-link mid-journey.

- **Workspace persistence — visited routes and advanced-views unlock** — Visited routes are now tracked across sessions, and the "advanced views unlocked" state persists to your cloud workspace so it survives across devices.

- **Persona voice refresh** — Executive, architect, and ops personas now reference the Command Center, HSM Workshop, and Deployment Playbook tools where relevant. The Curious Explorer voice gained a no-acronyms-without-expansion rule.

### Fixed

- **VPN Simulator — full IKE_SA reaches ESTABLISHED in the browser** — Both peer workers complete a real IKEv2 handshake with ML-KEM-768 key exchange and PSK authentication, all running inside WebAssembly. Required cross-worker packet routing fixes and addressing-byte-order corrections.

- **Service worker WASM cache staleness** — `openssl.wasm` (and other WASM files) were being served from a 30-day-stale cache that bypassed the precache, so production users got up-to-30-day-old binaries even after we deployed updates. Was the root cause of TLS simulation failing in production while dev worked fine. WASM requests now go through precache directly.

### Work in progress

- **VPN Simulator — ML-DSA cert-auth wiring (partial)** — Real ML-DSA-65 IKE_AUTH inside the browser is wired up: a PKCS#11 trace channel surfaces every operation in the simulator panel, certificate generation runs end-to-end via the in-worker HSM, and the strongSwan PKCS#11 plugin successfully finds and logs into the token. The remaining gap is that in dual+ML-DSA mode, the daemon still falls back to PSK because the cert-load path inside the plugin isn't yet triggered. Tracked for completion in 3.5.20.

## [3.5.18] - April 25, 2026

Updated GitHub organisation links throughout the app and swapped a brand icon that was removed in lucide-react v1.

### Fixed

- **GitHub organisation links updated** — All links throughout the app (source code, docs, discussions, consent flows) now point to the new `github.com/pqctoday-org/` organisation. Two renamed repos are also corrected. No user-visible content changed — only the destination URLs.

- **Icon compatibility** — Swapped the GitHub and LinkedIn brand icons (removed in lucide-react v1.0) for the standard external-link icon so the Leader consent, removal, transparency, disclaimer, and licence sections continue to render.

## [3.5.17] - April 25, 2026

Added 47 Common Evaluation Methodology requirements to the maturity governance corpus.

### Added

- **Common Evaluation Methodology requirements** — 47 new rows covering CC 2022 R1 governance, lifecycle, assurance, observability, and inventory requirements at maturity tiers 2 and 3.

### Changed

- **Search corpus and embed SDK refreshed** — Regenerated to incorporate the new CC-2022-CEM evidence rows. Search corpus output is now compact JSON (same data, smaller file).

## [3.5.16] - April 25, 2026

Resolved three soft-duplicate library entries with coordinated cite rewriting across library and compliance data.

### Changed

- **Library deduplication — Phase 2** — Three soft-duplicate libraries collapsed into their canonical entries, with all dependency and library-ref citations rewritten across both the library and compliance datasets. Library now stands at 528 rows. Reuses the immutable-fields guard introduced in v3.5.15 so identity columns are never modified during merge.

## [3.5.15] - April 25, 2026

Fixed a regression introduced in v3.5.14: the library dedup script was overwriting `reference_id` values, orphaning 20+ external citations.

### Fixed

- **Library dedup — `reference_id` corruption fix** — The previous dedup helper applied a generic "longer-wins" merge rule across all fields, including identity columns. For 5 of the 9 soft-drops in v3.5.14, the canonical row's `reference_id` was overwritten with the dropped one, orphaning 20+ external citations (most importantly the ANSSI PQC Position Paper, which has 20 cites in compliance and governance). Added an immutable-fields guard so identity columns are never modified during merge.

## [3.5.14] - April 25, 2026

Library catalog deduplicated: 543 → 531 rows.

### Changed

- **Library deduplicated — 543 → 531 rows** — Three hard reference-ID collisions collapsed into single rows; nine un-cited soft duplicates dropped. Each canonical row absorbed missing fields from its dropped twin; multi-value columns (dependencies, module IDs, applicable industries, region scope) were unioned. Verified zero remaining hard or title duplicates. Five medium-difficulty soft-dups requiring coordinated cross-CSV citation updates remain for a follow-up.

- **Library archive** — Older revisions moved to the archive directory; the loader auto-discovers the latest version.

## [3.5.13] - April 25, 2026

Added a freshness check on the CSWP.39 source data, expanded the maturity governance corpus with CC 2022 and NERC CIP rows, and raised the offline cache size limit so the full bundle precaches.

### Added

- **CSWP.39 source freshness check** — The CSWP.39 Explorer Overview now shows the source link, document version, last-verified date, and next-review date inline. A CI check fails if the next-review date passes, forcing manual re-verification of hub data against the upstream NIST publication. Re-verification cadence: 90 days.

- **Maturity governance corpus refresh** — Added 22 rows covering Common Criteria 2022 Parts 2 and 3 (key management, RBG, audit, lifecycle, configuration management at maturity tiers 2–3) and NERC Reliability Standards (CIP-002-8, CIP-003-11 governance and assurance requirements).

### Fixed

- **Offline cache size raised from 15 MB to 20 MB** — So the now-15.9 MB index bundle is fully precached on first install.

## [3.5.12] - April 25, 2026

Across-the-board mobile responsive fixes for PKI Learning, Patents, Playground, and embed views; iOS/Android safe-area insets; deep-link to specific changelog versions; and new data files for SLH-DSA Q&A and the governance corpus.

### Added

- **"Best on desktop" badge on Landing journey steps** — Compare Algorithms and Try the Playground steps now show a "Best on desktop" pill on mobile so users know to expect a richer experience on larger screens.

- **Changelog deep links** — Visiting `/changelog#v3.5.X` now smooth-scrolls to the matching release and briefly highlights it.

- **Search corpus enriched with cross-reference fields** — Each chunk now carries trusted source IDs, library dependencies and module IDs, threat-related modules, compliance library/timeline refs and countries, and migrate category, PQC support, learning modules, and vendor IDs.

- **35 new golden queries** — Round 7 covers Patents (assignee + landscape), CSWP.39 5-step process, governance maturity tiers, and the Curious Explorer persona.

- **New data files** — Library refreshes for April 24 and 25; combined and SLH-DSA Q&A; and the maturity governance corpus update.

- **iOS/Android native platform detection** — Embed mode now sets `data-platform="ios"` or `"android"` on the document root instead of a generic `"capacitor"` value, enabling platform-specific styling.

### Fixed

- **Mobile responsive layouts across the app** — Nine PKI Learning workshop views, Playground tools, Right Panel progress dashboard, share button, and trust score tooltip all switched from fixed two-column grids to responsive grids that collapse on narrow screens.

- **Patents page mobile layout** — On mobile, the patents list hides when a patent is selected so detail takes full width. Patent detail's metadata, cryptographic profile, and grid cards adapt to one column on the smallest screens.

- **iOS/Android safe-area insets** — Notch and Dynamic Island handling now applies to iOS specifically; Android also gets the safe-area padding rules. Overscroll bounce is disabled on both.

- **Narrow-viewport embed grids** — At widths below 480 px, embed grids collapse to a single column and constrained-width dropdowns expand to fit the viewport.

- **Compliance frameworks enrichment refreshed** — Updated maturity evidence entries for the compliance frameworks document.

## [3.5.11] - April 24, 2026

Removed unused Knowledge Graph module files left over from the v3.5.10 cleanup.

### Changed

- **Knowledge Graph orphan files removed** — All Knowledge Graph module and right-panel mindmap files have been deleted now that the feature has been retired. No remaining imports reference the removed code.

## [3.5.10] - April 24, 2026

Removed the Knowledge Graph tab from the right-side panel. Existing user state is migrated automatically.

### Changed

- **Knowledge Graph right-panel tab removed** — The graph tab no longer appears in the right-side slide-out drawer or in the More menu. Persisted state version was bumped with a migration so existing users with the graph tab selected are seamlessly redirected to the Assistant tab.

## [3.5.9] - April 24, 2026

New Patents landscape explorer with 202 PQC-relevant patents. New CSWP.39 Maturity Evidence Grid on the Compliance page. Refreshed library and compliance data, plus a new compliance and standards-bodies enrichment pipeline.

### Added

- **New Patents page — PQC patent landscape explorer** — Top-level `/patents` route with 202 PQC-relevant patents. Two tabs: Insights (donut charts for NIST round status, crypto-agility mode, region; assignee leaderboard; categorical breakdowns) and Explore (sortable table, search, multi-dimension filter chips, CSV export, side-by-side detail panel with claims, citation graph, and CPC code references). Click any chart segment or assignee to deep-link the Explore tab with a pre-applied filter.

- **CSWP.39 Maturity Evidence Grid on Compliance** — A new 4×5 (tier × pillar) evidence grid extends the CSWP.39 Explorer tab. Each cell shows a count of governance requirements; clicking it opens an evidence drawer with quotes, source URLs, and source-name filtering. Compliance framework cards now show a "N CSWP.39 reqs →" chip that deep-links into the grid pre-filtered to the relevant evidence reference. The Crypto Management Modernization workshop's current-tier indicator now links into the matching tier row in the grid.

- **3D infrastructure SVG generator** — A new script emits 93 SVG files covering nine infrastructure layers (Cloud, Network, Application Servers, Libraries & SDKs, Database, Hardware/Secure Elements, Operating System, Security Software, Security Stack), with an interactive overview HTML. Used to generate visual assets for the Migrate, Threats, and Library pages without external design tooling.

- **Compliance and standards-bodies enrichment pipeline** — A new shared helper factors HTML/PDF text extraction, Ollama prompting, and JSON normalization out of the per-source enrichment scripts. Output files for cert schemes, compliance frameworks, standards bodies, and tech standards (maturity entries plus skipped-source logs). The compiled CSWP.39 governance-requirements corpus lands in a new dataset.

- **Library and compliance data refresh (April 23–24)** — Versioned CSV revisions covering library and compliance datasets. Source-of-truth corrections plus new entries documented in audit notes; manual-download guide added for paywalled framework PDFs.

- **Search corpus and embed SDK refreshed** — Regenerated to include the new Patents page, the Maturity Evidence Grid governance requirements, and the data refresh.

### Fixed

- **Lint cleanup across new modules** — Replaced 23 raw button tags with the canonical Button component across the Patents page and Compliance maturity grid; lifted an inner table component to module scope to satisfy the static-components rule; refactored two cumulative-percentage loops to use immutable arrays. Net: 27 lint errors → 0.

## [3.5.8] - April 24, 2026

Command Center reorganised around the NIST CSWP.39 5-step process (Govern → Inventory → Identify Gaps → Prioritise → Implement) with maturity tier badges. Closes coverage of every CSWP.39 (December 2025) requirement bullet — 26 of 26 — through reuse of existing site resources and extensions to existing planning tools, with no new tools added.

### Added

- **CSWP.39 5-step Command Center** — Replaces the previous 7-pillar layout with a fixed 5-step stack (Govern, Inventory, Identify Gaps, Prioritise, Implement), three cross-cut strips (action items at top, cyber insurance side panel, learning bar at bottom), and a per-step maturity tier badge (Partial / Risk-Informed / Repeatable / Adaptive) computed deterministically from your existing artifacts. Each tier badge shows a tooltip listing the artifacts and section markers contributing to (or missing from) the current tier. Persona drives only which step expands by default and which artifacts surface first inside each card.

- **CSWP.39 educational coverage — 26 of 26 requirement bullets** — A Recommended Resources panel in every step card surfaces deep links into Migrate, Library, Threats, Compliance, Leaders, Algorithms, Assess, and Report; filtered authoritative external references; and a "Try it in the Playground" strip with relevant playground tools per step (entropy and DRBG demos on Inventory; TLS and VPN simulators on Identify Gaps; SLH-DSA, LMS/HSS, and firmware signing on Implement). Coverage shifted from 9 fully covered / 9 partial / 8 missing to 26 fully covered.

- **Existing builders extended with CSWP.39 sections** — Seven of the existing 17 business tools gained Markdown sections and small form fields so the educational extensions ride the same export pipeline: audit checklist (Exceptions and Evidence), supply chain matrix (auto-derived CycloneDX CBOM, pipeline sources, refresh cadence), roadmap builder (mitigation gateways with mandatory sunset dates), deployment playbook (decommission plan with 7 milestones), policy generator (KPI drift rules), vendor scorecard (observability tooling notes), and KPI dashboard (composite-scoring formula explainer and sensitivity multiplier).

- **Cross-surface CSWP.39 continuity** — Every Assess wizard step shows a CSWP.39 step badge that links back to the matching Command Center step. The Report page opens with a CSWP.39 nav legend that re-groups every report section under the corresponding step. The same 5-step narrative now spans Command Center, Assess, and Report without route changes.

### Changed

- **Tier 4 maturity gating** — Tier 4 now requires the corresponding CSWP.39 educational section to be present in the relevant tool's exported markdown. Each gating clause is reflected in the tier badge tooltip so users see exactly what's missing.

- **Compliance and Command Center share the same step card** — The CSWP.39 step card component now serves both the Compliance page (unchanged behaviour) and the Command Center (with tier badge, per-step artifact list, and resources panel).

## [3.5.7] - April 23, 2026

New CSWP.39 Framework tab on the Compliance page lets users explore the NIST CSWP.39 (December 2025) Crypto Agility Strategic Plan in-place — overview, interactive process diagram, 5-step process cards, 4-tier maturity model, and a framework cross-walk to compliance frameworks already catalogued elsewhere on the page.

### Added

- **CSWP.39 Framework tab on Compliance** — A sixth tab on the Compliance page covering the NIST CSWP.39 Crypto Agility Strategic Plan: an overview banner, an interactive process diagram with six clickable zones (Governance, Assets, Management Tools, Data-Centric Risk Management, Mitigation, Migration), 5-step process cards (Govern, Inventory, Identify Gaps, Prioritise, Implement) with plain-language explainers and aligned compliance frameworks, a 4-tier maturity model (Partial → Risk-Informed → Repeatable → Adaptive), and a cross-walk table mapping each step to the existing compliance framework records on the page. Each chip is clickable and jumps to the matching framework with a pre-filled search query.

## [3.5.6] - April 23, 2026

Realigned the Crypto Management Modernization module's maturity scale to NIST CSWP.39's 4-tier model and added a cross-walk between four industry frameworks.

### Added

- **PQC maturity model cross-walk** — A new section in the Crypto Management Modernization Introduction tab aligns four industry frameworks by readiness band: NIST CSWP.39 (4 tiers), Meta PQC Levels (5: PQ-Unaware → PQ-Enabled), CMMI (5 levels), and ENISA/NCCoE (5 stages). Workshop Step 1 also gains a compact cross-reference panel that maps the user's current average score to the equivalent Meta, CMMI, and ENISA stages.

- **Meta Engineering further reading** — A clickable card in the Introduction tab references the April 2026 paper "Post-Quantum Cryptography Migration at Meta: Framework, Lessons, and Takeaways", summarising the five-tier PQC maturity model, ML-KEM-768 / ML-DSA-65 algorithm rationale, hybrid deployment strategy, and hyperscale lessons.

- **Library enrichment for the Meta PQC migration paper** — Added 10 new dimensions covering implementation attack surface, cryptographic discovery, supply chain and vendor risk, deployment complexity, financial impact, and organizational readiness.

### Changed

- **Maturity scale realigned to NIST CSWP.39's 4 tiers** — Collapsed from 5 levels (Ad-hoc → Optimized) to 4 (Partial · Risk-Informed · Repeatable · Adaptive), mapping 1:1 to NIST CSWP.39 §6.5. Pillar indicators, workshop Step 1 (button row, radar chart, score display), and the Introduction maturity table all updated.

## [3.5.5] - April 23, 2026

Three CI fixes — type union completeness, exhaustive record coverage, and test expectations updated for revised HSM ops/sec defaults.

### Fixed

- **Quiz category type union completeness** — Persona learning paths referenced `crypto-mgmt-modernization` and `slh-dsa` quiz categories, but the type union didn't include them, causing build errors. Both now in the union.

- **Quiz category metadata exhaustiveness** — The category configuration record was missing entries for the two newly added categories. Label, description, and icon metadata now in place for both.

- **HSM Capacity Calculator test expectations** — Test expected values were out of sync with the revised ops/sec defaults from v3.5.4 (ML-DSA-65: 500 → 150 ops/s; ML-KEM-768: 3,000 → 500 ops/s). Updated all 11 tests with recalculated values.

## [3.5.4] - April 23, 2026

Fixed a Hybrid Signature workshop crash, corrected HSM ops/sec defaults to better match published vendor data, and routed ML-DSA hybrid signatures through the in-browser HSM where the standard mode applies.

### Fixed

- **Hybrid Signature workshop crash** — `ml_dsa65.sign(msg, secretKey)` was being called with arguments swapped, causing a length-mismatch error every time a user tried to sign with concatenation or nesting. Argument order corrected.

- **HSM ops/sec defaults corrected** — Reference profile numbers revised to match published vendor datasheets: RSA-2048 and ECDSA/ECDH P-256 corrected to 100,000 ops/s; ML-DSA-65 software fallback revised to 150 ops/s; ML-KEM-768 to 500 ops/s; AES-128/256 to 50,000 / 25,000 ops/s.

### Changed

- **Hybrid Signatures — ML-DSA backend split by construction** — Concatenation and nesting now route their ML-DSA-65 operations through the softhsmv3 in-browser HSM (using the standard PKCS#11 ML-DSA mechanism), while Silithium remains on the noble post-quantum library because its fused Fiat-Shamir protocol requires the external-μ mode of FIPS 204 §5.2, which has no PKCS#11 v3.2 equivalent. Each construction now displays a backend legend showing which primitive uses which library, with HSM status banner and PKCS#11 handle numbers visible.

## [3.5.3] - April 22, 2026

Three new workshop steps in the Crypto Management Modernization module that close the gap on CSWP.39 Identify Gaps → Prioritise → Implement, and a CSWP.39 process badge on every workshop step.

### Added

- **Three new workshop steps in Crypto Management Modernization** — Step 6 Management Tools Coverage Audit rates 6 CSWP.39 tool categories (Crypto Scanners, Vulnerability Management, Asset Management/SBOM, Log/SIEM, Zero-Trust Enforcement, Data Classification) on a 4-point scale and produces a gap heatmap. Step 7 Risk Analysis & Prioritisation Engine scores CBOM assets on FIPS, ESV, PQC readiness, posture, and end-of-life into a Critical/High/Medium/Low queue. Step 8 Implement — Mitigate or Migrate is a CSWP.39 §4.6 decision-tree wizard that produces either a MIGRATE recommendation (algorithm, timeline, CNSA 2.0 target) or a MITIGATE recommendation (crypto gateway spec with mandatory sunset date). Steps 7 and 8 consume the live CBOM from Step 3, falling back to sample data when not yet built.

- **CSWP.39 process badge on every workshop step** — Each step now shows which CSWP.39 process step it executes (e.g., "Govern · §5.1", "Inventory · §5.2", "Identify Gaps · §5.3").

## [3.5.2] - April 22, 2026

Realigned the Crypto Management Modernization module to NIST CSWP.39 (December 2025), framing it explicitly as the operational execution layer of the Crypto Agility Strategic Plan.

### Added

- **CSWP.39 process diagram on the Visual tab** — Interactive reproduction of CSWP.39 Figure 3 with six clickable zones (Governance, Assets, Management Tools, Data-Centric Risk Management, Mitigation, Migration). Each zone reveals what belongs there, which CPM pillar maps to it, and the CSWP.39 section reference.

- **Three new Learn tab sections** — "NIST CSWP.39 — The Crypto Agility Strategic Plan" describes the five-step Govern → Inventory → Identify Gaps → Prioritise → Implement loop. "The Management Tools Layer" maps six tool categories to CPM pillars and explains why this layer is needed to prevent stale data in the risk analysis engine. "CSWP.39 Crypto Agility Maturity Tiers" presents the 4-tier table with mapping to the existing 5-level CMM scale.

- **Maturity Self-Assessment CSWP.39 callout** — Workshop Step 1 now shows the corresponding CSWP.39 tier (Tier 1–4) below the recommended next milestone, derived from the average score.

- **Scenario 9 — "Crypto gateway or full migration"** — Exercises tab now has nine scenarios; Scenario 9 covers CSWP.39 §4.6 bump-in-the-wire decision framework (legacy PKI with unavailable source code, SHA-1 certs, mission-critical, team gone).

## [3.5.1] - April 22, 2026

New Threshold Signing step in the Stateful Signatures workshop — educational simulation of the Haystack/coalition threshold construction for hash-based signatures, with configurable t-of-n thresholds.

### Added

- **Threshold Signing — Step 5 in Stateful Signatures workshop** — Educational simulation of the Haystack/coalition threshold construction (Kelsey, Lang & Lucks) for hash-based signatures. User-configurable t-of-n threshold (n: 2–5, t: 1–n) over single-level LMS parameter sets. Four-phase interactive flow: Configure → Dealer Setup (simulated keypair, common reference value, trustee share distribution) → Threshold Signing (select ≥ t trustees to enable aggregation; "insufficient shares" error when below threshold) → Result (simulated signature with key reuse prevention comparison). Side panel shows common reference value size growth: LMS single-level (~2–500 MB depending on threshold), HSS 2-level (~1–20 GB), HSS 3+ levels (impractical), explaining why HSS hypertrees are excluded. Research attribution: Haystack paper, plus a note on lattice-based threshold alternatives (threshold Dilithium, FROST variants) for larger thresholds.

## [3.5.0] - April 22, 2026

Major release: a new Hybrid Signature Spectrums workshop demonstrating three hybrid signature constructions (concatenation, nesting, and Silithium fused Fiat-Shamir); SP 800-90B Entropy Source Validation status now tracked on libraries and HSMs; six new posture KPIs; and a complete cross-check remediation of the Crypto Management Modernization module to v1.1.0 with five corrected CMVP cert numbers and two new content sections.

### Added

- **Hybrid Signature Spectrums workshop** — Live side-by-side demonstration of the three hybrid signature constructions from the IETF hybrid signature spectrums draft. Concatenation simply pairs two independent signatures (most backwards-compatible). Nesting wraps the inner signature in the outer (Weak Non-Separability). Silithium uses a shared challenge so neither component verifies without the shared component, achieving Strong Non-Separability per ePrint 2025/2059 and resulting in smaller signatures than concatenation. All three constructions perform live key generation and signing in-browser. Accessible from the Playground (PT-027) and the Hybrid Crypto learn module.

- **Entropy Source Validation status on libraries and HSMs** — Crypto libraries and HSMs now carry an `esvStatus` field tracking SP 800-90B Entropy Source Validation status (active, historical, revoked, in-MIP, not validated) independently of the FIPS 140-3 certificate. Surfaces in the Library & Hardware CBOM Builder workshop.

- **Six new posture KPIs** — Governance: policy enforcement rate (% endpoints with auto-verified cipher-suite config), governance attestation coverage (% decision owners completing annual attestation). Observability: cipher-scan coverage, standards-watch lag (days from deprecation notice to CBOM rule update). Assurance: ESV coverage for libraries and ESV coverage for HSMs.

- **Crypto Management Modernization Q&A coverage** — A new Q&A CSV closes the gap where every peer module had quiz coverage but this one had none. Twenty Q&A pairs grounded in library entries, CBOM pillars, the 47-day TLS cadence, FIPS 140-3 IG September 2025 PQC update, CNSA 2.0 deadlines, OMB M-23-02, and SP 800-90B ESV.

### Changed

- **Crypto Management Modernization → v1.1.0 — cross-check remediation** — Five wrong CMVP cert numbers replaced with verified NIST CMVP values (Thales Luna G7 #4962, BoringCrypto #5244, Bouncy Castle FIPS Java #4943, plus corrections to Entrust nShield, YubiHSM 2, AWS CloudHSM, and GCP Cloud HSM entries). WolfCrypt FIPS posture downgraded to amber (PQC APIs available but not inside FIPS boundary per CMVP #4718). Two new content sections added: an entropy compliance section explaining the SP 800-90B ESV track as a common PQC migration gap, and a protocol deprecation section documenting the standards-watch subscription model. Library tags, RFC 8555 (ACME) entry, and unattributed-claim source citations all added.

- **HSM Capacity Calculator — multi-location support** — Per-location HA computation, fleet total now respects the number of locations, and ML-KEM-768 added as a distinct algorithm in the load distribution.

## [3.4.0] - April 22, 2026

Major release: SP 800-227 hybrid KEM coverage expanded from name-drop to spec-faithful teaching across the Hybrid Crypto module; new Cryptographic Management Modernization learn module (LM-052) — a 55-minute, 5-step executive-track module covering posture management; first WASM charon validation exports proving the ML-DSA + ML-KEM source patches are live; VPN Simulator gap-closure phase 1 (algorithm benchmark matrix, config-bundle export, IndexedDB session history, sandbox launch contract); and a major library refresh adding 26 authoritative references plus 13 newly tagged rows.

### Added

- **New learn module: Cryptographic Management Modernization** — A 55-minute, 5-step executive-track module covering modern cryptographic posture management across certificates, libraries, software, and keys. Six Learn sections frame posture management as a continuous dual-loop program (strategic annual loop wrapping an operational Discover → Classify → Score → Remediate → Attest → Reassess loop). Five workshop tools: a CPM Maturity Self-Assessment with radar chart, an Inventory Lifecycle Simulator with canonical scenarios (shadow-cert discovery, the 47-day TLS cadence, intermediate-CA rotation, OCSP drift), a Library & Hardware CBOM Builder, a No-Regret ROI Builder (IRR under quantum-happens / never-happens scenarios with 5 benefit streams), and a Posture KPI Dashboard Designer. Eight exercises, glossary-aware content, and bidirectional cross-links to the crypto-agility, PQC governance, PQC business case, and KMS modules.

- **WASM charon validation exports (Phase 3a)** — The strongSwan WASM binary now exports three real library-level validators that prove the ML-DSA and ML-KEM source patches are live, not just present in source: a proposal validator (parses an IKEv2 proposal string through charon's own parser and reports whether any ML-KEM transform was accepted), a certificate validator (loads a PEM cert and reports the recognized key type, including ML-DSA), and a key-exchange enumerator (lists the numeric transform IDs charon recognizes for ML-KEM and classical groups). Wired into the VPN Simulator as a new "Validate WASM charon" panel in the Raw Config tab.

- **VPN Simulator gap-closure (phase 1 of 6)** — Four new capabilities: a "Run algorithm matrix" button that runs keygen and self-sign for RSA-3072 and ML-DSA-{44,65,87} against the live HSM and renders a timings/cert-size/pubkey-size table; a "Download config bundle" button that packages strongswan.conf, ipsec.conf for both peers, plus PSK or generated PEM certs into a zip; a "Save session" + "History" flow backed by IndexedDB that persists the user's configuration (mode, auth, MTU, fragmentation, configs, PSK, cert PEMs and key handles) for the 20 most recent sessions; and a "Launch full-fidelity sandbox" button that calls the orchestrator API to spin up a real Docker scenario.

- **SP 800-227 coverage expanded — Hybrid Crypto module** — Spec-faithful teaching across four topic areas: a parameter-set selection table (ML-KEM-512 → Category 1 / IoT, ML-KEM-768 → Category 3 / default TLS, ML-KEM-1024 → Category 5 / CNSA 2.0); a combiner construction deep-dive (concatenation order, HKDF vs KMAC, dual-PRF assumption, mandatory domain separation per SP 800-227); a new "Implementation Requirements" section covering implicit rejection, constant-time decapsulation for FIPS validation, approved DRBG, and side-channel hardening on both halves; and transition framing surfacing the SP 800-227 §1 "interim measure" language.

- **Google Quantum AI whitepaper added to library** — "Securing Elliptic Curve Cryptocurrencies against Quantum Vulnerabilities" (Babbush, Gidney et al., March 30 2026) now in the library with module links to Quantum Threats, Blockchain PQC, and Standards Bodies.

- **secp256k1 added to Quantum Threats workshop** — Bitcoin/Ethereum's curve now appears in the Algorithm Vulnerability Matrix and Security Level Degradation tool with the verified estimate of ≤1,200 logical qubits and ≤90M Toffoli gates via Shor's algorithm.

- **ECC qubit estimates revised** — ECDSA P-256, X25519, and Ed25519 updated from ~2,330 to ~1,200 logical qubits, reflecting improved Shor's circuit efficiency for all 256-bit prime-order elliptic curves.

- **Fast-clock vs slow-clock CRQC distinction** — HNDL/HNFL calculators now explain that fast-clock CRQCs (superconducting, photonic) enable live mempool "on-spend" attacks while slow-clock types are the at-rest / harvest-now-decrypt-later threat.

- **Guided exercise — "ECC Blockchain Under Quantum Attack"** — On-spend attack scenario: Bitcoin transaction in the mempool, fast-clock CRQC at 1,200 qubits, and why blockchain infrastructure needs PQC migration now.

- **Calculator math disclosures** — All three Cert Capacity Calculator charts now have collapsible "How this is calculated" sections with formula, assumptions, and benchmark sources. Each TPS slider in the HSM Capacity Calculator has a "How we estimated this" toggle.

- **Library refresh — 26 new authoritative references plus 13 newly tagged rows** — Covers CA/B Forum Ballot SC-081v3 (47-day TLS cadence by March 2029), NIST CMVP Validated Modules and Modules-In-Process databases, NIST ACVP, FIPS 140-3 IG September 2025 PQC update, Microsoft "Building your cryptographic inventory", EJBCA and Keyfactor posture management primers, Gartner CryptoCOE framing, IBM Research CBOM, Deloitte Tech Trends 2025, McKinsey PQC preparation, IBM IBV 2025 quantum-safe readiness, Sectigo State of Crypto Agility, Ponemon/Entrust Global PKI Trends 2026, Forrester TEI of TLS/SSL certificate-lifecycle automation (DigiCert-commissioned, 312% ROI), AppViewX 47-day lifecycles, DigiCert PQC Maturity Model, Engineering at Meta PQC migration framework, IETF RFC 7030 (EST), RFC 4210 (CMP), Security Boulevard / Forrester (Sandy Carielli) on crypto agility, and the Venafi/Ponemon cert-outage cost study.

### Changed

- **Cert Capacity Calculator — bandwidth model corrected** — TLS payload now includes both `Certificate` and `CertificateVerify`; prior model used an incorrect RSA-2048 delta baseline.

- **Cert Capacity defaults — AVX2 cycle-accurate benchmarks** — RSA, ECDSA, and ML-DSA figures updated from rough estimates to cycle counts from CRYSTALS-Dilithium Round 3 and OpenSSL 3.x AVX2 measurements.

- **Certificate Lifecycle tools moved to PKI Workshop** — ACME PQC Walkthrough and Cert Capacity Calculator removed from the Migrate page; now in the learn module where they belong.

- **VPN Simulator marked work-in-progress** — WIP badge shown while strongSwan IKEv2 + ML-DSA AUTH method integration is pending.

- **VPN Simulator — ML-DSA private keys discoverable by PKCS#11 plugin** — `CKA_ID` is now set to SHA-1 of the public key on both public and private ML-DSA key objects immediately after generation, matching the RFC 5280 SubjectKeyIdentifier method expected by strongSwan's PKCS#11 plugin.

- **VPN Simulator — IPsec config hardened for tunnel mode** — Initiator and responder configs now include left/right subnets and explicit tunnel type so the SA is negotiated as a proper tunnel rather than a transport-mode connection.

- **VPN Simulator — cert auth uses `leftcert=` for all algorithm types** — Removed the ML-DSA-specific `leftsigkey=%smartcard` path; the PKCS#11 plugin now discovers the private key via `CKA_ID` matching regardless of algorithm.

- **Hybrid Crypto module — Composite Signatures section removed** — The section described an IETF draft whose OIDs are not yet finalized; removed to avoid teaching unstable identifiers. Will be reintroduced when the RFC is published.

- **Role guide — self-assessment checklist removed** — The interactive exposure-score checklist was removed from the Role Guide "Why It Matters" view to streamline the module and reduce scope overlap with the dedicated Assessment page.

- **Library CSV refresh** — Replaces the prior snapshot. Intentionally drops 9 reference rows that were audited out. Six older versions archived per the 2-version retention rule.

### Fixed

- **Quiz answer buttons no longer truncate long options** — Option buttons wrap text properly instead of clipping multi-line answers.

- **HSM key inspection was silently broken for VPN simulation keys** — Clicking the eye icon on any key generated by the VPN Simulator did nothing. Two issues: in Rust engine mode the cross-check module was null and the routing returned early; responder keys were also being queried against the initiator session handle. Both fixed.

- **Charon diagnostic lines no longer misclassified as errors** — strongSwan routes all charon output to stderr; lines matching thread prefix patterns like `00[IKE]` or `00[CFG]` are now correctly routed as informational.

- **Hybrid Cert Inspector panel no longer overflows on narrow screens** — The certificate selector and IETF reference buttons now truncate long OID strings instead of breaking the grid layout.

- **ML-KEM-512 corrected to NIST Level 1** — Per FIPS 203, ML-KEM-512 targets Category 1 (≈AES-128 strength), not Level 2. Corrected in the TLS panels and exercises table.

- **VPN sim RSA certs now carry SubjectKeyIdentifier extension** — The RSA path now embeds the SKID extension matching the `CKA_ID` set on the key objects, so strongSwan's PKCS#11 plugin can discover the private key. Without this, ML-DSA worked but RSA fell back to PSK auth.

- **VPN sim ML-DSA cert auth fully wired end-to-end** — ML-DSA key generation now accepts an optional key ID that's stamped as `CKA_ID` on both public and private key objects at keygen time. The simulator generates a random 20-byte key ID per key pair and uses the same bytes in both keygen and the X.509 SubjectKeyIdentifier extension. ML-DSA cert auth no longer falls back to PSK.

- **Mobile / iOS Safari polish** — Glass panels now render the blur effect on Safari (added the WebKit prefix); button icons no longer trigger iOS double-tap zoom; long code blocks no longer dominate small screens; mobile bottom nav respects the iPhone home-bar safe area; Timeline, Algorithms, Compliance, and Playground get shorter mobile-nav labels.

## [3.3.9] - April 20, 2026

Major release. Highlights: a critical Learn page crash fixed for all visitors; an experimental WASM strongSwan v2 build with in-browser ML-DSA + ML-KEM selftest and cross-Worker handshake; a new HSM Capacity Calculator covering the top 10 enterprise HSM workflows; a Command Center overhaul including in-drawer artifact creation and a redesigned ROI Calculator; a complete compliance ↔ timeline consistency pipeline; a 5G SUCI playground UX overhaul with plain-English mode; the Right Panel migrated from a bottom drawer to a right sidebar; comprehensive PKI / TPM / TLS workshop additions; updated NIST CMVP scraper covering all security levels; and Implementation Attacks + KAT Validation tabs in the Detailed Comparison view.

### Fixed

- **Learn page crash on first visit** — Navigating to `/learn` showed "Something went wrong" on Chrome and Safari. The glossary tooltip system was loading data asynchronously, which conflicted with WebAssembly module loading on learn-module pages. Glossary data is now loaded synchronously at startup; tooltips appear immediately with no loading delay.

- **Compliance facets (Org / Industry / Region) derived from full dataset** — Filter dropdowns previously rebuilt from the active body-type tab's slice, so populated facets disappeared when switching tabs (Africa would vanish from Standards while remaining present on All Frameworks). All three facets now derive from the full dataset, and the Industry list is unioned across all framework records so new industries appear automatically.

- **VPN Simulator — daemon-default cert algorithm switched to RSA** — The default client signing algorithm changed from ML-DSA to RSA so the strongSwan WASM daemon handshake works out of the box on first visit. Users can still switch to ML-DSA to generate real PQC cert artifacts; a mode-aware warning explains that the daemon itself doesn't yet run on ML-DSA certs (strongSwan core lacks the IKEv2 ML-DSA AUTH method draft).

- **VPN Simulator — visual SKF payload fragmentation slicing** — KE payloads now visually slice into IKE_INTERMEDIATE fragments per the configured fragment-size budget so learners can see fragmentation behaviour, rather than just an aggregate total.

- **VPN Simulator — ML-DSA raw pubkey configuration respected** — ML-DSA signature generation was ignoring the raw-pubkey setting; now honours the configured key format end-to-end.

- **VPN Simulator — WASM OOM and thread-pool exhaustion** — Long IKE runs were saturating the WASM thread pool and tripping out-of-memory errors when users re-ran scenarios. Lifecycle and pool reuse tightened so the simulator stays stable across repeated runs.

- **What's New modal — View Changelog deep link** — The link previously used the first unseen changelog section's version, which resolved to `Unreleased` and produced an invalid anchor. Now uses the current version so the link always targets a released section.

- **Bouncy Castle FIPS 140-3 cert #4943 security level corrected** — Was incorrectly inherited from the old NIST scraper filter; now correctly L1.

### Added

- **Experimental WASM strongSwan v2 — selftest + cross-Worker KEM handshake** — A new 11.7 MB build alongside the existing baseline, gated behind an environment flag. Two actions: a "Run ML-DSA + ML-KEM selftest" that round-trips through the in-browser HSM (ML-DSA-65 keygen → sign → verify, plus ML-KEM-768 encap/decap loopback per FIPS 203/204), and a "Cross-Worker KEM handshake" where the main thread plays Alice and a Web Worker plays Bob with independent WASM instances and independent HSM state. Both sides derive a 32-byte shared secret that must match byte-for-byte. Lays the groundwork for a future full IKE_SA_INIT + IKE_AUTH wire-format exchange.

- **HSM Capacity Calculator** — A new fleet-sizing tool covering the top 10 enterprise HSM workflows (TLS, code signing, payment HSM, TDE/database, KMS root keys, VPN/IPsec, SSH host, DNSSEC, etc.) with side-by-side classical (RSA-3072 / ECDSA P-256) vs PQC (ML-DSA-44/65/87) sizing. Outputs storage MB, TLS cert bandwidth, aggregate network MB/s, and CPU-core utilisation per workflow plus a totals row. Surfaced as Step 5 of the HSM-PQC learning module.

- **PKI Workshop — Certificate Capacity Calculator overhaul** — Bandwidth column converted from per-cert KB to aggregate MB/s; CPU column converted from "max sign ops/sec" to "% of single core consumed" so numbers map cleanly to capacity-planning conversations. CSV export now includes the new bandwidth and CPU columns.

- **Command Center — in-drawer artifact creation with builder adapters** — Empty placeholders now launch the matching builder directly inside the drawer, with no navigation away from the Command Center. New standalone adapters wrap the full-page learning-module builders (Risk Register, Risk Heatmap Generator, Compliance Timeline Builder) to handle form-state persistence and artifact save. The drawer auto-flips from create to view mode when a save happens. Risk register builder state lives in its own dedicated store, isolated from the module store.

- **Deployment Playbook → Command Center save** — The Ops Checklist gained a "Save to Command Center" button alongside the existing "Copy Markdown" action; checked items are captured for later edit-mode restoration.

- **Compliance Table — mandate deadline labels** — Framework tabs (FIPS 140-3, ACVP, Common Criteria) now display a resolved "Deadline: YYYY" sub-label, plus a tooltip on tab hover for screen-reader and pointer accessibility. Ongoing mandates suppress the year label.

- **FilterDropdown keyboard navigation** — ARIA-listbox keyboard support added to the shared dropdown: ArrowUp/Down to cycle, Home/End to jump, Escape to close. WCAG 2.1 AA keyboard-operable.

- **Manufacturing industry support in assessment** — Added Manufacturing entries to the industry threat model and composite weights (IEC 62443 OT/ICS exposure, ISO/SAE 21434, TISAX, long-lived embedded controllers). Closes a gap where manufacturing respondents had to choose "Other".

- **Compliance ↔ Timeline consistency pipeline** — Established a closed loop between the Compliance and Timeline views. The validator now requires every compliance row with a parseable deadline year to have at least one timeline event spanning that year in one of its referenced organisations; orphan timeline organisations are surfaced as informational. Added 10 timeline rows to cover previously dangling compliance refs (African Union/AUC, GSMA, China/ICCS, G7 CEG, 3GPP SA3, TCG TPM 2.0 v1.85 PQC draft, South Africa POPIA, Nigeria NDPC, Kenya ODPC, Egypt MCIT). The compliance UI's timeline chips now deep-link to the timeline filtered by country, with a dated summary on hover. Frameworks with no matching timeline events surface a visible warning. Validator now reports zero broken refs and zero coverage gaps across 112 compliance rows × 219 timeline events.

- **Compliance data — accuracy and completeness overhaul** — Added 5 African frameworks (South Africa POPIA, Nigeria NDPR/NDPA, Kenya DPA, Egypt PDPL, African Union Malabo Convention) closing the Africa regional gap. Populated `library_refs` on all 48 frameworks that previously had empty cross-references (PCI-DSS, HIPAA, SWIFT-CSP, GDPR, ISO-27001, SOC-2, HITECH, FDA 21 CFR 11, NATO STANAG 4774, UN ECE WP.29, NERC-CIP, IEC-62443, DO-326A, FERPA, COPPA, TISAX, MICA, TSA Pipeline, KpqC/KCMVP, NZISM, INCD, BOI, OSCCA NGCC, Swiss/Dutch NCSC, KISA, INDIA-DST, UAE, ACVP, Taiwan MODA, Malaysia NACSA, Saudi NCA, India CERT-In CBOM, Italy ACN, Spain CCN, Bahrain NCSC, Jordan CBJ, CSA, ITU-T SG17, ISO 19790, Brazil ANPD, Denmark CFCS, NY DFS 23 NYCRR 500, ETSI EN 303 645, PQC Coalition, QED-C). Flagged 33 authoritative sources as Compliance contributors. Loader added a missing industry-alliance body type so PQC Coalition, PQCA, and QED-C are no longer silently misclassified. UI added a global Region filter (with per-bloc counts) and Deadline filter (Active, Imminent, Near-term, Mid-term, Long-term, Ongoing) wired to URL params for deep-linking.

- **Command Center — ROI Calculator overhaul** — A new shared pure-math module backed by 43 unit tests, with NPV plus WACC discount rate (new KPI card), capex/opex split (benefit net of opex for payback/NPV), a decomposed quantum multiplier (HNDL / post-CRQC uplift / detection uplift) replacing the opaque 2.5× default, a tornado sensitivity chart ranking drivers at ±30%, a Cost of Inaction KPI for counterfactual exposure, PDF/DOCX exports alongside markdown, a board-ready executive framing banner, and an `asOf` plus penalty-type schema on the ROI baselines.

- **Command Center — KPI plan completion (E4 / D9 / E2 / E1)** — Closes remaining persona-fit gaps. E4 Board-Ready NIST CSF Composite produces a single 0–100 executive score derived from assessment category scores, mapped to CSF 2.0 Govern / Identify / Protect / Respond. D9 Per-Layer Vendor Readiness adds a meta-KPI that expands to one row per infrastructure layer for architects. E2 Regulatory Exposure Index uses a new framework-fines lookup (25+ frameworks, USD millions) with log-scaled auto-score. E1 Crown-Jewel Coverage is a manual-input KPI with CSF / ISO / SOC 2 mappings.

- **VPN Simulator — ML-DSA authentication via draft standards** — Restores ML-DSA-65 authentication in the IKEv2 handshake, guarded by an explicit warning that calls out the draft-ietf-ipsecme-ikev2-auth-ml-dsa status so users understand the mode is not yet standards-track.

- **5G SUCI Playground — UX overhaul** — Three new sub-components: a collapsible Configure card (first-visit vs returning-user settings), a Scenario Intro Strip (operator ↔ IMSI-catcher perspective toggle), and an Attacker Sidecar (per-step "what the eavesdropper captures" sidebar). Plain-English mode is on by default and persisted; scenario view is session-scoped.

- **Step Wizard — phase progress and plain-English rail** — A new Phase Progress component renders a phase-grouped progress bar (labelled segments with per-step ticks) when steps carry phase fields. A Plain English Rail renders plain-English explanations beside the terminal when the toggle is on.

- **PKCS#11 Log Panel — Beginner Mode** — Every PKCS#11 call now has a 4–8-word plain-English description (algorithm-aware: distinguishes ML-KEM, ML-DSA, X25519, RSA, etc.). A Beginner Mode toggle adds an extra grid column with the translation alongside the raw function name and arguments.

- **PKCS#11 log panel — "Crypto Only" filter** — A new toggle (on by default) hides housekeeping calls (session open/close, object searches), leaving only the 27 cryptographic operations. Toggle off to restore the full raw log.

- **Browser compatibility notice on VPN and SSH simulators** — Safari and Firefox users now see a clear warning explaining that the live cryptographic handshakes (strongSwan IKEv2, OpenSSH ML-KEM) require a Chromium-based browser. The Run / selftest buttons are automatically disabled; all educational content and panels still render normally.

- **Secure Boot PQC — TPM 2.0 sandbox deep-link** — A banner in the TPM Key Hierarchy Explorer tab links to the live PQC TPM migration scenario for real `TPM2_CreatePrimary` outputs covering EK / SRK / AIK / IDevID in ML-KEM-768 and ML-DSA-65.

- **Docker Playground — pqctoday-sandbox iframe embed** — The Docker Playground was rewritten from a scenario-tile UI to an iframe embedding the pqctoday-sandbox app. A postMessage handshake configures vendor ID, theme, and allowed routes; dynamic resize events drive auto-height (600–1600 px).

- **Glossary — TPM 2.0 / TCG V1.85 terms** — Five new entries: Endorsement Key (EK, ML-KEM-768 in TCG V1.85), Attestation Identity Key (AIK, ML-DSA-65), Storage Root Key (SRK, ML-KEM-768 wrapping), Initial Device Identifier (IDevID, IEEE 802.1AR factory ML-DSA-65), and Platform Configuration Register (PCR). All linked to the Secure Boot PQC learn module.

- **PKCS#11 glossary terms** — Token-level hover-chip definitions used for inline tooltips.

- **Library v04172026 entries** — KpqC Competition Results (HAETAE, AIMer, SMAUG-T, NTRU+ final selections), FIPS 140-3 IG PQC self-test requirements for FIPS 203/204/205, 3GPP TR 33.841 PQC Study 2025 (hybrid PQC for TLS / IPSec / IKEv2 in 5G), liboqs v0.15.0.

- **Implementation Attacks tab in Detailed Comparison** — 12 algorithm attack profiles covering ML-KEM, ML-DSA, FN-DSA/Falcon, HQC, Classic McEliece, FrodoKEM, NTRU+, SLH-DSA, LMS/XMSS, Hybrid KEM, Composite Signatures, and cross-cutting RNG/API risks. Each profile includes per-attack severity ratings (Critical/High/Medium/Low), countermeasures, and peer-reviewed references with local archive links.

- **KAT Validation tab in Detailed Comparison** — In-browser NIST Known Answer Tests via the in-browser HSM for ML-KEM (FIPS 203), ML-DSA (FIPS 204), and SLH-DSA (FIPS 205), with a collapsible PKCS#11 diagnostics panel.

- **FN-DSA / Falcon attack profile** — Documents the floating-point Gaussian sampler side-channel vulnerability (most SCA-vulnerable NIST PQC standard) with five countermeasures.

- **LMS / XMSS stateful signature attack profile** — Documents the catastrophic state-reuse vulnerability with crash-safe persistence and state management countermeasures.

- **BIKE-1/3/5 added to algorithm reference** — NIST Round 4 code-based KEM (QC-MDPC) with sizes from the BIKE specification. 80 algorithms now in the reference data.

- **Cryptographic hardness assumptions in Security Levels view** — Each algorithm card displays the underlying mathematical problem (Module-LWE, binary Goppa decoding, hash collision resistance, MQ problem, etc.).

- **"Why KATs Matter" explainer** — Collapsible educational content covering FIPS 140-3 requirements, implementation correctness, and in-browser verification value.

- **"Quick Reference" panel in About modal** — Practical analogies for security levels, key sizes, and signature sizes for non-expert users.

- **Curious persona — single-click experience shortcut** — Selecting the Curious persona now completes the personalisation wizard immediately (curious persona, Global region, all industries, marked completed) so first-touch visitors aren't forced through the multi-step wizard before exploring.

### Changed

- **Right Panel layout — bottom drawer → right sidebar** — Migrated from a 50%-height bottom drawer (slide-up) to a fixed right sidebar (40% viewport width, slide-in from right). Both layouts add transition padding when the panel is open so the main content reflows smoothly without overlap.

- **strongSwan WASM rebuilt** — Latest charon plus in-browser HSM plumbing from the companion repo. The WASM binary grew (additional plugins now linked in) but the loader/JS shrank ~55% as more bootstrap moved into the WASM module.

- **strongSwan WASM — 44% size reduction** — A subsequent rebuild trimmed the WASM down by 44% by building and patching out of the companion repo; the local build script and standalone patch are no longer needed and were deleted.

- **VPN Simulator — true MTU and fragmentation config logic** — Assessment-driven MTU and fragment-size smart defaults now flow through to the IKEv2 simulator so learners see realistic IKE_INTERMEDIATE fragmentation behaviour. Previously the UI accepted inputs but the simulator ignored them.

- **VPN Simulator — FlaskConical icon for ML-DSA draft warning** — Replaces the generic warning icon on the ML-DSA draft-standards banner with a flask icon to better signal experimental status.

- **Module store — persisted version 12 migration** — Filters out any stray `roadmap` document type (replaced by `migration-roadmap`) and preserves an optional `inputs` field on executive documents so builders can round-trip form state for edit mode.

- **NIST CMVP scraper — all security levels** — Now fetches all active FIPS 140-3 certificates (previously filtered to L3 only). Actual security level (L1/L2/L3) is extracted from each cert's detail page. Compliance data updated: 2,386 records (NIST 1,269, CC 913, ANSSI 179, ENISA 25).

- **Compliance data re-scraped** — 2,386 total records (was 2,391, with 5 expired certs removed); NIST records now include correct per-cert security levels instead of hardcoded L3.

- **Library v04152026** — 450 records (+21 new entries).

- **Product catalog v04162026** — 731 records (+2 new entries including Cosmian KMS and SOPS).

- **Vendors v04162026** — 302 records (+1 new vendor).

- **Catalog enrichments** — Two full enrichment runs covering 361 and 661 entries; 11 products skipped due to bad source documents.

- **Library and timeline enrichments refreshed** — Full re-runs for the latest snapshots.

- **SSH simulator — "Build in progress" notice removed** — Removed now that the OpenSSH client and server WASM builds are in place. The panel description clarifies that ML-KEM-768 × X25519 key exchange is natively built into OpenSSH 10.x.

- **Playground Workshop — work-in-progress tools hidden by default** — Initial state flipped from "show" to "hide" for every visitor (embed mode already hid them). The filter remains user-toggleable; this change just makes the first-visit surface match the stable, vendor-presentable subset.

- **Performance baseline description fixed** — Info modal now correctly states RSA-2048 is the universal baseline across all algorithm families (previously incorrectly split between RSA-2048 for KEMs and ECDSA-P256 for signatures).

- **Composite & Hybrid attack profile split into two tiles** — Hybrid KEM (X25519+ML-KEM) and Composite Signatures (ML-DSA+ECDSA) with distinct attack details and countermeasures.

- **NTRU+ attack reference clarified** — Notes that the research was on classic NTRU, transferable to NTRU+ via shared polynomial multiplication structure.

- **Draft / Candidate badges added to Performance and Size views** — Amber "Draft" badge shown for algorithms still in candidate or draft standardisation (HQC, BIKE, MAYO, HAWK, etc.).

- **Attack severity ratings replace uniform "Vulnerable" badges** — 4-tier system: Critical (remote, practical key recovery), High (physical access required), Medium (theoretical), Low (easily mitigated). Colour-coded legend.

- **Countermeasures section added to all attack profiles** — Actionable mitigations including masking, constant-time implementation, DRBG compliance, zeroization, and FIPS 140-3 guidance.

- **SLH-DSA side-channel status corrected** — From "Unknown" to "Not Found"; hash operations are inherently constant-time with no known SCA vulnerabilities.

- **Search corpus and embed manifest regenerated** — Picks up the compliance/timeline data refresh and the deletion of retired CSVs. RAG corpus shrinks significantly after dedup against the new authoritative files.

- **OpenSSH WASM connector path** — Comments and the build-in-progress banner now point at the folded-in connector in the HSM repo (per the April 18 repo consolidation) instead of the retired standalone repo.

## [3.3.8] - April 14, 2026

Six new reference library entries covering government guidance and emerging standards, plus
six new algorithm entries for the draft SLH-DSA limited-signature parameter sets from NIST
SP 800-230. FAQ copy updated to reflect current module count and corpus size.

### Added

- **NIST SP 800-230 (IPD) in the Reference Library** — "Additional SLH-DSA Parameter Sets for
  Limited-Signature Use Cases" (April 13, 2026); defines six new SLH-DSA variants optimised
  for firmware and certificate signing with a 2^24 signatures-per-key limit; local PDF
  downloadable.
- **ANSSI PG-083 v3.00 in the Reference Library** — France's authoritative cryptographic
  algorithm rules updated for the first time since 2020; first edition to explicitly address
  the quantum threat; covers symmetric, asymmetric (lattice/LWE), KEM, signature, and RNG
  guidance; local PDF downloadable.
- **Applied Quantum PQC Migration Framework v1.1 in the Reference Library** — Universal
  framework by Marin Ivezic/Applied Quantum (March 2026, CC BY 4.0) covering cryptographic
  inventory, risk classification, migration roadmaps, and GSMA alignment; local PDF
  downloadable.
- **Charter of Trust "Decrypting the Future" in the Reference Library** — PQC Working Group
  report (April 13, 2026) on global PQC transition timelines, threat scenarios, and a
  practitioner migration playbook authored by Charter of Trust member organisations including
  Siemens; local PDF downloadable.
- **Cambridge JBS / CCAF quantum blockchain article in the Reference Library** — Analysis by
  Philippa Coney on quantum computing threats to distributed ledgers, blockchain upgrade
  pathways, and the role of regulators in the PQC transition; local HTML archived.
- **Australian ACSC Quantum Technology Primer (Communications) in the Reference Library** —
  March 2026 guidance for the Australian communications sector; catalogued as no-timeout
  (cyber.gov.au server returns HTTP/2 INTERNAL_ERROR for direct downloads).
- **Six SLH-DSA limited-signature algorithm variants in the Algorithms reference** — Draft
  entries for SLH-DSA-{SHA2|SHAKE}-{128|192|256}-24 from NIST SP 800-230 IPD; each variant
  produces signatures roughly 50% smaller than the corresponding FIPS 205 's' parameter set
  at the cost of a strict 2^24 signatures-per-key limit; marked Draft pending finalisation.
- **Entropy & Randomness FAQ entry** — new question covering the module's TRNG/QRNG/DRBG
  content and its relevance for teams deploying HSMs and PQC key generation.

### Changed

- **FAQ copy refreshed** — module count updated to 50 across nine tracks; Reference Library
  description updated to reflect 440+ documents; RAG corpus size updated to 6,500+ chunks;
  SoftHSM description expanded to list the full supported algorithm suite.
- **RAG corpus grown to 6,507 chunks** — five new library entries enriched with
  qwen3.5:27b; Document Enrichments bucket now at 1,285 chunks.
- **Older library and algorithm CSVs archived** — thirteen library CSV versions and two
  algorithm CSV versions moved to src/data/archive/ to maintain the two-version active window.

## [3.3.7] - April 14, 2026

Picking a row from the Transition Guide now adds both the classical algorithm and its PQC
replacement to the comparison panel in one click — select three RSA rows to benchmark
RSA-2048/3072/4096 alongside ML-KEM-512/768/1024 all at once.

### Added

- **Compare classical and PQC together from the Transition Guide** — clicking the compare icon
  on any row (e.g. RSA 2048-bit → ML-KEM-512) adds both algorithms to the comparison at once.
  Select up to three rows to compare up to six algorithms simultaneously.

### Fixed

- **ECDH P-384 benchmark now produces results** — previously all 10 runs would fail silently,
  showing dashes for every metric.
- **Comparison panel shows only what you selected** — extra classical algorithms that appeared
  automatically without being chosen have been removed.

## [3.3.6] - April 14, 2026

The algorithm comparison table now labels each column so you can tell at a glance which
algorithms are classical, which are PQC, and which is the reference baseline. HSM engine
upgraded to softhsmv3 v0.4.23.

### Added

- **Classical / PQC / baseline labels in the comparison panel** — each column header now
  carries a small badge identifying the algorithm's role, making benchmark results immediately
  readable without prior knowledge of each algorithm's category.

### Changed

- **HSM engine updated to softhsmv3 v0.4.23** — internal maintenance release; no change to
  functionality.
- **HSM engine v0.4.22 improvements (included)** — adds ECDSA and ECDH support for P-521
  curves; EdDSA key validation hardened to return an error instead of crashing on malformed input.

### Fixed

- **Certificate and compliance detail pop-ups now open centered on screen** — on mobile devices
  these were appearing at the top of the viewport; they now open centered and resize correctly
  when the browser address bar is visible.
- **Timeline pop-ups no longer get cut off on mobile** — pop-up height now accounts for the
  dynamic browser address bar on iOS and Android.

## [3.3.5] - April 13, 2026

The algorithm benchmark now covers the full PQC and classical portfolio — SLH-DSA, RSA, ECDSA,
Ed25519, ECDH, X25519, X448, LMS, and XMSS all run through the in-browser HSM engine alongside
ML-KEM and ML-DSA. X448 was not benchmarkable at all before this release.

### Changed

- **Benchmark engine extended to the full algorithm portfolio** — the following now produce live
  timings measured by the in-browser HSM rather than reference figures: SLH-DSA (all 12
  parameter sets), RSA (2048/3072/4096-bit), ECDSA P-256/P-384, Ed25519, ECDH P-256/P-384,
  X25519, X448, LMS-SHA256, and XMSS-SHA2. ECDSA P-521 and ECDH P-521 continue to use the
  browser's built-in WebCrypto.

### Fixed

- **Timeline event pop-ups now have a proper backdrop** — clicking outside the pop-up closes it;
  focus is trapped inside while it is open.

### Data

- 19 additional migration catalog products enriched with AI analysis.
- New products added: IBM z16 Crypto Express 8S HSM, AWS Certificate Manager.
- 7 new threats added: Grover attacks on AES-128, quantum halving of SHA-256 collision
  resistance, PRNG quantum entropy risks, PQC timing/power side-channel attacks, lattice
  cryptanalysis advances, fault injection on PQC key generation, and resource-constrained
  PQC deployment.
- 2 new timeline entries: Brazil's ITI federal mandate for ML-DSA and ML-KEM, ITU-T X.1811.
- New library entry: Google/QuantumAI paper on securing elliptic curve cryptography against
  quantum attacks.

## [3.3.4] - April 13, 2026

AI-powered analysis now covers all 535 products in the Migration catalog. Each product entry
surfaces 19 dimensions of PQC readiness — algorithms in use, hybrid approaches, migration
timeline, compliance alignment, and more.

### Data

- **535 migration catalog products enriched** — AI analysis of published product documentation
  for every product in the catalog, covering PQC algorithms, hybrid approaches, security levels,
  migration timelines, and regulatory alignment.
- Library (315 entries), timeline (213 entries), and threat (80 entries) enrichments all
  refreshed to the current 19-dimension analysis schema.

### Changed

- **"Enriched" badge now reflects current AI analysis** — the badge previously appeared on
  ~45 products with legacy data; it now correctly marks all 535 products with current enrichments.

### Fixed

- **Migration Planner stack view** — inactive layers now collapse when one layer is expanded,
  keeping focus on the active content instead of showing everything at once.
- **Stack view dark-mode contrast** — inactive layers were appearing lighter than the active
  layer, making the depth hierarchy look inverted. Active layers are now clearly elevated.
- **Stack view active layer visibility in dark mode** — the active layer was blending into the
  page background; it now has a clearly visible tinted surface.
- **Stack minimap dots** — navigation dots were rendering as oversized empty boxes; they are
  now the correct compact size.
- **Stack minimap hidden in embedded widgets** — the minimap no longer overflows the iframe
  boundary in embed contexts.

## [3.3.3] - April 13, 2026

Mobile fixes and algorithm comparison improvements.

### Fixed

- **Persona avatar displayed correctly on mobile** — the avatar tile was overflowing its
  container on small screens and appearing detached from the page.
- **"What's New" panel centers correctly on iOS and Android** — previously it could drift
  partially off-screen when the browser address bar was visible.
- **Update notifications no longer clip on narrow screens** — notifications stay within viewport
  bounds on 320 px devices.
- **Composite and Hybrid algorithm types now show the compare button** — Composite Signature,
  Composite KEM, Hybrid KEM (HPKE), and Hybrid KEM with Access Control were missing the compare
  icon; all are now included.

## [3.3.2] - April 12, 2026

Every operation in the HSM Playground now shows the exact bytes sent to and received from the
HSM — see precisely what the PKCS#11 standard is doing at every step.

### Added

- **Full parameter inspection across all HSM panels** — click the eye icon in any call log to
  expand individual operations and see what was sent (mechanism name, key template, input data
  as hex) and what came back (handles, byte lengths, signature/ciphertext/digest, VALID/INVALID).
  New coverage: key import and object management, mechanism discovery, multi-part signing and
  digest, authenticated key wrapping, and random seed operations.

### Fixed

- **Sign and Verify operations now show the actual data** — previously only the call name and
  result were shown; message bytes and signature bytes are now visible in the log.
- **Key Unwrap operations now decode correctly** — previously showed nothing when clicked; now
  shows the mechanism, key blob, attribute template, and resulting handle.
- **Inspect toggle clearly shows when it is active** — the eye icon now appears highlighted
  when inspection is turned on.

### Changed

- **All HSM panels upgraded to the full inspectable log** — the condensed 10-entry summary in
  every operation panel (KEM, Sign/Verify, Symmetric, Hashing, Key Agreement, KDF, HMAC, AES,
  VPN Simulation) has been replaced with the same full decode view previously only available
  in the dedicated Logs tab.

## [3.3.1] - April 12, 2026

22 additional ACVP test vectors now pass.

### Changed

- **In-browser HSM engine updated to softhsmv3 v0.4.21** — resolves 22 previously skipped
  ACVP test vectors: 20 LMS SHAKE variants and 2 EdDSA/SLH-DSA cases.

## [3.3.0] - April 12, 2026

Role-specific exercise guides, an entropy workshop, and new dedicated panels in the HSM
Playground.

### Added

- **Role-specific exercise guides** — hands-on tasks tailored to each persona (Architect,
  Developer, Executive, Operations, Researcher) across five learning modules.
- **Entropy workshop** — five interactive in-browser demos: DRBG architecture, entropy testing,
  QRNG simulation, random number generation, and entropy source combining.
- **Dedicated ML-KEM panel in the HSM Playground** — encapsulation and decapsulation with
  dual-engine cross-check (Rust engine vs C++ engine running in parallel).
- **Stateful signature panel in the HSM Playground** — LMS/HSS and SLH-DSA operations with
  state management visualization.
- **Operation history** — review previous cryptographic operations during any playground session.

### Data

- Library and catalog data refreshed; knowledge base regenerated.

## [3.2.1] - April 12, 2026

OpenSSL engine upgraded to v3.6.2.

### Changed

- **In-browser OpenSSL engine updated to v3.6.2** — used by OpenSSL Studio, Digital Assets,
  and PQC algorithm demos. Full ML-KEM, ML-DSA, SLH-DSA, and LMS/HSS support preserved.
- **Embedded widget SDK** updated to a more compact bundle for faster load times in partner
  integrations.

### Data

- Knowledge base refreshed: 5,881 indexed chunks.

## [3.2.0] - April 12, 2026

Mobile app foundation — the codebase now supports a future native iOS/Android build with zero
impact on the web app. Changelog entries rewritten in plain language across all recent releases.

### Added

- **Native mobile app platform support** — an integration bridge for Capacitor is in place for
  native iOS/Android builds. All native capabilities are completely dormant when using the web
  app: device storage, native share sheet, system browser handoff for external links, Android
  back-button navigation, background state saving, and haptic feedback.
- **Unified platform detection** — one authoritative source determines whether the app is
  running as a native app, an embedded widget, or a standard web page.

### Changed

- **Changelog dates are now human-readable** — dates appear as "April 12, 2026" rather than
  ISO format.
- **Changelog descriptions rewritten for plain language** — v3.0.0–3.1.4 entries describe
  user-facing changes rather than implementation details.
- **App startup sequence** — three clearly named boot paths: native app, embedded widget, and
  standard web.

### Fixed

- **Embed error page** — the verification error screen now builds its content safely.
- **Auto-reload disabled in native WebView** — the service worker no longer triggers page
  reloads inside the native app container.

## [3.1.4] - 2026-04-11

Polish pass for embedded widgets and the learning module navigator — modals, tables, and step indicators now display correctly at all screen widths.

### Fixed

- **Pop-ups and overlays display correctly in embedded widgets**: All modal backdrops are now
  correctly scoped to the embedded frame. Previously, dialogs with non-standard class combinations
  would escape the iframe boundaries and appear at incorrect positions on the host page.
  Technical: added generic `[data-embed] .embed-backdrop` CSS rule covering all 56 affected components.

- **Tables and charts fit properly at narrow widths**: Reduced hard-coded minimum widths that
  forced horizontal scrollbars in embedded views (600–900 px) and on tablets.
  Affected: Compliance Gantt, Algorithm Vulnerability Matrix, Migration Risk Matrix, and 5 others.

- **More content visible on medium-size screens and in embedded views**: The Playground,
  category filter sidebar, and Algorithm Comparison panel now appear at tablet widths (768 px)
  instead of requiring a full desktop screen (1024 px).

- **Content fills the full width inside embedded portals**: Removed centering constraints so
  content spans the entire embed frame rather than leaving empty margins on both sides.

- **Learning module step indicators are more compact**: Step circles are smaller and no longer
  overflow their container on narrow screens or inside embedded views.

- **Improved text legibility when switching between light and dark themes**: Several components
  used hardcoded color values that looked incorrect in the opposite theme. All now use semantic
  color tokens that adapt automatically.

- **Detail pop-ups no longer appear above unrelated content**: Fixed stacking order for detail
  popovers, tooltips, and the accuracy feedback widget so they stay in their correct layer.

- **Feedback and tooltip overlays stay within embedded widget boundaries**: The page accuracy
  widget and trust score tooltip no longer escape the iframe viewport in embed contexts.

## [3.1.3] - 2026-04-11

Bug fix for embedded widget brand theming, plus vendor certificate infrastructure cleanup.

### Fixed

- **Custom brand colors in embedded widgets now load correctly**: Color values such as `#3B82F6`
  were incorrectly treated as URL fragment separators, causing the vendor token and signature to
  be silently dropped. The embed URL builder now percent-encodes color values before signing.

### Changed

- **Vendor certificate registry simplified**: All vendor certificates (including development ones)
  are now loaded from PEM files at build time. The separate dev-mode fixture merge step has been
  removed, making the embed boot path faster and more predictable.

- **Trust anchor certificates can be committed to version control**: Root CA and vendor
  certificate PEM files (public trust anchors only) are now tracked by git so they can be
  bundled by the build system.

### Security

- **No private key material is stored in the repository**: Root CA private keys, P12 bundles,
  and `.key` files are blocked by gitignore rules. Only public certificate PEM files (trust
  anchors) are ever committed.

## [3.1.2] - 2026-04-11

Embed SDK: partner portals can now display custom logos, brand names, and navigation colors.

### Added

- **Custom logos and brand names in embedded widgets**: Nine new vendor certificate fields give
  partners granular control over how the embed looks in their portals — custom logo image, brand
  name in the nav header, logo sizing, nav bar height, active nav highlight color, secondary
  brand color, an optional help button, and the ability to hide the "Powered by PQC Today" badge.
  Technical details: `theme.secondary`, `theme.secondaryForeground`, `theme.navActiveBackground`,
  `theme.brandName`, `theme.logoUrl`, `theme.logoHeight`, `theme.logoMaxWidth`,
  `theme.headerHeight`, `features.hidePoweredBy`, `features.showHelpButton`, `features.helpUrl`.

## [3.1.1] - 2026-04-11

Fixed Migration Planner interactivity and improved embedded widget behavior across 18 components.

### Fixed

- **Migration Planner layer categories are now fully interactive**: Layer row buttons (Cloud,
  Network, Application Servers, etc.) were completely unresponsive due to an invalid nested
  button structure. Clicking any part of a layer row now correctly selects it. Full keyboard
  support (`Enter`/`Space` to select, `Escape` to collapse) is also restored.

- **Migration Planner filter bar stays visible while scrolling through layers**: The sticky
  filter bar no longer gets covered by layer rows when scrolling through a long stack.

- **Drawers, alerts, and navigation panels stay within embedded widget boundaries**: 13 UI
  elements that use fixed positioning (including the Artifact Drawer, Glossary, achievement
  toasts, and the Algorithm Compare bar) now correctly stay within the embed frame instead of
  escaping to the host page.

- **Embedded widget height adjusts correctly for host pages**: The resize signal sent to the
  host page is now based on the actual content area, not the document body, giving accurate
  height measurements.

- **Vendor token is preserved when navigating within embedded widgets**: The embed authentication
  token is no longer dropped on internal navigation redirects.

## [3.1.0] - 2026-04-11

Visual consistency pass — gradient buttons and the shared Button component are now applied uniformly across every page.

### Changed

- **Consistent gradient button style across the entire app**: All primary action buttons now
  use a unified purple→teal gradient, replacing the inconsistent mix of solid-color variations
  that existed across every page and learning module.

- **Unified interactive button component throughout the codebase**: Every button in the app
  now uses the shared `<Button>` component, ensuring consistent hover states, focus rings,
  accessibility attributes, and keyboard handling everywhere.

## [3.0.0] - 2026-04-10

### Added

- **Embed SDK — left sidebar nav layout (`navLayout: 'sidebar'`)**: Vendors can now opt into a
  fixed left-panel navigation instead of the default horizontal top bar. Set `navLayout: 'sidebar'`
  in the cert's VendorTheme to activate a 200px fixed left sidebar with vertically stacked nav
  items and a logo/divider at the top. Main content automatically offsets right by the sidebar
  width. Zero impact on standard mode — the layout is gated behind the `[data-embed][data-nav-layout="sidebar"]`
  CSS selector and the `data-nav-layout` DOM attribute, which are only set in the embed bootstrap
  path.

- **Embed SDK — VendorTheme v2 status/link color overrides**: Five new VendorTheme fields are
  now supported: `colorMode` (default light/dark mode, user can still toggle), `linkColor`
  (overrides link/anchor color), `successColor`, `warningColor`, `destructiveColor` (override
  status badge and indicator colors). Status color overrides are scoped to `[data-embed]` via
  intermediate `--embed-success/warning/destructive` CSS vars and never pollute global tokens.

- **Embed SDK — cert color mode default (`colorMode`)**: The vendor cert can now specify a
  default color mode (`'light'` or `'dark'`). The URL param `?theme=` still takes priority; the
  cert value is the fallback when no param is present. The user can always toggle manually.

- **pqc-admin CertIssueWizard — Nav Layout control**: New Nav Layout select (Top / Sidebar) in
  the Embed Theme panel, alongside the existing Color Mode control. The CLM/DigiCert preset now
  applies `navLayout: 'sidebar'` automatically.

- **`test-vendor-custom-design` cert updated**: Now encodes the full VendorTheme v2 field set,
  including `navLayout: 'sidebar'`, `colorMode: 'light'`, `linkColor`, `successColor`,
  `warningColor`, and `destructiveColor`.

## [2.99.0] - 2026-04-10

### Added

- **Embed SDK — `VendorTheme` full component theming**: Vendors can now control 15 visual
  properties in their embedded certificate: colors (11 tokens), border radius, font family,
  table row density (`compact`/`normal`/`relaxed`), navigation bar background/text color
  (`sidebar`/`sidebarForeground`), and status badge fill style (`solid`/`tinted`). All overrides
  are scoped to `[data-embed]` and have zero impact on standard mode.

- **Embed SDK — nav bar color (`sidebar`/`sidebarForeground`)**: Vendors can set a custom
  navigation bar background (e.g. dark navy `#1A2332`) with matching text/icon color. Active and
  hover states are derived automatically via `color-mix()`.

- **Embed SDK — solid status badges (`badgeFill: 'solid'`)**: Vendors can switch status badges
  from the default subtle tinted style (`/10` opacity) to fully opaque filled pills, matching
  enterprise CLM UI conventions (DigiCert ONE / Sectigo Trust Lifecycle Manager style).

- **Embed SDK — `INDUSTRY_SLUG_TO_LABEL` mapping**: A single canonical map in `personaConfig.ts`
  translates cert industry slugs (`'finance'`) to display labels (`'Finance & Banking'`) at the
  embed boundary, ensuring all pages receive the format they expect.

- **`test-vendor-custom-design` cert preset**: Dev registry now includes a third test certificate
  (`kid: test-vendor-custom-design`) encoding a full Trust Lifecycle Manager brand theme: deep
  blue primary, light gray background, dark navy nav bar, compact density, solid badges.

### Fixed

- **Embed mode — Compliance tables empty**: The industry filter initialized to a cert slug
  (`'finance'`) that never matched compliance CSV display labels (`'Finance & Banking'`),
  producing 0 entries. Fixed by translating slugs to display labels in `EmbedLayout` before
  seeding `usePersonaStore`.

- **Embed mode — Assessment industry not pre-populated**: Same slug/label mismatch prevented the
  Assess wizard from pre-selecting the correct industry from the cert policy.

- **Embed mode — region validation**: `allowedRegions[0]` is now validated against a known
  `Region` set before being passed to `setRegion()`, preventing an unsafe type-cast with
  unexpected cert values.

- **Embed mode — URL param bypass**: `?ind=` and `?persona=` query parameters are now sanitized
  at mount against cert-allowed values, preventing manual URL manipulation from accessing
  restricted content.

- **Semantic token consistency**: Replaced raw palette classes (`bg-amber-500/10`,
  `text-amber-500`, `bg-slate-50`, `text-slate-800`, `bg-red-50`, `text-red-900`,
  `bg-blue-50/10`, `text-blue-300`) with semantic tokens across `WasmFallback`,
  `StatefulSignaturesDemo`, and `VpnSimulationPanel` for correct rendering in vendor-themed
  embed contexts.

## [2.98.0] - 2026-04-10

### Added

- **Embed SDK — granular route presets**: The `explore` bundle preset has been replaced with
  individual presets — `timeline`, `algorithms`, `library`, `threats`, `leaders`, `compliance` —
  giving vendors precise control over which pages appear in the embedded nav. Certificates using
  `"presets":["all"]` (full access) automatically show all pages.

- **Embed SDK — Algorithms and Threats nav items**: The Embed layout now shows Algorithms and
  Threats as first-class nav entries when the vendor certificate permits those routes, matching
  the full-site navigation.

- **Embed SDK — `assistant` URL param**: Vendors can suppress the PQC Assistant at embed URL
  level by appending `assistant=false` (e.g. for read-only kiosk deployments), without requiring
  a new certificate.

- **Embed SDK — About page always accessible**: `/about` is now exempt from route-guard
  enforcement so embedded users can always reach the About page regardless of cert presets.

- **Embed SDK — Right Panel scoped to iframe**: The assistant/bookmarks panel now opens as an
  in-frame overlay (not a full-screen takeover) when running in embed mode, and the Knowledge
  Graph tab is hidden in embed contexts where it would be disruptive.

- **Embed SDK — query-string passthrough on nav**: Embed nav links and internal redirects now
  preserve the `?token=…` query string so the vendor token is never lost on in-app navigation.

- **CuriousSummaryBanner layout**: Desktop view switched from a 2-column side-by-side layout to
  full-width stacked (infographic on top, "In Simple Terms" below) for better readability on
  medium-width screens.

### Fixed

- **Embed modal positioning**: All detail popovers (Compliance, Leader, Library, Migrate,
  Timeline, WhatsNew) now use a shared `useModalPosition` hook so they render correctly inside
  an iframe without clipping outside the embed container.

- **Bookmark links in embed mode**: Clicking a bookmarked item now navigates within the embed
  (`/embed/library?ref=…`) instead of escaping to the full-site URL.

- **Theme not applied in embed mode**: Dark/light theme preference is now applied on load inside
  the embed layout via a dedicated `ThemeApplier` component.

- **Embed vendor cert import path**: Dev registry now resolves the test certificate path relative
  to the correct directory depth (`pqc-tools/…` instead of `../../../../pqc-tools/…`).

- **Assistant button styling**: The "Assistant" button in page headers is now a compact
  pill-style button (icon + label) consistent with other action buttons in the row.

- **Back-to-modules button hidden in embed**: The "← Back to modules" button on individual
  learning module pages is hidden in embed mode to avoid confusing navigation out of context.

## [2.97.0] - 2026-04-09

### Added

- **Embed SDK — policy enforcement**: VendorPolicy is now fully enforced at runtime.
  `EmbedRouteGuard` enforces route, module, tool, and `maxDifficulty` restrictions from the cert.
  `EmbedLayout` seeds the persona/region/industry stores from cert policy on mount (single source of
  truth). `PersonalizationSection` filters persona/region/industry pickers to cert-allowed values in
  embed mode. `verifySignature` clamps the URL `persona` param to cert-allowed personas.

- **Embed SDK — VendorPolicy X.509 format**: `certParser.ts` now reads a single JSON-encoded
  `VendorPolicy` object from OID `.1`, with backward-compatible fallback to the legacy 8-OID CSV
  format. `vendorRegistry.ts` auto-discovers vendor certs from `pki/vendors/*.pem` at build time.

- **Embed SDK — module/tool path validation**: `verifySignature` validates `/learn/<moduleId>` and
  `/playground/<toolId>` paths against cert `policy.routes.modules` / `policy.routes.tools` at
  verification time (Step 6). `EmbedRouteGuard` enforces the same restrictions at navigation time.

- **GA4 analytics — embed mode coverage**: New events `Embed / Session Start`, `Embed /
Verification Error`, `Embed / Route Blocked` (with `reason` label), `Embed / Policy Applied`
  wired to `main.tsx`, `EmbedRouteGuard`, and `EmbedLayout`. Captures vendor ID, kid, presets,
  test mode flag, and policy restrictions.

- **GA4 analytics — assessment wizard**: `Assessment / Start`, `Assessment / Step` (step
  number + label), `Assessment / Complete` (persona result), `Assessment / Reset` wired to
  `AssessWizard.tsx`.

- **GA4 analytics — persona/personalization**: `Persona / Selected` (with `picker`/`assessment`/
  `embed` source), `Persona / Region`, `Persona / Industry` wired to `PersonalizationSection.tsx`
  handlers.

- **GA4 analytics — module tab switches**: `Learning / Tab Switch` fires via `useSyncDeepLink` on
  every learn↔workshop tab change across all 51 PKI learning modules. Skips the initial mount to
  avoid counting deep-link navigations as user tab switches.

### Fixed

- **`EmbedVerificationError` TypeScript compile error**: `public readonly` constructor parameter
  shorthand rejected by `erasableSyntaxOnly` strict mode. Fields now declared explicitly.

- **`crypto.subtle.verify()` type error**: `Uint8Array<ArrayBufferLike>` not assignable to
  `BufferSource`. Fixed by passing `.buffer as ArrayBuffer`.

- **Pre-existing analytics test failures**: Three tests asserted `console.log/warn` output that
  analytics helpers silently suppress on localhost. Tests updated to assert `ReactGA` method calls.

- **`consoleLogSpy` unused variable lint error** in `analytics.test.ts`: Removed the unused spy
  after test assertions were corrected to not depend on console output.

## [2.96.0] - 2026-04-09

### Added

- **Embed SDK — vendor iframe integration**: New `/embed/*` route tree renders any app view inside a
  slim `EmbedLayout` (compact nav, no full-page shell) for embedding in third-party vendor iframes.
  Embed URLs are cryptographically signed with ECDSA P-256 and verified via X.509 vendor certificates
  (`@peculiar/x509`). Vendor registry supports dev/prod separation (`vendorRegistry.dev.ts`).

- **Embed SDK — persistence and auth**: `useEmbedPersistence` syncs all Zustand stores via
  `api` (REST) or `postMessage` modes. `useEmbedAuth` handles token refresh on `pqc:authExpired`
  events. `EmbedPersistenceService` provides three backends: `ApiPersistence`,
  `PostMessagePersistence`, `NoPersistence`.

- **Embed SDK — `PQCEmbed` JS client**: `public/embed/sdk.js` (ESM bundle) — drop-in vendor wrapper
  for bridging auth, snapshot load/save, events, and resize messages across the iframe boundary.
  Built via `npm run build:sdk` (esbuild, ES2020 target).

- **Service worker — embed COOP header**: `withCOIHeaders()` now sets
  `Cross-Origin-Opener-Policy: unsafe-none` for `/embed/*` paths (required for postMessage with
  parent frames) and `same-origin` everywhere else.

### Fixed

- **Safari blank page**: Embed verification imports (`@peculiar/x509`, `certParser`, vendor registry)
  are now lazy-loaded via dynamic `import()` only on `/embed/` paths, so they are never evaluated on
  normal page loads. Fixes Safari's strict ES module binding resolution that caused a blank page.

- **Safari `EmbedState` binding error**: `EmbedState`, `EmbedConfig`, `PqcMessage`,
  `IEmbedPersistenceService`, and `PersonaId` were imported as values; corrected to `import type`
  throughout the embed module tree.

- **Nested `<button>` in MobileThreatsList**: The outer card element was a `<button>` containing
  `EndorseButton` and `FlagButton` (also buttons). Replaced with a `<div role="button">` with
  `tabIndex={0}` and keyboard handler for full accessibility compliance.

- **Leader avatars — CORP violation**: `ui-avatars.com` images were blocked by
  `Cross-Origin-Embedder-Policy: require-corp` (the service doesn't set CORP headers). External
  avatar URLs are now stripped at data load time; components fall back to the local User icon.

- **CSP — `flagcdn.com` and `frame-ancestors`**: Added `https://flagcdn.com` to `img-src` (country
  flags in Assess step 2). Added `frame-ancestors *` to permit embedding in vendor iframes.

- **Analytics noise**: Removed `console.log` from `analytics.ts` (localhost detection, GA init,
  page view, event logging). Only the missing-ID warning remains.

- **`sdk.ts` memory leak**: `PQCEmbed.destroy()` was calling `.bind(this)` again, creating a new
  function reference that didn't match the registered listener. Bound function is now stored as an
  instance property so `removeEventListener` correctly removes it.

## [2.95.0] - 2026-04-08

### Added

- **EUDI Wallet — pluggable CryptoProvider architecture**: All Digital ID components (PID Issuer,
  Attestation Issuer, QES Provider, Relying Party, Wallet) now use a unified `CryptoProvider`
  interface instead of inline HSM/OpenSSL branching. Three implementations: `OpenSSLCryptoProvider`,
  `HsmCryptoProvider` (PKCS#11), and `DualCryptoProvider` (parallel execution of both). Factory
  function `getCryptoProvider()` selects the active backend.

- **EUDI Wallet — X.509 certificate generation**: New `generateX509Certificate()` utility produces
  self-signed X.509 v3 certificates (ES256/ES384) via `@peculiar/asn1-schema`, used by the
  Attestation Issuer and QES Provider for qualified certificate issuance.

- **EUDI Wallet — native CBOR encoding**: mDoc structures now use `cborg` for ISO 18013-5 compliant
  CBOR/COSE binary encoding. Added `cborg` v5.1.0 as a production dependency.

- **Entropy — HMAC_DRBG Architecture Demo**: Interactive SP 800-90A HMAC_DRBG lifecycle visualization
  with three phases (Instantiate → Generate → Reseed), real-time (K, V, reseed counter) state
  tracking, configurable entropy/nonce/personalization inputs, and action history log. Available as
  `drbg-demo` in the Playground workshop registry.

- **Entropy — danger-zone gauge arc**: The entropy gauge visualization now includes a visual
  "danger zone" arc highlighting sub-threshold entropy regions.

- **Entropy — QRNG "Simulated" badge**: The QRNG demo card now shows a "Simulated" badge to
  distinguish it from hardware-backed quantum random sources.

- **Deep linking — `?flow=` URL parameter**: `useModuleDeepLink` now parses and syncs a `?flow=`
  parameter, enabling direct navigation to specific sub-flows within modules (e.g., selecting a
  blockchain chain in Digital Assets via `?flow=btc`).

- **Digital ID E2E test**: New Playwright spec (`e2e/digitalid.spec.ts`) validates the Digital ID
  module rendering and PID issuance workflow.

### Changed

- **Playground workshop registry**: Removed `wip` flags from 7 tools now considered production-ready
  (Envelope Encrypt, Token Migration, TEE Channel, Firmware Signing, QRNG Demo, Entropy Test,
  Source Combining). Removed `hybrid-signing` tool (consolidated into PKILearning modules). Added
  `drbg-demo` tool.

- **PKCS#11 Log Panel**: Refactored to exclude `C_GetAttributeValue` from default display,
  reducing log noise. Added sticky column headers (Time, Function, Arguments, Return Value,
  Duration), increased max height to 500px, and improved chronological grouping (newest sections
  first).

- **Workshop HSM key tracking**: HybridEncryptionDemo, EnvelopeEncryptionDemo, and
  HSMKeyDerivationDemo now register intermediate derived secrets (ML-KEM decap, ECDH shared secret,
  HKDF output) into the HSM key registry for inspection.

- **EdDSA PKCS#11 bindings**: Added `buildEdDSAParams()` helper constructing `CK_EDDSA_PARAMS`
  (phFlag, context data) and `CKA_EC_PARAMS` OID attribute in EdDSA key generation templates.

### Fixed

- **`useModuleDeepLink` test suite**: Updated all 11 test expectations to include the new
  `initialFlow` field; added a `?flow=` parsing test.

### Data Sources

- **RAG corpus regenerated**: Updated to reflect new EUDI crypto provider content and DRBG demo.

## [2.94.2] - 2026-04-08

### Fixed

- **Rust WASM binary updated to v0.4.17**: The deployed `softhsmrustv3_bg.wasm` was built from
  v0.4.15 source (v0.4.16 updated constants in Rust source but never rebuilt the binary).
  The new binary, built with `wasm-bindgen 0.2.117`, correctly exposes `CKM_HASH_ML_DSA`,
  `CKM_HASH_SLH_DSA`, and `CKM_EDDSA_PH` in `C_GetMechanismList`. This also fixes the
  "Length out of range of buffer" crash in the VPN simulation cert generation flow — the
  v0.4.15 RSA `CKA_MODULUS` / `CKA_PUBLIC_EXPONENT` fix is now active in the production
  WASM binary.

### Changed

- **PKCS#11 Walkthrough removed from Playground**: The `pkcs11-sim` workshop entry has been
  removed from the registry.

### Internal

- **SBOM: `@pqctoday/softhsm-wasm` updated to v0.4.17**: Vendor `package.json` bumped;
  `wasm-bindgen` entry in About SBOM updated to v0.2.117.

## [2.94.1] - 2026-04-08

### Fixed

- **About page SBOM — softhsmv3 link and version updated to v0.4.16**: The softhsmv3 entry
  in the About page SBOM previously linked to v0.4.13 and the Rust WASM Bindings / Rust Crypto
  Crates sections showed v0.4.15. All three references now point to v0.4.16.

### Internal

- **SBOM: `@pqctoday/softhsm-wasm` updated to v0.4.16**: Synced vendor constants with
  softhsmv3 v0.4.16 release. New mechanism constants now available in-app:
  `CKM_HASH_ML_DSA` (base), `CKM_HASH_SLH_DSA` (base), `CKM_EDDSA_PH` (Ed25519ph),
  `CKM_SHA3_256`, `CKM_SHA3_256_HMAC`, `CKM_KMAC_128`, `CKM_KMAC_256`, plus all 10
  specific `CKM_HASH_ML_DSA_SHA*/SHAKE*` and `CKM_HASH_SLH_DSA_SHA*/SHAKE*` variants.
  TypeScript declarations in `constants.d.ts` updated to match.

## [2.94.0] - 2026-04-07

### Added

- **New SLH-DSA learning module** (`/learn/slh-dsa`): A dedicated 4-step module covering FIPS 205
  SLH-DSA end-to-end — WOTS+, FORS, and hypertree architecture (§3–5); all 12 parameter sets with
  the FIPS 205 §6 internal parameter table (n, h, d, h/d, a, k, lg_w, m); context strings for
  domain separation (§9.2); deterministic signing mode (§10); and a side-by-side comparison of
  LMS, XMSS, and SLH-DSA.

- **SLH-DSA Playground — context string support (FIPS 205 §9.2)**: The Sign & Verify tab now
  includes an optional context string field. The string is encoded as UTF-8 bytes (max 255 B) and
  bound to the signature — supplying a mismatched context at verify time returns
  `CKR_SIGNATURE_INVALID`. Only available in Pure SLH-DSA mode (not HashSLH-DSA).

- **SLH-DSA Playground — deterministic mode toggle (FIPS 205 §10)**: A new checkbox switches
  between randomized signing (`opt_rand` from RNG, default) and deterministic signing
  (`opt_rand = PK.seed`). Toggle it to observe: off = a new signature each click; on = the same
  bytes every time for the same (SK, M, context) triple. Pure SLH-DSA only.

- **SLH-DSA Playground — FIPS 205 §6 internal parameter table**: Expand the collapsible
  "FIPS 205 §6 internal parameters" row to see the full n/h/d/h′/a/k/lg_w/m values for the active
  parameter set with explanations of the -s (small signature) vs -f (fast signing) trade-off.

- **SLH-DSA — FIPS 205 §11 compliance labels on pre-hash options**: Pre-hash variants that are
  not approved for HashSLH-DSA by FIPS 205 §11 (SHA-384, SHA3-\*, SHA-224) are now labelled
  "(Non-FIPS 205)" in the dropdown. Selecting one shows an amber warning pointing to the four
  approved hashes: SHA-256, SHA-512, SHAKE-128, SHAKE-256.

- **KMS Envelope Encryption — three new KAT specs**: The KAT panel now includes an ML-KEM-512
  encap/decap round-trip test, an ML-KEM-1024 encap/decap round-trip test, and an ML-KEM-768
  decapsulation test against a NIST ACVP vector (FIPS 203 §7.2).

- **KMS Envelope Encryption — envelope blob hex viewer**: After running the demo, a new
  "Stored Envelope Blobs" section renders the raw hex of every blob the recipient would need to
  store: KEM ciphertext, wrapped DEK, and GCM nonce. Includes a one-click "Copy hex" button for
  each blob.

- **PKCS#11 v3.2 hedge variant constants**: `CKH_HEDGE_PREFERRED` (0x00), `CKH_HEDGE_REQUIRED`
  (0x01), and `CKH_DETERMINISTIC_REQUIRED` (0x02) are now exported from the vendor constants
  module alongside `CK_SIGN_ADDITIONAL_CONTEXT_SIZE` (12 B) for correct WASM buffer allocation.

- **SLH-DSA Playground — SHA-2 vs SHA-3 hardware hint**: The parameter set info panel now shows
  a one-line note explaining when to prefer SHA-2 variants (no SHA-3 hardware) vs SHA-3/SHAKE
  variants (with acceleration).

### Fixed

- **KMS Envelope Encryption — HKDF salt now follows SP 800-56C Rev 2 §4.1**: The wrapping key
  derivation previously omitted the HKDF salt (`undefined`). It now uses a fixed 32-byte salt
  (`"kms-envelope-salt-v1"` right-padded to 32 B), meeting the SP 800-56C requirement that the
  salt length is ≥ the hash output length (SHA-256 → 32 B). Both the encapsulation and
  re-derivation paths use the same salt.

- **SLH-DSA Workshop — `C_GetAttributeValue` removed from live PKCS#11 log**: The logging proxy
  now bypasses `C_GetAttributeValue` so internal attribute reads no longer appear as operations in
  the step-by-step log, reducing noise.

- **SLH-DSA Stateful Signatures Workshop — prehash options unified with Playground**: The
  dropdown now reuses `PREHASH_OPTIONS` from `SoftHsmUI`, eliminating a duplicate list that could
  drift out of sync.

- **Playground — default engine in URL state changed from `cpp` to `rust`**: The URL param is now
  omitted when the engine is `rust` (the default) and written when it differs, preventing stale
  `?engine=cpp` links from appearing in shared URLs.

- **VPN Simulation and Token Setup panels migrated to Rust WASM module**: `VpnSimulationPanel`,
  `TokenSetupDemo`, and `algorithmEngineResolver` all now use `getSoftHSMRustModule()` instead of
  `getSoftHSMCppModule()`, consistent with the rest of the Playground.

- **HsmSetupPanel label corrected**: The subtitle now reads "SoftHSMv3 Rust WASM · OpenSSL 3.6 ·
  PKCS#11 v3.2" (was "SoftHSM3 WASM").

### Internal

- **softhsmv3 Rust WASM** — updated C++ WASM module (`softhsm.js`) and Rust glue
  (`softhsmrustv3_bg.js`). New PKCS#11 v3.2 functions: `_C_GetSessionValidationFlags`,
  `_C_AsyncJoin`, `_C_AsyncGetID`, `_C_AsyncComplete`, `_C_MessageEncryptInit/Final`,
  `_C_MessageDecryptInit/Final`, `_C_VerifySignatureInit/Update/Final/FinalWithSignature`, and
  `_set_kat_seed`. Parameter names in `C_InitToken`, `C_Login`, `C_OpenSession`, `C_GetSlotList`
  changed from `_`-prefixed stubs to real names, reflecting full Rust implementation.

- **`index.d.ts` trailing-comma cleanup**: All parameter lists now use trailing commas for
  consistent Prettier formatting. `_C_CreateObject` and `_C_FindObjects` reformatted to multi-line.

- **SLH-DSA workshop link updated in Playground registry**: The SLH-DSA Sign & Verify tool now
  links to the new `/learn/slh-dsa` module (was `/learn/stateful-signatures`) and the `wip: true`
  flag is removed — the tool is production-ready.

### Data Sources

- **RAG corpus regenerated** to include the new SLH-DSA module content.

## [2.93.0] - 2026-04-07

### Added

- **PKI Workshop now in the Playground**: You can now launch the full PKI certificate chain
  workshop (CSR → Root CA → Sign → Parse → CRL) directly from the Playground's "Certificates &
  Proofs" tab — no need to navigate to the Learn module.

- **Bitcoin Flow — quantum threat warning on public key export**: When you export your Bitcoin
  public key (Step 2), an amber warning now explains the "harvest now, decrypt later" (HNFL)
  risk: once your public key is visible on-chain, a future quantum computer could derive your
  private key and forge transactions. Spend addresses are most exposed.

- **Bitcoin Flow — clearer address and transaction explanations**: The address derivation steps
  now call out the mainnet vs testnet version bytes (`0x00` vs `0x6f`). The transaction step
  explains the Bitcoin UTXO model — why transactions consume full outputs and return change.

- **HD Wallet Flow — expanded to 5 steps with live derivation tree**: The HD Wallet module now
  walks through five steps: generate a mnemonic, derive the root seed, compare hardened vs
  non-hardened key derivation live, derive addresses for Bitcoin/Ethereum/Solana, and assess the
  quantum threat surface of the whole wallet stack. Step 4 shows an inline ASCII derivation tree
  displaying the BIP-44 path and truncated live addresses for all three chains.

- **HD Wallet Flow — hardened vs non-hardened live demo (Step 3)**: A side-by-side known-answer
  test shows exactly how hardened derivation (using the parent private key in HMAC-SHA512) differs
  from non-hardened derivation (using the parent public key). Includes an Ed25519 enforcement
  check — Solana wallets can only use hardened paths.

- **Solana Flow — explains how real wallet apps derive keys**: Step 1 now explains how Phantom,
  Solflare, and other Solana wallets actually work: BIP-39 mnemonic → PBKDF2 seed → SLIP-0010
  hardened derivation at `m/44'/501'/0'/0'`. The demo generates the same Ed25519 seed directly
  via the HSM; all signing steps from there are identical to a real wallet.

- **Solana Flow — Ed25519 public key format explained**: Step 2 now explains that the HSM returns
  the public key wrapped in a DER/SPKI envelope (not raw bytes), and why PKCS#11 v3.2 requires
  this format for portability across hardware vendors. The raw 32-byte key is extracted from the
  end of the structure.

- **CRL Generator — revocation reasons and human-readable output**: The CRL generator now lets
  you choose from all 8 RFC 5280 revocation reason codes (e.g. keyCompromise, superseded,
  cessationOfOperation) when revoking a certificate. The output panel shows both the PEM and a
  parsed human-readable view side-by-side.

- **PKI Workshop — NIST security level shown next to algorithm picker**: When selecting an
  algorithm in Root CA Generator, the selector now shows the corresponding NIST security level
  (e.g. "NIST Level 3 — ~AES-192 security") so you know what protection level you're choosing.

- **PKI Workshop — ML-DSA and SLH-DSA labels updated to final standard names**: Algorithm labels
  previously said "(Dilithium)" — they now say "(FIPS 204)" and "(FIPS 205)" to reflect the
  final published NIST standards.

- **Cert Parser — fingerprint, CSR verify, and CRL verify**: The certificate parser now computes
  a SHA-256 fingerprint for any loaded certificate. It also verifies CSR self-signatures and
  validates CRL signatures against a Root CA from your session — with auto-detection of whether
  the pasted input is a certificate, CSR, or CRL.

- **Hybrid Cert Formats — generated PEMs flow into Cert Parser and OpenSSL Studio**: After
  generating a hybrid certificate (SLH-DSA, ML-DSA, composite, or dual), the PEM file is
  automatically added to the OpenSSL Studio virtual filesystem. You can immediately paste it into
  Cert Parser or use it in OpenSSL Studio without any copy-paste.

- **New in-app glossary tooltips for Solana transaction concepts**: Added tooltips for Program-
  Derived Addresses (PDA), fee payers, the System Program, compact-u16 encoding, ECDSA nonce
  risks, and DER signature encoding — inline wherever these concepts appear in the flows.

- **Blockchain Playground tools marked production-ready**: The "WIP" badge has been removed from
  Bitcoin Transaction, Solana Transaction, and HD Wallet in the Playground. All three flows are
  fully functional.

### Fixed

- **PKCS#11 log panel — step header now appears above its commands**: Previously the log was
  strictly newest-first, which put the step label below the calls that belonged to it. Each step's
  header now correctly leads its group of commands, while newer steps still appear at the top.

- **Step results accumulate newest-first**: Results shown after completing each step were
  appending below older results (oldest at top). They now prepend above, matching the log panel
  and making the most recent output the first thing you see.

- **TLS comparison table — ML-DSA-65 signature size corrected**: The algorithm size table in TLS
  Basics was showing 3,293 B for ML-DSA-65 signatures. The correct FIPS 204 value is 3,309 B.

- **TLS Introduction — SLH-DSA-SHA2-128s signature size now shows exact byte count**: The
  description now reads "~7.9 KB (7,856 B)" rather than just the approximate figure.

- **TLS Handshake Diagram — removed misplaced encryption boundary marker**: The "Encrypted from
  here" label was positioned incorrectly relative to the actual TLS handshake message sequence
  and has been removed to avoid teaching the wrong concept.

- **Internal: PKCS#11 `CKA_PUBLIC_KEY_INFO` constant corrected**: The attribute code was set to
  `0x248` instead of the correct `0x129` per the PKCS#11 v3.2 specification. This affected public
  key retrieval for Ed25519 keys in the Bitcoin and Solana flows.

## [2.90.0] - 2026-04-07

### Added

- **MTC Workshop — shared tree state across Steps 1→2→3**: Steps 1, 2, and 3 now share a
  continuous Merkle tree. When a tree is built in Step 1, `MerkleWorkshopSteps` captures it via
  `onTreeBuilt` callback and passes `sharedLevels`/`sharedCerts` to both `InclusionProofGenerator`
  (Step 2) and `ProofVerifier` (Step 3). Each step shows a "Your tree from Step 1 is loaded"
  callout and adapts its button label (e.g. "Build Tree with 8 Certificates from Step 1"). Steps
  fall back to 8 sample certificates when no prior tree is present.
- **MTC Workshop — Landmark MTC column in Step 4 size comparison**: `SizeComparison` now shows a
  third column alongside Traditional X.509 and Standalone MTC — Landmark MTC (proof + metadata
  only, zero embedded signatures). Includes reduction badge for both standalone and landmark modes.
- **MTC Workshop — Step 4→5 bridge text**: `SizeComparison` description now ends with "In Step 5,
  you'll see the CA sign a real Merkle root with ML-DSA-44 — that single signature is what makes
  these size savings possible." `CTLogSimulator` adds a "Bringing it together" paragraph at the top
  of the Submission panel connecting Steps 1–4 to the live PKCS#11 signing demo.
- **MTC Workshop — production-use context in ProofVerifier**: Added explanatory sentence that in
  the MTC model the inclusion proof is embedded in the certificate and used by relying parties to
  verify batch inclusion without downloading the full tree.
- **MTC Workshop — padding divergence disclosure**: `MerkleTreeBuilder` now shows an amber callout
  when the leaf count is not a power of two, explaining the simplified duplicate-last-leaf padding
  vs. RFC 9162 §2.1.2's unbalanced binary tree and noting the root hashes will differ.
- **MTC — Landmark MTC functions in `mtcConstants.ts`**: Added `mtcLandmarkChainSize()`,
  `landmarkReductionPercent`, `mtcLandmark`, and `mtcLandmarkTotal` fields to `SizeBreakdown`
  and `getSizeBreakdown()`. `mtcChainSize()` now accepts an optional `proofBytes` parameter.

### Fixed

- **MTC Workshop — KAT signing spec corrected**: `MerkleTreeBuilder` KAT for tree-root signing
  was incorrectly referencing SLH-DSA (FIPS 205). Fixed to ML-DSA-44 (FIPS 204) with
  `kind: { type: 'mldsa-functional', variant: 44 }` — matching the actual CT Log simulator which
  signs with ML-DSA-44 via SoftHSMv3.
- **MTC Workshop — ECDSA standalone savings corrected**: Static text in `MTCExercises` and
  `rag-summary.md` now correctly states ~3% standalone savings for ECDSA P-256 (was incorrectly
  ~15% after a prior round of fixes). Arithmetic: traditional 1,225 B → standalone 1,193 B = 2.6%.
- **MTC Workshop — SCT count and traditional total corrected**: `MTCIntroduction` static table
  footnote corrected from "4 SCTs (476 B)" to "2 SCTs (238 B)". Traditional ML-DSA-44 total
  corrected from 12,272 B to 12,034 B throughout all static text.
- **MTC Workshop — ML-DSA-44 savings corrected to 60%**: All static text references ("61%",
  "62%") unified to 60% matching `getSizeBreakdown()` output.
- **MTC Workshop — `PROOF_VERIFIER_CERTS` stabilised with `useMemo`**: The derived cert list in
  `ProofVerifier` was recomputed as a new array reference on every render, causing `handleSetup`
  (which had it in its `useCallback` deps) to be recreated unnecessarily. Wrapped in `useMemo`.
- **MTC Workshop — "Step 1 — Generate CA Key" label conflict**: Label inside `CTLogSimulator`
  SubmissionPanel renamed to "Generate CA Key" to avoid collision with the workshop's global Step 1.
- **MTC Workshop — CA key label now includes size**: `CTLogSimulator` registers the CA public key
  with label "CT Log CA Public Key (ML-DSA-44, 1,312 B)" in the key inspector.
- **MTC Workshop — Step 1 stats bar clarified**: Bar label updated to "3× ML-DSA-44 Sigs (sig
  bytes only)" and footnote updated to direct users to Step 4 for the full chain breakdown.
- **MTC Workshop — draft status disclosed**: `MTCIntroduction` IETF section now includes an amber
  "Draft — not yet an RFC" badge and a timeline note: "Status: Active IETF draft — not yet
  standardized as an RFC. Not recommended for production deployment without vendor support."

## [2.89.5] - 2026-04-07

### Fixed

- **Playground — 5G SUCI Profile C hybrid mode URL sync**: Profile C now always sets
  `?pqcMode=hybrid` explicitly in the URL (previously omitted, causing the Hybrid button
  to appear unselected). All four states now have fully explicit URLs:
  - `/playground/suci-flow?profile=A` — Profile A
  - `/playground/suci-flow?profile=B` — Profile B
  - `/playground/suci-flow?profile=C&pqcMode=hybrid` — Profile C hybrid
  - `/playground/suci-flow?profile=C&pqcMode=pure` — Profile C pure PQC
- **Playground — fixed race condition on Profile C switch**: `changeProfile('C')` was
  calling both `onProfileChange` and `onPqcModeChange`, triggering two concurrent
  `setSearchParams` calls that could race and revert the profile update. Suppressed
  the second call — `handleProfileChange` in `SuciFlowRoute` atomically sets both
  `profile=C` and `pqcMode=hybrid` in a single update.
- **Playground — SuciFlow pqcMode state sync**: Added `useEffect` in `SuciFlow` to
  keep internal `pqcMode` in sync with the `initialPqcMode` prop when the same component
  instance is reused across profile switches (React key reuse).
- **Playground — SuciFlowRoute extracted to dedicated file**: Moved inline `SuciFlowRoute`
  out of `workshopRegistry.tsx` lazy callback into `src/components/Playground/SuciFlowRoute.tsx`,
  fixing hook instability under React StrictMode.

## [2.89.4] - 2026-04-07

### Fixed

- **Playground — 5G SUCI URL stays in sync when switching profiles/modes**: `SuciFlowRoute`
  now uses `useSearchParams` to both read initial values and write back changes via
  `onProfileChange` / `onPqcModeChange` callbacks. Switching Profile A→B→C updates
  `?profile=` in the URL in real time. Profile A (default) keeps a clean URL with no
  param. `pqcMode=pure` is written only when Profile C pure is active; hybrid (default)
  removes the param. All changes use `replace: true` to avoid polluting browser history.

## [2.89.3] - 2026-04-07

### Fixed

- **Playground — suci-flow deep-link actually works now**: `suci-flow` was registered
  in `ONBACK_COMPONENTS` via `makeLazyWithOnBack`, whose `WorkshopWrapper` only forwards
  `onBack` — dropping `initialProfile` and `initialPqcMode`. Moved `suci-flow` to
  `TOOL_COMPONENTS` as a self-contained `SuciFlowRoute` wrapper that reads `?profile=`
  and `?pqcMode=` from the URL directly and passes them to `SuciFlow`.

## [2.89.2] - 2026-04-07

### Added

- **Playground — 5G SUCI deep-link profile/pqcMode support**: `PlaygroundToolRoute`
  now reads `?profile=` and `?pqcMode=` from the URL and passes them to `SuciFlow`
  as `initialProfile` / `initialPqcMode`. Direct URLs now work from Playground:
  - `/playground/suci-flow` → Profile A (default)
  - `/playground/suci-flow?profile=B` → Profile B
  - `/playground/suci-flow?profile=C` → Profile C hybrid
  - `/playground/suci-flow?profile=C&pqcMode=pure` → Profile C pure PQC

## [2.89.1] - 2026-04-07

### Fixed

- **5G SUCI — deep-link URL now actually updates in the browser**: `getModuleDeepLink`
  was called without `validTabs`, so the default list contained `'workshop'` instead
  of `'simulate'`. A direct load with `?tab=simulate&profile=C` fell back to `'learn'`,
  leaving `activeTab !== 'simulate'` and suppressing the URL sync effect. Fixed by
  passing the correct `validTabs` array explicitly.

## [2.89.0] - 2026-04-07

### Fixed

- **5G SUCI — Profile C pure PQC no longer shows hybrid code snippets**: Step 1
  (Home Network Key Generation) and Step 5 (Compute Shared Secret) now display
  pure-PQC-specific code when `pqcMode === 'pure'`. Step titles are also patched
  to reflect the pure mode context. The static `SUCI_STEPS_C` array defaults to
  hybrid; overrides are applied in `SuciFlow` at the step-mapping layer.

### Added

- **5G SUCI — deep-link URL encodes profile and pqcMode**: The URL now reflects
  the active profile and PQC mode when on the SUCI Workshop tab:
  - Profile A: no `?profile=` param (default)
  - Profile B: `?tab=simulate&profile=B`
  - Profile C hybrid: `?tab=simulate&profile=C`
  - Profile C pure PQC: `?tab=simulate&profile=C&pqcMode=pure`
    Navigating to any of these URLs restores the correct profile and mode
    immediately. The Share button picks up the live URL, so shared links land
    directly on the right profile/mode combination.

## [2.88.0] - 2026-04-07

### Fixed

- **VPN Simulation — C_CloseSession and C_Verify now emit RPC log entries**: The IKEv2 responder
  thread previously dispatched no log for `C_CloseSession` (cmd 13) or `C_Verify` (cmd 49); both
  now call `strongSwanEngine.dispatchLog` so the RPC trace is complete. `C_Verify` log level is
  `error` when `rv !== 0` for immediate visibility of failed signature checks.

- **VPN Simulation — PKCS#11 log panel no longer shows bookkeeping operations**: `C_GetAttributeValue`,
  `C_Finalize`, `C_Logout`, and `C_FindObjectsFinal` are now filtered from the HSM log panel via a
  `VPN_LOG_SKIP` set. These are internal plumbing calls with no educational value; key-extraction
  detail is already captured in the crypto-op log entries above.

### Data

- **Compliance — ANSSI catalog re-scraped**: `compliance-data.json` refreshed (2,386 records); ANSSI
  catalog hash updated to reflect the latest product catalog state.

- **RAG corpus updated**: 5,818 chunks (was 5,817).

## [2.87.0] - 2026-04-07

### Added

- **5G SUCI — Profile B (P-256) dedicated step content**: Profile B now has its own `SUCI_STEPS_B`
  constant with step titles, descriptions, and code snippets tailored to P-256 (secp256r1) —
  previously it displayed Profile A (X25519) labels throughout.

- **5G SUCI — Profile B compressed key encoding**: The scheme output for Profile B now uses the
  33-byte COMPRESSED P-256 ephemeral public key (02/03 prefix + x-coordinate) per TS 33.501
  Annex C.4, down from 65 bytes. ECDH inside the HSM still uses the full uncompressed form.

- **5G SUCI — educational content: compressed vs uncompressed EC point encoding**: Steps 9, 10
  and terminal output for Profile B now show both encoding forms side by side, explaining when each
  is used and why. Includes the application-layer compression formula (no `C_CompressECPoint` in
  PKCS#11) and how the SIDF recovers y via the P-256 curve equation y²=x³−3x+b (mod p).

- **5G SUCI — PKCS#11 mechanism accuracy**: Code snippets for all X25519 operations now correctly
  cite `C_DeriveKey(CKM_EC_MONTGOMERY_KEY_DERIVE)` per PKCS#11 v3.2, distinguishing it from
  `CKM_ECDH1_DERIVE` which applies to Weierstrass curves (P-256/P-384). Affected: Profile A
  step 5, Profile A step 11, Profile C hybrid steps 5 and 11.

### Fixed

- **5G SUCI — profile transitions always reset to step 1**: Switching between Profile A → B → C
  (hybrid) → C (pure) now lands on step 1 each time. The `useStepWizard` hook gained a `reset()`
  method called at all transition sites (onClick handlers and `onComplete`).

- **5G SUCI — profile state set before every step executes**: `fiveGService.state.profile` is now
  assigned at the top of every `executeStep` call, preventing `computeMAC` and
  `visualizeStructure` from seeing a stale or undefined profile on early steps.

- **5G SUCI — B→C transition no longer double-cleans**: `changeProfile('C')` now internally sets
  `pqcMode` to `'hybrid'`, so `onComplete` can call it once without a redundant `changePqcMode`.

## [2.85.0] - 2026-04-07

### Added

- **5G SUCI — Profile C visualization corrected**: The SUCI structure panel now correctly shows
  the hybrid Profile C output format — the scheme output starts with the ML-KEM ciphertext, not
  an ephemeral key. The abbreviated SUCI string and description both reflect the actual
  `kemCiphertext ‖ msinCiphertext ‖ macTag` layout per 3GPP TS 23.003.

- **Library — 3 new records with proper titles and download links**:
  - _Study of Post Quantum Status of Widely Used Protocols_ (Cisco Research, arXiv 2603.28728, Mar 2026) — PQC migration survey across TLS, IPsec, BGP, DNSSEC, SSH, QUIC, OpenID Connect, OpenVPN, and Signal.
  - _Securing Elliptic Curve Cryptocurrencies against Quantum Vulnerabilities_ (Google Quantum AI + Ethereum Foundation, Mar 2026) — new resource estimates for breaking secp256k1 with a quantum computer; on-spend attack analysis.
  - _Protecting Subscriber Identifiers with SUCI_ (NIST CSWP 36A ipd, Aug 2024) — NIST guidance on enabling 5G subscriber identity concealment to prevent IMSI-catching.

- **5G SUCI — removed WIP badge**: The 5G SUCI Construction tool is now complete and no longer
  marked as Work in Progress in the Playground.

### Fixed

- **5G SUCI — HSM and OpenSSL cross-check now agree on key derivation**: The dual-engine
  comparison was previously using different ephemeral key bytes for the KDF — the HSM used its
  internal EC point while OpenSSL used an SPKI-wrapped version. The HSM key bytes are now synced
  into the shared state before derivation runs, so both engines produce matching output.

- **HSM — AES-GCM per-message encrypt/decrypt enabled on Rust engine**: The per-message AEAD
  functions (`C_MessageEncryptInit`, `C_EncryptMessage`, etc.) are now fully wired to the Rust
  WASM engine, which implements them in softhsmv3 v0.4.10. Previously they returned an error.

## [2.84.0] - 2026-04-07

### Added

- **VPN Simulation — SKEYSEED key derivation step**: After the ML-KEM shared secret is verified,
  a new panel shows exactly how IKEv2 derives the session master key (SKEYSEED) — using
  `prf(Ni ‖ Nr, shared_secret)` with the actual KEM secret bytes displayed. Pure-PQC and hybrid
  modes each show their respective PRF inputs. References RFC 9370 and the ML-DSA IKEv2 draft.

- **VPN Simulation — IKE exchange phase labels on logs**: Each line in the charon.log panel is now
  tagged with its IKE exchange phase (SETUP / IKE_SA_INIT / IKE_INTERMEDIATE / IKE_AUTH). This
  makes it easy to see where ML-KEM fits into the handshake — encapsulation happens during
  IKE_INTERMEDIATE in hybrid mode, IKE_SA_INIT in pure-PQC mode.

- **VPN Simulation — payload size note**: A callout explains that PQC key exchange payloads are
  10–16× larger than classical ECDH (ML-KEM-768 public key: 1,184 bytes vs P-256: 64 bytes),
  and why IKEv2 uses the IKE_INTERMEDIATE exchange to handle the extra fragmentation load.

- **VPN Simulation — QKD toggle clarified**: The QKD PSK option now shows
  "(informational — not simulated)" so it is clear this is a display label, not an active feature.

### Fixed

- **5G SUCI — dual-engine comparison uses real HSM output**: The encrypted MSIN and MAC tag
  shown in the comparison panel now come directly from the HSM rather than the parallel
  OpenSSL computation, giving an accurate side-by-side result. The MAC tag is correctly
  truncated to 8 bytes per 3GPP TS 33.501.

- **5G SUCI Profile C — KEM ciphertext carried forward correctly**: The HSM-produced ML-KEM
  ciphertext is now stored in the shared state after the key encapsulation step, so downstream
  SUCI assembly and visualization use the real ciphertext.

- **Stateful Signatures — default message aligned across panels**: Both the XMSS key generation
  demo and the Stateful Signatures workshop now default to `"Hello, world!"`, making cross-engine
  verification work without any manual input change.

## [2.83.0] - 2026-04-07

### Added

- **VPN Simulation — full IKEv2 + ML-KEM-768 handshake working end-to-end**: The VPN simulator
  now completes a real PKCS#11-based ML-KEM-768 key encapsulation through the HSM, including
  key generation, encapsulation, shared secret extraction, and SKEYSEED derivation. This is the
  first full IKEv2 post-quantum handshake running entirely inside the browser HSM.

### Fixed

- **VPN Simulation — engine stability**: Switched back to the C++ HSM engine for VPN simulation
  after finding that the Rust WASM engine has compatibility issues in the browser's secure context
  that prevent it from running correctly in this scenario.

- **HSM — encapsulation bug fixed in softhsmv3**: A bug in the C++ HSM engine caused key
  encapsulation to return an error when reading standard key attributes. The WASM binary has been
  updated with the fix.

- **HSM — 8 additional Rust engine functions now active**: Pre-bound signature verification
  (`C_VerifySignatureInit/Final/Update`) and PKCS#11 v3.2 session functions that were previously
  disabled are now fully wired to the Rust engine.

## [2.82.0] - 2026-04-06

### Added

- **5G SUCI — 3GPP TS 33.501 reference vectors modal**: A "Reference Vectors" button on the SUCI
  flow panel opens an expandable modal with the official 3GPP TS 33.501 Annex C.4 test vectors
  for Profile A (X25519) and Profile B (P-256) — including home network keys, ephemeral keys,
  scheme output breakdown (EphPub ‖ Ciphertext ‖ MAC), and copyable hex fields.
- **Profile C hybrid mode — full TR 33.841 §5.2.5.2 implementation**: Hybrid Profile C now
  generates two separate HN keypairs (ML-KEM-768 + X25519), derives Z_ecdh via ECDH and Z_kem
  via ML-KEM encapsulation, then combines them as `Z = SHA256(Z_ecdh ‖ Z_kem)` inside the HSM
  using `C_Digest`. Key derivation uses ANSI X9.63-KDF with SHA3-256 producing AES-256 + HMAC-SHA3-256 keys.
- **Stateful Signatures — cross-engine sign and verify**: The Stateful Signatures workshop can now
  sign on the Rust engine and verify on the C++ engine. Public key bytes are cached at generation
  time, imported into the C++ session via `C_CreateObject`, and verified with `C_VerifyInit` /
  `C_Verify`. Includes tamper-detection toggles (flip message / flip signature) and a live
  verification result indicator.
- **VPN Simulation — RSA-3072 certificate generation and inspection**: The VPN panel now generates
  a real RSA-3072 key pair via the HSM, constructs a TBS certificate using `@peculiar/asn1-x509`,
  signs it with `C_Sign` (SHA256withRSA), and shows a certificate inspector modal with full field
  breakdown. A warning badge notes that RSA-3072 is classical (not quantum-safe) per
  draft-ietf-ipsecme-ikev2-mldsa.

### Changed

- **5G SUCI — spec-correct ANSI X9.63-KDF replaces HKDF**: Key derivation now follows 3GPP TS
  33.501 §C.3.3 exactly — `block1 = SHA-256(Z ‖ 0x00000001 ‖ sharedInfo)`,
  `K_enc = block1[0:16]`, `K_mac = block1[16:] ‖ block2[0:16]`. HKDF was never in the 3GPP spec.
- **5G SUCI — AES-128-CTR with zero IV (was AES-GCM)**: MSIN encryption now uses AES-128-CTR per
  TS 33.501 §C.3.3 with a zero 16-byte IV. BCD encoding (nibble-swap per TS 23.003) applied to
  MSIN digits before encryption.
- **5G SUCI — authenticate-then-decrypt at SIDF**: The SIDF decryption step now verifies the
  MAC before decrypting — SUCI is rejected if the tag does not match. MSIN BCD decoding and
  full SUPI reconstruction are shown in the result panel.
- **HSM slot initialization — reuses existing slot on conflict**: The HSM context no longer
  crashes with "no free slot" when all slots are already initialized (e.g. Playground page
  reopened without reload). It now falls back to the first initialized slot automatically.
- **softhsmv3 WASM updated**: C++ engine (v0.4.8+) and Rust engine rebuilt with latest
  softhsmv3 changes.

## [2.81.1] - 2026-04-06

### Fixed

- **VPN Simulation works on the live site**: The VPN simulation panel was showing "SharedArrayBuffer disabled" and blocking the simulation on the production deployment. Fixed by injecting the required Cross-Origin Isolation headers through the PWA service worker — the simulation now works in Chrome and Edge with no action required from users. (Safari is not affected; this was a Chrome/Edge-only production issue.)

## [2.81.0] - 2026-04-06

### Added

- **Download hybrid certificates**: Each certificate card in the Hybrid Cryptography workshop now has a download button alongside the copy button. Save the certificate as a `.pem` file or as a `.txt` file depending on the active view.

### Changed

- **5G SUCI flow matches the real spec**: The SUCI encryption and MAC steps now correctly reuse key material derived in the HKDF step, matching 3GPP TS 33.501. The key family label was corrected from "ML-KEM (Kyber)" to "ML-KEM (FIPS 203)".
- **Envelope Encryption — accurate sizes and wrap overhead**: The PQC column always shows correct ML-KEM reference sizes regardless of which key-encryption algorithm is selected. AES-KWP wrap overhead corrected to 48 bytes (per RFC 5649 §4.2).
- **Bitcoin Playground — pure HSM path**: The Bitcoin key derivation flow no longer relies on OpenSSL — all operations now run entirely through the in-browser PKCS#11 HSM.
- **Firmware Signing wizard**: The Firmware Signing step wizard now uses the same step-wizard UI pattern as other workshops for a consistent experience.
- **Key Derivation panel labels**: KBKDF entries now include the spec revision date ("SP 800-108 Rev1 (Aug 2022)"); PBKDF2 use-case description updated to "low-entropy key stretching".

### Data

- **RAG corpus regenerated**.

## [2.80.0] - 2026-04-05

### Added

- **Algorithm region and status filters**: Filter PQC algorithms by geopolitical region (NIST/US, IETF/Global, BSI/ANSSI/Europe, ETSI, KpqC/Korea, CACR/China) or certification status (Certified, Candidate, To Be Checked). Region and Status columns added to the algorithm comparison table. Multivariate and Isogeny families added to the crypto-family filter.
- **Algorithm implementations**: A code icon on each algorithm card opens a list of open-source reference implementations and libraries, with direct links to Migrate catalog entries and Library references.
- **Work-in-progress badges on Playground tools**: Tools currently under development show an orange Wrench badge. WIP tools are hidden by default — use the new WIP filter to show or exclusively view them.
- **Migrate WIP filter**: Products currently under review are hidden by default in the Migrate catalog. A new WIP filter lets you include or exclusively show them.
- **XMSS deterministic keygen test**: A known-answer test (KAT) for XMSS-SHA2_10_256 verifies that key generation is fully reproducible — the same seed always produces the same key pair.

### Changed

- **VPN Simulation — isolated HSM slot management**: VPN slot initialization is now independent of other HSM panels, preventing conflicts when multiple Playground tools are open simultaneously.
- **Hybrid Encryption Demo**: Redesigned from a tab-based UI to a guided 5-step wizard for a clearer, more linear walkthrough.
- **SLH-DSA sign panel**: Streamlined interface — pre-hash mechanism labels, PKCS#11 log, and key inspector are now shown inline without extra navigation.

### Removed

- **Standalone SLH-DSA demo**: Removed a duplicate SLH-DSA demo that was redundant with the unified HSM Sign & Verify panel.

### Data

- New algorithm reference data with Region and Status fields.
- New algorithm implementations cross-reference.
- RAG corpus regenerated.

## [2.79.0] - 2026-04-05

### Fixed

- **Stateful Signatures workshop — key generation no longer crashes**: LMS and XMSS key generation was hitting an internal error. Both now use the Rust WASM engine, which handles these algorithms correctly.

## [2.78.0] - 2026-04-05

### Added

- **VPN simulation — all crypto through the in-browser HSM**: ECDH key exchange and random number generation during the IKEv2 handshake now run entirely through the in-browser SoftHSMv3 PKCS#11 module. OpenSSL is no longer used for IKE crypto — every cryptographic operation is visible in the PKCS#11 log.
- **Complete LMS/LMOTS parameter support**: Expanded from 9 to the full IANA registry — 20 LMS parameter sets and 16 LMOTS parameter sets, covering all SHA-256, SHA-256/24, SHAKE, and SHAKE/24 variants with correct signature size tables.

### Fixed

- **LMOTS W4 signature size lookups corrected**: The wrong constant value for the W4 Winternitz parameter was causing incorrect signature size calculations. Fixed to match the IANA registry.

### Data

- RAG corpus regenerated.

## [2.77.0] - 2026-04-05

### Added

- **VPN Simulation with ML-KEM-768**: A complete IKEv2 handshake now runs entirely in your browser — no server required. Two Web Worker instances of strongSwan 6.0.5 (initiator and responder) negotiate a post-quantum secure tunnel using ML-KEM-768 key exchange, completing IKE_SA_INIT and IKE_AUTH across 4 packets. Watch every PKCS#11 call, packet exchange, and key agreement step in real time.
- **Configurable VPN pre-shared key**: Set your own PSK for both the client and server sides. A mismatch warning appears when the keys differ, mirroring what happens in a real IKEv2 deployment when authentication fails.
- **Stateful Hash-Based Signatures Workshop**: LMS, HSS, and XMSS key generation and signing now run through the in-browser PKCS#11 HSM. Remaining signature capacity is tracked live — H5 trees are limited to 32 signatures, matching the real-world constraint on stateful schemes.

### Fixed

- **VPN simulation no longer crashes on start**: Fixed a threading incompatibility in the strongSwan WASM build that caused an "Unreachable" crash in single-threaded Emscripten mode.

### Data

- **strongSwan product entry updated**: ML-DSA experimental support added with 5 verified source URLs. Validation status: VALIDATED.
- **RAG corpus regenerated**.

## [2.76.0] - 2026-04-02

### Added

- **Collapsible Analysis section in the Gantt chart modal**: Clicking a Gantt bar now shows an "expand ▾ / collapse ▴" toggle when enrichment data is available. The collapsed state shows the main topic with mandate/urgency/sector badges; expanding reveals the full `TimelineAnalysisPanel` with all 8 enrichment dimensions. The panel resets to collapsed whenever a new bar is opened.

### Changed

- **Unified bookmark icon across all pages**: All "My" toggle buttons (Library, Compliance, Threats, Playground, Timeline, Migrate) now use `BookmarkCheck` (active) and `Bookmark` (inactive) from lucide-react, replacing the former `CheckSquare`/`Square` pattern for a consistent metaphor throughout the app.
- **Migrate catalog table cleanup**: Removed the redundant "My" and "Hide" columns from the table view. The Bookmark column now drives the "My" filter (same `useMigrateSelectionStore`), so bookmarking a product in the table immediately adds it to the My selection. The Compare column was updated to use the `Scale` icon.
- **My filter connected to bookmark store (Migrate)**: The bookmark action in both the card grid and the table now writes to `useMigrateSelectionStore` (`myProducts`). The "My (N)" filter button is now positioned on the right side of the toolbar, grouped with the view toggle.
- **Stack view collapses empty layers when My filter is active**: In Infrastructure Stack and CISA Stack views, layers with zero matching products are automatically hidden when the My filter (or a vendor filter) is active, reducing visual noise. Layers reappear when the filter is cleared.
- **BookmarksPanel uses unified product store**: The Migrate section in the Bookmarks right panel now reads from `useMigrateSelectionStore.myProducts` instead of the deprecated `migrateBookmarks` field. Clear All wipes selections across all sections including Migrate. JSON and CSV export include the product name extracted from the `name::categoryId` key format.
- **Export CSV button icon-only**: The "Export CSV" text label was removed from the Gantt chart toolbar; only the download icon remains.

## [2.75.0] - 2026-04-02

### Added

- **ACVP tests 23 & 24 — X25519/X448 ECDH round-trip**: The HSM ACVP compliance suite now covers Montgomery-curve Diffie-Hellman. Test 23 generates two X25519 keypairs, derives shared secrets from each side, and asserts they match. Test 24 does the same for X448. Both tests run on both the C++ and Rust engines in dual-mode (40 total assertions). A `extractMontgomeryPubKey` helper abstracts the engine difference: Rust stores raw bytes in `CKA_VALUE`; C++ stores a DER-wrapped point (`04 len raw`) in `CKA_EC_POINT`.
- **ACVP test 25 — X9.63 KDF with SHA3-256 / SHA3-512 (PKCS#11 v3.2 §5.2.12)**: Verifies `C_DeriveKey(CKM_ECDH1_DERIVE, CKD_SHA3_256_KDF)` and `C_DeriveKey(CKM_ECDH1_DERIVE, CKD_SHA3_512_KDF)` produce matching derived keys on both engines. Constants `CKD_SHA3_256_KDF = 0x0B` and `CKD_SHA3_512_KDF = 0x0D` are now exported from `softhsm/constants.ts`.
- **`hsm_pqcEncap` / `hsm_pqcDecap` wrappers (PKCS#11 v3.2 §6.3)**: String-variant API (`'ML-KEM-512' | 'ML-KEM-768' | 'ML-KEM-1024'`) over the existing `hsm_encapsulate` / `hsm_decapsulate` functions, for compatibility with the 5G SUCI Profile C UI layer.
- **`hsm_generateX25519KeyPair`**: PKCS#11 v3.2 compliant X25519 keypair generation via `CKM_EC_MONTGOMERY_KEY_PAIR_GEN` with `CKA_DERIVE=true` on the private key. Exported from `src/wasm/softhsm/classical.ts`.
- **`hsm_importECPrivateKey`**: Injects an EC private key scalar into the HSM via `C_CreateObject` for use in GSMA SUCI known-answer test injection. Supports P-256, P-384, P-521. Includes an inline warning documenting the `C_UnwrapKey` path that real hardware HSMs require.
- **`DerivedKeyProfile` interface + `buildDerivedKeyTemplate`**: Flexible PKCS#11 v3.2 attribute builder for `C_DeriveKey` templates. Replaces hardcoded `CKK_GENERIC_SECRET` templates in `hsm_ecdhDerive` and `hsm_ecdhCofactorDerive` — callers now pass a profile (`{ keyLen, derive, encrypt, decrypt, … }`) that maps 1-to-1 to `CKA_*` entries. Unspecified optional attributes are omitted from the template per §4.1.
- **ML-KEM keygen and import: optional `CKA_LABEL` support**: `hsm_generateMLKEMKeyPair` and `hsm_importMLKEMPublicKey` accept an optional `label` string that is stored in `CKA_LABEL` when provided. Template attribute counts are now dynamic (not hardcoded) so labels do not cause `CKR_TEMPLATE_INCONSISTENT`.
- **GSMA TS 33.501 Annex C.4 Profile B KAT**: Known-answer test vectors for 5G SUCI Profile B (P-256 ECDH + AES-128-CTR + HMAC-SHA-256 deconcealment) sourced directly from 3GPP TS 33.501. Stored in `src/data/kat/gsma_suci_ts33501_annex_c.json`. KAT runner extended with `suci-profile-b` test type covering 7 discrete steps (key import, ECDH, KDF, encrypt, MAC, end-to-end).
- **5G SUCI dual-engine output viewer**: The SUCI flow workshop panel now shows a tabbed output view — **SoftHSM3 (KAT)**, **OpenSSL Engine**, and **GSMA Vector Validation** — whenever a step produces dual-engine output. The GSMA tab renders the TS 33.501 Annex C reference value alongside the SoftHSM3 result and marks a pass/fail indicator.
- **Threats dashboard multi-view mode**: The Threats page now supports three view modes — **Table** (existing), **Cards** (new compact card grid), and **Industry Stack** (layered stack grouped by industry sector with inline table expansion). A view-mode toggle appears in the desktop header; the active mode is synced to the URL (`?mode=`). New components: `ThreatsCardGrid`, `ThreatsTable`, `ThreatsViewToggle`, `IndustryStack`, `ThreatCard`, `threatsHelper`.
- **Leaders sector stack view**: The Leaders page gains a **Sector Stack** view mode alongside the existing card grid. The stack groups leaders by organisation type (Government, Industry, Academia) with per-layer card expansion. A `LeadersViewToggle` and `SectorStack` component are introduced; the active mode is URL-synced.

### Fixed

- **`CKK_EC_MONTGOMERY` value corrected to `0x41`** (was `0x45`): The wrong constant caused `CKR_TEMPLATE_INCONSISTENT (0xD1)` on every X25519 and X448 keygen call to the C++ engine. Fixed in `src/wasm/softhsm/constants.ts` per PKCS#11 v3.2 pkcs11t.h (`CKK_EC_EDWARDS=0x40`, `CKK_EC_MONTGOMERY=0x41`).

### Changed

- **softhsm-wasm C++ engine rebuilt (0.4.3)**: `public/wasm/softhsm.{js,wasm}` rebuilt from source. Fixes `CKR_MECHANISM_PARAM_INVALID` on `C_DeriveKey` when `CKD_SHA3_256_KDF` or `CKD_SHA3_512_KDF` is requested — the KDF validation block in `SoftHSM_keygen.cpp::deriveEDDSA` / `deriveEC` now explicitly accepts both SHA3 KDF variants (PKCS#11 v3.2 §5.2.12).
- **softhsm-wasm Rust engine rebuilt (0.4.3)**: `public/wasm/rust/softhsmrustv3.{js,d.ts,_bg.wasm}` rebuilt with `CKD_SHA3_256_KDF` / `CKD_SHA3_512_KDF` constants in `constants.rs` and SHA3 dispatch arm in the X9.63 KDF block in `ffi.rs`.
- **`HsmKeyInspector` display names updated**: `CKK_EC_MONTGOMERY (0x41)` and `CKM_EC_MONTGOMERY_KEY_PAIR_GEN (0x1056)` now render their symbolic names in the key attribute inspector panel instead of showing raw hex.

### Data Sources

- **Product catalog updated** (`pqc_product_catalog_04022026_r1.csv`): April 2026 r1 revision.
- **Library updated** (`library_04022026.csv`): April 2026 snapshot.

## [2.74.0] - 2026-04-01

### Changed

- **Compliance Module Refactoring**: The compliance view has been fully unified across mobile and desktop. The nested tab hierarchy was removed in favor of a single `ComplianceTable` component that dynamically utilizes CSS grid arrays to render cards on mobile viewports and a horizontal data-table on desktop viewports.
- **Global Filter Consolidation**: Filter menus have been refactored out of table headers and consolidated into a persistent Active Filters bar (desktop) and a `MobileFilterDrawer` (mobile) to significantly enhance usability and discoverability on smaller screens.
- **Resilient UI Testing**: E2E validation scripts for the compliance module have been updated to support the new flat responsive hierarchy.

## [2.73.0] - 2026-04-01

### Added

- **CISA Stack view for the Migrate catalog**: A new "CISA Stack" view mode organises the product catalog into the 15 CISA-designated critical infrastructure categories (Cloud Services, Networking Hardware/Software, Endpoint Security, ICAM, Telecom, Storage, and more). Switch between the enterprise layer stack and the CISA taxonomy using the view toggle at the top of the Migrate page.
- **PQC readiness progress bars in Infrastructure Stack**: Every layer card now shows a compact colour-coded progress bar breaking down products into Established (green), In Progress (amber), and No Capability (grey) based on their PQC support status. An overall readiness summary bar appears above the stack when no layer is selected.
- **License type filter in Migrate catalog**: A new "All Licenses" dropdown in the filter bar lets you narrow the product list to Open Source or Commercial entries. The selection is preserved in the URL so filtered views can be shared.
- **Quantum technology badges**: Products that incorporate quantum hardware (QKD, QRNG, or both) now display a colour-coded badge in both the card grid and the expanded table row. The `quantum_tech` field is sourced directly from the product catalog.

### Changed

- **CISA category field added to all products**: Every product in the migration catalog now carries a `cisa_category` field mapping it to one of the 15 CISA categories. Products without a specific mapping default to "Other / Unclassified".
- **Enrichment merge improved**: Timeline enrichments now aggregate all historical enrichment files (not just the latest) so older entries are never silently dropped on subsequent runs. The shared `mergeEnrichmentFiles` utility is now used by both library and timeline enrichment loaders.

### Data Sources

- **Timeline data updated to April 2026** (`timeline_04012026.csv`): Latest government and industry PQC milestones incorporated; March 2026 snapshot retired.
- **Product catalog updated** (`pqc_product_catalog_04012026_r4.csv`): April 2026 catalog revision with enriched CISA category and quantum-tech annotations across the full 622-product dataset.

## [2.72.0] - 2026-04-01

### Added

- **Share links for library documents**: A share button in the library document detail modal copies a direct link — `/library?ref=<ID>` — to your clipboard. The browser URL also updates to include `?ref=` when the modal opens and clears when it closes, so the address bar is always shareable. Deep links open the modal automatically.
- **Share links for migrate products**: A share button appears in each expanded product row in the migration catalog table. Clicking it copies `/migrate?product=<name>::<category>&mode=table` to your clipboard. The URL updates to reflect the open row while browsing, and sharing the link re-opens the same row with the table view active and scrolled into view.
- **Share country timeline links**: A copy-link icon appears next to the country dropdown (desktop Gantt chart and mobile list) whenever a specific country is selected. Clicking it copies `/timeline?country=<Country>` to your clipboard — send it to a colleague to open the timeline pre-filtered to that country's roadmap.
- **Share buttons in all HSM Playground panels**: Every operational HSM panel (Hashing, Key Derivation, Key Agreement, Symmetric Crypto, Sign & Verify, Key Wrap) now has a share button in its header. Because the Playground already syncs `?tab=` and `?algo=` to the URL on every selection, sharing copies a fully-resolved deep link — e.g. `/playground?tab=hashing&algo=SHA3-256` — that lands a recipient directly on the right panel and algorithm.

## [2.71.0] - 2026-04-01

### Added

- **SLH-DSA context string support (FIPS 205 §9.2)**: The SLH-DSA sign and verify operations in the HSM Playground now accept an optional context string — a short byte sequence that is cryptographically bound to the signature. A signature produced with context "A" will not verify with context "B", giving you a built-in domain-separation primitive for multi-protocol deployments.
- **SLH-DSA deterministic signing (FIPS 205 §10)**: A new "Deterministic" option in the SLH-DSA panel forces the HSM to derive its randomness from the key itself (using PK.seed as opt_rand). Signing the same message twice with the same key produces identical signature bytes, making it easier to build reproducible test vectors and auditable log entries.
- **ACVP tests 21 & 22 — SLH-DSA context binding and deterministic mode**: The ACVP compliance test suite now covers the two new FIPS 205 capabilities. Test 21 verifies that context-bound signatures reject cross-context and no-context verification. Test 22 verifies that deterministic signing produces bit-identical signatures across two calls and that the result still verifies correctly. Both tests run on both the C++ and Rust engines in dual mode (44 total assertions).
- **Copy button on ACVP execution log**: A clipboard button in the ACVP log header lets you copy the full test output with one click — useful for attaching results to issue reports or compliance evidence packages.

### Fixed

- **SLH-DSA multi-message signing correctness**: The C++ HSM engine's message-API path (`C_MessageSignInit` / `C_SignMessage`) incorrectly lost session parameters (context string, deterministic flag) between the mandatory PKCS#11 size-query call and the actual signing call. Context binding and deterministic mode had no effect when using the message API. Parameters are now preserved across both steps.

## [2.70.1] - 2026-04-01

### Data Sources

- **Product catalog expanded to 622 entries**: 101 new products added in the latest audit pass. Validation coverage increased — 338 of 622 products are now independently confirmed as valid.

## [2.70.0] - 2026-04-01

### Added

- **Proof details popup**: Clicking "View Proof" on any product now opens a focused dialog showing the validation outcome, a written summary of findings, the publication date, and a link to the original source document. Works on both mobile and desktop.
- **Expanded validation status badges**: Products now show one of 8 color-coded status badges — Validated (green), FIPS Verified (green), Validated — No PQC (gray), Corrected (amber), Partially Validated (amber), Needs Review (amber), Not Validated (red), FIPS Issue (red).

### Data Sources

- **All 521 catalog entries now have validation results**: The full product catalog completed a validation pass. Results: 237 Validated, 171 Validated without PQC support, 81 Corrected, 9 Needs Review, 8 Not Validated, 7 Partially Validated, 5 FIPS Issues, 3 FIPS Verified.

## [2.69.2] - 2026-04-01

### Added

- **Visual infographics for all 49 learning modules**: Every module now has a dedicated NLLM-format infographic available in the Visual tab.
- **"Next Stack" navigation in Curious mode**: When you reach the last module in a track while browsing in Curious Explorer mode, a "Next Stack" button appears — clicking it automatically moves you to the next track so you can continue exploring without backtracking.

## [2.69.1] - 2026-04-01

### Fixed

- **Chatbot blank screen after API key error**: If you had previously connected the chatbot with a Gemini API key that was later rejected, sending a new message would silently clear your typed text and show a blank chat. Now shows a clear error message and restores your typed text so you can reconnect without losing your query.

## [2.69.0] - 2026-04-01

### Added

- **Source verification data in product catalog**: Each product now shows whether it has been independently verified, along with a link to the source document and a summary of what was confirmed.
- **Validation badges in product expanded view**: A color-coded badge (green/amber/red) appears next to the "Last Verified" date so you can assess product credibility at a glance.
- **AI assistant aware of validation results**: The chatbot can now reference a product's validation status and source proof when answering questions about specific tools.

## [2.68.0] - 2026-03-31

### Changed

- **Improved AI assistant navigation links**: Links returned by the chatbot now navigate more precisely — classical algorithm links open the Transition tab directly, compliance links open the Standards tab, and product links apply the correct infrastructure layer filter automatically.

## [2.67.1] - 2026-03-31

### Data Sources

- **New document enrichments**: 67 new library analysis entries (covering blockchain/DeFi protocols, NSA CNSA 2.0, Signal PQXDH, Apple PQ3, and more) and 10 new timeline entries (Bitcoin quantum testnet, Algorand PQC, OpenSSL 3.6.1, DoD PQC memorandum, and others). Library document coverage: 92% (386 of 419). Timeline coverage: 100% (213 of 213).
- **Data quality improvements across multiple datasets**: Fixed broken source organization references in the library, product catalog, and timeline datasets. Added 12 new trusted organizations (200 total). Fixed 3 data integrity issues in the priority matrix.
- **Data integrity**: Resolved all 8 outstanding data errors — all cross-references between datasets are now consistent.

## [2.67.0] - 2026-03-31

### Added

- **Certificate Transparency Log Simulator**: New interactive step in the Merkle Tree Certificates workshop — simulate a real CT log with ML-DSA-44 signing, append and look up certificates, generate consistency proofs, and detect certificate misissuance.
- **TLS 1.3 Simulator**: New Playground workshop tool — simulate a full TLS 1.3 handshake with configurable cipher suites and key exchange groups, including X25519, ML-KEM hybrid, and mutual TLS (mTLS). Supports PQC and hybrid certificates.
- **Algorithm comparison sub-tab deep links**: The Performance, Security, Key Sizes, and Use Cases sub-tabs in the Algorithms comparison view now remember your position in the URL, so sharing or navigating back restores the exact sub-tab you were viewing.
- **Compliance migrate-category filter**: A new filter in the Compliance view lets you jump directly to products in a specific category (e.g., Databases, Operating Systems) and see which migration catalog entries correspond.
- **Library taxonomy refresh**: The library sidebar now uses 6 more precise categories — Government & Policy, NIST Standards, International Frameworks, Migration Guidance, Algorithm Specifications, and Industry & Research — replacing the generic "General Recommendations" bucket.
- **Migration catalog "Work in Progress" notice**: An animated banner at the top of the Migrate view lets you know the catalog is actively being reviewed and updated.
- **HSM key inspection improvements**: Keys in the HSM Playground now show semantic purpose labels (Attestation, TLS, Key Encryption, Application, General) with per-purpose color coding.

### Changed

- **Firmware Signing Migrator rewritten**: The Secure Boot PQC workshop now supports RSA-2048/3072, ECDSA P-256/P-384, ML-DSA-44/65/87, and SLH-DSA-SHA2-128S with a 4-step guided wizard (algorithm selection → key generation → signing → verification).
- **Envelope Encryption Demo expanded**: The KMS-PQC workshop now includes RSA-2048 and RSA-4096 key encryption in addition to ML-KEM variants. The wrapping mechanism is now selectable.
- **PKCS#11 call log — expandable entries**: Log entries with inspect data now show an expandable row — click to decode mechanism IDs, attribute types, and return codes inline.

### Fixed

- **HSM attribute read errors resolved**: The key attribute inspector no longer tries to read attributes that don't apply to a given key type, eliminating spurious error messages in the PKCS#11 log.
- **Duplicate "Code Signing" tool removed from Playground**: The standalone tool was a duplicate of the Secure Boot PQC workshop — it has been removed from the registry; the workshop itself remains fully accessible.

## [2.66.0] - 2026-03-30

### Added

- **Evidence warnings on products**: Expanded product rows now display warning notices when a product's PQC claims have data quality issues — for example, a release date before the FIPS standards were finalized, or a FIPS certificate that only covers classical algorithms.
- **Verification status filter**: New filter in the Migrate view to show only Verified, Partially Verified, or Needs Verification products.
- **Evidence flags affect trust score**: Products with data quality warnings receive a lower composite trust score — reflected in the trust badge shown on each product card.

### Data Sources

- **415 products in catalog** (was 394): 21 new products added, including Cisco Catalyst Center, DigiCert ONE, and Fortinet FortiManager.
- **72 products independently verified**: Products were web-searched and cross-referenced against vendor sources, FIPS, and ACVP certifications.

### Fixed

- **21 products corrected to Unknown**: Products claiming PQC support without any verifiable proof or certification are now honestly marked Unknown.
- **4 products upgraded**: Fortinet FortiGate-Rugged, Zscaler ZTE, AppViewX CERT+, and Broadcom Avi all ship PQC — updated from Planned to Yes with supporting evidence.
- **Node.js corrected**: Was listed as awaiting PQC — actually has ML-KEM + ML-DSA since v24.7 via OpenSSL 3.5.
- **Cisco IOS XE corrected**: Was listed as "Yes (ML-KEM)" — native ML-KEM not yet shipped; corrected to Partial.
- **Algorithm names standardized**: CRYSTALS-Kyber updated to ML-KEM and CRYSTALS-Dilithium to ML-DSA throughout all product descriptions.
- **FIPS scope clarifications**: 14 products with classical-only FIPS certificates now note that PQC is not in scope.

## [2.65.3] - 2026-03-29

### Added

- **Envelope encryption via HKDF**: The KMS-PQC workshop now derives the wrapping key from the ML-KEM shared secret using a real HKDF step, rather than generating a fresh AES key.
- **SLH-DSA pre-hash mismatch warning**: The Playground now shows a warning when the pre-hash algorithm selected in the UI differs from the one used to sign.
- **PKCS#11 mechanism flag reference**: Step 8 of the PKCS#11 Walkthrough now explains all mechanism flags (SIGN, ENCAPSULATE, WRAP, etc.) with references to the PKCS#11 v3.2 specification.
- **KDF tool scenarios expanded**: The Key Derivation Function tool now illustrates KEM, pre-shared key, and password-based derivation scenarios side by side.
- **Trust score badges**: Trust score indicators added across the Library, Compliance, Threats, Timeline, Algorithms, Leaders, and Migrate views.
- **9 new achievements**: New milestones for completing 5, 10, and 25 modules; completing 3 tracks; scoring 100% on a quiz; exploring 3 or 10 Playground tools; and finishing the Business Center.
- **Curious learning path expanded**: 8 new modules and a new checkpoint added to the Curious Explorer path (estimated time increased from 280 to 680 minutes).

### Fixed

- **Hybrid KEM + ECDH key derivation error**: Fixed an issue where the ECDH-derived key was missing a required attribute, causing the HKDF combine step to fail in the Hybrid KEM workshop.
- **Google sign-in flow corrected**: Fixed an OAuth configuration issue that prevented the Google consent screen from loading correctly.

## [2.65.2] - 2026-03-29

### Fixed

- **FrodoKEM benchmark crash**: FrodoKEM-640 algorithm name resolved correctly — benchmark now runs without errors.
- **secp256k1 benchmark crash**: secp256k1 now runs using the Noble curves library (Web Crypto does not support it).
- **Ed448 and X448 benchmarks removed**: No portable browser engine supports these — removed from the benchmarkable set to avoid misleading errors.
- **Diffie-Hellman benchmark crash**: No browser handler exists for DH benchmarking — removed from the benchmarkable set.

## [2.65.1] - 2026-03-29

### Added

- **Google Drive CSRF protection**: The OAuth sign-in flow now includes a nonce parameter to prevent session impersonation attacks.

### Fixed

- **SoftHSM WASM import errors**: Fixed invalid TypeScript syntax across 8 internal WASM modules that caused build failures in strict mode.

## [2.65.0] - 2026-03-29

### Added

- **Business Center export improvements**: CRQC Scenario Planner, Supply Chain Risk Matrix, and Deployment Playbook now export full markdown reports with algorithm impact tables, compliance deadlines, and assessment context.
- **Audit Checklist expanded**: New Risk Assessment section (6 items) covering HNDL exposure, data classification, crypto risk registers, and threat modeling. All 30 checklist items now include descriptions and references to NIST, FIPS, ISO, and CISA standards. Export includes per-section maturity scoring (5 levels: Not Started → Optimized).
- **Deployment Playbook new sections**: Added Hybrid Mode Deployment (5 items: hybrid TLS config, backward compatibility, cert chain validation, performance benchmarking, interop testing) and Post-Deployment Validation (5 items).
- **RACI Builder multi-accountable warning**: A red warning now appears when more than one role is assigned as "Accountable" for the same activity.
- **Business Center keyboard navigation**: Full arrow-key navigation across Business Center tabs (ArrowLeft/Right to cycle, Home/End to jump to first/last).
- **Persona-aware Business Center**: All 14 Business Center tools now adapt content to your selected industry, geography, and regulatory context.

### Fixed

- **ROI Calculator unrealistic defaults**: The "Products to Migrate" slider was defaulting to the full catalog (~375 products) — now capped at 50, with the slider minimum lowered to 1.
- **CNSA 2.0 deadline labels corrected**: Fixed 2025 and 2027 milestone descriptions; added the missing 2035 full-enforcement milestone.
- **Roadmap Builder export**: Export now respects your selected deadline checkboxes rather than including all deadlines.

## [2.64.0] - 2026-03-29

### Added

- **Real X.509 certificates in Hybrid Cryptography module**: All 6 hybrid certificate formats (Composite, Alt-Sig/Catalyst, Related Certificates, Chameleon, Pure ML-DSA-65, Pure SLH-DSA-128s) now generate structurally correct, standards-compliant DER-encoded X.509 certificates — not simulations. Certificates are signed via the in-browser HSM using real PKCS#11 operations.

### Fixed

- **RFC 9763 Related Certificates OID corrected**: Fixed an OID typo (`.35` → `.36`) that was inconsistent with the actual RFC specification.

## [2.63.0] - 2026-03-29

### Added

- **Alt-Sig / Catalyst as a distinct certificate format**: The Hybrid Cryptography module now covers all 6 hybrid certificate approaches, with Alt-Sig (a classical certificate carrying a PQC key and signature in extensions) correctly distinguished from Related Certificates (two separately paired certs). Previously these were conflated.
- **SLH-DSA learn card**: The learn section now shows all 6 certificate formats across two groups — PQC-only (ML-DSA, SLH-DSA, Composite) and hybrid-with-classical-fallback (Alt-Sig, Related Certs, Chameleon).
- **SLH-DSA IETF reference certificate**: A real 8,241-byte SLH-DSA-SHA2-128s certificate from RFC 9909 is now included as a test vector in the Certificate Inspector.

### Fixed

- **Alt-Sig factual error corrected**: The IETF test vector for Alt-Sig was incorrectly labeled as Related Certificates in the inspector. The NSA Catalyst approach is Alt-Sig, not RFC 9763 — the glossary and test vectors now reflect this correctly.
- **Certificate format count inconsistency**: Removed all hardcoded counts ("Three", "Four", "Five") that were inconsistent across the module — there are 6 distinct formats. Headings no longer include numbers to prevent future drift.

## [2.59.0] - 2026-03-28

### Added

- **Bookmarks**: Save Library documents and Migrate products for quick access. Bookmarks are accessible from a new Bookmarks tab in the right panel and can be exported as JSON or CSV.
- **Product comparison panel**: Compare up to 3 products side-by-side in the Migrate catalog. Click the scale icon on any product to add it to the comparison queue; a sticky bar at the bottom shows your queue and opens an inline comparison table.
- **Breadcrumb navigation**: A breadcrumb trail now appears above page content for nested routes (e.g., inside a learning module), making it easy to navigate back.
- **Mobile Playground**: The Playground is now fully interactive on mobile — ML-KEM encapsulation/decapsulation and ML-DSA signing/verification are available on small screens with real WASM-powered operations.
- **Automated content integrity checks in CI**: Every deployment now runs a content quality gate that checks for accuracy issues and graph consistency errors before going live.

### Changed

- **Page descriptions visible on more screen sizes**: Page subtitles now appear at the medium breakpoint instead of only on large screens.

## [2.58.0] - 2026-03-28

### Fixed

- **Compliance framework website links corrected**: Fixed broken or unstable URLs for DORA, ENISA, and Bank of Israel records.

## [2.57.0] - 2026-03-27

### Added

- **Migrate view URL sync**: All active filters in the Migrate view — search, industry, migration step, and infrastructure layer — are now reflected in the URL. You can share a filtered view or bookmark it and return to the same state.

### Changed

- **Comprehensive mobile layout improvements (70+ components)**: Fixed multi-column grid layouts that were too cramped on small screens across the Learning workshops, About page, Algorithm Comparison, Assessment wizard, and OpenSSL Studio.

## [2.56.0] - 2026-03-27

### Added

- **Google Drive cloud backup**: Optionally back up and restore your learning progress, bookmarks, and settings to your personal Google Drive. Data is stored privately in a hidden app folder — not visible in your Drive file list. Access tokens are stored in browser memory only and never sent to any server. You can revoke access at any time.
- **Cloud sync privacy details on About page**: A dedicated panel explains exactly what data is synced, what is excluded (API keys), and how to disconnect.

### Changed

- **Navigation scrollbar restored**: A CSS regression introduced in v2.55.0 was hiding the navigation scrollbar, making right-side nav icons inaccessible on smaller screens. Fixed.

## [2.55.0] - 2026-03-24

### Added

- **Algorithm comparison — security level and key size badges**: The PQC column in the comparison table now shows the security level (e.g., L3) and public key size (e.g., 1184 bytes) for each algorithm, replacing the generic "Find tools" link.
- **Mobile algorithm cards — function type and key size chips**: Algorithm cards on mobile now show the function type and key size as compact chips below the algorithm name.
- **OpenSSL Studio collapsible workbench**: The command builder panel in OpenSSL Studio can now be collapsed on mobile to free up screen space.

### Changed

- **Navigation header — text-only branding**: The logo image has been removed from the nav header; the "PQC Today" text gradient is now the sole identifier.

## [2.54.0] - 2026-03-24

### Added

- **Curious Explorer persona content**: Every learning module now has a dedicated "Curious" summary written in plain language (~8th grade reading level) with real-world analogies, plus a matching infographic in the Curious Explorer style. All 50 modules covered.
- **Curious context banners**: The Compliance and Leaders pages now include a brief plain-language explanation of what you're looking at when Curious Explorer mode is active.
- **Key size display in Playground**: The Key Store and HSM Key Registry now show a Size column. The header shows total key count and combined byte size.
- **Mobile compliance improvements**: Certificate type filter pills and "Load more" pagination now work on mobile.
- **Mobile migration phase selector**: A dropdown for selecting migration phases is now available on mobile, replacing the desktop step rail that was hidden on small screens.
- **Page header actions menu on mobile**: A three-dot menu on mobile consolidates the Sources, Share, Glossary, Export, and AI Assistant buttons into a single tap.

### Changed

- **Curious Explorer auto-completes onboarding**: Selecting Curious Explorer in the persona picker now skips the Region and Industry steps automatically.
- **Playground simplified for Curious and Executive personas**: The PKCS#11 mode selector and ACVP tab are hidden for non-technical personas. Auto-resets if you switch to a simplified persona while in advanced mode.

## [2.53.0] - 2026-03-24

### Changed

- **Faster app updates**: The app now checks for new deployments every 15 minutes (was 60 minutes). You will see fresh content sooner when a new version is released.

## [2.52.0] - 2026-03-24

### Fixed

- **App stayed on old version after deployment**: Especially on iOS Safari, the app could remain on a cached version for hours after a new release. Now the app reloads automatically when a new version is detected — within ~1 hour on desktop, or on next foreground return on mobile.

## [2.51.0] - 2026-03-24

### Fixed

- **HSM product PQC algorithm details corrected**: Standardized algorithm names across all HSM product entries (Thales Luna HSM, Utimaco SecurityServer, Marvell LiquidSecurity 2, Futurex CryptoHub, AWS CloudHSM, Google Cloud HSM, Crypto4A QxHSM). Removed embedded FIPS numbers from algorithm name strings for consistency. Clarified that AWS CloudHSM hardware does not support ML-KEM (only ML-DSA in preview).

## [2.50.0] - 2026-03-24

### Fixed

- **Entrust nShield PQC support details corrected**: Updated the product entry to list specific algorithm support (ML-KEM 512/768/1024, ML-DSA 44/65/87, SLH-DSA all 12 parameter sets, LMS/XMSS) rather than the generic "Hybrid PQC" description.

## [2.49.0] - 2026-03-23

### Changed

- **Trail of Bits ml-dsa added to catalog**: New side-channel resistant ML-DSA library in Go added under Cryptographic Libraries. Supports all three ML-DSA parameter sets, designed for constant-time execution, and has passed 51 conformance tests.

## [2.48.0] - 2026-03-23

### Added

- **ACVP Testing expanded**: The HSM ACVP Testing tab now includes an Ed25519 signature verification test and full-coverage functional tests for all 12 SLH-DSA parameter sets.
- **Standard reference links in ACVP results**: Each test result now links to the canonical NIST or IETF standard for the tested algorithm.
- **Crucible conformance harness added to PQC Testing module**: The PQC Testing & Validation learning module now covers Crucible — a language-agnostic test harness with 78 ML-KEM and 51 ML-DSA targeted conformance tests.

### Changed

- **HSM vendor accuracy update**: Verified and updated production data for all 6 HSM vendors — Thales Luna 7, Entrust nShield 5, Utimaco Quantum Protect, AWS CloudHSM, Azure Dedicated HSM, and Crypto4A QxHSM. Key updates: Azure Dedicated HSM now in production (no new customers after Aug 2025); Utimaco CAVP certificates added; AWS CloudHSM ML-KEM clarification.

## [2.47.0] - 2026-03-23

### Fixed

- **HKDF mechanism constants corrected**: Fixed incorrect constant values for HKDF derive operations that could cause failures when running against a compliant PKCS#11 token.

## [2.46.0] - 2026-03-22

### Added

- **Key Check Values (KCV) for all key types**: The HSM Key Store now shows a 3-byte hex fingerprint for every key (ML-KEM, ML-DSA, SLH-DSA, RSA, ECDSA, EdDSA) — useful for verifying key identity without exposing the key material.
- **ACVP multi-algorithm test suite**: The HSM ACVP Testing tab now validates AES-GCM-256, HMAC-SHA-256, RSA-PSS-2048, ECDSA P-256, and ML-KEM-768 alongside ML-DSA — all running in parallel against both C++ and Rust engines in Dual Mode.
- **Visual tab for all 48 learning modules**: Every module now has a Visual tab showing its infographic and "In Simple Terms" summary, accessible at all experience levels without switching to Curious mode.
- **WIP badge with community feedback**: Modules currently under peer review show a pulsing "WIP" chip. Clicking it opens a review-status panel with automated cross-check results, editorial progress, and peer-review status — with Endorse/Flag buttons and a link to GitHub Discussions.
- **Enrichment previews in Timeline**: Gantt phase popovers now show a compact analysis preview (mandate level, migration urgency, sector tags). Timeline document popovers show a full 8-dimension analysis and a cross-link to the Library when the source matches a library record.
- **PQC Testing & Validation learning module**: New advanced module (120 min) covering passive crypto discovery, active endpoint scanning, performance benchmarking, interoperability testing, side-channel assessment, and NIST ACVP validation.
- **"What's New" modal**: A persona-aware modal auto-opens on your first visit after a new release, highlighting the updates and data changes most relevant to your role and industry.
- **Terms of Service page** (`/terms`): 11-section legal page covering licensing, educational crypto disclaimers, export compliance, acceptable use, privacy, and warranty.
- **Curious Explorer glossary**: 24 plain-language definitions with interactive inline tooltips for the Curious Explorer persona.

### Changed

- **"In Simple Terms" summaries rewritten across all 48 modules**: All plain-language summaries were rewritten at an ~8th-grade reading level with a consistent structure (what it is, why it matters, what you'll learn) and real-world analogies. Previous summaries contained inaccuracies and inconsistent depth.
- **Module infographics standardized to 640×640**: All module infographics replaced with new single-panel square designs.
- **Tools & Products tab sources from live catalog**: The Tools tab in each learning module now pulls directly from the current product catalog, filtered by module relevance, with PQC support badge, FIPS badge, and a deep-link to the full catalog entry.

### Fixed

- **Library "Relevant Features" links broken**: Fixed two bugs that caused enrichment feature links to be broken or missing — case-sensitivity in lookups and incorrect list separator handling are now both corrected.
- **Snapshot backup/restore data loss**: 14 settings fields were silently dropped when exporting and re-importing a snapshot. Assessment wizard flags, persona settings, migrate preferences, and chat settings now all round-trip correctly.

## [2.45.2] - 2026-03-13

### Changed

- **Library document popover — mobile sheet layout**: On small screens the document detail popover now slides up as a bottom sheet with a drag handle and scrollable content, replacing the cramped centered dialog.
- **Endorse and Flag buttons visible on mobile**: The Endorse and Flag buttons on Library, Threats, Leaders, and Timeline pages were only visible on large screens. Now also shown on mobile, directly below the page description.
- **Airplane Mode in mobile nav**: The Airplane Mode toggle is now accessible from the mobile More menu, showing current On/Off state.

## [2.45.1] - 2026-03-14

### Added

- **Stateful Endorse/Flag with discussion links**: Endorsing or flagging a resource now saves your action locally and opens a pre-filled GitHub Discussion form. Re-clicking an activated button opens a search for the discussion you created previously, so you can follow up.

### Fixed

- **Flag button missing from several views**: The Flag button was absent from Timeline document cards, the Gantt country row, the page header for Threats/Leaders/Timeline pages, and the learning module navigation bar. Added consistently across all affected locations.

## [2.45.0] - 2026-03-13

### Added

- **Flag issue button**: A new Flag button (red flag icon) appears across Library, Threats, Leaders, and Learning views. Clicking it opens a pre-filled GitHub Discussion to report inaccuracies, broken links, or outdated content.
