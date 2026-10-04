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
 * WHAT WAS VERIFIED ABOUT THE PLUGIN (vite-plugin-top-level-await 1.6.0, 2026-10-04, saved build)
 *   - Of 1,949 exports across the 43 wrapped chunks that load after start-up, 1,947 are `let`
 *     declarations without an initialiser, assigned only inside the wrapper; the other two are
 *     aliases of a binding imported from another chunk. So every export of a wrapped chunk is
 *     delayed unless it is positively known not to be (`isDelayedExport`).
 *   - A chunk that is itself wrapped imports the `__tla` of every wrapped chunk it reads and waits
 *     for it; an unwrapped chunk does not. The failing build had exactly one such reader.
 *
 * WHAT IS CHECKED
 *
 * A chunk F is reported when, at its own start-up, it reads a delayed binding imported from a
 * source chunk S, and all of these hold:
 *   - S is wrapped. S counts as "late" when the page has not finished running it before a route
 *     chunk is requested (it is not in the entry chunk's static closure, nor the App chunk's), and
 *     also when F itself is in that closure, since F and S then run back to back. The HSM engine
 *     chunk (`softhsm-*.js`) is late wherever it sits: it waits on a wasm download, which nothing at
 *     start-up waits for, and no other exemption applies to it.
 *   - F does not import `__tla` from S (the plugin's own "wait for this" signal).
 *   - F is not itself loaded by S after S has run. A chunk S loads with `import()` from inside a
 *     function (and that chunk's static imports) starts after S has finished, so it may read S
 *     freely: Mermaid's diagram chunks and the code editor's language chunks work this way. Only
 *     one such hop is followed. An `import()` at the top level of S, or in its wrapper, runs while S
 *     starts and gives no such guarantee, so it is not an exemption.
 *   - The read happens while the module runs: not inside a function that is only called later (a
 *     React render, an event handler, a `useMemo` factory). An immediately invoked function, and a
 *     callback handed to a built-in that calls it before returning (`sort`, `map`, `forEach`, ...)
 *     do run at once and count.
 * Named re-exports and aliases are followed to the chunk that really holds the binding, and a read
 * of `ns.name` through `import * as ns` is checked like a named import.
 *
 * KNOWN LIMITS (documented, not silently assumed correct)
 *   - Callbacks handed to functions this module does not know, and calls to local helpers
 *     (`const compare = () => status(); list.sort(compare)`), are treated as deferred.
 *   - `export * from` chains are not followed.
 *   - An `import()` inside a function counts as "after S has run" even if S calls that function
 *     before its own exports are assigned.
 *   - The start-up set relies on index.html naming its chunks with /assets/ links and on the App
 *     chunk being called App-<hash>.js.
 *   - The bundler's module-namespace object (`Object.freeze(Object.defineProperty({ __proto__: null,
 *     ... }, Symbol.toStringTag, { value: "Module" }))`) copies the values of the bindings it lists.
 *     That is not a failure, because it is generated and nothing here can say whether its members are
 *     used before they exist, but each late binding it captures is reported as a note. At the time
 *     of writing the HSM engine's `pqc` chunk captures four of them (stateful-signature functions).
 */
import path from 'node:path'
import * as acorn from 'acorn'

// The acorn tree is walked structurally; its published node types do not describe every shape used.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AstNode = any

export interface Finding {
  file: string
  /** the name read: the local name of the import, or `ns.member` for a namespace import */
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
  /** exported name -> local name, for `export { local as exported }` */
  exportLocals: Map<string, string>
  /** exported name -> origin, for `export { name } from "./other.js"` */
  reexports: Map<string, { source: string; imported: string }>
  /** top-level names declared with `let`/`var` and no initialiser: assigned later, in the wrapper */
  lateLocals: Set<string>
  /** other top-level declarations (function, class, const, let with an initialiser) */
  eagerLocals: Set<string>
  /** chunks loaded by an import() written inside a function, so only after this chunk has run */
  deferredLoads: Set<string>
  /** true if the chunk declares its own `__tla` wrapper, or exports one under that name */
  isWrapped: boolean
}

export interface BuildAnalysis {
  chunks: number
  /** Chunks finished before any route chunk is requested. */
  startup: number
  /** Wrapped chunks that load after start-up (or are always late): the sources worth checking. */
  lateWrapped: string[]
  /** Reads that fail the build. */
  findings: Finding[]
  /** Late bindings copied into a bundler namespace object: reported, not failing. */
  notes: Finding[]
  /** The chunks that are late wherever they sit (the HSM engine), and which of them are wrapped. */
  alwaysLate: { found: string[]; wrapped: string[] }
}

export interface AnalyzeOptions {
  /** Chunks that are late wherever they sit in the graph. Default: the HSM engine chunk. */
  alwaysLate?: RegExp
}

/** The HSM engine chunk: it waits on a wasm download that no start-up code waits for. */
export const SOFTHSM_CHUNK = /^softhsm-[\w-]+\.js$/

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

const nameOf = (node: AstNode): string | undefined =>
  node?.type === 'Identifier'
    ? node.name
    : node?.type === 'Literal'
      ? String(node.value)
      : undefined

const isFunctionNode = (node: AstNode): boolean =>
  node?.type === 'FunctionDeclaration' ||
  node?.type === 'FunctionExpression' ||
  node?.type === 'ArrowFunctionExpression'

/** `Object.freeze(...)`, `Object.defineProperty(...)`, `Promise.all(...)` */
const isStaticCall = (node: AstNode, object: string, method: string): boolean =>
  node?.type === 'CallExpression' &&
  node.callee?.type === 'MemberExpression' &&
  node.callee.object?.type === 'Identifier' &&
  node.callee.object.name === object &&
  node.callee.property?.type === 'Identifier' &&
  node.callee.property.name === method

/**
 * The bundler's own module-namespace object:
 * `Object.freeze(Object.defineProperty({ __proto__: null, a: x, ... }, Symbol.toStringTag,
 * { value: "Module" }))`. Only this exact shape; any other `Object.freeze` is code someone wrote.
 */
function isModuleNamespaceObject(node: AstNode): boolean {
  if (!isStaticCall(node, 'Object', 'freeze')) return false
  const inner = node.arguments?.[0]
  if (!isStaticCall(inner, 'Object', 'defineProperty')) return false
  const [object, tag, descriptor] = inner.arguments ?? []
  const first = object?.type === 'ObjectExpression' ? object.properties?.[0] : undefined
  return (
    first?.type === 'Property' &&
    nameOf(first.key) === '__proto__' &&
    first.value?.type === 'Literal' &&
    first.value.value === null &&
    tag?.type === 'MemberExpression' &&
    tag.object?.type === 'Identifier' &&
    tag.object.name === 'Symbol' &&
    tag.property?.name === 'toStringTag' &&
    descriptor?.type === 'ObjectExpression' &&
    descriptor.properties?.some(
      (p: AstNode) =>
        p.type === 'Property' &&
        nameOf(p.key) === 'value' &&
        p.value?.type === 'Literal' &&
        p.value.value === 'Module'
    )
  )
}

/** Chunks named by an import() written inside a function (not at the top level, not in the wrapper). */
function collectDeferredLoads(ast: AstNode): Set<string> {
  const loads = new Set<string>()
  const wrapperCalls = new WeakSet<object>()
  const walk = (node: AstNode, depth: number, parent: AstNode): void => {
    if (!node || typeof node.type !== 'string') return
    // `let __tla = Promise.all([...]).then(async () => { ...module body... })`: that callback IS the
    // module body, so a function inside it is one level down, and the callback itself is not.
    if (node.type === 'VariableDeclarator' && node.id?.name === '__tla' && node.init) {
      wrapperCalls.add(node.init)
    }
    if (
      node.type === 'AssignmentExpression' &&
      node.left?.type === 'Identifier' &&
      node.left.name === '__tla'
    ) {
      wrapperCalls.add(node.right)
    }
    if (node.type === 'ImportExpression' && depth >= 1 && node.source?.type === 'Literal') {
      const spec = String(node.source.value)
      if (spec.startsWith('./') || spec.startsWith('../')) loads.add(baseName(spec))
    }
    const isModuleBody =
      isFunctionNode(node) &&
      parent?.type === 'CallExpression' &&
      parent.arguments?.[0] === node &&
      parent.callee?.type === 'MemberExpression' &&
      parent.callee.property?.name === 'then' &&
      wrapperCalls.has(parent)
    const next = isFunctionNode(node) && !isModuleBody ? depth + 1 : depth
    for (const [key, value] of Object.entries(node)) {
      if (key === 'type' || key === 'start' || key === 'end' || key === 'loc') continue
      if (Array.isArray(value)) {
        for (const child of value)
          if (child && typeof child.type === 'string') walk(child, next, node)
      } else if (value && typeof value.type === 'string') {
        walk(value, next, node)
      }
    }
  }
  walk(ast, 0, null)
  return loads
}

export function parseChunk(file: string, source: string): ParsedChunk | null {
  let ast: AstNode
  try {
    ast = acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module', locations: true })
  } catch {
    return null // not JavaScript we can read; skip it rather than fail the build on it
  }
  const chunk: ParsedChunk = {
    file,
    ast,
    imports: new Map(),
    dependencies: new Set(),
    exportLocals: new Map(),
    reexports: new Map(),
    lateLocals: new Set(),
    eagerLocals: new Set(),
    deferredLoads: collectDeferredLoads(ast),
    isWrapped: false,
  }
  for (const node of ast.body as AstNode[]) {
    // `import "./x.js"`, `import { a } from "./x.js"` and `export { a } from "./x.js"` all make x a
    // static dependency, which has to finish before this chunk runs.
    if (
      (node.type === 'ImportDeclaration' ||
        node.type === 'ExportNamedDeclaration' ||
        node.type === 'ExportAllDeclaration') &&
      node.source
    ) {
      chunk.dependencies.add(baseName(node.source.value as string))
    }
    if (node.type === 'ImportDeclaration') {
      const from = node.source.value as string
      for (const spec of node.specifiers) {
        if (spec.type === 'ImportSpecifier') {
          chunk.imports.set(spec.local.name, { imported: nameOf(spec.imported)!, source: from })
        } else if (spec.type === 'ImportDefaultSpecifier') {
          chunk.imports.set(spec.local.name, { imported: 'default', source: from })
        } else if (spec.type === 'ImportNamespaceSpecifier') {
          chunk.imports.set(spec.local.name, { imported: '*', source: from })
        }
      }
    }
    if (node.type === 'ExportNamedDeclaration') {
      for (const spec of node.specifiers ?? []) {
        const exported = nameOf(spec.exported)!
        if (node.source) {
          chunk.reexports.set(exported, {
            source: node.source.value as string,
            imported: nameOf(spec.local)!,
          })
        } else {
          chunk.exportLocals.set(exported, spec.local.name)
          // The plugin may also export its promise under another local name.
          if (exported === '__tla') chunk.isWrapped = true
        }
      }
    }
    if (node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') {
      if (node.id) chunk.eagerLocals.add(node.id.name)
    }
    if (node.type === 'VariableDeclaration') {
      for (const decl of node.declarations) {
        if (decl.id?.type !== 'Identifier') continue
        // `let __tla = Promise.all([...]).then(async () => { ... })` is the shape the plugin emits.
        if (decl.id.name === '__tla') chunk.isWrapped = true
        const late = (node.kind === 'let' || node.kind === 'var') && !decl.init
        ;(late ? chunk.lateLocals : chunk.eagerLocals).add(decl.id.name)
      }
    }
    // A bare `__tla = ...` is accepted too in case a later version changes the shape.
    if (
      node.type === 'ExpressionStatement' &&
      node.expression.type === 'AssignmentExpression' &&
      node.expression.left.type === 'Identifier' &&
      node.expression.left.name === '__tla'
    ) {
      chunk.isWrapped = true
    }
  }
  return chunk
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

/** False only when the export is positively known to be ready as soon as the chunk is evaluated. */
function isDelayedExport(chunk: ParsedChunk, exported: string): boolean {
  const local = chunk.exportLocals.get(exported)
  if (local === undefined) return true
  if (chunk.lateLocals.has(local)) return true
  return !(chunk.eagerLocals.has(local) || chunk.imports.has(local))
}

interface Unsafe {
  imported: string
  source: string
}

/** Walks one chunk's top level and reports reads of the given unsafe bindings. */
function findEagerReads(
  chunk: ParsedChunk,
  unsafe: Map<string, Unsafe>,
  namespaces: Map<string, { source: string; target: ParsedChunk }>
): { reads: Finding[]; captured: Finding[] } {
  const reads: Finding[] = []
  const captured: Finding[] = []
  const record = (into: Finding[], node: AstNode, localName: string, info: Unsafe) => {
    into.push({
      file: chunk.file,
      localName,
      importedName: info.imported,
      source: info.source,
      line: node.loc?.start?.line ?? 0,
    })
  }
  const walk = (node: AstNode, deferred: boolean, parent: AstNode, inNamespace: boolean): void => {
    if (!node || typeof node.type !== 'string') return
    const into = inNamespace ? captured : reads

    if (!deferred && node.type === 'Identifier' && unsafe.has(node.name) && parent) {
      // `import { X as local }` and `export { local as Y }` are wiring, not reads: a re-export
      // forwards the live binding, so bundles are full of them and none is the dangerous shape.
      if (
        parent.type !== 'ImportSpecifier' &&
        parent.type !== 'ImportDefaultSpecifier' &&
        parent.type !== 'ImportNamespaceSpecifier' &&
        parent.type !== 'ExportSpecifier'
      ) {
        record(into, node, node.name, unsafe.get(node.name)!)
        return
      }
    }
    // `ns.name` through `import * as ns`
    if (
      !deferred &&
      node.type === 'MemberExpression' &&
      node.object?.type === 'Identifier' &&
      namespaces.has(node.object.name)
    ) {
      const ns = namespaces.get(node.object.name)!
      const member = node.computed
        ? node.property?.type === 'Literal'
          ? String(node.property.value)
          : undefined
        : node.property?.name
      if (member !== undefined && isDelayedExport(ns.target, member)) {
        record(into, node, `${node.object.name}.${member}`, { imported: member, source: ns.source })
        return
      }
    }

    const entersNamespace = isModuleNamespaceObject(node)
    const isInvokedAtOnce =
      isFunctionNode(node) && parent?.type === 'CallExpression' && parent.callee === node
    const isCalledBeforeReturn =
      isFunctionNode(node) &&
      (parent?.type === 'CallExpression' || parent?.type === 'NewExpression') &&
      parent.arguments?.includes(node) &&
      ((parent.callee?.type === 'MemberExpression' &&
        parent.callee.property?.type === 'Identifier' &&
        SYNC_METHODS.has(parent.callee.property.name)) ||
        (parent.type === 'NewExpression' &&
          parent.callee?.type === 'Identifier' &&
          SYNC_CONSTRUCTORS.has(parent.callee.name)))
    const nextDeferred =
      deferred || (isFunctionNode(node) && !isInvokedAtOnce && !isCalledBeforeReturn)

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
          if (child && typeof child.type === 'string') {
            walk(child, nextDeferred, node, inNamespace || entersNamespace)
          }
        }
      } else if (value && typeof value.type === 'string') {
        walk(value, nextDeferred, node, inNamespace || entersNamespace)
      }
    }
  }
  walk(chunk.ast, false, null, false)
  return { reads, captured }
}

/**
 * Analyse a built `assets/` folder. `sources` maps each chunk's file name to its text; `indexHtml`
 * is the built index.html, which names the chunks the page loads first.
 */
export function analyzeBuild(
  sources: ReadonlyMap<string, string>,
  indexHtml: string,
  options: AnalyzeOptions = {}
): BuildAnalysis {
  const alwaysLate = options.alwaysLate ?? SOFTHSM_CHUNK
  const chunks = new Map<string, ParsedChunk>()
  for (const [file, text] of sources) {
    const parsed = parseChunk(file, text)
    if (parsed) chunks.set(file, parsed)
  }
  const startup = startupChunks(chunks, indexHtml)
  const isAlwaysLate = (file: string) => alwaysLate.test(file)
  const lateWrapped = [...chunks.values()]
    .filter((c) => c.isWrapped && (!startup.has(c.file) || isAlwaysLate(c.file)))
    .map((c) => c.file)
    .sort()

  // What a chunk causes to load once it has run: the chunks it loads with an import() written inside
  // a function, and their static imports. One dynamic hop only.
  const loadedAfter = new Map<string, Set<string>>()
  const loadedAfterSource = (source: string): Set<string> => {
    const cached = loadedAfter.get(source)
    if (cached) return cached
    const seen = new Set<string>()
    const queue = [...(chunks.get(source)?.deferredLoads ?? [])]
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

  /** Follows named re-exports and aliases to the chunk that really holds the binding. */
  const resolve = (specifier: string, imported: string): { file: string; name: string } => {
    let file = baseName(specifier)
    let name = imported
    for (let hops = 0; hops < 8; hops++) {
      const chunk = chunks.get(file)
      const reexport = chunk?.reexports.get(name)
      const alias = chunk?.exportLocals.get(name)
      const forwarded = reexport ?? (alias !== undefined ? chunk?.imports.get(alias) : undefined)
      if (!forwarded || forwarded.imported === '*') break
      file = baseName(forwarded.source)
      name = forwarded.imported
    }
    return { file, name }
  }

  /** Whether reader F may see `file`'s delayed exports unassigned. */
  const isLateFor = (file: string, reader: string): boolean => {
    const source = chunks.get(file)
    if (!source?.isWrapped) return false
    if (isAlwaysLate(file)) return true
    return !startup.has(file) || startup.has(reader)
  }

  const findings: Finding[] = []
  const notes: Finding[] = []
  for (const chunk of chunks.values()) {
    const awaited = new Set<string>()
    for (const { imported, source } of chunk.imports.values()) {
      if (imported === '__tla') awaited.add(baseName(source))
    }
    const unsafe = new Map<string, Unsafe>()
    const namespaces = new Map<string, { source: string; target: ParsedChunk }>()
    for (const [local, { imported, source }] of chunk.imports) {
      if (imported === '__tla') continue
      const sourceFile = baseName(source)
      if (imported === '*') {
        if (
          !awaited.has(sourceFile) &&
          isLateFor(sourceFile, chunk.file) &&
          (isAlwaysLate(sourceFile) || !loadedAfterSource(sourceFile).has(chunk.file))
        ) {
          namespaces.set(local, { source, target: chunks.get(sourceFile)! })
        }
        continue
      }
      const origin = resolve(source, imported)
      if (awaited.has(origin.file) || !isLateFor(origin.file, chunk.file)) continue
      if (!isAlwaysLate(origin.file) && loadedAfterSource(origin.file).has(chunk.file)) continue
      if (!isDelayedExport(chunks.get(origin.file)!, origin.name)) continue
      unsafe.set(local, { imported, source })
    }
    if (unsafe.size === 0 && namespaces.size === 0) continue
    const { reads, captured } = findEagerReads(chunk, unsafe, namespaces)
    findings.push(...reads)
    notes.push(...captured)
  }

  // One finding per chunk and binding is enough to act on.
  const unique = (all: Finding[]) => {
    const seen = new Set<string>()
    return all.filter((f) => {
      const key = `${f.file}::${f.localName}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
  const found = [...chunks.keys()].filter(isAlwaysLate).sort()
  return {
    chunks: chunks.size,
    startup: startup.size,
    lateWrapped,
    findings: unique(findings),
    notes: unique(notes),
    alwaysLate: { found, wrapped: found.filter((f) => chunks.get(f)!.isWrapped) },
  }
}
