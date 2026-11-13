---
generated: 2026-11-12
category: Standardization Bodies
document_count: 5
requirement_count: 32
---

## ETSI TR 103 619
- **Source**: Migration Strategies and Recommendations for Quantum-Safe Schemes
- **URL**: https://www.etsi.org/deliver/etsi_tr/103600_103699/103619/01.01.01_60/tr_103619v010101p.pdf
- **Requirement count**: 4
- **Governance**:
    - _T2 Risk-Informed · all_: Organizations should follow a documented, staged migration framework and maintain a migration plan covering inventory, plan preparation, and execution toward a fully quantum safe state.
    - _T2 Risk-Informed · all_: Define explicit start and target end states for migration (non-quantum-safe state to FQSCS) and base the migration plan on the discovered inventory.
- **Inventory**:
    - _T2 Risk-Informed · all_: Compile an inventory of all cryptographic assets and processes in the system, including hardware and software forms, as the first stage of migration planning.
    - _T3 Repeatable · all_: Inventory must capture hidden cryptographic dependencies, including dependencies on organizational assets and specific hardware or software infrastructures.

## NIST CSWP 39
- **Source**: Considerations for Achieving Crypto Agility: Strategies and Practices
- **URL**: https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.39-upd1.pdf
- **Requirement count**: 8
- **Governance**:
    - _T2 Risk-Informed · all_: Treat cryptographic transitions (algorithm replacement or implementation swaps) as an integral part of the organization-wide risk management program, not as ad hoc events.
    - _T2 Risk-Informed · all_: Adopt crypto agility as a key practice at all organizational levels, from algorithms through enterprise architectures, to enable smooth future cryptographic transitions.
    - _T3 Repeatable · all_: Executives should develop a strategic and tactical crypto agility plan integrated into the overall risk management framework, so that employees, partners, and suppliers involved in cryptographic design, implementation, acquisition, deploym…
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Plan for backward-compatibility needs and allow longer transition periods where applications lack crypto agility, while limiting continued use of deprecated algorithms to defined circumstances.
    - _T2 Risk-Informed · all_: Plan for multi-year algorithm deprecation timelines: track published deadlines (e.g., SHA-1 complete transition by end of 2030; Triple DES disallowed in 2024) and phase out accordingly.
    - _T3 Repeatable · all_: Enterprise architecture must enable seamless, rapid transition away from vulnerable algorithms to stronger ones without significant infrastructure changes or unnecessary disruption.
    - _T3 Repeatable · libraries_: Systems must be able to adopt new algorithms and stop using vulnerable algorithms in applications without disrupting the running system.
    - _T3 Repeatable · software_: Design systems so cryptographic algorithms can be changed over the system lifetime, avoiding implementations that make maintenance and addition of new algorithms hard to accomplish.

## NIST IR 8547
- **Source**: Transition to Post-Quantum Cryptography Standards
- **URL**: https://nvlpubs.nist.gov/nistpubs/ir/2026/NIST.IR.8547.pdf
- **Requirement count**: 6
- **Governance**:
    - _T2 Risk-Informed · all_: Execute a risk-prioritized migration to PQC, migrating the most sensitive systems first (key establishment by 2030, digital signatures by 2031) and mitigating as much quantum risk as feasible by end of 2030.
    - _T2 Risk-Informed · all_: Engage with industry, standards organizations, and agencies (e.g., via NCCoE Migration to PQC project) to develop a clear roadmap and realistic transition timeline.
    - _T4 Adaptive · all_: Build long-term cryptographic agility into organizational infrastructure so algorithms can be updated seamlessly as post-quantum standards evolve.
- **Inventory**:
    - _T2 Risk-Informed · all_: Begin the PQC migration with cryptographic inventories, migration planning, and early deployments of PQC-enabled products and services, treating migration as a current operational priority.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Plan for careful deprecation and eventual removal of quantum-vulnerable algorithms (e.g., RSA, ECDSA, EdDSA, ECC key establishment) from infrastructure alongside adoption of PQC algorithms.
    - _T3 Repeatable · keys_: When using stateful hash-based signatures, enforce strict operational controls to track signature indices across distributed systems so no one-time key signs more than one message; restrict use to cases like software/firmware signing.

## NSA CNSA 2.0
- **Source**: Announcing the Commercial National Security Algorithm Suite 2.0
- **URL**: https://media.defense.gov/2025/May/30/2003728741/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS.PDF
- **Requirement count**: 9
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Approving Officials must measure CNSA compliance in the RMF process under SC-12 and verify CNSA 2.0 compliance for software- and firmware-signing.
    - _T3 Repeatable · libraries_: Ensure software and hardware providing cryptographic services have NIAP or NSA validation in addition to meeting the applicable CNSA version requirements.
    - _T3 Repeatable · libraries_: Assess NSS solutions as NSA-approved rather than FIPS-validated; accept commercial products that are NIAP-validated against an approved protection profile and configured per CNSSP 15 and related guidance.
- **Governance**:
    - _T2 Risk-Informed · all_: Use only cryptographic algorithms approved by the National Manager on NSS; any unapproved algorithm requires a waiver specific to the algorithm, implementation, and use case.
    - _T2 Risk-Informed · all_: Plan, prepare, and budget now for transition to quantum-resistant algorithms to protect NSS and related assets.
    - _T2 Risk-Informed · all_: Continue complying with CNSA 1.0 until CNSA 2.0 requirements are mandated, while building toward the QR algorithm requirements.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Prefer CNSA 2.0 algorithms in system configuration during transition, and exclusively use them by class-specific deadlines (2030–2033); CNSA 1.0 algorithms alone will no longer be approved.
    - _T3 Repeatable · keys_: Manage signing-key state for stateful hash-based signatures and implement signing in hardware, meeting all SP 800-208 requirements.
- **Observability**:
    - _T3 Repeatable · all_: NSS owners and operators must report on progress updating to CNSA 1.0 and CNSA 2.0 as part of NSM-8 and NSM-10 responsibilities.

## RFC-9958
- **Source**: RFC 9958
- **URL**: https://datatracker.ietf.org/doc/rfc9958/
- **Requirement count**: 5
- **Governance**:
    - _T2 Risk-Informed · all_: Plan staged PQC migrations that let upgraded and non-upgraded agents coexist and interoperate, coordinating across organizations and ecosystems.
    - _T2 Risk-Informed · all_: Proactively assess and evaluate available PQC technologies and take a careful approach to product development and deployment as part of transition engineering.
    - _T2 Risk-Informed · all_: Align PQC migration planning with national guidance (e.g., NSA CNSA 2.0, BSI PQC recommendations, NIST) while noting jurisdictional differences in algorithm profiles.
    - _T2 Risk-Informed · software_: Engineers must understand the security/performance trade-offs of PQC algorithms and ensure backward compatibility with current systems where needed when implementing PQC.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Account for protocol and infrastructure redesign when adopting PQC, since differences in key sizes and resource use make migration more than one-for-one algorithm replacement.
