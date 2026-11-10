// SPDX-License-Identifier: AGPL-3.0-only
import {
  ROLE_CROSSWALK,
  FTE_PER_CRYPTO_INSTANCES,
  FTE_PER_CRYPTO_INSTANCES_PRODUCTION,
  SIZING_SANITY_BANDS,
  type FrameworkRoleId,
} from '@/data/roleCrosswalk'

export const ALLOCATION_ROLE_ORDER: FrameworkRoleId[] = [
  'qrpm',
  'exec-sponsor',
  'crypto-architect',
  'security-eng',
  'appsec-lead',
  'ot-specialist',
  'vendor-lead',
  'pmo-analyst',
]
const COORDINATION: FrameworkRoleId[] = ['qrpm', 'crypto-architect', 'pmo-analyst']
const DELIVERY: FrameworkRoleId[] = ['security-eng', 'appsec-lead', 'ot-specialist', 'vendor-lead']
export interface TeamSizingContext {
  estateInstances: string
  sizingPhase: 'early' | 'production'
  otInScope: boolean
}
export interface AllocationDraft {
  context: string
  rows: Record<FrameworkRoleId, string>
}
export type AllocationAssessment =
  | {
      status: 'ready'
      rows: Record<FrameworkRoleId, number>
      delivery: number
      coordination: number
      total: number
      reference: number
    }
  | { status: 'incomplete' | 'invalid'; reason: string }

export function instanceCount(raw: string): number | null {
  if (typeof raw !== 'string' || !/^\d+$/.test(raw.trim())) return null
  const value = Number(raw)
  return Number.isSafeInteger(value) && value > 0 ? value : null
}
export function fteText(units: number): string {
  const magnitude = BigInt(units < 0 ? -units : units)
  const fraction = String(magnitude % 100n)
    .padStart(2, '0')
    .replace(/0+$/, '')
  return `${units < 0 ? '-' : ''}${magnitude / 100n}${fraction ? '.' + fraction : ''}`
}

