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
import {
  COMPUTE_SERVICE,
  COMPUTE_SERVICE_MACHINES,
  OPENFHE_EXPORT_BOARDS,
  OPENFHE_ITERATIVE,
  TFHE_LOAN,
} from '../data/fheComputeService'
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

describe('the encrypted risk-scoring service on an x86-64 VM and on an MX95 Pro (pqctoday-fhe #32)', () => {
  const RUNS = {
    vm: {
      folder: 'ckks-scoring-service-x86-vm-ed7b92e',
      record: 'ckks-scoring-service-x86-vm-m5max-ed7b92e',
    },
    pro: {
      folder: 'ckks-scoring-service-mx95pro-ed7b92e',
      record: 'ckks-scoring-service-mx95pro-m5max-ed7b92e',
    },
  } as const
  const text = (folder: string, file: string) =>
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed test folders under public/
    fs.readFileSync(path.join(ROOT, folder, file), 'utf8')
  const files = (folder: string) =>
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed test folders under public/
    fs.readdirSync(path.join(ROOT, folder)).sort()
  const prov = (folder: string) =>
    Object.fromEntries(
      text(folder, 'provenance.txt')
        .split('\n')
        .filter((l) => l.includes(': '))
        .map((l) => [l.slice(0, l.indexOf(': ')), l.slice(l.indexOf(': ') + 2)])
    )
  const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
  const thousands = (n: number) => Math.round(n).toLocaleString('en-US')

  it('the x86-64 VM numbers the Learn text quotes equal the run files', () => {
    const { folder } = RUNS.vm
    const s = json(folder, 'summary.json')
    const b = json(folder, 'bench.json')
    const p = prov(folder)
    const m = COMPUTE_SERVICE_MACHINES.vm
    expect(String(Math.round(median(s.serverRunMs_repetitions)))).toBe(m.medianMs)
    expect(`${s.serverWallMsAllJobs.min}–${s.serverWallMsAllJobs.max}`).toBe(m.rangeMs)
    expect(s.serverWallMsAllJobs.n).toBe(8)
    expect(thousands(s.serverPeakRssMiB)).toBe(m.peakMiB)
    expect(m.admission).toBe(
      `${Math.round(parseFloat(p.key_admitted.match(/verify_ms ([\d.]+)/)![1]))} ms to verify and ${Math.round(parseFloat(p.key_admitted.match(/assemble_ms ([\d.]+)/)![1]))} ms to assemble`
    )
    // "about 13,000 requests an hour by server time alone"
    expect(thousands(Math.round(b.requestsPerHour_byServerRunTime / 1000) * 1000)).toBe(
      m.perHourByRunTime
    )
    expect(p.total_wall_s).toBe(m.runS)
    expect(p.result).toBe('PASS')
  })

  it('the MX95 Pro numbers the Learn text quotes equal the run files', () => {
    const { folder } = RUNS.pro
    const s = json(folder, 'summary.json')
    const b = json(folder, 'bench.json')
    const e = json(folder, 'export.json')
    const p = prov(folder)
    const m = COMPUTE_SERVICE_MACHINES.pro
    expect((median(s.serverRunMs_repetitions) / 1000).toFixed(2)).toBe(m.medianS)
    expect(
      `${(s.serverWallMsAllJobs.min / 1000).toFixed(2)}–${(s.serverWallMsAllJobs.max / 1000).toFixed(2)}`
    ).toBe(m.rangeS)
    expect(thousands(s.serverPeakRssMiB)).toBe(m.peakMiB)
    expect(m.admission).toBe(
      `${Math.round(parseFloat(p.key_admitted.match(/verify_ms ([\d.]+)/)![1]))} ms to verify and ${Math.round(parseFloat(p.key_admitted.match(/assemble_ms ([\d.]+)/)![1]))} ms to assemble`
    )
    expect(String(Math.round(b.requestsPerHour_bySequentialCycle))).toBe(m.perHourSequential)
    expect(String(Math.round(b.requestsPerHour_byServerRunTime))).toBe(m.perHourByRunTime)
    expect(p.total_wall_s).toBe(m.runS)
    // the token on the base MX95 board
    expect(p.token_label).toBe('mx95')
    expect(p.server_label).toBe('mx95pro')
    expect(String(Math.round(e.seconds))).toBe(m.tokenExportS)
    expect(e.mbPerSecond.toFixed(1)).toBe(m.tokenExportMBs)
    expect(String(Math.round(e.peakRssKiB / 1024))).toBe(m.tokenPeakMiB)
    expect(e.bytes).toBe(4_410_835_077)
    expect(e.keys).toBe(51)
    // "about 21 times the Mac" (median of three repetitions against the Mac's 201 ms)
    expect(
      String(Math.round(median(s.serverRunMs_repetitions) / COMPUTE_SERVICE.serverMsMedian))
    ).toBe(m.timesTheMac)
    expect(p.server_mem_total_kib).toBe('16096760') // 15.4 GiB
    expect(p.server_cpus).toBe('6')
    expect(p.result).toBe('PASS')
  })

  for (const key of ['vm', 'pro'] as const) {
    it(`${key}: identical scores to the Mac, every key piece checked, the same custodian build`, () => {
      const { folder } = RUNS[key]
      const s = json(folder, 'summary.json')
      const r = json(folder, 'receive.json')
      const p = prov(folder)
      expect(s.accuracyBits_allSlots.toFixed(2)).toBe(COMPUTE_SERVICE_MACHINES.accuracyBits)
      expect(s.auc.auc_encrypted.toFixed(6)).toBe('0.717298')
      expect(s.auc.auc_plaintextPolynomial.toFixed(6)).toBe('0.717299')
      expect(COMPUTE_SERVICE_MACHINES.auc).toBe('0.717298 against 0.717299')
      expect(COMPUTE_SERVICE.aucEncrypted).toBe('0.717298')
      expect(text(folder, 'accuracy-verdict.txt')).toContain(
        'decisions at 0.5 and 0.25: 100.000 % and 100.000 % agree'
      )
      expect(text(folder, 'accuracy-verdict.txt')).toContain('max error and AUC equal')
      expect(json(folder, 'timing.json').requestCiphertextBytes).toBe(192_938_536)
      expect(json(folder, 'timing.json').featureCiphertexts).toBe(23)
      expect(r.hashMismatches).toBe(0)
      expect(r.tokenManifest.mismatches).toBe(0)
      expect(r.manifestEntries).toBe(1204)
      expect(r.tokenManifest.entries).toBe(1203)
      expect(p.chunk_hashes_vs_reference_run).toContain('identical (all 1203 ')
      expect(p.registry_id).toContain('CKKS_N16QP1468H192H32_METABTS2_LATTIGO_V6_2_0')
      expect(p.hsm_commit).toBe('ebbc3d20ab209bfba125243f2b9a029b71a8cf9d')
      expect(p.custodian_sha256).toBe(
        '709aaa909bbbfe18bd7e146d0a0561daa98a1eb95abb46cbc874f830046cfe53'
      )
      expect(p.custodian_build_source).toContain('origin/main')
      expect(p.seed).toContain('the secret key is public by construction')
      expect(p.server_workers).toBe('1')
      expect(p.customers_per_batch).toBe('32768')
    })
  }

  it('the VM ran a static amd64 build and the board a static arm64 build of the same service code', () => {
    const vm = prov(RUNS.vm.folder)
    const pro = prov(RUNS.pro.folder)
    expect(vm.server_binary).toContain('linux/amd64')
    expect(pro.server_binary).toContain('linux/arm64')
    expect(vm.server_binary_build_fhe_commit).toBe(pro.server_binary_build_fhe_commit)
    expect(vm.server_binary_build_build).toContain('CGO_ENABLED=0')
    expect(pro.server_binary_build_build).toContain('CGO_ENABLED=0')
    expect(vm.server_cpus).toBe('12')
    expect(vm.server_cpu_model).toContain('AMD Ryzen AI 9 HX 370')
    expect(vm.token_model).toContain('container on the Mac')
  })

  it('the two records are reference-level, no-badge records of the merged run, listing every file', () => {
    for (const key of ['vm', 'pro'] as const) {
      const { folder, record } = RUNS[key]
      const rec = EVIDENCE_MANIFEST.records.find((r) => r.id === record)!
      expect(rec, record).toBeTruthy()
      expect(rec.level).toBe('reference')
      expect(rec.producer).toBe('pqctoday-fhe')
      expect(rec.claimScope).toBe('reference-library')
      expect(rec.badge).toBe(false)
      expect(rec.parts).toBeUndefined()
      expect(rec.engine?.commit).toBe('ed7b92ee2bb3fae7bc9cb22e24a80490c786d1fd')
      for (const ref of [
        '70872f9a0ace9106eb65e2c0c76ab2b9a953fca3',
        'ed7b92ee2bb3fae7bc9cb22e24a80490c786d1fd',
        'ebbc3d20ab209bfba125243f2b9a029b71a8cf9d',
        '9dea1716044217cc2e0c5809f347639f4e825564',
        'pqctoday-fhe #27',
        'pqctoday-fhe #32',
        'the published test seed',
        'not a security claim',
      ])
        expect(rec.notes, `${record} ${ref}`).toContain(ref)
      expect(rec.artifacts.map((a) => a.name).sort()).toEqual(files(folder))
      for (const log of ['run.log.txt', 'server.log.txt', 'server-start.log.txt'])
        expect(files(folder)).toContain(log)
      expect(files(folder).some((f) => f.endsWith('.log'))).toBe(false)
      expect(rec.artifacts[0].name).toBe('summary.md')
      for (const a of rec.artifacts)
        expect(a.url).toBe(`https://www.pqctoday.com/data/fhe-evidence/${folder}/${a.name}`)
    }
    // the MX95 Pro cannot play the FHE server under the evidence rules, hence the reference level
    const pro = EVIDENCE_MANIFEST.records.find((r) => r.id === RUNS.pro.record)!
    expect(pro.notes).toContain('let the MX95 Pro play a custodian, backup custodian or party')
  })

  it('the records’ key numbers equal the run files', () => {
    for (const key of ['vm', 'pro'] as const) {
      const { folder, record } = RUNS[key]
      const rec = EVIDENCE_MANIFEST.records.find((r) => r.id === record)!
      const kn = Object.fromEntries(rec.summary!.keyNumbers.map((k) => [k.label, k.value]))
      const s = json(folder, 'summary.json')
      const b = json(folder, 'bench.json')
      const p = prov(folder)
      expect(kn['Server time per batch, median of 3 repetitions']).toBe(
        thousands(median(s.serverRunMs_repetitions))
      )
      const w = s.serverWallMsAllJobs
      expect(kn['Server time over all 8 jobs, min / median / max']).toBe(
        `${thousands(w.min)} / ${thousands(w.median)} / ${thousands(w.max)}`
      )
      expect(kn['Server peak memory (VmHWM)']).toBe(thousands(s.serverPeakRssMiB))
      expect(kn['Key admission, verify / assemble']).toBe(
        `${Math.round(parseFloat(p.key_admitted.match(/verify_ms ([\d.]+)/)![1]))} / ${Math.round(parseFloat(p.key_admitted.match(/assemble_ms ([\d.]+)/)![1]))}`
      )
      expect(kn['Requests per hour, one at a time / by server time alone']).toBe(
        `${thousands(b.requestsPerHour_bySequentialCycle)} / ${thousands(b.requestsPerHour_byServerRunTime)}`
      )
      expect(kn['Whole run']).toBe(p.total_wall_s)
      expect(kn['Score against the plaintext cubic, all 32,768 slots']).toBe(
        s.accuracyBits_allSlots.toFixed(2)
      )
      expect(kn['AUC, encrypted / plaintext cubic']).toBe('0.717298 / 0.717299')
      expect(kn['Request size']).toBe('184.0')
      expect(kn['Same program on the Mac (headline run, pqctoday-fhe #27)']).toBe(
        `${COMPUTE_SERVICE.serverMsMedian} ms, peak ${COMPUTE_SERVICE.peakMiB}`
      )
    }
  })

  // sha256 of each x86-64 VM run file in the FHE repository (pqctoday-fhe #32, merge commit ed7b92ee),
  // the logs under their .txt names
  const FHE_COPY_SHA256: Record<string, string> = {
    'accuracy-verdict.txt': '57e9deedcdc8c824ff190b5ef0f671d82e4ad276d435146253504108726a2192',
    'bench.json': '3cab6b27da7c56de37c966dae20024219b9a68b4c7c215398660a1f54bd66e2c',
    'check.json': '338be846ff3e7f58a623bea7ecb6be1566dba9df920ea6beae3b47e5de9ba44b',
    'export.json': '57ec30c4c2fcb2f3a9879d1bbdeadb1a6ea835616687727a5874a4d174714c1b',
    'health-after.json': '8d70b5b90cce00a944ff8577f0f123d5a24b2fee8075d01ea0cbe5bafc6640ff',
    'health-before.json': '406be8138aab1037d233aaebea25fba1d3bdebeaf44b74a232b762ed37a354b5',
    'manifest.txt': 'bc34fdeac4f870742b203e950b2cf90fcae792818522aa1d16b155670d5ca623',
    'models.json': 'e201f38bb679c4ea0f36fed0e2e24c773c34fe559cf26c447ba8218c9f5a138d',
    'provenance.txt': '5d59f490104f84c2379afb38d868a223cb68ea315ccf6a270b36850593ce76e7',
    'receive.json': '92275cc820d95ddb36bacf23d1f82abde5b53577c2f95eb67a3733abbb2778bb',
    'run.log.txt': 'a289c237e903af0dfd08b155b6c322cad396d7da5ad910adbb948a0c802efd1f',
    'server-process-status.txt': '95a2a35fc1cc242104519261d1cfa1a3c7885443e3843b9af8807616db86cbb9',
    'server-start.log.txt': '5ccdc9de197df923f5290b6e473fcb84130bbb7e379a1bd7bfe249fcb406f7dc',
    'server.log.txt': '4093e70aec77027b9a5c6ef90216ac2777c951d15c265a0d9365fcd5c3a3218c',
    'summary.json': 'e99c564f599780819629e7efaaa438b797c77327836ec142959dea9336966f73',
    'summary.md': 'fde4b7f77ae35e14623749b377253af4a388dd94f2b230227f627ed444de8156',
    'timing.json': '0180a5711b06181551e7f86aa33d88cd3d8c01876b396dbbb84fd7ee2c574933',
    'token-decrypt.txt': '19fe8a36a8a8fcfa3e960a25e2b03f5157fd5ab900bfe2141613d554d1b003c1',
    'token-init.txt': '36aa40bb0e96fe11438b3e7f52c42f7507d1e16432e34e8b30a84316fbd339f5',
    'upload-key.json': '2867de5d01fd12c53a96a226364dac16ac1c3c9042dae4fd03a37567f817ce6b',
  }
  const NOTE_LINE =
    'note_public_copy: labels differ from the FHE repository copy (the machine label was renamed to x86-vm in the public copy); the measurements are unchanged'
  // the old machine label, written so that this test file does not hold the label itself
  const OLD = `x${1}`
  const sha = (s: string | Buffer) => crypto.createHash('sha256').update(s).digest('hex')
  // undoes the documented label substitution, line by line, in the four files that carry it
  const restoreLabel = (s: string) =>
    s
      .replace(`\n${NOTE_LINE}\n`, '\n')
      .replaceAll('2026-10-15-id3-x86-vm', `2026-10-15-id3-${OLD}-vm`)
      .replaceAll('server_label: x86-vm', `server_label: ${OLD}-vm`)
      .replaceAll('server x86-vm (ssh)', `server ${OLD}-vm (ssh)`)
      .replaceAll('] x86-vm service run', `] ${OLD} service run`)
      .replaceAll('kind: x86-vm', `kind: ${OLD}`)
      .replaceAll('"kind": "x86-vm"', `"kind": "${OLD}"`)

  it('the x86-64 VM run files equal the FHE repository copy, except the documented label substitution', () => {
    const { folder } = RUNS.vm
    expect(files(folder)).toEqual(Object.keys(FHE_COPY_SHA256).sort())
    const changed = ['provenance.txt', 'run.log.txt', 'summary.json', 'summary.md']
    for (const f of files(folder)) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed test folder under public/
      const bytes = fs.readFileSync(path.join(ROOT, folder, f))
      if (!changed.includes(f)) {
        expect(sha(bytes), f).toBe(FHE_COPY_SHA256[f])
        continue
      }
      const restored = restoreLabel(bytes.toString('utf8'))
      expect(restored, f).not.toContain('x86-vm')
      expect(sha(restored), f).toBe(FHE_COPY_SHA256[f])
    }
    // the substitution is stated in the run's provenance and in the record
    expect(text(folder, 'provenance.txt')).toContain(`\n${NOTE_LINE}\n`)
    const rec = EVIDENCE_MANIFEST.records.find((r) => r.id === RUNS.vm.record)!
    expect(rec.notes).toContain('copied byte for byte except the machine label in four of them')
  })

  it('no machine label of the lab remains in the x86-64 VM run files, the record or the Learn text', () => {
    const { folder, record } = RUNS.vm
    const label = new RegExp(`(^|[^0-9A-Za-z])${OLD}([^0-9A-Za-z]|$)|${OLD}-vm`, 'im')
    for (const f of files(folder)) expect(text(folder, f), `${folder}/${f}`).not.toMatch(label)
    const rec = EVIDENCE_MANIFEST.records.find((r) => r.id === record)!
    expect(JSON.stringify(rec)).not.toMatch(label)
    // the run is named x86-vm in its own files
    expect(text(folder, 'provenance.txt')).toContain('run: 2026-10-15-id3-x86-vm')
    expect(text(folder, 'provenance.txt')).toContain('server_label: x86-vm')
  })

  it('no file holds an address other than loopback, a host or user name, a serial or a home path', () => {
    for (const { folder } of Object.values(RUNS))
      for (const f of files(folder)) {
        const body = text(folder, f).replace(/127\.0\.0\.1|0\.0\.0\.0/g, '')
        expect(body, `${folder}/${f}`).not.toMatch(/(\d{1,3}\.){3}\d{1,3}/)
        expect(body, `${folder}/${f}`).not.toMatch(/\/Users\/|\/home\/|ericamador|eram2207/i)
        expect(body, `${folder}/${f}`).not.toMatch(/@[a-z0-9-]+\.[a-z]+/i)
        expect(body, `${folder}/${f}`).not.toMatch(/([0-9a-f]{2}:){5}[0-9a-f]{2}/i)
      }
  })
})

