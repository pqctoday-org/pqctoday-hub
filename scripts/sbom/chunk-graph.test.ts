// SPDX-License-Identifier: GPL-3.0-only
// The post-deploy SBOM check walks the deployed chunk graph to find the About chunk. On the
// 4.149.0 deploy it failed although the site was fine: catalog note text naming a ".json" file
// read as a chunk name, was fetched, answered 404, and the rejection took the whole batch (the
// real route chunk included) with it. These tests pin both halves of the fix, and that the walk
// still fails when About really cannot be reached.
import { describe, expect, it } from 'vitest'
import { chunkReferences, findAboutChunk } from './chunk-graph'

const ENTRY = '/assets/index-Aa1Bb2Cc.js'

/** A fake deployed site: file name -> source text. A missing name answers like a 404. */
function site(files: Record<string, string>) {
  const known = new Map(Object.entries(files))
  const asked: string[] = []
  const fetchText = async (name: string) => {
    asked.push(name)
    const text = known.get(name)
    if (text === undefined) throw new Error(`/assets/${name}: HTTP 404`)
    return text
  }
  return { fetchText, asked }
}

describe('chunkReferences', () => {
  it('reads the three forms the bundler writes, once each', () => {
    const text =
      'import("./AboutView-Zz9Yy8Xx.js");import("./AboutView-Zz9Yy8Xx.js");' +
      'x=["assets/vendor-react-g8Kkczce.js","assets/index-Bi3rgKCv.css","/assets/LearnSection-CFX-JKeE.js"];' +
      'import{a}from"./ModuleShell-dyccEo_T.js";'
    expect(chunkReferences(text).sort()).toEqual(
      [
        'AboutView-Zz9Yy8Xx.js',
        'vendor-react-g8Kkczce.js',
        'LearnSection-CFX-JKeE.js',
        'ModuleShell-dyccEo_T.js',
      ].sort()
    )
  })

  it('does not read a file name inside ordinary text as a chunk (the 4.149.0 false positive)', () => {
    const note = "the product's own (example-verdicts-09262026.json). Algorithms follow."
    expect(chunkReferences(note)).toEqual([])
    // Not even when it sits right after a path-like prefix.
    expect(chunkReferences('"assets/example-verdicts-09262026.json"')).toEqual([])
    expect(chunkReferences('"./Widget-Aa1Bb2Cc.jsx"')).toEqual([])
  })

  it('needs the bundler form: bare text that merely looks like a chunk name is ignored', () => {
    expect(chunkReferences('see Widget-Aa1Bb2Cc.js for details')).toEqual([])
    expect(chunkReferences('https://example.test/docs/Widget-Aa1Bb2Cc.js')).toEqual([])
  })
})

describe('findAboutChunk', () => {
  const graph = {
    'index-Aa1Bb2Cc.js': 'import("./App-Dd3Ee4Ff.js")',
    'App-Dd3Ee4Ff.js': 'x=["assets/Page-Gg5Hh6Ii.js","assets/AboutView-Jj7Kk8Ll.js"]',
    'Page-Gg5Hh6Ii.js': '',
    'AboutView-Jj7Kk8Ll.js': 'About page',
  }

  it('finds the About chunk through the graph', async () => {
    const { fetchText } = site(graph)
    expect(await findAboutChunk(ENTRY, fetchText)).toEqual({
      about: 'AboutView-Jj7Kk8Ll.js',
      unreachable: [],
    })
  })

  it('a bogus candidate that 404s cannot mask the real About chunk (same batch, batch of 2)', async () => {
    // The entry chunk carries note text that is not a chunk, plus a stale reference that 404s,
    // both fetched in the same batch as the real App chunk.
    const files = {
      ...graph,
      'index-Aa1Bb2Cc.js':
        'import("./Stale-Mm9Nn0Oo.js");import("./App-Dd3Ee4Ff.js");x="(example-verdicts-09262026.json)"',
    }
    const { fetchText, asked } = site(files)
    const found = await findAboutChunk(ENTRY, fetchText, 2)
    expect(found.about).toBe('AboutView-Jj7Kk8Ll.js')
    // The stale one was tried and recorded; the note text was never fetched.
    expect(found.unreachable.map((u) => u.reason)).toEqual(['/assets/Stale-Mm9Nn0Oo.js: HTTP 404'])
    expect(asked.some((n) => n.includes('verdicts'))).toBe(false)
  })

  it('SABOTAGE: an About chunk that is not referenced anywhere fails, and says what did not load', async () => {
    const { fetchText } = site({
      ...graph,
      'App-Dd3Ee4Ff.js': 'x=["assets/Page-Gg5Hh6Ii.js","assets/Missing-Pp1Qq2Rr.js"]',
    })
    const found = await findAboutChunk(ENTRY, fetchText)
    expect(found.about).toBeUndefined()
    expect(found.unreachable.map((u) => u.reason)).toEqual([
      '/assets/Missing-Pp1Qq2Rr.js: HTTP 404',
    ])
  })

  it('SABOTAGE: a chunk on the only path to About that does not load leaves About unreachable', async () => {
    const files: Record<string, string> = { ...graph }
    delete files['App-Dd3Ee4Ff.js']
    const found = await findAboutChunk(ENTRY, site(files).fetchText)
    expect(found.about).toBeUndefined()
    expect(found.unreachable).toHaveLength(1)
    expect(found.unreachable[0].reason).toContain('App-Dd3Ee4Ff.js')
  })

  it('SABOTAGE: an entry chunk that does not load is an error, not an empty result', async () => {
    await expect(findAboutChunk(ENTRY, site({}).fetchText)).rejects.toThrow('HTTP 404')
  })

  it('walks more than one batch of candidates', async () => {
    const many = Array.from(
      { length: 30 },
      (_, i) => `import("./Part${String(i).padStart(2, '0')}-Aa1Bb2C${i % 10}.js")`
    ).join(';')
    const files: Record<string, string> = { 'index-Aa1Bb2Cc.js': many }
    for (let i = 0; i < 30; i++) files[`Part${String(i).padStart(2, '0')}-Aa1Bb2C${i % 10}.js`] = ''
    files['Part29-Aa1Bb2C9.js'] = 'import("./AboutView-Jj7Kk8Ll.js")'
    files['AboutView-Jj7Kk8Ll.js'] = 'About page'
    const found = await findAboutChunk(ENTRY, site(files).fetchText, 12)
    expect(found.about).toBe('AboutView-Jj7Kk8Ll.js')
  })
})
