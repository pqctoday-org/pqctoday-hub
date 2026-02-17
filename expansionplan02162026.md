# PQC Today — Tier 1 Persona Expansion Plan

_Date: 2026-02-16_

---

## Goal

Expand the PQC Today target audience beyond technical cryptography engineers by implementing three high-impact, low-to-medium effort features that unlock **CISOs/executives**, **students/newcomers**, and **risk officers** as new personas.

---

## Expansion A: Executive Summary Dashboard

**Target persona**: CISOs, board members, non-technical leadership
**New route**: `/executive`

### Why

The site already has rich compliance, threat, and migration data — but it is presented in deeply technical UIs. CISOs need a one-page, jargon-free summary they can screenshot or export for board decks.

### Proposed Changes

#### Executive Component

##### [NEW] `src/components/Executive/ExecutiveView.tsx`

Top-level route component (lazy-loaded, following existing pattern in `App.tsx`).

**Layout — 4 sections:**

1. **KPI Cards Row** (4 `glass-panel` cards):
   - **Algorithms at Risk** — count of classical algorithms still in use (sourced from `algorithmsData.ts` transition table — rows where `migrationStatus !== 'Complete'`)
   - **Compliance Gaps** — count of compliance records without PQC validation (from `complianceData`)
   - **Critical Threats** — count of threats rated "Critical" or "High" (from `threatsData.ts`)
   - **Migration Tools Available** — count from `migrateData.ts`

2. **Risk Narrative Panel** — 3–4 sentence plain-English summary auto-generated from the KPI data:

   > "Your organization faces X critical quantum threats. Y of your cryptographic algorithms require migration before NIST's 2030 deadline. Z compliance certifications lack PQC validation."

3. **Top 5 Priority Actions** — table with columns: Priority, Action, Affected Systems, Deadline, linking to the relevant module (`/threats`, `/compliance`, `/migrate`).

4. **Export Bar** — "Download PDF" and "Copy Link" buttons.

##### [NEW] `src/components/Executive/ExecutiveKPICard.tsx`

Reusable KPI card component: icon, value, label, trend indicator (up/down/neutral), color.

##### [NEW] `src/components/Executive/ExecutiveReport.tsx`

PDF export component. Uses the browser's `window.print()` with a print-specific CSS media query (no external PDF library needed — keeps bundle small). A `@media print` stylesheet hides nav, footer, and export bar; forces white background.

##### [NEW] `src/hooks/useExecutiveData.ts`

Custom hook that aggregates KPI values from existing data modules:

```typescript
interface ExecutiveMetrics {
  algorithmsAtRisk: number
  totalAlgorithms: number
  complianceGaps: number
  totalCompliance: number
  criticalThreats: number
  totalThreats: number
  migrationToolsAvailable: number
  topActions: PriorityAction[]
  riskNarrative: string
}
```

Imports data from `threatsData.ts`, `algorithmsData.ts`, `migrateData.ts`, and compliance service data. Computations are pure (no side effects).

#### Routing & Navigation

##### [MODIFY] `src/App.tsx`

- Add lazy import: `const ExecutiveView = lazy(() => import('./components/Executive/ExecutiveView')...)`
- Add route: `<Route path="/executive" element={<ExecutiveView />} />`

##### [MODIFY] `src/components/Layout/MainLayout.tsx`

- Add nav item: `{ path: '/executive', label: 'Executive', icon: BarChart3 }` (from `lucide-react`)
- Position it first in the nav array (before Home), or right after Home — this is the "executive entry point"

##### [MODIFY] `src/components/Landing/LandingView.tsx`

- Add a CTA card in the hero section: "For executives → Get your PQC readiness summary" linking to `/executive`

#### Styling

##### [NEW] `src/styles/executive.css`

- Print-specific styles (`@media print`)
- KPI card color variants (green/amber/red based on severity)

---

## Expansion B: Glossary & PQC 101 Onboarding

