// SPDX-License-Identifier: AGPL-3.0-only
import type { VerifyState } from '@/components/BusinessCenter/tools/MigrationVerification'

/** Planned requirements in a fictional case; no completed test or retirement is asserted. */
export function plannedVerificationSample(): VerifyState {
  return {
    records: [
      {
        id: 'planned-portal',
        system: 'Customer portal — planned connection checks; no test results recorded',
        evidence: {
          observedNegotiation: '',
          negativeTest: '',
          certChainUnderPqc: '',
          downgradeDocumented: '',
          dossierLink: '',
        },
      },
    ],
    decommissions: [
      {
        id: 'planned-retirement',
        material: 'Legacy signing keys — retirement decision pending',
        kind: 'signing-key',
        retiredDate: '',
        owner: 'Proposed owner: PKI team',
        method:
          'Plan retirement, recovery obligations and key-destruction controls before execution',
        confirmed: false,
      },
    ],
    closure: {
      decision:
        'Sample planning only. Define future service-specific verification and closure requirements before programme approval. Connection checks do not cover archive recovery or software signature verification.',
      signOffBy: '',
      signOffDate: '',
      bauOwners: {
        Discovery: 'Proposed: Security Engineering',
        CBOM: 'Proposed: Platform Engineering',
        Risk: 'Proposed: GRC',
        'Vendor governance': 'Proposed: Procurement and GRC',
      },
    },
  }
}
