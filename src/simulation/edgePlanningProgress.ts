// SPDX-License-Identifier: AGPL-3.0-only
import {
  edgeKey,
  edgeState,
  type Architecture,
  type PlanningPurpose,
  type ProtocolEdge,
} from '@/data/simArchitecture'

export type PlanningChoice = 'hybrid' | 'pure'
export type PlanningGroupId = 'hndl-critical' | 'tnfl-critical' | 'hndl-general' | 'tnfl-general'

export interface PlanningGroupProgress {
  readonly requiredKeys: readonly string[]
  readonly completedKeys: readonly string[]
  /** Null means the declarations cannot establish this group's progress. */
  readonly progress: number | null
  readonly done: boolean
}

export interface EdgePlanningProgress {
  readonly eligibleKeys: readonly string[]
  /** Valid choices on exact current eligible identities, before the effort gate. */
  readonly selectedKeys: readonly string[]
  /** The whole selected set when it fits effort; otherwise empty. */
  readonly creditedKeys: readonly string[]
  readonly unlocked: number
  readonly capacity: number
  readonly overCapacity: boolean
  /** Diagnostics may overlap: an unavailable saved value can also be malformed. */
  readonly invalidChoiceKeys: readonly string[]
  readonly unknownKeys: readonly string[]
  readonly unavailableKeys: readonly string[]
  readonly declarationsValid: boolean
  readonly groups: Readonly<Record<PlanningGroupId, PlanningGroupProgress>>
  readonly criticalDone: boolean
  readonly hndlExposure: number | null
}

export function isPlanningChoice(value: unknown): value is PlanningChoice {
  return value === 'hybrid' || value === 'pure'
}

export type DeclaredPlanningEdge = ProtocolEdge & {
  criticality: 'critical' | 'general'
  requiredPurposes: readonly PlanningPurpose[]
}

/** Validate one authored declaration for both derivation and safe UI display.
 * Whole-architecture completeness and duplicate identities are assessed separately.
 */
export function isDeclaredPlanningEdge(edge: ProtocolEdge): edge is DeclaredPlanningEdge {
  return (
    [edge.from, edge.to, edge.protocol].every(
      (part) => typeof part === 'string' && part.trim().length > 0
    ) &&
    (edge.criticality === 'critical' || edge.criticality === 'general') &&
    Array.isArray(edge.requiredPurposes) &&
    edge.requiredPurposes.length > 0 &&
    new Set(edge.requiredPurposes).size === edge.requiredPurposes.length &&
    [...edge.requiredPurposes].every(
      (purpose) => purpose === 'confidentiality' || purpose === 'authenticity'
    )
  )
}

const owns = (value: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key)

/**
 * Derive the approved fictional planning model without changing saved choices.
 *
 * Eligibility is supplied separately: this helper does not infer a product's
 * operation support. Unknown eligible keys never increase effort capacity.
 * All selected named edges receive credit only when the entire set fits the
 * existing P5 gate; neither array order nor an anonymous count selects a subset.
 *
 * Declarations assess planning purposes, not executed cryptographic protection.
 * A valid choice covers all of its edge's explicitly declared purposes under
 * the case assumption. Invalid declarations make purpose groups unassessed;
 * they do not rewrite the independent eligibility/effort/choice inputs.
 * Returned key arrays are sorted so source order cannot influence credit.
 */
export function deriveEdgePlanningProgress(
  edges: readonly ProtocolEdge[],
  eligibleKeys: Iterable<string>,
  rawChoices: Readonly<Record<string, unknown>>,
  p5Fraction: number
): EdgePlanningProgress {
  const keys = edges.map(edgeKey)
  const current = new Set(keys)
  const eligible = new Set([...eligibleKeys].filter((key) => current.has(key)))
  const eligibleSorted = [...eligible].sort()
  const selectedKeys = eligibleSorted.filter(
    (key) => owns(rawChoices, key) && isPlanningChoice(rawChoices[key])
  )
  const fraction = Number.isFinite(p5Fraction) ? Math.max(0, Math.min(1, p5Fraction)) : 0
  const unlocked = Math.floor(fraction * eligible.size)
  const overCapacity = selectedKeys.length > unlocked
  const creditedKeys = overCapacity ? [] : [...selectedKeys]
  const credited = new Set(creditedKeys)
  const savedKeys = Object.keys(rawChoices).sort()

  const declarationsValid =
    edges.length > 0 && current.size === edges.length && edges.every(isDeclaredPlanningEdge)

  const group = (
    criticality: 'critical' | 'general',
    purpose: 'confidentiality' | 'authenticity'
  ): PlanningGroupProgress => {
    // Keep unavailable dependencies in the denominator. This is deliberately
    // based on all declared edges, not only the eligible subset.
    const requiredKeys = edges
      .filter(
        (edge) =>
          edge.criticality === criticality &&
          Array.isArray(edge.requiredPurposes) &&
          edge.requiredPurposes.includes(purpose)
      )
      .map(edgeKey)
      .sort()
    const assessed = declarationsValid && requiredKeys.length > 0
    const completedKeys = assessed ? requiredKeys.filter((key) => credited.has(key)) : []
    return {
      requiredKeys,
      completedKeys,
      progress: assessed ? completedKeys.length / requiredKeys.length : null,
      done: assessed && completedKeys.length === requiredKeys.length,
    }
  }

  const groups: Record<PlanningGroupId, PlanningGroupProgress> = {
    'hndl-critical': group('critical', 'confidentiality'),
    'tnfl-critical': group('critical', 'authenticity'),
    'hndl-general': group('general', 'confidentiality'),
    'tnfl-general': group('general', 'authenticity'),
  }
  const hCrit = groups['hndl-critical'].progress
  const hGeneral = groups['hndl-general'].progress

  return {
    eligibleKeys: eligibleSorted,
    selectedKeys,
    creditedKeys,
    unlocked,
    capacity: Math.max(0, unlocked - selectedKeys.length),
    overCapacity,
    invalidChoiceKeys: savedKeys.filter((key) => !isPlanningChoice(rawChoices[key])),
    unknownKeys: savedKeys.filter((key) => !current.has(key)),
    unavailableKeys: savedKeys.filter((key) => current.has(key) && !eligible.has(key)),
    declarationsValid,
    groups,
    criticalDone: groups['hndl-critical'].done && groups['tnfl-critical'].done,
    hndlExposure:
      hCrit === null || hGeneral === null ? null : Math.max(0, 1 - (0.7 * hCrit + 0.3 * hGeneral)),
  }
}

/** Reuse current scenario eligibility unchanged; no new endpoint support policy. */
export function planningForArchitecture(
  arch: Architecture,
  p5Fraction: number,
  rawChoices: Readonly<Record<string, unknown>> = {}
): EdgePlanningProgress {
  const eligibleKeys = arch.edges
    .filter((edge) => edge.vulnerable && edgeState(arch, edge) === 'migratable')
    .map(edgeKey)
  return deriveEdgePlanningProgress(arch.edges, eligibleKeys, rawChoices, p5Fraction)
}
