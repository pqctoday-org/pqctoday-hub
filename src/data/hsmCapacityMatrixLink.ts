// SPDX-License-Identifier: GPL-3.0-only
/**
 * Grounding link between the HSM Capacity Calculator's use cases and the PQC
 * Protocol Support Matrix (src/data/pqcProtocolMatrix.ts).
 *
 * Each use case points at the matrix row (and dimensions) whose standardization
 * status justifies its `pqcTodayOps` profile. The calculator renders live
 * maturity chips from this link, and hsmCapacityMatrixLink.test.ts enforces the
 * grounding rules — if the matrix moves (it is CI-refreshed weekly from the
 * IETF datatracker), the test fails and forces a deliberate re-review of the
 * calculator's op profiles.
 */
import {
  PROTOCOL_MATRIX,
  DRAFT_STAGE_LEVEL,
  DRAFT_STAGE_SHORT,
  type DimensionStatus,
  type ProtocolMatrixRow,
} from './pqcProtocolMatrix'

export type MatrixDimensionKey = 'pureKem' | 'hybridKem' | 'pureSig' | 'hybridSig'

export interface UseCaseMatrixLink {
  useCaseId: string
  /** Matrix row whose standardization status grounds this use case; null = no row exists. */
  matrixRowId: string | null
  /** Which KEM dimension the use case's key-exchange ops are grounded in. */
  kemDimension?: MatrixDimensionKey
  /** Which signature dimension the use case's signing ops are grounded in. */
  sigDimension?: MatrixDimensionKey
  /**
   * Row that grounds the SIGNATURE side when it differs from `matrixRowId`
   * (code signing links to sigstore for context, but its ML-DSA/SLH-DSA
   * standing comes from the published X.509 certificate RFCs).
   */
  sigGroundingRowId?: string
  /** Extra context; required when matrixRowId is null. */
  note?: string
}

export const USE_CASE_MATRIX_LINKS: UseCaseMatrixLink[] = [
  { useCaseId: 'tls', matrixRowId: 'tls-1-3', kemDimension: 'hybridKem', sigDimension: 'pureSig' },
  { useCaseId: 'ssh', matrixRowId: 'ssh', kemDimension: 'hybridKem', sigDimension: 'pureSig' },
  {
    useCaseId: 'vpn-ike',
    matrixRowId: 'ike-ipsec',
    kemDimension: 'hybridKem',
    sigDimension: 'pureSig',
  },
  { useCaseId: 'pki-ca', matrixRowId: 'x509', sigDimension: 'pureSig' },
  { useCaseId: 'doc-signing', matrixRowId: 'smime', sigDimension: 'pureSig' },
  {
    useCaseId: 'code-signing',
    matrixRowId: 'sigstore',
    sigDimension: 'pureSig',
    sigGroundingRowId: 'x509',
    note: 'Sigstore-native PQC is experimental; artifact signatures are grounded in the published X.509 sig RFCs (RFC 9881 ML-DSA / RFC 9909 SLH-DSA) that UEFI/Authenticode pilots inherit.',
  },
  { useCaseId: 'dnssec', matrixRowId: 'dnssec', sigDimension: 'pureSig' },
  { useCaseId: 'tde', matrixRowId: 'pkcs11', kemDimension: 'pureKem' },
  { useCaseId: 'kms', matrixRowId: 'kmip', kemDimension: 'pureKem' },
  {
    useCaseId: 'payment',
    matrixRowId: null,
    note: 'No protocol-matrix row — there is no published PQC standard for payment zone-key exchange (ANSI X9 / EMVCo work in progress). The ML-KEM mapping in the end-state view is a projection.',
  },
]

export function matrixRowById(id: string): ProtocolMatrixRow | undefined {
  return PROTOCOL_MATRIX.find((r) => r.id === id)
}

export function linkForUseCase(useCaseId: string): UseCaseMatrixLink | undefined {
  return USE_CASE_MATRIX_LINKS.find((l) => l.useCaseId === useCaseId)
}

export type MaturityTone = 'success' | 'warning' | 'muted' | 'error'

export interface MaturityChip {
  /** e.g. "KEM: RFC · production" */
  label: string
  tone: MaturityTone
  /** Free-text caption from the matrix (stageNote / note), for tooltips. */
  detail?: string
}

export interface UseCaseMaturity {
  rowName?: string
  kem?: MaturityChip
  sig?: MaturityChip
  note?: string
}

function toneForDimension(dim: DimensionStatus): MaturityTone {
  const level = dim.stage ? DRAFT_STAGE_LEVEL[dim.stage] : undefined
  if (level !== undefined) {
    if (level >= 7) return 'success'
    if (dim.deploymentPosture === 'production') return 'success'
    if (level >= 4) return 'warning'
    if (level >= 2) return 'muted'
    return 'error'
  }
  // OASIS rows carry value/posture without an IETF stage.
  if (dim.deploymentPosture === 'production') return 'success'
  if (dim.deploymentPosture === 'pilot') return 'warning'
  return dim.value === 'rfc' ? 'success' : 'muted'
}

function chipFor(kind: 'KEM' | 'Sig', dim: DimensionStatus): MaturityChip {
  const stageLabel = dim.stage ? DRAFT_STAGE_SHORT[dim.stage] : dim.value.toUpperCase()
  const posture = dim.deploymentPosture ? ` · ${dim.deploymentPosture}` : ''
  return {
    label: `${kind}: ${stageLabel}${posture}`,
    tone: toneForDimension(dim),
    detail: dim.stageNote ?? dim.note,
  }
}

/**
 * Live standardization maturity for one use case, derived from the protocol
 * matrix at render time (never hand-copied — see the drift test).
 */
export function getUseCaseMaturity(useCaseId: string): UseCaseMaturity | undefined {
  const link = linkForUseCase(useCaseId)
  if (!link) return undefined
  if (!link.matrixRowId) return { note: link.note }
  const row = matrixRowById(link.matrixRowId)
  if (!row) return { note: link.note }
  const sigRow = link.sigGroundingRowId ? matrixRowById(link.sigGroundingRowId) : row
  return {
    rowName: row.name,
    kem: link.kemDimension ? chipFor('KEM', row.dimensions[link.kemDimension]) : undefined,
    sig:
      link.sigDimension && sigRow
        ? chipFor('Sig', sigRow.dimensions[link.sigDimension])
        : undefined,
    note: link.note,
  }
}
