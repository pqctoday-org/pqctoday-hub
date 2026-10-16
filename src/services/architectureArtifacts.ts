// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The architecture pack's own artifacts (Layer 2): scope, decision records and
 * the test plan. Each is stored in the artifact store as Markdown (`data`) plus
 * its structured `inputs`, so it can be re-edited and re-rendered. Decision
 * records cite evidence by Library reference id; the pack re-renders them at
 * download time so each citation shows the Library's current state.
 */
import type { ChecklistLine } from '@/data/migrationTestChecklist'

// ── Scope ──────────────────────────────────────────────────────────────────

export interface ArchitectureScopeInputs {
  systems: string
  boundaries: string
  lifetimes: string
  relyingParties: string
  constraints: string
  validatedBoundaries: string
}

export const SCOPE_FIELDS: { key: keyof ArchitectureScopeInputs; label: string; hint: string }[] = [
  {
    key: 'systems',
    label: 'Systems in scope',
    hint: 'For example: payments API, card vault, partner TLS gateway',
  },
  {
    key: 'boundaries',
    label: 'Trust and administrative boundaries',
    hint: 'Who operates what: cloud tenant, on-premises HSMs, partner side',
  },
  {
    key: 'lifetimes',
    label: 'Data and credential lifetimes',
    hint: 'How long data must stay confidential; certificate and key lifetimes',
  },
  {
    key: 'relyingParties',
    label: 'Clients and relying parties',
    hint: 'Browsers, partner systems, devices — and which ones you cannot upgrade',
  },
  {
    key: 'constraints',
    label: 'Constraints',
    hint: 'Latency, MTU, message or payload limits, storage, availability objectives',
  },
  {
    key: 'validatedBoundaries',
    label: 'Regulated or validated boundaries',
    hint: 'For example: FIPS 140-3 modules, PCI scope, CNSA 2.0 systems',
  },
]

export const emptyScope = (): ArchitectureScopeInputs => ({
  systems: '',
  boundaries: '',
  lifetimes: '',
  relyingParties: '',
  constraints: '',
  validatedBoundaries: '',
})

const orNotStated = (s: string) => (s.trim() ? s.trim() : '_Not stated._')

export function scopeMarkdown(s: ArchitectureScopeInputs): string {
  return [
    '# Architecture scope',
    '',
    ...SCOPE_FIELDS.flatMap((f) => [`## ${f.label}`, '', orNotStated(s[f.key]), '']),
  ].join('\n')
}

/** One-line summary for the pack cover. */
export const scopeSummary = (s: ArchitectureScopeInputs): string =>
  s.systems.trim().split('\n')[0] ?? ''

// ── Decision records ───────────────────────────────────────────────────────

export type ClaimStatus = 'fact' | 'estimate' | 'scenario' | 'recommendation'

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  fact: 'Fact (with source)',
  estimate: 'Estimate',
  scenario: 'Scenario',
  recommendation: 'Recommendation',
}

export type DecisionTopic = 'transition-mode' | 'kms-design' | 'hsm-choice' | 'pki-design' | 'other'

export interface DecisionTemplate {
  topic: DecisionTopic
  label: string
  /** Learn module the decision usually comes out of. */
  modulePath?: string
  context: string
  options: string
  preconditions: string
}

/** Starting points for the four decisions the architect Essentials teach. */
export const DECISION_TEMPLATES: DecisionTemplate[] = [
  {
    topic: 'transition-mode',
    label: 'Transition mode per protocol',
    modulePath: '/learn/hybrid-crypto',
    context: 'Which protocols carry long-lived secrets, and which peers can negotiate PQC today.',
    options: 'Classical for now · hybrid (e.g. X25519MLKEM768) · pure ML-KEM / ML-DSA',
    preconditions:
      'Both ends support the chosen group or algorithm; downgrade policy is defined; message and MTU limits are checked.',
  },
  {
    topic: 'kms-design',
    label: 'Key hierarchy and KMS provider',
    modulePath: '/learn/kms-pqc',
    context:
      'Which keys wrap which, where each key lives, and what the provider supports for KEM and signature keys.',
    options: 'Cloud KMS · external key store · own HSM-backed KMS',
    preconditions:
      'The provider supports the algorithm for the needed key usage, protection level and region; signing and KEM keys are separate.',
  },
  {
    topic: 'hsm-choice',
    label: 'HSM product and validated configuration',
    modulePath: '/learn/hsm-pqc',
    context:
      'Which HSM and firmware hold which keys, and whether PQC is inside the validated boundary.',
    options: 'Upgrade firmware on current HSMs · new HSMs · cloud HSM',
    preconditions:
      'Algorithm, API (PKCS #11 mechanism), firmware version and validation certificate are confirmed for the exact configuration.',
  },
  {
    topic: 'pki-design',
    label: 'Certificate format and chain design',
    modulePath: '/learn/pki-workshop',
    context:
      'Which relying parties must accept the new certificates, and how large chains may get.',
    options:
      'Pure ML-DSA chains · composite certificates · related certificates (RFC 9763) · parallel chains',
    preconditions:
      'Every relying party understands the chosen format (composite OIDs are not backward compatible); chain size fits handshake limits.',
  },
  {
    topic: 'other',
    label: 'Other decision',
    context: '',
    options: '',
    preconditions: '',
  },
]

