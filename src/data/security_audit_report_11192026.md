# Security Audit Report

**Date:** 2026-11-19
**Previous audit:** 2026-03-22
**Application version reviewed:** v4.218.0
**Reviewer:** the maintainer, with AI-assisted review (Claude Code). This is a self-review, not an independent third-party audit.

## Scope

A production dependency scan and a static review of the application source in this repository, repeating the checks of the 2026-03-22 report on the current code. It does not cover the bundled WebAssembly engines' own source, the separately hosted Sandbox, penetration testing, or runtime behaviour in a browser. A clean result here does not establish the absence of vulnerabilities.

## Executive Summary

No high or critical dependency advisories were found in production dependencies. The static checks found four places that insert HTML; each escapes or sanitises its input. The Content Security Policy trade-offs recorded in March are unchanged. One cosmetic display defect is recorded below.

## 1. Dependency Analysis

- **Tool:** `npm audit --omit=dev --audit-level=high`, and the CI gate `npm run audit:deps` (`scripts/ci/audit-gate.ts`).
- **Result:** 0 vulnerabilities at any severity across 434 production packages. The CI gate passed with 0 dated exceptions still current.
- **CI integration:** the gate runs as the last step of `.github/workflows/ci.yml`.

## 2. Static Code Analysis

Searches excluded test files, fixtures and stories.

### HTML insertion (XSS)

`eval()` and `new Function()`: no instances. `.innerHTML =`, `.outerHTML =`, `insertAdjacentHTML` and `document.write`: no instances.

`dangerouslySetInnerHTML` is used in production code in two components (the March report recorded none):

| Component                                  | What is inserted                                          | Control                                                                                                                                                                           |
| ------------------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/Patents/PatentSearchPanel.tsx` | Patent titles and summaries with search-term highlighting | Text is HTML-escaped (`&`, `<`, `>`) before the only markup, a fixed `<mark>` element, is added; the search terms are regex-escaped. Inserted as element content, not attributes. |
| `components/Simulation/MermaidDiagram.tsx` | SVG produced by Mermaid 11.17.2                           | Mermaid is initialised with `securityLevel: 'strict'` (`components/Simulation/mermaidRender.ts`), which sanitises labels with DOMPurify.                                          |

`components/Search/CommandPalette.tsx` and `components/Mobile/screens/MobileBusinessToolsView.tsx` mention the API only in comments.

**Display defect (not a security issue):** in the patent search, a query containing the word `amp` can highlight inside an escaped `&amp;` and show it as literal text. It changes what is displayed, not what runs.

### External links (tabnabbing)

Every `target="_blank"` link in `src/components` has `rel="noopener noreferrer"` or `rel="noreferrer"` alongside it (288 checked).

### Content Security Policy

Unchanged since March. `vite.config.ts` sets a CSP for the dev and preview servers only: `default-src 'self'`, with `'unsafe-inline'` in `script-src` and `style-src` as a toolchain trade-off. GitHub Pages serves no custom headers and `index.html` carries no CSP `<meta>` tag, so **production has no CSP**; it relies on React's escaping, the controls above and `eslint-plugin-security`.

### Hardcoded secrets

No matches for Google API key, OpenAI/Anthropic key, GitHub token, Slack token or PEM private-key patterns in `src`, `public` or `index.html`. Build-time identifiers are read from environment variables (`VITE_GA_MEASUREMENT_ID`, `VITE_GOOGLE_CLIENT_ID`, `VITE_SANDBOX_BASE_URL`, `VITE_SANDBOX_ORCHESTRATOR_URL`); a GA4 measurement ID and an OAuth client ID are public identifiers, not secrets.

### Other controls

| Control                | Result                                                                |
| ---------------------- | --------------------------------------------------------------------- |
| Lockfile committed     | `package-lock.json` is tracked                                        |
| ESLint security plugin | `eslint-plugin-security` recommended rules active (`eslint.config.*`) |
| TLS bypass             | no `NODE_TLS_REJECT_UNAUTHORIZED` in `src`, `scripts` or `.github`    |

## 3. Data Storage

Persisted browser state now spans about 30 named stores (up from 8 in March), all in `localStorage` (for example `pqc-chat-storage`, `pqc-assessment-result`, `pqc-learn-storage`, `pqc-workshop`). The only credential stored is a user-supplied cloud AI API key in `pqc-chat-storage` (`src/store/useChatStore.ts`). The other stores hold preferences, progress and work in progress.

## 4. Recommendations

1. **Production CSP** (carried over): GitHub Pages cannot send headers; evaluate a `<meta>` CSP compatible with the WebAssembly engines and the analytics and OAuth origins.
2. **CSP nonces** (carried over): replace `'unsafe-inline'` once the toolchain supports nonces.
3. **Patent highlighting:** highlight against the unescaped text and escape each segment, so search terms cannot match inside HTML entities.
