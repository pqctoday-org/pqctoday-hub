// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const DYNAMIC_ANALYSIS_SECTION: SourcedSectionData = {
  id: 'dynamic-analysis',
  title: 'Dynamic analysis of cryptographic code',
  lead: 'This section introduces dynamic analysis of cryptographic code.',
  nice: [{ id: 'S0857', statement: 'Skill in performing dynamic analysis' }],
  blocks: [
    {
      heading: 'What dynamic analysis covers',
      sentences: [
        {
          id: 'S0857-01',
          text: 'NIST SP 800-53 describes dynamic code analysis as runtime verification that monitors programs for memory corruption, user privilege issues, and other security problems to confirm security functionality performs as designed.',
          sourceId: 'NIST SP 800-53',
          edition: 'NIST SP 800-53 Rev. 5 - Security and Privacy Controls (Release 5.2.0), 2020-09',
          locator: 'SA-11(8) Dynamic Code Analysis, PDF page 306',
        },
        {
          id: 'S0857-02',
          text: 'NIST SP 800-53 defines fuzz testing as a type of dynamic analysis that induces program failures by introducing malformed or random data, with strategies derived from application intended use and specifications.',
          sourceId: 'NIST SP 800-53',
          edition: 'NIST SP 800-53 Rev. 5 - Security and Privacy Controls (Release 5.2.0), 2020-09',
          locator: 'SA-11(8) Dynamic Code Analysis, PDF page 306',
        },
        {
          id: 'S0857-04',
          text: 'NIST SP 800-53 describes instrumentation-based application security testing as detecting vulnerabilities by observing running applications, using direct measurements, working in real time, and being usable continuously throughout the system development life cycle.',
          sourceId: 'NIST SP 800-53',
          edition: 'NIST SP 800-53 Rev. 5 - Security and Privacy Controls (Release 5.2.0), 2020-09',
          locator: 'SA-11(9) Interactive Application Security Testing, PDF page 306',
        },
      ],
    },
    {
      heading: 'Runtime flaws in cryptographic implementations',
      bridge: 'Next, consider runtime flaws in cryptographic implementations.',
      sentences: [
        {
          id: 'S0857-05',
          text: 'Bernstein reports that one ML-DSA vulnerability was a buffer overread, and writes that severe ML-DSA software vulnerabilities might include leaks of secret data from RAM or buffer overflows giving an attacker complete control over the program.',
          sourceId: 'Bernstein-MLDSA-Bugs-2026',
          edition: 'Exploiting ML-DSA bugs, 2026-06',
          locator: 'Section 7.5, PDF page 26',
        },
        {
          id: 'S0857-07',
          text: 'Schröder et al. report that in the HQC round 4 optimized implementation, a modulo operation in a loop can lead the compiler to emit division (div) instructions that yield a timing side-channel when operating on secret data.',
          sourceId: 'USENIX-2024-HQC-Division-Timing',
          edition:
            'Divide and Surrender: Exploiting Variable Division Instruction Timing in HQC Key Recovery Attacks, 2024-08',
          locator: 'Abstract, PDF page 2',
        },
        {
          id: 'S0857-08',
          text: 'Bernstein notes that the eBACS benchmarking tool SUPERCOP runs correctness tests using output checksums across implementations, catching code changes that modify signatures even when those signatures still pass verification.',
          sourceId: 'Bernstein-MLDSA-Bugs-2026',
          edition: 'Exploiting ML-DSA bugs, 2026-06',
          locator: 'Section 3.2.2 Checksums of outputs for known derandomized inputs, PDF page 12',
        },
      ],
    },
    {
      heading: 'Measuring coverage and planning for runtime testing',
      bridge: 'Next, consider coverage and planning for runtime testing.',
      sentences: [
        {
          id: 'S0857-03',
          text: 'To assess the scope and assurance of dynamic code analysis, NIST SP 800-53 notes that organizations may use code coverage analysis, tracking metrics such as the percent of subroutines tested or program statements called.',
          sourceId: 'NIST SP 800-53',
          edition: 'NIST SP 800-53 Rev. 5 - Security and Privacy Controls (Release 5.2.0), 2020-09',
          locator: 'SA-11(8) Dynamic Code Analysis, PDF page 306',
        },
        {
          id: 'S0857-06',
          text: 'NIST SP 800-218 lists integrating dynamic vulnerability testing and using fuzz testing tools to find input-handling issues as implementation examples for executable code testing.',
          sourceId: 'NIST SP 800-218',
          edition: 'Secure Software Development Framework (SSDF) Version 1.1, 2022-02',
          locator: 'Practice PW.8, Tasks PW.8.1 and PW.8.2, PDF page 24',
        },
      ],
    },
  ],
}
