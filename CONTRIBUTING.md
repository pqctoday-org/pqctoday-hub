# Contributing to PQC Today

Thank you for your interest in contributing to PQC Today! The project welcomes two kinds of involvement: **knowledge contributions** (no coding required) and **code contributions**.

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

## Contributing Code

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
npm run gate:local   # format + lint + data-integrity gates + unit tests —
                      # what the pre-push hook runs; closest thing to "will CI pass"
```

See [TESTING.md](TESTING.md) for the full test layout, the local-only data-integrity
gates the pre-push hook runs (that CI deliberately does not), and how the CACP/KMIP
gate works.

#### The CACP / KMIP playground gate

`npm run gate:cacp` is the pre-push gate for `/playground/cacp` and the KMIP wasm
bundle. It runs three legs, all scoped to KMIP so a failure means a KMIP problem:

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

1. **Fork the repository** and create your branch from `main`
2. **Branch naming**: `feat/your-feature` for features, `fix/your-fix` for bug fixes
3. **Make your changes** — keep the diff minimal and focused
4. **Open a Pull Request** targeting `main` and fill out the PR template
5. All CI checks must pass and the maintainer must approve before merge

### Development Guidelines

- **Tech Stack**: React, TypeScript, Vite, Tailwind CSS v4, Vitest, Playwright
- **Styling**: Use semantic tokens only (`text-primary`, `text-foreground`, `bg-background`, `bg-card`, `border-border`). Use `.glass-panel` for card containers and `.text-gradient` for headings. Never use hardcoded palette colors (e.g., `text-cyan-400`)
- **Cryptography**: Use `OpenSSLService` (primary) or `liboqs` wrappers. Crypto stack priority: OpenSSL WASM → liboqs → WASM wrappers → @noble/\* → Web Crypto API. Do not install new crypto libraries without explicit permission

---

## Recognition

All contributors — whether via code PRs or data suggestions — are credited by name in the GitHub release notes for the version that includes their contribution.

---

## License

By contributing, you agree that your contributions will be licensed under **GPL-3.0-only** (inbound = outbound). There is no CLA. Add `Signed-off-by: Your Name <email>` to commits (DCO) if your organization requires it.
