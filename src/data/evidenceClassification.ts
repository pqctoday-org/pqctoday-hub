// SPDX-License-Identifier: AGPL-3.0-only

export type ToolEvidenceClass =
  'real-crypto' | 'protocol-model' | 'calculator' | 'deterministic-demo' | 'synthetic-simulation'

export const EVIDENCE_CLASS_LABEL: Record<ToolEvidenceClass, string> = {
  'real-crypto': 'Real cryptography',
  'protocol-model': 'Protocol model',
  calculator: 'Calculator',
  'deterministic-demo': 'Deterministic demonstration',
  'synthetic-simulation': 'Simulation',
}

export const NON_CERTIFICATION_NOTICE =
  'Educational evidence only. This run is not an ACVP/CAVP result, CMVP module validation, product certification, interoperability approval, or deployment authorization.'
