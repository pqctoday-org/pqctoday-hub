// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const STATIC_DISCOVERY_SECTION: SourcedSectionData = {
  id: 'static-analysis-discovery',
  title: 'Static analysis within cryptographic discovery and testing',
  lead: 'This section introduces how static and filesystem analysis fit into cryptographic discovery and testing.',
  nice: [{ id: 'S0882', statement: 'Skill in performing static analysis' }],
  blocks: [
    {
      heading: 'What static and filesystem analysis inspect and report',
      sentences: [
        {
          id: 'S0882-01',
          text: 'In NIST NCCoE SP 1800-38B, filesystem scanning sensors detect quantum-vulnerable algorithms in software and scan binaries to discover algorithms for which source code might not be available.',
          sourceId: 'NIST NCCoE SP 1800-38B',
          edition:
            'Migration to Post-Quantum Cryptography: Quantum Readiness — Cryptographic Discovery, 2023-12',
          locator: 'Section 4.1.2 Operational Systems and Applications, PDF page 35',
        },
        {
          id: 'S0882-03',
          text: 'NIST NCCoE SP 1800-38B notes that non-executable filesystem artifacts include keystores and other formats holding public and private asymmetric keys, and password-based private-key encryption may affect discovery fidelity.',
          sourceId: 'NIST NCCoE SP 1800-38B',
          edition:
            'Migration to Post-Quantum Cryptography: Quantum Readiness — Cryptographic Discovery, 2023-12',
          locator: 'Section 3.2.2.2 Operational Systems and Applications, PDF page 23',
        },
        {
          id: 'S0882-02',
          text: 'NIST NCCoE SP 1800-38B describes scanning to detect vulnerable code in source code, files, and databases, normalizing static analysis tool output in SARIF as a standard format to streamline sharing results.',
          sourceId: 'NIST NCCoE SP 1800-38B',
          edition:
            'Migration to Post-Quantum Cryptography: Quantum Readiness — Cryptographic Discovery, 2023-12',
          locator: 'Section 4.1.4.2 Static Analysis, PDF pages 40-41',
        },
        {
          id: 'S0882-04',
          text: 'NIST NCCoE SP 1800-38B’s functional demonstration plan includes a COBOL use case to validate discovery of post-quantum-vulnerable algorithms and expects reports of cryptographic calls, parameters, line numbers, and metadata for display or CSV export.',
          sourceId: 'NIST NCCoE SP 1800-38B',
          edition:
            'Migration to Post-Quantum Cryptography: Quantum Readiness — Cryptographic Discovery, 2023-12',
          locator: 'Appendix D.2 Use Case 2, PDF pages 65-66',
        },
      ],
    },
    {
      heading: 'Combining static scanning with broader discovery',
      bridge:
        'The following points describe how filesystem and code scanning connect with other discovery sources and reporting workflows.',
      sentences: [
        {
          id: 'S0882-06',
          text: "CISA's discovery and inventory strategy says that ACDI tools, individually or in combination, provide network, file system, database system, and software package discovery, enabling discovery of encryption for data-in-transit and data-at-rest.",
          sourceId: 'US-CISA-ACDI-Strategy-2024',
          edition:
            'CISA Strategy for Migrating to Automated PQC Discovery and Inventory Tools, 2024-08',
          locator: 'Section 2 Approach, Data Collection via ACDI Tools, PDF page 5',
        },
        {
          id: 'S0882-05',
          text: 'NIST NCCoE SP 1800-38B defines descriptive data elements obtained from passive network observations, active network scans, endpoint monitoring, or configuration information, noting that consolidating discovery reports with other cybersecurity reports enables enterprise-level risk management.',
          sourceId: 'NIST NCCoE SP 1800-38B',
          edition:
            'Migration to Post-Quantum Cryptography: Quantum Readiness — Cryptographic Discovery, 2023-12',
          locator:
            'Section 4.1.4 Common Output Elements for Identifying Vulnerable Systems, PDF page 37',
        },
      ],
    },
    {
      heading: 'Planning for automated discovery gaps and partial results',
      bridge:
        'The final points outline how documented strategies account for tool scope, coverage limits, and incomplete discovery records.',
      sentences: [
        {
          id: 'S0882-10',
          text: 'OMB Memorandum M-23-02 states that the automated tooling strategy for assessing agency PQC adoption is expected to address discovery options for internet-accessible systems and internal systems that are not internet-accessible, while describing assessment-method limitations and gaps in automated capabilities or tools.',
          sourceId: 'OMB-M-23-02',
          edition: 'OMB Memorandum M-23-02 — Migrating to Post-Quantum Cryptography, 2022-11',
          locator: 'Section IV Report on Automated Cryptographic Assessment Process, PDF page 5',
        },
        {
          id: 'S0882-09',
          text: "CISA's discovery and inventory strategy notes that software packages with embedded cryptography, customized applications, and certain operating systems may not be discoverable by automated tools, so agencies may need to request algorithm and key-length details from vendors and maintain manual tracking.",
          sourceId: 'US-CISA-ACDI-Strategy-2024',
          edition:
            'CISA Strategy for Migrating to Automated PQC Discovery and Inventory Tools, 2024-08',
          locator: 'Section 2 Approach, Data Collection via Manual Means, PDF page 6',
        },
        {
          id: 'S0882-11',
          text: "The PQC Coalition's inventory workbook notes that partial information about post-quantum status is common and provides an “unknown / may need attention” status when a system's full algorithm range is not known, plus a PQC status notes field for partial or unclear cryptographic-algorithm details.",
          sourceId: 'PQCC-Inventory-Workbook-2025',
          edition: 'Post-Quantum Cryptography Coalition (PQCC) PQC Inventory Workbook, 2025-04',
          locator: 'Baseline Inventory sheet, Asset PQC Needs and PQC Status Notes',
        },
      ],
    },
  ],
}
