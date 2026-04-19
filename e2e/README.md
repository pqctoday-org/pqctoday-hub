# PQCToday Hub E2E Tests

## Overview

This suite implements strict E2E testing for the `pqctoday-hub` using Playwright, focusing on the Action-State-Result (ASR) architecture. We bypass brittle UI scraper interactions and assert directly on the application's core state engines.

## Methodology: Action-State-Result (ASR)

Our E2E tests adhere to the ASR interaction pattern:

1. **Action**: Tests programmatically dispatch actions directly to React application scopes via `__e2e` window bindings or deep-linking.
2. **State**: Business logic executes seamlessly without manual interaction (eliminating timeout flakes).
3. **Result**: Tests assert that LocalStorage updates, Zustand persists, or the DOM structurally rerenders based strictly on new app state.

## Core Suites

| Suite                    | Focus                      | ASR Bypassing Technique                                    |
| ------------------------ | -------------------------- | ---------------------------------------------------------- |
| `acvp-validator.spec.ts` | HSM/WASM crypto processing | Route deep-linking & `__e2e_trigger_acvp` dispatch         |
| `accessibility.spec.ts`  | WCAG & DOM trapping traps  | `window.__e2e_toggle_panel()` to skip mount animations     |
| `embed*.spec.ts`         | Cross-origin IFrames       | Network proxying and test harness routing without clicks   |
| `gamification.spec.ts`   | Assessment ingestion       | Direct mock object injection to `onComplete()` overrides   |
| `onboarding.spec.ts`     | Learning routing logic     | Zustand JSON payload injection to `localStorage` hydration |
| `rag-pipeline.spec.ts`   | Langchain Gen-AI API       | `window.e2e_chat_send()` combined with HTTP stubbing       |

## Running Tests

Run the entire suite locally against Vite:

```bash
npm run test:e2e
```
