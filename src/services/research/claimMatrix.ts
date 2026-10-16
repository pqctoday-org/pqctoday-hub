// SPDX-License-Identifier: GPL-3.0-only
/**
 * The claim matrix (researcher evidence workspace, Layer 2): atomic claims,
 * each with a claim status the user sets (fact / estimate / scenario /
 * recommendation — the same four values as the architecture pack's decision
 * records and the board pack's claim ledger), the Library records that
 * support it and those that contradict it, a confidence rationale and open
 * questions. Saved as a `claim-matrix` document.
 *
 * No claim status is inferred. The only rule checked is that a "fact" names
 * at least one supporting Library record id; record ids the Library does not
 * know are reported as warnings.
 */
import type { ExecutiveDocument } from '@/services/storage/types'
import { CLAIM_STATUS_LABELS, type ClaimStatus } from '@/services/architectureArtifacts'

export { CLAIM_STATUS_LABELS, type ClaimStatus }

export const CLAIM_MATRIX_SCHEMA = 'pqctoday.claim-matrix/1'

/** moduleId prefix of saved matrices: `claim-matrix:<created ms>`. */
export const CLAIM_MATRIX_PREFIX = 'claim-matrix:'

export const CLAIM_STATUSES = Object.keys(CLAIM_STATUS_LABELS) as ClaimStatus[]

export interface MatrixClaim {
  /** Stable row id within the matrix, e.g. `C1`. */
  id: string
  claim: string
  status: ClaimStatus
  /** Library record ids that support the claim. */
  supporting: string[]
  /** Library record ids that contradict or qualify it. */
  contrary: string[]
  confidence: string
  openQuestions: string
}

export interface ClaimMatrix {
  schema: typeof CLAIM_MATRIX_SCHEMA
  title: string
  /** moduleId of the research question this matrix answers, when chosen. */
  questionModuleId: string | null
  claims: MatrixClaim[]
}

export const emptyClaimMatrix = (): ClaimMatrix => ({
  schema: CLAIM_MATRIX_SCHEMA,
  title: '',
  questionModuleId: null,
  claims: [],
})

/** The next free row id (`C1`, `C2`, …). */
export function nextClaimId(claims: MatrixClaim[]): string {
  const used = new Set(claims.map((c) => c.id))
  let n = claims.length + 1
  while (used.has(`C${n}`)) n++
  return `C${n}`
}

export const newClaim = (claims: MatrixClaim[], status: ClaimStatus = 'estimate'): MatrixClaim => ({
  id: nextClaimId(claims),
  claim: '',
  status,
  supporting: [],
  contrary: [],
  confidence: '',
  openQuestions: '',
})

/** Record ids typed as free text: separated by commas, semicolons or new lines. */
export function parseRecordIds(text: string): string[] {
  const out: string[] = []
  for (const raw of text.split(/[,;\n]/)) {
    const id = raw.trim()
    if (id && !out.includes(id)) out.push(id)
  }
  return out
}

export interface ClaimIssue {
  claimId: string
  message: string
}

export interface ClaimMatrixCheck {
  /** Block saving. */
  errors: ClaimIssue[]
  /** Shown, but saving is allowed. */
  warnings: ClaimIssue[]
}

/**
 * The matrix's own rules. `isKnownId` (the Library) is optional: without it,
 * unknown ids are not checked.
 */
