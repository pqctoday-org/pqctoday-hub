# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PQC Timeline App — a React SPA for post-quantum cryptography (PQC) education, migration planning, and interactive cryptographic operations. It integrates OpenSSL WASM (v3.6.0), liboqs, and Web Crypto API for real PQC algorithm demonstrations in-browser.

## Commands

```bash
npm run dev          # Dev server on port 5175
npm run build        # Scrape compliance data → tsc → vite build → copy 404.html
npm run lint         # ESLint (src, scripts, e2e, root files)
npm run format       # Prettier (whole project)
npm run format:check # Prettier check only
npm run test         # Vitest unit tests (all *.test.ts/.test.tsx)
npm run test:watch   # Vitest watch mode
npm run test:e2e     # Playwright E2E tests (e2e/ directory)
npm run coverage     # Vitest coverage report (v8 provider)
npm run test:ui      # Vitest browser UI
```

Run a single unit test: `npx vitest run src/components/MyComponent/MyComponent.test.tsx`
Run a single E2E test: `npx playwright test e2e/my-test.spec.ts`

## Architecture

**Routing & Code Splitting**: All top-level views are lazy-loaded via `React.lazy()` in `src/App.tsx`. Routes nest under `MainLayout` which provides the navigation shell. `AppRoot.tsx` wraps everything in `ErrorBoundary` → `Suspense` → `App`. Routes: `/` (Landing), `/timeline`, `/algorithms`, `/library`, `/learn/*` (includes `/learn/quiz`), `/playground`, `/openssl`, `/threats`, `/leaders`, `/compliance`, `/changelog`, `/migrate`, `/assess`, `/about`.

