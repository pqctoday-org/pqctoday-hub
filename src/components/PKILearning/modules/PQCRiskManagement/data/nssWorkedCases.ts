// SPDX-License-Identifier: AGPL-3.0-only
/** Two declared algorithm-selection examples, not a CNSA deployment evaluator. */
export interface NssSelection {
  scope: 'NSS' | 'non-NSS' | null
  operation: 'key establishment' | 'software signing' | null
  algorithm: string | null
  parameter: string | null
  variant: string | null
  composition: 'standalone' | 'hybrid' | null
}

export const NSS_SOURCE = {
  title: 'NSA CNSA 2.0 FAQ, October 2026, version 2.2',
  url: 'https://media.defense.gov/2022/Sep/07/2003071836/-1/-1/1/CSI_CNSA_2.0_FAQ_.PDF',
  pages: 'Algorithm table p. 7; final standards p. 11; signing pp. 15–16; arrangements pp. 28–29',
} as const

export const NSS_WORKED_CASES = [
  {
    id: 'nss-key-establishment',
    title: 'Fictional NSS key-establishment case',
    requirement: 'FIPS 203 ML-KEM-1024',
    parameterOptions: ['1024', '768', '512', '976'],
    initial: {
      scope: 'NSS',
      operation: 'key establishment',
      algorithm: 'ML-KEM',
      parameter: '1024',
      variant: null,
      composition: 'standalone',
    } satisfies NssSelection,
  },
  {
    id: 'nss-software-signing',
    title: 'Fictional NSS software-signing case',
    requirement: 'FIPS 204 ML-DSA-87 (pure ML-DSA)',
    parameterOptions: ['87', '65', '44'],
    initial: {
      scope: 'NSS',
      operation: 'software signing',
      algorithm: 'ML-DSA',
      parameter: '87',
      variant: 'pure',
      composition: 'standalone',
    } satisfies NssSelection,
  },
] as const

export type NssOutcomeStatus =
  'match' | 'does-not-match' | 'needs-input' | 'not-applicable' | 'not-evaluated'
export interface NssOutcome {
  status: NssOutcomeStatus
  reason: string
}

/** Exact declared fields only. No inference from a name, industry, date or validation claim. */
export function evaluateNssRequirement(requirementId: string, input: NssSelection): NssOutcome {
  const rule = NSS_WORKED_CASES.find((item) => item.id === requirementId)
  if (!rule)
    return {
      status: 'not-evaluated',
      reason:
        'This requirement is outside the two supported algorithm-selection examples. NIST transition milestones are a separate timeline, not these parameter rules.',
    }
  if (!input.scope)
    return {
      status: 'needs-input',
      reason:
        'Declare whether this example is an NSS use case before applying the selected NSS requirement.',
    }
  if (input.scope !== 'NSS')
    return {
      status: 'not-applicable',
      reason:
        'This selected NSS requirement is not applied to the explicitly non-NSS case. This is not a compliance result for other requirements.',
    }
  if (!input.operation)
    return { status: 'needs-input', reason: 'The cryptographic operation is missing.' }
  if (input.operation !== rule.initial.operation)
    return {
      status: 'does-not-match',
      reason: `This case requires ${rule.initial.operation}; a different operation cannot satisfy it.`,
    }
  if (!input.algorithm || ['PQC family', 'unknown'].includes(input.algorithm))
    return {
      status: 'needs-input',
      reason:
        'A generic or unknown algorithm family does not identify the final standard required by this case.',
    }
  if (input.algorithm !== rule.initial.algorithm)
    return {
      status: 'does-not-match',
      reason: `This case requires final ${rule.initial.algorithm}. ${input.algorithm} does not satisfy that selection; this is not a judgment on its other uses.`,
    }
  if (!input.parameter)
    return {
      status: 'needs-input',
      reason: `Supply the parameter set: the ${input.algorithm} family name alone is insufficient.`,
    }
  if (!/^\d+$/.test(input.parameter))
    return {
      status: 'needs-input',
      reason:
        'Supply one exact parameter set; a conflicting or malformed value cannot be matched by substring.',
    }
  if (input.parameter !== rule.initial.parameter)
    return {
      status: 'does-not-match',
      reason: `This selected requirement needs ${rule.initial.algorithm}-${rule.initial.parameter}, not parameter set ${input.parameter}.`,
    }
  if (!input.composition)
    return {
      status: 'needs-input',
      reason: 'The composition is missing; the selected examples declare standalone algorithms.',
    }
  if (input.composition !== 'standalone')
    return {
      status: 'needs-input',
      reason:
        'A generic hybrid cannot inherit the standalone component result. Check the specific supported arrangement; this does not say all hybrids are forbidden.',
    }
  if (rule.initial.operation === 'software signing') {
    if (!input.variant)
      return {
        status: 'needs-input',
        reason: 'Specify the ML-DSA variant; this case uses pure ML-DSA.',
      }
    if (input.variant !== 'pure')
      return {
        status: 'does-not-match',
        reason:
          'This case requires pure ML-DSA. HashML-DSA is not permitted by the selected FAQ edition.',
      }
  }
  return {
    status: 'match',
    reason: `The declared NSS ${input.operation} fields match ${rule.requirement}. This matches an algorithm requirement only; implementation validation, protocol approval and deployed-system compliance are separate.`,
  }
}
