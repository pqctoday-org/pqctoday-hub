# Security Policy

## Supported Versions

PQC Today Hub is a continuously deployed web application, not a versioned
library — there is no branch that receives backported security fixes. Only the
code on `main`, deployed live via [GitHub Pages on every push to `main`](.github/workflows/deploy.yml),
is supported. Tagged releases (`vX.Y.Z`, see [CHANGELOG.md](CHANGELOG.md)) are
historical snapshots for reference, not maintained parallel branches — if you
find a vulnerability in an old tag, check whether `main` still has it before
reporting a version.

## Reporting a Vulnerability

We take the security of our cryptographic implementations seriously.

If you discover a security vulnerability within this project, please **DO NOT** open a public issue.

Instead, please report it via email to `security@pqctimeline.app`.

Please include:

- A description of the vulnerability.
- Steps to reproduce.
- Potential impact.

We will acknowledge your report within 48 hours and provide an estimated timeline for a fix.

> Note: this repository does not currently have GitHub's private vulnerability
> reporting enabled, so the email above is the only reporting channel — there is
> no "Report a vulnerability" button under the Security tab.

## Dependency vulnerabilities

`npm audit` runs on every PR and push to `main` via `npm run audit:deps`
(`scripts/ci/audit-gate.ts`), which fails the build on any **high or critical**
advisory in production dependencies that isn't in a short, explicitly dated
exception list in that script. An exception must state why it can't be fixed
and a `recheckAfter` date; the gate also fails once that date passes or once
the advisory it names no longer appears in the audit, so an exception can't
quietly become permanent. As of this writing that exception list is empty —
i.e. `main` currently has zero unaddressed high/critical advisories in
production dependencies. Dependabot (`.github/dependabot.yml`) opens grouped
update PRs monthly for npm and GitHub Actions dependencies; security updates
are not throttled by that schedule.

Run `npm audit` yourself at any time to see the current picture; the About
page (`/about`) also renders a live SBOM/CVE summary for the deployed build.

## Client-side architecture and secret handling

This application has **no backend server** — it is a static single-page app
(built with Vite, deployed as static files to GitHub Pages) plus, optionally,
calls made directly from the visitor's own browser to third-party APIs the
visitor configures themselves:

- Only environment variables prefixed `VITE_` are ever bundled into the
  client-side JavaScript (see `.env.example`): a Google Analytics measurement
  ID, a Google OAuth client ID (used for the optional Google Drive backup/sync
  feature, scoped to the least-privileged `drive.appdata`), and the local-dev
  sandbox base URL/orchestrator URL. All are meant to be public identifiers,
  not secrets.
- `NVD_API_KEY` (used by local/offline data-maintenance scripts to query the
  NVD API) is **not** `VITE_`-prefixed and is never read by any browser-side
  code — it only ever exists in a Node process on a maintainer's machine.
- The PQC Assistant's optional "Bring Your Own [Gemini API] Key" cloud mode
  stores the user-supplied key in the browser's own `localStorage`
  (`useChatStore`) and calls the Gemini API directly from the browser. The
  local (WebLLM) mode needs no key and sends nothing anywhere. Neither key nor
  chat content ever passes through a PQC Today server, because none exists.
- The optional Google Drive cloud-sync feature keeps its OAuth access token in
  browser memory only (never persisted, never sent to any PQC Today
  infrastructure) and explicitly excludes API keys from the synced payload —
  see the About page's `#cloud-sync-privacy` section.
- The app ships a real `Content-Security-Policy` (see `vite.config.ts`'s
  `server`/`preview` headers) restricting `connect-src` to a named allowlist
  (Google APIs/OAuth/Gemini, NIST CSRC, ANSSI, BSI, Common Criteria portal,
  Hugging Face, jsDelivr, raw.githubusercontent.com, and the local sandbox
  ports) rather than allowing arbitrary outbound requests.

## Cryptographic Disclaimer

PQC Today is an educational and demonstration platform, not a production system. Nothing it produces — keys, certificates, configurations, reports, or test results — is fit to protect real data, and none of it may be deployed or relied upon in production.

This application uses WebAssembly builds of `liboqs`, OpenSSL, SoftHSMv3 (PKCS#11), and a KMIP policy engine. While the upstream libraries are industry standards, **these builds are educational and demonstration builds — not for production use, in any environment.** They are not security-audited and not certified: not FIPS 140-validated, not Common Criteria evaluated, and no result they produce is a CAVP/CMVP certificate or an ACVTS verdict.

**This disclaimer is not scoped to the browser.** It binds these engines **wherever they run**. Some of them are published as consumable packages — notably `@pqctoday/softhsm-wasm`, whose own [`NOTICE`](src/vendor/softhsm-wasm/NOTICE) restates this — and can be loaded by a Node.js process, a CI job, a container, or a server-side service that never renders any user interface. A consumer who never sees this application's UI is still inside the scope of this section. The same applies to the containerised engine images: running the engines natively rather than in a browser removes none of the limitations below.

Specifically, in any environment:

- Key material lives in ordinary process memory (and, in a browser, in ordinary browser storage). There is no tamper resistance, no key-isolation boundary, no secure element, and no guarantee that key material is erased.
- No side-channel claims are made. Timing, cache and power side channels have not been analysed or mitigated, and neither WebAssembly nor these native builds offer constant-time guarantees.
- Randomness, key storage, PIN handling, access control and audit behaviour are teaching approximations, not a security design.

**Do not use keys, certificates, signatures, or configurations generated by this platform or by its engines for production systems**, and do not embed those engines in a product, a service, or an infrastructure component.
