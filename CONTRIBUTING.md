# Contributing to PQC Today

Thank you for your interest in PQC Today! The project welcomes **feedback**: corrections, missing data, bug reports, feature ideas, case studies and validation proposals, sent through [Issues](https://github.com/pqctoday-org/pqctoday-hub/issues) or [Discussions](https://github.com/pqctoday-org/pqctoday-hub/discussions). Code changes are made only by the maintainer (see [Feedback terms](#feedback-terms)).

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## How the Project Works

PQC Today is maintained by a single maintainer who reviews and merges all changes. The community's role is to surface knowledge — corrections, missing data, case studies, vendor experiences — and the maintainer's role is to validate sources and implement the changes.

**This means you never need to write code or edit CSV files to contribute valuable information.**

---

## Contributing Knowledge (No Coding Required)

### Suggesting a Data Change

If you spot a missing record, outdated entry, or incorrect information in any dataset (Library, Timeline, Migrate catalog, Threats, Leaders):

1. [Open a Data Suggestion issue](https://github.com/pqctoday-org/pqctoday-hub/issues/new?template=data_suggestion.yml)
2. Fill in the suggestion type, dataset, source URL, and description
3. The maintainer validates the source and implements the change
4. You'll be credited in the release notes when it ships

**What makes a good suggestion:**

- A publicly accessible source URL (government document, NIST standard, official vendor page, RFC)
- Specific description of what's wrong or missing
- Source published within the last 2 years, or a stable standard

### Contributing validation vectors, adapters and test cases

The Cryptographic Validation Workbench (Playground), the Algorithms KAT view and the Learn KAT panels run selected public reference vectors, standards tests and implementation probes. Every expected value must trace to an immutable public source, and the public coverage matrix (`/algorithms?tab=validation&section=coverage`) lists what is and is not tested. Lab practitioners and implementers can help by proposing vectors, adapters (how a case is executed through PKCS#11), corrections and negative/boundary cases:

1. [Open a validation proposal](https://github.com/pqctoday-org/pqctoday-hub/issues/new?template=validation_contribution.yml) with the source identity (repository + commit + path + SHA-256, or document + revision + section), the license/redistribution terms, the expected behaviour (positive/negative, exact output or return code) and an independent reviewer.
2. The vector file is registered in `src/data/validation/vector-manifest.json` (the maintainers' vector-manifest tool prints a skeleton entry) and its cases in `src/data/validation/testRegistry.ts`.
3. Two distinct people review it — one verifies the source, one reviews the implementation and label — and record it in `src/data/validation/reviews/<id>.review.json` (format: `review-record.schema.json`).

The vector-manifest check (run before merge) **rejects** a contributed vector (any file added after the 40-file baseline) whose record lacks a reviewed license note, complete source identity for its kind, an operation/expectation/test type per case, or an approved, non-stale two-person review record. Never submit ACVTS-issued or other access-controlled vectors, and never describe a pass as a validation: a passing case is evidence only for that case, not an ACVTS verdict or a CAVP/CMVP certificate.

### Joining Discussions

[GitHub Discussions](https://github.com/pqctoday-org/pqctoday-hub/discussions) is the place to:

- **Share case studies** — real-world PQC migration experiences (anonymized or public)
- **Post implementation guides** — how you configured TLS 1.3 with ML-KEM, migrated HSMs, etc.
- **Review vendors** — community experience with PQC-ready products
- **Ask questions** — anything PQC-related
- **Validate data** — help verify information others have suggested

### Reporting Bugs

1. Check [Issues](https://github.com/pqctoday-org/pqctoday-hub/issues) to see if it's already reported
2. Open a [Bug Report](https://github.com/pqctoday-org/pqctoday-hub/issues/new?template=bug_report.yml)
3. Include steps to reproduce, expected behavior, and screenshots if applicable

### Suggesting Features

Open a [Feature Request](https://github.com/pqctoday-org/pqctoday-hub/issues/new?template=feature_request.yml) describing the problem you'd like solved and why it would be useful.

---

## Building and Running Locally

You are welcome to build, run and study the code. Changes to the repository itself are made only by the maintainer; to propose one, open an issue describing it.

### Prerequisites

- Node.js **22.22.0+** (see `.node-version`; `fnm`/`nvm` users get this automatically
  via `fnm use` / `nvm use` in the repo root — several build/gate scripts fail with
  confusing errors on an older default `node` on your PATH)
- npm

### Setup

```bash
npm install
```

### Development Server

```bash
npm run dev
```

### Linting and Formatting

```bash
npm run lint
npm run format:check
npm run format       # auto-fix
```

### Testing

```bash
npm run test         # unit tests (Vitest)
npm run test:e2e     # end-to-end tests (Playwright, full suite)
npm run gate:prepush # fast checks run by the pre-push hook
npm run gate:local   # the same checks plus CI-visible and local unit suites
npm run gate:release # gate:local + engine verification + browser suites — before a release
```

See [TESTING.md](TESTING.md) for the full test layout, the local-only data-integrity
gates the pre-push hook runs (that CI deliberately does not), and how the CACP/KMIP
gate works.

#### The CACP / KMIP playground gate

`npm run gate:cacp` is the manual focused gate for `/playground/cacp` and the
KMIP wasm bundle. Run it for changes in that area. It has three scoped legs:

1. `npm run test -- src/components/Playground/kmip src/wasm/kmip` — CI-visible suites
2. `npm run test:local:cacp` — the local-only suites for those same two directories,
   including the corpus replay against the real wasm engine and the CSD02
   citation-drift guard
3. `npm run sync:wasm:check:cacp-kmip` — the bundle matches its `pqctoday-hsm` commit

Leg 2 is deliberately **scoped**, not the repo-wide `npm run test:local`. The gate
previously ran every `*.local.test.ts` in the repo, so unrelated failures elsewhere
turned the CACP gate red and it stopped carrying information.

**The browser leg is manual** — it needs a dev server and is not part of `gate:cacp`:

```bash
npm run test:e2e:cacp-local   # 6 specs: policy scenarios, sim fidelity, engine
                              # trace, migration, scenario picker, visual editor
```

Run it after any change to the playground, the policy engine, or the wasm bundle.
Green unit tests are not evidence the panes still work.

### Pull Requests

Code changes are made only by the maintainer. Pull requests from outside the project are read with thanks and then closed without merging; if a pull request shows a problem or a good idea, the maintainer makes the change in their own words. The quickest way to get something fixed is an issue that describes it.

### Development Guidelines

- **Tech Stack**: React, TypeScript, Vite, Tailwind CSS v4, Vitest, Playwright
- **Styling**: Use semantic tokens only (`text-primary`, `text-foreground`, `bg-background`, `bg-card`, `border-border`). Use `.glass-panel` for card containers and `.text-gradient` for headings. Never use hardcoded palette colors (e.g., `text-cyan-400`)
- **Cryptography**: Use `OpenSSLService` (primary) or `liboqs` wrappers. Crypto stack priority: OpenSSL WASM → liboqs → WASM wrappers → @noble/\* → Web Crypto API. Do not install new crypto libraries without explicit permission

---

## Recognition

People whose feedback leads to a change are thanked in the GitHub release notes for the version that includes it.

---

## Feedback terms

Feedback is welcome through Issues and Discussions. Code changes are made only by the maintainer; outside pull requests are thanked and closed.

By sending feedback, you agree that PQC Today, LLC may use it freely, in any version of the project, including commercially licensed versions.
