// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const TAILORING_CODE_ANALYSIS_SECTION: SourcedSectionData = {
  id: 'tailoring-code-analysis',
  title: 'Tailoring code analysis to find cryptography',
  lead: 'This section examines the cryptographic patterns that analysis tools search for, how detection rules can be tailored, how teams handle false positives, and how automated checks fit into development workflows.',
  nice: [{ id: 'S0382', statement: 'Skill in tailoring code analysis' }],
  blocks: [
    {
      heading: 'What code analysis looks for',
      sentences: [
        {
          id: 'S0382-12',
          text: 'NIST SP 800-131A Revision 3 states that large-scale quantum computers will threaten NIST-approved public-key algorithms, so digital signature schemes and Diffie-Hellman, MQV, and RSA key establishment will need quantum-resistant replacements.',
          sourceId: 'NIST-SP-800-131A-Rev3',
          edition:
            'Transitioning the Use of Cryptographic Algorithms and Key Lengths (Rev 3), 2024-10',
          locator:
            'Section 1.2.3, Transition Strategy from the 112-Bit Security Strength, PDF p. 13',
        },
        {
          id: 'S0382-13',
          text: "NIST SP 800-131A Revision 3 notes that an algorithm's approval status often depends on its key length or strength, its domain parameters, and the mode or manner of use.",
          sourceId: 'NIST-SP-800-131A-Rev3',
          edition:
            'Transitioning the Use of Cryptographic Algorithms and Key Lengths (Rev 3), 2024-10',
          locator: 'Section 1.2.2, Definition of Status Approval Terms, PDF p. 12',
        },
        {
          id: 'S0382-15',
          text: 'NIST NCCoE SP 1800-38B notes that existing cryptographic CWEs include CWE-327 for broken or risky cryptographic algorithms and CWE-326 for inadequate encryption strength.',
          sourceId: 'NIST NCCoE SP 1800-38B',
          edition:
            'Migration to Post-Quantum Cryptography: Quantum Readiness — Cryptographic Discovery, 2023-12',
          locator: 'Section 3.4.2, Vulnerabilities, PDF p. 28',
        },
        {
          id: 'S0382-14',
          text: 'The OWASP Secrets Management Cheat Sheet observes that many organizations leave API keys, database credentials, SSH keys, and certificates hardcoded in plaintext inside source code and configuration files.',
          sourceId: 'Secrets-Management-OWASP-Cheat-Sheet-Series',
          edition: 'Secrets Management - OWASP Cheat Sheet Series',
          locator: 'Section 1, Introduction (web text, no PDF page numbers)',
        },
        {
          id: 'S0382-11',
          text: 'In the NIST NCCoE SP 1800-38B IDE demonstration, discovery tools identify files and lines of code making post-quantum vulnerable cryptographic API calls such as RSA and ECDSA.',
          sourceId: 'NIST NCCoE SP 1800-38B',
          edition:
            'Migration to Post-Quantum Cryptography: Quantum Readiness — Cryptographic Discovery, 2023-12',
          locator: 'Appendix D.4, Use Case 4, PDF pp. 66–67',
        },
      ],
    },
    {
      heading: 'Customizing queries, configurations, and signatures',
      bridge:
        'Once the cryptographic targets are clear, analysis tools can be configured to search for specific calls and secret formats.',
      sentences: [
        {
          id: 'S0382-01',
          text: 'In the NIST NCCoE SP 1800-38B pipeline demonstration, an analyst can extract data from an existing codebase to create a queryable database and execute a query that detects vulnerable algorithm usage.',
          sourceId: 'NIST NCCoE SP 1800-38B',
          edition:
            'Migration to Post-Quantum Cryptography: Quantum Readiness — Cryptographic Discovery, 2023-12',
          locator: 'Section 4.1.1, Protecting the Code Development Pipeline, PDF p. 34',
        },
        {
          id: 'S0382-02',
          text: 'In the NIST NCCoE SP 1800-38B COBOL use case, users update a JSON configuration file to identify the cryptographic calls they want to search for when discovering post-quantum vulnerable algorithms.',
          sourceId: 'NIST NCCoE SP 1800-38B',
          edition:
            'Migration to Post-Quantum Cryptography: Quantum Readiness — Cryptographic Discovery, 2023-12',
          locator: 'Appendix D.3, Use Case 3, PDF p. 66',
        },
        {
          id: 'S0382-03',
          text: 'The OWASP Secrets Management Cheat Sheet states that because many types of secrets exist, organizations should consider detection signatures for each type to achieve accurate detection.',
          sourceId: 'Secrets-Management-OWASP-Cheat-Sheet-Series',
          edition: 'Secrets Management - OWASP Cheat Sheet Series',
          locator: 'Section 8.2, Types of secrets to be detected (web text, no PDF page numbers)',
        },
        {
          id: 'S0382-04',
          text: 'The OWASP Secrets Management Cheat Sheet recommends evaluating detection utilities and their signatures often and correlating results from more than one tool to identify detection weaknesses.',
          sourceId: 'Secrets-Management-OWASP-Cheat-Sheet-Series',
          edition: 'Secrets Management - OWASP Cheat Sheet Series',
          locator: 'Section 8.1, General detection approaches (web text, no PDF page numbers)',
        },
      ],
    },
    {
      heading: 'Balancing detection accuracy and alert fatigue',
      bridge:
        'Broader rules surface more potential issues, which raises the question of how teams separate real findings from noise.',
      sentences: [
        {
          id: 'S0382-06',
          text: 'NIST SP 800-204D states that code analysis tools should be implemented to catch common mistakes while avoiding inundating developers with too many false positives that cause alert fatigue.',
          sourceId: 'NIST-SP-800-204D',
          edition:
            'Strategies for the Integration of Software Supply Chain Security in DevSecOps CI/CD Pipelines, 2024-02',
          locator: 'Section 3.2.2, Controls for Interacting With SCM Systems, PDF p. 21',
        },
        {
          id: 'S0382-09',
          text: 'NIST NCCoE SP 1800-38B notes that weaknesses associated with future vulnerabilities from a quantum threat only manifest if certain conditions are met, creating the potential for many false positives.',
          sourceId: 'NIST NCCoE SP 1800-38B',
          edition:
            'Migration to Post-Quantum Cryptography: Quantum Readiness — Cryptographic Discovery, 2023-12',
          locator: 'Section 3.4.2, Vulnerabilities, PDF p. 28',
        },
        {
          id: 'S0382-07',
          text: 'The OWASP Secrets Management Cheat Sheet notes that consistently formatted secrets are easier to detect with lower false-positive rates, but detection rules can miss a human-created password that does not match them.',
          sourceId: 'Secrets-Management-OWASP-Cheat-Sheet-Series',
          edition: 'Secrets Management - OWASP Cheat Sheet Series',
          locator: 'Section 8.1, General detection approaches (web text, no PDF page numbers)',
        },
        {
          id: 'S0382-08',
          text: 'NIST SP 800-218 gives the example of using a static analysis tool to automatically check code for vulnerabilities and compliance with secure coding standards, with a human reviewing reported issues and remediating them as necessary.',
          sourceId: 'NIST SP 800-218',
          edition: 'Secure Software Development Framework (SSDF) Version 1.1, 2022-02',
          locator: 'Practice PW.7, Task PW.7.2 and Example 4, PDF p. 23',
        },
      ],
    },
    {
      heading: 'Integrating checks into development pipelines',
      bridge:
        'Tuned analysis rules become part of ongoing engineering practice when they run automatically across pipelines and toolchains.',
      sentences: [
        {
          id: 'S0382-16',
          text: 'NIST SP 800-204D states that SAST and DAST tools covering all development languages should be run in CI/CD pipelines, providing code coverage reports to developers and security personnel.',
          sourceId: 'NIST-SP-800-204D',
          edition:
            'Strategies for the Integration of Software Supply Chain Security in DevSecOps CI/CD Pipelines, 2024-02',
          locator: 'Section 5.1.4, Secure Code Commits, PDF p. 28',
        },
        {
          id: 'S0382-05',
          text: 'NIST SP 800-218 gives the example of adding automated detection mechanisms to the toolchain so future instances of a recurring vulnerability root cause are caught automatically.',
          sourceId: 'NIST SP 800-218',
          edition: 'Secure Software Development Framework (SSDF) Version 1.1, 2022-02',
          locator: 'Practice RV.3, Task RV.3.2, Example 2, PDF p. 27',
        },
        {
          id: 'S0382-19',
          text: 'NIST SP 800-204D recommends scanning artifacts in internal repositories for newly discovered or identified defects and having the ability to stop their use in builds based on criticality.',
          sourceId: 'NIST-SP-800-204D',
          edition:
            'Strategies for the Integration of Software Supply Chain Security in DevSecOps CI/CD Pipelines, 2024-02',
          locator: 'Section 3.2.1, Baseline Security, PDF p. 21',
        },
      ],
    },
  ],
}
