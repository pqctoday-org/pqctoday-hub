// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const STATIC_CODE_ANALYSIS_SECTION: SourcedSectionData = {
  id: 'static-code-analysis',
  title: 'Performing static code analysis for cryptography',
  lead: 'This section examines how static code analysis fits into software development to locate cryptographic usage and feed tracking workflows. It also covers where automated source scanning reaches its limits and what complementary reviews are used alongside it.',
  nice: [{ id: 'S0883', statement: 'Skill in performing static code analysis' }],
  blocks: [
    {
      heading: 'What static code analysis covers in development',
      sentences: [
        {
          id: 'S0883-01',
          text: 'NIST SP 800-53 describes static code analysis as a security review method that checks code for weaknesses, identifies vulnerable or out-of-date included libraries, and can be used to enforce secure coding practices.',
          sourceId: 'NIST SP 800-53',
          edition: 'NIST SP 800-53 Rev. 5 - Security and Privacy Controls (Release 5.2.0), 2020-09',
          locator: 'Chapter 3, Control Enhancement SA-11(1) Static Code Analysis, PDF p. 304',
        },
        {
          id: 'S0883-02',
          text: 'According to NIST SP 800-53, static code analysis is most effective early in development, when each code change can automatically be scanned for potential weaknesses; it can provide clear remediation guidance and identify defects for developers to fix.',
          sourceId: 'NIST SP 800-53',
          edition: 'NIST SP 800-53 Rev. 5 - Security and Privacy Controls (Release 5.2.0), 2020-09',
          locator: 'Chapter 3, Control Enhancement SA-11(1) Static Code Analysis, PDF p. 304',
        },
      ],
    },
    {
      heading: 'Detecting cryptographic usage and building inventories',
      bridge:
        'Applied specifically to cryptography, automated code scanning helps surface vulnerable algorithms and populate cryptographic inventories.',
      sentences: [
        {
          id: 'S0883-05',
          text: 'NIST NCCoE SP 1800-38B demonstrates a code development pipeline that runs queries from a command-line tool, an IDE plugin, or pull-request automation to detect vulnerable algorithms in a codebase.',
          sourceId: 'NIST NCCoE SP 1800-38B',
          edition:
            'Migration to Post-Quantum Cryptography: Quantum Readiness — Cryptographic Discovery, 2023-12',
          locator: 'Section 4.1.1 Protecting the Code Development Pipeline, PDF p. 34',
        },
        {
          id: 'S0883-07',
          text: 'OMB M-26-15 recommends using Static/Dynamic Application Security Testing (SAST/DAST) to find cryptographic functions in code, alongside network scanners for protocols and cipher suites, to populate a central Cryptographic Bill of Materials (CBOM) for a real-time view of cryptographic posture.',
          sourceId: 'OMB-M-26-15',
          edition:
            'OMB Memorandum M-26-15 — Execution of the Migration to Post-Quantum Cryptography, 2026-06',
          locator: 'Section 6 Leveraging Automation for Discovery and Enforcement, PDF p. 9',
        },
      ],
    },
    {
      heading: 'Triaging findings and tracking progress',
      bridge:
        'Once scans surface cryptographic findings, published guidance describes how teams route those results into issue tracking, normalized reports, and monitoring dashboards.',
      sentences: [
        {
          id: 'S0883-10',
          text: "NIST SP 800-218 includes a task to perform code review or code analysis and to record and triage all discovered issues and recommended remediations in the development team's workflow or issue tracking system.",
          sourceId: 'NIST SP 800-218',
          edition: 'Secure Software Development Framework (SSDF) Version 1.1, 2022-02',
          locator: 'Table 1, Task PW.7.2, PDF p. 23',
        },
        {
          id: 'S0883-12',
          text: 'NIST NCCoE SP 1800-38B identifies the need for a common format to represent normalized discovery reports, noting that consolidating vulnerable algorithm discovery reports with other cybersecurity product reports enables enterprise-level risk management.',
          sourceId: 'NIST NCCoE SP 1800-38B',
          edition:
            'Migration to Post-Quantum Cryptography: Quantum Readiness — Cryptographic Discovery, 2023-12',
          locator:
            'Section 4.1.4 Common Output Elements for Identifying Vulnerable Systems, PDF p. 37',
        },
        {
          id: 'S0883-14',
          text: 'OMB M-26-15 says data from automated inventory and policy checks should, when possible, feed directly into continuous-monitoring dashboards that can track migration progress against agency timelines and provide leadership and compliance metrics.',
          sourceId: 'OMB-M-26-15',
          edition:
            'OMB Memorandum M-26-15 — Execution of the Migration to Post-Quantum Cryptography, 2026-06',
          locator: 'Section 6 Leveraging Automation for Discovery and Enforcement, PDF p. 9',
        },
      ],
    },
    {
      heading: 'Limits of static scanning and complementary checks',
      bridge:
        'Because not all cryptographic behavior is visible in static source code, planning also accounts for runtime visibility and manual review.',
      sentences: [
        {
          id: 'S0883-15',
          text: 'The OWASP CycloneDX CBOM guide notes that with cryptographic agility, algorithms are less commonly fixed in software and are instead configured during deployment or negotiated in each network protocol session.',
          sourceId: 'OWASP-CycloneDX-CBOM-Guide',
          edition: 'OWASP CycloneDX: CBOM Authoritative Guide, 2023-06',
          locator: "Section 'Identify quantum unsafe and weak cryptography'",
        },
        {
          id: 'S0883-16',
          text: "CERT-In's SBOM and QBOM guidelines describe a Runtime SBOM created by monitoring active software components during runtime to capture external interactions and dynamically loaded dependencies.",
          sourceId: 'IN-CERTIN-QBOM-Guidelines-2025',
          edition:
            'India CERT-In Technical Guidelines on SBOM, QBOM, CBOM, AIBOM, and HBOM v2.0, 2025',
          locator: 'Section 3.2.6, PDF p. 14',
        },
        {
          id: 'S0883-18',
          text: 'NIST SP 800-53 says manual code reviews identify weaknesses requiring application requirements or context generally unavailable to automated static and dynamic analysis and can review detailed cryptographic implementations.',
          sourceId: 'NIST SP 800-53',
          edition: 'NIST SP 800-53 Rev. 5 - Security and Privacy Controls (Release 5.2.0), 2020-09',
          locator: 'Chapter 3, Control Enhancement SA-11(4) Manual Code Reviews, PDF p. 305',
        },
      ],
    },
  ],
}
