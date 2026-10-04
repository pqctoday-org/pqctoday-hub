// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { analyzeBuild, type BuildAnalysis, type Finding } from './tlaEagerImports'

/**
 * Each case builds a few small chunks in the shape the bundler emits, changes exactly one thing from
 * a build that passes, and asserts the result. The suite is only worth having if switching off any
 * single rule in analyzeBuild makes at least one test here fail; check that whenever a rule changes.
 */

// What the top-level-await plugin emits for a chunk with an import(): exports are assigned later,
// and `__tla` is the promise that settles when they have been.
const WRAPPED =
  'let h;\nlet __tla = Promise.all([]).then(async () => {\n  h = () => 1\n})\nexport { h as a, __tla }\n'
const PLAIN = 'const h = () => 1\nexport { h as a }\n'
// Assigned later like a wrapped chunk's export, but with no wrapper, so nothing is actually delayed.
const UNWRAPPED_LATE = 'let h\nh = () => 1\nexport { h as a }\n'
const SOURCE = './src-0002.js'
const IMPORT = `import { a as p } from "${SOURCE}"\n`
const INDEX_HTML = '<script type="module" src="/assets/index-0001.js"></script>'

function analyze(chunks: Record<string, string>, html = INDEX_HTML): BuildAnalysis {
  return analyzeBuild(new Map(Object.entries({ 'index-0001.js': 'export {}\n', ...chunks })), html)
}

/** A route chunk that reads the wrapped chunk's export in the given way at start-up. */
const withRead = (body: string, sourceText = WRAPPED) =>
  analyze({ 'src-0002.js': sourceText, 'page-0003.js': `${IMPORT}${body}\n` })

const found = (a: BuildAnalysis) => a.findings.map((f) => `${f.file}:${f.localName}`)

describe('analyzeBuild: a clean build', () => {
  it('reports nothing and counts what it looked at', () => {
    const a = withRead('export const f = () => p()')
    expect(a.findings).toEqual([])
    expect(a.chunks).toBe(3)
    expect(a.startup).toBe(1)
    expect(a.lateWrapped).toEqual(['src-0002.js'])
  })
})

describe('analyzeBuild: reads that happen while the chunk starts up', () => {
  it('a top-level object holds the export', () => {
    expect(withRead('export const TABLE = { mech: p }').findings).toEqual<Finding[]>([
      {
        file: 'page-0003.js',
        localName: 'p',
        importedName: 'a',
        source: SOURCE,
        line: 2,
      },
    ])
  })

  it('a top-level sort calls it, the shape that stopped /migrate from loading', () => {
    const body = [
      'const INDEX = new Map([["k", [3, 1]]])',
      'for (const list of INDEX.values()) {',
      '  list.sort((x, y) => p(x) - p(y))',
      '}',
    ].join('\n')
    expect(found(withRead(body))).toEqual(['page-0003.js:p'])
  })

  it('a function that is called at once', () => {
    expect(found(withRead('export const v = (() => p())()'))).toEqual(['page-0003.js:p'])
  })

  it.each(['sort', 'map', 'forEach', 'filter', 'reduce', 'find', 'some', 'every', 'flatMap'])(
    'a callback given to %s, which runs before it returns',
    (method) => {
      expect(found(withRead(`;[1, 2].${method}((x) => p(x))`))).toEqual(['page-0003.js:p'])
    }
  )

  it('a promise executor and a Map constructor argument', () => {
    expect(found(withRead('new Promise((resolve) => resolve(p()))'))).toEqual(['page-0003.js:p'])
    expect(found(withRead('new Map([[1, 2]].map((e) => [e, p()]))'))).toEqual(['page-0003.js:p'])
  })

  it('reports one finding per chunk and binding however often it is read', () => {
    expect(found(withRead('export const a1 = p()\nexport const a2 = p()'))).toEqual([
      'page-0003.js:p',
    ])
  })

  it('names the line of the read', () => {
    const a = withRead('const x = 1\nconst y = 2\nexport const z = p()')
    expect(a.findings.map((f) => f.line)).toEqual([4])
  })
})

