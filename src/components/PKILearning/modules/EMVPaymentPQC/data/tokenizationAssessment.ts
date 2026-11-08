// SPDX-License-Identifier: AGPL-3.0-only
import type { TokenizationProtectionComponent, TokenizationStep } from './emvConstants'

export type TokenizationAssessment = 'exposed' | 'symmetric-only' | 'not-assessed'

/** Classifies only the explicitly declared boundaries of this teaching sample. */
export function assessTokenizationProtection(
  components: readonly TokenizationProtectionComponent[]
): TokenizationAssessment {
  if (components.some((component) => component.assessment === 'classical-public-key')) {
    return 'exposed'
  }
  if (
    components.length === 0 ||
    components.some((component) => component.assessment === 'unspecified')
  ) {
    return 'not-assessed'
  }
  return 'symmetric-only'
}

export function withTokenizationAssessment(
  step: Omit<TokenizationStep, 'quantumVulnerable'>
): TokenizationStep {
  const assessment = assessTokenizationProtection(step.protectionComponents)
  return {
    ...step,
    quantumVulnerable: assessment === 'not-assessed' ? null : assessment === 'exposed',
  }
}
