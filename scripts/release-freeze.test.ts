// SPDX-License-Identifier: GPL-3.0-only
/**
 * release:freeze (plan WS-J J-4 tooling). Nothing is frozen here: the real
 * tree is only read (dry run), and every sabotage runs on files in os.tmpdir().
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  FREEZE_SCHEMA,
  buildFreezeManifest,
  compareToFreeze,
  refuseToWrite,
  type FreezeManifest,
} from './release-freeze'
import { REPORT_JSON_REL, claimsSha256, sha256 } from './generate-release-evidence'

const REPO = process.cwd()

describe('release:freeze — dry run on the real tree', () => {
  let m: FreezeManifest
  beforeEach(async () => {
    m = await buildFreezeManifest(REPO)
  }, 60000)

  it('binds hub commit, engine artifacts, wasm bundles and the report figures', () => {
    expect(m.schema).toBe(FREEZE_SCHEMA)
    expect(m.mode).toBe('dry-run')
    expect(m.hub.commit).toMatch(/^[0-9a-f]{40}$/)
    expect(m.engines.map((e) => e.engine).sort()).toEqual(['cpp', 'rust'])
    for (const e of m.engines) for (const a of e.artifacts) expect(a.matches, a.path).toBe(true)
    expect(m.wasmBundles.find((b) => b.name === 'softhsm-cpp-engine')?.hsmCommit).toBeTruthy()
    const report = JSON.parse(fs.readFileSync(path.join(REPO, REPORT_JSON_REL), 'utf8'))
    expect(m.reportClaimsSha256).toBe(claimsSha256(report))
    expect(m.checks.releaseEvidence).toBe('pass')
  })

  it('the tree matches its own snapshot (no false drift)', () => {
    expect(compareToFreeze(REPO, m).diffs).toEqual([])
  })

  it('a write needs a label and the deck check, and is refused for an unfrozen artifact', () => {
    const why = refuseToWrite(m).join('\n')
    expect(why).toMatch(/--label/)
    expect(why).toMatch(/--presentation/)
    const tampered: FreezeManifest = {
      ...m,
      label: 'rc1',
      hub: { ...m.hub, clean: true },
      presentation: { dir: '/x', files: [], check: 'pass', findings: [] },
      engines: [
        {
          ...m.engines[0],
          artifacts: [{ ...m.engines[0].artifacts[0], matches: false }],
        },
      ],
    }
    expect(refuseToWrite(tampered).join('\n')).toMatch(/no longer matches the hash/)
    expect(refuseToWrite({ ...tampered, engines: m.engines })).toEqual([])
    expect(
      refuseToWrite({
        ...tampered,
        engines: m.engines,
        presentation: { dir: '/x', files: [], check: 'fail', findings: ['drift'] },
      }).join()
    ).toMatch(/deck check fails/)
  })
})

describe('release:freeze --check — sabotage on a temp tree', () => {
  let tmp: string
  const write = (rel: string, body: string | Buffer) => {
    const abs = path.join(tmp, rel)
    fs.mkdirSync(path.dirname(abs), { recursive: true })
    fs.writeFileSync(abs, body)
    return sha256(fs.readFileSync(abs))
  }
  let frozen: FreezeManifest
  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'release-freeze-'))
    const wasm = write('public/wasm/engine.wasm', Buffer.from([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0]))
    const report = { vectors: { n: 18 }, reviews: { validRecords: 0 } }
    const reportSha = write(REPORT_JSON_REL, JSON.stringify(report))
    const matrixSha = write('evidence/acvp-xplat/run1/matrix.json', '{"runId":"run1"}')
    write(
      'public/wasm/wasm-provenance.json',
      JSON.stringify({
        bundles: [{ name: 'engine', files: ['public/wasm/engine.wasm'], hsmCommit: 'abc' }],
      })
    )
    frozen = {
      schema: FREEZE_SCHEMA,
      label: 'fixture',
      mode: 'frozen',
      frozenAt: '2026-10-19T00:00:00.000Z',
      hub: { commit: null, describe: null, version: null, clean: true, uncommitted: [] },
      wasmBundles: [
        {
          name: 'engine',
          hsmCommit: 'abc',
          builtAt: null,
          files: [{ path: 'public/wasm/engine.wasm', sha256: wasm }],
        },
      ],
      engines: [
        {
          engine: 'cpp',
          sourceCommit: 'abc',
          artifacts: [
            { path: 'public/wasm/engine.wasm', recordedSha256: wasm, sha256: wasm, matches: true },
          ],
        },
      ],
      generated: [{ path: REPORT_JSON_REL, sha256: reportSha }],
      reportClaimsSha256: claimsSha256(report),
      reportInputs: {},
      evidenceRuns: [
        {
          runId: 'run1',
          matrix: { path: 'evidence/acvp-xplat/run1/matrix.json', sha256: matrixSha },
        },
      ],
      presentation: null,
      checks: { releaseEvidence: 'pass', errors: [] },
    }
  })
  afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }))

  it('an untouched tree still matches', () => {
    expect(compareToFreeze(tmp, frozen).diffs).toEqual([])
  })

  it('SABOTAGE: one changed artifact byte is a difference naming the file', () => {
    const p = path.join(tmp, 'public/wasm/engine.wasm')
    const b = fs.readFileSync(p)
    b[7] ^= 1
    fs.writeFileSync(p, b)
    const { diffs } = compareToFreeze(tmp, frozen)
    expect(diffs.some((d) => d.startsWith('wasm bundle engine public/wasm/engine.wasm'))).toBe(true)
    expect(diffs.some((d) => d.startsWith('engine cpp public/wasm/engine.wasm'))).toBe(true)
  })

  it('SABOTAGE: a moved hsm commit in wasm-provenance.json is a difference', () => {
    write(
      'public/wasm/wasm-provenance.json',
      JSON.stringify({
        bundles: [{ name: 'engine', files: ['public/wasm/engine.wasm'], hsmCommit: 'def' }],
      })
    )
    expect(compareToFreeze(tmp, frozen).diffs.join()).toMatch(/frozen hsm commit abc → now def/)
  })

  it('SABOTAGE: a changed report figure or evidence run is a difference; a review alone is not', () => {
    write(REPORT_JSON_REL, JSON.stringify({ vectors: { n: 18 }, reviews: { validRecords: 1 } }))
    const reviewOnly = compareToFreeze(tmp, frozen)
    expect(reviewOnly.diffs).toEqual([])
    expect(reviewOnly.notes.join()).toMatch(/changed since the freeze/)

    write(REPORT_JSON_REL, JSON.stringify({ vectors: { n: 19 }, reviews: { validRecords: 1 } }))
    write('evidence/acvp-xplat/run1/matrix.json', '{"runId":"run1","x":1}')
    const d = compareToFreeze(tmp, frozen).diffs.join('\n')
    expect(d).toMatch(/release evidence figures/)
    expect(d).toMatch(/evidence run run1/)
  })
})
