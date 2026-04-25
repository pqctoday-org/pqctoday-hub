# Changelog

<!-- markdownlint-disable MD024 -->

All notable changes to this project will be documented in this file.

## [Unreleased]

## [3.5.14] - April 25, 2026

### Changed

- **Library CSV deduplicated** [view:/library] — [library_04252026_r2.csv](src/data/library_04252026_r2.csv) is the new canonical library, 543 → 531 rows (Δ 12). Three hard `referenceId` collisions collapsed to single rows (`G7-CEG-Financial-PQC-2026`, `Malaysia-NACSA-PQC-2025`, `AU-ASD-ISM-Crypto-2024`); nine un-cited soft duplicates dropped (BSI TR-02102 → TR-02102-1; Avis ANSSI → ANSSI PQC Position Paper; IETF RFC 9162 → RFC-9162; IETF RFC 4253 → RFC 4253; India-TEC-910018-2025 → IN-TEC-PQC-Migration-Report-2025; draft-ietf-plants-merkle-tree-certs → IETF-MTC-Draft-09; ETSI-GS-QKD-016-V2 → ETSI-GS-QKD-016; draft-ietf-pquip-hybrid-signature-spectrums → -spectrums-07; IETF RFC 8555 → IETF-RFC-8555). Each canonical row absorbed missing fields from its dropped twin; multi-value columns (`dependencies`, `module_ids`, `applicable_industries`, `region_scope`) unioned by semicolon. Dedup logic in [scripts/dedupe-library-04252026.cjs](scripts/dedupe-library-04252026.cjs) using PapaParse `unparse()` per the project CSV write convention. Verified zero remaining hard duplicates and zero title duplicates; 0 build errors. Five medium-difficulty soft-dups requiring coordinated cross-CSV citation updates (ANSSI-PQC-Position-2022, India-DST-NQM-Roadmap, NIST SP 800-90 family, NIST SP 800-53 vs FISMA-NIST-SP-800-53r5, NIST-FIPS140-3-IG-PQC vs -Sep-2025-PQC) deferred to a follow-up cleanup.

- **Library archive — older revisions** — `library_04232026_r4.csv` moved to `src/data/archive/` (kept the recent date-stamped versions in place; the loader auto-discovers latest via `import.meta.glob`).

## [3.5.13] - April 25, 2026

### Added

- **CSWP.39 source-metadata + staleness check** [persona:architect] [persona:ciso] [view:/compliance] — exported `CSWP39_SOURCE_METADATA` constant in [cswp39Data.ts](src/components/Compliance/cswp39Data.ts) capturing publication date (2025-12-19), canonical NIST URL, `dataExtractedAt` (2026-04-25), and `nextReviewBy` (2026-07-24). New vitest spec [cswp39Data.test.ts](src/components/Compliance/cswp39Data.test.ts) fails CI when `nextReviewBy < today`, forcing manual re-verification of hub data against upstream NIST CSWP.39. The CSWP.39 Explorer Overview banner ([CSWP39Explorer.tsx](src/components/Compliance/CSWP39Explorer.tsx)) now surfaces the source link, document version, last-verified date, and next-review date inline. Re-verification cadence: 90 days. Closes assessment N4 (CSWP.39 framework lock-in canary).

- **Maturity governance corpus refresh — CC 2022 + NERC CIP** — [pqc_maturity_governance_requirements_20260425.csv](src/data/pqc_maturity_governance_requirements_20260425.csv) gains 22 rows covering Common Criteria 2022 Part 2 + Part 3 (key-management, RBG, audit, life-cycle, configuration-management requirements at maturity tiers 2–3) and NERC Reliability Standards (CIP-002-8, CIP-003-11 governance + assurance requirements). All extracted with `qwen3.5:27b` per the project enrichment standard.

### Fixed

- **PWA precache size limit raised 15 → 20 MB** — [vite.config.ts](vite.config.ts) `injectManifest.maximumFileSizeToCacheInBytes` bumped from 15 MB to 20 MB so the now-15.9 MB index bundle is fully precached on first install. Comment updated to reflect the broader scope (WASM + large bundles).

### Removed

- **Tracked Python bytecode untracked** — `scripts/__pycache__/*.pyc` files (4 stale entries plus 1 editor-swap artifact) untracked via `git rm --cached`. The directory was already in `.gitignore` line 208 but the files predated the rule and remained tracked. No on-disk changes; only git's index updated.

## [3.5.12] - April 25, 2026

### Added

- **`desktopRecommended` journey badge on Landing** [persona:all] [view:/] — two journey steps (Compare Algorithms, Try the Playground) now show a "Best on desktop" pill (Monitor icon, `lg:hidden`) on mobile so users know to expect a richer experience on larger screens. New `desktopRecommended?: boolean` field on the `JourneyStep` interface; zero layout impact on desktop. ([LandingView.tsx](src/components/Landing/LandingView.tsx))

- **Changelog hash deep-link + highlight** [view:/changelog] — navigating to `/changelog#v3.5.X` now smooth-scrolls to the matching release card and briefly rings it with a `ring-primary shadow-glow` highlight (1.8 s). Implemented via `useLocation` + `useEffect` on `location.hash` + `filteredVersions.length`; handles lazy-load timing so the scroll fires after content paints. ([ChangelogView.tsx](src/components/Changelog/ChangelogView.tsx))

- **RAG corpus cross-reference fields** — `generate-rag-corpus.ts` now propagates additional structured fields into each chunk's `metadata` object: `trustedSourceId` (all sources), `dependencies` + `moduleIds` (library), `relatedModules` + `cryptoAtRisk` + `pqcReplacement` (threats), `libraryRefs` + `timelineRefs` + `countries` (compliance), `categoryId` + `pqcSupport` + `learningModules` + `vendorId` (migrate). Fields are omitted when empty to keep corpus compact. Corpus regenerated. ([generate-rag-corpus.ts](scripts/generate-rag-corpus.ts))

- **Golden-query Round 7** — 35 new golden queries covering Patents (assignee + landscape), CSWP.39 5-step process, governance maturity tiers, and the Curious Explorer persona. `minTop5Hits: 0` used where multiple chunk types may rank before the target but the chunk is expected in top-15. ([golden-queries.test.ts](src/services/chat/__tests__/golden-queries.test.ts))

- **New data files** — `library_04242026.csv`, `library_04252026.csv` (library refresh, auto-discovered by glob loader); `module_qa_combined_04252026.csv`, `module_qa_slh-dsa_04252026.csv` (SLH-DSA module Q&A generation); `pqc_maturity_governance_requirements_20260425.csv` (governance maturity corpus update). ([src/data/](src/data/))

- **iOS/Android native platform detection** [embed] — `platform.ts` exports `getNativePlatform(): 'ios' | 'android' | null` using `Capacitor.getPlatform()`; `main.tsx` writes `data-platform="ios"` or `"android"` on the document root instead of the generic `"capacitor"`, enabling platform-specific CSS selectors. ([platform.ts](src/embed/platform.ts), [main.tsx](src/main.tsx))

### Fixed

- **Mobile responsive layouts across PKI Learning workshop components** — nine workshop views switched from `grid-cols-2` to `grid-cols-1 md:grid-cols-2` (or `sm:grid-cols-2`): [LMSKeyGenDemo.tsx](src/components/PKILearning/modules/StatefulSignatures/workshop/LMSKeyGenDemo.tsx), [StatefulSignaturesDemo.tsx](src/components/PKILearning/modules/StatefulSignatures/workshop/StatefulSignaturesDemo.tsx), [StateManagementVisualizer.tsx](src/components/PKILearning/modules/StatefulSignatures/workshop/StateManagementVisualizer.tsx), [ThresholdSigningDemo.tsx](src/components/PKILearning/modules/StatefulSignatures/workshop/ThresholdSigningDemo.tsx), [DrbgArchitectureDemo.tsx](src/components/PKILearning/modules/Entropy/workshop/DrbgArchitectureDemo.tsx), [RandomGenerationDemo.tsx](src/components/PKILearning/modules/Entropy/workshop/RandomGenerationDemo.tsx), [CTLogSimulator.tsx](src/components/PKILearning/modules/MerkleTreeCerts/workshop/CTLogSimulator.tsx), [KPIDashboardBuilder.tsx](src/components/PKILearning/modules/PQCGovernance/components/KPIDashboardBuilder.tsx), [ComplianceGapAnalysis.tsx](src/components/PKILearning/modules/PQCRiskManagement/components/ComplianceGapAnalysis.tsx), [MaturityAssessment.tsx](src/components/PKILearning/modules/CryptoMgmtModernization/workshop/MaturityAssessment.tsx), [TEEHSMTrustedChannel.tsx](src/components/PKILearning/modules/ConfidentialComputing/workshop/TEEHSMTrustedChannel.tsx), [CertificateInspector.tsx](src/components/PKILearning/modules/TLSBasics/components/CertificateInspector.tsx), and playground tools ([HsmCapacityCalculator.tsx](src/components/Playground/hsm/HsmCapacityCalculator.tsx), [HsmSymmetricPanel.tsx](src/components/Playground/hsm/HsmSymmetricPanel.tsx), [VpnSimulationPanel.tsx](src/components/Playground/hsm/VpnSimulationPanel.tsx), [SignVerifyTab.tsx](src/components/Playground/tabs/SignVerifyTab.tsx), [ProgressDashboard.tsx](src/components/RightPanel/ProgressDashboard.tsx), [ShareButton.tsx](src/components/ui/ShareButton.tsx), [TrustScoreTooltip.tsx](src/components/ui/TrustScoreTooltip.tsx)).

- **Patents page mobile layout** — `PatentsTable` list panel hides (`hidden sm:flex`) when a patent is selected on mobile so detail takes full width; detail panel is full-width (`w-full`) on mobile, half-width (`sm:w-1/2`) on desktop. `PatentDetail` responsive grids: metadata list switches to `grid-cols-1 md:grid-cols-2`; Cryptographic Profile switches to `grid-cols-1 sm:grid-cols-2`; `GridCard full` uses `sm:col-span-2` instead of `col-span-2`. ([PatentsTable.tsx](src/components/Patents/PatentsTable.tsx), [PatentDetail.tsx](src/components/Patents/PatentDetail.tsx))

- **Capacitor native platform CSS — iOS/Android safe-area insets** — `index.css` adds `[data-platform='ios']` and `[data-platform='android']` selectors alongside `[data-platform='capacitor']` for the `#main-content` bottom/top padding block, plus an iOS-specific lateral safe-area rule for notch/Dynamic Island. `overscroll-behavior: none` now also targets `[data-platform='ios']` and `[data-platform='android']`. ([src/styles/index.css](src/styles/index.css))

- **Narrow-viewport embed grid collapse** — new `@media (max-width: 480px)` block in `index.css` collapses `[data-embed] .grid-cols-{2,3,4}` to `1fr`, overrides `min-w-[480px]`/`[400px]`/`[360px]` to `100%`, and constrains `.w-80` dropdowns. Does not affect overflow-x-auto scroll containers (tabular/non-collapsible data). ([src/styles/index.css](src/styles/index.css))

- **Compliance-fwks enrichment doc updated** — `compliance-fwks_maturity_04242026.md` refreshed with updated maturity evidence entries. ([src/data/doc-enrichments/compliance-fwks_maturity_04242026.md](src/data/doc-enrichments/compliance-fwks_maturity_04242026.md))

- **Embed manifest + RAG corpus regeneration** — [public/data/embed-docs.json](public/data/embed-docs.json), [public/data/rag-corpus.json](public/data/rag-corpus.json), [public/embed/manifest.json](public/embed/manifest.json), and [public/embed/sdk.js](public/embed/sdk.js) regenerated to include cross-reference fields, new library/module-QA data, and the iOS/Android embed platform metadata.

## [3.5.11] - April 24, 2026

### Removed

- **Knowledge Graph orphan files** — deleted the now-unused module + right-panel mindmap files left over by the v3.5.10 removal:
  - `src/components/PKILearning/modules/KnowledgeGraph/` (entire module: CoverageView, ExploreView, GraphLegend, NodeDetailPanel, SearchBar, edges/RelationshipEdge, nodes/{ClusterNode,EntityNode}, data/{graphBuilder,graphTypes,searchIndex,suggestedQueries}, hooks/{useGraphData,useGraphSearch}, curious-summary-curious.md).
  - `src/components/RightPanel/{GraphPanel,MindmapView,MindmapView.test,mindmapData,useMindmapData}.tsx`/`.ts` plus `RightPanel/edges/MindmapEdge.tsx` and `RightPanel/nodes/MindmapNode.tsx`.
  - Verified no stale imports remain (`tsc --noEmit` clean; `grep -r "MindmapView|GraphPanel|KnowledgeGraph"` returns zero matches in `src/`).

## [3.5.10] - April 24, 2026

### Removed

