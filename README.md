# PQC Today Hub

[PQC Today](https://www.pqctoday.com/) is a free, open-source education and demonstration platform for learning how post-quantum cryptography affects technology, policy and migration decisions.

> PQC Today is an educational and demonstration platform, not a production system. Nothing it produces — keys, certificates, configurations, reports, or test results — is fit to protect real data, and none of it may be deployed or relied upon in production.

> **Educational use only.** PQC Today is not a production cryptographic system, certification service, validation laboratory, GRC platform, legal opinion or product endorsement. Generated keys, certificates, configurations, reports, scores and test results are learning artifacts. Verify decisions with the relevant authority, accredited laboratory, product documentation and your own qualified advisers.

## What the Hub does

The Hub connects standards, algorithms, implementation exercises, policy sources and migration scenarios in one role-aware learning experience. A visitor chooses a role at runtime; the content and suggested journey adapt without hiding the rest of the site.

The public experience is designed to help learners:

- understand the quantum threat and the purpose of post-quantum cryptography;
- compare algorithms without turning unlike evidence into a ranking;
- follow official standards and policy sources;
- run bounded cryptographic demonstrations in the browser;
- practise inventory, migration, certification and executive decision workflows;
- preserve the difference between an observation, a source claim and a formal validation result.

## Choose a starting path

| Learner                  | A useful first route                                               | What it teaches                                               |
| ------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| Curious or non-technical | [Learn](https://www.pqctoday.com/learn)                            | Quantum risk, PQC foundations and guided explanations         |
| Executive                | [Business learning tools](https://www.pqctoday.com/business/tools) | Scenario assumptions, uncertainty and decision questions      |
| GRC learner              | [Compliance](https://www.pqctoday.com/compliance)                  | How to read source scope, authority and evidence limits       |
| Developer                | [Browser Playground](https://www.pqctoday.com/playground)          | APIs, protocols and local cryptographic demonstrations        |
| Architect or operator    | [Migrate](https://www.pqctoday.com/migrate)                        | Product evidence, dependencies and candidate migration paths  |
| Researcher               | [Algorithms](https://www.pqctoday.com/algorithms)                  | Standards, parameters, maturity and comparable measurements   |
| Certification engineer   | [Certification learning journey](https://www.pqctoday.com/learn)   | KAT/ACVP evidence, entropy, interfaces and certificate stages |

The role is a navigation lens, not an access-control boundary or a claim about the learner's qualifications.

## Major learning surfaces

### Learn

Role-aware modules combine concise lessons, references, quizzes and workshops. Technical and non-technical routes share the same source boundary while changing depth, vocabulary and recommended next steps.

### Algorithms

Algorithm records separate standardization status, validation evidence, maturity and implementation measurements. Performance figures are comparable only when the method, operation, implementation and platform are shared; heterogeneous catalogue values are not presented as a league table.

### Library, Timeline and Community

- [Library](https://www.pqctoday.com/library) organizes official publications and reviewed educational extractions.
- [Timeline](https://www.pqctoday.com/timeline) presents dated source records without converting them into personal deadlines.
- [Community](https://www.pqctoday.com/leaders) is an evidence-linked directory, not an influence ranking.

### Threats

[Threats](https://www.pqctoday.com/threats) distinguishes threat scenarios, vulnerabilities, migration constraints, policy signals and quantum-capability evidence. Learner-selected context changes the teaching view; it does not establish an organization's actual exposure.

### Compliance education

[Compliance](https://www.pqctoday.com/compliance) teaches how jurisdiction, publisher, document type, legal force and certification evidence differ. It does not determine applicability, compliance or certification status.

### Migrate, Assess and Report

- [Migrate](https://www.pqctoday.com/migrate) is an educational product catalogue and planning workbench, not a verified procurement database.
- [Assess](https://www.pqctoday.com/assess) uses learner-provided answers; it does not scan an environment or perform an audit.
- [Report](https://www.pqctoday.com/report) turns saved learning inputs into a portable planning artifact, not approved evidence.

### Browser Playground

[Playground](https://www.pqctoday.com/playground) contains purpose-built browser tools for algorithms, entropy, protocols, PKCS #11, KMIP, ACVP-shaped workflows and related topics. Each tool identifies whether it performs real browser-local cryptographic execution, a model, a calculator or a simulation, and states what the result cannot prove.

Separate sandbox scenarios require the external sandbox runtime. They are not silently contacted when a learner opens the browser catalogue.

### Business learning tools

[Business Tools](https://www.pqctoday.com/business/tools) provide scenario calculators, planning worksheets, draft templates and evidence organizers. Their outputs depend on disclosed assumptions and learner-entered data; they are not forecasts, audit conclusions, legal advice or security approval.

### Navigate and Simulation

[Navigate](https://www.pqctoday.com/navigate) explores relationships among Hub records. [Simulation](https://www.pqctoday.com/simulation) supports bounded learning scenarios. Graph connections and simulation outputs are teaching aids, not statements of applicability or causal proof.

## What runs where

| Runtime                    | Behaviour and boundary                                                                                                                              |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser-local              | The site, saved progress and browser-capable demonstrations run locally unless a clearly labelled optional service is selected.                     |
| Optional Gemini API        | Bring-your-own-key assistance contacts Google's API only after explicit learner action. Review Google's terms and do not submit sensitive material. |
| Optional Google Drive sync | Learners may explicitly connect Drive to synchronize supported progress. It is not required for normal use.                                         |
| Separate sandbox           | Docker-backed scenarios run outside the public browser application and require their own local environment.                                         |

API credentials are not educational content and must never be committed to the repository. See [Security](SECURITY.md), [Terms](TERMS.md) and the live [About page](https://www.pqctoday.com/about) for current boundaries.

## Evidence, sources and freshness

PQC Today publishes curated, periodically refreshed static data. The browser does not continuously scrape standards bodies, authorities or vendors.

Public records retain official publisher URLs and may include reviewed metadata or educational extractions. Third-party source documents, workstation paths, private maintenance files and downloaded originals are not published as Hub assets.

The interface distinguishes evidence classes such as:

- an official source statement;
- a reviewed extraction or teaching synthesis;
- a standard known-answer test or reference sample;
- an independent oracle comparison;
- a functional browser round trip;
- a simulation, estimate or learner-entered assumption;
- a recorded limitation, skip or implementation divergence.

None of those labels turns a local demonstration into an ACVP, CAVP, CMVP, Common Criteria or product-certification verdict. Review [Content freshness](CONTENT-FRESHNESS.md) and the live [Revision history](https://www.pqctoday.com/revisions) for the maintenance model.

<!-- BEGIN GENERATED README FACTS -->

### Current committed snapshot

Release **4.191.0** · source-data snapshot through **2026-10-31**. These figures are derived from the committed registries and current CSV lineages; they are not live counts.

- **Learn:** 75 instructional modules and 1,143 quiz questions.
- **Core references:** 130 algorithm records, 194 timeline events and 1,380 active Library records.
- **Educational catalogues:** 897 active products, 191 active compliance references, 71 active threat records and 361 active community profiles.
- **Main glossary:** 648 terms.
- **Assistant corpus:** 18,133 chunks across 46 source collections; 99.97% carry a Hub deep link.

Edit the source registries, not this table, then run `npm run gen:readme-facts`.
<!-- END GENERATED README FACTS -->

## Quick start

### Prerequisites

- Node.js 22, using the version in [`.node-version`](.node-version)
- npm, using the committed lockfile
- Chromium for prerender and browser tests

### Install and run

```bash
npm ci
npm run dev
```

Vite prints the local address. Production content is also available at <https://www.pqctoday.com/>.

### Build the production application

```bash
npx playwright install chromium
npm run build
```

The build type-checks, bundles, prerenders routes and refreshes committed/generated artifacts where the build contract requires it. It is materially heavier than the development server.

### Run focused checks

```bash
npm run test                 # CI-visible Vitest suites
npm run test:local           # machine/local-data Vitest tier
npm run gate:prepush         # fast hook-equivalent checks
npm run gate:release-local   # local-only tier once on a final release head
```

Playwright browser suites build the application through their pre-script. Install Chromium before running them. The authoritative command and ownership map is [GATES.md](GATES.md); test organization and focused tool gates are in [TESTING.md](TESTING.md).

## Architecture at a glance

```text
src/
├── components/       route views, learning modules and interactive tools
├── data/             committed public registries, CSV lineages and glossary data
├── services/         browser engines, storage, assistants and integrations
├── stores/           learner-selected role and browser-local application state
├── utils/            loaders, evidence helpers and shared transformations
└── wasm/             browser engine adapters and provenance metadata
scripts/
├── ci/               deterministic audits, provenance and release checks
└── *.mjs / *.ts      generators, prerendering and maintenance utilities
e2e/                  Playwright journeys, accessibility and layout contracts
public/               deployable static assets and generated public evidence
```

The React and TypeScript client is built with Vite. Most educational data is committed and loaded statically. Browser cryptography is provided by explicitly versioned WebAssembly or Web APIs. Optional services are isolated behind learner action.

Useful sources of truth:

- route ownership: [`src/App.tsx`](src/App.tsx);
- Learn modules: [`src/components/PKILearning/modules`](src/components/PKILearning/modules);
- test and release ownership: [GATES.md](GATES.md);
- current user-facing changes: [CHANGELOG.md](CHANGELOG.md);
- source-refresh expectations: [CONTENT-FRESHNESS.md](CONTENT-FRESHNESS.md).

## Testing and release discipline

Changes are checked at several intentionally different stages:

1. fast local formatting, lint, lineage and generated-file checks before push;
2. clean-checkout PR checks and sharded unit tests;
3. the local-only tier once on a final release head;
4. build, browser and attestation checks at the stages assigned in [GATES.md](GATES.md);
5. protected merge, deployment verification and release tagging.

Expensive signing and embedding work belongs on the final release candidate, after content has stabilized. Do not repeatedly regenerate or sign unchanged evidence during ordinary edits.

## Contributing knowledge or reporting a problem

Public code pull requests are not the contribution route for this maintainer-led repository. To propose a correction, source, test case or feature:

1. open a [GitHub issue](https://github.com/pqctoday-org/pqctoday-hub/issues) with the affected route and expected behaviour;
2. link the authoritative source and identify the exact claim when reporting an accuracy problem;
3. use [GitHub Discussions](https://github.com/pqctoday-org/pqctoday-hub/discussions) when the proposal needs exploration rather than a tracked defect.

The maintainer reviews the evidence and authors repository changes. This preserves one accountable editorial and release lineage. Read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting material.

## Security and privacy

- Do not enter production secrets, private keys, confidential evidence or personal data.
- Treat generated material as disposable learning output.
- Report vulnerabilities privately using [SECURITY.md](SECURITY.md), not a public issue.
- Review [TERMS.md](TERMS.md) before using optional third-party services.

## Licence

PQC Today Hub source is licensed under [GNU Affero General Public License v3.0 only](LICENSE). Third-party components and data retain their own licences and attribution; see [LICENSES.md](LICENSES.md).

## Acknowledgements

The project builds on public work from standards bodies, government agencies, researchers, open-source maintainers and the broader cryptographic community. A record's presence is not endorsement by its publisher or by PQC Today.
