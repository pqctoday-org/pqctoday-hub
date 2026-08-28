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
 * Call `installMonacoSelfHost()` once, before the first <Editor> mounts.
 */
import { loader } from '@monaco-editor/react'

let installed = false

export function installMonacoSelfHost(): void {
  if (installed) return
  installed = true

  self.MonacoEnvironment = {
    getWorker: () => new Worker('/monaco/editor.worker.js'),
  }

  // Local ESM import instead of loader's default CDN fetch.
  void import('monaco-editor').then((monaco) => {
    loader.config({ monaco })
  })
}