describe('analyzeBuild: reads that happen later are fine', () => {
  it.each([
    ['a function that is only defined', 'export function f() { return p() }'],
    ['an arrow function that is only defined', 'export const f = () => p()'],
    ['an event listener', 'window.addEventListener("x", () => p())'],
    ['a timer', 'setTimeout(() => p(), 0)'],
    [
      'a factory handed to a hook',
      'const useThing = (hook) => hook(() => p(), [])\nuseThing(() => 1)',
    ],
    ['a class method', 'export class K { m() { return p() } }'],
  ])('%s', (_name, body) => {
    expect(withRead(body).findings).toEqual([])
  })

  it('a re-export is wiring, not a read', () => {
    expect(withRead('export { p as q }').findings).toEqual([])
  })

  it('a property that happens to share the local name is a label, not a read', () => {
    expect(withRead('const o = { p: 1 }\nexport const v = o.p').findings).toEqual([])
  })
})

describe('analyzeBuild: a chunk that waits, or one that cannot be early', () => {
  it('passes when the chunk imports the source’s own __tla, the opt-in to wait for it', () => {
    const waiting = [
      `import { a as p, __tla as __tla_0 } from "${SOURCE}"`,
      'export const TABLE = { mech: p }',
      'export { __tla_0 as __tla }',
    ].join('\n')
    expect(analyze({ 'src-0002.js': WRAPPED, 'page-0003.js': waiting }).findings).toEqual([])
  })

  it('passes a wrapped chunk that waits, whose own code runs after the source is ready', () => {
    // The shape the plugin emits for a chunk with an import() of its own: its body moves into the
    // callback that runs once everything it imports has finished.
    const waiting = [
      `import { a as p, __tla as __tla_0 } from "${SOURCE}"`,
      'let TABLE',
      'let __tla = Promise.all([(() => { try { return __tla_0 } catch {} })()]).then(async () => {',
      '  TABLE = { mech: p }',
      '  const more = () => import("./other-0009.js")',
      '})',
      'export { TABLE, __tla }',
    ].join('\n')
    expect(analyze({ 'src-0002.js': WRAPPED, 'page-0003.js': waiting }).findings).toEqual([])
  })

  it('passes when the source is not wrapped', () => {
    expect(withRead('export const TABLE = { mech: p }', PLAIN).findings).toEqual([])
    expect(withRead('export const TABLE = { mech: p }', UNWRAPPED_LATE).findings).toEqual([])
  })

  it('a wrapped chunk that is not read at start-up is not a finding', () => {
    expect(withRead('export const x = 1').findings).toEqual([])
  })

  it('ignores a bare package import, which is not a chunk', () => {
    const a = analyze({
      'page-0003.js': 'import { a as p } from "react"\nexport const T = { k: p }\n',
    })
    expect(a.findings).toEqual([])
  })
})

