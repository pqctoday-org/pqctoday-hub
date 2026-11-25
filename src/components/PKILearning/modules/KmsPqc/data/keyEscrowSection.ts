// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const KEY_ESCROW_SECTION: SourcedSectionData = {
  id: 'key-escrow-recovery',
  title: 'Enterprise key escrow and key recovery',
  lead: 'This section introduces enterprise key backup and recovery.',
  nice: [{ id: 'S0486', statement: 'Skill in implementing enterprise key escrow systems' }],
  blocks: [
    {
      heading: 'Scope of key backup and recovery',
      sentences: [
        {
          id: 'S0486-01',
          text: "NIST SP 800-57 Part 1 Revision 6 defines backup storage as storing copies of key information that is also available in normal operational storage during a key's cryptoperiod.",
          sourceId: 'NIST-SP-800-57-Pt1-R6',
          edition: 'Recommendation for Key Management: Part 1 – General (Revision 6), 2025-12',
          locator: 'Section 7.2.2.1 Backup Storage, PDF p. 129',
        },
        {
          id: 'S0486-03',
          text: 'NIST SP 800-57 Part 1 Revision 6 defines key recovery as retrieving or reconstructing a key from key backups or archives to process cryptographically protected information.',
          sourceId: 'NIST-SP-800-57-Pt1-R6',
          edition: 'Recommendation for Key Management: Part 1 – General (Revision 6), 2025-12',
          locator: 'Section 8.5.2 Key Recovery, PDF p. 147',
        },
        {
          id: 'S0486-04',
          text: 'NIST SP 800-57 Part 1 Revision 6 recommends deciding whether key recovery is required on a case-by-case basis, weighing continuity of operations against the risk of exposing keying material and protected information.',
          sourceId: 'NIST-SP-800-57-Pt1-R6',
          edition: 'Recommendation for Key Management: Part 1 – General (Revision 6), 2025-12',
          locator: 'Section 7.2.2.2 Key Recovery Function, PDF p. 132',
        },
        {
          id: 'S0486-05',
          text: "NIST SP 800-57 Part 1 Revision 6 states that private signature keys generally shall not be archived and are usually undesirable to back up because of non-repudiation concerns, though backing up a CA's private signature key may be justified in some circumstances.",
          sourceId: 'NIST-SP-800-57-Pt1-R6',
          edition: 'Recommendation for Key Management: Part 1 – General (Revision 6), 2025-12',
          locator: 'Appendix B.2.1 Private Signature Key, PDF p. 167',
        },
      ],
    },
    {
      heading: 'Access controls, auditing, and multiparty custody',
      bridge:
        'Once an organization decides which keys are eligible for recovery, operational controls govern how recovery systems restrict access, record activity, and divide custody.',
      sentences: [
        {
          id: 'S0486-07',
          text: 'NIST SP 800-57 Part 1 Revision 6 requires a federal key-recovery system to protect key-recovery information against unauthorized disclosure, verify request sources, provide only requested and authorized information, and limit access to key-recovery information, audit trails, and authentication data.',
          sourceId: 'NIST-SP-800-57-Pt1-R6',
          edition: 'Recommendation for Key Management: Part 1 – General (Revision 6), 2025-12',
          locator: 'Appendix B.1.4 Key-Recovery Systems, PDF pp. 165-166',
        },
        {
          id: 'S0486-08',
          text: 'NIST SP 800-57 Part 1 Revision 6 requires a federal key-recovery system to provide an audit trail that prohibits modification and must not contain recovered keys or passwords used by the system.',
          sourceId: 'NIST-SP-800-57-Pt1-R6',
          edition: 'Recommendation for Key Management: Part 1 – General (Revision 6), 2025-12',
          locator: 'Appendix B.1.4 Key-Recovery Systems, PDF pp. 165-166',
        },
        {
          id: 'S0486-09',
          text: 'PCI PIN Security Requirements v3.1 requires unencrypted secret or private keys, including keys loaded from individual key components or shares, to be entered using dual control and split knowledge.',
          sourceId: 'PCI-PIN-v3-1-ROC-Reporting-Template',
          edition: 'PCI PIN Security Requirements v3.1 — ROC Reporting Template, 2021-03',
          locator: 'Control Objective 4, Requirement 12 and 12-1, PDF p. 62',
        },
        {
          id: 'S0486-10',
          text: 'NIST SP 800-152 describes key splitting as a multiparty control technique in which n key splits are provided to n trusted entities so the key cannot be formed unless k entities agree.',
          sourceId: 'NIST-SP-800-152',
          edition: 'A Profile for U.S. Federal Cryptographic Key Management Systems, 2015-10',
          locator: 'Section 6.7.5 Key Splitting, PDF p. 76',
        },
      ],
    },
    {
      heading: 'Handling expired keys and legacy key wrapping',
      bridge:
        'Recovering older keys also involves rules for using expired keying material and unwrapping keys protected under legacy mechanisms.',
      sentences: [
        {
          id: 'S0486-11',
          text: 'NIST SP 800-57 Part 1 Revision 6 requires that recovered archived keys with expired cryptoperiods must not apply cryptographic protection, must be erased from the cryptographic process after use, and must remain archived as long as needed.',
          sourceId: 'NIST-SP-800-57-Pt1-R6',
          edition: 'Recommendation for Key Management: Part 1 – General (Revision 6), 2025-12',
          locator: 'Section 7.3.1 Key Archive and Key Recovery Functions, PDF pp. 137-138',
        },
        {
          id: 'S0486-14',
          text: 'NIST SP 800-131A Revision 3 defines key wrapping as encrypting and integrity-protecting keying material with a block-cipher algorithm, disallowing TDEA for key wrapping while allowing TDEA for unwrapping under legacy use.',
          sourceId: 'NIST-SP-800-131A-Rev3',
          edition:
            'Transitioning the Use of Cryptographic Algorithms and Key Lengths (Rev 3), 2024-10',
          locator: 'Section 10 Key Wrapping, PDF p. 36',
        },
      ],
    },
    {
      heading: 'Planning key recovery for the post-quantum transition',
      bridge:
        'Because recovered and archived keys often protect long-lived information, post-quantum planning addresses both transition timing and quantum-resistant key transport.',
      sentences: [
        {
          id: 'S0486-16',
          text: 'NIST IR 8547 states that NIST will deprecate quantum-vulnerable public-key cryptography after 2030 and disallow its use under NIST standards and guidelines after 2035, noting that systems protecting data with long-term confidentiality needs warrant the earliest transitions.',
          sourceId: 'NIST IR 8547',
          edition: 'Transition to Post-Quantum Cryptography Standards, 2026-10',
          locator: 'Section 4 PQC Standards Transition Timeline, PDF p. 20',
        },
        {
          id: 'S0486-17',
          text: 'RFC 9936 specifies using the quantum-resistant ML-KEM algorithm with the CMS KEMRecipientInfo structure to transfer content-encryption keys and sets minimum KDF and key-wrapping algorithm requirements for the underlying components.',
          sourceId: 'RFC-9936',
          edition: 'Use of ML-KEM in the Cryptographic Message Syntax (CMS), 2026-03',
          locator:
            'Abstract, Section 2 Use of the ML-KEM Algorithm in the CMS, and Section 2.2 Underlying Components',
        },
      ],
    },
  ],
}