export interface DecisionRecordInputs {
  topic: DecisionTopic
  title: string
  context: string
  options: string
  decision: string
  consequences: string
  preconditions: string
  /** Library reference ids, e.g. `RFC 9763`. */
  evidence: string[]
  claimStatus: ClaimStatus
}

export function decisionFromTemplate(topic: DecisionTopic): DecisionRecordInputs {
  const t = DECISION_TEMPLATES.find((d) => d.topic === topic) ?? DECISION_TEMPLATES[4]
  return {
    topic: t.topic,
    title: t.topic === 'other' ? '' : t.label,
    context: t.context,
    options: t.options,
    decision: '',
    consequences: '',
    preconditions: t.preconditions,
    evidence: [],
    claimStatus: 'recommendation',
  }
}

/** What the Library says about one cited reference at render time. */
export interface EvidenceState {
  /** The Library's own id for the record (used in the link). */
  referenceId?: string
  title: string
  status: string
  lastUpdated?: string
  supersededBy?: string[]
}

export type EvidenceResolver = (referenceId: string) => EvidenceState | null

export const parseEvidence = (text: string): string[] =>
  text
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter((s, i, all) => s.length > 0 && all.indexOf(s) === i)

function evidenceLine(id: string, origin: string, resolve?: EvidenceResolver): string {
  const link = (ref: string) => `${origin}/library?ref=${encodeURIComponent(ref)}`
  if (!resolve) return `- [${id}](${link(id)})`
  const st = resolve(id)
  if (!st)
    return `- ${id}: not found in the current Library (it may have been withdrawn or renamed)`
  const extra = [
    st.status,
    st.lastUpdated ? `updated ${st.lastUpdated}` : '',
    st.supersededBy?.length ? `superseded by ${st.supersededBy.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join(' · ')
  return `- [${id}](${link(st.referenceId ?? id)}) ${st.title}${extra ? ` (${extra})` : ''}`
}

export function decisionMarkdown(
  d: DecisionRecordInputs,
  opts: { origin?: string; resolve?: EvidenceResolver } = {}
): string {
  const origin = opts.origin ?? ''
  return [
    `# Decision: ${d.title.trim() || 'Untitled decision'}`,
    '',
    `Claim status: ${CLAIM_STATUS_LABELS[d.claimStatus]}`,
    '',
    '## Context',
    '',
    orNotStated(d.context),
    '',
    '## Options considered',
    '',
    orNotStated(d.options),
    '',
    '## Decision',
    '',
    orNotStated(d.decision),
    '',
    '## Consequences',
    '',
    orNotStated(d.consequences),
    '',
    '## Preconditions (this decision holds only if)',
    '',
    orNotStated(d.preconditions),
    '',
    '## Evidence',
    '',
    ...(d.evidence.length > 0
      ? d.evidence.map((id) => evidenceLine(id, origin, opts.resolve))
      : ['_No evidence cited._']),
    '',
  ].join('\n')
}

// ── Test plan ──────────────────────────────────────────────────────────────

export type TestResult = 'not-run' | 'pass' | 'fail' | 'not-applicable'

export const TEST_RESULT_LABELS: Record<TestResult, string> = {
  'not-run': 'Not run',
  pass: 'Pass',
  fail: 'Fail',
  'not-applicable': 'Not applicable',
}

export interface TestPlanLine {
  /** Checklist line id, or `custom-<n>` for a line the user added. */
  id: string
  text: string
  owner: string
  result: TestResult
}

export interface TestPlanInputs {
  lines: TestPlanLine[]
}

export const testPlanFromChecklist = (lines: ChecklistLine[]): TestPlanInputs => ({
  lines: lines.map((l) => ({ id: l.id, text: l.text, owner: '', result: 'not-run' })),
})

const tableCell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ').trim()

/** The test plan as Markdown. The operations pack reuses it with its own
 * title (`Operations test plan`). */
export function testPlanMarkdown(p: TestPlanInputs, title = 'Architecture test plan'): string {
  const count = (r: TestResult) => p.lines.filter((l) => l.result === r).length
  return [
    `# ${title}`,
    '',
    `${p.lines.length} checks: ${count('pass')} pass, ${count('fail')} fail, ${count('not-run')} not run, ${count('not-applicable')} not applicable.`,
    '',
    '| # | Check | Owner | Result |',
    '|---|---|---|---|',
    ...p.lines.map(
      (l, i) =>
        `| ${i + 1} | ${tableCell(l.text)} | ${tableCell(l.owner) || '—'} | ${TEST_RESULT_LABELS[l.result]} |`
    ),
    '',
  ].join('\n')
}