describe('analyzeBuild: chunks the page has finished before any route', () => {
  it('a wrapped entry chunk is already running when route chunks load', () => {
    const a = analyze({ 'page-0003.js': `${IMPORT}export const T = { k: p }\n` })
    expect(a.findings).toEqual([])
    // Same shape as the failing case, with the source made the entry chunk.
    const entry = analyzeBuild(
      new Map([
        ['index-0001.js', WRAPPED],
        ['page-0003.js', 'import { a as p } from "./index-0001.js"\nexport const T = { k: p }\n'],
      ]),
      INDEX_HTML
    )
    expect(entry.findings).toEqual([])
    expect(entry.lateWrapped).toEqual([])
  })

  it('what the entry chunk imports statically is part of start-up too', () => {
    const a = analyze({
      'index-0001.js': `import "${SOURCE}"\nexport {}\n`,
      'src-0002.js': WRAPPED,
      'page-0003.js': `${IMPORT}export const T = { k: p }\n`,
    })
    expect(a.findings).toEqual([])
    expect(a.lateWrapped).toEqual([])
  })

  it.each([
    ['a re-export', `export { a } from "${SOURCE}"\n`],
    ['an export-all', `export * from "${SOURCE}"\n`],
  ])('%s from the entry chunk is a start-up dependency too', (_name, entry) => {
    const a = analyze({
      'index-0001.js': entry,
      'src-0002.js': WRAPPED,
      'page-0003.js': `${IMPORT}export const T = { k: p }\n`,
    })
    expect(a.findings).toEqual([])
    expect(a.lateWrapped).toEqual([])
  })

  it('so is the App chunk the root waits for, and what it imports', () => {
    const a = analyze({
      'App-0009.js': `import "${SOURCE}"\nexport {}\n`,
      'src-0002.js': WRAPPED,
      'page-0003.js': `${IMPORT}export const T = { k: p }\n`,
    })
    expect(a.findings).toEqual([])
  })

  it('a chunk the entry only loads with import() is not part of start-up', () => {
    const a = analyze({
      'index-0001.js': `export const load = () => import("${SOURCE}")\n`,
      'src-0002.js': WRAPPED,
      'page-0003.js': `${IMPORT}export const T = { k: p }\n`,
    })
    expect(found(a)).toEqual(['page-0003.js:p'])
  })

  it('takes the entry chunks from index.html, whatever their names', () => {
    const a = analyze(
      {
        'main-7777.js': `import "${SOURCE}"\nexport {}\n`,
        'src-0002.js': WRAPPED,
        'page-0003.js': `${IMPORT}export const T = { k: p }\n`,
      },
      '<script type="module" src="/assets/main-7777.js"></script>'
    )
    expect(a.findings).toEqual([])
  })
})

describe('analyzeBuild: chunks the source itself loads after it has run', () => {
  const sourceLoading = (target: string) =>
    `${WRAPPED}export const open = () => import("./${target}")\n`

  it('may read the source freely (a diagram chunk loaded by its engine)', () => {
    const a = analyze({
      'src-0002.js': sourceLoading('page-0003.js'),
      'page-0003.js': `${IMPORT}export const T = { k: p }\n`,
    })
    expect(a.findings).toEqual([])
  })

  it('and so may what that chunk imports statically', () => {
    const a = analyze({
      'src-0002.js': sourceLoading('lazy-0004.js'),
      'lazy-0004.js': 'import "./page-0003.js"\nexport {}\n',
      'page-0003.js': `${IMPORT}export const T = { k: p }\n`,
    })
    expect(a.findings).toEqual([])
  })

  it('but only one dynamic hop is followed: a chunk loaded by that chunk is still early', () => {
    const a = analyze({
      'src-0002.js': sourceLoading('lazy-0004.js'),
      'lazy-0004.js': 'export const go = () => import("./page-0003.js")\n',
      'page-0003.js': `${IMPORT}export const T = { k: p }\n`,
    })
    expect(found(a)).toEqual(['page-0003.js:p'])
  })

  it('a chunk the source does not load is not excused by another one being loaded', () => {
    const a = analyze({
      'src-0002.js': sourceLoading('page-0003.js'),
      'page-0003.js': 'export {}\n',
      'other-0005.js': `${IMPORT}export const T = { k: p }\n`,
    })
    expect(found(a)).toEqual(['other-0005.js:p'])
  })
})

describe('analyzeBuild: Object.freeze and the bundler namespace object', () => {
  // The shape the bundler emits for the namespace of a module loaded with import(), as found in a
  // saved build: every member is a copy of the value at that moment, not a live binding.
  const NAMESPACE = (members: string) =>
    `export const Rt = Object.freeze(Object.defineProperty({ __proto__: null, ${members} }, Symbol.toStringTag, { value: "Module" }))`

  it('a frozen table someone wrote reads the export while the module runs', () => {
    expect(found(withRead('export const table = Object.freeze({ compare: p })'))).toEqual([
      'page-0003.js:p',
    ])
  })

  it('the exact namespace shape fails too: its copy of a late binding stays undefined for good', () => {
    const a = withRead(NAMESPACE('local: 1, member: p'))
    expect(a.findings).toEqual<Finding[]>([
      { file: 'page-0003.js', localName: 'p', importedName: 'a', source: SOURCE, line: 2 },
    ])
  })

  it('copies of bindings that are ready, or of a source that is not wrapped, are fine', () => {
    expect(withRead(NAMESPACE('local: 1, member: p'), PLAIN).findings).toEqual([])
    expect(withRead(NAMESPACE('local: 1')).findings).toEqual([])
  })

  it('a version that reads through a getter looks the binding up later, so it is fine', () => {
    const getter =
      'export const Rt = Object.freeze(Object.defineProperty({ __proto__: null, get member() { return p } }, Symbol.toStringTag, { value: "Module" }))'
    expect(withRead(getter).findings).toEqual([])
  })
})