**Target persona**: Students, newcomers, non-technical staff, journalists
**Enhancement area**: Learning modules + global UI

### Proposed Changes

#### Glossary System

##### [NEW] `src/components/common/Glossary.tsx`

A modal/slide-out panel accessible from every page via a floating button (bottom-right, `BookOpenText` icon). Contains:

- **Search input** — filters terms in real-time
- **Alphabetical index** — A–Z sidebar
- **Term cards** — each term has: name, plain-English definition, related module link, complexity badge (Beginner/Intermediate/Advanced)

##### [NEW] `src/data/glossaryData.ts`

Static data file with ~80 terms. Schema:

```typescript
interface GlossaryTerm {
  term: string
  acronym?: string // e.g., "KEM"
  definition: string // Plain English, max 2 sentences
  technicalNote?: string // Optional deeper explanation
  relatedModule?: string // e.g., "/learn/pki-workshop"
  complexity: 'beginner' | 'intermediate' | 'advanced'
  category: 'algorithm' | 'protocol' | 'standard' | 'concept' | 'organization'
}
```

Initial terms include: PQC, KEM, DSA, lattice, hash-based, code-based, NIST, FIPS, X.509, PKI, TLS, HKDF, ECDH, RSA, ECC, ML-KEM, ML-DSA, SLH-DSA, Hybrid, CNSA, ACVP, CMVP, Common Criteria, Harvest Now Decrypt Later, Q-Day, quantum advantage, qubit, superposition, Shor's algorithm, Grover's algorithm, etc.

##### [MODIFY] `src/components/Layout/MainLayout.tsx`

- Render `<Glossary />` globally (alongside the existing `<WhatsNewToast />`)

#### Expanded Module 1 — "PQC 101"

##### [MODIFY] Module1-Introduction directory

Currently minimal. Expand into a proper multi-step onboarding:

###### [NEW] `src/components/PKILearning/modules/Module1-Introduction/PQC101Module.tsx`

A 5-step interactive flow (matching existing module step patterns):

| Step | Title            | Content                                                                             |
| ---- | ---------------- | ----------------------------------------------------------------------------------- |
| 1    | Why PQC?         | The quantum threat in plain English — Shor's algorithm breaks RSA, what it means    |
| 2    | What's Changing  | Classical → PQC algorithm families (lattice, hash, code-based) — visual comparison  |
| 3    | The Timeline     | Embed a simplified version of the Timeline view — key deadlines only                |
| 4    | Who Needs to Act | Industry-specific urgency (finance, healthcare, government) — uses threat data      |
| 5    | Your Next Steps  | Guided links to deeper modules based on role selection (engineer, manager, student) |

Each step uses the existing `glass-panel` card pattern with Framer Motion transitions.

##### [MODIFY] `src/components/PKILearning/Dashboard.tsx`

- Add "PQC 101" as the first module card in `activeModules[]` with a "Recommended for beginners" badge
- Add prerequisite indicators to existing module cards: e.g., PKI Workshop shows "Prerequisite: PQC 101"

##### [MODIFY] `src/components/PKILearning/PKILearningView.tsx`

- Add lazy import and route for `pqc-101`

#### Guided Tour (First-visit)

##### [NEW] `src/components/common/GuidedTour.tsx`

Lightweight tooltip-based tour that activates on first visit (tracked via `localStorage`). 5 tour stops:

1. Nav bar — "Navigate between modules here"
2. Timeline — "Track global PQC migration deadlines"
3. Playground — "Test real cryptographic algorithms"
4. Learn — "Start with PQC 101 if you're new"
5. Glossary button — "Look up any term you don't understand"

Uses absolute positioning with a semi-transparent overlay. No external tour library — simple custom component to keep bundle small.

##### [MODIFY] `src/components/Layout/MainLayout.tsx`

- Render `<GuidedTour />` conditionally (only if `localStorage.getItem('pqc-tour-completed')` is falsy)

---

## Expansion C: Risk Assessment Wizard

