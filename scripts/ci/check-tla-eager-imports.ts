#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * check-tla-eager-imports.ts — catches a production-only class of bug where a
 * top-level object/array literal captures `undefined` instead of a real
 * PKCS#11 constant.
 *
 * WHY THIS EXISTS
 *
 * `vite.config.ts` runs every chunk through `vite-plugin-top-level-await`
 * (needed for the wasm-bindgen ESM the Rust HSM engine ships as). A wrapped
 * chunk's exports are declared `let` and only ASSIGNED inside an
 * `__tla = Promise.all([...]).then(async () => { ... })` block. A consuming
 * chunk that statically imports one of those bindings but never imports (and
 * so never awaits) the source chunk's own `__tla` runs its own top-level code
 * BEFORE that assignment happens — so a top-level `const TABLE = { mech:
 * CKM_SHA256 }` permanently captures `undefined`. Vite's dev server serves
 * native ESM (correct ordering) and vitest skips this plugin entirely, so
 * neither catches it — only a real `vite build` + `vite preview` does.
 *
 * Found 2026-09-02 as a live production bug: HPKE workshop Step 4
 * (`hpkeService.ts`'s `KDF_TABLE`) plus three more workshops with the same
 * shape (`EnvelopeEncryptionDemo.tsx`, `TEEHSMTrustedChannel.tsx`,
 * `FirmwareSigningMigrator.tsx`). Full diagnosis:
 * pqctoday-priv/design/design_handoff_kmip_pkcs11_playground/GAPS-CLOSEOUT-PLAN-2026-09-02.md §2.1.
 *
 * WHAT THIS CATCHES
 *
 * Scoped deliberately narrow, to the chunk that actually caused the real bug:
 * `src/wasm/softhsm.ts` + `src/wasm/softhsm/*` — the only source of CK*_
 * constants — always builds to a chunk named `softhsm-*.js`. For every OTHER
 * built chunk F that statically imports bindings from that chunk: if F does
 * NOT also import the softhsm chunk's own `__tla` export (the plugin's own
 * opt-in "wait for this" signal), any of those imported bindings referenced
 * inside an object/array/call-argument literal that evaluates SYNCHRONOUSLY
 * at F's module-eval time (i.e. NOT deferred into a function body that only
 * runs later — a React render, an event handler, a `useMemo` factory, a
 * `useCallback` body) is flagged. A genuine IIFE (`(() => ({...}))()`) still
 * counts as synchronous — it runs immediately, same as a bare literal.
 *
 * An earlier version of this check scoped to "any TLA-wrapped chunk" instead
 * of specifically the softhsm chunk — vite-plugin-top-level-await wraps ~35
 * of this app's ~660 built chunks (most of them just because something deep
 * in their own dependency tree eventually reaches an async wasm import,
 * unrelated to PKCS#11), and being TLA-wrapped does NOT mean every export of
 * that chunk is actually gated behind the async resolution — most exports of
 * a big shared "index"/vendor chunk are ordinary synchronous values. That
 * version produced hundreds of false positives on totally safe code. Scoping
 * to the softhsm chunk specifically avoids that: essentially everything it
 * exports (CK*_ constants, `hsm_*` functions) genuinely is gated, because the
 * whole point of that chunk's wrapper is waiting on the dynamically-imported
 * `softhsmrustv3.js` wasm-bindgen module.
 *
 * KNOWN LIMITATIONS (documented, not silently assumed correct)
 *   - Only follows DIRECT imports, not re-export chains through a third chunk.
 *   - Only flags identifiers actually used as an object/array VALUE or a call
 *     argument at synchronous scope — a bare reference in a comment-like string
 *     or a type-only usage (already erased by tsc) cannot appear here at all.
 *   - Chunk filenames are hashed per build; re-run after every `vite build`.
 *   - Scoped to the softhsm chunk only. If another vendored wasm-bindgen
 *     import (openssl, kmip, tpm, strongswan) is later found to have the same
 *     shape, extend SOURCE_CHUNK_PATTERN below rather than reverting to the
 *     unscoped "any TLA chunk" version.
 *
 * IF THIS FAILS: do not silence it. Move the table construction into a
 * function (called at use time) or a `useMemo`/`useCallback` factory inside
 * the component — see the four sites this gate was written against for the
 * exact pattern. Never make the source chunk eagerly synchronous instead;
 * that reintroduces whatever made it need the TLA wrapper in the first place.
 *
 * Runs at the end of `npm run build`, right after `gate:precache`, so it
 * checks the real artifact and can never be stale.
 *
 * Exit codes:
 *   0 — no eager use of an unawaited TLA-wrapped import found
 *   1 — at least one finding
 *   2 — could not read the build output
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import * as acorn from 'acorn'
import type { Node } from 'acorn'

