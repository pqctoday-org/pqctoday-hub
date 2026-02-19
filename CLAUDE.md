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
```

Run a single unit test: `npx vitest run src/components/MyComponent/MyComponent.test.tsx`
Run a single E2E test: `npx playwright test e2e/my-test.spec.ts`

## Architecture

**Routing & Code Splitting**: All top-level views are lazy-loaded via `React.lazy()` in `src/App.tsx`. Routes nest under `MainLayout` which provides the navigation shell. `AppRoot.tsx` wraps everything in `ErrorBoundary` → `Suspense` → `App`. Routes: `/` (Landing), `/timeline`, `/algorithms`, `/library`, `/learn/*` (includes `/learn/quiz`), `/playground`, `/openssl`, `/threats`, `/leaders`, `/compliance`, `/changelog`, `/migrate`, `/assess`, `/about`.

**State Management**: Zustand stores in `src/store/` with `persist` middleware for localStorage. Stores are modular — `useModuleStore` (learning progress/artifacts), `useThemeStore` (dark/light), `useVersionStore` (what's-new tracking), `tls-learning.store.ts` (TLS simulation), `useAssessmentStore` (assessment wizard, persisted to localStorage).

**Crypto Stack** (layered, strict priority):

1. **OpenSSL WASM** (`src/services/crypto/OpenSSLService.ts`) — primary for all standard operations
2. **liboqs** (`@openforge-sh/liboqs`) — PQC algorithms not in OpenSSL (FrodoKEM, HQC, Classic McEliece)
3. **WASM wrappers** (`src/wasm/`) — ML-KEM, ML-DSA, LMS/HSS bindings
4. **@noble/\*, @scure/\*** — blockchain crypto (secp256k1, Ed25519, BIP32/39/44, Ethereum)
5. **Web Crypto API** (`src/utils/webCrypto.ts`) — X25519, P-256, ECDH

**Data Sources**: Static JSON/CSV files in `src/data/`. Compliance data scraped at build time via `npm run scrape` from NIST, ANSSI, and Common Criteria. CSV files use versioned naming (e.g., `leaders_01192026.csv`). Dev server proxies requests to NIST, BSI, ANSSI, and Common Criteria APIs (configured in `vite.config.ts`).

**WASM Requirements**: Dev and preview servers set `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin` headers for SharedArrayBuffer support. The `predev` and `build` scripts copy liboqs WASM dist into `public/dist`.

**Tailwind v4 Theme**: No separate `tailwind.config` file. Theme is defined inline in `src/styles/index.css` using the `@theme` block with CSS custom properties. Light and dark mode color systems, phase colors, file type colors, and utility classes (`.glass-panel`, `.text-gradient`, `.shadow-glow`, status colors) are all defined there.

**Vitest Config**: Embedded in `vite.config.ts` (not a separate file). Uses `jsdom` environment, globals enabled, setup file at `./src/test/setup.ts`.

## Coding Standards

**Styling — Semantic tokens only**:

- ALWAYS use Tailwind semantic tokens: `text-primary`, `text-foreground`, `text-muted-foreground`, `bg-background`, `bg-card`, `border-border`
- NEVER use hardcoded colors like `text-cyan-400`, `bg-gray-900`, `text-green-300`
- Use `.glass-panel` for card containers, `.text-gradient` for section headings
- Use `<Button variant="gradient">` for primary CTAs, `variant="outline"` or `variant="ghost"` for secondary

**TypeScript**: Strict mode. Use `interface` for objects, `type` for unions/primitives. Avoid `any` — use `unknown` with narrowing.

**Components**: PascalCase filenames. Named exports. Colocate tests (`MyComponent.test.tsx`). Prefer reusable components from `src/components/ui/`.

**Imports**: Use `@/` path alias (maps to `src/`). Group: std lib → 3rd party → local components → styles/types.

**Crypto operations**: OpenSSL first for all standard operations. Use modern commands (`genpkey`, `pkey`) over deprecated ones (`ec`, `ecparam`). Do NOT install new crypto libraries without explicit permission. Only these are allowed: `@openforge-sh/liboqs`, `openssl-wasm`, `mlkem-wasm`, `pqcrypto`, `@noble/*`, `@scure/*`, `ed25519-hd-key`, `micro-eth-signer`.

## Testing

- **Unit**: Vitest + @testing-library/react. Prefer accessible queries (`getByRole`, `getByLabelText`) over `getByTestId`. Coverage thresholds: 70% lines/functions/statements, 60% branches.
- **E2E**: Playwright in `e2e/`. 60s test timeout (WASM loading). Runs against Chromium, Firefox, WebKit. Accessibility tested with axe-playwright.
- **Mocking**: WASM modules and external dependencies should be mocked in unit tests. `VITE_USE_MOCK_DATA` env var enables mock data.

**ESLint**: Flat config (v9) in `eslint.config.js`. `@typescript-eslint/no-explicit-any: error`. `no-console: error` (only `warn`/`error` allowed) except PKILearning components and data-loading services where `console.log` is permitted. Includes `eslint-plugin-security`, `jsx-a11y`, and `testing-library` plugins.

## CI Pipeline

Push to main or PR triggers: npm ci → security audit → format:check → lint → build → unit tests → E2E tests (sharded across 2 workers, Chromium only). Node 20 required. Separate workflows handle GitHub Pages deploy (`deploy.yml`), release creation from tags (`release.yml`), and daily compliance data scraping (`update-compliance.yml`).

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
