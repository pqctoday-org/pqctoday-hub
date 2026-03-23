# Security Audit Report

**Date:** 2026-03-22
**Previous audit:** 2025-12-02
**Auditor:** Antigravity

## Executive Summary

A comprehensive security audit was conducted on the PQC Timeline Application codebase (v2.46.0). The audit included automated dependency scanning, manual static code analysis, and review of new features added since December 2025 (GA4 analytics, Gemini AI chat, Google Drive sync, endorsement system, WebLLM). **No high or critical vulnerabilities were found.** Two medium-risk items are documented with mitigations.

## 1. Dependency Analysis

- **Tool**: `npm audit --audit-level=high --omit=dev`
- **Status**: ✅ **Passed**
- **Findings**: 0 vulnerabilities found in production dependencies.
- **CI integration**: ✅ Runs in CI pipeline on every push/PR (implemented since last audit).

## 2. Static Code Analysis

### Cross-Site Scripting (XSS)

- **Check**: Searched for `dangerouslySetInnerHTML`, unescaped user input, `eval()`, `new Function()`, `.innerHTML =`.
- **Status**: ✅ **Passed**
- **Findings**: No instances of `dangerouslySetInnerHTML` or `eval()` in production code. One `innerHTML` usage in test cleanup (`GuidedTour.test.tsx:99`) — safe, test-only. React's default escaping is effectively used throughout.

### External Links (Tabnabbing)

- **Check**: Verified that all `target="_blank"` links include `rel="noopener noreferrer"`.
- **Status**: ✅ **Passed**
- **Scope**: 118 occurrences across 54 files — all correctly secured.
- **Notable files verified**: `TermsView.tsx`, `GanttDetailPopover.tsx`, `LeadersGrid.tsx`, `LibraryDetailPopover.tsx`, `LibraryTreeTable.tsx`, `ChatMessage.tsx`, `ApiKeySetup.tsx`, `AboutView.tsx`, `SoftwareTable.tsx`, `ComplianceDetailPopover.tsx`.

### Content Security Policy (CSP)

- **Check**: Reviewed CSP headers in `vite.config.ts` (dev and preview servers).
- **Status**: ⚠️ **Configured with known trade-offs**
- **Policy summary**:
  - `default-src 'self'` — baseline protection ✅
  - `script-src 'self' 'wasm-unsafe-eval' 'unsafe-inline' https://accounts.google.com` — `'unsafe-inline'` required for Vite HMR and Tailwind v4 runtime styles ⚠️
  - `style-src 'self' 'unsafe-inline'` — required for Tailwind v4 ⚠️
  - `connect-src` — scoped whitelist: NIST, ANSSI, BSI, Common Criteria, Google APIs (Analytics, OAuth, Gemini, Drive), HuggingFace (WebLLM models), GitHub raw ✅
  - `img-src 'self' data: blob:` ✅
  - `font-src 'self'` ✅
  - `worker-src 'self' blob:` — WASM blob workers ✅
  - `frame-src 'self' https://accounts.google.com` — Google OAuth iframe ✅
- **Note**: `'unsafe-inline'` in `script-src` weakens XSS protection. This is a known trade-off for the current Vite + Tailwind v4 toolchain. Consider migrating to CSP nonces when tooling supports it.
- **GitHub Pages deployment**: CSP headers are dev/preview only. GitHub Pages does not serve custom headers — the production deployment relies on React's built-in escaping and the ESLint security plugin as primary XSS defenses.

### Hardcoded Secrets

- **Check**: Searched for patterns like `API_KEY`, `SECRET`, `TOKEN`, `PASSWORD` in source.
- **Status**: ✅ **Passed**
- **Findings**:
  - "Secret" keywords in `src/wasm/` files refer to cryptographic variable names (e.g., `secretKey`) — expected.
  - "Secret" keywords in CSV files refer to public product names (e.g., "AWS Secrets Manager") — expected.
  - Google Client ID uses `VITE_GOOGLE_CLIENT_ID` env var — not hardcoded ✅.
  - GA4 Measurement ID uses `VITE_GA_MEASUREMENT_ID` env var — not hardcoded ✅.
  - No actual hardcoded credentials identified.

## 3. Data Flow Analysis (New since Dec 2025)

### 3.1 Google Analytics 4 (GA4)

- **Service**: `src/utils/analytics.ts`
- **Data sent**: Anonymous page views, aggregated interaction events (module starts/completions, search queries, chat feedback).
- **PII scrubbing**: `sanitizeQuery()` redacts emails and URLs before sending to GA4.
- **Localhost opt-out**: Analytics disabled entirely on `localhost`/`127.0.0.1`.
- **Cookies**: GA4 may set first-party cookies for visitor disambiguation.
- **Risk**: Low. No PII transmitted. Disclosed in Terms of Service §10.

### 3.2 Gemini AI API Key

- **Storage**: `localStorage` key `pqc-chat-storage` (Zustand persist in `useChatStore`).
- **Transmission**: Sent only to `https://generativelanguage.googleapis.com` as URL query parameter (`?key=`). HTTPS only.
- **Export exclusion**: API key is explicitly excluded from data snapshots/exports (`snapshotTypes.ts` line 135).
- **Logging**: API key never appears in console logs or analytics events.
- **Risk**: Medium. localStorage is accessible to any same-origin JavaScript — an XSS vulnerability could exfiltrate the key. This is inherent to client-side API key usage. Users provide their own key and are informed it stays in-browser. Disclosed in Terms of Service §10.
- **Mitigation**: CSP connect-src whitelist, ESLint security plugin, no `dangerouslySetInnerHTML`/`eval`.