export function sizingContextKey(context: TeamSizingContext): string {
  return `${instanceCount(context.estateInstances) ?? context.estateInstances}|${context.sizingPhase}|${context.otInScope}`
}
export function seedTeamAllocation(context: TeamSizingContext): AllocationDraft | null {
  const n = instanceCount(context.estateInstances)
  if (
    n === null ||
    !['early', 'production'].includes(context.sizingPhase) ||
    typeof context.otInScope !== 'boolean'
  )
    return null
  const ratio =
    context.sizingPhase === 'early' ? FTE_PER_CRYPTO_INSTANCES : FTE_PER_CRYPTO_INSTANCES_PRODUCTION
  const pool = Number((BigInt(n) * 100n + BigInt(ratio) / 2n) / BigInt(ratio))
  const weights = context.otInScope ? [12, 4, 3, 2] : [12, 4, 0, 2]
  const denominator = weights.reduce((sum, weight) => sum + weight, 0)
  const shares = weights.map((weight, index) => ({
    index,
    units:
      Math.floor(pool / denominator) * weight +
      Math.floor(((pool % denominator) * weight) / denominator),
    remainder: ((pool % denominator) * weight) % denominator,
  }))
  let left = pool - shares.reduce((sum, share) => sum + share.units, 0)
  for (const share of [...shares].sort((a, b) => b.remainder - a.remainder || a.index - b.index)) {
    if (left-- > 0) share.units++
  }
  const small = n < SIZING_SANITY_BANDS.smallEstateInstances
  const rows = {
    qrpm: small ? '0.5' : '1',
    'exec-sponsor': '0',
    'crypto-architect': small ? '0.25' : '0.75',
    'security-eng': fteText(shares[0].units),
    'appsec-lead': fteText(shares[1].units),
    'ot-specialist': fteText(shares[2].units),
    'vendor-lead': fteText(shares[3].units),
    'pmo-analyst': small ? '0.25' : '0.75',
  }
  return { context: sizingContextKey(context), rows }
}
export function allocationRowText(draft: unknown, id: FrameworkRoleId): string {
  if (
    !draft ||
    typeof draft !== 'object' ||
    !('rows' in draft) ||
    !draft.rows ||
    typeof draft.rows !== 'object'
  )
    return ''
  const value = (draft.rows as Record<string, unknown>)[id]
  return typeof value === 'string' ? value : ''
}
export function editTeamAllocation(
  context: TeamSizingContext,
  draft: unknown,
  id: FrameworkRoleId,
  value: string
): AllocationDraft {
  const rows = Object.fromEntries(
    ALLOCATION_ROLE_ORDER.map((role) => [role, allocationRowText(draft, role)])
  ) as Record<FrameworkRoleId, string>
  return { context: sizingContextKey(context), rows: { ...rows, [id]: value } }
}
function assessReference(context: TeamSizingContext): number {
  const ratio =
    context.sizingPhase === 'early' ? FTE_PER_CRYPTO_INSTANCES : FTE_PER_CRYPTO_INSTANCES_PRODUCTION
  return Number(
    (BigInt(instanceCount(context.estateInstances)!) * 100n + BigInt(ratio) / 2n) / BigInt(ratio)
  )
}
export function assessTeamAllocation(
  context: TeamSizingContext,
  draft: unknown
): AllocationAssessment {
  const seed = seedTeamAllocation(context)
  if (!seed)
    return {
      status: 'incomplete',
      reason: 'Enter a positive whole CBOM instance count and a supported phase/scope.',
    }
  if (
    !draft ||
    typeof draft !== 'object' ||
    !('context' in draft) ||
    draft.context !== seed.context
  )
    return {
      status: 'incomplete',
      reason: 'Allocation belongs to different inputs or is missing. Reset the sample allocations.',
    }
  const rows = {} as Record<FrameworkRoleId, number>
  for (const id of ALLOCATION_ROLE_ORDER) {
    const raw = allocationRowText(draft, id).trim()
    if (!raw)
      return {
        status: 'incomplete',
        reason: `Enter an allocation for ${ROLE_CROSSWALK[id].label}; zero is allowed.`,
      }
    if (!/^\d+(?:\.\d{1,2})?$/.test(raw))
      return {
        status: 'invalid',
        reason: `${ROLE_CROSSWALK[id].label}: use a nonnegative number with at most two decimal places.`,
      }
    const [whole, fraction = ''] = raw.split('.')
    const units = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
    if (!Number.isSafeInteger(units))
      return { status: 'invalid', reason: 'Allocation is too large to sum exactly.' }
    if ((id === 'exec-sponsor' || (id === 'ot-specialist' && !context.otInScope)) && units !== 0)
      return {
        status: 'invalid',
        reason:
          'Excluded sponsor or out-of-scope OT allocation must remain zero. Change the scope or reset allocations.',
      }
    rows[id] = units
  }
  const delivery = DELIVERY.reduce((sum, id) => sum + rows[id], 0)
  const coordination = COORDINATION.reduce((sum, id) => sum + rows[id], 0)
  const total = delivery + coordination
  if (!Number.isSafeInteger(total))
    return { status: 'invalid', reason: 'Allocation total is too large to sum exactly.' }
  const reference = assessReference(context)
  return { status: 'ready', rows, delivery, coordination, total, reference }
}
export function allocationReferenceNote(context: TeamSizingContext): string {
  const n = instanceCount(context.estateInstances)
  return n !== null && n > SIZING_SANITY_BANDS.largeEstateInstances
    ? `The framework's ${SIZING_SANITY_BANDS.largeEstatePeakFteLow}–${SIZING_SANITY_BANDS.largeEstatePeakFteHigh} FTE office reference does not specify the same population or phase as this allocation. It is not a cap or a staffing-adequacy test.`
    : 'Fractional coordination defaults and role weights are editable fictional assumptions, not minimum staffing requirements.'
}
export function allocationMarkdown(context: TeamSizingContext, draft: unknown): string {
  const result = assessTeamAllocation(context, draft)
  if (result.status !== 'ready') return `Allocation unavailable: ${result.reason}`
  return [
    `- CBOM instances: ${instanceCount(context.estateInstances)}`,
    `- Phase: ${context.sizingPhase}; OT in scope: ${context.otInScope ? 'Yes (within delivery pool)' : 'No'}`,
    `- Ratio delivery reference: ${fteText(result.reference)} FTE`,
    `- Allocated delivery: ${fteText(result.delivery)} FTE`,
    `- Allocated coordination: ${fteText(result.coordination)} FTE`,
    `- Allocated programme total: ${fteText(result.total)} FTE`,
    ...(result.total === 0 ? ['Unstaffed draft: no incremental FTE allocated.'] : []),
    `- Delivery difference from ratio reference: ${fteText(result.delivery - result.reference)} FTE`,
    '',
    '| Role | Allocated FTE | Framework reference band |',
    '|---|---|---|',
    ...ALLOCATION_ROLE_ORDER.map(
      (id) =>
        `| ${ROLE_CROSSWALK[id].label} | ${id === 'exec-sponsor' ? 'Not counted in incremental FTE' : fteText(result.rows[id])} | ${ROLE_CROSSWALK[id].typicalFte} |`
    ),
    '',
    allocationReferenceNote(context),
    'Seed weights: security 3, AppSec 1, vendor 0.5, plus OT 0.75 when selected. Coordination defaults below 1,000 instances are 0.5 QRPM, 0.25 architect and 0.25 PMO; otherwise 1, 0.75 and 0.75. These are editable Hub assumptions.',
    'Hub fictional allocation: ratio seeds delivery, coordination is added separately, and selected OT shares the delivery pool. The executive sponsor remains responsible but is outside this incremental staffing budget. Hundredth-FTE arithmetic keeps totals consistent; it is not evidence of estimation precision.',
    'In your production tools, establish a consistent inventory unit, measure work and available staff time, assign responsibilities and revise allocations from delivery evidence. This sample does not establish adequate staffing.',
  ].join('\n')
}
