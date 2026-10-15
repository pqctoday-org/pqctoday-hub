// SPDX-License-Identifier: GPL-3.0-only
/**
 * The numbers the key-rotation, shared-decryption and flood-sizing views quote must equal the
 * published run files they link to (public/data/fhe-evidence), so a number cannot drift from its
 * evidence.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { EVIDENCE_MANIFEST } from '@/data/fhe/fheEvidence'
import { OPENFHE_EXPORT_BOARDS, OPENFHE_ITERATIVE } from '../data/fheComputeService'
import { FLOOD_ID2, FLOOD_ID3, FLOOD_ID3_BOARDS, GATE_F_BAR_BITS } from '../data/fheFloodSizing'
import { ROTATION_MEASURED, SHARED_MEASURED } from './fheRotationSharedData'

const ROOT = path.resolve(__dirname, '../../../../../../public/data/fhe-evidence')
const json = (folder: string, file: string) =>
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed test folders under public/
  JSON.parse(fs.readFileSync(path.join(ROOT, folder, file), 'utf8'))
const round = (x: number, d: number) => x.toFixed(d)

describe('rotation numbers match the rotation run files', () => {
  const check = json('ckks-rotation-ab8b1c3', 'rotation-check.json')
  const rot = json('ckks-rotation-ab8b1c3', 'rotate.json')
  const e2e = json('ckks-rotation-ab8b1c3', 'e2e-check.json')
  it('sizes, calls and limbs', () => {
    expect(ROTATION_MEASURED.keyBytes).toBe(check.rotationKeyBytes)
    expect(ROTATION_MEASURED.streamedBytes).toBe(check.rotationKeyBBytes)
    expect(ROTATION_MEASURED.streamedBytes).toBe(rot.bBytes)
    expect(ROTATION_MEASURED.streamCalls).toBe(rot.chunkCalls)
    expect(ROTATION_MEASURED.limbsPerCall).toBe(rot.limbsPerCall)
    expect(ROTATION_MEASURED.limbsCompared).toBe(check.limbsCompared)
    expect(ROTATION_MEASURED.mismatches).toBe(check.mismatches)
    expect(ROTATION_MEASURED.manifestBytes).toBe(rot.manifestBytes)
  })
  it('precision and switch times at level 9 and level 0', () => {
    const [top, bottom] = check.levels
    expect(top.level).toBe(ROTATION_MEASURED.top.level)
    expect(round(top.log2PrecisionUnderOldKey, 1)).toBe(ROTATION_MEASURED.top.before)
    expect(round(top.log2PrecisionAfterSwitchUnderNewKey, 1)).toBe(ROTATION_MEASURED.top.after)
    expect(round(top.switchSeconds * 1000, 1)).toBe(ROTATION_MEASURED.top.switchMs)
    expect(round(top.log2PrecisionSwitchedCiphertextUnderOldKey, 1).replace('-', '−')).toBe(
      ROTATION_MEASURED.top.oldKey
    )
    expect(bottom.level).toBe(ROTATION_MEASURED.bottom.level)
    expect(round(bottom.log2PrecisionUnderOldKey, 1)).toBe(ROTATION_MEASURED.bottom.before)
    expect(round(bottom.log2PrecisionAfterSwitchUnderNewKey, 1)).toBe(
      ROTATION_MEASURED.bottom.after
    )
    expect(round(bottom.switchSeconds * 1000, 1)).toBe(ROTATION_MEASURED.bottom.switchMs)
    expect(round(bottom.log2PrecisionSwitchedCiphertextUnderOldKey, 1).replace('-', '−')).toBe(
      ROTATION_MEASURED.bottom.oldKey
    )
    expect(round(e2e.log2PrecisionAfterHsmDecrypt, 2)).toBe(ROTATION_MEASURED.newKeyReleaseBits)
    expect(e2e.releasedPrecisionBits).toBe(ROTATION_MEASURED.releasePrecisionBitsSetting)
  })
})

describe('shared-decryption numbers match the threshold run files', () => {
  const run = json('ckks-threshold-2of2-8beec58', 'n16threshold-1.json')
  const sizes = json('ckks-threshold-2of2-8beec58', 'sizes2.json')
  const td = json('ckks-threshold-2of2-8beec58', 'tdecrypt2.json')
  it('sizes', () => {
    expect(SHARED_MEASURED.perTokenUploadBytes).toBe(run.sizesBytes.perPartyUploadTotal)
    expect(SHARED_MEASURED.relinDownloadBytes).toBe(sizes.relinRoundOneShare)
    expect(SHARED_MEASURED.shareBytes).toBe(sizes.thresholdDecryptShareLevel0)
    expect(SHARED_MEASURED.shareToOwnerBytes).toBe(sizes.publicKeySwitchShareLevel0)
    expect(SHARED_MEASURED.singleTokenBytes).toBe(
      json('ckks-default-lmss-id2-3bcdc05', 'export.json').bytes
    )
    expect(round(json('ckks-p0-sizes-7de154b', 'N16QP1546H192H32.json').bootstrapLog2Prec, 1)).toBe(
      SHARED_MEASURED.oneParty
    )
  })
  it('precision, weight and the crafted request', () => {
    expect(round(run.log2PrecisionDecryptWithOneShareOnly, 1).replace('-', '−')).toBe(
      SHARED_MEASURED.oneShareAloneBits
    )
    expect(String(run.jointMainSecret.nonZero)).toBe(SHARED_MEASURED.jointWeight)
    expect(String(run.mainShareHammingWeight)).toBe(SHARED_MEASURED.singleWeight)
    expect(run.craftedQueryShareCoeffsRecovered).toBe(65_536)
    expect(run.craftedQueryShareCoeffsTotal).toBe(65_536)
    expect(round(td.partialDecryptSecondsPerParty * 1000, 1)).toBe(SHARED_MEASURED.shareMs)
    expect(round(run.log2PrecisionAfterBootstrapJointKey, 1)).toBe('24.5')
  })
})

describe('flood sizing numbers match the corrected runs', () => {
  const prec = (folder: string) =>
    round(json(folder, 'e2e-check.json').log2PrecisionAfterHsmDecrypt, 2)
  it('registry ID 3 at depth 0, 1 and 3, against the bar', () => {
    expect(prec('ckks-metabts2-lmss-gate-f-3bcdc05')).toBe(FLOOD_ID3.depth0)
    expect(prec('ckks-metabts2-lmss-depth1-3bcdc05')).toBe(FLOOD_ID3.depth1)
    expect(prec('ckks-metabts2-lmss-depth3-3bcdc05')).toBe(FLOOD_ID3.depth3)
    for (const v of [FLOOD_ID3.depth0, FLOOD_ID3.depth1, FLOOD_ID3.depth3])
      expect(parseFloat(v)).toBeGreaterThan(GATE_F_BAR_BITS)
    expect(parseFloat(FLOOD_ID3.depth0) - GATE_F_BAR_BITS).toBeCloseTo(1.1, 1)
    expect(parseFloat(FLOOD_ID3.depth3) - GATE_F_BAR_BITS).toBeCloseTo(1.34, 1)
  })
  it('registry ID 3 with the token on each board, and the range and margin quoted', () => {
    const peakMiB: number[] = []
    for (const [b, vals] of [
      ['mx95pro', FLOOD_ID3_BOARDS.mx95pro],
      ['mx95', FLOOD_ID3_BOARDS.mx95],
    ] as const) {
      const folder = `ckks-metabts2-lmss-${b}-dc9ad8b`
      expect(prec(folder), `${b} depth 0`).toBe(vals.depth0)
      expect(round(json(folder, 'depth1-e2e-check.json').log2PrecisionAfterHsmDecrypt, 2)).toBe(
        vals.depth1
      )
      expect(round(json(folder, 'depth3-e2e-check.json').log2PrecisionAfterHsmDecrypt, 2)).toBe(
        vals.depth3
      )
      expect(round(json(folder, 'generate-only.json').seconds, 1)).toBe(vals.generationSeconds)
      expect(json(folder, 'e2e.json').paramSet).toBe(3)
      expect(fs.readFileSync(path.join(ROOT, folder, 'verify.txt'), 'utf8')).toContain(
        '0 mismatches'
      )
      expect(fs.readFileSync(path.join(ROOT, folder, 'program-verify.txt'), 'utf8')).toContain(
        '0 mismatches'
      )
      const peaks = [
        json(folder, 'generate-only.json').peakRssKiB,
        json(folder, 'export.json').peakRssKiB,
        json(folder, 'program-export.json').peakRssKiB,
      ]
      peakMiB.push(...peaks.map((k: number) => k / 1024))
      expect(String(json(folder, 'stream-wall.json').wallSecondsEndToEnd)).toBe(
        FLOOD_ID3_BOARDS.streamedSeconds[b]
      )
    }
    expect(`${Math.min(...peakMiB).toFixed(1)}–${Math.max(...peakMiB).toFixed(1)}`).toBe(
      FLOOD_ID3_BOARDS.peakMiB
    )
    // every flooded run sits 1.1 to 1.4 bits above the bar, and within 0.3 bits of the Mac
    const all = [
      FLOOD_ID3.depth0,
      FLOOD_ID3.depth1,
      FLOOD_ID3.depth3,
      ...Object.values(FLOOD_ID3_BOARDS.mx95pro).slice(0, 3),
      ...Object.values(FLOOD_ID3_BOARDS.mx95).slice(0, 3),
    ].map(parseFloat)
    expect(Math.min(...all).toFixed(2)).toBe(FLOOD_ID3.rangeLow)
    expect(Math.max(...all).toFixed(2)).toBe(FLOOD_ID3.rangeHigh)
    const mac = [FLOOD_ID3.depth0, FLOOD_ID3.depth1, FLOOD_ID3.depth3].map(parseFloat)
    for (const b of [FLOOD_ID3_BOARDS.mx95pro, FLOOD_ID3_BOARDS.mx95])
      [b.depth0, b.depth1, b.depth3].forEach((v, i) =>
        expect(Math.abs(parseFloat(v) - mac[i])).toBeLessThan(
          Number(FLOOD_ID3_BOARDS.maxFromMacBits)
        )
      )
    expect(FLOOD_ID3.margin).toBe('1.1–1.4')
  })
  it('registry ID 2 emulation and the flood width formula', () => {
    const n = json('ckks-default-lmss-id2-3bcdc05', 'noise-2.json')
    expect(round(n.log2PrecisionFlooded, 2).replace('-', '−')).toBe(FLOOD_ID2.emulatedBits)
    expect(round(n.log2FloodSigma, 1)).toBe(FLOOD_ID2.sigmaLog2)
    expect(n.floodQLineageTotal).toBe(50_000)
    // log2 sigma = s/2 + 1/2 log2(24 q n) + log2 B, with s = 30, q = 50,000, n = 2^16
    const sigma = (log2B: number) => 15 + 0.5 * Math.log2(24 * 50_000 * 65_536) + log2B
    expect(sigma(10).toFixed(2)).toBe('43.10')
    expect(sigma(36).toFixed(2)).toBe(FLOOD_ID3.sigmaLog2)
    // the shortfall of the first version at n = 2^16: 1/2 log2(24 n)
    expect((0.5 * Math.log2(24 * 65_536)).toFixed(1)).toBe('10.3')
  })
})

describe('the OpenFHE set (registry ID 4) generated with the token on the boards', () => {
  const text = (folder: string, file: string) =>
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed test folders under public/
    fs.readFileSync(path.join(ROOT, folder, file), 'utf8')
  const prov = (folder: string) =>
    Object.fromEntries(
      text(folder, 'provenance.txt')
        .split('\n')
        .filter((l) => l.includes(': '))
        .map((l) => [l.slice(0, l.indexOf(': ')), l.slice(l.indexOf(': ') + 2)])
    )
  for (const b of ['mx95', 'mx95pro'] as const) {
    it(`${b}: the numbers the Learn text quotes equal the run files`, () => {
      const folder = `ckks-openfhe-set-${b}-461f44ae`
      const gen = json(folder, 'generate-only.json')
      const exp = json(folder, 'export.json')
      const rec = json(folder, 'receive.json')
      const p = prov(folder)
      expect(gen.paramSet).toBe(4)
      expect(gen.keys).toBe(79)
      expect(gen.bytes).toBe(6_561_464_453)
      expect(exp.bytes).toBe(6_561_464_453)
      expect(round(gen.seconds, 0)).toBe(OPENFHE_EXPORT_BOARDS.generationS[b])
      expect(round(exp.seconds, 0)).toBe(OPENFHE_EXPORT_BOARDS.streamedS[b])
      // "about 2.4 minutes" to generate, "about 3 minutes" to stream
      expect(round(gen.seconds / 60, 1)).toBe('2.4')
      expect(round(exp.seconds / 60, 0)).toBe('3')
      // every piece matches: receiver hashes, the token-signed manifest, the reference spec
      expect(rec.hashMismatches).toBe(0)
      expect(rec.tokenManifest.mismatches).toBe(0)
      expect(rec.tokenManifest.entries).toBe(Number(OPENFHE_EXPORT_BOARDS.pieces.replace(',', '')))
      expect(text(folder, 'verify.txt')).toContain(
        '32 public-key limbs, 12483 evaluation-key limbs compared, 0 mismatches'
      )
      expect(p['chunk_hashes_vs_2026-10-12_mac_export']).toMatch(/^identical \(all 1565 /)
      // the custodian was built from the HSM main that contains #360
      expect(p.registry_id).toBe('4')
      expect(p.build_source).toContain('9dea1716044217cc2e0c5809f347639f4e825564')
      expect(p.hsm_commit).toBe('ebbc3d20ab209bfba125243f2b9a029b71a8cf9d')
    })
  }

  it('the quoted token peak range covers both boards and every measurement', () => {
    const peaks: number[] = []
    for (const b of ['mx95', 'mx95pro'])
      for (const f of ['generate-only.json', 'export.json'])
        peaks.push(json(`ckks-openfhe-set-${b}-461f44ae`, f).peakRssKiB / 1024)
    expect(`${Math.min(...peaks).toFixed(1)}–${Math.max(...peaks).toFixed(1)}`).toBe(
      OPENFHE_EXPORT_BOARDS.peakMiB
    )
  })

  it('the two records share one parameter set, run files from the merged tree and no secrets or hosts', () => {
    for (const b of ['mx95', 'mx95pro']) {
      const rec = EVIDENCE_MANIFEST.records.find(
        (r) => r.id === `ckks-openfhe-set-token-${b}-461f44ae`
      )!
      expect(rec.level).toBe('device')
      expect(rec.parts?.[0].role).toBe('custodian')
      expect(rec.engine?.commit).toBe('461f44ae2599799f261f62245456079ffad6a710')
      expect(rec.notes).toContain('9dea1716044217cc2e0c5809f347639f4e825564')
      expect(rec.notes).toContain('461f44ae2599799f261f62245456079ffad6a710')
      expect(rec.notes).toContain('does not show OpenFHE running on a board')
      for (const a of rec.artifacts) {
        const body = text(`ckks-openfhe-set-${b}-461f44ae`, a.name)
        expect(body, a.name).not.toMatch(/(\d{1,3}\.){3}\d{1,3}|\/Users\/|@[a-z0-9-]+\.[a-z]+/i)
      }
    }
  })
})

describe('OpenFHE iterative bootstrapping (two rounds) on the registry ID 4 keys', () => {
  const FOLDER = 'ckks-openfhe-iterative-cc9d7bc'
  const RECORD = 'ckks-openfhe-iterative-m5max-cc9d7bc'
  const text = (file: string) =>
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed test folder under public/
    fs.readFileSync(path.join(ROOT, FOLDER, file), 'utf8')
  const files = () =>
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed test folder under public/
    fs.readdirSync(path.join(ROOT, FOLDER)).sort()
  type Stage = {
    name: string
    numIterations: number
    seconds: number
    usableLevels: number
    scalingFactor: number
    log2Precision?: number
    log2PrecisionTestSecret?: number
  }
  type Run = { keys: number; paramSet?: number; peakRssGB: number; stages: Stage[] }
  const runs = (re: RegExp): Run[] =>
    files()
      .filter((f) => re.test(f))
      .map((f) => JSON.parse(text(f)) as Run)
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
  const pick = (rs: Run[], stage: string, field: 'log2Precision' | 'log2PrecisionTestSecret') =>
    mean(rs.map((r) => r.stages.find((s) => s.name === stage)![field]!))
  const secs = (rs: Run[], stage: string) =>
    mean(rs.map((r) => r.stages.find((s) => s.name === stage)!.seconds))
  const releases = (re: RegExp) =>
    files()
      .filter((f) => re.test(f))
      .flatMap((f) =>
        text(f)
          .split('\n')
          .filter(Boolean)
          .map(
            (l) =>
              JSON.parse(l) as {
                stage: string
                check: { log2Precision: number; log2PrecisionScaleCorrected: number }
              }
          )
      )
  const relMean = (rs: ReturnType<typeof releases>, stage: string, scaled: boolean) =>
    mean(
      rs
        .filter((r) => r.stage === stage)
        .map((r) => (scaled ? r.check.log2PrecisionScaleCorrected : r.check.log2Precision))
    )

  // main sweep: precision 2 to 15 (four runs each); extended sweep: 16 to 24 (two runs each)
  const own = runs(/^own-iter-rep\d\.json$/)
  const tok = runs(/^token-stages-rep\d\.json$/)
  const ownExt = runs(/^own-iter-ext-rep\d\.json$/)
  const tokExt = runs(/^token-stages-ext-rep\d\.json$/)
  const rel = releases(/^token-release\.jsonl$/)
  const relExt = releases(/^token-release-ext\.jsonl$/)
  const P = 'log2Precision' as const
  const T = 'log2PrecisionTestSecret' as const

  it('the run counts are the ones the Learn text and the record state', () => {
    expect([own.length, tok.length, ownExt.length, tokExt.length]).toEqual([4, 4, 2, 2])
    for (const r of [...own, ...tok, ...ownExt, ...tokExt]) expect(r.keys).toBe(79)
    for (const r of tok) expect(r.paramSet ?? 4).toBe(4)
  })

  it('one refresh (the control) and the example’s rule equal the run files', () => {
    expect(pick(own, 'boot1', P).toFixed(2)).toBe(OPENFHE_ITERATIVE.oneRound.own)
    expect(pick(tok, 'boot1', T).toFixed(2)).toBe(OPENFHE_ITERATIVE.oneRound.token)
    expect(pick(tok, 'boot1', T).toFixed(1)).toBe('13.2')
    // the rule: floor(13.2) - 5 = 8
    expect(Math.floor(pick(tok, 'boot1', T)) - 5).toBe(OPENFHE_ITERATIVE.rule.precision)
    const p = `boot2_p${OPENFHE_ITERATIVE.rule.precision}`
    expect(pick(own, p, P).toFixed(2)).toBe(OPENFHE_ITERATIVE.rule.own)
    expect(pick(tok, p, T).toFixed(2)).toBe(OPENFHE_ITERATIVE.rule.token)
    expect(pick(tok, p, T).toFixed(1)).toBe('21.1')
    expect(relMean(rel, p, false).toFixed(2)).toBe(OPENFHE_ITERATIVE.rule.release)
    expect(relMean(rel, p, true).toFixed(2)).toBe(OPENFHE_ITERATIVE.rule.release)
  })

  it('the best settings, the release with and without the true scale, and the fall', () => {
    const t19 = pick(tokExt, 'boot2_p19', T)
    const t20 = pick(tokExt, 'boot2_p20', T)
    expect(t19.toFixed(2)).toBe('31.80')
    expect(t20.toFixed(2)).toBe('31.73')
    expect(`${t20.toFixed(1)} to ${t19.toFixed(1)}`).toBe(OPENFHE_ITERATIVE.best.tokenRange)
    expect(pick(ownExt, 'boot2_p19', P).toFixed(2)).toBe('31.88')
    expect(pick(ownExt, 'boot2_p20', P).toFixed(2)).toBe('31.84')
    // the best settings are the best of the sweep, for the token’s keys
    const sweep = [16, 17, 18, 19, 20, 22, 24].map((p) => [p, pick(tokExt, `boot2_p${p}`, T)])
    expect(sweep.reduce((a, b) => (b[1] > a[1] ? b : a))[0]).toBe(19)
    expect(relMean(relExt, 'boot2_p19', true).toFixed(1)).toBe(OPENFHE_ITERATIVE.best.releaseScaled)
    expect(relMean(relExt, 'boot2_p19', true).toFixed(2)).toBe('30.53')
    expect(relMean(relExt, 'boot2_p19', false).toFixed(1)).toBe(OPENFHE_ITERATIVE.best.releaseFace)
    expect(relMean(relExt, 'boot2_p19', false).toFixed(2)).toBe('27.02')
    expect(relMean(relExt, 'boot2_p20', false).toFixed(1)).toBe(OPENFHE_ITERATIVE.best.releaseFace)
    expect(pick(tokExt, 'boot2_p22', T).toFixed(1)).toBe(OPENFHE_ITERATIVE.falls.at22)
    expect(pick(tokExt, 'boot2_p24', T).toFixed(1)).toBe(OPENFHE_ITERATIVE.falls.at24)
    // above 20 the result falls
    expect(pick(tokExt, 'boot2_p22', T)).toBeLessThan(t20)
    expect(pick(tokExt, 'boot2_p24', T)).toBeLessThan(pick(tokExt, 'boot2_p22', T))
  })

  it('below precision 19 the result is about 13.2 plus the precision (within 0.7 bit)', () => {
    for (const p of [2, 4, 6, 8, 10, 12, 14]) {
      const bits = pick(tok, `boot2_p${p}`, T)
      expect(Math.abs(bits - (13.2 + p)), `precision ${p}`).toBeLessThan(0.7)
    }
  })

  it('the token’s keys agree with OpenFHE’s own within 0.4 bit at every two-round setting', () => {
    const gaps: number[] = []
    for (const [a, b, ps] of [
      [own, tok, [2, 4, 6, 8, 10, 11, 12, 13, 14, 15]],
      [ownExt, tokExt, [16, 17, 18, 19, 20, 22, 24]],
    ] as const)
      for (const p of ps) gaps.push(Math.abs(pick(a, `boot2_p${p}`, P) - pick(b, `boot2_p${p}`, T)))
    expect(gaps).toHaveLength(17)
    expect(Math.max(...gaps).toFixed(1)).toBe(OPENFHE_ITERATIVE.agreeWithinBits)
    expect(Math.max(...gaps)).toBeLessThan(0.4)
  })

  it('cost: about twice the time, one level fewer, memory unchanged', () => {
    const one = mean([secs(own, 'boot1'), secs(tok, 'boot1')])
    const twoStages = [2, 4, 6, 8, 10, 11, 12, 13, 14, 15].map((p) =>
      mean([secs(own, `boot2_p${p}`), secs(tok, `boot2_p${p}`)])
    )
    const two = mean(twoStages)
    expect(one.toFixed(1)).toBe(OPENFHE_ITERATIVE.secondsOneRound)
    expect(two.toFixed(0)).toBe(OPENFHE_ITERATIVE.secondsTwoRounds)
    expect(two / one).toBeGreaterThan(1.7)
    expect(two / one).toBeLessThan(2.1)
    for (const r of [...own, ...tok]) {
      const lv = (n: string) => r.stages.find((s) => s.name === n)!.usableLevels
      expect(lv('boot1')).toBe(OPENFHE_ITERATIVE.levelsLeft.oneRound)
      expect(lv('boot2_p8')).toBe(OPENFHE_ITERATIVE.levelsLeft.twoRounds)
    }
    for (const rs of [own, tok, ownExt, tokExt]) {
      expect(mean(rs.map((r) => r.peakRssGB)).toFixed(1)).toBe(OPENFHE_ITERATIVE.peakGiB)
      for (const r of rs) expect(r.peakRssGB).toBeGreaterThan(16.5)
      for (const r of rs) expect(r.peakRssGB).toBeLessThan(16.75)
    }
  })

  it('OpenFHE’s scale after a bootstrap differs from 2^52 by 6 to 7 parts in a billion', () => {
    const excess: number[] = []
    for (const r of [...own, ...tok, ...ownExt, ...tokExt])
      for (const s of r.stages.filter((x) => x.name.startsWith('boot')))
        excess.push((s.scalingFactor - 2 ** 52) / 2 ** 52)
    expect(Math.min(...excess)).toBeGreaterThan(5.5e-9)
    expect(Math.max(...excess)).toBeLessThan(7e-9)
    // the as-released figure is capped near 27 bits by it; with the scale applied it follows OpenFHE
    expect(-Math.log2(2 ** -27.1)).toBeCloseTo(27.1)
  })

  it('keeping 8 levels needs a depth OpenFHE refuses at N = 2^16, and it asks for N = 2^17', () => {
    const d = text('depth-check.txt')
    expect(d).toContain('multiplicative depth 25 (26 towers in Q): accepted, ring dimension 65536')
    expect(d).toContain(
      `multiplicative depth ${OPENFHE_ITERATIVE.refusedDepth} (27 towers in Q): refused`
    )
    expect(d).toContain('(131072)')
  })

  it('the export was checked against the reference and the key set is the one the board records name', () => {
    expect(text('verify.txt')).toContain(
      '32 public-key limbs, 12483 evaluation-key limbs compared, 0 mismatches'
    )
    expect(JSON.parse(text('export.json'))).toMatchObject({ paramSet: 4, keys: 79 })
    const prov = Object.fromEntries(
      text('provenance.txt')
        .split('\n')
        .filter((l) => l.includes(': '))
        .map((l) => [l.slice(0, l.indexOf(': ')), l.slice(l.indexOf(': ') + 2)])
    )
    expect(prov.registry_id).toContain('CKKS_N16QP1720H192H32_OPENFHE_V1_6_0_MATCH128')
    expect(prov.openfhe).toContain('v1.6.0, 6206d24f9eefefc620b524a4f2b9f308feb91e9f')
    expect(prov.fhe_commit).toContain('9dde7f84f974ed29bee30e82242cea93def54225')
    expect(prov.hsm_engine_commit).toContain('ebbc3d20ab209bfba125243f2b9a029b71a8cf9d')
    expect(prov.custodian_source).toContain('9dea1716044217cc2e0c5809f347639f4e825564')
    expect(prov.host_class).toContain('Apple M5 Max')
    expect(prov.reps_per_mode).toBe('4; ITER_PRECISIONS=2,4,6,8,10,11,12,13,14,15; ITER_PRIMARY=8')
  })

  it('the record is a reference-level, no-badge record of the merged run, and lists every file', () => {
    const rec = EVIDENCE_MANIFEST.records.find((r) => r.id === RECORD)!
    expect(rec).toBeTruthy()
    expect(rec.level).toBe('reference')
    expect(rec.producer).toBe('pqctoday-fhe')
    expect(rec.claimScope).toBe('reference-library')
    expect(rec.platformLabel).toBe('Apple M5 Max')
    expect(rec.badge).toBe(false)
    expect(rec.parts).toBeUndefined()
    expect(rec.library).toMatchObject({
      name: 'OpenFHE',
      version: 'v1.6.0',
      commit: '6206d24f9eefefc620b524a4f2b9f308feb91e9f',
    })
    expect(rec.engine?.commit).toBe('cc9d7bc46e71459fd4363b1197a0b2fcc507ab97')
    for (const ref of [
      'cc9d7bc46e71459fd4363b1197a0b2fcc507ab97',
      'b3da9c6f84f5e873ca2d16d6c35982e5bd5ad81d',
      '9dea1716044217cc2e0c5809f347639f4e825564',
      'pqctoday-fhe #31',
      'pqctoday-hsm #360',
      '32.09 and 32.13',
      'not a rule from OpenFHE’s documentation',
    ])
      expect(rec.notes, ref).toContain(ref)
    // every committed file is listed, and the run log carries a .txt name
    expect(rec.artifacts.map((a) => a.name).sort()).toEqual(files())
    expect(files()).toContain('run.log.txt')
    expect(files()).not.toContain('run.log')
    expect(rec.artifacts[0].name).toBe('summary.md')
    for (const a of rec.artifacts)
      expect(a.url).toBe(`https://www.pqctoday.com/data/fhe-evidence/${FOLDER}/${a.name}`)
  })

  it('the record’s key numbers equal the run files', () => {
    const rec = EVIDENCE_MANIFEST.records.find((r) => r.id === RECORD)!
    const kn = Object.fromEntries(rec.summary!.keyNumbers.map((k) => [k.label, k.value]))
    const f2 = (x: number) => x.toFixed(2)
    expect(kn['One refresh (control), token’s keys, worst slot']).toBe(f2(pick(tok, 'boot1', T)))
    expect(kn['Two rounds, documented setting (precision 8), token’s keys']).toBe(
      f2(pick(tok, 'boot2_p8', T))
    )
    expect(kn['Two rounds, precision 19, token’s keys']).toBe(f2(pick(tokExt, 'boot2_p19', T)))
    expect(kn['Two rounds, precision 20, token’s keys']).toBe(f2(pick(tokExt, 'boot2_p20', T)))
    expect(kn['Same, OpenFHE’s own keys (precision 19 / 20)']).toBe(
      `${f2(pick(ownExt, 'boot2_p19', P))} / ${f2(pick(ownExt, 'boot2_p20', P))}`
    )
    expect(kn['Through the token’s owner release, true scale applied (precision 19)']).toBe(
      f2(relMean(relExt, 'boot2_p19', true))
    )
    expect(kn['Through the token’s owner release, read at face value (precision 19)']).toBe(
      f2(relMean(relExt, 'boot2_p19', false))
    )
    expect(kn['Precision 22 / 24, token’s keys']).toBe(
      `${f2(pick(tokExt, 'boot2_p22', T))} / ${f2(pick(tokExt, 'boot2_p24', T))}`
    )
    expect(kn['Keys used, unchanged']).toBe('79')
    expect(rec.summary!.headline).toContain('13.2 bits')
    expect(rec.summary!.headline).toContain('21.1 bits')
    expect(rec.summary!.headline).toContain('31.8 bits')
  })

  it('the earlier OpenFHE records stay as records of the single refresh and point to this one', () => {
    for (const id of [
      'openfhe-ckks-reference-m5max-039034f',
      'ckks-openfhe-set-token-mx95-461f44ae',
      'ckks-openfhe-set-token-mx95pro-461f44ae',
    ]) {
      const rec = EVIDENCE_MANIFEST.records.find((r) => r.id === id)!
      expect(rec.notes, id).toContain(RECORD)
    }
    const ref = EVIDENCE_MANIFEST.records.find(
      (r) => r.id === 'openfhe-ckks-reference-m5max-039034f'
    )!
    // its single-refresh measurement is kept; its headline no longer says the HSM's set was not run
    expect(ref.summary!.headline).toContain('one bootstrap at 13.3 bits')
    expect(ref.summary!.headline).toContain(RECORD)
    for (const r of EVIDENCE_MANIFEST.records)
      expect(JSON.stringify(r), r.id).not.toMatch(/has not been run in OpenFHE/)
  })

  it('no file of the run holds an address, a host or user name, or a home path', () => {
    for (const f of files()) {
      const body = text(f)
      expect(body, f).not.toMatch(/(\d{1,3}\.){3}\d{1,3}/)
      expect(body, f).not.toMatch(/\/Users\/|\/home\/|ericamador|eram2207/i)
      expect(body, f).not.toMatch(/@[a-z0-9-]+\.[a-z]+/i)
    }
  })
})

describe('every evidence file the manifest lists is committed and pinned by its sha256', () => {
  const rel = (url: string) => url.replace('https://www.pqctoday.com/data/fhe-evidence/', '')
  const inGit = (() => {
    try {
      execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: ROOT, stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  })()

  it('each file exists and matches its sha256, for every record', () => {
    for (const rec of EVIDENCE_MANIFEST.records)
      for (const a of rec.artifacts) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- paths come from the committed manifest
        const bytes = fs.readFileSync(path.join(ROOT, rel(a.url)))
        expect(crypto.createHash('sha256').update(bytes).digest('hex'), `${rec.id} ${a.name}`).toBe(
          a.sha256
        )
      }
  })

  // .gitignore has *.log: a listed file under that pattern is silently left out of the commit
  // and its URL would 404 after the deploy. Such files are published under a .txt name.
  it.skipIf(!inGit)('each file is tracked by git, so a listed URL cannot 404', () => {
    const listed = EVIDENCE_MANIFEST.records.flatMap((r) =>
      r.artifacts.map((a) => path.join(ROOT, rel(a.url)))
    )
    const top = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim()
    const trackedAbs = new Set(
      execFileSync('git', ['ls-files', '-z', '--full-name', '.'], { cwd: ROOT, encoding: 'utf8' })
        .split('\0')
        .filter(Boolean)
        .map((f) => path.join(top, f))
    )
    expect(trackedAbs.size).toBeGreaterThan(0)
    const missing = listed.filter((f) => !trackedAbs.has(f))
    expect(missing).toEqual([])
  })
})
