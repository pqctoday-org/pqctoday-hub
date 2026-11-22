// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const SECURE_DELIVERY_SECTION: SourcedSectionData = {
  id: 'secure-software-delivery',
  title: 'Secure software delivery during the PQC transition',
  lead: 'This section examines published guidance on software-delivery pipelines, cryptographic discovery, inventory reporting, and ongoing toolchain and policy management during the PQC transition.',
  blocks: [
    {
      heading: 'Integrity controls across build and deployment pipelines',
      sentences: [
        {
          id: 'SSD-16',
          text: 'NIST SP 800-204D recommends that project maintainers run automated checks, such as unit tests, linters, and integrity tests, on all artifacts covered in a change being pushed to a repository.',
          sourceId: 'NIST-SP-800-204D',
          edition:
            'Strategies for the Integration of Software Supply Chain Security in DevSecOps CI/CD Pipelines, 2024-02',
          locator:
            'Section 5.1.2 (Secure Pull-Push Operations on Repositories, PULL-PUSH_REQ-1), PDF page 27',
        },
        {
          id: 'SSD-02',
          text: 'NIST SP 800-204D states that build attestations must be cryptographically signed using a secure key and kept in a tamper-proof storage location protected with robust access control.',
          sourceId: 'NIST-SP-800-204D',
          edition:
            'Strategies for the Integration of Software Supply Chain Security in DevSecOps CI/CD Pipelines, 2024-02',
          locator: 'Section 5.1.1 (Secure Build), PDF page 26',
        },
        {
          id: 'SSD-03',
          text: 'For continuous deployment pipelines, NIST SP 800-204D recommends having evidence that container images were scanned and attested for vulnerability findings, with the ability to allow or block deployment based on organization-defined policies.',
          sourceId: 'NIST-SP-800-204D',
          edition:
            'Strategies for the Integration of Software Supply Chain Security in DevSecOps CI/CD Pipelines, 2024-02',
          locator: 'Section 5.2 (Securing Workflows in CD Pipelines, DEPLOY_REQ-4), PDF page 30',
        },
        {
          id: 'SSD-01',
          text: 'NIST SP 800-218 recommends making software integrity verification information available to software acquirers, such as posting cryptographic hashes for release files or using an established certificate authority for code signing.',
          sourceId: 'NIST SP 800-218',
          edition: 'Secure Software Development Framework (SSDF) Version 1.1, 2022-02',
          locator: 'Table 1 (PS.2.1), PDF page 19',
        },
        {
          id: 'SSD-04',
          text: 'In its GitOps deployment case study, NIST SP 800-204D recommends not applying changes manually at runtime, instead updating the relevant code and triggering a new release so Git commits remain the single source of truth.',
          sourceId: 'NIST-SP-800-204D',
          edition:
            'Strategies for the Integration of Software Supply Chain Security in DevSecOps CI/CD Pipelines, 2024-02',
          locator:
            'Section 5.2.1 (Secure CD Pipeline — Case Study (GitOps), GitOps-REQ-3), PDF page 31',
        },
      ],
    },
    {
      heading: 'Discovering vulnerable cryptography and its blind spots',
      bridge:
        'Alongside pipeline integrity controls, published guidance outlines how discovery tools locate vulnerable cryptography across code, binaries, and supporting files, as well as where automated scans fall short.',
      sentences: [
        {
          id: 'SSD-06',
          text: 'NIST NCCoE SP 1800-38B describes scanning codebases for vulnerable cryptography both in existing cloud or on-premises repositories and before each pull or merge request in active development to flag issues before code is merged.',
          sourceId: 'NIST NCCoE SP 1800-38B',
          edition:
            'Migration to Post-Quantum Cryptography: Quantum Readiness — Cryptographic Discovery, 2023-12',
          locator: 'Section 3.2.2 (Project Execution of Example Scenario in Our Lab), PDF page 21',
        },
        {
          id: 'SSD-07',
          text: 'In its demonstration, NIST NCCoE SP 1800-38B identifies a need for vulnerable-algorithm discovery tools to scan source code, files, and databases, and it normalizes static-analysis results in SARIF.',
          sourceId: 'NIST NCCoE SP 1800-38B',
          edition:
            'Migration to Post-Quantum Cryptography: Quantum Readiness — Cryptographic Discovery, 2023-12',
          locator: 'Section 4.1.4.2 (Static Analysis), PDF pages 40-41',
        },
        {
          id: 'SSD-08',
          text: 'NIST NCCoE SP 1800-38B explains that filesystem scanning sensors detect quantum-vulnerable algorithms in software and also scan binaries to discover algorithms when source code may not be available.',
          sourceId: 'NIST NCCoE SP 1800-38B',
          edition:
            'Migration to Post-Quantum Cryptography: Quantum Readiness — Cryptographic Discovery, 2023-12',
          locator: 'Section 4.1.2 (Operational Systems and Applications), PDF page 35',
        },
        {
          id: 'SSD-10',
          text: 'NIST NCCoE SP 1800-38B notes that non-executable files such as keystores may contain asymmetric keys and that formats supporting password-based encryption of private keys may affect the fidelity of cryptographic discovery results.',
          sourceId: 'NIST NCCoE SP 1800-38B',
          edition:
            'Migration to Post-Quantum Cryptography: Quantum Readiness — Cryptographic Discovery, 2023-12',
          locator: 'Section 3.2.2.2 (Operational Systems and Applications), PDF page 23',
        },
        {
          id: 'SSD-09',
          text: "CISA's ACDI Strategy notes that software packages with embedded cryptography, customized applications, or certain operating systems may not be discoverable by automated tools, so agencies may need to request algorithm and key length details from vendors.",
          sourceId: 'US-CISA-ACDI-Strategy-2024',
          edition:
            'CISA Strategy for Migrating to Automated PQC Discovery and Inventory Tools, 2024-08',
          locator: 'Section 2 (Data Collection via Manual Means), PDF page 6',
        },
      ],
    },
    {
      heading: 'Inventory reporting and format constraints',
      bridge:
        'Turning discovery findings into usable inventories also involves formal reporting expectations and inconsistent tool output formats.',
      sentences: [
        {
          id: 'SSD-11',
          text: 'OMB M-23-02 directs federal agencies to submit a prioritized inventory of information systems and assets, excluding national security systems, that contain CRQC-vulnerable cryptographic systems by May 4, 2023, and annually thereafter until 2035.',
          sourceId: 'OMB-M-23-02',
          edition: 'OMB Memorandum M-23-02 — Migrating to Post-Quantum Cryptography, 2022-11',
          locator: 'Section II.A (Requirements), PDF page 2',
        },
        {
          id: 'SSD-12',
          text: 'OMB M-23-02 requires agencies to report each actively used CRQC-vulnerable cryptographic system, including the service provided by the cryptographic system and the length of associated cryptographic keys or modules.',
          sourceId: 'OMB-M-23-02',
          edition: 'OMB Memorandum M-23-02 — Migrating to Post-Quantum Cryptography, 2022-11',
          locator: 'Section II.A (Requirements), PDF page 3',
        },
        {
          id: 'SSD-13',
          text: "CISA's ACDI Strategy states that most of the nine data items requested by OMB M-23-02 cannot be detected or collected using currently available automated tools, though three may be collected using ACDI or CDM.",
          sourceId: 'US-CISA-ACDI-Strategy-2024',
          edition:
            'CISA Strategy for Migrating to Automated PQC Discovery and Inventory Tools, 2024-08',
          locator: 'Section 2 (Inventory Data Items for Reporting), PDF page 4',
        },
        {
          id: 'SSD-15',
          text: 'For the discovery platforms used in its demonstration, NIST NCCoE SP 1800-38B found their reports lacked a common format and identified XML or JSON formats supported by each platform.',
          sourceId: 'NIST NCCoE SP 1800-38B',
          edition:
            'Migration to Post-Quantum Cryptography: Quantum Readiness — Cryptographic Discovery, 2023-12',
          locator:
            'Section 4.1.4 (Common Output Elements for Identifying Vulnerable Systems), PDF page 37',
        },
      ],
    },
    {
      heading: 'Planning for toolchain maintenance and policy-driven updates',
      bridge:
        'Looking ahead to ongoing algorithm transitions, guidance also addresses decoupling cryptography from applications, maintaining delivery toolchains, and automating policy updates.',
      sentences: [
        {
          id: 'SSD-05',
          text: 'NIST CSWP 39 explains that service mesh and sidecar proxies in cloud-native environments abstract cryptographic operations from application workloads, enabling organizations to update cryptographic libraries, manage key rotation, and introduce new algorithms with minimal disruption to running services.',
          sourceId: 'NIST CSWP 39',
          edition: 'Considerations for Achieving Crypto Agility: Strategies and Practices, 2025-12',
          locator: 'Section 4.3 (Using Service Mesh in Cloud-Native Environments), PDF page 23',
        },
        {
          id: 'SSD-17',
          text: 'For maintaining toolchains, NIST SP 800-218 lists practices including updating, upgrading, or replacing tools to address vulnerabilities or add capabilities, and continuously monitoring tools and tool logs for policy violations and anomalous behavior.',
          sourceId: 'NIST SP 800-218',
          edition: 'Secure Software Development Framework (SSDF) Version 1.1, 2022-02',
          locator: 'Table 1 (PO.3.2), PDF page 16',
        },
        {
          id: 'SSD-18',
          text: 'NIST CSWP 39 says enterprise tools should automate identifying, assessing, characterizing, enforcing, and monitoring cryptography across assets, while a cryptographic policy-informed risk assessment engine continuously measures, monitors, and reports enterprise cryptography.',
          sourceId: 'NIST CSWP 39',
          edition: 'Considerations for Achieving Crypto Agility: Strategies and Practices, 2025-12',
          locator:
            'Section 5 (Crypto Agility Strategic Plan for Managing Organizations’ Crypto Risks), PDF page 28',
        },
        {
          id: 'SSD-19',
          text: 'NIST CSWP 39 states that decisions on deprecating a cryptographic algorithm must be synchronized among stakeholders so security policies can be updated quickly and translated into technology-specific, machine-consumable configuration profiles representing a crypto policy.',
          sourceId: 'NIST CSWP 39',
          edition: 'Considerations for Achieving Crypto Agility: Strategies and Practices, 2025-12',
          locator: 'Section 5.2 (Crypto Security Policy Enforcement), PDF page 30',
        },
      ],
    },
  ],
}
