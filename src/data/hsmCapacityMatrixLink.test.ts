// SPDX-License-Identifier: GPL-3.0-only
/**
 * Matrix-alignment drift guard.
 *
 * The calculator's `pqcTodayOps` ("standards today" horizon) must stay grounded
 * in the PQC Protocol Matrix. The matrix is CI-refreshed weekly from the IETF
 * datatracker — when a protocol's standardization stage moves, one of these
 * assertions fails, forcing a deliberate re-review of the calculator's op
 * profiles instead of silent drift.
 */
import { describe, it, expect } from 'vitest'
import {
  USE_CASE_MATRIX_LINKS,
  matrixRowById,
  linkForUseCase,
  getUseCaseMaturity,
} from './hsmCapacityMatrixLink'
import { DRAFT_STAGE_LEVEL } from './pqcProtocolMatrix'
import { USE_CASES, PQC_SIG_ALGOS, type AlgoId } from './hsmCapacityDefaults'

const RFC_LEVEL = DRAFT_STAGE_LEVEL['rfc-published'] // 7
const NEAR_FINAL_LEVEL = DRAFT_STAGE_LEVEL['iesg-submitted'] // 6 (== rfc-editor-queue)

function hasPqcSig(ops: Partial<Record<AlgoId, number>>): boolean {
  return Object.keys(ops).some((a) => PQC_SIG_ALGOS.includes(a as AlgoId))
}

describe('HSM capacity ↔ protocol matrix — link integrity', () => {
  it('every use case has exactly one link entry', () => {
    const linkIds = USE_CASE_MATRIX_LINKS.map((l) => l.useCaseId).sort()
    const ucIds = USE_CASES.map((u) => u.id).sort()
    expect(linkIds).toEqual(ucIds)
  })

  it('every non-null matrix reference resolves to a real row and dimensions', () => {
    for (const link of USE_CASE_MATRIX_LINKS) {
      if (!link.matrixRowId) {
        expect(link.note, `${link.useCaseId}: null row requires a note`).toBeTruthy()
        continue
      }
      const row = matrixRowById(link.matrixRowId)
      expect(row, `${link.useCaseId} → ${link.matrixRowId}`).toBeDefined()
      if (link.kemDimension) expect(row!.dimensions[link.kemDimension]).toBeDefined()
      if (link.sigDimension) expect(row!.dimensions[link.sigDimension]).toBeDefined()
      if (link.sigGroundingRowId) {
        expect(matrixRowById(link.sigGroundingRowId), link.sigGroundingRowId).toBeDefined()
      }
    }
  })
})