**Target persona**: CISOs, risk officers, compliance teams, IT directors
**New route**: `/assess`

### Why

The site has threat data and compliance data, but no personalized risk assessment. A wizard that asks "What do you use today?" and outputs a migration priority report would be the single most valuable tool for non-engineering personas.

### Proposed Changes

#### Wizard Component

##### [NEW] `src/components/Assess/AssessView.tsx`

Top-level route component. Contains the multi-step wizard with a progress bar.

##### [NEW] `src/components/Assess/AssessWizard.tsx`

5-step wizard flow:

| Step | Title                   | Input Type              | Details                                                                            |
| ---- | ----------------------- | ----------------------- | ---------------------------------------------------------------------------------- |
| 1    | Your Industry           | Single-select dropdown  | Options sourced from `threatsData.ts` industry list                                |
| 2    | Current Crypto          | Multi-select checkboxes | RSA-2048, RSA-4096, ECDSA P-256, ECDH, AES-128, AES-256, SHA-256, SHA-3, etc.      |
| 3    | Data Sensitivity        | Radio buttons           | Low / Medium / High / Critical — with "Harvest Now, Decrypt Later" explanation     |
| 4    | Compliance Requirements | Multi-select            | FIPS 140-3, Common Criteria, ANSSI, CNSA 2.0, eIDAS — sourced from compliance data |
| 5    | Migration Timeline      | Single-select           | Already started / Planning to start / Not started / Don't know                     |

##### [NEW] `src/components/Assess/AssessReport.tsx`

Report page shown after wizard completion. Sections:

1. **Risk Score** — 0–100 gauge (SVG-based, no library) with color coding:
   - 0–30: 🟢 Low risk
   - 31–60: 🟡 Medium risk
   - 61–80: 🔴 High risk
   - 81–100: ⚫ Critical risk

2. **Migration Priority Matrix** — table showing each selected algorithm, its quantum vulnerability, recommended PQC replacement (from `algorithmsData.ts`), and migration urgency

3. **Compliance Impact** — which selected compliance frameworks require PQC, and their deadlines

4. **Recommended Actions** — numbered list of prioritized steps, with links to relevant modules

5. **Export Bar** — "Download PDF" (reuses print CSS pattern from Executive view) and "Share Link" (serializes wizard answers to URL query params)

##### [NEW] `src/hooks/useAssessmentEngine.ts`

Pure scoring engine hook:

```typescript
interface AssessmentInput {
  industry: string
  currentCrypto: string[]
  dataSensitivity: 'low' | 'medium' | 'high' | 'critical'
  complianceRequirements: string[]
  migrationStatus: 'started' | 'planning' | 'not-started' | 'unknown'
}

interface AssessmentResult {
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  algorithmMigrations: AlgorithmMigration[]
  complianceImpacts: ComplianceImpact[]
  recommendedActions: RecommendedAction[]
  narrative: string
}
```

Scoring logic:

- Base score from industry threat criticality (from threats CSV)
- +15 for each quantum-vulnerable algorithm selected (RSA, ECDSA, ECDH)
- +20 if data sensitivity is "Critical" (HNDL risk)
- +10 for each compliance framework requiring PQC
- -20 if migration already started
- Clamped to 0–100

##### [NEW] `src/store/useAssessmentStore.ts`

Zustand store to persist wizard state across steps and allow back-navigation without data loss. Follows existing store pattern (`useModuleStore.ts`).

#### Routing

##### [MODIFY] `src/App.tsx`

- Add lazy import and route: `<Route path="/assess" element={<AssessView />} />`

##### [MODIFY] `src/components/Layout/MainLayout.tsx`

- Add nav item: `{ path: '/assess', label: 'Assess', icon: ClipboardCheck }` (from `lucide-react`)

##### [MODIFY] `src/components/Landing/LandingView.tsx`

- Add a prominent CTA: "Assess your quantum risk in 2 minutes → " linking to `/assess`

---

## Summary of All File Changes

