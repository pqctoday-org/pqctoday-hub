// SPDX-License-Identifier: GPL-3.0-only

/**
 * Whether a compliance framework binds organisations like yours, read from the
 * compliance file's `binding_status` column. The words are the Timeline's own
 * `binding_force` vocabulary, so one set of words means the same thing across
 * both datasets.
 *
 * binding              a law, regulation or enforceable rule
 * mandatory_for_scope  binding, but only for a stated scope (for example federal
 *                      systems, or one regulated sector)
 * official_target      a date or goal an authority has published, without force of law
 * recommendation       advice nobody is required to follow
 * draft                not adopted yet
 * informational        context, not a requirement
 *
 * The cell is blank until a framework has been reviewed. A blank is NOT guidance:
 * it is "not yet classified", and is shown that way.
 */
export const BINDING_STATUSES = [
  'binding',
  'mandatory_for_scope',
  'official_target',
  'recommendation',
  'draft',
  'informational',
] as const

export type BindingStatus = (typeof BINDING_STATUSES)[number]

/** The three groups the Report shows. */
export type BindingGroup = 'binding' | 'guidance' | 'unclassified'

export const BINDING_GROUPS: readonly BindingGroup[] = ['binding', 'guidance', 'unclassified']

const STATUS_BY_KEY = new Map<string, BindingStatus>(BINDING_STATUSES.map((s) => [s, s]))

/** One of the six words (any case, "-" or spaces for "_"), or undefined for a blank or anything else. */
export function parseBindingStatus(raw: string | null | undefined): BindingStatus | undefined {
  if (!raw) return undefined
  return STATUS_BY_KEY.get(
    raw
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_')
  )
}

/** Binding and mandatory_for_scope are Binding; the other four are Guidance and drafts; a blank is not yet classified. */
export function bindingGroupOf(status: BindingStatus | undefined): BindingGroup {
  switch (status) {
    case 'binding':
    case 'mandatory_for_scope':
      return 'binding'
    case 'official_target':
    case 'recommendation':
    case 'draft':
    case 'informational':
      return 'guidance'
    default:
      return 'unclassified'
  }
}

export const BINDING_GROUP_META: Record<
  BindingGroup,
  { label: string; chip: string; description: string; dot: string }
> = {
  binding: {
    label: 'Binding',
    chip: 'Binding',
    description: 'A law, regulation or enforceable rule that applies to organisations like yours',
    dot: 'bg-status-error',
  },
  guidance: {
    label: 'Guidance and drafts',
    chip: 'Guidance or draft',
    description:
      'Issued by a body in your country, but nobody is required to follow it: recommendations, targets and drafts',
    dot: 'bg-status-warning',
  },
  unclassified: {
    label: 'Not yet classified',
    chip: 'Not yet classified',
    description: 'Not yet reviewed for whether it binds organisations like yours',
    dot: 'bg-muted-foreground',
  },
}

/**
 * The Report's per-framework chip. A framework the reader selected is not
 * necessarily in their scope: `mandatory_for_scope` means binding only within
 * the instrument's own stated scope (federal systems, one sector, one country),
 * and even a `binding` law binds only where it applies. So "Binding" is shown
 * only when the applicability engine puts the framework in the reader's
 * mandatory tier; otherwise it is "Binding for others" (owner decision D2′,
 * GRC journey audit, 15 Oct 2026). The Applicability panel needs no such check:
 * it only groups by binding status inside the mandatory tier.
 */
export type BindingChip = BindingGroup | 'elsewhere'

export const BINDING_ELSEWHERE_META = {
  chip: 'Binding for others',
  description:
    'Binding within its own stated scope, but your country and sector are outside that scope',
} as const

export function bindingChipFor(status: BindingStatus | undefined, inScope: boolean): BindingChip {
  const group = bindingGroupOf(status)
  return group === 'binding' && !inScope ? 'elsewhere' : group
}

/**
 * Split a list of applicable frameworks into the three groups, keeping each
 * group in the order given. Every item lands in exactly one group.
 */
export function splitByBinding<T extends { item: { bindingStatus?: BindingStatus } }>(
  results: readonly T[]
): Record<BindingGroup, T[]> {
  const out: Record<BindingGroup, T[]> = { binding: [], guidance: [], unclassified: [] }
  for (const r of results) out[bindingGroupOf(r.item.bindingStatus)].push(r)
  return out
}