describe('HSM capacity ↔ protocol matrix — grounding rules for pqcTodayOps', () => {
  it('PQC signature in "standards today" ⇒ grounding row sig dimension is a published RFC', () => {
    for (const uc of USE_CASES) {
      if (!hasPqcSig(uc.pqcTodayOps)) continue
      const link = linkForUseCase(uc.id)
      expect(link?.matrixRowId, `${uc.id}: PQC sig today requires a matrix grounding`).toBeTruthy()
      const sigRow = matrixRowById(link!.sigGroundingRowId ?? link!.matrixRowId!)
      const dim = sigRow!.dimensions[link!.sigDimension ?? 'pureSig']
      const level = dim.stage ? DRAFT_STAGE_LEVEL[dim.stage] : 0
      expect(
        level,
        `${uc.id}: pqcTodayOps signs with PQC but ${sigRow!.id}.${link!.sigDimension} is '${dim.stage}' — only rfc-published grounds a standards-today PQC signature`
      ).toBe(RFC_LEVEL)
    }
  })

  it('classical signature retained in "standards today" ⇒ linked sig dimension is NOT a published RFC (else the mapping is stale)', () => {
    for (const uc of USE_CASES) {
      const link = linkForUseCase(uc.id)
      if (!link?.matrixRowId || !link.sigDimension) continue
      if (hasPqcSig(uc.pqcTodayOps)) continue
      // Use case still signs classically today — that is only correct while the
      // grounding sig dimension is below rfc-published. When TLS/SSH/IKEv2/DNSSEC
      // ML-DSA reaches RFC, this fails: upgrade pqcTodayOps deliberately.
      const sigRow = matrixRowById(link.sigGroundingRowId ?? link.matrixRowId)
      const dim = sigRow!.dimensions[link.sigDimension]
      const level = dim.stage ? DRAFT_STAGE_LEVEL[dim.stage] : 0
      expect(
        level,
        `${uc.id}: ${sigRow!.id}.${link.sigDimension} reached '${dim.stage}' — pqcTodayOps should now migrate its signature to PQC`
      ).toBeLessThan(RFC_LEVEL)
    }
  })

  it('ML-KEM in "standards today" ⇒ linked KEM dimension is near-final (level ≥ 6) or production/pilot posture', () => {
    for (const uc of USE_CASES) {
      if (!uc.pqcTodayOps['ml-kem-768']) continue
      const link = linkForUseCase(uc.id)
      if (!link?.matrixRowId) continue // payment: explicitly ungrounded, labeled in UI
      expect(link.kemDimension, `${uc.id}: ML-KEM today requires a KEM dimension link`).toBeTruthy()
      const dim = matrixRowById(link.matrixRowId)!.dimensions[link.kemDimension!]
      const level = dim.stage ? DRAFT_STAGE_LEVEL[dim.stage] : 0
      const postureOk = dim.deploymentPosture === 'production' || dim.deploymentPosture === 'pilot'
      expect(
        level >= NEAR_FINAL_LEVEL || postureOk,
        `${uc.id}: ${link.matrixRowId}.${link.kemDimension} stage='${dim.stage}' posture='${dim.deploymentPosture}' does not ground a standards-today ML-KEM swap`
      ).toBe(true)
    }
  })

  it('hybrid-KEM protocols carry the classical KEX op alongside ML-KEM in BOTH horizons', () => {
    for (const link of USE_CASE_MATRIX_LINKS) {
      if (link.kemDimension !== 'hybridKem') continue
      const uc = USE_CASES.find((u) => u.id === link.useCaseId)!
      for (const [horizon, ops] of [
        ['end-state', uc.pqcOps],
        ['standards-today', uc.pqcTodayOps],
      ] as const) {
        expect(
          ops['ml-kem-768'],
          `${uc.id} (${horizon}): hybrid-KEM protocol must include ml-kem-768`
        ).toBeGreaterThan(0)
        expect(
          ops['ecdh-p256'],
          `${uc.id} (${horizon}): hybrid KEX retains the classical (EC)DH op — pure ML-KEM is not the standardized mode`
        ).toBeGreaterThan(0)
      }
    }
  })

  it('DNSSEC: matrix stage is pre-draft ⇒ standards-today ops are fully classical', () => {
    const dim = matrixRowById('dnssec')!.dimensions.pureSig
    const level = dim.stage ? DRAFT_STAGE_LEVEL[dim.stage] : 0
    // If this fails, PQC DNSSEC got chartered — revisit the dnssec mapping.
    expect(level).toBeLessThanOrEqual(DRAFT_STAGE_LEVEL['individual-draft'])
    const dnssec = USE_CASES.find((u) => u.id === 'dnssec')!
    const pqcAlgos = Object.keys(dnssec.pqcTodayOps).filter(
      (a) => a.startsWith('ml-') || a.startsWith('slh-')
    )
    expect(pqcAlgos).toEqual([])
  })
})

describe('HSM capacity ↔ protocol matrix — maturity chips', () => {
  it('renders chips for matrix-linked use cases and a note-only result for payment', () => {
    const tls = getUseCaseMaturity('tls')
    expect(tls?.kem?.label).toContain('KEM')
    expect(tls?.sig?.label).toContain('Sig')
    // TLS hybrid KEM: RFC Ed queue + production posture → success tone.
    expect(tls?.kem?.tone).toBe('success')

    const dnssec = getUseCaseMaturity('dnssec')
    expect(dnssec?.sig?.tone).toBe('error') // stage 'identified'

    const payment = getUseCaseMaturity('payment')
    expect(payment?.kem).toBeUndefined()
    expect(payment?.sig).toBeUndefined()
    expect(payment?.note).toContain('No protocol-matrix row')
  })

  it('code-signing sig chip grounds in the X.509 row (RFC), not sigstore (experimental)', () => {
    const cs = getUseCaseMaturity('code-signing')
    expect(cs?.sig?.tone).toBe('success')
    expect(cs?.sig?.label).toContain('RFC')
  })
})
