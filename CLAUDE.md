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

**Routing & Code Splitting**: All top-level views are lazy-loaded via `React.lazy()` in `src/App.tsx`. Routes nest under `MainLayout` which provides the navigation shell. Routes: `/` (Timeline), `/algorithms`, `/library`, `/learn/*`, `/playground`, `/openssl`, `/threats`, `/leaders`, `/compliance`, `/changelog`, `/migrate`, `/about`.

**State Management**: Zustand stores in `src/store/` with `persist` middleware for localStorage. Stores are modular — `useModuleStore` (learning progress/artifacts), `useThemeStore` (dark/light), `useVersionStore`, `tls-learning.store.ts`.

**Crypto Stack** (layered, strict priority):

1. **OpenSSL WASM** (`src/services/crypto/OpenSSLService.ts`) — primary for all standard operations
2. **liboqs** (`@openforge-sh/liboqs`) — PQC algorithms not in OpenSSL (FrodoKEM, HQC, Classic McEliece)
3. **WASM wrappers** (`src/wasm/`) — ML-KEM, ML-DSA, LMS/HSS bindings
4. **@noble/\*, @scure/\*** — blockchain crypto (secp256k1, Ed25519, BIP32/39/44, Ethereum)
5. **Web Crypto API** (`src/utils/webCrypto.ts`) — X25519, P-256, ECDH

**Data Sources**: Static JSON/CSV files in `src/data/`. Compliance data scraped at build time via `npm run scrape` from NIST, ANSSI, and Common Criteria. CSV files use versioned naming (e.g., `leaders_01192026.csv`).

**WASM Requirements**: Dev server sets `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin` headers for SharedArrayBuffer support.

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

## CI Pipeline

Push to main or PR triggers: npm ci → security audit → format:check → lint → build → unit tests → E2E tests (sharded, Chromium). Node 20 required.

## Formatting

Prettier: no semicolons, single quotes, 100 char width, 2-space indent. Pre-commit hooks (Husky + lint-staged) auto-fix on staged files.