- **Knowledge Graph right-panel tab** [persona:all] — removed the `graph` panel from the right-side slide-out drawer (no consumers and no longer aligned with the post-v3.5.9 navigation). [`PanelHeader.tsx`](src/components/RightPanel/PanelHeader.tsx) drops the `graph` tab definition and the `isEmbedded` filter that hid it; [`RightPanel.tsx`](src/components/RightPanel/RightPanel.tsx) drops the lazy `GraphPanel` import, the `'graph'` active-tab branch, and the title-bar fallback; [`MainLayout.tsx`](src/components/Layout/MainLayout.tsx) drops the "Knowledge Graph" entry from the More menu and the now-unused `Network` lucide import.
- **`useRightPanelStore` v3 migration** — bumped persisted-state version `2 → 3` in [`useRightPanelStore.ts`](src/store/useRightPanelStore.ts) with a `v2 → v3` migration step that reroutes any persisted `activeTab === 'graph'` to `'chat'` so existing localStorage entries never crash the rehydrate path. [`HistoryTypes.ts`](src/types/HistoryTypes.ts) tightens the `RightPanelTab` union accordingly.

## [3.5.9] - April 24, 2026

### Added

- **New `/patents` page — PQC patent landscape explorer** [persona:architect] [persona:researcher] [persona:ciso] [view:/patents] — top-level route with 202 PQC-relevant patents from `src/data/patents_04242026_r5.csv`. Two-tab layout (Insights + Explore):
  - _Insights tab_ ([PatentsInsights.tsx](src/components/Patents/PatentsInsights.tsx)) — donut charts (NIST round status, crypto-agility mode, region) + assignee leaderboard with sort toggle + categorical breakdowns (CPC codes, attack-resistance, primary inventive claim type). Click any segment / row / assignee to deep-link the Explore tab with a pre-applied filter.
  - _Explore tab_ ([PatentsTable.tsx](src/components/Patents/PatentsTable.tsx)) — sortable columns (Title / Impact / Issued / Priority date), search bar, multi-dimension filter chips (Assignee, Region, NIST Status, Crypto Agility, Impact, CPC), CSV export of the filtered view, side-by-side detail panel ([PatentDetail.tsx](src/components/Patents/PatentDetail.tsx)) showing claims, citation graph (with in-corpus deep-links + Google Patents fallbacks), and CPC code references.
  - _Type definitions_ in [src/types/PatentTypes.ts](src/types/PatentTypes.ts) cover `PatentItem`, `NistStatus`, `ImpactLevel`, `CryptoAgilityMode`, `InsightsFilter`, `ClaimDependency`.
  - _Routing_ — lazy-loaded in [src/App.tsx](src/App.tsx); nav entry added to [MainLayout.tsx](src/components/Layout/MainLayout.tsx) (hidden on mobile, available via mobile-more).

- **CSWP.39 Maturity Evidence Grid on `/compliance`** [persona:architect] [persona:ciso] [persona:compliance] [view:/compliance] — extends the CSWP.39 Explorer tab with a 4×5 (tier × pillar) evidence grid backed by [`maturityGovernanceData.ts`](src/data/maturityGovernanceData.ts) and the `pqc_maturity_governance_requirements_04242026.csv` corpus. New types in [src/types/MaturityTypes.ts](src/types/MaturityTypes.ts) cover `MaturityRequirement`, `PillarId`, `MaturityLevel`, `EvidenceLocation`. Component at [src/components/Compliance/MaturityEvidenceGrid.tsx](src/components/Compliance/MaturityEvidenceGrid.tsx). Cells show requirement counts; clicking a cell opens an evidence drawer with quotes, source URLs, evidence locations, and source-name filtering. The grid is also threaded into:
  - _ComplianceLandscape framework cards_ — each compliance-framework card now shows a "N CSWP.39 reqs →" chip (when extracted maturity requirements reference that framework) that deep-links into the CSWP.39 Explorer tab pre-filtered to the corresponding `evref`.
  - _ComplianceView URL state_ — added `?evref=<refId>` URL parameter so deep-links from elsewhere in the app (e.g., framework cards, learn module) can pre-filter the evidence grid; clearing the filter strips the param.
  - _Workshop Step 1 (CryptoMgmtModernization)_ — current-tier indicator computed from the user's average score now links into the matching tier row in the evidence grid, so the user can pivot from "where am I" to "what evidence exists at my tier".

- **3D infrastructure SVG generator** — new [generate_3d_svgs.cjs](generate_3d_svgs.cjs) script emits 93 SVG files into [SVG/](SVG/) covering nine infrastructure layers (Cloud, Network, Application Servers, Libraries & SDKs, Database, Hardware/Secure Elements, Operating System, Security Software, Security Stack), with an interactive `ai_zoom_map.html` overview. Used to generate visual assets for the Migrate / Threats / Library pages without external design tooling.

- **Compliance/cert-schemes/std-bodies enrichment pipeline + shared helpers** — new [scripts/\_enrichment_common.py](scripts/_enrichment_common.py) factors HTML/PDF text extraction, Ollama prompting, and JSON normalization out of the four per-source enrichment scripts (`enrich-tech-standards-ollama.py`, `enrich-cert-schemes-ollama.py`, `enrich-compliance-fwks-ollama.py`, `enrich-std-bodies-ollama.py`). Output files added under [src/data/doc-enrichments/](src/data/doc-enrichments/) for cert-schemes, compliance-fwks, std-bodies, and tech-standards (`*_maturity_*.md` + `*_skipped_*.json` per source). The compiled CSWP.39 governance-requirements corpus lands in [src/data/pqc_maturity_governance_requirements_04242026.csv](src/data/pqc_maturity_governance_requirements_04242026.csv).

- **Library + compliance data refresh (April 23–24, 2026)** — versioned CSV revisions in [src/data/](src/data/) covering library (`library_04232026.csv`, `_r2`, `_r3`, `_r4`) and compliance (`compliance_04242026.csv`). Loaders auto-discover the latest via `import.meta.glob`. Source-of-truth corrections + new entries documented in [src/data/scheme-registry-audit.md](src/data/scheme-registry-audit.md) (Phase 2a audit) and [src/data/compliancemanualdownload.md](src/data/compliancemanualdownload.md) (manual-download guide for paywalled framework PDFs).

- **Embed manifest + RAG corpus regeneration** — [public/data/embed-docs.json](public/data/embed-docs.json), [public/data/rag-corpus.json](public/data/rag-corpus.json), [public/embed/manifest.json](public/embed/manifest.json), and [public/embed/sdk.js](public/embed/sdk.js) refreshed to incorporate the new Patents page (route preset, page-level chunks), MaturityEvidenceGrid (CSWP.39 governance-requirement chunks), and the v3.5.9 data refresh.

### Fixed

- **ESLint cleanup across new modules** — replaced 23 raw `<button>` tags with the canonical `<Button>` component from [src/components/ui/button.tsx](src/components/ui/button.tsx) across [Patents/](src/components/Patents/) (PatentDetail, PatentsInsights, PatentsTable) and [MaturityEvidenceGrid.tsx](src/components/Compliance/MaturityEvidenceGrid.tsx) and [ComplianceLandscape.tsx](src/components/Compliance/ComplianceLandscape.tsx). Also: lifted PatentsTable's inner `ThCol` component to module scope (was triggering `react-hooks/static-components` "Cannot create components during render"); refactored two `let cumPct = 0; map(seg => cumPct += ...)` accumulators in `PatentsInsights` `DonutChart` / `Section` to use a `reduce`-built cumulative-percentages array (was triggering `react-hooks/immutability` "Cannot reassign variable after render completes"); removed the `autoFocus` attribute from the AddFilterPopover search input. Net: 27 ESLint errors → 0.

## [3.5.8] - April 24, 2026

### Added

- **Command Center reorganised around the NIST CSWP.39 5-step process** [persona:executive] [persona:architect] [persona:ciso] [view:/business] — replaces the previous 7-pillar layout with a fixed 5-step stack (Govern → Inventory → Identify Gaps → Prioritise → Implement), three cross-cut strips (Action Items top, Cyber Insurance togglable side panel, Learning bar bottom), and a per-step maturity tier badge computed deterministically from existing artifacts (Partial / Risk-Informed / Repeatable / Adaptive). Steps always render in 1→5 order; persona drives only which step expands by default and which artifacts surface first inside each card.
  - _Tier badges with reasons_ — every step card shows a tooltip listing the specific artifacts and section markers that contributed to (or are missing from) the current tier; tier rules are pure functions in `src/components/BusinessCenter/lib/cswp39Tier.ts` with hoisted threshold constants.
  - _Persona emphasis_ — `BC_STEP_EMPHASIS_BY_PERSONA` in `src/data/personaConfig.ts` replaces `BC_PILLAR_ORDER_BY_PERSONA`; executive opens on Govern with insurance panel open, architect opens on Identify Gaps, ops opens on Implement.
  - _Sub-widget extraction_ — `RiskOverviewWidget`, `FrameworkDeadlineList`, `PostureIndicator`, `InfraCoverageWidget`, `FipsBreakdownWidget`, and `TierBadge` promoted into `src/components/BusinessCenter/widgets/` ahead of the rebucket.

- **CSWP.39 educational coverage — 26 / 26 requirement bullets** [persona:architect] [persona:ciso] [persona:compliance] [view:/business] [view:/assess] [view:/report] — closes every NIST CSWP.39 (Dec 2025) requirement bullet through reuse of existing site resources, with **zero new tools** in the business tools registry. Coverage shifted from 9 ✅ / 9 ⚠️ / 8 ❌ to 26 ✅ / 0 ⚠️ / 0 ❌. Implementation:
  - _`RecommendedResourcesPanel` in every step card_ — three sections per step: in-app deep-links into `/migrate`, `/library`, `/threats`, `/compliance`, `/leaders`, `/algorithms`, `/assess`, `/report`; filtered external authoritative references from `authoritativeSourcesData.ts` plus curated extras (NVD, CISA KEV, NIST CSWP.39 PDF, NIST IR 8547, CMVP search, ACVP, CycloneDX, SPDX, NIST FIPS 203/204/205); horizontal "Try it in the Playground" strip linking to relevant `/playground/<tool-id>` tools per step (e.g. `entropy-test` + `qrng-demo` + `drbg-demo` on Inventory; `tls-simulator` + `vpn-sim` + `pqc-ssh-sim` on Identify Gaps; `hybrid-encrypt` + `slh-dsa` + `lms-hss` + `firmware-signing` on Implement).
  - _Static curation point_ — `src/components/BusinessCenter/lib/cswp39ResourceMap.ts` defines per-step `inApp`, `external`, `playground` link sets plus an optional `authoritativeSourceFilter`.
  - _CSWP.39 step badge component_ — `src/components/shared/CSWP39StepBadge.tsx` reused by `/assess` and surfaced on `/business` step anchors (`#step-{id}`).

- **Existing builders extended with CSWP.39 sections** [persona:executive] [persona:architect] [persona:compliance] [view:/business/tools] — 7 of the existing 17 business tools gained Markdown sections + small form fields so the educational extensions ride the same export pipeline:
  - `audit-checklist` — Exceptions (§5.1) and Evidence (CMVP / ACVP / ESV / CVE-scan, §5.5) row editors with add/remove controls.
  - `supply-chain-matrix` — auto-derived CBOM by the 6 CSWP.39 asset classes (Code / Library / Application / File / Protocol / System) computed from `useMigrateSelectionStore.myProducts`; "Download CBOM JSON" button emitting a CycloneDX-shaped `application/vnd.cyclonedx+json` blob; Pipeline Sources / Refresh Cadence / CMDB → CBOM Mapping inputs.
  - `roadmap-builder` — Mitigation Gateway rows referencing a `/migrate` gateway product (Cryptographic Discovery / SASE & Zero Trust / Cloud Encryption Gateways categories) with mandatory sunset date enforcing §4.6 "mitigation is not permanent".
  - `deployment-playbook` — Decommission Plan section (7 milestones) with §4.6 callout: record mitigation, document target migration, set sunset date, assign owner, phased milestones, capture retirement evidence, update CMDB/CBOM.
  - `policy-generator` — KPI Drift Rules (§5.4 → §5.1 feedback loop) with KPI / threshold / policy-action row editor.
  - `vendor-scorecard` — Observability Tooling Notes (§5.3) capturing scanner / CVE-watch / SIEM rule / Zero-Trust enforcement notes per vendor relationship; in-line deep-links to `/migrate?cat=Cryptographic%20Discovery%20Platforms` and `/migrate?cat=SASE%20%26%20Zero%20Trust`.
  - `kpi-dashboard` — Composite Scoring Formula Explainer (FIPS + ESV + EoL + posture + PQC readiness weights) and Sensitivity Multiplier inputs (§5.4) — both export with the dashboard markdown.

