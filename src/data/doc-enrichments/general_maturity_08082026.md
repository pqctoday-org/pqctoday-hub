---
generated: 2026-08-08
category: Technical Standards
document_count: 6
requirement_count: 24
---

## BIS-Paper-158
- **Source**: BIS Paper 158 — Quantum-Readiness Roadmap for Financial Systems
- **URL**: https://www.bis.org/publ/bppdf/bispap158.pdf
- **Requirement count**: 2
- **Governance**:
    - _T2 Risk-Informed · all_: Implement robust governance structures to support the transition to quantum-safe cryptographic infrastructures.
- **Inventory**:
    - _T2 Risk-Informed · all_: Maintain comprehensive cryptographic inventories as a critical foundation for quantum-readiness.

## CMMC-L2-Scoping-Guide
- **Source**: CMMC Level 2 Scoping Guidance
- **URL**: https://dodcio.defense.gov/Portals/0/Documents/CMMC/ScopingGuideL2v2.pdf
- **Requirement count**: 4
- **Governance**:
    - _T2 Risk-Informed · all_: Document all in-scope assets in an asset inventory and provide a network diagram of the CMMC Assessment Scope.
    - _T2 Risk-Informed · all_: Document the treatment of CUI, Security Protection, CRMAs, and Specialized Assets in the System Security Plan (SSP).
    - _T2 Risk-Informed · all_: Manage Contractor Risk Managed Assets using the organization's risk-based information security policy, procedures, and practices.
    - _T2 Risk-Informed · all_: Justify the inability of Out-of-Scope Assets to store, process, or transmit CUI.

## DFARS-252.204-7012
- **Source**: DFARS 252.204-7012: Safeguarding Covered Defense Information and Cyber Incident Reporting
- **URL**: https://www.acquisition.gov/dfars/252.204-7012-safeguarding-covered-defense-information-and-cyber-incident-reporting.
- **Requirement count**: 1
- **Governance**:
    - _T3 Repeatable · certificates_: Contractor or subcontractor shall have or acquire a DoD-approved medium assurance certificate to report cyber incidents.

## DFARS-252.204-7020
- **Source**: DFARS 252.204-7020: NIST SP 800-171 DoD Assessment Requirements
- **URL**: https://www.acquisition.gov/dfars/252.204-7020-nist-sp-800-171dod-assessment-requirements.
- **Requirement count**: 3
- **Governance**:
    - _T3 Repeatable · all_: Insert the substance of this clause, including paragraph (g), in all subcontracts and other contractual instruments.
    - _T3 Repeatable · all_: Do not award a subcontract subject to NIST SP 800-171 unless the subcontractor has completed a Basic Assessment within the last 3 years.
    - _T3 Repeatable · all_: Provide access to facilities, systems, and personnel necessary for the Government to conduct a Medium or High NIST SP 800-171 DoD Assessment.

## FIPS-198
- **Source**: FIPS 198-1, The Keyed-Hash Message Authentication Code (HMAC)
- **URL**: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.198-1.pdf
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T2 Risk-Informed · software_: Ensure modules containing HMAC implementations are designed and built in a secure manner.
    - _T3 Repeatable · libraries_: Implement HMAC using cryptographic algorithms and key management techniques approved for protecting Federal government sensitive information.
    - _T3 Repeatable · libraries_: Use an Approved cryptographic hash function for HMAC calculations.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Ensure keys used for HMAC applications are not used for other purposes.
    - _T3 Repeatable · keys_: Hash keys longer than the block size using the Approved hash function before use in HMAC.
    - _T3 Repeatable · keys_: Use only the leftmost bits of the HMAC output when truncation is applied.

## GSMA-PQ02
- **Source**: GSMA PQ.02: Guidelines for Quantum Risk Management for Telco
- **URL**: https://www.gsma.com/solutions-and-impact/technologies/security/post-quantum-cryptography-documents/
- **Requirement count**: 8
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Perform a Quantum Cryptanalytic Risk Assessment (QCRA) to prioritise critical systems and data.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish an organisation-wide governance process to manage quantum risk.
    - _T2 Risk-Informed · all_: Identify an executive owner and update roles and responsibilities to include quantum risk.
    - _T2 Risk-Informed · all_: Build board-level awareness of the quantum risk.
    - _T2 Risk-Informed · all_: Integrate Quantum risk into Enterprise Risk Management (ERM).
- **Inventory**:
    - _T2 Risk-Informed · all_: Determine the organisation’s current cryptographic estate.
    - _T2 Risk-Informed · all_: Determine the organisation’s data assets, data protection requirements, and data longevity.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Create a transition plan based on the Quantum Cryptanalytic Risk Assessment (QCRA).
