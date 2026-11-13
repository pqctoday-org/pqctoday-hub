// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The standard per-framework controls offered by the compliance checklist
 * builder. Kept in a plain module so the wording can be tested directly.
 */

export interface ChecklistItem {
  value: string
  label: string
  description: string
  reference: string
}

export const STANDARD_CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    value: 'inventory',
    label: 'Crypto inventory mapped to this framework',
    description:
      'Cryptographic assets in scope for this framework (algorithms, protocols, certificates, libraries) are identified and mapped to the requirement.',
    reference: 'NIST CSWP.39 §5 (asset-centric crypto inventory)',
  },
  {
    value: 'gap-analysis',
    label: 'Gap analysis vs framework requirements completed',
    description:
      "Current cryptographic posture is compared against the framework's requirements to identify enforcement gaps in tooling, configuration, and policy.",
    reference: 'NIST CSWP.39 §5.2 (Crypto Security Policy Enforcement)',
  },
  {
    value: 'pqc-dependency',
    label: 'Identified PQC dependency (KEM / signature)',
    description:
      'Algorithms in scope are flagged where the framework requires, or will require, a post-quantum key-establishment or signature replacement.',
    reference: 'NIST CSWP.39 §5.1 (standards, regulations, and mandates)',
  },
  {
    value: 'roadmap',
    label: 'Migration roadmap aligned with framework deadlines',
    description:
      "A migration plan exists with milestones that reach the framework's binding deadline, not just a directional intent.",
    reference: 'NIST CSWP.39 §5.1 (standards, regulations, and mandates)',
  },
  {
    value: 'evidence',
    label: 'Validation evidence collected for each scope (CMVP, CAVP, Common Criteria)',
    description:
      'Each evidence type is recorded against its own scope. A CMVP module certificate validates one named cryptographic module version and its approved functions. A NIST CAVP algorithm validation certifies one algorithm implementation, not a whole module. A Common Criteria certificate evaluates one product against its named Security Target. A local ACVP sample run is learning or functional testing, not a certificate. A local run or a Common Criteria record does not by itself establish that the claimed algorithm or module is validated.',
    reference: 'NIST CSWP.39 §5.1 (CAVP/CMVP as a validation prerequisite)',
  },
  {
    value: 'attestation',
    label: 'Attestation / sign-off from framework owner',
    description:
      'A named, accountable owner for this framework has reviewed and signed off on the checklist state.',
    reference: 'NIST CSWP.39 §5.1 (standards, regulations, and mandates)',
  },
]
