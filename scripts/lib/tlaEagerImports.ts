// SPDX-License-Identifier: GPL-3.0-only
/**
 * Finds code in the built chunks that reads another chunk's export while that chunk is still
 * starting up, which in production leaves it undefined (or "not a function") and stops the page
 * from loading.
 *
 * WHY THIS HAPPENS
 *
 * `vite.config.ts` runs every chunk through `vite-plugin-top-level-await` (the Rust HSM engine
 * ships as a wasm-bindgen module that needs it). The plugin wraps a chunk when the chunk has a top
 * level `await` or a dynamic `import()`: its exports are declared `let` and only assigned inside an
 * `__tla = Promise.all([...]).then(async () => { ... })` block, some time after the chunk has
 * loaded. Another chunk that statically imports such an export, and does not also import and wait
 * for that chunk's own `__tla`, runs its own top-level code first and sees the export unassigned:
 * `const TABLE = { mech: CKM_SHA256 }` keeps `undefined` for good, and `list.sort(byStatus)` throws
 * "byStatus is not a function". The dev server serves native ES modules (correct order) and vitest
 * does not use the plugin, so only a real `vite build` shows it.
 *
 * Two production failures came from this. A workshop table captured an undefined PKCS#11 constant
 * (found 2026-09-02, four sites). Later, a list of product maintainers loaded with a dynamic
 * `import()` was imported by two views; the bundler put it into a large shared chunk, which became
 * wrapped, and the Migration Workbench's start-up sort then called a helper from that chunk before
 * it existed, so `/migrate` never rendered.
 *
 * WHAT IS CHECKED
 *
 * A chunk F is reported when, at its own start-up, it reads a binding imported from a source chunk
 * S, and all of these hold:
 *   - S is wrapped, and is not part of what the page has finished running before any route chunk is
 *     requested (the entry chunk, its static imports, and the App chunk the root awaits). Being
 *     wrapped does not make a chunk's exports unsafe once everything is running: most exports of a
 *     large shared chunk are ordinary values read long after start-up.
 *   - F does not import `__tla` from S (the plugin's own "wait for this" signal).
 *   - F is not itself loaded by S after S has run: a chunk S loads with `import()` (and that chunk's
 *     static imports) starts after S has finished, so it may read S freely. Mermaid's diagram chunks
 *     and the code editor's language chunks work this way. Only one such hop is followed; following
 *     further would reach unrelated routes and hide a real defect.
 *   - The read happens while the module runs: not inside a function that is only called later (a
 *     React render, an event handler, a `useMemo` factory). An immediately invoked function, and a
 *     callback handed to a built-in that calls it before returning (`sort`, `map`, `forEach`, ...)
 *     do run at once and count.
 *
 * KNOWN LIMITATIONS
 *   - Direct imports only; a binding reached through a chain of re-exports is not followed.
 *   - Namespace imports (`import * as ns`) are not checked.
 *   - Callbacks handed to functions this list does not know are treated as deferred.
 */
import path from 'node:path'
import * as acorn from 'acorn'

// The acorn tree is walked structurally; its published node types do not describe every shape used.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AstNode = any

export interface Finding {
  file: string
  localName: string
  importedName: string
  source: string
  line: number
}

export interface ParsedChunk {
  file: string
  ast: AstNode
  /** local name -> imported name and source specifier, for every static import */
  imports: Map<string, { imported: string; source: string }>
  /** every chunk this one imports or re-exports from statically, named bindings or not */
  dependencies: Set<string>
  /** true if the chunk declares its own `__tla` wrapper */
  isWrapped: boolean
}

export interface BuildAnalysis {
  chunks: number
  /** Chunks finished before any route chunk is requested. */
  startup: number
  /** Wrapped chunks outside that set: the only chunks whose exports can be read too early. */
  lateWrapped: string[]
  findings: Finding[]
}

/** Built-ins that call a function argument before they return. */
const SYNC_METHODS = new Set([
  'sort',
  'map',
  'filter',
  'forEach',
  'reduce',
  'reduceRight',
  'find',
  'findIndex',
  'findLast',
  'findLastIndex',
  'some',
  'every',
  'flatMap',
  'from',
  'fromEntries',
])
const SYNC_CONSTRUCTORS = new Set(['Promise', 'Map', 'Set'])

