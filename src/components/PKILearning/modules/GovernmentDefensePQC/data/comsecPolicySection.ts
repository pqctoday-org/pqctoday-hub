// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const COMSEC_POLICY_SECTION: SourcedSectionData = {
  id: 'comsec-policy',
  title: 'Communications Security Policies and Procedures',
  lead: 'This section introduces communications security (COMSEC) policies and procedures for government and defence security staff. Understanding this topic matters for daily key management and product acquisition during the transition to post-quantum cryptography.',
  nice: [
    {
      id: 'K0671',
      statement: 'Knowledge of Communications Security (COMSEC) policies and procedures',
    },
  ],
  blocks: [
    {
      heading: 'Policy Authority and Approved Cryptography',
      sentences: [
        {
          id: 'K0671-01',
          text: 'CNSSP 15 describes requirements, roles, and responsibilities for using public cryptologic protocols and algorithms to protect NSS, and states that the Director of NSA will review and approve all key management plans and key specifications.',
          sourceId: 'CNSSP 15',
          edition: 'CNSS Policy 15 — Use of Public Standards for Secure Information Sharing, 2016',
          locator:
            'Section I – Purpose, Paragraph 1 (PDF p. 3) and Section V – Responsibilities, Paragraph 13 (PDF p. 5)',
        },
        {
          id: 'K0671-03',
          text: 'NSM-8 requires agencies that own or operate NSS to use NSA-approved public standards-based cryptographic protocols, or NSA-approved mission-unique protocols if mission-unique requirements preclude them, and bars authorising new systems without approved encryption algorithms and implementations unless the agency head authorises an exception.',
          sourceId: 'NSM-8',
          edition:
            'National Security Memorandum 8 — Improving the Cybersecurity of National Security, DoD, and IC Systems, 2022-01',
          locator: 'Section 1(b)(iv)',
        },
        {
          id: 'K0671-04',
          text: 'NSA CNSA 2.0 states that its direction applies to all use of public cryptographic algorithms on unclassified and classified NSS, and that using unapproved algorithms is generally not allowed and requires a specific waiver.',
          sourceId: 'NSA CNSA 2.0',
          edition: 'Announcing the Commercial National Security Algorithm Suite 2.0, 2022-09',
          locator: 'Executive summary, PDF p. 1',
        },
      ],
    },
    {
      heading: 'Key Management and Handling Procedures',
      bridge: 'The next part of this section turns to key management and handling procedures.',
      sentences: [
        {
          id: 'K0671-05',
          text: 'Manually distributed keys and key shares must be protected throughout the distribution process, and secret keys, private keys, and key shares must be wrapped, encapsulated, or distributed using appropriate physical security.',
          sourceId: 'NIST-SP-800-57-Pt1-R6',
          edition: 'Recommendation for Key Management: Part 1 – General (Revision 6), 2025-12',
          locator: 'Section 7.1.5.2.2.1 Manual Key Distribution, PDF p. 123',
        },
        {
          id: 'K0671-06',
          text: 'NIST SP 800-57 Part 2 Rev. 1 recommends that a Key Management Specification describe device or application support for accounting for keying material and appropriate authorisation mechanisms to control its use.',
          sourceId: 'NIST-SP-800-57-Pt2-R1',
          edition:
            'Recommendation for Key Management, Part 2: Best Practices for Key Management Organizations, 2019-05',
          locator: 'Section 4.6 Keying Material Distribution, PDF p. 50',
        },
        {
          id: 'K0671-07',
          text: 'NIST SP 800-57 Part 2 Rev. 1 states that key management products must meet NIST criteria for security, accuracy, and utility, and that inspection and quality assurance procedures should be structured to satisfy those criteria.',
          sourceId: 'NIST-SP-800-57-Pt2-R1',
          edition:
            'Recommendation for Key Management, Part 2: Best Practices for Key Management Organizations, 2019-05',
          locator: 'Section 4 Key Management Specification, PDF p. 45',
        },
        {
          id: 'K0671-08',
          text: 'NIST SP 800-57 Part 2 Rev. 1 states that key management practices statements should cover maintaining keying material inventories, reporting destruction, reporting exceptional acquisition or loss, and specifying consequences for wilful or negligent mishandling.',
          sourceId: 'NIST-SP-800-57-Pt2-R1',
          edition:
            'Recommendation for Key Management, Part 2: Best Practices for Key Management Organizations, 2019-05',
          locator: 'Appendix B, PDF pp. 79-80',
        },
      ],
    },
    {
      heading: 'Planning for Post-Quantum Product Validation',
      bridge:
        'The final part of this section turns to planning for post-quantum product validation.',
      sentences: [
        {
          id: 'K0671-12',
          text: 'The October 2026 NSA CNSA 2.0 FAQ (Version 2.2) states that a commercial product not using CNSA 2.0 algorithms cannot be used to protect NSS without specific written NSA guidance, and that CNSSP 11 NIAP validation will generally require CNSA 2.0 compliance.',
          sourceId: 'NSA CNSA 2.0 FAQ',
          edition: 'CNSA 2.0 Frequently Asked Questions, 2022-09',
          locator: 'CNSA 2.0, PDF p. 16',
        },
        {
          id: 'K0671-11',
          text: 'NIAP Policy Letter #33 (31 August 2026) states that products not meeting CNSA 2.0 requirements for every cryptographic function will not be accepted into NIAP evaluation from 1 January 2028 and will not be posted to the NIAP PCL from 1 January 2029.',
          sourceId: 'NIAP-CCEVS-POLICY-33',
          edition:
            'NIAP CCEVS Policy Letter 33 — Post Quantum Cryptography Implementation, 2026-08',
          locator: 'Policy, PDF pp. 1-2',
        },
      ],
    },
  ],
}
