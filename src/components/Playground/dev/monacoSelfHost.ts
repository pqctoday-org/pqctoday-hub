// SPDX-License-Identifier: GPL-3.0-only
/**
 * Self-hosts Monaco instead of letting @monaco-editor/react fetch it from
 * jsdelivr's CDN at runtime — the hub's CSP only allows script-src 'self'
 * (plus a short explicit allowlist that does not include jsdelivr), so the
 * CDN loader is silently blocked and the editor never initializes
 * (confirmed live, dev-tabs-pkcs11-kmip plan P2: "Loading the script
 * '...cdn.jsdelivr.net/npm/monaco-editor...' violates CSP").
 *
 * `monaco-editor` is already a transitive dependency of @monaco-editor/react
 * (its peer dep) — this just points the loader at that local copy.
 *
 * The web worker (dev-tabs-pkcs11-kmip plan G8) is a static, pre-bundled
 * same-origin script at `/monaco/editor.worker.js` — esbuild-bundled from
 * `monaco-editor/esm/vs/editor/editor.worker.js` by `npm run
 * build:monaco-worker` (wired into predev/prebuild, same pattern as
 * `build:sdk`), not a build-time import. Three earlier approaches to hand
 * Monaco a same-origin worker via a Vite-resolved import (`?worker` suffix,
 * `?url` suffix, and `new URL(specifier, import.meta.url)`) each failed to
 * resolve this bare node_modules specifier correctly under this project's
 * Vite version — confirmed live: `?worker`/`?url` static imports throw
 * "Failed to resolve import" at the dev-server level, and plain `new
 * URL(...)` resolves the specifier relative to THIS file's own directory
 * instead of node_modules, producing a 404 Monaco's internal try/catch
 * swallowed silently. A static pre-bundled file sidesteps Vite's import
 * resolution entirely: `new Worker('/monaco/editor.worker.js')` is just a
 * same-origin URL, not a module specifier. One shared worker for every
 * `getWorker(workerId, label)` call — the Developer tab only needs Python
 * syntax highlighting (Monaco's built-in tokenizer), not per-language
 * workers doing real background computation (ts.worker.js/json.worker.js
 * etc. are deliberately not bundled).
 *
 * Call `installMonacoSelfHost()` from INSIDE the component that renders
 * <Editor>, and DO NOT RENDER <Editor> until the returned promise resolves
 * — @monaco-editor/react's `loader` is a one-shot state machine: once
 * `<Editor>`'s own mount effect has called `loader.init()`, a `loader.
 * config({ monaco })` that lands after that point has no effect, and
 * `<Editor>` falls back to `loader`'s untouched default (the CDN AMD
 * loader — CSP-blocked here, see above). `config()` racing `<Editor>`'s
 * mount was fine when this ran at module top level (module evaluation
 * finishes well before React gets around to rendering a lazy-loaded route),
 * but got materially LESS lead time once G7 moved the call into the
 * component body (to dodge a real production chunk-splitting bug — see
 * git history) and started losing that race in practice, both in dev and
 * in production. Gating the render on the returned promise removes the
 * race entirely: it no longer matters how much lead time the call gets,
 * only that `<Editor>` never mounts before `loader.config()` has already
 * run. Both call sites (PkcsPipelineBuilder.tsx, KmipPipelineBuilder.tsx)
 * share this one promise, so only the FIRST one to mount actually waits;
 * `monaco-editor` is fetched exactly once.
 */
import { loader } from '@monaco-editor/react'

let readyPromise: Promise<void> | null = null

export function installMonacoSelfHost(): Promise<void> {
  if (readyPromise) return readyPromise

  self.MonacoEnvironment = {
    getWorker: () => new Worker('/monaco/editor.worker.js'),
  }

  // Local ESM import instead of loader's default CDN fetch.
  readyPromise = import('monaco-editor').then((monaco) => {
    loader.config({ monaco })
  })
  return readyPromise
}