- **Cross-surface CSWP.39 continuity** [persona:all] [view:/business] [view:/assess] [view:/report] — the same 5-step narrative now spans the three top-level surfaces without any route changes:
  - _`/assess` wizard_ — every step shows a CSWP.39 step badge next to the "Step X of Y" label that links back to `/business#step-{id}`; mapping in `src/data/assessStepToCswp39.ts` (industry/country/compliance → Govern; crypto/sensitivity/use-cases/retention/credential-lifetime → Inventory; infra → Identify Gaps; scale/timeline → Prioritise; migration/agility → Implement).
  - _`/report`_ — opens with a `<ReportCswp39Nav>` legend (5-pill grid) that re-groups every report section under the corresponding CSWP.39 step (Risk Score → Prioritise; Algorithm Migration Priority → Inventory; Compliance Impact → Govern; Recommended Actions → Prioritise; Migration Roadmap / Toolkit → Implement; HNDL/HNFL / Threat Landscape / Risk Breakdown → Identify Gaps); pills link to `/business#step-{id}`; legend hidden in print mode. Mapping in `src/data/reportSectionToCswp39.ts`.

### Changed

- **Tier 4 maturity gating** in `src/components/BusinessCenter/lib/cswp39Tier.ts` now requires the corresponding CSWP.39 educational section to be present in the existing tool's exported markdown (detected via `## <heading>` prefix scan). Govern Tier 4 needs `## Exceptions` in `audit-checklist`; Inventory needs `## CBOM` and `## Pipeline Sources` in `supply-chain-matrix`; Identify Gaps needs `## Observability Tooling Notes` in `vendor-scorecard`; Prioritise needs `## Formula Explainer` in `kpi-dashboard`; Implement needs `## Mitigation Gateway` in `roadmap-builder` AND `## Decommission` in `deployment-playbook` AND `## Evidence` in `audit-checklist`. Tiers 1–3 unchanged. Each gating clause adds a corresponding entry to the tier badge tooltip's `reasons` array so users see exactly what's missing.

- **`CSWP39StepCard`** (`src/components/Compliance/CSWP39StepCard.tsx`) gained three optional props (`tierBadge`, `children`, `defaultOpen`) so the same component serves both `/compliance` (unchanged behaviour) and `/business` (with tier badge + per-step artifact list + resources panel via the `children` slot).

### Removed

- Four pillar section components (`RiskManagementSection`, `ComplianceRegulatorySection`, `GovernancePolicySection`, `VendorSupplyChainSection`) — replaced by the single `CSWP39StepSection.tsx` driven by step ID. Sub-widgets they exposed were promoted to `src/components/BusinessCenter/widgets/` first to preserve their visuals.

## [3.5.7] - April 23, 2026

### Added

- **Compliance page — new CSWP.39 Framework tab** [persona:architect] [persona:ciso] [persona:compliance] [view:/compliance] — the `/compliance` page now has a sixth tab (alongside Standardization Bodies, Technical Standards, Certification Schemes, Compliance Frameworks, Cert Records) that lets users explore the NIST CSWP.39 (Dec 2025) Crypto Agility Strategic Plan without leaving the page:
  - _Overview banner_ — one-paragraph primer with "Open Full Learn Module" CTA (deep-links `/learn/crypto-mgmt-modernization`) and "Download PDF" link (`/library/NIST_CSWP_39.pdf`).
  - _Interactive Process Diagram_ — reuses the existing `CryptoAgilityProcessDiagram` component (six clickable zones: Governance, Assets, Management Tools, Data-Centric Risk Management, Mitigation, Migration); click a zone to see what belongs there, the CPM pillar it maps to, and the exact CSWP.39 section reference.
  - _5-Step Process cards_ — expandable cards for Govern (§5.1–5.4), Inventory (§5.2), Identify Gaps (§5.3), Prioritise (§5.4), and Implement — Mitigate or Migrate (§4.6/§5.5); each card shows a plain-language explainer + enumerated requirements (hybrid tone) + aligned compliance frameworks.
  - _4-Tier Maturity Model_ — horizontal card strip for Tier 1 Partial → Tier 2 Risk-Informed → Tier 3 Repeatable → Tier 4 Adaptive, colour-coded by tone (error → warning → info → success); each card lists characteristics and "how to reach this tier" steps.
  - _Framework Cross-Walk_ — summary table mapping each CSWP.39 step to the compliance frameworks already catalogued elsewhere on the page (OMB M-23-02, DORA Art. 9, NIS2 Art. 21, NSM-10, CNSA 2.0, CycloneDX CBOM, FIPS 140-3 IG, CMVP, NIST SP 800-131A, FIPS 203/204/205, ACVP, CA/B SC-081v3); each chip is clickable and jumps to the target tab with a pre-filled search query, so users can instantly see which framework-record supports which CSWP.39 requirement.
  - _New files_ — `src/components/Compliance/cswp39Data.ts` (typed static data: 5 steps, 4 tiers, cross-walk rows), `src/components/Compliance/CSWP39StepCard.tsx` (expandable step card), `src/components/Compliance/CSWP39Explorer.tsx` (explorer body).
  - _Routing_ — `?tab=cswp39` and `/compliance#cswp39` both select the new tab; mobile toggle has a new "CSWP.39" button.
  - _No Learn-module changes_ — the CryptoMgmtModernization module's v3.5.6 state is unchanged; the compliance tab reuses its `CryptoAgilityProcessDiagram` via direct import.

## [3.5.6] - April 23, 2026

### Changed

- **CryptoMgmtModernization — maturity scale realigned to NIST CSWP.39 4-tier model** [persona:architect] [persona:ciso] [view:/learn] — the internal CPM assessment scale was collapsed from 5 levels (Ad-hoc → Optimized, CMM-derived) to 4 tiers that map 1:1 to NIST CSWP.39 §6.5:
  - _`MaturityLevel` type_ (`data/maturityModel.ts`) narrowed to `1 | 2 | 3 | 4`; labels updated to CSWP.39 tier names: `Partial · Risk-Informed · Repeatable · Adaptive`.
  - _Pillar indicators_ — each of the five pillars (Inventory, Governance, Lifecycle, Observability, Assurance) collapsed from 5 descriptors to 4; old L1/L3/L4/L5 strings mapped to new L1/L2/L3/L4 to preserve the highest-fidelity descriptors at each tier.
  - _Workshop Step 1_ — button row reduced from `[1…5]` to `[1…4]`; radar chart domain updated to `[0, 4]`; score display shows `x.x / 4.0`; intro text updated to reference the CSWP.39 tier scale.
  - _Introduction learn tab_ — maturity table column renamed from "CMM Level (approx.)" to "CPM Tier"; rows updated to `L1 · Partial` through `L4 · Adaptive`.
  - _`content.ts`_ — `workshopSummary` matrix description updated (`5×5×4` → `5×4 grid, rated 1–4`); `cswp39MaturityTiers` mapping sentence updated to direct 1:1 mapping; old CMM boundary labels removed.

### Added

- **CryptoMgmtModernization — PQC maturity model cross-walk section** [persona:architect] [persona:ciso] [view:/learn] — new section "PQC Maturity Models — Cross-Walk" in the Introduction learn tab aligns four industry frameworks by readiness band:
  - _Table_ — CSWP.39 (4 tiers) · Meta PQC Levels (5: PQ-Unaware → PQ-Enabled) · CMMI (5 levels: Initial → Optimizing) · ENISA/NCCoE (5 stages: Awareness → Operations); five rows from "No awareness" to "Continuous".
  - _Callout cards_ — scale difference (CSWP.39 Tier 1 spans two Meta levels) and focus difference (outcome vs. process-maturity vs. project-phase).
  - _Step 1 cross-reference panel_ — below the NIST CSWP.39 Alignment badge in the workshop, a compact "Model Cross-Reference" sub-panel dynamically maps the user's current average score to the equivalent Meta PQC Level, CMMI level, and ENISA/NCCoE stage.

- **CryptoMgmtModernization — Meta Engineering further reading reference** [persona:architect] [persona:developer] [view:/learn] — new "Further Reading & Case Studies" section in the Introduction learn tab with a clickable card for _Post-Quantum Cryptography Migration at Meta: Framework, Lessons, and Takeaways_ (Rafael Misoczki, Isaac Elbaz, Forrest Mertens, April 2026). Card summarises the five-tier PQC maturity model, ML-KEM-768/ML-DSA-65 algorithm rationale, hybrid deployment strategy, and hyperscale deployment lessons. Reference also added to `content.ts` `relatedStandards` narrative.

- **Library enrichment — Meta-PQC-Migration-2026 v3 update** — Ollama (`qwen3.5:27b`) v3 enrichment pass added 10 new dimensions: implementation attack surface, cryptographic discovery & inventory, supply chain & vendor risk (LibOQS, Open Quantum Safe consortium, HSM/CPU vendor dependencies), deployment & migration complexity (PQC Migration Levels framework), financial & business impact, and organizational readiness. Output: `src/data/doc-enrichments/library_doc_enrichments_04232026.md`. RAG corpus regenerated (6740 → 6749 chunks).

## [3.5.5] - April 23, 2026

### Fixed

- **CI — `QuizCategory` union missing `'crypto-mgmt-modernization'` and `'slh-dsa'`** — persona learning paths referenced these two category IDs but the `QuizCategory` discriminated union in `Quiz/types.ts` did not include them, causing `TS2322` errors at build time. Added both members to the union.

- **CI — `quizDataLoader.ts` `Record<QuizCategory, ...>` incomplete** — the `CATEGORY_CONFIG` record must exhaustively cover every `QuizCategory` member; after the union was extended, the record was missing entries for `'crypto-mgmt-modernization'` and `'slh-dsa'`. Added label, description, and icon metadata for both categories.

- **CI — `HsmCapacityCalculator.test.ts` expected values out of sync with revised ops/sec defaults** — classical-HSM defaults changed in v3.5.4 (ML-DSA-65: 500 → 150 ops/s; ML-KEM-768: 3 000 → 500 ops/s) but the test file still asserted the old computed HSM counts. Recalculated all expected values across 11 tests and updated inline comments to reflect the corrected formulas.

## [3.5.4] - April 23, 2026

### Fixed

- **Hybrid Signature workshop — `RangeError: "secretKey" expected Uint8Array of length 4032`** [view:/learn] — `ml_dsa65.sign(msg, secretKey)` was called with arguments swapped (`sign(secretKey, msg)`) in both `concatenationSign` and `nestingSign`; the message bytes were being validated as the secret key, producing a length mismatch equal to the message length (~170 bytes for a typical workshop message). Corrected argument order in `HybridSignatureService.ts`.

- **HSM capacity defaults — ops/sec figures corrected** [view:/learn] — classical-HSM reference profile numbers revised to better match published vendor datasheets: RSA-2048 and ECDSA/ECDH P-256 corrected to 100 000 ops/s; ML-DSA-65 software fallback revised to 150 ops/s; ML-KEM-768 revised to 500 ops/s; AES-128/256 revised to 50 000 / 25 000 ops/s. Source note updated accordingly.

### Changed