const DIST = path.resolve(process.cwd(), 'dist')
const ASSETS = path.join(DIST, 'assets')

// The chunk that vendors src/wasm/softhsm.ts + src/wasm/softhsm/* — the sole
// source of CK*_ constants and hsm_* functions. See KNOWN LIMITATIONS above
// before widening this.
const SOURCE_CHUNK_PATTERN = /^softhsm-[\w-]+\.js$/

if (!existsSync(ASSETS)) {
  console.error(`\n✖ no ${ASSETS} — run \`npm run build\` first\n`)
  process.exit(2)
}

const files = readdirSync(ASSETS).filter((f) => f.endsWith('.js'))

interface ParsedChunk {
  file: string
  ast: Node
  /** local name -> { imported name, source specifier } for every static import */
  imports: Map<string, { imported: string; source: string }>
  /** true if this chunk defines its own `let __tla = Promise.all(...)` wrapper */
  isWrapped: boolean
}

function parse(file: string): ParsedChunk | null {
  const src = readFileSync(path.join(ASSETS, file), 'utf8')
  let ast: Node
  try {
    ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module', locations: true })
  } catch {
    return null // non-JS asset with a .js extension, or a format we can't parse — skip, don't fail the gate on it
  }
  const imports = new Map<string, { imported: string; source: string }>()
  let isWrapped = false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const node of (ast as any).body as any[]) {
    if (node.type === 'ImportDeclaration') {
      const source = node.source.value as string
      for (const spec of node.specifiers) {
        if (spec.type === 'ImportSpecifier') {
          const imported =
            spec.imported.type === 'Identifier' ? spec.imported.name : spec.imported.value
          imports.set(spec.local.name, { imported, source })
        } else if (spec.type === 'ImportDefaultSpecifier') {
          imports.set(spec.local.name, { imported: 'default', source })
        } else if (spec.type === 'ImportNamespaceSpecifier') {
          imports.set(spec.local.name, { imported: '*', source })
        }
      }
    }
    // `let __tla = Promise.all([...]).then(async () => { ... })` (a
    // VariableDeclarator) at top level — the shape vite-plugin-top-level-await
    // actually emits. A bare `__tla = ...` re-assignment (AssignmentExpression)
    // is accepted too, in case a future plugin version changes the shape.
    if (node.type === 'VariableDeclaration') {
      for (const decl of node.declarations) {
        if (decl.id?.type === 'Identifier' && decl.id.name === '__tla') isWrapped = true
      }
    }
    if (
      node.type === 'ExpressionStatement' &&
      node.expression.type === 'AssignmentExpression' &&
      node.expression.left.type === 'Identifier' &&
      node.expression.left.name === '__tla'
    ) {
      isWrapped = true
    }
  }
  return { file, ast, imports, isWrapped }
}

const chunks = new Map<string, ParsedChunk>()
for (const f of files) {
  const p = parse(f)
  if (p) chunks.set(f, p)
}