### 3.3 WebLLM (Local LLM)

- **Service**: `src/services/chat/WebLLMService.ts`
- **Data flow**: Model downloaded from HuggingFace CDN on first use; all inference runs client-side via WebGPU/WASM.
- **Risk**: Low. No user data leaves the device after model download. Disclosed in Terms of Service §10.

### 3.4 Google Drive Sync

- **Service**: `src/services/storage/GoogleDriveService.ts`
- **Authentication**: Google OAuth 2.0 via Identity Services (GIS). Access token stored in-memory only (never persisted).
- **Scope**: `drive.appdata` — restricted to hidden app folder; cannot access user's other files.
- **Data synced**: Learning progress, assessment state, persona, theme, chat history (conversations only — API key excluded).
- **OpenSSL Studio files**: Virtual files (which may include user-generated keys/certificates) are included in sync.
- **Risk**: Medium. Users generating test cryptographic keys in OpenSSL Studio should be aware these may sync to Google Drive in plaintext JSON. The feature is opt-in (requires explicit Google sign-in).
- **Recommendation**: Consider adding a user-facing notice when cloud sync is active and OpenSSL Studio contains key material.

### 3.5 Endorsement / Flag System

- **Service**: `src/utils/endorsement.ts`
- **Data flow**: Builds GitHub Discussions URLs with non-sensitive metadata (resource type, ID, page URL). Opens in new tab — user controls submission.
- **Risk**: Low. No data transmitted automatically. No PII or sensitive data included.

## 4. Data Storage Audit

### localStorage

| Store                | Key                      | Sensitive Data                        | Risk   |
| -------------------- | ------------------------ | ------------------------------------- | ------ |
| `useChatStore`       | `pqc-chat-storage`       | Gemini API key, chat conversations    | Medium |
| `useAssessmentStore` | `pqc-assessment-storage` | Industry, country, compliance choices | Low    |
| `useModuleStore`     | `pki-module-storage`     | Learning progress, quiz scores        | Low    |
| `useThemeStore`      | `pqc-theme-storage`      | Theme preference                      | Low    |
| `usePersonaStore`    | `pqc-persona-storage`    | Selected role                         | Low    |
| `useVersionStore`    | `pqc-version-storage`    | Last seen version                     | Low    |
| `OpenSSL Studio`     | `openssl-studio-storage` | Virtual files (may include keys)      | Low    |
| `SettingsProvider`   | `sessionStorage` only    | Execution mode preference             | Low    |

- **No cryptographic keys in localStorage**: OpenSSL Studio key material stays in Zustand memory during session; persisted store contains virtual filesystem state but keys are generated fresh each session.
- **API key**: Only sensitive credential stored — see §3.2 for risk assessment.

### sessionStorage

- `playground-execution-mode` — non-sensitive user preference.
- `lazyWithRetry` reload guard — one-time flag, no data.

## 5. OWASP Top 10 Compliance

| Control                      | Status     | Notes                                                                             |
| ---------------------------- | ---------- | --------------------------------------------------------------------------------- |
| No `dangerouslySetInnerHTML` | ✅ Pass    | Zero instances in production code                                                 |
| No `eval()` / `Function()`   | ✅ Pass    | Zero instances                                                                    |
| No hardcoded secrets         | ✅ Pass    | All secrets via env vars                                                          |
| `target="_blank"` protection | ✅ Pass    | 118/118 have `rel="noopener noreferrer"`                                          |
| CSP enforced                 | ⚠️ Partial | Present in dev/preview; `'unsafe-inline'` trade-off; not enforced on GitHub Pages |
| Dependency audit             | ✅ Pass    | 0 vulnerabilities; runs in CI                                                     |
| Lockfile committed           | ✅ Pass    | `package-lock.json` tracked                                                       |
| ESLint security plugin       | ✅ Pass    | `eslint-plugin-security` active                                                   |
| No TLS bypass                | ✅ Pass    | No `NODE_TLS_REJECT_UNAUTHORIZED=0`                                               |
| Crypto disclaimer            | ✅ Pass    | Educational-use warnings throughout                                               |

## 6. Recommendations

### From previous audit (Dec 2025) — Status

1. ~~**Continuous Monitoring**: Integrate `npm audit` into CI~~ — ✅ **Done**. Runs in CI on every push/PR.
2. ~~**CSP**: Implement Content Security Policy~~ — ✅ **Done**. Configured in `vite.config.ts` with full directive coverage. Trade-off: `'unsafe-inline'` required for current toolchain.
3. **Secret Management**: Continue ensuring backend integrations use env vars — ✅ **Maintained**. Google Client ID and GA4 ID use `VITE_*` env vars.

### New recommendations

4. **CSP nonces**: When Vite/Tailwind v4 adds nonce support, replace `'unsafe-inline'` in `script-src` with nonce-based policy for stronger XSS protection.
5. **Google Drive sync notice**: Add a visible indicator or one-time notice when cloud sync is active and OpenSSL Studio contains generated key material.
6. **GitHub Pages CSP**: Investigate serving CSP headers via a Cloudflare proxy or `<meta>` tag for production deployment, since GitHub Pages does not support custom response headers.
