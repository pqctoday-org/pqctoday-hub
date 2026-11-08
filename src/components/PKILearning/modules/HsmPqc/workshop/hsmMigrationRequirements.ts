// SPDX-License-Identifier: AGPL-3.0-only

export const CASE_REVISION = '1'
export const MIGRATION_CASES = [
  {
    id: 'signing',
    label: 'ML-DSA signing / PKCS#11 sample',
    algorithms: ['ML-DSA-65'],
    signature: true,
    kem: false,
    interface: 'pkcs11',
    validationRecords: false,
  },
  {
    id: 'kem',
    label: 'ML-KEM key establishment / vendor API sample',
    algorithms: ['ML-KEM-768'],
    signature: false,
    kem: true,
    interface: 'vendor-api',
    validationRecords: false,
  },
  {
    id: 'both-records',
    label: 'Independent signing + key establishment / records requested',
    algorithms: ['ML-DSA-65', 'ML-KEM-768'],
    signature: true,
    kem: true,
    interface: 'pkcs11',
    validationRecords: true,
  },
] as const

export interface PlanningTopic {
  id: string
  label: string
  required: boolean
}

export function getMigrationCase(id: string) {
  return MIGRATION_CASES.find((sample) => sample.id === id)
}

export function reviewContextKey(caseId: string, emRequested: boolean): string {
  return JSON.stringify([CASE_REVISION, caseId, emRequested])
}

export function vendorDraftKey(path: {
  vendorId: string
  currentFirmware: string
  targetFirmware: string
}): string {
  return JSON.stringify([path.vendorId, path.currentFirmware, path.targetFirmware])
}

/** Projects explicit fictional project requests; never infers intent or support from a vendor. */
export function buildPlanningTopics(caseId: string, emRequested: boolean): PlanningTopic[] {
  const sample = getMigrationCase(caseId)
  if (!sample) return []
  const topics: PlanningTopic[] = []
  const add = (id: string, label: string) => topics.push({ id, label, required: true })
  add(
    'configuration',
    'Identify the exact module, firmware, client, requested algorithms and configuration; compare documented support with this fictional case'
  )
  add(
    'randomness',
    'Identify RNG and entropy dependencies for the selected operations; which configuration, health checks and evidence would your tools expose?'
  )
  add(
    'threat-scope',
    'Define relevant physical and threat scope: which protections, tamper response and power/fault assessments does this case need, and what evidence supports them?'
  )
  add(
    'lifecycle',
    'Plan sample-key lifecycle and supported backup/recovery tests, including non-exportable keys and restoration limits'
  )
  add(
    'performance',
    'Define a workload and acceptance criteria, then plan measurements of the selected operations; no benchmark or SLA is established here'
  )
  if (sample.signature) {
    add(
      'sign-verify',
      'Plan ML-DSA-65 sign/verify checks, including altered-message and altered-signature rejection and operation errors'
    )
  }
  if (sample.kem) {
    add(
      'encapsulate-decapsulate',
      'Plan ML-KEM-768 encapsulation/decapsulation agreement checks and failed-operation handling'
    )
  }
  if (sample.interface === 'pkcs11') {
    if (sample.signature)
      add(
        'pkcs11-signature',
        'Evaluate the requested PKCS#11 3.2 signing interface, key attributes and client compatibility for ML-DSA-65; vendor support is not established'
      )
    if (sample.kem)
      add(
        'pkcs11-kem',
        'Evaluate the requested PKCS#11 3.2 C_EncapsulateKey / C_DecapsulateKey interface and key attributes for ML-KEM-768; vendor support is not established'
      )
  } else {
    add(
      'vendor-api',
      'Evaluate the documented vendor API for ML-KEM-768, key lifecycle, client compatibility and failure reporting; no PKCS#11 requirement is inferred'
    )
  }
  if (sample.validationRecords) {
    add(
      'module-record',
      'For this fictional project’s explicit records request, match the module certificate to the exact firmware, configuration and applicable scope'
    )
    for (const algorithm of sample.algorithms) {
      add(
        `algorithm-record-${algorithm}`,
        `For this fictional project’s explicit records request, identify the applicable ${algorithm} validation record and its exact parameter/configuration scope`
      )
    }
  }
  if (emRequested)
    add(
      'em-assessment',
      'For this fictional project’s explicit EM request, define the assessment scope and evidence to seek; no EM test is performed here'
    )
  return topics
}