describe('analyzeBuild: re-exports and aliases lead to the chunk that holds the binding', () => {
  const page = (from: string, name = 'a') =>
    `import { ${name} as p } from "${from}"\nexport const T = { k: p }\n`

  it('a named re-export', () => {
    const a = analyze({
      'src-0002.js': WRAPPED,
      'barrel-0005.js': `export { a } from "${SOURCE}"\n`,
      'page-0003.js': page('./barrel-0005.js'),
    })
    expect(a.findings).toEqual<Finding[]>([
      {
        file: 'page-0003.js',
        localName: 'p',
        importedName: 'a',
        source: './barrel-0005.js',
        line: 2,
      },
    ])
  })

  it('a re-export under another name', () => {
    const a = analyze({
      'src-0002.js': WRAPPED,
      'barrel-0005.js': `export { a as b } from "${SOURCE}"\n`,
      'page-0003.js': page('./barrel-0005.js', 'b'),
    })
    expect(found(a)).toEqual(['page-0003.js:p'])
  })

  it('an import that is exported again under its own alias', () => {
    const a = analyze({
      'src-0002.js': WRAPPED,
      'barrel-0005.js': `import { a as x } from "${SOURCE}"\nexport { x as a }\n`,
      'page-0003.js': page('./barrel-0005.js'),
    })
    expect(found(a)).toEqual(['page-0003.js:p'])
  })

  it('a chain of two re-exports', () => {
    const a = analyze({
      'src-0002.js': WRAPPED,
      'one-0005.js': `export { a } from "${SOURCE}"\n`,
      'two-0006.js': 'export { a } from "./one-0005.js"\n',
      'page-0003.js': page('./two-0006.js'),
    })
    expect(found(a)).toEqual(['page-0003.js:p'])
  })

  it('passes when the reader also waits for the chunk that really holds the binding', () => {
    const waiting = [
      'import { a as p } from "./barrel-0005.js"',
      `import { __tla as t } from "${SOURCE}"`,
      'export const T = { k: p }',
      'export { t as __tla }',
    ].join('\n')
    const a = analyze({
      'src-0002.js': WRAPPED,
      'barrel-0005.js': `export { a } from "${SOURCE}"\n`,
      'page-0003.js': waiting,
    })
    expect(a.findings).toEqual([])
  })

  it('a re-exported binding read later is fine, and so is one from a source that is not wrapped', () => {
    const later = 'import { a as p } from "./barrel-0005.js"\nexport const f = () => p()\n'
    const barrel = `export { a } from "${SOURCE}"\n`
    expect(
      analyze({ 'src-0002.js': WRAPPED, 'barrel-0005.js': barrel, 'page-0003.js': later }).findings
    ).toEqual([])
    expect(
      analyze({
        'src-0002.js': PLAIN,
        'barrel-0005.js': barrel,
        'page-0003.js': page('./barrel-0005.js'),
      }).findings
    ).toEqual([])
  })
})

