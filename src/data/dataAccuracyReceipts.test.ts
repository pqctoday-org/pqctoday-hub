// SPDX-License-Identifier: AGPL-3.0-only
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import ledger from './accuracyReceiptsLedger.json'
import { ALGORITHM_REGISTRY } from './algorithmProperties'
import { getStandard, hasStandard } from './standardsRegistry'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'

const ROOT_DIR = path.resolve(__dirname, '../..')
const MODULES_DIR = path.join(ROOT_DIR, 'src/components/PKILearning/modules')
const INFOGRAPHICS_DIR = path.join(ROOT_DIR, 'public/images/infographics')

function readImageDimensions(buf: Buffer): { width: number; height: number } {
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2
    while (offset < buf.length - 8) {
      if (buf[offset] !== 0xff) {
        offset++
        continue
      }
      const marker = buf[offset + 1]
      if (marker >= 0xc0 && marker <= 0xc3) {
        return {
          width: buf.readUInt16BE(offset + 7),
          height: buf.readUInt16BE(offset + 5),
        }
      }
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2
      } else {
        offset += 2 + buf.readUInt16BE(offset + 2)
      }
    }
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

describe('28-Source Clause-Pinned Accuracy Ledger & Cross-Corpus Gate', () => {
  it('contains exactly 28 verified authoritative sources and 181 total graded items', () => {
    expect(ledger.totalAuthoritativeSources).toBe(28)
    expect(ledger.authoritativeSources).toHaveLength(28)
    expect(ledger.hubItemCoverage.pages).toBe(34)
    expect(ledger.hubItemCoverage.learningModules).toBe(76)
    expect(ledger.hubItemCoverage.playgroundTools).toBe(34)
    expect(ledger.hubItemCoverage.businessTools).toBe(37)
    expect(ledger.hubItemCoverage.totalGradedItems).toBe(181)

    expect(MANIFESTS).toHaveLength(76)
    expect(WORKSHOP_TOOLS.filter((t) => !t.sandbox).length).toBeGreaterThanOrEqual(34)
    expect(BUSINESS_TOOLS).toHaveLength(37)
  })

  it('verifies every authoritative source in the ledger resolves in standardsRegistry', () => {
    for (const src of ledger.authoritativeSources) {
      expect(
        hasStandard(src.referenceId),
        `Source ${src.referenceId} missing in standardsRegistry`
      ).toBe(true)
      const std = getStandard(src.referenceId)
      expect(std.title.length).toBeGreaterThan(3)
      expect(src.clausePin.length).toBeGreaterThan(10)
      expect(src.verifiedInLibraryCsv).toBe(true)
    }
  })

  it('verifies 100% parameter parity between accuracyReceiptsLedger.json and ALGORITHM_REGISTRY (FIPS 203, 204, 205)', () => {
    for (const [algoName, spec] of Object.entries(ledger.canonicalAlgorithms)) {
      const reg = ALGORITHM_REGISTRY[algoName]
      expect(reg, `Missing ${algoName} in ALGORITHM_REGISTRY`).toBeDefined()
      expect(reg.publicKeyBytes, `${algoName} publicKeyBytes mismatch`).toBe(spec.publicKeyBytes)
      expect(reg.privateKeyBytes, `${algoName} privateKeyBytes mismatch`).toBe(spec.privateKeyBytes)
      expect(
        reg.signatureOrCiphertextBytes,
        `${algoName} signatureOrCiphertextBytes mismatch`
      ).toBe(spec.signatureOrCiphertextBytes)
      expect(reg.securityLevel, `${algoName} securityLevel mismatch`).toBe(spec.securityLevel)
      expect(reg.fipsStandard, `${algoName} fipsStandard mismatch`).toBe(spec.fipsStandard)
      if (spec.sharedSecretBytes !== null) {
        expect(reg.sharedSecretBytes, `${algoName} sharedSecretBytes mismatch`).toBe(
          spec.sharedSecretBytes
        )
      }
    }
  })

  it('pins exact FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), and RFC 9881 / RFC 9935 OIDs', () => {
    expect(ledger.canonicalAlgorithms['ML-KEM-768'].publicKeyBytes).toBe(1184)
    expect(ledger.canonicalAlgorithms['ML-KEM-768'].signatureOrCiphertextBytes).toBe(1088)
    expect(ledger.canonicalAlgorithms['ML-DSA-65'].publicKeyBytes).toBe(1952)
    expect(ledger.canonicalAlgorithms['ML-DSA-65'].signatureOrCiphertextBytes).toBe(3309)
    expect(ledger.canonicalOids['ML-KEM-768']).toBe('2.16.840.1.101.3.4.4.2')
    expect(ledger.canonicalOids['ML-DSA-65']).toBe('2.16.840.1.101.3.4.3.18')
  })

  it('contains all 76 module clause receipts with valid SHA-256 hashes, line counts, and referenced standards', () => {
    expect(ledger.moduleClauseReceipts).toHaveLength(76)
    const manifestIds = new Set(MANIFESTS.map((m) => m.id))
    for (const modReceipt of ledger.moduleClauseReceipts) {
      expect(manifestIds.has(modReceipt.moduleId), `Unknown moduleId ${modReceipt.moduleId}`).toBe(
        true
      )
      expect(modReceipt.sha256).toMatch(/^[0-9a-f]{64}$/)
      expect(modReceipt.lineCount).toBeGreaterThan(0)
      expect(Array.isArray(modReceipt.referencedStandards)).toBe(true)
      expect(modReceipt.referencedStandards.length).toBeGreaterThan(0)
      if (modReceipt.moduleId !== 'quiz') {
        expect(modReceipt.hasCuriousSummary, `${modReceipt.moduleId} missing curious-summary.md`).toBe(
          true
        )
        expect(modReceipt.hasRagSummary, `${modReceipt.moduleId} missing rag-summary.md`).toBe(true)
      }
    }
  })

  it('verifies no module data.ts or constants.ts file contains stale pre-FIPS-203/204/205 draft byte sizes (3293 or 4595)', () => {
    for (const modReceipt of ledger.moduleClauseReceipts) {
      const modDir = path.join(MODULES_DIR, modReceipt.directory)
      for (const relPath of Object.keys(modReceipt.files)) {
        if (
          relPath === 'data.ts' ||
          relPath === 'constants.ts' ||
          relPath.startsWith('data/')
        ) {
          const fullPath = path.join(modDir, relPath)
          const text = fs.readFileSync(fullPath, 'utf8')
          // Pre-FIPS 204 Dilithium3 (3293B) and Dilithium5 (4595B) signature sizes must not appear
          expect(
            /\b(3293|4595)\b/.test(text),
            `Stale pre-FIPS 204 signature byte size in ${modReceipt.directory}/${relPath}`
          ).toBe(false)
        }
      }
    }
    expect(ALGORITHM_REGISTRY['ML-KEM-768'].publicKeyBytes).toBe(1184)
    expect(ALGORITHM_REGISTRY['ML-KEM-768'].signatureOrCiphertextBytes).toBe(1088)
    expect(ALGORITHM_REGISTRY['ML-DSA-65'].publicKeyBytes).toBe(1952)
    expect(ALGORITHM_REGISTRY['ML-DSA-65'].signatureOrCiphertextBytes).toBe(3309)
  })

  it('verifies all 11 infographicVisualReceipts match on-disk SHA-256 and image dimensions', () => {
    expect(ledger.infographicVisualReceipts).toHaveLength(11)
    for (const receipt of ledger.infographicVisualReceipts) {
      const fullPath = path.join(INFOGRAPHICS_DIR, receipt.fileName)
      expect(fs.existsSync(fullPath), `Missing infographic ${fullPath}`).toBe(true)
      const buf = fs.readFileSync(fullPath)
      const actualSha = crypto.createHash('sha256').update(buf).digest('hex')
      const dims = readImageDimensions(buf)
      expect(actualSha, `${receipt.moduleId} sha256 mismatch`).toBe(receipt.sha256)
      expect(buf.length, `${receipt.moduleId} byteSize mismatch`).toBe(receipt.byteSize)
      expect(dims.width, `${receipt.moduleId} width mismatch`).toBe(receipt.width)
      expect(dims.height, `${receipt.moduleId} height mismatch`).toBe(receipt.height)
      expect(receipt.standardsRefs.length).toBeGreaterThan(0)
      expect(receipt.framingScope.length).toBeGreaterThan(10)
    }
  })
})