const baseName = (specifier: string): string => path.posix.basename(specifier)

export function parseChunk(file: string, source: string): ParsedChunk | null {
  let ast: AstNode
  try {
    ast = acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module', locations: true })
  } catch {
    return null // not JavaScript we can read; skip it rather than fail the build on it
  }
  const imports = new Map<string, { imported: string; source: string }>()
  const dependencies = new Set<string>()
  let isWrapped = false
  for (const node of ast.body as AstNode[]) {
    // `import "./x.js"`, `import { a } from "./x.js"` and `export { a } from "./x.js"` all make x a
    // static dependency, which has to finish before this chunk runs.
    if (
      (node.type === 'ImportDeclaration' ||
        node.type === 'ExportNamedDeclaration' ||
        node.type === 'ExportAllDeclaration') &&
      node.source
    ) {
      dependencies.add(baseName(node.source.value as string))
    }
    if (node.type === 'ImportDeclaration') {
      const from = node.source.value as string
      for (const spec of node.specifiers) {
        if (spec.type === 'ImportSpecifier') {
          const imported =
            spec.imported.type === 'Identifier' ? spec.imported.name : spec.imported.value
          imports.set(spec.local.name, { imported, source: from })
        } else if (spec.type === 'ImportDefaultSpecifier') {
          imports.set(spec.local.name, { imported: 'default', source: from })
        } else if (spec.type === 'ImportNamespaceSpecifier') {
          imports.set(spec.local.name, { imported: '*', source: from })
        }
      }
    }
    // `let __tla = Promise.all([...]).then(async () => { ... })` is the shape the plugin emits; a
    // bare `__tla = ...` is accepted too in case a later version changes it.
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
  return { file, ast, imports, dependencies, isWrapped }
}

/**
 * The chunks fully evaluated before any route chunk is requested: everything index.html loads, the
 * App chunk the root awaits before it renders, and the static imports of both.
 */
function startupChunks(chunks: Map<string, ParsedChunk>, indexHtml: string): Set<string> {
  const startup = new Set<string>()
  const queue = [...indexHtml.matchAll(/\/assets\/([^"']+\.js)/g)].map((m) => m[1]!)
  queue.push(...[...chunks.keys()].filter((f) => /^App-[\w-]+\.js$/.test(f)))
  while (queue.length) {
    const file = queue.pop()!
    const chunk = chunks.get(file)
    if (startup.has(file) || !chunk) continue
    startup.add(file)
    queue.push(...chunk.dependencies)
  }
  return startup
}

/** Walks one chunk's top level and reports reads of the given unsafe bindings. */
function findEagerReads(
  chunk: ParsedChunk,
  unsafe: Map<string, { imported: string; source: string }>
): Finding[] {
  const found: Finding[] = []
  const walk = (node: AstNode, deferred: boolean, parent: AstNode): void => {
    if (!node || typeof node.type !== 'string') return

    // The bundler's own namespace object for a re-export chain, `Object.freeze(Object.defineProperty(
    // { __proto__: null, ... }, Symbol.toStringTag, { value: "Module" }))`, lists every export of a
    // module as a getter. It is generated, not written, and reads nothing by itself.
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
      unsafe.has(node.name) &&
      // `import { X as local }` and `export { local as Y }` are wiring, not reads: a re-export
      // forwards the live binding, so bundles are full of them and none is the dangerous shape.
      parent &&
      parent.type !== 'ImportSpecifier' &&
      parent.type !== 'ImportDefaultSpecifier' &&
      parent.type !== 'ImportNamespaceSpecifier' &&
      parent.type !== 'ExportSpecifier'
    ) {
      const info = unsafe.get(node.name)!
      found.push({
        file: chunk.file,
        localName: node.name,
        importedName: info.imported,
        source: info.source,
        line: node.loc?.start?.line ?? 0,
      })
      return
    }

    const isFunction =
      node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression'
    const isInvokedAtOnce =
      isFunction && parent?.type === 'CallExpression' && parent.callee === node
    const isCalledBeforeReturn =
      isFunction &&
      (parent?.type === 'CallExpression' || parent?.type === 'NewExpression') &&
      parent.arguments?.includes(node) &&
      ((parent.callee?.type === 'MemberExpression' &&
        parent.callee.property?.type === 'Identifier' &&
        SYNC_METHODS.has(parent.callee.property.name)) ||
        (parent.type === 'NewExpression' &&
          parent.callee?.type === 'Identifier' &&
          SYNC_CONSTRUCTORS.has(parent.callee.name)))
    const nextDeferred = deferred || (isFunction && !isInvokedAtOnce && !isCalledBeforeReturn)

    for (const [key, value] of Object.entries(node)) {
      if (key === 'type' || key === 'start' || key === 'end' || key === 'loc' || key === 'range') {
        continue
      }
      // A non-computed property name (`{ a: 12 }`, `obj.a`) is a label, not a read of a local
      // that happens to be minified to the same letter.
      if (
        key === 'key' &&
        (node.type === 'Property' || node.type === 'MethodDefinition') &&
        node.computed === false
      ) {
        continue
      }
      if (key === 'property' && node.type === 'MemberExpression' && node.computed === false) {
        continue
      }
      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child.type === 'string') walk(child, nextDeferred, node)
        }
      } else if (value && typeof value.type === 'string') {
        walk(value, nextDeferred, node)
      }
    }
  }
  walk(chunk.ast, false, null)
  return found
}

/**
 * Analyse a built `assets/` folder. `sources` maps each chunk's file name to its text; `indexHtml`
 * is the built index.html, which names the chunks the page loads first.
 */
export function analyzeBuild(
  sources: ReadonlyMap<string, string>,
  indexHtml: string
): BuildAnalysis {
  const chunks = new Map<string, ParsedChunk>()
  for (const [file, text] of sources) {
    const parsed = parseChunk(file, text)
    if (parsed) chunks.set(file, parsed)
  }
  const startup = startupChunks(chunks, indexHtml)
  const lateWrapped = [...chunks.values()]
    .filter((c) => c.isWrapped && !startup.has(c.file))
    .map((c) => c.file)
    .sort()

  // What a chunk causes to load once it has run: the chunks it loads with import(), and their static
  // imports. One dynamic hop only.
  const loadedAfter = new Map<string, Set<string>>()
  const loadedAfterSource = (source: string): Set<string> => {
    const cached = loadedAfter.get(source)
    if (cached) return cached
    const seen = new Set<string>()
    const text = sources.get(source) ?? ''
    const queue = [...text.matchAll(/import\(\s*["']\.\/([^"']+\.js)["']\s*\)/g)].map((m) => m[1]!)
    while (queue.length) {
      const file = queue.pop()!
      const chunk = chunks.get(file)
      if (seen.has(file) || !chunk || file === source) continue
      seen.add(file)
      queue.push(...chunk.dependencies)
    }
    loadedAfter.set(source, seen)
    return seen
  }
  const late = new Set(lateWrapped)

  const findings: Finding[] = []
  for (const chunk of chunks.values()) {
    const awaited = new Set<string>()
    for (const { imported, source } of chunk.imports.values()) {
      if (imported === '__tla') awaited.add(source)
    }
    const unsafe = new Map<string, { imported: string; source: string }>()
    for (const [local, { imported, source }] of chunk.imports) {
      if (imported === '__tla' || imported === '*') continue
      const sourceFile = baseName(source)
      if (!late.has(sourceFile) || awaited.has(source)) continue
      if (loadedAfterSource(sourceFile).has(chunk.file)) continue
      unsafe.set(local, { imported, source })
    }
    if (unsafe.size > 0) findings.push(...findEagerReads(chunk, unsafe))
  }

  // One finding per chunk and binding is enough to act on.
  const seen = new Set<string>()
  const unique = findings.filter((f) => {
    const key = `${f.file}::${f.localName}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  return { chunks: chunks.size, startup: startup.size, lateWrapped, findings: unique }
}