describe('analyzeBuild: namespace imports', () => {
  const ns = (use: string) => `import * as ns from "${SOURCE}"\n${use}\n`
  // `k` is declared with an initialiser, so it is ready as soon as the chunk is evaluated.
  const MIXED =
    'const k = 1\nlet h\nlet __tla = Promise.all([]).then(async () => {\n  h = () => 1\n})\nexport { k, h as a, __tla }\n'

  it('a member read while the module runs', () => {
    const a = analyze({ 'src-0002.js': WRAPPED, 'page-0003.js': ns('export const T = ns.a') })
    expect(a.findings).toEqual<Finding[]>([
      { file: 'page-0003.js', localName: 'ns.a', importedName: 'a', source: SOURCE, line: 2 },
    ])
  })

  it('a computed member with a literal name', () => {
    const a = analyze({ 'src-0002.js': WRAPPED, 'page-0003.js': ns('export const T = ns["a"]') })
    expect(found(a)).toEqual(['page-0003.js:ns.a'])
  })

  it('passes when the reader imports the source’s own __tla as well', () => {
    const page = `${ns('export const T = ns.a')}import { __tla as t } from "${SOURCE}"\nexport { t as __tla }\n`
    expect(analyze({ 'src-0002.js': WRAPPED, 'page-0003.js': page }).findings).toEqual([])
  })

  it('a member that is ready at once, a read inside a function, and passing the namespace on are fine', () => {
    const page = ns('export const K = ns.k\nexport const f = () => ns.a\nuse(ns)')
    expect(analyze({ 'src-0002.js': MIXED, 'page-0003.js': page }).findings).toEqual([])
  })
})

describe('analyzeBuild: only exports that are assigned late are delayed', () => {
  const MIXED =
    'const k = 1\nfunction f() {}\nlet h\nlet __tla = Promise.all([]).then(async () => {\n  h = () => 1\n})\nexport { k as k, f as f, h as a, __tla }\n'

  it('flags the late export and not the ones ready at once', () => {
    const page = [
      `import { k as pk, f as pf, a as p } from "${SOURCE}"`,
      'export const T = { one: pk, two: pf, three: p }',
    ].join('\n')
    expect(found(analyze({ 'src-0002.js': MIXED, 'page-0003.js': page }))).toEqual([
      'page-0003.js:p',
    ])
  })
})

describe('analyzeBuild: the HSM engine chunk is late wherever it sits', () => {
  const HSM = 'softhsm-0002.js'
  const reader = `import { a as p } from "./${HSM}"\nexport const T = { k: p }\n`

  it('is checked even when start-up code imports it', () => {
    const a = analyze({
      'index-0001.js': `import "./${HSM}"\nexport {}\n`,
      [HSM]: WRAPPED,
      'page-0003.js': reader,
    })
    expect(found(a)).toEqual(['page-0003.js:p'])
    expect(a.lateWrapped).toEqual([HSM])
  })

  it('and a chunk it loads after it has run is not excused', () => {
    const a = analyze({
      [HSM]: `${WRAPPED}export const open = () => import("./page-0003.js")\n`,
      'page-0003.js': reader,
    })
    expect(found(a)).toEqual(['page-0003.js:p'])
  })

  it('a chunk with another name gets no such treatment (control)', () => {
    const a = analyze({
      'index-0001.js': `import "./engine-0002.js"\nexport {}\n`,
      'engine-0002.js': WRAPPED,
      'page-0003.js': reader.replace(HSM, 'engine-0002.js'),
    })
    expect(a.findings).toEqual([])
  })

  it('says which chunks matched and which of them are wrapped', () => {
    expect(analyze({ [HSM]: WRAPPED }).alwaysLate).toEqual({ found: [HSM], wrapped: [HSM] })
    expect(analyze({ [HSM]: PLAIN }).alwaysLate).toEqual({ found: [HSM], wrapped: [] })
    expect(analyze({ 'other-0002.js': WRAPPED }).alwaysLate).toEqual({ found: [], wrapped: [] })
  })

  it('takes another pattern when asked', () => {
    const a = analyzeBuild(
      new Map([
        ['index-0001.js', `import "./engine-0002.js"\nexport {}\n`],
        ['engine-0002.js', WRAPPED],
        ['page-0003.js', reader.replace(HSM, 'engine-0002.js')],
      ]),
      INDEX_HTML,
      { alwaysLate: /^engine-/ }
    )
    expect(found(a)).toEqual(['page-0003.js:p'])
  })
})

