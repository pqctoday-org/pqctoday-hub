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
import { EVIDENCE_MANIFEST } from '@/data/fhe/fheEvidence'
import { CKKS_EVIDENCE } from '../data/fheCkksEvidence'
import { FLOOD_ID2, FLOOD_ID3, GATE_F_BAR_BITS } from '../data/fheFloodSizing'
import { ROTATION_MEASURED, SHARED_MEASURED } from './fheRotationSharedData'

const ROOT = path.resolve(__dirname, '../../../../../../public/data/fhe-evidence')
const json = (folder: string, file: string) =>
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

describe('every record file is pinned by its sha256', () => {
  it('the files of the new and extended records match the manifest', () => {
    const ids = [
      CKKS_EVIDENCE.metaBtsLmss,
      CKKS_EVIDENCE.metaBtsLmssDepth1,
      CKKS_EVIDENCE.metaBtsLmssDepth3,
      CKKS_EVIDENCE.defaultLmssId2,
      CKKS_EVIDENCE.threshold,
      CKKS_EVIDENCE.rotation,
    ]
    for (const id of ids) {
      const rec = EVIDENCE_MANIFEST.records.find((r) => r.id === id)!
      expect(rec, id).toBeTruthy()
      for (const a of rec.artifacts) {
        // run.log files are ignored by git (*.log); the manifest still pins their hash
        if (a.name.endsWith('.log')) continue
        const rel = a.url.replace('https://www.pqctoday.com/data/fhe-evidence/', '')
        const bytes = fs.readFileSync(path.join(ROOT, rel))
        expect(crypto.createHash('sha256').update(bytes).digest('hex'), `${id} ${a.name}`).toBe(
          a.sha256
        )
      }
    }
  })
})
