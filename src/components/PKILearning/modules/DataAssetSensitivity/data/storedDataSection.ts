// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const STORED_DATA_SECTION: SourcedSectionData = {
  id: 'stored-data-key-recovery',
  title: 'Stored data, backups and key recovery under harvest now, decrypt later',
  lead: 'This section examines stored data, backups, and key-recovery systems in the context of long-term confidentiality and harvest-now, decrypt-later threats.',
  blocks: [
    {
      heading: 'How stored data exposure differs from transmitted data',
      sentences: [
        {
          id: 'VLT-C07',
          text: 'Citing ISO/IEC 27040, the NIST SP 800-209r1 initial public draft notes that the quality of cryptography, including security strength and quantum resistance, can impact the actual protection offered by storage-based encryption.',
          sourceId: 'NIST-SP-800-209-R1-IPD',
          edition:
            'Security Guidelines for Storage Infrastructure, Revision 1 initial public draft, 2026-07',
          locator: 'Section 4.6, Encryption and Key Management (ENKM), p. 73',
        },
        {
          id: 'VLT-C08',
          text: 'The NIST SP 800-209r1 initial public draft recommends that cryptography used within storage systems and infrastructure have at least 128 bits of security strength.',
          sourceId: 'NIST-SP-800-209-R1-IPD',
          edition:
            'Security Guidelines for Storage Infrastructure, Revision 1 initial public draft, 2026-07',
          locator: 'Section 4.6.1, General Storage Encryption and Key Management Controls, p. 74',
        },
        {
          id: 'VLT-04',
          text: 'NIST SP 800-57 Part 1 Revision 6 notes that even if transmitted encrypted information is later re-encrypted for storage with a different key or algorithm, it may already be compromised because of the weak transmission algorithm or key.',
          sourceId: 'NIST-SP-800-57-Pt1-R6',
          edition: 'Recommendation for Key Management: Part 1 – General (Revision 6), 2025-12',
          locator: 'Section 4.6.5 Decrease in Security Over Time, p. 74',
        },
        {
          id: 'VLT-05',
          text: 'NIST SP 800-57 Part 1 Revision 6 observes that encrypted information that was never transmitted may still remain confidential even when the encryption algorithm or key length no longer provides the initially required protection.',
          sourceId: 'NIST-SP-800-57-Pt1-R6',
          edition: 'Recommendation for Key Management: Part 1 – General (Revision 6), 2025-12',
          locator: 'Section 4.6.5 Decrease in Security Over Time, p. 74',
        },
        {
          id: 'VLT-03',
          text: 'NIST SP 800-57 Part 1 Revision 6 recommends that if retained data is protected by an algorithm or key size that no longer provides the desired protection, it should be re-protected using an approved algorithm and key size.',
          sourceId: 'NIST-SP-800-57-Pt1-R6',
          edition: 'Recommendation for Key Management: Part 1 – General (Revision 6), 2025-12',
          locator: 'Section 4.6.4 Transitioning to New Algorithms and Key Sizes in Systems, p. 69',
        },
      ],
    },
    {
      heading: 'Key backups, key archives and key recovery',
      bridge:
        'Keeping encrypted data readable over long periods depends on how operational key backups, long-term key archives, and key recovery are defined.',
      sentences: [
        {
          id: 'VLT-C09',
          text: 'Because lost or corrupted encryption keys can render data unusable, the NIST SP 800-209r1 initial public draft recommends protecting encryption keys, such as with a key backup, and having key-recovery plans and mechanisms in place.',
          sourceId: 'NIST-SP-800-209-R1-IPD',
          edition:
            'Security Guidelines for Storage Infrastructure, Revision 1 initial public draft, 2026-07',
          locator: 'Section 4.6.4, Key Management for Storage (KM), p. 77',
        },
        {
          id: 'VLT-08',
          text: 'NIST SP 800-57 Part 1 Revision 6 defines key recovery as the process of reacquiring keying material and requires that if key recovery is provided, all information associated with that key, such as metadata, must also be recoverable.',
          sourceId: 'NIST-SP-800-57-Pt1-R6',
          edition: 'Recommendation for Key Management: Part 1 – General (Revision 6), 2025-12',
          locator: 'Appendix B.1 General Discussion, pp. 163-164',
        },
        {
          id: 'VLT-07',
          text: "NIST SP 800-57 Part 2 Revision 1 distinguishes backups, which support recovering current operational keys, from archives, which support recovering keys primarily to recover information after a key's cryptoperiod has expired.",
          sourceId: 'NIST-SP-800-57-Pt2-R1',
          edition:
            'Recommendation for Key Management, Part 2: Best Practices for Key Management Organizations, 2019-05',
          locator: 'Section 6.2.13 Key Backup, Archiving and Recovery, p. 69',
        },
        {
          id: 'VLT-06',
          text: 'NIST SP 800-57 Part 1 Revision 6 recommends storing symmetric data-encryption keys for data at rest in backup storage during their cryptoperiod and in archive storage if required beyond their originator-usage period.',
          sourceId: 'NIST-SP-800-57-Pt1-R6',
          edition: 'Recommendation for Key Management: Part 1 – General (Revision 6), 2025-12',
          locator: 'Appendix B.7.2 Encryption/Decryption of Data at Rest, pp. 174-175',
        },
        {
          id: 'VLT-12',
          text: 'RFC 10033 explains that stateful hash-based signature schemes add the constraint of ensuring state is never reused, so archival procedures used for conventional trust infrastructures have to be amended or redesigned to remain viable.',
          sourceId: 'RFC-10033-Hash-Based-Signatures-State-and-Backup-Management',
          edition: 'Hash-Based Signatures: State and Backup Management, 2026-09',
          locator: 'Section 3.1 Assessing Operational Costs',
        },
      ],
    },
    {
      heading: 'Protecting backed-up and archived keys over time',
      bridge:
        'Once keys are placed in backup or archive storage, published guidance addresses how those key copies are isolated and updated as cryptoperiods pass.',
      sentences: [
        {
          id: 'VLT-09',
          text: 'NIST SP 800-152 requires a Federal CKMS to provide backed-up keys and metadata with the same integrity and confidentiality protections as operational copies at the same or higher security strength.',
          sourceId: 'NIST-SP-800-152',
          edition: 'A Profile for U.S. Federal Cryptographic Key Management Systems, 2015-10',
          locator: 'Section 6.4.15 Backup of a Key and its Metadata (PR:6.45), p. 64',
        },
        {
          id: 'VLT-10',
          text: 'NIST SP 800-57 Part 1 Revision 6 requires archived key information to be stored separately from operational data and recommends providing multiple copies of archived key information in physically separate locations.',
          sourceId: 'NIST-SP-800-57-Pt1-R6',
          edition: 'Recommendation for Key Management: Part 1 – General (Revision 6), 2025-12',
          locator: 'Section 7.3.1 Key Archive and Key Recovery Functions, p. 135',
        },
        {
          id: 'VLT-11',
          text: 'NIST SP 800-152 requires keys protecting archived keys and metadata to be replaced when their cryptoperiods expire, noting that changing an archive key may involve a stronger cryptographic algorithm and re-encryption of the archived material.',
          sourceId: 'NIST-SP-800-152',
          edition: 'A Profile for U.S. Federal Cryptographic Key Management Systems, 2015-10',
          locator: 'Section 6.4.16 Archive Key and/or Metadata, p. 65',
        },
      ],
    },
    {
      heading: 'Isolating recovery copies of sensitive data',
      bridge:
        'Alongside key protection, recovery copies of sensitive data face their own isolation and storage considerations.',
      sentences: [
        {
          id: 'VLT-C01',
          text: 'The NIST SP 800-209r1 initial public draft recommends setting up an air gap around cyber-attack recovery copies of sensitive data, distinguishing strict physical and network-level separation from less strict isolation that opens shut-down data ports during a limited time for periodic sync.',
          sourceId: 'NIST-SP-800-209-R1-IPD',
          edition:
            'Security Guidelines for Storage Infrastructure, Revision 1 initial public draft, 2026-07',
          locator: 'Section 4.4.4, Cyber Recovery Systems (CR), p. 62',
        },
        {
          id: 'VLT-C03',
          text: 'The NIST SP 800-209r1 initial public draft recommends storing cyber-attack recovery copies off-site so that adversaries with physical access to or compromise of the production site cannot access or compromise them.',
          sourceId: 'NIST-SP-800-209-R1-IPD',
          edition:
            'Security Guidelines for Storage Infrastructure, Revision 1 initial public draft, 2026-07',
          locator: 'Section 4.4.4, Cyber Recovery Systems (CR), p. 62',
        },
        {
          id: 'VLT-C05',
          text: 'The NIST SP 800-209r1 initial public draft recommends using immutable storage, such as retention locking, vault locking, or immutability policies, when possible and appropriate to further isolate and protect recovery data.',
          sourceId: 'NIST-SP-800-209-R1-IPD',
          edition:
            'Security Guidelines for Storage Infrastructure, Revision 1 initial public draft, 2026-07',
          locator: 'Section 4.2.1, Physically Secure Storage, p. 38',
        },
      ],
    },
    {
      heading: 'Planning for data retention and future re-encryption',
      bridge:
        'Finally, long-term planning connects encryption and key management to retention obligations and storage inventories.',
      sentences: [
        {
          id: 'VLT-C10',
          text: 'The NIST SP 800-209r1 initial public draft recommends that encryption and key management solutions be compatible with data retention and preservation obligations.',
          sourceId: 'NIST-SP-800-209-R1-IPD',
          edition:
            'Security Guidelines for Storage Infrastructure, Revision 1 initial public draft, 2026-07',
          locator: 'Section 4.6.4, Key Management for Storage (KM), p. 77',
        },
        {
          id: 'VLT-C11',
          text: 'For sensitive data, the NIST SP 800-209r1 initial public draft recommends keeping a comprehensive storage media inventory that tracks mitigation and contingency procedures, such as reissuing keys and re-encrypting data.',
          sourceId: 'NIST-SP-800-209-R1-IPD',
          edition:
            'Security Guidelines for Storage Infrastructure, Revision 1 initial public draft, 2026-07',
          locator: 'Section 4.2.1, Physically Secure Storage, p. 37',
        },
      ],
    },
  ],
}
