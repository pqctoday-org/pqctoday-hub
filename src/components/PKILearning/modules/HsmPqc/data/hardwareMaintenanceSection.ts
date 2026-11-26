// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const HARDWARE_MAINTENANCE_SECTION: SourcedSectionData = {
  id: 'hardware-maintenance',
  title: 'Hardware maintenance policies and lifecycle procedures',
  lead: 'This section examines hardware maintenance policies and procedures for operators of cryptographic hardware. It looks at maintenance facilities and firmware updates, key and media sanitisation, and validation status and migration planning.',
  nice: [{ id: 'K0780', statement: 'Knowledge of hardware maintenance policies and procedures' }],
  blocks: [
    {
      heading: 'Maintenance facilities and firmware updates',
      sentences: [
        {
          id: 'K0780-03',
          text: 'NIST SP 800-53 Rev. 5 control MA-7 requires organisations to restrict or prohibit field maintenance on organisation-defined systems or system components to trusted maintenance facilities.',
          sourceId: 'NIST SP 800-53',
          edition: 'NIST SP 800-53 Rev. 5 - Security and Privacy Controls (Release 5.2.0), 2020-09',
          locator: 'Section 3.9 Maintenance, MA-7 Field Maintenance, PDF p. 197',
        },
        {
          id: 'K0780-01',
          text: 'PCI PTS HSM Modular Security Requirements v4.0 requires a device to support firmware updates, cryptographically authenticate the firmware, and reject and delete any update whose authenticity is not confirmed.',
          sourceId: 'PCI-PTS-HSM-Modular-Security-Requirements-v4-0',
          edition:
            'PCI PTS Hardware Security Module (HSM) Modular Security Requirements v4.0, 2021-12',
          locator: 'Requirement B3, PDF p. 13',
        },
        {
          id: 'K0780-02',
          text: 'PCI PTS HSM Modular Security Requirements v4.0 requires firmware updates for HSM processing elements to be signed using a dual-control process with keys held in a FIPS 140-2/3 level 3 or higher HSM or a PCI-approved HSM.',
          sourceId: 'PCI-PTS-HSM-Modular-Security-Requirements-v4-0',
          edition:
            'PCI PTS Hardware Security Module (HSM) Modular Security Requirements v4.0, 2021-12',
          locator: 'Requirement J8, PDF p. 23',
        },
        {
          id: 'K0780-04',
          text: 'FIPS 140-3 Implementation Guidance requires that software or firmware loading occur only as part of an approved service, and not during module initialisation before the module moves to the operational state.',
          sourceId: 'NIST-FIPS140-3-IG-PQC',
          edition:
            'Implementation Guidance for FIPS 140-3 and the Cryptographic Module Validation Program, 2026-08',
          locator: 'Section 7.4.3.4 / IG 10.3.F Resolution 9, PDF p. 128',
        },
      ],
    },
    {
      heading: 'Key and media sanitisation',
      bridge: 'The next part turns to key and media sanitisation.',
      sentences: [
        {
          id: 'K0780-05',
          text: 'NIST SP 800-88 Rev. 2 recommends zeroisation, such as overwriting with all zeros, all ones, or random data, for target cryptographic keys, and notes that ISO/IEC 27040 requires all copies of those keys to be sanitisable.',
          sourceId: 'NIST SP 800-88',
          edition: 'Guidelines for Media Sanitization (Rev. 2), 2025-09',
          locator: 'Section 3.2, PDF p. 23',
        },
        {
          id: 'K0780-06',
          text: 'According to NIST SP 800-88 Rev. 2, when information storage media is repurposed or reaches end of life, the organisation executes its sanitisation decision, and disposal without sanitisation should be considered only if disclosure would cause no mission impact or harm to individuals.',
          sourceId: 'NIST SP 800-88',
          edition: 'Guidelines for Media Sanitization (Rev. 2), 2025-09',
          locator: 'Section 4.3.1 Information Decisions in the System Life Cycle, PDF p. 30',
        },
      ],
    },
    {
      heading: 'Validation status and migration planning',
      bridge: 'The final part turns to validation status and migration planning.',
      sentences: [
        {
          id: 'K0780-07',
          text: 'FIPS 140-3 Implementation Guidance states that loading a complete image replacement constitutes an entirely new module requiring validation to maintain validation, and the new image must only execute after a power-on reset.',
          sourceId: 'NIST-FIPS140-3-IG-PQC',
          edition:
            'Implementation Guidance for FIPS 140-3 and the Cryptographic Module Validation Program, 2026-08',
          locator: 'ISO/IEC 19790:2012 Section 7.4.3.4 / IG 10.3.F, PDF p. 125',
        },
        {
          id: 'K0780-08',
          text: 'Under CMVP rules, reaching the sunset date shown on a validation may make a FIPS 140 validation historical, whereas a revoked module validation is no longer valid and may not be referenced to demonstrate FIPS 140-3 compliance.',
          sourceId: 'CMVP-MGMT-MANUAL',
          edition: 'FIPS 140-3 Cryptographic Module Validation Program Management Manual, 2026-04',
          locator: 'Section 4.7, PDF pp. 46-47',
        },
        {
          id: 'K0780-11',
          text: 'For cryptographic implementation changes, ENISA EUCC guidance states a re-evaluation should be required, potentially including side-channel and fault injection tests, and for post-quantum primitives, resistance to quantum attack models may also be claimed and verified.',
          sourceId: 'ENISA-EUCC-Assurance-Continuity-Change-Scenarios',
          edition:
            'ENISA EUCC Guidelines on assurance continuity — practical change scenarios for certified ICT products, version 1, 2025-10',
          locator: 'Section 4.1.4 Cryptographic implementation changes, PDF p. 13',
        },
        {
          id: 'K0780-10',
          text: 'The draft of NIST SP 800-57 Part 1 Revision 6 notes that readiness to replace an algorithm, such as a quantum-vulnerable algorithm, includes evaluating the impact of migrating to new cryptography on existing information technology support contracts and information-sharing agreements.',
          sourceId: 'NIST-SP-800-57-Pt1-R6',
          edition: 'Recommendation for Key Management: Part 1 – General (Revision 6), 2025-12',
          locator: 'PDF p. 71',
        },
      ],
    },
  ],
}
