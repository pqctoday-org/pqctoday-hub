// SPDX-License-Identifier: AGPL-3.0-only
//
// What the active policy resolves a "let the policy decide" create to, for the
// Signing / Key-exchange default pills. Three outcomes must stay distinct:
// the policy denies the operation; it allows it but names no default (an
// empty or permissive policy — the caller must pass an algorithm); or it
// resolves to a specific algorithm. Showing the middle case as "denied" told
// readers the permissive baseline blocked signing and key exchange.

import type { DryRunResult, KmipEngine } from '@/wasm/kmip/kmipEngine'

export type PolicyDefault =
  | { state: 'algorithm'; algorithm: string }
  | { state: 'no-default' }
  | { state: 'denied' }
  | { state: 'unknown' }

export function describeDryRun(r: Pick<DryRunResult, 'kind' | 'algorithm' | 'to'>): PolicyDefault {
  if (r.kind === 'Deny') return { state: 'denied' }
  const algorithm = r.algorithm ?? (r.kind === 'Rekey' ? r.to : undefined)
  return algorithm ? { state: 'algorithm', algorithm } : { state: 'no-default' }
}

export function resolvePolicyDefault(
  engine: Pick<KmipEngine, 'dryRun'>,
  op: string,
  date?: string
): PolicyDefault {
  try {
    return describeDryRun(engine.dryRun(date ? { op, date } : { op }))
  } catch {
    return { state: 'unknown' }
  }
}

/** Text for the pill. */
export function policyDefaultLabel(d: PolicyDefault): string {
  switch (d.state) {
    case 'algorithm':
      return d.algorithm
    case 'no-default':
      return 'any (no default)'
    case 'denied':
      return 'denied'
    case 'unknown':
      return '—'
  }
}

/** The algorithm, when the policy names one. */
export const policyDefaultAlgorithm = (d: PolicyDefault): string | null =>
  d.state === 'algorithm' ? d.algorithm : null