- **Hybrid Signature workshop — ML-DSA backend split by construction** [persona:developer] [persona:architect] [view:/learn] — concatenation and nesting now route their ML-DSA-65 operations through the softhsmv3 WASM HSM (`CKM_ML_DSA`, PKCS#11 v3.2) while Silithium remains on `@noble/post-quantum` (`Sign_internal`, external-μ mode). EC-Schnorr stays on `@noble/curves` for all three constructions (no PKCS#11 Schnorr mechanism exists in v3.2). New `HybridSignatureHsmService.ts` encapsulates the HSM-backed keygen, sign, and verify paths.
  - _UI clarity_ — each construction now displays a backend legend showing which primitive uses which library (softhsmv3 WASM / @noble/curves / @noble/post-quantum); HSM status banner (loading / ready / error) shown on mount; key panel shows PKCS#11 handle numbers for HSM-managed ML-DSA keys.
  - _Educational rationale_ — Silithium's fused Fiat-Shamir protocol requires `ML-DSA.Sign_internal` (external-μ mode, FIPS 204 §5.2), which has no PKCS#11 v3.2 equivalent; concatenation and nesting use standard `ML-DSA.Sign` / `ML-DSA.Verify` (FIPS 204 §§5.2–5.3), which map directly onto `CKM_ML_DSA`. This boundary is now visible in the UI.

## [3.5.3] - April 22, 2026

### Added

- **CryptoMgmtModernization workshop — CSWP.39 Steps 6–8** [persona:architect] [persona:ciso] [view:/learn] — three new workshop steps closing the Identify Gaps → Prioritise → Implement process gaps against NIST CSWP.39:
  - _Step 6: Management Tools Coverage Audit_ — rates 6 CSWP.39 tool categories (Crypto Scanners, Vulnerability Management, Asset Management/SBOM, Log/SIEM, Zero-Trust Enforcement, Data Classification) on a None/Manual/Partial/Automated scale; produces a gap heatmap, tool-chain completeness %, and prioritised recommendations per gap; CSWP.39 §5.3 "Identify Gaps" step.
  - _Step 7: Risk Analysis & Prioritisation Engine_ — scores CBOM assets (loaded from Step 3 or sample data) on FIPS status, ESV (SP 800-90B) status, PQC readiness, posture, and EoL; outputs a prioritised Critical/High/Medium/Low queue with per-asset action guidance; CSWP.39 §5.4 "Prioritise" step.
  - _Step 8: Implement — Mitigate or Migrate_ — CSWP.39 §4.6 decision-tree wizard; user picks an asset from the CBOM (or sample list), answers 5 crypto-agility questions (source available? modular API? refresh scheduled? maintenance window feasible?), and receives either a MIGRATE recommendation (algorithm + timeline + CNSA 2.0 target) or a MITIGATE recommendation (crypto gateway spec + mandatory sunset date + §4.6 "not a permanent solution" callout).
  - _Shared CBOM state_ — Step 3 (Library CBOM Builder) now exports its parsed CBOM via `onCbomExport` callback; Steps 7 and 8 consume the live data directly; when Step 3 has not been visited, both steps fall back to sample educational assets.
  - _CSWP.39 process badge on all 8 steps_ — `WorkshopStepHeader` now accepts `cswp39Step?: string`; every step shows which CSWP.39 process step it executes (e.g., "Govern · §5.1", "Inventory · §5.2", "Identify Gaps · §5.3").

## [3.5.2] - April 22, 2026

### Added

- **CryptoMgmtModernization — full NIST CSWP.39 realignment** [persona:architect] [persona:executive] [persona:ciso] [view:/learn] — the module is now explicitly framed as the operational execution layer of the NIST CSWP.39 (Dec 2025) Crypto Agility Strategic Plan:
  - _CSWP.39 process diagram (Visual tab)_ — interactive reproduction of CSWP.39 Fig. 3 (`CryptoAgilityProcessDiagram`); six clickable zones (Governance, Assets, Management Tools, Data-Centric Risk Management, Mitigation, Migration); each zone reveals what belongs there, which CPM pillar maps to it, and the CSWP.39 section reference.
  - _Three new Learn tab sections_ injected after "Why Modernize Now":
    - **NIST CSWP.39 — The Crypto Agility Strategic Plan** — the five-step Govern → Inventory → Identify Gaps → Prioritise → Implement loop with reference to the Visual tab diagram.
    - **The Management Tools Layer** — six tool categories (Crypto scanners, Vulnerability management, CMDB/SBOM pipelines, SIEM, Zero-Trust enforcement, Data classification) mapped to CPM pillars; explains why this layer is needed to prevent manual, stale data in the Risk Analysis Engine.
    - **CSWP.39 Crypto Agility Maturity Tiers** — 4-tier table (Partial → Risk-Informed → Repeatable → Adaptive) with mapping to the existing 5-level CMM scale.
  - _Maturity Self-Assessment CSWP.39 callout_ — Workshop Step 1 now shows the corresponding CSWP.39 tier (Tier 1–4) below the "Recommended next milestone" panel; derived dynamically from the average score.
  - _Scenario 9 — "Crypto gateway or full migration"_ — exercises tab now has nine scenarios; Scenario 9 covers CSWP.39 §4.6 bump-in-the-wire decision framework (legacy PKI with unavailable source code, SHA-1 certs, mission-critical, team gone).
  - _`content.ts` additions_ — `cswp39Framework`, `managementToolsLayer`, `mitigateVsMigrate`, `cswp39MaturityTiers` narrative keys added; `overview` prepended with CSWP.39 strategic context; `relatedStandards` updated with NIST CSWP.39 Dec 2025 reference.

## [3.5.1] - April 22, 2026

### Added

- **Threshold Signing — Step 5 in Stateful Signatures workshop** [persona:architect] [persona:researcher] [persona:developer] [view:/learn] — educational simulation of the Haystack/coalition threshold construction (Kelsey, Lang & Lucks) for hash-based signatures, accessible at `/learn/stateful-signatures?tab=workshop&step=4`:
  - _User-configurable t-of-n threshold_ — trustees n: 2–5, threshold t: 1–n; only single-level LMS parameter sets (H5/W1, H5/W8, H10/W4) are supported, consistent with the research scope.
  - _4-phase interactive flow_ — Configure → Dealer Setup (simulated keypair + CRV + trustee share distribution) → Threshold Signing (select ≥ t trustees to enable aggregation; "insufficient shares" error shown when below threshold) → Result (simulated signature + key reuse prevention comparison between single-signer and t-of-n).
  - _CRV size table_ — side panel shows Common Reference Value growth: LMS single-level (practical, ~2–500 MB depending on threshold); HSS 2-level (~1–20 GB); HSS 3+ levels (Impractical). Explains why HSS hypertrees are excluded.
  - _Research attribution_ — Haystack paper (Kelsey, Lang, Lucks) cited; note on lattice-based threshold alternatives (threshold Dilithium / FROST variants) for larger thresholds.
  - No new WASM or external dependencies — simulation uses a deterministic FNV-1a hash for reproducible share/signature display.

## [3.5.0] - April 22, 2026

### Added

- **Hybrid Signature Spectrums workshop (PT-027)** [persona:developer] [persona:architect] [persona:researcher] [view:/playground] [view:/learn] — live side-by-side demonstration of the three hybrid signature constructions from IETF `draft-ietf-pquip-hybrid-signature-spectrums`:
  - _Concatenation_ — `sig₁ ‖ sig₂` (EC-Schnorr secp256k1 + ML-DSA-65); no non-separability; most backwards-compatible.
  - _Nesting_ — `sign_ML(msg ‖ sig_EC)`; outer ML-DSA covers the EC component (Weak Non-Separability / WNS); EC sig still verifies alone.
  - _Silithium (Fused Fiat-Shamir)_ — shared challenge `μ = H(R ‖ pk_ec ‖ pk_ml ‖ msg)`; neither component verifies without the shared μ; achieves Strong Non-Separability (SNS) per ePrint 2025/2059; smaller than concatenation.
  - All three constructions perform live key generation and signing in-browser using `@noble/post-quantum` (ML-DSA) and `@noble/curves` (secp256k1).
  - Accessible from `/playground` (PT-027) and linked from `/learn/hybrid-crypto?tab=workshop&step=5`.

- **`EsvStatus` field on crypto libraries and HSMs** [persona:architect] [persona:developer] [view:/learn] — `CryptoLibrary` and `HsmVendorRecord` now carry an `esvStatus` field (`active | historical | revoked | in-mip | not-validated`) tracking SP 800-90B Entropy Source Validation status independently of the FIPS 140-3 certificate. Surfaces in the Library & Hardware CBOM Builder workshop.

- **Posture KPI additions** [persona:ciso] [persona:architect] [view:/learn] — six new KPIs added to `POSTURE_KPIS`:
  - Governance: `policy-enforcement-rate` (% endpoints with auto-verified cipher-suite config), `governance-attestation-coverage` (% decision owners completing annual attestation).
  - Observability: `cipher-scan-coverage` (% endpoints covered by ongoing protocol-version scan), `standards-watch-lag` (days from deprecation notice to CBOM rule update).
  - Assurance: `esv-coverage-libs` (% libraries with active SP 800-90B ESV cert), `esv-coverage-hsm` (% HSMs with active SP 800-90B ESV cert).

- **Module Q&A CSV — Crypto Management Modernization** [persona:researcher] [view:/learn] — `src/data/module-qa/module_qa_crypto-mgmt-modernization_04222026.csv` closes the gap where every peer module had quiz coverage but this one had none; 20 Q&A pairs grounded in the 36 library entries, CBOM pillars, CLM 47-day cadence, FIPS 140-3 IG September 2025 PQC update, CNSA 2.0 deadlines, OMB M-23-02, and SP 800-90B ESV.

### Changed

- **CryptoMgmtModernization module → v1.1.0** [persona:architect] [persona:executive] [persona:developer] [view:/learn] — cross-check remediation across six gap categories:
  - _CMVP cert numbers corrected (GAP-1 CRITICAL)_: five wrong cert numbers replaced with verified NIST CMVP values — Thales Luna G7 `#4962`, BoringCrypto `#5244`, Bouncy Castle FIPS Java `#4943`; Entrust nShield, YubiHSM 2, AWS CloudHSM, GCP Cloud HSM entries corrected; WolfCrypt FIPS posture downgraded to `yellow` (PQC APIs available but not inside FIPS boundary per CMVP #4718). AWS-LC ESV status set to `active`.

  - _Content depth additions_: two new subsections in `content.ts`:
    - `entropyCompliance` — explains the SP 800-90B ESV track as a common PQC migration gap; covers the RNG chain audit requirement (entropy source → conditioning → DRBG), cloud/container ESV re-evaluation triggers, and the CMM Assurance pillar extension for ESV status in CBOMs.
    - `protocolDeprecation` — documents the standards-watch subscription model (IETF RFC Obsoletes/Updates, SP 800-131A cycle, NSA CNSA, CA/B Forum, ETSI TS 119 312, BSI TR-02102, ANSSI RGS) and ties each deprecation event to CBOM classification rule updates and the Observability scanning loop.

  - `keyConcepts` and `workshopSummary` expanded to cover SP 800-90B ESV in the CBOM Builder and the Program Office Model (five CPM roles with RACI).
  - `relatedStandards` updated: NIST SP 800-90B/A/C, SP 800-131A Rev 2, RFC 8996, RFC 7465, ETSI TS 119 312, BSI TR-02102, ANSSI RGS added.

  - _Library tags (GAP-2)_: `crypto-mgmt-modernization` added to `module_ids` of four library entries (`US-CISA-ACDI-Strategy-2024`, `BSI TR-02102-1`, `ANSSI-PG-083-v3-2026`, `NIST-SP-800-131A-Rev3`) in `library_04222026_r4.csv` (copy of r3).
  - _RFC 8555 library entry (GAP-3)_: new ACME entry added to `library_04222026_r4.csv` with `crypto-mgmt-modernization` tag.
  - _Un-attributed claim attribution (GAP-4)_: CMVP queue, HSM CVE revalidation, EU DORA/NIS2, and protocol-deprecation claims wired to source `referenceId` citations in `Introduction.tsx`.
  - _ROI Builder attribution (GAP-5)_: inline source comments added to the three previously un-sourced defaults (FIPS-drift remediation, library-CVE response, quantum-breach avoidance) citing NIST IR 8547 / ENISA PQC Integration Study / internal domain model.

- **HSM Capacity Calculator — multi-location support** [persona:architect] [persona:ops] [view:/playground] — `hsmCounts` renamed to `hsmsPerLocation`; new `numLocations` parameter; per-location HA computation (`perLocationRaw`, `perLocationRequired`); fleet total = `numLocations × perLocationRequired`; `OrgParams` + `deriveUseCaseTps` helper for org-size-driven defaults. `ml-kem-768` added as a distinct algo in load distribution.

### Data

- **`library_04222026_r4.csv`** — copy of r3; adds `crypto-mgmt-modernization` to four entries; adds RFC 8555 (ACME) entry; previous r3 snapshot kept per 2-version rule.
- **`pqc_product_catalog_04222026.csv`** — new product catalog snapshot dated 2026-04-22.
- **RAG corpus + embed manifest** rebuilt to include new module Q&A content and updated library entries.

## [3.4.0] - April 22, 2026

### Changed

- **SP 800-227 coverage — hybrid KEM depth & cross-module tagging** [persona:architect] [persona:developer] [persona:researcher] [view:/learn] [view:/library] — closes the gap between SP 800-227 being referenced and it being taught:
  - **HybridCrypto module depth** (`/learn/hybrid-crypto`): expanded from name-drop to spec-faithful teaching across four topic areas:
    - _Parameter-set selection table_ — ML-KEM-512 → NIST Category 1 (AES-128, IoT/short-lived), ML-KEM-768 → Category 3 (AES-192, default TLS), ML-KEM-1024 → Category 5 (AES-256, CNSA 2.0/federal); includes HNDL risk framing for retention-window-driven selection.
    - _Combiner construction deep-dive_ — concatenation order fixed per protocol (classical ‖ PQC per SP 800-56C); HKDF vs KMAC alternatives explained; dual-PRF assumption stated (security holds if either half remains secure); domain-separation framed as a mandatory SP 800-227 requirement, not optional.
    - _New "Implementation Requirements" section_ (SP 800-227 §4 + FIPS 203 §7.1) — implicit rejection (why a pseudorandom output on failure prevents chosen-ciphertext probing, not just that it exists); constant-time decapsulation required for FIPS validation; approved DRBG mandatory for encapsulation randomness; side-channel hardening must cover both halves of a hybrid construction.
    - _Transition framing_ — NIST SP 800-227 §1 "interim-measure" language surfaced; migration to pure PQC tied to algorithm maturation (cryptanalysis + deployment), not calendar deadlines alone.
  - **Cross-module tagging** — `NIST SP 800-227` added to the `standards` registry of four modules that demonstrate hybrid KEX in practice: `TLSBasics`, `VPNSSHModule`, `OSPQC`, `PlatformEngPQC`.
  - **Library dependencies** — `NIST SP 800-227` added to the `dependencies` field of five hybrid KEM protocol entries in `library_04222026_r2.csv`: `draft-ietf-tls-ecdhe-mlkem-04`, `draft-ietf-ipsecme-ikev2-mlkem`, `draft-ietf-lamps-pq-composite-kem-12`, `ETSI TS 103 744`, `draft-kampanakis-curdle-ssh-pq-ke`. Previous snapshot archived per the 2-version rule.
  - **RAG corpus** — `rag-summary.md` updated with all new content; run `npm run generate-corpus` to propagate.

- **Library CSV refresh to `04222026_r1`** [persona:architect] [persona:researcher] [view:/library] — replaces `04212026` as the
  current snapshot. Intentionally drops 9 reference rows that were
  audited out (`CAB-Forum-SC-081v3`, `Forrester-TEI-CLM-Automation`,
  `Gartner-CryptoCOE-Mahdi`, `Gartner-PQC-Time-To-Prepare`,
  `McKinsey-PQC-Preparation`, `Ponemon-Global-PKI-Trends-2026`,
  `Venafi-Ponemon-Outage-Cost`, `AppViewX-47Day-Certs`,
  `DigiCert-PQC-Maturity-Model`). Six older CSV versions archived to
  `src/data/archive/` per the 2-version rule; `library_04212026.csv`
  kept as the previous snapshot for New/Updated badge diffs. Ships with
  accompanying `doc-enrichments/library_doc_enrichments_04222026.md`.

### Added

- **WASM charon validation exports (Phase 3a)** [persona:developer] [persona:architect] [view:/playground] — the
  `strongswan-v2.wasm` binary now exports three real library-level
  validators that prove the ML-DSA + ML-KEM source patches are live, not
  just present in source:
  - `wasm_vpn_validate_proposal(str)` — parses an IKEv2 proposal string
    through charon's own `proposal_create_from_string()` and reports
    whether any ML-KEM transform (IDs 35/36/37 per
    draft-ietf-ipsecme-ikev2-mlkem) was accepted.
  - `wasm_vpn_validate_cert(pem, len)` — loads a PEM cert via
    `lib->creds->create(CRED_CERTIFICATE, CERT_X509, BUILD_BLOB_PEM)` and
    reports the recognized key type, with `is_ml_dsa: true` when RFC 9881
    OIDs were parsed.
  - `wasm_vpn_list_key_exchanges()` — returns the numeric transform IDs
    charon recognizes for ML-KEM + classical groups.

  Exposed through `src/wasm/strongswan-v2/bridge-v2.ts` as
  `validateProposal()`, `validateCert()`, `listKeyExchanges()`. Wired into
  the VPN simulator as a new **Validate WASM charon** panel in the Raw
  Config tab.

  This closes plans 1 and 2 of the hub↔sandbox gap report at the library
  validation level. The simulation-only caveat on ML-KEM proposal strings
  has been replaced with accurate language: the proposals do parse against
  the real charon engine; only the full IKE handshake driver (Phase 3b+
  of the WASM shims) remains a simulation.

- **VPN Simulator — gap-closure vs the Docker sandbox** [persona:developer] [persona:architect] [view:/playground], phase 1 of 6:
  - **Algorithm benchmark matrix** — new "Run algorithm matrix" button runs
    keygen + self-sign for RSA-3072 and ML-DSA-{44, 65, 87} against the live
    softhsmv3 session and renders a timings / cert-size / pubkey-size table.
    Mirrors the sandbox's `/api/run/vpn/matrix` endpoint at the cert-path
    level (handshake-level matrix deferred until the WASM charon accepts
    ML-KEM + ML-DSA upstream).
  - **Config export as .zip** — new "Download config bundle" button packages
    the currently-active `strongswan.conf` + `ipsec.conf` (initiator +
    responder) plus either `ipsec.secrets` (PSK mode) or generated PEM certs
    (dual auth), plus a README with the resolved CKA_ID handles, ready to
    lift into a real strongSwan deployment.
  - **Session history via IndexedDB** — "Save session" writes the current
    mode/auth/algorithm/config bundle into the `pqctoday-vpn-sessions`
    IndexedDB store (keeps the 20 most recent); "History" opens a dialog
    listing past runs with per-row **Load** (restores mode, auth, MTU,
    fragmentation, strongswan.conf, ipsec.conf, PSK, and cert PEMs+CKA_IDs),
    **Delete**, and bulk **Clear all**. Note: this persists the **user's
    configuration**, not the softhsmv3 private-key state; true on-HSM
    persistence would require mounting Emscripten IDBFS inside the softhsmv3
    WASM build (deferred).
  - **Sandbox launch contract** — new "Launch full-fidelity sandbox" button
    calls `POST {VITE_SANDBOX_ORCHESTRATOR_URL}/sessions {scenarioId:'vpn'}`
    per `pqctoday-sandbox/docs/orchestrator-api.md` and opens the returned
    `baseUrl` in a new tab. Gracefully reports when the env var is unset.
- **New learn module: Cryptographic Management Modernization (LM-052)** [persona:executive] [persona:architect] [view:/learn] — a
  55-minute, 5-step executive-track module covering modern cryptographic
  posture management across certificates, libraries, software, and keys.
  Routed at `/learn/crypto-mgmt-modernization`, slotted into the executive
  track between `pqc-governance` and `vendor-risk`. Six Learn sections frame
  CPM as a continuous dual-loop program (strategic annual PDCA wrapping an
  operational Discover → Classify → Score → Remediate → Attest → Reassess
  loop) with explicit carve-out from crypto-agility (capability) and
  CryptoCOE (operating model). Five workshop tools: **CPM Maturity
  Self-Assessment** (5 pillars × 5 levels with radar chart), **Inventory
  Lifecycle Simulator** (6-stage operational loop with canonical CLM
  scenarios: shadow-cert discovery, 47-day cadence, intermediate-CA rotation,
  OCSP drift), **Library & Hardware CBOM Builder** (SBOM → CBOM mapper +
  library posture + FIPS 140-3 L3 trackers for OpenSSL, BoringSSL, liboqs,
  wolfCrypt FIPS, BC FIPS, Mbed TLS, RustCrypto, AWS-LC plus Thales Luna,
  Entrust nShield, Utimaco, Fortanix, YubiHSM, AWS/Azure/GCP HSMs),
  **No-Regret ROI Builder** (IRR under quantum-happens/never-happens
  scenarios with 5 benefit streams), and **Posture KPI Dashboard Designer**
  (KPI taxonomy across 5 pillars, audience-filtered for board/CIO/CISO).
  Eight exercises, glossary-aware content, RAG + Curious summaries, and
  bidirectional cross-links to `crypto-agility` (LM-007), `pqc-governance`
  (LM-037), `pqc-business-case` (LM-036), and `kms-pqc` (LM-024).
- **Library CSV `04212026`** [persona:architect] [persona:researcher] [view:/library] — next versioned snapshot (previous
  `04202026_r2` retained per `CSVmaintenance.md` two-version rule). **26
  new authoritative references** added for the CMM module plus **13 existing
  rows tagged**; covers CA/B Forum Ballot SC-081v3 (47-day TLS cadence by
  March 2029), NIST CMVP Validated Modules + Modules-In-Process databases,
  NIST ACVP, FIPS 140-3 IG September 2025 PQC update, Microsoft
  "Building your cryptographic inventory" (April 2026), EJBCA/Keyfactor
  Cryptographic Posture Management primers, Gartner CryptoCOE framing
  (David Mahdi, Brian Lowans), IBM Research CBOM (Ray Harishankar),
  Keyfactor CBOM introduction, Deloitte Tech Trends 2025, McKinsey PQC
  preparation, IBM IBV 2025 quantum-safe readiness, Sectigo 2025 State of
  Crypto Agility, Ponemon/Entrust Global PKI & IoT Trends 2026, Forrester
  Total Economic Impact of TLS/SSL certificate-lifecycle automation
  (DigiCert-commissioned, 312% ROI), AppViewX 47-day lifecycles, DigiCert
  PQC Maturity Model, Engineering at Meta PQC migration framework, InfoSec
  Global Gartner Hype Cycle positioning, IETF RFC 7030 (EST), RFC 4210
  (CMP), Security Boulevard / Forrester (Sandy Carielli) on cryptoagility,
  and Venafi / Ponemon cert-outage cost study.
- **Google Quantum AI whitepaper added to library** [persona:researcher] [persona:developer] [view:/library] — "Securing Elliptic Curve
  Cryptocurrencies against Quantum Vulnerabilities" (Babbush, Gidney et al.,
  Google Quantum AI + Ethereum Foundation, March 30 2026) is now in the library
  with module links to Quantum Threats, Blockchain PQC, and Standards Bodies.
- **secp256k1 added to Quantum Threats workshop** [persona:developer] [persona:researcher] [view:/threats] — Bitcoin/Ethereum's curve now
  appears in the Algorithm Vulnerability Matrix and Security Level Degradation
  tool with the verified estimate of ≤1,200 logical qubits + ≤90M Toffoli gates
  via Shor's algorithm.
- **ECC qubit estimates revised** [persona:researcher] [persona:developer] [view:/threats] — ECDSA P-256, X25519, and Ed25519 updated
  from ~2,330 to ~1,200 logical qubits, reflecting improved Shor's circuit
  efficiency for all 256-bit prime-order elliptic curves (Google Quantum AI,
  Mar 2026).
- **Fast-clock vs slow-clock CRQC distinction in HNDL/HNFL calculators** [persona:architect] [persona:researcher] [view:/threats] —
  explains that fast-clock CRQCs (superconducting, photonic) enable live mempool
  "on-spend" attacks while slow-clock types are the at-rest / HNDL threat.
- **Guided exercise 7: "ECC Blockchain Under Quantum Attack"** [persona:developer] [persona:researcher] [view:/threats] — on-spend attack
  scenario: Bitcoin transaction in the mempool, fast-clock CRQC at 1,200 qubits,
  and why blockchain infrastructure needs PQC migration now.
- **CertCapacityCalculator — math disclosures** [persona:architect] [persona:developer] [view:/playground] — all three charts now have
  collapsible "How this is calculated" sections with formula, assumptions, and
  benchmark sources.
- **HsmCapacityCalculator — estimation disclosures** [persona:architect] [persona:developer] [view:/playground] — each TPS slider has a
  "How we estimated this" toggle showing rationale, math, PQC impact, and
  sources.

### Changed

- **CertCapacityCalculator — bandwidth model corrected** [persona:architect] [persona:developer] [view:/playground] — TLS payload now
  includes both `Certificate` and `CertificateVerify`; prior model used an
  incorrect RSA-2048 delta baseline.
- **certCapacityDefaults — AVX2 cycle-accurate benchmarks** [persona:developer] [persona:architect] [view:/playground] — RSA, ECDSA, and
  ML-DSA figures updated from rough estimates to cycle counts from
  CRYSTALS-Dilithium Round 3 and OpenSSL 3.x AVX2 measurements.
- **Certificate Lifecycle tools moved to PKI Workshop** [persona:developer] [view:/learn] — ACME PQC Walkthrough
  and Cert Capacity Calculator removed from Migrate page; now in the learn
  module where they belong.
- **VPN Simulator marked work-in-progress** [persona:developer] [persona:architect] [view:/playground] — WIP badge shown while
  strongSwan IKEv2 + ML-DSA AUTH method integration is pending.

### Fixed

- **Quiz answer buttons — long options no longer truncate** [persona:all] [view:/learn] — option buttons
  wrap text properly instead of clipping multi-line answers.
- **HSM key inspection was silently broken for all VPN simulation keys** [persona:developer] [view:/playground] — clicking
  the eye icon on any key generated by the VPN Simulator did nothing. Root cause:
  in Rust engine mode `crossCheckModuleRef` is null, so the `engine: 'rust'` routing
  in `HsmKeyTable` returned early before calling `C_GetAttributeValue`. Responder
  keys (Slot 2) had a second issue — they were queried against the initiator session
  handle. Both are now fixed: `HsmKey` carries a `sessionHandle` set at generation
  time, and the module lookup falls back to `moduleRef` when `crossCheckModuleRef`
  is null (single-engine mode).
- **Charon diagnostic lines misclassified as errors in VPN log panel** [persona:developer] [view:/playground] — strongSwan
  routes all charon output to stderr; lines matching thread prefix patterns such as
  `00[IKE]` or `00[CFG]` are now correctly routed as informational rather than errors.
- **Hybrid Cert Inspector panel overflows on narrow screens** [persona:developer] [view:/playground] — the certificate
  selector left-column and IETF reference buttons now apply `min-w-0 overflow-hidden`
  and `truncate` so long OID strings clip instead of breaking the grid layout.
- **ML-KEM-512 mis-labelled as NIST L2** [persona:developer] [persona:architect] [persona:researcher] — corrected to **NIST L1** in
  `TLSClientPanel`, `TLSServerPanel`, and the TLS exercises table. Per FIPS 203,
  ML-KEM-512 targets Category 1 (≈AES-128 strength).
- **RSA VPN-sim certs now carry SubjectKeyIdentifier extension** [persona:developer] [persona:architect] [view:/playground] —
  `buildHsmSelfSignedCert` (the RSA path) now embeds SKID = SHA-1(pubkey)
  matching the `CKA_ID` set on the key objects. strongSwan's PKCS#11 plugin
  discovers the private key via `C_FindObjects({CKA_ID=ski})`; without the
  extension, ML-DSA worked but RSA fell back to PSK auth.
- **VPN sim ML-DSA cert auth fully wired end-to-end** [persona:developer] [persona:architect] [view:/playground] — `hsm_generateMLDSAKeyPair`
  now accepts an optional `keyId` parameter that's stamped as `CKA_ID` on both
  the public and private key objects at keygen time. VPN sim's `provisionKeys`
  generates a random 20-byte `keyId` per key pair and passes the same bytes into
  both keygen and the X.509 `SubjectKeyIdentifier` extension. strongSwan's
  pkcs11 plugin now finds the private key via `C_FindObjects({CKA_ID=ski})`
  so ML-DSA cert auth no longer falls back to PSK. `CKA_ID = 0x00000102`
  exported from `softhsm/constants.ts` + the parallel `softhsm.ts`.
- **Mobile / iOS Safari polish** [persona:developer] — glass-panel now sets
  `-webkit-backdrop-filter` so blur renders on Safari; `Button` icon size
  gets `touch-manipulation` to suppress iOS double-tap zoom; `CodeBlock`
  uses `max-h-[40vh] sm:max-h-[650px]` so long code blocks don't dominate
  small screens; `MainLayout` mobile bottom-nav adds
  `pb-[max(1rem,env(safe-area-inset-bottom))]` for iPhone home-bar
  clearance; `MainLayout` root switches `overflow-hidden` → `overflow-clip`;
  Timeline/Algorithms/Compliance/Playground get shorter mobile-nav labels.

### Changed

- **VPN Simulator: ML-DSA private keys now discoverable by PKCS#11 plugin** [persona:developer] [persona:architect] [view:/playground] —
  `hsm_setKeyId` sets `CKA_ID = SHA-1(pubkey)` on both public and private ML-DSA key
  objects immediately after generation. This matches the RFC 5280 §4.2.1.2 SKID method
  expected by strongSwan's PKCS#11 plugin, enabling `C_FindObjects` to locate the
  private key from the certificate's SubjectPublicKeyInfo fingerprint.
- **VPN Simulator: IPsec config hardened for tunnel mode** [persona:developer] [persona:architect] [view:/playground] — initiator and responder
  configs now include `leftsubnet`, `rightsubnet`, and `type=tunnel` so the SA is
  negotiated as a proper tunnel rather than a transport-mode connection.
- **VPN Simulator: cert auth uses `leftcert=` for all algorithm types** [persona:developer] [persona:architect] [view:/playground] — removed the
  ML-DSA-specific `leftsigkey=%smartcard` path; the PKCS#11 plugin now discovers the
  private key via `CKA_ID` matching regardless of algorithm.
- **Hybrid Crypto module: Composite Signatures section removed** [persona:developer] [persona:architect] [view:/learn] — the section
  described an IETF draft whose OIDs are not yet finalized; removed to avoid teaching
  unstable identifiers. Content can be reintroduced when the RFC is published.
- **Role guide: self-assessment checklist removed** [persona:executive] [view:/learn] — the interactive exposure-score
  checklist was removed from the Role Guide "Why It Matters" view to streamline the
  module and reduce scope overlap with the dedicated Assessment page.

## [3.3.9] - April 20, 2026

### Fixed

- **Learn page was broken for all visitors** — navigating to `/learn` showed
  "Something went wrong" on both Chrome and Safari. Root cause: the glossary
  tooltip system was changed to load its data asynchronously, which made it
  vulnerable to a module-bundling conflict with WebAssembly code on any learn
  module page. The glossary data is now loaded synchronously at startup,
  eliminating the conflict entirely. Tooltips appear immediately on first
  render with no loading delay.

### Added

- **Browser compatibility notice on VPN and SSH simulators** — Safari and
  Firefox users now see a clear warning explaining that the live cryptographic
  handshakes (strongSwan IKEv2, OpenSSH ML-KEM) require a Chromium-based
  browser (Chrome, Edge, Brave). The Run / selftest buttons are automatically
  disabled; all educational content and panels still render normally.
- **"Crypto Only" filter in the PKCS#11 log panel** — a new toggle (on by
  default) hides housekeeping calls like session open/close and object searches,
  leaving only the 27 cryptographic operations (key generation, signing,
  encryption, KEM encapsulate/decapsulate). Toggle it off to restore the full
  raw log.

