// SPDX-License-Identifier: AGPL-3.0-only
export const CLOSURE_SCOPE = 'verification-closure/handover'
export const CLOSURE_MODULE = 'verification-closure'
export const CLOSURE_TYPE = 'migration-verification' as const
export const OWNERS = [
  'Crypto Gov Owner',
  'Supplier Risk',
  'SOC Manager',
  'Risk / GRC',
  'Architecture',
  'SteerCo',
]

interface Capability {
  id: string
  label: string
}
export const CAPABILITIES: Capability[] = [
  { id: 'cbom', label: 'CBOM + continuous discovery' },
  { id: 'vendor', label: 'Vendor governance cadence' },
  { id: 'soc', label: 'SOC detection content (crypto drift)' },
  { id: 'kri', label: 'KRI / board reporting' },
  { id: 'agility', label: 'Crypto-agility OKRs' },
]

export const CRITERIA = [
  { id: 'maturity', label: 'Maturity ≥ Level 4 across domains' },
  { id: 'tier1', label: 'Tier-1 systems 100% verified' },
  { id: 'tier2', label: 'Tier-2 sample verified, failures cleared' },
  { id: 'residual', label: 'Residual risk accepted by SteerCo (owner + re-eval date)' },
]

export interface ClosureInputs {
  owner: Record<string, string>
  date: Record<string, string>
  criteria: string[]
}
function object(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}
export function isClosureRecordInputs(value: unknown): boolean {
  return object(value).__artifactScope === CLOSURE_SCOPE
}
export function restoreClosureInputs(value: unknown): ClosureInputs {
  const input = object(value)
  const ids = new Set(CAPABILITIES.map((c) => c.id))
  const strings = (value: unknown) =>
    Object.fromEntries(
      Object.entries(object(value)).filter(([id, v]) => ids.has(id) && typeof v === 'string')
    ) as Record<string, string>
  return {
    owner: strings(input.owner),
    date: strings(input.date),
    criteria: Array.isArray(input.criteria)
      ? input.criteria.filter(
          (v): v is string => typeof v === 'string' && CRITERIA.some((c) => c.id === v)
        )
      : [],
  }
}
export function closureEntryStatus(inputs: ClosureInputs) {
  const missing: string[] = []
  let assigned = 0
  for (const c of CAPABILITIES) {
    const owner = Object.entries(inputs.owner).find(([id]) => id === c.id)?.[1] ?? ''
    const date = Object.entries(inputs.date).find(([id]) => id === c.id)?.[1] ?? ''
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(date + 'T00:00:00Z') : null
    const validDate =
      parsed !== null &&
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === date
    if (!OWNERS.includes(owner)) missing.push(c.label + ': owner missing or unrecognized')
    if (!validDate) missing.push(c.label + ': handover date missing or invalid')
    if (OWNERS.includes(owner) && validDate) assigned++
  }
  for (const c of CRITERIA)
    if (!inputs.criteria.includes(c.id)) missing.push(c.label + ': acknowledgment unselected')
  return {
    assigned,
    acknowledged: CRITERIA.filter((c) => inputs.criteria.includes(c.id)).length,
    complete: missing.length === 0,
    missing,
  }
}
function cell(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\\/g, '\\\\')
    .replaceAll('`', '\\`')
    .replaceAll('*', '\\*')
    .replaceAll('_', '\\_')
    .replaceAll('[', '\\[')
    .replaceAll(']', '\\]')
    .replaceAll('~', '\\~')
    .replace(/[:.@]/g, (character) => `&#${character.charCodeAt(0)};`)
    .replace(/\|/g, '\\|')
    .replace(/\r\n|\r|\n/g, '<br>')
}
export function buildClosureArtifact(inputs: ClosureInputs): string {
  const status = closureEntryStatus(inputs)
  const lines = [
    '# Fictional closure and BAU handover record',
    '',
    'Educational local draft: entered owners, dates and acknowledgments are sample planning inputs. They do not verify deployed controls, transfer ownership, approve closure or archive an evidence dossier.',
    '',
    `Entry completeness: ${status.complete ? 'Complete' : 'Incomplete'} (${status.assigned}/${CAPABILITIES.length} capability assignments; ${status.acknowledged}/${CRITERIA.length} acknowledgments).`,
    '',
    '## Capability handover entries',
    '',
    '| Capability ID | Capability | Sample owner | Handover date |',
    '| --- | --- | --- | --- |',
  ]
  for (const c of CAPABILITIES) {
    const owner = Object.entries(inputs.owner).find(([id]) => id === c.id)?.[1] ?? ''
    const date = Object.entries(inputs.date).find(([id]) => id === c.id)?.[1] ?? ''
    lines.push(
      `| ${c.id} | ${cell(c.label)} | ${cell(owner) || 'Not entered'} | ${cell(date) || 'Not entered'} |`
    )
  }
  lines.push(
    '',
    '## Entered sample acknowledgments',
    '',
    '| Criterion ID | Statement | Entry |',
    '| --- | --- | --- |'
  )
  for (const c of CRITERIA)
    lines.push(
      `| ${c.id} | ${cell(c.label)} | ${inputs.criteria.includes(c.id) ? 'Acknowledged by learner — not independently verified' : 'Not acknowledged'} |`
    )
  lines.push(
    '',
    '## Missing or unresolved entries',
    '',
    ...(status.missing.length
      ? status.missing.map((v) => '- ' + cell(v))
      : [
          'No missing entries. Presence only; actual closure and supporting evidence remain unassessed.',
        ]),
    '',
    'Use your production tools to retain supporting records, establish each criterion, confirm actual handover and schedule ongoing ownership reviews. This local sample record is not an archive receipt.'
  )
  return lines.join('\n')
}