**State Management**: Zustand stores in `src/store/` with `persist` middleware for localStorage. Stores are modular — `useModuleStore` (learning progress/artifacts), `useThemeStore` (dark/light), `useVersionStore` (what's-new tracking), `tls-learning.store.ts` (TLS simulation), `useAssessmentStore` (assessment wizard, persisted to localStorage), `usePersonaStore` (active persona: executive/developer/architect/researcher, drives landing CTAs and journey step visibility).

**Persistence Conventions** — every persisted Zustand store MUST follow these rules to prevent data loss and crashes on version upgrades:

- **Explicit `version` number**: Every `persist()` config must include a numeric `version` field.
- **`migrate(persistedState, version)` function**: Must handle all version transitions. Must ensure every expected field exists with a safe default (empty string for scalars, empty array for arrays, `false` for booleans, `null` for nullable). Use `Array.isArray()` checks for array fields and `??` for scalars.
- **`onRehydrateStorage` crash guard**: Every store must include `onRehydrateStorage: () => (_state, error) => { if (error) console.error(...) }` so corrupted localStorage never crashes the app.
- **When adding/removing/renaming a persisted field**: Bump the `version` number and add a migration step in `migrate()` that provides a default for the new field or converts the old shape.
- **Never silently wipe user data**: Resets must be explicit user actions (e.g., a Reset button with confirmation). No auto-resets based on time thresholds.

**Crypto Stack** (layered, strict priority):

1. **OpenSSL WASM** (`src/services/crypto/OpenSSLService.ts`) — primary for all standard operations
2. **liboqs** (`@openforge-sh/liboqs`) — PQC algorithms not in OpenSSL (FrodoKEM, HQC, Classic McEliece)
3. **WASM wrappers** (`src/wasm/`) — ML-KEM, ML-DSA, LMS/HSS bindings
4. **@noble/\*, @scure/\*** — blockchain crypto (secp256k1, Ed25519, BIP32/39/44, Ethereum)
5. **Web Crypto API** (`src/utils/webCrypto.ts`) — X25519, P-256, ECDH

**Data Sources**: Static JSON/CSV files in `src/data/`. Compliance data scraped at build time via `npm run scrape` from NIST, ANSSI, and Common Criteria. CSV files use versioned naming (e.g., `leaders_01192026.csv`). Dev server proxies requests to NIST, BSI, ANSSI, and Common Criteria APIs (configured in `vite.config.ts`). Authoritative sources CSV (`pqc_authoritative_sources_reference_*.csv`) uses 13 columns with `lastVerifiedDate` at index 12; `AuthoritativeSource` type has `complianceCsv` and `migrateCsv` boolean fields; `ViewType` includes `'Compliance'` and `'Migrate'`.

**CSV Management** — MUST read and follow `docs/CSVmaintenance.md` before ANY CSV operation (record insert, update, delete, format change, or web source refresh). This is mandatory, not optional. Key rules:

- **Never edit a CSV in place** — copy to a new file with today's date (`MMDDYYYY`). Loaders auto-discover the latest via `import.meta.glob`. Example: to update `library_02212026.csv` on Feb 22, copy it to `library_02222026.csv` and make edits there.
- **Keep 2 versions** in `src/data/` for status tracking (`New`/`Updated` badges). Archive older files to `src/data/archive/`.
- **ID fields are sacred** — never change a record's ID value (`referenceId`, `threatId`, `name`, `softwareName`, etc.). This breaks status tracking and cross-references.
- **Cross-references** — before deleting any record, grep all CSVs for its ID (see `CSVmaintenance.md §5` for full dependency map). Key links: `compliance.libraryRefs → library.referenceId`, `compliance.timelineRefs → timeline events`, `library.dependencies → library.referenceId`, `migrate_certification_xref.software_name → migrate.software_name`, `migrate_certification_xref.cert_id → compliance-data.json record IDs`.
- **Certification cross-reference CSV** (`migrate_certification_xref_MMDDYYYY.csv`) — links migrate products to PQC certifications (FIPS/ACVP/CC) from `public/data/compliance-data.json`. Regenerate with `python3 scripts/match_certifications.py` after updating either the migrate CSV or running the compliance scraper. The script uses a manual mapping table in `MATCH_RULES` — add new entries when new products gain certifications. Loader: `src/data/certificationXrefData.ts`. Type: `CertificationXref` in `src/types/MigrateTypes.ts`. UI: certifications shown in `SoftwareTable.tsx` expanded row.
- **Format changes** (add/remove/rename columns) require updating the loader's TypeScript interface AND parse function. Follow the checklist in `CSVmaintenance.md §3.4`.
- **Web source updates** — when refreshing data from external sources, follow the 6-step workflow in `CSVmaintenance.md §8.2`: verify source → identify changes → record context in commit → apply to all affected CSVs → update changelog → verify.
- **Verify after changes**: `npm run build && npm run test`, then visually check the affected view + browser console.

**WASM Requirements**: Dev and preview servers set `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin` headers for SharedArrayBuffer support. The `predev` and `build` scripts copy liboqs WASM dist into `public/dist`.

**Tailwind v4 Theme**: No separate `tailwind.config` file. Theme is defined inline in `src/styles/index.css` using the `@theme` block with CSS custom properties. Light and dark mode color systems, phase colors, file type colors, and utility classes (`.glass-panel`, `.text-gradient`, `.shadow-glow`, status colors) are all defined there.

**Vitest Config**: Embedded in `vite.config.ts` (not a separate file). Uses `jsdom` environment, globals enabled, setup file at `./src/test/setup.ts`.

## Coding Standards

**Styling — Semantic tokens only** (full standard: `docs/ux-standard.md`, violations: `docs/ux-gap-analysis.md`):

- ALWAYS use semantic tokens: `text-primary`, `text-secondary`, `text-accent`, `text-foreground`, `text-muted-foreground`, `bg-background`, `bg-card`, `bg-muted`, `border-border`, `border-input`
- NEVER use raw palette classes: `text-blue-400`, `bg-gray-900`, `text-green-300`, `bg-black/40`, `border-white/10`, `bg-zinc-950`
- EXCEPTION: Full-screen modal backdrops (`fixed inset-0`) MAY use `bg-black/60`
- For status indicators use `.text-status-error`, `.text-status-warning`, `.text-status-success` + their `.bg-status-*` counterparts
- `.text-status-info` / `.bg-status-info` — available (uses `--info` CSS var defined in `src/styles/index.css`)
- Use `.glass-panel` for all card/pane containers; `.text-gradient` for primary page titles only (≥ `text-lg`)
- Every content page header MUST follow: `<Icon> + .text-gradient title + muted description + [SourcesButton, ShareButton, GlossaryButton]` (cluster hidden on mobile; omit on Landing and About)

**Component contracts**:

- `<Button>` — MUST for all click targets; never raw `<button>` in production code; variants: `gradient` (primary CTA), `outline`, `ghost`, `secondary`, `destructive`, `link`
- `<Input>` — MUST for all text inputs (current `bg-black/40` in component is a known bug, do not copy)
- `<FilterDropdown>` from `src/components/common/FilterDropdown.tsx` — MUST replace all native `<select>` elements
- `<CodeBlock>` — MUST for multi-line code display (current `bg-zinc-950` is a known bug, do not copy)
- Icons: `lucide-react` exclusively; icon colors must use semantic tokens (`text-primary`, `text-muted-foreground`, `.text-status-*`)
- Shared UI components (`src/components/ui/`): `<Skeleton>`, `<EmptyState>`, `<ErrorAlert>`, `<CategoryBadge>` exist and MUST be used — do not inline-style as workaround. See `docs/ux-standard.md` S4.8

**TypeScript**: Strict mode. Use `interface` for objects, `type` for unions/primitives. Avoid `any` — use `unknown` with narrowing.

**Components**: PascalCase filenames. Named exports. Colocate tests (`MyComponent.test.tsx`). Prefer reusable components from `src/components/ui/`.

**Imports**: Use `@/` path alias (maps to `src/`). Group: std lib → 3rd party → local components → styles/types.

**Crypto operations**: OpenSSL first for all standard operations. Use modern commands (`genpkey`, `pkey`) over deprecated ones (`ec`, `ecparam`). Do NOT install new crypto libraries without explicit permission. Only these are allowed (installed or pre-approved): `@openforge-sh/liboqs` (deprecated — migration to `@oqs/liboqs-js` planned), `@noble/*`, `@scure/*`, `ed25519-hd-key`, `micro-eth-signer`.

## Testing

- **Unit**: Vitest + @testing-library/react. Prefer accessible queries (`getByRole`, `getByLabelText`) over `getByTestId`. Coverage thresholds: 70% lines/functions/statements, 60% branches.
- **E2E**: Playwright in `e2e/`. 60s test timeout (WASM loading). Runs against Chromium, Firefox, WebKit. Accessibility tested with axe-playwright.
- **Mocking**: WASM modules and external dependencies should be mocked in unit tests. `VITE_USE_MOCK_DATA` env var enables mock data.

### E2E Validation Protocol — MANDATORY

**Never push E2E fixes to CI without first validating each spec file individually and locally.** Pushing broken tests to CI wastes 15–45 minutes per run and burns CI resources.

**Required workflow for any E2E change:**

1. **Fix one spec at a time** — identify the failing spec, read it, read the component source, understand the mismatch.
2. **Run that spec alone locally** before touching anything else:

   ```bash
   npx playwright test e2e/my-spec.spec.ts --project=chromium
   ```

3. **Only move to the next spec after the current one passes.**
4. **After all individual specs pass**, run the full shard locally as a final check:

   ```bash
   npx playwright test --project=chromium --shard=2/2
   ```

5. **Only then commit and push** — never push speculatively hoping CI will reveal issues.

**Common E2E pitfalls in this codebase:**

- Nav buttons use `aria-label="X view"` — always use `{ name: 'X view' }` not `{ name: 'X' }`
- `tabs.tsx` is a custom component (NOT Radix UI) — no `role="tab"` on elements; use `getByRole('button', { name: 'Workshop', exact: true }).first()`
- All PKI modules default to the `learn` tab — click Workshop tab in `beforeEach` before interacting with simulation UI
- The `WhatsNew` toast (`role="alertdialog"`, `z-[100]`) intercepts clicks — suppress via `page.addInitScript` that seeds `pqc-version-storage` with `{ state: { lastSeenVersion: '1.33.0' }, version: 0 }`
- Desktop + mobile empty states both exist in DOM simultaneously — use `.first()` or `.last()` deliberately; verify which is visible
- Playwright `getByText` and `getByRole` do substring/partial matching — be specific; use `{ exact: true }` when needed

**ESLint**: Flat config (v9) in `eslint.config.js`. `@typescript-eslint/no-explicit-any: error`. `no-console: error` (only `warn`/`error` allowed) except PKILearning components and data-loading services where `console.log` is permitted. Includes `eslint-plugin-security`, `jsx-a11y`, and `testing-library` plugins.

## CI Pipeline

Push to main or PR triggers: npm ci → security audit → format:check → lint → build → unit tests → E2E tests (sharded across 2 workers, Chromium only). Node 20 required. Separate workflows handle GitHub Pages deploy (`deploy.yml`), release creation from tags (`release.yml`), and daily compliance data scraping (`update-compliance.yml`).

## OWASP Compliance

This project enforces OWASP Top 10 controls. These rules are mandatory for all contributions:

- **No `dangerouslySetInnerHTML`** — React auto-escaping handles all rendering. Zero exceptions in production code.
- **No `eval()`, `Function()`, or `innerHTML`** — eliminates code injection vectors.
- **No hardcoded secrets** — API keys, tokens, credentials must use environment variables (`.env` in `.gitignore`). CI secrets via GitHub Actions Secrets.
- **All `target="_blank"` links** must include `rel="noopener noreferrer"` — prevents tabnabbing.
- **CSP enforced** — Content-Security-Policy header configured in `vite.config.ts` for dev/preview. `script-src 'self' 'wasm-unsafe-eval'` only.
- **Dependency audit** — `npm audit --audit-level=high --omit=dev` runs in CI. Zero production CVEs policy.
- **Lockfile committed** — `package-lock.json` ensures reproducible builds. CI uses `npm ci`.
- **ESLint security plugin** — `eslint-plugin-security` active in `eslint.config.js`.
- **No TLS bypass** — never use `NODE_TLS_REJECT_UNAUTHORIZED=0` or skip certificate validation.
- **Educational crypto disclaimer** — all crypto operations include disclaimers that generated keys are for educational use only, not production.

## Formatting

Prettier: no semicolons, single quotes, 100 char width, 2-space indent. Pre-commit hooks (Husky + lint-staged) auto-fix on staged files.

## Workflow Orchestration

### 1. Plan Mode Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy to keep main context window clean

- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop

- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests -> then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
