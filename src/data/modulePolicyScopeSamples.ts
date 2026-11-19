// SPDX-License-Identifier: AGPL-3.0-only
import type { SamplePolicyInputs } from '@/utils/policyContradictionEvaluator'

interface ModulePolicyScopeSample {
  clause: string
  covered: string
  outside: string
  operation: SamplePolicyInputs['useCase']
  shortRetentionYears: number
  longRetentionYears: number
  horizonYears: number
}

const samples: ReadonlyMap<string, ModulePolicyScopeSample> = new Map([
  [
    'compliance-strategy',
    {
      clause:
        'The fictional procurement addendum sets a 2030 key-exchange milestone for the contracted customer archive service.',
      covered: 'Customer archive service on the signed schedule',
      outside: 'Regional archive contract without the addendum',
      operation: 'key-establishment',
      shortRetentionYears: 3,
      longRetentionYears: 10,
      horizonYears: 8,
    },
  ],
  [
    'pqc-risk-management',
    {
      clause:
        'The fictional risk committee sets a 2030 key-exchange milestone for the backup replication service. A signed exception removes that milestone for the named standby system only.',
      covered: 'Primary replication service',
      outside: 'Standby replication service named in the exception',
      operation: 'key-establishment',
      shortRetentionYears: 2,
      longRetentionYears: 12,
      horizonYears: 8,
    },
  ],
  [
    'healthcare-pqc',
    {
      clause:
        'The fictional hospital network policy sets a 2030 milestone for replacing classical key exchange on clinical image transfers to its contracted archival service.',
      covered: 'Clinical transfer to the contracted archive',
      outside: 'Research transfer under a separate agreement',
      operation: 'key-establishment',
      shortRetentionYears: 2,
      longRetentionYears: 14,
      horizonYears: 9,
    },
  ],
  [
    'web-gateway-pqc',
    {
      clause:
        'The fictional edge migration milestone requires a production origin link to migrate its key exchange by 2030. An independent evidence record is needed for each TLS leg.',
      covered: 'Edge-to-origin production TLS link',
      outside: 'Developer-only staging TLS link',
      operation: 'key-establishment',
      shortRetentionYears: 1,
      longRetentionYears: 8,
      horizonYears: 6,
    },
  ],
  [
    'software-supply-chain-pqc',
    {
      clause:
        'The fictional release policy sets a 2030 signature migration milestone for production packages published to customers.',
      covered: 'Production package distributed to customers',
      outside: 'Unsigned nightly artifact on an internal test runner',
      operation: 'signature',
      shortRetentionYears: 1,
      longRetentionYears: 10,
      horizonYears: 8,
    },
  ],
  [
    'code-signing',
    {
      clause:
        'The fictional platform signing policy sets a 2030 milestone for signing public update manifests with an approved post-quantum signature algorithm.',
      covered: 'Public desktop updater manifest',
      outside: 'Disposable integration-test manifest with its own policy',
      operation: 'signature',
      shortRetentionYears: 1,
      longRetentionYears: 10,
      horizonYears: 8,
    },
  ],
])

export function modulePolicyScopeSample(moduleId: string | undefined) {
  return moduleId ? samples.get(moduleId) : undefined
}