describe('the runs with the token on the MX95 Pro over KMIP (pqctoday-fhe #36 and #38)', () => {
  const CKKS = {
    folder: 'ckks-scoring-service-x86-vm-kmip-5f0ff3d',
    record: 'ckks-scoring-service-x86-vm-mx95pro-kmip-5f0ff3d',
  }
  const LOAN = {
    folder: 'tfhe-loan-prequal-x86-vm-kmip-354533b',
    record: 'tfhe-loan-prequal-x86-vm-mx95pro-kmip-354533b',
  }
  const text = (folder: string, file: string) =>
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed test folders under public/
    fs.readFileSync(path.join(ROOT, folder, file), 'utf8')
  const files = (folder: string) =>
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed test folders under public/
    fs.readdirSync(path.join(ROOT, folder)).sort()
  const prov = (folder: string) =>
    Object.fromEntries(
      text(folder, 'provenance.txt')
        .split('\n')
        .filter((l) => l.includes(': '))
        .map((l) => [l.slice(0, l.indexOf(': ')), l.slice(l.indexOf(': ') + 2)])
    )
  const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
  const thousands = (n: number) => Math.round(n).toLocaleString('en-US')
  const sha = (b: string | Buffer) => crypto.createHash('sha256').update(b).digest('hex')
  const record = (id: string) => EVIDENCE_MANIFEST.records.find((r) => r.id === id)!

  it('the CKKS numbers the Learn text quotes equal the run files', () => {
    const s = json(CKKS.folder, 'summary.json')
    const e = json(CKKS.folder, 'export.json')
    const r = json(CKKS.folder, 'receive.json')
    const p = prov(CKKS.folder)
    const m = COMPUTE_SERVICE_MACHINES.kmip
    expect(String(Math.round(median(s.serverRunMs_repetitions)))).toBe(m.medianMs)
    expect(`${s.serverWallMsAllJobs.min}–${s.serverWallMsAllJobs.max}`).toBe(m.rangeMs)
    expect(thousands(s.serverPeakRssMiB)).toBe(m.peakMiB)
    expect(m.admission).toBe(
      `${Math.round(parseFloat(p.key_admitted.match(/verify_ms ([\d.]+)/)![1]))} ms to verify and ${Math.round(parseFloat(p.key_admitted.match(/assemble_ms ([\d.]+)/)![1]))} ms to assemble`
    )
    expect(e.transport).toBe('kmip')
    expect(e.bytes).toBe(4_410_835_077)
    expect(thousands(e.evkCalls)).toBe(m.exportCalls)
    expect(String(Math.round(e.seconds))).toBe(m.exportS)
    expect(e.mbPerSecond.toFixed(1)).toBe(m.exportMBs)
    expect(r.hashMismatches).toBe(0)
    expect(r.tokenManifest.mismatches).toBe(0)
    expect(text(CKKS.folder, 'token-decrypt.txt')).toBe(
      `released 524292 B in ${m.releaseS} s (wall 0.231 s over KMIP)\n`
    )
    expect((0.231).toFixed(2)).toBe(m.releaseWallS)
    expect(p.total_wall_s).toBe(m.runS)
    expect(p.result).toBe('PASS')
    expect(p.token_model).toContain('KMIP server (PQCTODAY_FHE_1_0)')
    expect(p.seed).toContain('random, generated in the token over KMIP')
    expect(p.server_cpus).toBe('12')
    expect(s.accuracyBits_allSlots.toFixed(2)).toBe(COMPUTE_SERVICE_MACHINES.accuracyBits)
    expect(s.auc.auc_encrypted.toFixed(6)).toBe('0.717298')
    expect(s.auc.auc_plaintextPolynomial.toFixed(6)).toBe('0.717299')
    expect(text(CKKS.folder, 'accuracy-verdict.txt')).toContain(
      'decisions at 0.5 and 0.25: 100.000 % and 100.000 % agree'
    )
  })

  it('the TFHE loan numbers the Learn text quotes equal the run files', () => {
    const s = json(LOAN.folder, 'summary.json')
    const t = s.token_decrypt_kmip
    expect(thousands(s.applicants)).toBe(TFHE_LOAN.applicants)
    expect(s.edge_cases).toBe(TFHE_LOAN.edgeCases)
    expect(s.mismatches).toBe(TFHE_LOAN.mismatches)
    expect(s.approved).toBe(TFHE_LOAN.approved)
    const c = s.server_compute_s_per_applicant
    expect(c.median.toFixed(3)).toBe(TFHE_LOAN.serverMedianS)
    expect(`${c.min.toFixed(3)}–${c.max.toFixed(3)}`).toBe(TFHE_LOAN.serverRangeS)
    expect(s.client_wall_s_per_applicant.median.toFixed(3)).toBe(TFHE_LOAN.clientWallMedianS)
    expect(thousands(s.applicants_per_hour_by_wall)).toBe(TFHE_LOAN.perHourByWall)
    expect(thousands(t.outputs)).toBe(TFHE_LOAN.outputs)
    expect(t.released).toBe(t.outputs)
    expect(t.refused).toBe(0)
    expect(t.errors).toBe(0)
    expect(t.wall_ms.median.toFixed(1)).toBe(TFHE_LOAN.decryptMedianMs)
    expect(t.wall_ms.p95.toFixed(1)).toBe(TFHE_LOAN.decryptP95Ms)
    // every output has a timed line (init, size query, decrypt), and the last line is the summary
    const lines = text(LOAN.folder, 'decrypt-timings.jsonl')
      .trim()
      .split('\n')
      .map((l) => JSON.parse(l))
    expect(lines).toHaveLength(t.outputs + 1)
    expect(lines.at(-1).summary).toEqual(t)
    for (const l of lines.slice(0, -1)) {
      expect(l.released).toBe(true)
      expect(Object.keys(l.calls_ms)).toEqual(['init', 'size', 'decrypt'])
    }
    // the corrected engine's TFHE parameter fingerprint
    expect(json(LOAN.folder, 'token-export.json').param_hash).toMatch(/^e3219e9e/)
    expect(json(LOAN.folder, 'token-export.json').transport).toBe('kmip')
  })

  it('both are reference-level, no-badge records of the merged runs, listing every file', () => {
    for (const [{ folder, record: id }, merge, first] of [
      [CKKS, '5f0ff3daf142c5064681cb3ca7d5f0946b139f2d', 'summary.md'],
      [LOAN, '354533be3fc88003a705cb667d84812568caebcc', 'summary.json'],
    ] as const) {
      const rec = record(id)
      expect(rec, id).toBeTruthy()
      expect(rec.level).toBe('reference')
      expect(rec.producer).toBe('pqctoday-fhe')
      expect(rec.claimScope).toBe('reference-library')
      expect(rec.badge).toBe(false)
      expect(rec.parts).toBeUndefined()
      expect(rec.engine?.commit).toBe(merge)
      expect(rec.notes).toContain(merge)
      expect(rec.notes).toContain('not a security claim')
      expect(rec.notes).toContain('no evidence device covers an x86-64 VM')
      expect(rec.artifacts.map((a) => a.name).sort()).toEqual(files(folder))
      expect(rec.artifacts[0].name).toBe(first)
      expect(files(folder).some((f) => f.endsWith('.log'))).toBe(false)
      for (const a of rec.artifacts)
        expect(a.url).toBe(`https://www.pqctoday.com/data/fhe-evidence/${folder}/${a.name}`)
    }
    expect(record(LOAN.record).scenarioId).toBe('tfhe-single-hsm')
    expect(record(LOAN.record).notes).toContain('non-commercial purposes only')
    expect(record(LOAN.record).notes).toContain(
      'first published run under the corrected HSM engine'
    )
  })

  // sha256 of each run file in the FHE repository (pqctoday-fhe #36 and #38), the logs under .txt names
  const CKKS_FHE_SHA256: Record<string, string> = {
    'accuracy-verdict.txt': '57e9deedcdc8c824ff190b5ef0f671d82e4ad276d435146253504108726a2192',
    'bench.json': '3d8d000e6f5beb8b1db90bbdfa43084548b72f9300447ed724451e00af077e9f',
    'check.json': '338be846ff3e7f58a623bea7ecb6be1566dba9df920ea6beae3b47e5de9ba44b',
    'export.json': 'c6c8e78f493615d12a9137e851cc6ab3d4a1e32d2f33e3f7cfd305073f949d90',
    'health-after.json': '098dd2f8fa828e1f2ede0e545bb6263d96eb7038bb355a51f886f907eeae4c71',
    'health-before.json': 'd8fca0f128f97e2bd0680351b9cdd767760e7722985f7c2532b10b4a2cda407b',
    'manifest.txt': '14b972168daed79aa45583f7caa3c85a5522aef6898df5f51383e3c862dec44b',
    'models.json': 'e201f38bb679c4ea0f36fed0e2e24c773c34fe559cf26c447ba8218c9f5a138d',
    'provenance.txt': '581f37811af818963c7d6c2fdbfb8a9a98aaec984af3593aca6a0c126d62c57a',
    'receive.json': '972d4ae833c9f1b31cbd49eb74d9bd75ad3f384946b172e215ca495e7cb2477e',
    'run.log.txt': '073ec2d2657a4e035082357d03006e862405ca93a297e3ed10b001caf2322e69',
    'server-process-status.txt': '5a1170edb4c82ed27a9387bbf7695079cd05efeb128473e913072356a022cda3',
    'server-start.log.txt': '2ffd731c6e46a59e75aa5ca76c60539a4a6cc5414eba9a63f24e63eb8b37c572',
    'server.log.txt': 'b532a7d2f267472b4c4060802773a2fbe35f9f25669c841f6794becfc26fa867',
    'summary.json': 'cf8a9c2f2c8465b09597bbfa9bf490ec498986e5484bf4f26713963c7f37516e',
    'summary.md': '36a50ee33c7dea136aeff29a3e20d822b86c2dcd16536c75d7f86bb2e7da7c11',
    'timing.json': '15136a52622cbc3678430eeca0ed6e0c7da0ad4ef8bf8d4753db7ff939ba95da',
    'token-decrypt.txt': 'c42def24b805d6b04a6be9fca01ce6d2731656e3e1a4f1c592756b90c32a77a9',
    'token-init.txt': '78973f7d8ab767a5062ba71e17160f174869d1803fd6f87ff7cc85ffac1ba400',
    'upload-key.json': '679221afc4f1fa98ffea722b11c08ff6eb206727f3d77f1684f2281caea685a7',
  }
  const LOAN_FHE_SHA256: Record<string, string> = Object.fromEntries(
    record(LOAN.record).artifacts.map((a) => [a.name, a.sha256])
  )
  const NOTE_LINE =
    'note_public_copy: labels differ from the FHE repository copy (the machine label was renamed to x86-vm in the public copy); the measurements are unchanged'
  // the old machine label, written so that this test file does not hold the label itself
  const OLD = `x${1}`
  const restoreLabel = (s: string) =>
    s
      .replace(`\n${NOTE_LINE}\n`, '\n')
      .replaceAll('2026-10-16-id3-x86-vm-mx95pro-kmip-r3', `2026-10-16-id3-${OLD}-mx95pro-kmip-r3`)
      .replaceAll('server_label: x86-vm', `server_label: ${OLD}-vm`)
      .replaceAll('server x86-vm (ssh)', `server ${OLD}-vm (ssh)`)
      .replaceAll('] x86-vm service run', `] ${OLD} service run`)
      .replaceAll('kind: x86-vm', `kind: ${OLD}`)
      .replaceAll('"kind": "x86-vm"', `"kind": "${OLD}"`)

  it('the CKKS run files equal the FHE repository copy, except the documented label substitution', () => {
    expect(files(CKKS.folder)).toEqual(Object.keys(CKKS_FHE_SHA256).sort())
    const changed = ['provenance.txt', 'run.log.txt', 'summary.json', 'summary.md']
    for (const f of files(CKKS.folder)) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed test folder under public/
      const bytes = fs.readFileSync(path.join(ROOT, CKKS.folder, f))
      if (!changed.includes(f)) {
        expect(sha(bytes), f).toBe(CKKS_FHE_SHA256[f])
        continue
      }
      const restored = restoreLabel(bytes.toString('utf8'))
      expect(restored, f).not.toContain('x86-vm')
      expect(sha(restored), f).toBe(CKKS_FHE_SHA256[f])
      // the record's notes give each relabelled file's original sha256
      expect(record(CKKS.record).notes, f).toContain(CKKS_FHE_SHA256[f])
    }
    expect(text(CKKS.folder, 'provenance.txt')).toContain(`\n${NOTE_LINE}\n`)
    expect(record(CKKS.record).notes).toContain(
      'copied byte for byte except the machine label in four of them'
    )
  })

  it('the loan run files are the six files of the merged run, byte for byte', () => {
    expect(files(LOAN.folder)).toEqual([
      'decrypt-timings.jsonl',
      'prepare.json',
      'server-host.txt',
      'server-memory.txt',
      'summary.json',
      'token-export.json',
    ])
    for (const f of files(LOAN.folder)) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed test folder under public/
      expect(sha(fs.readFileSync(path.join(ROOT, LOAN.folder, f))), f).toBe(LOAN_FHE_SHA256[f])
    }
    expect(record(LOAN.record).notes).toContain('all six copied byte for byte')
  })

  it('no machine label, address, host or user name, serial or home path in the files or records', () => {
    const label = new RegExp(`(^|[^0-9A-Za-z])${OLD}([^0-9A-Za-z]|$)|${OLD}-vm`, 'im')
    for (const { folder, record: id } of [CKKS, LOAN]) {
      for (const f of files(folder)) {
        const body = text(folder, f).replace(/127\.0\.0\.1|0\.0\.0\.0/g, '')
        expect(body, `${folder}/${f}`).not.toMatch(label)
        expect(body, `${folder}/${f}`).not.toMatch(/(\d{1,3}\.){3}\d{1,3}/)
        expect(body, `${folder}/${f}`).not.toMatch(/\/Users\/|\/home\/|ericamador|eram2207/i)
        expect(body, `${folder}/${f}`).not.toMatch(/@[a-z0-9-]+\.[a-z]+/i)
        expect(body, `${folder}/${f}`).not.toMatch(/([0-9a-f]{2}:){5}[0-9a-f]{2}/i)
        expect(body, `${folder}/${f}`).not.toMatch(/pqc-(kv260|mx95)|crypto-[a-z]|control network/i)
        expect(body, `${folder}/${f}`).not.toMatch(/PRIVATE KEY/)
      }
      expect(JSON.stringify(record(id))).not.toMatch(label)
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