### Changed

- **SSH simulator — "Build in progress" notice removed** — the placeholder
  warning about missing WASM artifacts has been removed now that the
  `openssh-client.wasm` and `openssh-server.wasm` builds are in place. The
  panel description also clarifies that ML-KEM-768 × X25519 key exchange is
  natively built into OpenSSH 10.x.

### Fixed

- **Compliance facets — Org / Industry / Region derived from full dataset**
  (`Compliance/ComplianceLandscape.tsx`): the Organization, Industry, and Region
  filter dropdowns previously rebuilt their option lists from `sourceFrameworks`
  (the active body-type tab's slice), so populated facets were silently hidden
  whenever the user switched tabs — e.g. the Africa region disappeared from
  Standards while remaining present on All Frameworks. Switched all three
  facets to derive their option set from the full `complianceFrameworks` dataset
  so every populated facet stays selectable on every tab; also dropped the
  hardcoded `AVAILABLE_INDUSTRIES` list in favour of a union over `fw.industries`
  so new industries in the CSV appear automatically. Region count next to the
  "All Regions" label still reflects the in-tab framework count.
- **VPN Simulator — daemon-default cert algorithm switched to RSA**
  (`Playground/hsm/VpnSimulationPanel.tsx`): default client signing algorithm
  changed from `ML-DSA` → `RSA` so the strongSwan WASM daemon handshake works
  out of the box on first visit. Users can still switch to ML-DSA to generate
  real PQC cert artifacts (visible via Inspect + HSM Key panels + PKCS#11 log),
  with a new mode-aware warning banner explaining that the daemon itself does
  not yet run on ML-DSA certs (strongSwan core lacks the
  `draft-ietf-ipsecme-ikev2-mldsa` AUTH method) and a Start-Daemon tooltip that
  surfaces the same warning when ML-DSA is selected in dual-auth mode.

### Changed

- **Playground Workshop — WIP tools hidden by default**
  (`Playground/PlaygroundWorkshop.tsx`): `wipFilter` initial state flipped from
  `'all'` → `'hide'` for every visitor (embed mode already hid them). The
  filter remains user-toggleable via the WIP control; this change just makes
  the first-visit surface match the stable, vendor-presentable subset.
- **strongSwan WASM rebuilt** (`public/wasm/strongswan.wasm` 9.7MB → 11.9MB,
  `public/wasm/strongswan.js` 1488 → 671 lines): rebuilt from the
  `pqctoday-hsm` companion repo with the latest charon + softhsmv3 plumbing.
  Loader/JS shrank ~55% as the build moved more bootstrap into the wasm
  module; the wasm itself grew because additional plugins are now linked in.

### Added

- **strongSwan v2 WASM — experimental softhsmv3 PKCS#11 selftest + cross-Worker
  ML-KEM-768 handshake** (`public/wasm/strongswan-v2.{js,wasm}`,
  `public/wasm/strongswan-v2-bob-worker.js`, `src/wasm/strongswan-v2/bridge-v2.ts`,
  `Playground/hsm/VpnSimulationPanel.tsx`): new 11.7 MB WASM build alongside the
  existing 12 MB baseline (`strongswan.wasm` untouched), driven by
  [`pqctoday/pqctoday-hsm`](https://github.com/pqctoday/pqctoday-hsm)'s new
  `strongswan-wasm-v2-shims/` scaffold. Gated entirely behind the
  `VITE_WASM_VPN_V2=1` env flag so regular users see no change. When the flag
  is on, a card at the top of the VPN simulator exposes two actions:
  - **"Run ML-DSA + ML-KEM selftest"** — in-browser round-trip through softhsmv3:
    ML-DSA-65 keygen → sign → verify (3309 B signature per FIPS 204) AND
    ML-KEM-768 encap/decap loopback (1184 B pubkey / 1088 B ciphertext /
    32 B shared secret per FIPS 203). All crypto is real HSM via PKCS#11
    mechanisms `CKM_ML_DSA` (0x1D) and `CKM_ML_KEM` (0x17); same code path the
    native sandbox fixed in `pqctoday-hsm` commit `236d9a4` (10-bug stack:
    OID alignment, `CKA_ENCAPSULATE`/`DECAPSULATE` attributes, v3.2 function
    signatures, role-aware length checks).
  - **"Cross-Worker KEM handshake"** — main thread plays Alice, a dedicated
    Web Worker plays Bob with an independent WASM instance and independent
    softhsmv3 state. Bytes-only exchange via `postMessage` (Alice's 1184 B
    pubkey out, Bob's 1088 B ciphertext back). Both sides derive a 32 B
    shared secret that must match byte-for-byte. Validates the browser
    transport primitive needed for the future full IKE_SA_INIT + IKE_AUTH
    wire-format exchange. The Bob worker lives at
    `public/wasm/strongswan-v2-bob-worker.js` and uses `importScripts` to
    load the same v2 loader.

  Live event log + per-metric pass/fail indicators render under both buttons.
  The experimental label is intentional: this lands the cryptographic
  primitives + cross-Worker transport, but the full IKE wire format (SA/KE/No
  payloads, IKE_AUTH with ML-DSA signature) is Phase 5c, not yet integrated.

- **HSM Capacity Calculator** (`src/components/Playground/hsm/HsmCapacityCalculator.tsx`,
  `HsmCapacityCalculator.test.ts`, `src/data/hsmCapacityDefaults.ts`,
  `Playground/workshopRegistry.tsx`, `PKILearning/modules/HsmPqc/index.tsx`,
  `PKILearning/moduleData.ts`): new fleet-sizing tool covering the top 10 enterprise HSM
  workflows (TLS, code signing, payment HSM, TDE/database, KMS root keys, VPN/IPsec,
  SSH host, DNSSEC, etc.) with side-by-side classical (RSA-3072 / ECDSA P-256) vs PQC
  (ML-DSA-44/65/87) sizing. Outputs storage MB, TLS cert bandwidth, aggregate network
  MB/s, and CPU-core utilisation per workflow, plus a totals row. Registered as
  `PT-026` in the workshop registry and surfaced as Step 5 of the HSM-PQC learning
  module (Gauge icon) — module step count bumped from 4 to 5. Defaults table
  (`hsmCapacityDefaults.ts`) is the single source of truth for ops/sec, signature
  sizes, and certificate bandwidth assumptions; covered by colocated unit tests.
- **PKI Workshop — Certificate Capacity Calculator overhaul**
  (`PKIWorkshop/CertCapacityCalculator.tsx`): bandwidth column converted from
  per-cert KB to aggregate MB/s, CPU column converted from "max sign ops/sec" to
  "% of single core consumed" so numbers map cleanly to capacity-planning
  conversations. Legend removed in favour of clarified table headers; CSV export
  now includes the new bandwidth and CPU columns.
- **Command Center — in-drawer artifact creation + builder adapters**
  (`BusinessCenter/ArtifactCard.tsx`, `ArtifactDrawer.tsx`, `ArtifactCard.test.tsx`,
  `businessToolsRegistry.tsx`, `BusinessCenter/adapters/RiskRegisterBuilderStandalone.tsx`,
  `RiskHeatmapGeneratorStandalone.tsx`, `ComplianceTimelineBuilderStandalone.tsx`,
  `BusinessCenterView.tsx`, `useBusinessMetrics.ts`, sections under
  `BusinessCenter/sections/*`): refactored the artifact pipeline so empty
  placeholders launch the matching builder directly inside the drawer (no
  navigation away from the Command Center). New standalone adapter wrappers around
  the full-page learning-module builders (`RiskRegisterBuilder`,
  `RiskHeatmapGenerator`, `ComplianceTimelineBuilder`) handle form-state
  persistence and artifact save. Single source of truth registry
  (`ARTIFACT_TYPE_TO_TOOL_ID`, `TOOL_LABELS_BY_ARTIFACT_TYPE`) now shared with the
  `/business/tools/:id` route, eliminating the duplicated mapping previously kept in
  two places. Drawer auto-flips from create → view mode when a save callback fires.
- **Risk Register store** (`src/store/useRiskRegisterStore.ts`): dedicated Zustand
  store for risk-register builder state, isolated from `useModuleStore` so
  in-flight form data doesn't pollute persisted module artifacts. Follows the
  project persistence conventions (explicit `version`, `migrate`,
  `onRehydrateStorage` crash guard).
- **Deployment Playbook → Command Center save**
  (`PKILearning/modules/MigrationProgram/components/DeploymentPlaybook.tsx`,
  `PKILearning/common/OpsChecklist.tsx`): `OpsChecklist` gained an optional
  `onSave` prop that renders a "Save to Command Center" button alongside the
  existing "Copy Markdown" action with toggling saved-state feedback. Deployment
  Playbook wires this up to persist completed checklists as
  `deployment-playbook` artifacts (with checked items captured in `inputs` for
  later edit-mode restoration).
- **Compliance Table — mandate deadline labels**
  (`Compliance/ComplianceTable.tsx`): framework tabs (FIPS 140-3, ACVP, Common
  Criteria) now display a resolved "Deadline: YYYY" sub-label pulled from the
  loaded compliance data, plus a tooltip on tab hover for screen-reader / pointer
  accessibility. Ongoing mandates suppress the year label.
- **FilterDropdown — keyboard navigation** (`src/components/common/FilterDropdown.tsx`):
  ARIA-listbox keyboard support added to the shared dropdown — ArrowUp/Down to
  cycle options, Home/End to jump, Escape to close. Focus management targets
  `[role="option"]` buttons in the portal menu so the control is now WCAG 2.1 AA
  keyboard-operable.
- **Manufacturing industry support in assessment** (`src/hooks/assessmentData.ts`):
  added Manufacturing entries to `INDUSTRY_THREAT` (level 18, reflecting IEC 62443
  OT/ICS exposure, ISO/SAE 21434, TISAX, long-lived embedded controllers) and
  `INDUSTRY_COMPOSITE_WEIGHTS` (risk profile aligned to Aerospace/Defense). Closes
  a gap where manufacturing respondents were forced into "Other".
- **ComplianceStrategy module — extracted jurisdictions data**
  (`PKILearning/modules/ComplianceStrategy/data/jurisdictions.ts`,
  `components/JurisdictionMapper.tsx`): hardcoded `JURISDICTIONS` array lifted
  out of `JurisdictionMapper.tsx` into a typed data module
  (`JurisdictionConfig`) for reuse across the codebase and easier maintenance.
- **Curious persona — single-click experience shortcut**
  (`Landing/PersonalizationSection.tsx`): selecting the Curious persona now
  completes the personalization wizard immediately (sets curious persona, Global
  region, all industries, marks completed) so first-touch visitors aren't forced
  through the multi-step wizard before exploring.

### Changed

- **RightPanel — bottom drawer → right sidebar layout**
  (`RightPanel/RightPanel.tsx`, `Layout/EmbedLayout.tsx`, `Layout/MainLayout.tsx`):
  migrated the contextual side panel from a 50%-height bottom drawer (slide-up
  animation) to a fixed right sidebar (40vw width, slide-in from right). Both
  layouts add `sm:pr-[40vw]` transition padding when the panel is open so the
  main content reflows smoothly without the previous absolute-positioning
  overlap.
- **Module store — version 12 migration (roadmap cleanup + form-state inputs)**
  (`src/store/useModuleStore.ts`, `useModuleStore.test.ts`,
  `src/services/storage/types.ts`): bumped persisted version to 12; migration
  now filters out any stray `roadmap` document type (replaced by
  `migration-roadmap`) and preserves the new optional `inputs` field on
  `ExecutiveDocument` so builders can round-trip form state for Edit mode.
  `ExecutiveDocumentType` adds `deployment-playbook` and removes the retired
  `roadmap`. Migration tested against synthetic v11 stores.
- **OpenSSH WASM — connector path & event types** (`src/wasm/openssh.ts`,
  `openssh.test.ts`, `Playground/hsm/SshSimulationPanel.tsx`): comments and the
  build-in-progress banner now point at `pqctoday-hsm/openssh-pkcs11/` (the
  folded-in connector, per the 2026-04-18 repo consolidation) instead of the
  retired standalone `pqctoday-openssh` repo. New
  `pkcs11_structured` event added to the `SshHandshakeEvent` union for richer
  PKCS#11 logging from the worker.
- **strongSwan WASM — 44% size reduction + build-script cleanup**
  (`public/wasm/strongswan.wasm` 11.9MB → 6.7MB, `public/wasm/strongswan.js`
  regenerated, `public/wasm/openssh_server_worker.js` rebuilt, removed
  `scripts/build_strongswan_wasm.sh` and `strongswan-pqc-pkcs11.patch`):
  strongSwan WASM module now built and patched out of the `pqctoday-hsm`
  companion repo; the local build script and standalone patch are no longer
  needed in this repo and were deleted to remove a stale maintenance surface.
- **SearchIndex — limit slicing refactor** (`src/services/search/SearchIndex.ts`):
  removed `as const` narrowing on `MINISEARCH_OPTS` and switched the result-limit
  enforcement to a post-search `slice` so the configured `MAX_RESULTS` is honoured
  consistently regardless of MiniSearch's internal scoring shortcuts.
- **Embed manifest + RAG corpus regeneration** (`public/embed/manifest.json`,
  `public/data/embed-docs.json`, `public/data/rag-corpus.json`): regenerated
  artifacts to pick up the compliance/timeline data refresh and the deletion of
  retired CSVs (`compliance_03282026_r2.csv`,
  `pqc_authoritative_sources_reference_02282026.csv`,
  `timeline_03312026.csv`/`04012026.csv`/`04062026.csv`). RAG corpus shrinks
  significantly after dedup against the new authoritative files.

- **Compliance ↔ Timeline consistency pipeline** (`timeline_04182026.csv`,
  `src/utils/timelineResolver.ts`, `scripts/validate-csv-refs.ts`,
  `ComplianceLandscape.tsx`, `KnowledgeGraph/data/graphBuilder.ts`): established a closed
  loop between the `/compliance` and `/timeline` views. **Validator**: extended
  `validate-csv-refs.ts` with two semantic checks — (5) every compliance row with a
  parseable `deadline` year must have at least one timeline event spanning that year in
  one of its referenced orgs; (6) orphan timeline orgs surfaced as informational.
  Exposed via new `npm run validate:compliance-timeline` alias. **Timeline data**: added
  10 timeline rows to cover previously-dangling compliance refs — `African Union:AUC`
  (Malabo Convention 2023), `International:GSMA` (2026-2028 MNO transition phase),
  `China:ICCS` (2027-2030 NGCC migration), `G7:G7 CEG` (2030-2032 critical financial
  systems), `Global:3GPP SA3` (TR 33.841 study), `Global:TCG` (TPM 2.0 v1.85 PQC draft),
  `South Africa:IR` (POPIA enforcement), `Nigeria:NDPC` (NDPA 2023), `Kenya:ODPC`
  (2022 Guidance Note), `Egypt:MCIT` (Law 151/2020 regs). Validator now reports 0
  broken refs / 0 coverage gaps across 112 compliance rows × 219 timeline events.
  **Resolver** (`timelineResolver.ts`): new pure `resolveTimelineRef()` utility that
  parses `Country:OrgName` refs and returns the matching `TimelineEvent[]` + earliest
  / latest year; indexed once on module load. **UI** (`ComplianceLandscape.tsx`): card
  - table timeline chips now deep-link to `/timeline?country=<country>` (landing on
    the correct Gantt lane instead of the unfiltered timeline root) and show a dated
    summary in the hover tooltip. Expanded framework-details list resolves each ref to
    show the top 3 events with year ranges; frameworks with no matching timeline events
    surface a visible "no events in timeline" warning so drift is obvious at a glance.
    **Knowledge graph** (`graphBuilder.ts`): replaced the broken fuzzy-match on event
    _titles_ (which always missed because refs are org labels) with a proper
    `country:org` → eventIds index; the `compliance-timeline` graph edge is no longer
    dead code. **Deadline-urgency parser** (`deadlineUrgency.ts`,
    `complianceData.ts`): strings starting with `ongoing` / `annual` are now treated as
    year-less regardless of parenthetical provenance like `"Ongoing (GL-2004-2022)"`
    that previously mis-parsed as year 2004 and pushed dots ~167% off the timeline bar;
    for ranged deadlines, the earliest future year is preferred. **Deadline-timeline
    viz bug fix** (`ComplianceLandscape.tsx`): year labels migrated from `flex
justify-between` to absolute `yearLeftPercent()` positioning so labels and dot
    columns share a centerline; dense-year stacks (2025 = 21 deadlines) now render in
    a 3-column grid with a dynamically-sized container (no more vertical clipping);
    added `px-4` padding on the overflow wrapper so edge dots at 2024 / 2036 are fully
    visible.
- **Compliance data & UI — accuracy + completeness overhaul** (`compliance_04182026.csv`,
  `pqc_authoritative_sources_reference_04182026.csv`, `complianceData.ts`,
  `ComplianceLandscape.tsx`, `ComplianceView.tsx`): audit-driven refresh of the compliance
  data source and the `/compliance` UI. **Data**: added 5 African frameworks (South Africa
  POPIA, Nigeria NDPR/NDPA, Kenya DPA, Egypt PDPL, African Union Malabo Convention) closing
  the Africa regional gap; populated `library_refs` on all 48 frameworks that previously had
  empty cross-references (PCI-DSS, HIPAA, SWIFT-CSP, GDPR, ISO-27001, SOC-2, HITECH, FDA
  21 CFR 11, NATO STANAG 4774, UN ECE WP.29, NERC-CIP, IEC-62443, DO-326A, RTCA DO-355A,
  FERPA, COPPA, TISAX, MICA, TSA Pipeline, KpqC/KCMVP, NZISM, INCD, BOI, OSCCA NGCC,
  Swiss/Dutch NCSC, KISA, INDIA-DST, UAE, ACVP, Taiwan MODA, Malaysia NACSA, Saudi NCA,
  India CERT-In CBOM, Italy ACN, Spain CCN, Bahrain NCSC, Jordan CBJ, CSA, ITU-T SG17,
  ISO 19790, Brazil ANPD, Denmark CFCS, NY DFS 23 NYCRR 500, ETSI EN 303 645,
  PQC Coalition, QED-C); every new reference validated against `library_04172026.csv`.
  Flagged 33 authoritative sources as `Compliance_CSV=Yes` (NIST, ENISA, ANSSI, BSI,
  NCSC UK, NSA/CISA, ACSC, CSE, IETF, ISO/IEC, ETSI, IEEE, PQCA, TCG, FS-ISAC, CMVP, etc.)
  — previously zero, breaking the "what feeds this view?" contract. **Loader**
  (`complianceData.ts`): added missing `industry_alliance` body type to `validBodyTypes[]`
  (PQC Coalition, PQCA, QED-C no longer silently misclassified); mapped previously-orphaned
  `trusted_source_id` column; added derived `deadlineYear` + `deadlinePhase` fields and a
  9-bloc `regionForCountry()` taxonomy (NORAM, LATAM, EU, Europe non-EU, UK, APAC, MENA,
  Africa, Global). **UI** (`ComplianceLandscape.tsx`, `ComplianceView.tsx`): added global
  Region filter (with per-bloc framework counts) and Deadline filter (Active / Imminent /
  Near-term / Mid-term / Long-term / Ongoing) wired to URL params (`region=`, `phase=`) so
  filter state deep-links and survives back/forward nav across all 4 Landscape tabs;
  added inline Glossary button on the Certification Schemes `SectionHeader` explaining
  FIPS 140-3, ACVP, Common Criteria, EUCC, CNSA 2.0, and CSPN/ANSSI Qualification; wrapped
  CSV export in `try/catch` with a dismissible inline error banner (was previously
  uncaught). Archived `compliance_03282026_r2.csv` and
  `pqc_authoritative_sources_reference_02282026.csv`.
- **Command Center — ROI Calculator overhaul** (`src/utils/roiMath.ts`,
  `ROICalculatorSection`, `ROICalculator`): new shared pure-math module (43 unit tests) with
  NPV + WACC discount rate (new KPI card), capex/opex split (benefit net-of-opex for
  payback/NPV), decomposed quantum multiplier (HNDL / post-CRQC uplift / detection uplift)
  replacing the opaque 2.5× default, tornado sensitivity chart ranking drivers at ±30%, a
  Cost of Inaction KPI for counterfactual exposure, PDF/DOCX exports alongside markdown,
  board-ready executive framing banner, and an `asOf` + `PenaltyType` schema on
  `roiBaselines`. Applicable-frameworks default now tightens to the assessment's mandated
  subset first, user selections second, industry list last.
- **Command Center — KPI plan completion (E4 / D9 / E2 / E1)**
  (`~/.claude/plans/review-command-center-kpi-federated-seahorse.md`): closes the remaining
  persona-fit gaps. **E4 Board-Ready NIST CSF Composite** — single 0–100 exec score derived
  from assessment `categoryScores`, mapped to CSF 2.0 Govern / Identify / Protect / Respond
  (row CTAs deep-link to `/assess`). **D9 Per-Layer Vendor Readiness** — new
  `vendorReadinessByLayer` map on `useExecutiveModuleData`; meta-KPI expands to one row per
  infrastructure layer for architects; architect persona removed from global
  vendor-readiness to avoid double-counting. **E2 Regulatory Exposure Index** — new
  `frameworkFines.ts` lookup (25+ frameworks, USD millions) with log-scaled auto-score
  (`100 − 50·log10`). **E1 Crown-Jewel Coverage** — manual-input KPI with CSF / ISO /
  SOC 2 mappings and TODO anchor for future assessment integration. 18 new vitest cases
  across four files; full suite 1,769/1,769 pass.
- **VPN Simulator — visual SKF payload fragmentation slicing**
  (`VpnSimulationPanel.tsx`): payload rendering now visually slices KE payloads into SKF
  fragments per the configured fragment-size budget so learners can see IKE_INTERMEDIATE
  fragmentation in action (rather than just an aggregate total).
- **VPN Simulator — ML-DSA authentication via draft standards** (`VpnSimulationPanel.tsx`):
  restores ML-DSA-65 authentication in the IKEv2 handshake, guarded by an explicit UI
  warning (`FlaskConical` icon) that calls out the
  [draft-ietf-ipsecme-ikev2-auth-ml-dsa] status so users understand the mode is not yet
  standards-track.

- **5G SUCI Playground — UX overhaul**: three new sub-components — `ConfigureCard` (collapsible
  first-visit vs returning-user settings panel), `ScenarioIntroStrip` (operator ↔ IMSI-catcher
  perspective toggle), and `AttackerSidecar` (per-step "what the eavesdropper captures" sidebar).
  New `suciUxMeta.ts` provides per-step phase labels, plain-English step explanations, and
  attacker-observation copy. Plain-English mode toggle is on by default and persisted to
  `localStorage`; scenario view (operator/attacker) is session-scoped via `sessionStorage`.
- **StepWizard — phase progress + plain-English rail**: `PhaseProgress` component renders a
  phase-grouped progress bar (labelled segments with per-step tick marks) that activates when
  `Step.phase` fields are present. `PlainEnglishRail` component renders plain-English
  explanations beside the terminal when `plainEnglishEnabled` is true. New optional `Step`
  fields: `phase`, `plainEnglish`, `attackerSidecar`, `isClimax`, `climaxBanner`. New
  `StepWizardProps`: `plainEnglishEnabled`, `phaseLabels`, `canonicalTabNames`, `tabExplainer`.
- **PKCS#11 Log Panel — Beginner Mode**: `pkcs11PlainEnglish.ts` maps every PKCS#11 C\_ call to
  a 4–8-word plain-English description (algorithm-aware: distinguishes ML-KEM, ML-DSA, X25519,
  RSA, etc.). A new `beginnerMode` prop on `Pkcs11LogPanel` adds a `BookOpenText` toggle that
  renders an extra grid column with the translation alongside the raw function name and args.
- **SecureBootPQC — TPM 2.0 sandbox deep-link**: banner CTA in the TPM Key Hierarchy Explorer
  tab links to `/playground/sbx-tpm-pqc-migration`, pointing users at the live pqctoday-tpm
  (Stefan Berger's libtpms + swtpm) + pqctoday-hsm softhsmv3 scenario for real TPM2_CreatePrimary
  outputs covering EK / SRK / AIK / IDevID in ML-KEM-768 and ML-DSA-65.
- **Docker Playground — pqctoday-sandbox iframe embed**: `DockerPlaygroundView` completely
  rewritten from scenario-tile/modal UI to an `<iframe>` embedding the pqctoday-sandbox app.
  postMessage handshake: sandbox sends `pqc:ready` → hub responds `pqc:challenge` +
  `pqc:config` (vendorId, theme, allowedRoutes). Dynamic `pqc:resize` events drive
  auto-height (600–1600 px). Reads `VITE_SANDBOX_BASE_URL` (default `http://localhost:4000`);
  shows `EmptyState` when unset.
- **Glossary — TPM 2.0 / TCG V1.85 terms**: five new entries — EK (Endorsement Key, ML-KEM-768
  in TCG V1.85), AIK (Attestation Identity Key, ML-DSA-65, used in TPM2_Quote), SRK (Storage
  Root Key, ML-KEM-768 wrapping, drove TPM_BUFFER_MAX 4096→8192), IDevID (IEEE 802.1AR, factory
  ML-DSA-65), and PCR (Platform Configuration Register, extend-only hash chain). All linked to
  `/learn/secure-boot-pqc`.
- **PKCS#11 glossary** (`src/data/glossary/pkcs11Terms.ts`): PKCS#11 token hover-chip
  definitions used by `OutputFormatter` for inline tooltips.
- **Library CSV v04172026** — new entries: KpqC Competition Results (HAETAE/AIMer/SMAUG-T/NTRU+
  final selections), FIPS 140-3 IG PQC (NIST CMVP self-test requirements for FIPS 203/204/205),
  3GPP TR 33.841 PQC Study 2025 (hybrid PQC for TLS/IPSec/IKEv2 in 5G), liboqs v0.15.0 (PQCA).
- **Library enrichments v04172026** (`src/data/doc-enrichments/library_doc_enrichments_04172026.md`):
  full enrichment run for the new library entries.

### Changed

- **VPN Simulator — true MTU + fragmentation config logic**
  (`VpnSimulationPanel.tsx`, `useAssessmentFormStore.ts`,
  `Assess/smartDefaults.ts`, `Step5Compliance.tsx`, `LandingView.tsx`,
  `workshopRegistry.tsx`, `src/wasm/openssh.ts`): assessment-driven MTU + fragment-size
  smart defaults now flow through to the IKEv2 simulator so learners see realistic
  IKE_INTERMEDIATE fragmentation behaviour (previously the UI accepted inputs but the
  simulator ignored them).
- **VPN Simulator — FlaskConical icon for ML-DSA draft warning** (`VpnSimulationPanel.tsx`):
  replaces the generic warning icon on the ML-DSA draft-standards banner with `FlaskConical`
  to better signal experimental status.

- **Dev server network-accessible** (`vite.config.ts`): `host: true` added so the dev server
  binds to all interfaces, enabling the pqctoday-sandbox iframe embed to reach the hub from
  localhost on port 4000.

- **NIST CMVP scraper — all security levels** (`scripts/scrapers/nist.ts`): now fetches all
  active FIPS 140-3 certificates (previously filtered to L3 only). Actual security level
  (L1/L2/L3) is extracted from each cert's detail page via `extractSecurityLevel()` parsing
  the "Overall Level" field. Compliance data updated: 2,386 records (NIST 1,269, CC 913,
  ANSSI 179, ENISA 25).
- **Library CSV v04152026** — 450 records (+21 new entries)
- **Product catalog CSV v04162026** — 731 records (+2 new entries including Cosmian KMS and SOPS)
- **Vendors CSV v04162026** — 302 records (+1 new vendor)
- **Catalog enrichments** — two full enrichment runs: `catalog_doc_enrichments_04152026.md`
  (361 entries) and `catalog_doc_enrichments_04162026.md` (661 entries); 11 products skipped
  due to bad source docs (DigiCert x5, Thales x2, CATO, Hitachi, SK Telecom, NZISM)
- **Library enrichments** — `library_doc_enrichments_04152026.md` updated (+414 entries full
  re-run); `library_doc_enrichments_04162026.md` (2 new entries)
- **Timeline enrichments** — `timeline_doc_enrichments_04152026.md` updated (+205 entries
  full re-run); 1 skipped entry (Europol QSFF — 33 chars, corrupt source)
- **Catalog entry script** (`scripts/add-catalog-entries-04162026.mjs`): one-off script for
  adding Cosmian KMS and SOPS to the product catalog

### Fixed

- **VPN Simulator — ML-DSA raw pubkey configuration respected**
  (`VpnSimulationPanel.tsx`): ML-DSA signature generation was ignoring the raw-pubkey
  setting, causing a config/behaviour mismatch with `CKA_EC_PARAMS`-driven ML-DSA draft
  flows. Fixed to honour the configured key format end-to-end.
- **VPN Simulator — WASM OOM + thread pool exhaustion in IKE simulator**
  (`VpnSimulationPanel.tsx`): long IKE runs were saturating the WASM thread pool and
  tripping out-of-memory errors when users re-ran scenarios without a full reset. Tightened
  lifecycle + pool reuse so the simulator stays stable across repeated runs.
- **What's New modal — View Changelog deep link** (`src/components/ui/WhatsNewModal.tsx`): the
  "View Changelog" action used the first unseen changelog section's version, which resolved to
  `Unreleased` and produced an invalid `/changelog#vUnreleased` anchor. Now uses
  `getCurrentVersion()` so the link always targets the released version section (e.g.
  `/changelog#v3.3.8`).
- **Bouncy Castle cert #4943 security level** (`migrate_certification_xref_04012026_r1.csv`):
  corrected FIPS 140-3 L3 → L1 across 4 rows (bouncy-castle-c-net, bouncy-castle-c-java,
  bouncy-castle-java, bouncy-castle-java-lts) — level was incorrectly inherited from the
  old L3-only NIST scraper filter

### Changed

- **Compliance data re-scraped** (`public/data/compliance-data.json`): 2,386 total records
  (was 2,391 — 5 expired certs removed); NIST records now include correct per-cert security
  levels (L1/L2/L3) instead of hardcoded L3

---

- **Implementation Attacks sub-tab** in Detailed Comparison — 12 algorithm attack profiles
  covering ML-KEM, ML-DSA, FN-DSA/Falcon, HQC, Classic McEliece, FrodoKEM, NTRU+, SLH-DSA,
  LMS/XMSS, Hybrid KEM, Composite Signatures, and cross-cutting RNG/API risks. Each profile
  includes per-attack severity ratings (Critical/High/Medium/Low), countermeasures, and
  peer-reviewed references with local archive links.
- **KAT Validation sub-tab** in Detailed Comparison — in-browser NIST Known Answer Tests via
  softhsmv3 WASM PKCS#11 for ML-KEM (FIPS 203), ML-DSA (FIPS 204), and SLH-DSA (FIPS 205)
  with collapsible PKCS#11 diagnostics panel.
- **FN-DSA/Falcon attack profile** — documents floating-point Gaussian sampler side-channel
  vulnerability (most SCA-vulnerable NIST PQC standard) with five countermeasures.
- **LMS/XMSS stateful signature attack profile** — documents catastrophic state-reuse
  vulnerability with crash-safe persistence and state management countermeasures.
- **BIKE-1/3/5 added to algorithm reference CSV** — NIST Round 4 code-based KEM (QC-MDPC)
  with sizes from the BIKE specification and liboqs; 80 algorithms now in the reference data.
- **Cryptographic hardness assumptions** shown in Security Levels view — each algorithm card
  displays the underlying mathematical problem (Module-LWE, binary Goppa decoding, hash
  collision resistance, MQ problem, etc.).
- **"Why KATs Matter" explainer** in KAT Validation — collapsible educational content covering
  FIPS 140-3 requirements, implementation correctness, and in-browser verification value.
- **"Quick Reference" panel** in the About modal — practical analogies for security levels,
  key sizes, and signature sizes for non-expert users.

### Changed

- **Performance baseline description fixed** — Info modal now correctly states RSA-2048 is the
  universal baseline across all algorithm families (previously incorrectly split between RSA-2048
  for KEMs and ECDSA-P256 for signatures).
- **Composite & Hybrid attack profile split into two tiles** — "Hybrid KEM (X25519+ML-KEM)"
  and "Composite Signatures (ML-DSA+ECDSA)" with distinct attack details and countermeasures.
- **NTRU+ attack reference clarified** — notes that research was on classic NTRU, transferable
  to NTRU+ via shared polynomial multiplication structure.
- **Draft/Candidate indicator badges** added to Performance and Size views — amber "Draft" badge
  shown for algorithms still in candidate or draft standardisation (HQC, BIKE, MAYO, HAWK, etc.).
- **Attack severity ratings** replace uniform "Vulnerable" badges — 4-tier system (Critical for
  remote/practical key recovery, High for physical access required, Medium for theoretical,
  Low for easily mitigated) with color-coded legend.
- **Countermeasures section** added to all attack profiles — actionable mitigations including
  masking, constant-time implementation, DRBG compliance, zeroization, and FIPS 140-3 guidance.
- **SLH-DSA side-channel status corrected** from "Unknown" to "Not Found" — hash operations
  are inherently constant-time with no known SCA vulnerabilities.

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
