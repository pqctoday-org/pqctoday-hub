// SPDX-License-Identifier: AGPL-3.0-only
import { ALGORITHM_REGISTRY } from '@/data/algorithmProperties'
export interface SamplePolicyInputs {
  algorithm: string
  useCase: 'signature' | 'key-establishment'
  quantumVulnerableDuringTransition: boolean
  retentionYears: number
  migrationYears: number
  threatHorizonYears: number
  completionYear: number
  policy: { id: string; revision: string; source: string; applies: boolean; deadlineYear: number }
}
export function evaluateSamplePolicy(input: SamplePolicyInputs) {
  const values = [
    input.retentionYears,
    input.migrationYears,
    input.threatHorizonYears,
    input.completionYear,
    input.policy.deadlineYear,
  ]
  if (values.some((value) => !Number.isFinite(value) || value < 0))
    throw new Error('Use finite nonnegative scenario inputs')
  const algorithm = Object.values(ALGORITHM_REGISTRY).find(
    (value) => value.name === input.algorithm
  )
  if (!algorithm) throw new Error('Unknown algorithm: select an identified profile')
  const algorithmUse = algorithm.family.toLowerCase().includes('signature')
    ? 'signature'
    : algorithm.family.toLowerCase().includes('kem')
      ? 'key-establishment'
      : null
  const findings: {
    kind: 'mismatch' | 'policy' | 'scenario-risk' | 'out-of-scope'
    message: string
  }[] = []
  if (algorithmUse !== input.useCase)
    findings.push({
      kind: 'mismatch',
      message: `${input.algorithm} does not supply the selected ${input.useCase} operation.`,
    })
  if (!input.policy.applies)
    findings.push({
      kind: 'out-of-scope',
      message: 'The selected policy is out of scope; its deadline cannot reject this scenario.',
    })
  else if (input.completionYear > input.policy.deadlineYear)
    findings.push({
      kind: 'policy',
      message: `Completion ${input.completionYear} exceeds this policy's ${input.policy.deadlineYear} milestone (${input.policy.id}, ${input.policy.revision}).`,
    })
  const exposureYears = input.retentionYears + input.migrationYears - input.threatHorizonYears
  if (
    exposureYears > 0 &&
    input.useCase === 'key-establishment' &&
    input.quantumVulnerableDuringTransition
  )
    findings.push({
      kind: 'scenario-risk',
      message: `Retention plus migration exceeds the assumed threat horizon by ${exposureYears} years. Review the exposure of data protected by quantum-vulnerable key establishment during transition; this is a scenario risk, not a binding deadline or CRQC forecast.`,
    })
  return { algorithm: algorithm.name, policy: input.policy, exposureYears, findings }
}
