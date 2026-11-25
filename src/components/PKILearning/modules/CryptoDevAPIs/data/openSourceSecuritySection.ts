// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const OPEN_SOURCE_SECURITY_SECTION: SourcedSectionData = {
  id: 'open-source-security',
  title: 'Open-source software security for PQC libraries',
  lead: 'This section covers published guidance and regulatory documents on component selection, dependency tracking, vulnerability handling, and production readiness.',
  nice: [
    { id: 'K1374', statement: 'Knowledge of security best practices for open source software' },
  ],
  blocks: [
    {
      heading: 'Sourcing and evaluating open-source components',
      sentences: [
        {
          id: 'K1374-01',
          text: 'NIST SP 800-204D notes that pulling open-source packages based on developer or repository reputation gives no guarantee that the code matches what the developer authored.',
          sourceId: 'NIST-SP-800-204D',
          edition:
            'Strategies for the Integration of Software Supply Chain Security in DevSecOps CI/CD Pipelines, 2024-02',
          locator: 'Section 3.1.5 Types of Exploits, PDF page 19',
        },
        {
          id: 'K1374-02',
          text: 'NIST SP 800-204D says the security team should establish a policy for trusted OSS sources, such as allow-lists, that includes reviewing minimum coding requirements and reputational standards, and should approve the merging of unverified OSS sources.',
          sourceId: 'NIST-SP-800-204D',
          edition:
            'Strategies for the Integration of Software Supply Chain Security in DevSecOps CI/CD Pipelines, 2024-02',
          locator: 'Section 3.2.1 Baseline Security, PDF page 21',
        },
        {
          id: 'K1374-03',
          text: 'NIST SP 800-218 says to verify that acquired open-source components meet organizational requirements throughout their life cycles; one implementation example is ensuring that each component is actively maintained and has not reached end of life.',
          sourceId: 'NIST SP 800-218',
          edition: 'Secure Software Development Framework (SSDF) Version 1.1, 2022-02',
          locator: 'Table 1, Practice PW.4, Task PW.4.4, PDF page 22',
        },
        {
          id: 'K1374-04',
          text: 'The EU Cyber Resilience Act requires open-source software stewards to document a verifiable cybersecurity policy that fosters secure products and effective vulnerability handling, including documenting, addressing, and remediating vulnerabilities and promoting the sharing of information about discovered vulnerabilities within the community.',
          sourceId: 'EU-CRA-REG-2024-2847',
          edition: 'EU Cyber Resilience Act (CRA) — Regulation EU 2024/2847, 2024-10',
          locator: 'Article 24(1) Obligations of open-source software stewards, PDF page 45',
        },
      ],
    },
    {
      heading: 'Verifying packages and tracking dependencies',
      bridge:
        'Once an open-source component is selected, attention turns to inspecting its full dependency tree and recording its contents.',
      sentences: [
        {
          id: 'K1374-06',
          text: 'NIST SP 800-204D states that open-source dependencies must be enumerated, understood, and evaluated for policy, and says dependency file detectors should detect all dependencies, preferably with no limit on analyzed nested or transitive depth.',
          sourceId: 'NIST-SP-800-204D',
          edition:
            'Strategies for the Integration of Software Supply Chain Security in DevSecOps CI/CD Pipelines, 2024-02',
          locator: 'Section 5.1.4 Secure Code Commits, PDF page 29',
        },
        {
          id: 'K1374-08',
          text: 'NIST SP 800-204D recommends verifying digital signatures, running vulnerability scans, checking for recent updates on downloaded open-source packages, and generating an SBOM with dependency scanning on the first commit.',
          sourceId: 'NIST-SP-800-204D',
          edition:
            'Strategies for the Integration of Software Supply Chain Security in DevSecOps CI/CD Pipelines, 2024-02',
          locator: 'Section 3.2.1 Baseline Security, PDF page 21',
        },
        {
          id: 'K1374-07',
          text: 'NIST SP 800-161r1 states that if an enterprise requires an SBOM for an open-source project that lacks one, it needs to contribute SBOM generation or resources, or generate an SBOM upon first consuming each version.',
          sourceId: 'NIST-SP-800-161r1-upd1-Cybersecurity-Supply-Chain-Risk-Manag',
          edition:
            'NIST SP 800-161r1-upd1 — Cybersecurity Supply Chain Risk Management Practices for Systems and Organizations, 2022-05',
          locator:
            'Section CM-8(10) System Component Inventory | SBOMs for Open Source Projects, PDF page 109',
        },
      ],
    },
    {
      heading: 'Vulnerability handling and production readiness',
      bridge:
        'Long-term adoption also involves ongoing vulnerability tracking and checking whether a cryptographic library is ready for production use.',
      sentences: [
        {
          id: 'K1374-09',
          text: 'NIST SP 800-218 says to gather information from acquirers, users, and public sources on potential vulnerabilities and investigate credible reports; it gives automatically reviewing provenance and software-composition data as an implementation example.',
          sourceId: 'NIST SP 800-218',
          edition: 'Secure Software Development Framework (SSDF) Version 1.1, 2022-02',
          locator: 'Table 1, Practice RV.1, Task RV.1.1, PDF page 25',
        },
        {
          id: 'K1374-11',
          text: 'The EU Cyber Resilience Act requires manufacturers that identify a vulnerability in an integrated open-source component to report it to the maintainer and remediate it; where appropriate, manufacturers that develop a software or hardware modification must share the relevant code or documentation.',
          sourceId: 'EU-CRA-REG-2024-2847',
          edition: 'EU Cyber Resilience Act (CRA) — Regulation EU 2024/2847, 2024-10',
          locator: 'Article 13(6) Obligations of manufacturers, PDF page 36',
        },
        {
          id: 'K1374-13',
          text: 'The Open Quantum Safe oqs-provider documentation states that it is meant for testing experimental post-quantum cryptography, has not received auditing needed for high-security use, and does not recommend relying on it in production environments or to protect sensitive data.',
          sourceId: 'oqs-provider-OpenSSL-3-provider-containing-post-quantum-algo',
          edition: 'oqs-provider: OpenSSL 3 provider containing post-quantum algorithms',
          locator: 'General Disclaimer and Component Disclaimer',
        },
        {
          id: 'K1374-12',
          text: 'NIST FIPS 140-3 Implementation Guidance requires a cryptographic module’s ML-KEM implementation to show compliance with FIPS 203 and SP 800-227; in an approved ML-KEM hybrid scheme, a non-approved non-ML-KEM cannot be offered as an independent approved service, such as a separate API call in a software library.',
          sourceId: 'NIST-FIPS140-3-IG-PQC',
          edition:
            'Implementation Guidance for FIPS 140-3 and the Cryptographic Module Validation Program, 2026-08',
          locator: 'Section D.S Key Encapsulation Mechanisms, PDF page 223',
        },
      ],
    },
  ],
}