// Resolve a relative import specifier ("./softhsm-CvtwDqKp.js") to the chunk filename.
const resolveSpecifier = (spec: string): string | null => {
  if (!spec.startsWith('./') && !spec.startsWith('../')) return null // external (e.g. a bare npm package) — not a built chunk
  return path.posix.basename(spec)
}

// Self-check: if the softhsm chunk isn't found, or Vite stops wrapping it,
// this whole gate would silently scan 0 chunks and always pass — which looks
// identical to "no bug" from the outside. Surface that loudly rather than
// let the gate go quiet.
const softhsmChunks = [...chunks.entries()].filter(([f]) => SOURCE_CHUNK_PATTERN.test(f))
if (softhsmChunks.length === 0) {
  console.warn(
    `\n⚠ no built chunk matched ${SOURCE_CHUNK_PATTERN} — this gate is not checking anything this run.\n` +
      '  If the softhsm chunk was renamed or split, update SOURCE_CHUNK_PATTERN in this script.\n'
  )
} else if (!softhsmChunks.some(([, c]) => c.isWrapped)) {
  console.warn(
    `\n⚠ ${softhsmChunks.map(([f]) => f).join(', ')} matched but is not TLA-wrapped this run — ` +
      'this gate is not checking anything this run (the bug class it guards against cannot occur ' +
      'without the wrapper, so this is not itself a failure, but is worth noticing).\n'
  )
}

interface Finding {
  file: string
  localName: string
  importedName: string
  source: string
  line: number
}
const findings: Finding[] = []