| Action | File                                                                       | Expansion |
| ------ | -------------------------------------------------------------------------- | --------- |
| NEW    | `src/components/Executive/ExecutiveView.tsx`                               | A         |
| NEW    | `src/components/Executive/ExecutiveKPICard.tsx`                            | A         |
| NEW    | `src/components/Executive/ExecutiveReport.tsx`                             | A         |
| NEW    | `src/hooks/useExecutiveData.ts`                                            | A         |
| NEW    | `src/styles/executive.css`                                                 | A         |
| NEW    | `src/components/common/Glossary.tsx`                                       | B         |
| NEW    | `src/data/glossaryData.ts`                                                 | B         |
| NEW    | `src/components/PKILearning/modules/Module1-Introduction/PQC101Module.tsx` | B         |
| NEW    | `src/components/common/GuidedTour.tsx`                                     | B         |
| NEW    | `src/components/Assess/AssessView.tsx`                                     | C         |
| NEW    | `src/components/Assess/AssessWizard.tsx`                                   | C         |
| NEW    | `src/components/Assess/AssessReport.tsx`                                   | C         |
| NEW    | `src/hooks/useAssessmentEngine.ts`                                         | C         |
| NEW    | `src/store/useAssessmentStore.ts`                                          | C         |
| MODIFY | `src/App.tsx`                                                              | A, C      |
| MODIFY | `src/components/Layout/MainLayout.tsx`                                     | A, B, C   |
| MODIFY | `src/components/Landing/LandingView.tsx`                                   | A, C      |
| MODIFY | `src/components/PKILearning/Dashboard.tsx`                                 | B         |
| MODIFY | `src/components/PKILearning/PKILearningView.tsx`                           | B         |

**14 new files, 5 modified files, 0 deleted files.**
No features are being removed. All existing functionality remains unchanged.

---

## Verification Plan

### Automated E2E Tests (Playwright)

Three new e2e spec files following the existing pattern:

| Test File               | What It Covers                                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `e2e/executive.spec.ts` | `/executive` loads, 4 KPI cards render with numeric values, print button triggers `window.print`, nav link works        |
| `e2e/glossary.spec.ts`  | Glossary button visible on every route, opens modal, search filters terms, clicking a term link navigates correctly     |
| `e2e/assess.spec.ts`    | `/assess` loads, wizard steps advance/go-back, all inputs functional, report generates after step 5, risk score renders |

**Run command:**

```bash
npx playwright test e2e/executive.spec.ts e2e/glossary.spec.ts e2e/assess.spec.ts
```

### Lint Validation

```bash
npm run lint
```

Must pass with zero errors before PR.

### Manual Verification

These are visual/UX checks that can't be fully automated:

1. **Executive PDF export** — Navigate to `/executive`, click "Download PDF", verify the generated printout has white background, no nav/footer, and readable KPI cards
2. **Glossary on mobile** — Open site on a phone-width viewport (375px), verify glossary button is visible and modal is usable
3. **Risk Wizard flow** — Complete all 5 steps on both desktop and mobile, verify report renders and "Share Link" produces a URL that re-loads the report when pasted
4. **PQC 101 module** — Navigate to `/learn`, verify "PQC 101" appears first with a beginner badge, complete all 5 steps

---

## Implementation Order

Recommended build sequence to minimize integration conflicts:

Expansions A, B, and C can be built **in parallel** since they share no components (only shared modification points are `App.tsx`, `MainLayout.tsx`, and `LandingView.tsx`, which are merged at the end).

**Per-expansion order:**

- **A**: `useExecutiveData` hook → Executive components → Routing + nav → Styling
- **B**: `glossaryData.ts` → `Glossary.tsx` → `PQC101Module.tsx` → `GuidedTour.tsx` → Dashboard + routing
- **C**: `useAssessmentEngine` hook → `useAssessmentStore` → Wizard UI → Report + export → Routing
- **Final**: Update `LandingView.tsx` CTAs + write e2e tests + update `REQUIREMENTS.md`
