// SPDX-License-Identifier: AGPL-3.0-only
import { HNDL_MULTIPLIER_CAP } from './breachCostModel'

/** Reader descriptions for this UI's existing gap=0 scenario; no model logic. */
export const BREACH_SCENARIO_READER_METHOD = {
  freshness:
    'The sample corpus spans ages 0 to Y years, with its newest data assumed fresh (decryption gap 0). Each item receives the illustrative weight max(0, 1 − age/S), where S is the selected shelf-life preset. Integrating these weights gives E = Y − Y²/(2S) when Y ≤ S, and E = S/2 when Y > S. This is a model of retained value, not evidence that actual data stops mattering.',
  amplification: `With f = HNDL exposure percentage / 100 and C = ${HNDL_MULTIPLIER_CAP}, the multiplier is M = 1 + C × (1 − exp(−E × f / C)). It approaches ${1 + HNDL_MULTIPLIER_CAP}× smoothly rather than using a hard minimum clamp. The quantum-enabled loss per event is conditional on a breach and a CRQC being available.`,
  probability:
    'The headline uses the existing app scenario curve’s cumulative probability at the horizon end minus its value at the reference year. That difference is not conditioned on no earlier arrival. The curve and its interpolation are planning inputs, not an observed forecast or a newly validated probability model.',
  presentValue:
    'Present value sums each modeled whole future year’s expected-loss delta divided by (1 + r)^t. Each year uses its own cumulative scenario probability P_t; with this UI’s decryption gap fixed at 0, the same freshness-weighted corpus assumption is used in each year. These are conditional loss estimates, not realized cash savings or an investment return.',
} as const

export const BREACH_SCENARIO_EARLY_ACTION =
  'Compare conditional avoided-loss estimates with initial migration work and recurring testing, operation and refresh costs. This model does not establish realized annual cash savings or that a programme pays for itself. Earlier action does not retroactively protect ciphertext already harvested.'

export function breachScenarioMethodMarkdown(): string {
  return `## Assumptions and calculation method\n\n${Object.values(BREACH_SCENARIO_READER_METHOD)
    .map((text) => `- ${text}`)
    .join(
      '\n'
    )}\n\n${BREACH_SCENARIO_EARLY_ACTION}\n\nFigures are rounded for display; calculations retain the underlying values.\n\n`
}