for (const [file, chunk] of chunks) {
  // Which of this chunk's imports come from a TLA-wrapped source chunk that
  // this chunk did NOT also opt into awaiting (no `__tla` import from that
  // same specifier)?
  const awaitedSources = new Set<string>()
  for (const { imported, source } of chunk.imports.values()) {
    if (imported === '__tla') awaitedSources.add(source)
  }

  const unsafeLocalNames = new Map<string, { imported: string; source: string }>()
  for (const [local, { imported, source }] of chunk.imports) {
    if (imported === '__tla' || imported === '*') continue
    const sourceFile = resolveSpecifier(source)
    if (!sourceFile || !SOURCE_CHUNK_PATTERN.test(sourceFile)) continue
    if (awaitedSources.has(source)) continue // this chunk explicitly awaits that source's own __tla — safe
    unsafeLocalNames.set(local, { imported, source })
  }
  if (unsafeLocalNames.size === 0) continue

  // Walk the AST tracking whether we're inside a function whose body is NOT
  // synchronously invoked at the point of definition (i.e. not an IIFE).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walk = (node: any, deferred: boolean, parent: any) => {
    if (!node || typeof node.type !== 'string') return

    // Rollup's own auto-generated ES-module-namespace shim for a re-export
    // chain — `Object.freeze(Object.defineProperty({ __proto__: null, ... },
    // Symbol.toStringTag, { value: "Module" }))` — not code any source file
    // in this repo writes by hand. Its properties are a snapshot of every
    // export a module has, which is the same "captures the value now" shape
    // this gate looks for, but it is provably inert here: this gate is
    // scoped to DIRECT imports from the softhsm chunk (see
    // SOURCE_CHUNK_PATTERN above), so it was never covering whatever a
    // downstream consumer of THIS shim object might later do with it — that
    // consumer, if one exists, either imports named bindings directly (still
    // caught) or would need its own separate check. Skipping construction of
    // the shim itself here just removes noise, it does not shrink coverage.
    if (
      node.type === 'CallExpression' &&
      node.callee?.type === 'MemberExpression' &&
      node.callee.object?.type === 'Identifier' &&
      node.callee.object.name === 'Object' &&
      node.callee.property?.type === 'Identifier' &&
      node.callee.property.name === 'freeze'
    ) {
      return
    }

    if (
      node.type === 'Identifier' &&
      !deferred &&
      unsafeLocalNames.has(node.name) &&
      // Only count uses that actually READ the binding's current value.
      // `import { X as local }` and `export { local as Y }` are pure
      // declarative wiring — a re-export forwards a LIVE binding, it does
      // not copy today's value, so it is never itself the dangerous shape
      // (bundled chunks routinely re-export hundreds of pass-through names
      // this way; without this exclusion almost every one of them false-
      // positives).
      parent &&
      parent.type !== 'ImportSpecifier' &&
      parent.type !== 'ImportDefaultSpecifier' &&
      parent.type !== 'ImportNamespaceSpecifier' &&
      parent.type !== 'ExportSpecifier'
    ) {
      const info = unsafeLocalNames.get(node.name)!
      findings.push({
        file,
        localName: node.name,
        importedName: info.imported,
        source: info.source,
        line: node.loc?.start?.line ?? 0,
      })
      return
    }

    const isFunctionNode =
      node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression'
    const isDirectlyInvoked =
      isFunctionNode && parent?.type === 'CallExpression' && parent.callee === node
    const nextDeferred = deferred || (isFunctionNode && !isDirectlyInvoked)

    for (const key of Object.keys(node)) {
      if (key === 'type' || key === 'start' || key === 'end' || key === 'loc' || key === 'range')
        continue
      // `{ a: 12 }` — a non-computed Property's `key` is a NAME LABEL, not a
      // value read, even though it's an Identifier node with the same shape
      // as a real reference. Skipping it matters here specifically: object
      // literals of internal-parameter tables (e.g. FIPS 205's n/h/d/hp/a/k/
      // lg_w/m fields) use short property names that can coincidentally
      // collide with a minified build's local alias for an imported binding
      // — without this, `{ a: 12 }` looks identical to a real read of `a`.
      if (
        key === 'key' &&
        (node.type === 'Property' || node.type === 'MethodDefinition') &&
        node.computed === false
      ) {
        continue
      }
      // Same reasoning for `obj.a` — a non-computed MemberExpression's
      // `.property` is a property NAME, not a read of a local binding named
      // `a`. `obj[a]`, by contrast, IS a real read of `a` and must still be
      // walked (computed === true skips this branch).
      if (key === 'property' && node.type === 'MemberExpression' && node.computed === false) {
        continue
      }
      const val = node[key]
      if (Array.isArray(val)) {
        for (const child of val) {
          if (child && typeof child.type === 'string') walk(child, nextDeferred, node)
        }
      } else if (val && typeof val.type === 'string') {
        walk(val, nextDeferred, node)
      }
    }
  }
  walk(chunk.ast, false, null)
}

// De-duplicate: one finding per (file, localName) is enough to act on.
const seen = new Set<string>()
const unique = findings.filter((f) => {
  const key = `${f.file}::${f.localName}`
  if (seen.has(key)) return false
  seen.add(key)
  return true
})

console.log('\n── TLA eager-import check ─────────────────────────────────────')
console.log(`  scanned ${chunks.size} chunk(s) under dist/assets/`)

if (unique.length === 0) {
  console.log('\n✔ no top-level literal reads an un-awaited TLA-wrapped import\n')
  process.exit(0)
}

console.error(`\n✖ ${unique.length} EAGER IMPORT(S) OF UN-AWAITED TLA-WRAPPED BINDING(S)\n`)
for (const f of unique) {
  console.error(
    `  • ${f.file}:${f.line}: \`${f.localName}\` (imported as \`${f.importedName}\` from ${f.source}) is ` +
      `read synchronously at module scope, but this chunk never awaits that source's own top-level await.`
  )
}
console.error(
  '\n  This means the binding is `undefined` in production even though dev/vitest never see it —\n' +
    "  see this script's header comment. Fix: move the object/array construction into a function\n" +
    '  (or a React `useMemo`/`useCallback` factory) called at USE time, not module-eval time. Do not\n' +
    '  suppress this check — every prior instance of it was a real, live bug.\n'
)
process.exit(1)
