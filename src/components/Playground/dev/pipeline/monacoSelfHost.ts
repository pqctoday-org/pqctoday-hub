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
 * NO custom web worker is wired, deliberately. Three approaches to hand
 * Monaco a same-origin worker script (`?worker` suffix, `?url` suffix, and
 * `new URL(specifier, import.meta.url)`) each failed to resolve this bare
 * node_modules specifier correctly under this project's Vite version —
 * confirmed live: `?worker`/`?url` static imports throw "Failed to resolve
 * import" at the dev-server level, and plain `new URL(...)` resolves the
 * specifier relative to THIS file's own directory instead of node_modules,
 * producing a 404 that Monaco's internal try/catch swallowed silently.
 * Monaco has a documented, working fallback for exactly this case: with no
 * `MonacoEnvironment.getWorker`, it runs the editor's worker code on the
 * main thread instead of a dedicated Worker (console warning: "Could not
 * create web worker(s)... might cause UI freezes" — see the monaco-editor
 * FAQ). That fallback is a non-issue here: the Developer tab only needs
 * Python syntax highlighting (Monaco's built-in tokenizer), not a
 * language-service worker doing real background computation. The earlier
 * broken custom getWorker was strictly worse than no getWorker at all — it
 * threw an uncaught "Event" the hub's global error handler rendered as a
 * page-blocking red banner; the built-in fallback throws nothing.
 *
 * Call `installMonacoSelfHost()` once, before the first <Editor> mounts.
 */
import { loader } from '@monaco-editor/react'

let installed = false

export function installMonacoSelfHost(): void {
  if (installed) return
  installed = true

  // Local ESM import instead of loader's default CDN fetch.
  void import('monaco-editor').then((monaco) => {
    loader.config({ monaco })
  })
}