export function checkClaimMatrix(
  m: ClaimMatrix,
  isKnownId?: (id: string) => boolean
): ClaimMatrixCheck {
  const errors: ClaimIssue[] = []
  const warnings: ClaimIssue[] = []
  for (const c of m.claims) {
    if (!c.claim.trim()) {
      errors.push({ claimId: c.id, message: `${c.id}: the claim is blank.` })
    }
    if (c.status === 'fact' && c.supporting.length === 0) {
      errors.push({
        claimId: c.id,
        message: `${c.id}: a fact needs at least one supporting Library record id. Add one, or set the status to estimate, scenario or recommendation.`,
      })
    }
    const both = c.supporting.filter((id) => c.contrary.includes(id))
    if (both.length) {
      warnings.push({
        claimId: c.id,
        message: `${c.id}: ${both.join(', ')} is listed as both supporting and contrary.`,
      })
    }
    if (isKnownId) {
      const unknown = [...c.supporting, ...c.contrary].filter((id) => !isKnownId(id))
      if (unknown.length) {
        warnings.push({
          claimId: c.id,
          message: `${c.id}: ${unknown.join(', ')} ${unknown.length === 1 ? 'is' : 'are'} not a Library record id.`,
        })
      }
    }
  }
  return { errors, warnings }
}

const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ').trim()

export function claimMatrixMarkdown(m: ClaimMatrix, questionText?: string): string {
  const counts = CLAIM_STATUSES.map(
    (s) =>
      `${m.claims.filter((c) => c.status === s).length} ${CLAIM_STATUS_LABELS[s].toLowerCase()}`
  ).join(', ')
  return [
    `# ${m.title.trim() || 'Claim matrix'}`,
    '',
    ...(questionText ? [`Answers: ${questionText}`, ''] : []),
    `${m.claims.length} claim${m.claims.length === 1 ? '' : 's'} (${counts}). The status of each claim is set by the author; evidence is cited by Library record id.`,
    '',
    '| # | Claim | Status | Supporting | Contrary | Confidence rationale | Open questions |',
    '|---|---|---|---|---|---|---|',
    ...m.claims.map(
      (c) =>
        `| ${c.id} | ${cell(c.claim)} | ${CLAIM_STATUS_LABELS[c.status]} | ${cell(c.supporting.join('; ')) || '—'} | ${cell(c.contrary.join('; ')) || '—'} | ${cell(c.confidence) || '—'} | ${cell(c.openQuestions) || '—'} |`
    ),
  ].join('\n')
}

const isString = (v: unknown): v is string => typeof v === 'string'
const ids = (v: unknown) => (Array.isArray(v) ? v.filter(isString) : [])

export function readClaimMatrix(
  doc: Pick<ExecutiveDocument, 'type' | 'inputs'>
): ClaimMatrix | null {
  if (doc.type !== 'claim-matrix') return null
  const m = doc.inputs as Partial<ClaimMatrix> | undefined
  if (!m || m.schema !== CLAIM_MATRIX_SCHEMA || !Array.isArray(m.claims)) return null
  return {
    schema: CLAIM_MATRIX_SCHEMA,
    title: isString(m.title) ? m.title : '',
    questionModuleId: isString(m.questionModuleId) ? m.questionModuleId : null,
    claims: m.claims
      .filter((c): c is MatrixClaim => !!c && isString((c as MatrixClaim).id))
      .map((c) => ({
        id: c.id,
        claim: isString(c.claim) ? c.claim : '',
        status: CLAIM_STATUSES.includes(c.status) ? c.status : 'estimate',
        supporting: ids(c.supporting),
        contrary: ids(c.contrary),
        confidence: isString(c.confidence) ? c.confidence : '',
        openQuestions: isString(c.openQuestions) ? c.openQuestions : '',
      })),
  }
}

export function claimMatrixSaveRequest(
  m: ClaimMatrix,
  moduleId: string,
  opts: { questionText?: string; edited?: boolean } = {}
) {
  return {
    type: 'claim-matrix' as const,
    moduleId,
    title: m.title.trim() || 'Claim matrix',
    data: claimMatrixMarkdown(m, opts.questionText),
    inputs: m,
    ...(opts.edited ? { revisionSummary: 'Claim matrix edited' } : {}),
  }
}

export const newClaimMatrixModuleId = (now: Date = new Date()) =>
  `${CLAIM_MATRIX_PREFIX}${now.getTime()}`
