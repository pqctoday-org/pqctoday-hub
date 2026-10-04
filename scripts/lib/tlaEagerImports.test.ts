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

  it("the bundler's own namespace object lists exports without reading them", () => {
    expect(withRead('export const ns = Object.freeze({ a: p })').findings).toEqual([])
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

  it('does not check a namespace import (a documented limit)', () => {
    const body = `import * as ns from "${SOURCE}"\nexport const T = ns.a\n`
    const a = analyze({ 'src-0002.js': WRAPPED, 'page-0003.js': body })
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