describe('analyzeBuild: a chunk that runs in the start-up set reads the source back to back', () => {
  it('is checked when both are part of start-up', () => {
    const a = analyze({
      'index-0001.js': 'import "./src-0002.js"\nimport "./page-0003.js"\nexport {}\n',
      'src-0002.js': WRAPPED,
      'page-0003.js': `${IMPORT}export const T = { k: p }\n`,
    })
    expect(found(a)).toEqual(['page-0003.js:p'])
  })

  it('and passes when it waits for the source', () => {
    const waiting = `import { a as p, __tla as __tla_0 } from "${SOURCE}"\nexport const T = { k: p }\nexport { __tla_0 as __tla }\n`
    const a = analyze({
      'index-0001.js': 'import "./src-0002.js"\nimport "./page-0003.js"\nexport {}\n',
      'src-0002.js': WRAPPED,
      'page-0003.js': waiting,
    })
    expect(a.findings).toEqual([])
  })
})

describe('analyzeBuild: an import() only excuses the chunk it loads when it runs later', () => {
  const loads = (wrapper: string, outside = '') =>
    `${outside}let h\nlet __tla = ${wrapper}\nexport { h as a, __tla }\n`
  const page = { 'page-0003.js': `${IMPORT}export const T = { k: p }\n` }

  it('in the wrapper body itself, it runs while the chunk starts (not an excuse)', () => {
    const src = loads(
      'Promise.all([]).then(async () => {\n  h = () => 1\n  import("./page-0003.js")\n})'
    )
    expect(found(analyze({ 'src-0002.js': src, ...page }))).toEqual(['page-0003.js:p'])
  })

  it('at the top level of the chunk (not an excuse)', () => {
    const src = loads(
      'Promise.all([]).then(async () => {\n  h = () => 1\n})',
      'import("./page-0003.js")\n'
    )
    expect(found(analyze({ 'src-0002.js': src, ...page }))).toEqual(['page-0003.js:p'])
  })

  it('among the things the wrapper waits for (not an excuse)', () => {
    const src = loads(
      'Promise.all([import("./page-0003.js")]).then(async () => {\n  h = () => 1\n})'
    )
    expect(found(analyze({ 'src-0002.js': src, ...page }))).toEqual(['page-0003.js:p'])
  })

  it('inside a function in the wrapper, it runs when someone calls it (an excuse)', () => {
    const src = loads(
      'Promise.all([]).then(async () => {\n  h = () => 1\n  window.open = () => import("./page-0003.js")\n})'
    )
    expect(analyze({ 'src-0002.js': src, ...page }).findings).toEqual([])
  })

  it('wrapped in the bundler’s preload helper inside a function (an excuse)', () => {
    const src = loads(
      'Promise.all([]).then(async () => {\n  h = () => 1\n  window.open = () => preload(() => import("./page-0003.js"), [])\n})'
    )
    expect(analyze({ 'src-0002.js': src, ...page }).findings).toEqual([])
  })
})

describe('analyzeBuild: ways a chunk can be marked as wrapped', () => {
  it('an export of the promise under the name __tla, whatever it is called inside', () => {
    const src = 'let h\nconst done = Promise.resolve()\nexport { h as a, done as __tla }\n'
    expect(
      found(analyze({ 'src-0002.js': src, 'page-0003.js': `${IMPORT}export const T = { k: p }\n` }))
    ).toEqual(['page-0003.js:p'])
  })
})

describe('analyzeBuild: odd input', () => {
  it('skips a file it cannot read as JavaScript and still checks the rest', () => {
    const a = analyze({
      'broken-0006.js': 'this is { not javascript',
      'src-0002.js': WRAPPED,
      'page-0003.js': `${IMPORT}export const T = { k: p }\n`,
    })
    expect(a.chunks).toBe(3)
    expect(found(a)).toEqual(['page-0003.js:p'])
  })

  it('lists the wrapped chunks that load after start-up, sorted', () => {
    const a = analyze({
      'zeta-0008.js': WRAPPED,
      'alpha-0007.js': WRAPPED,
      'plain-0006.js': PLAIN,
    })
    expect(a.lateWrapped).toEqual(['alpha-0007.js', 'zeta-0008.js'])
  })
})
