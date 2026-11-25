// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const CIA_PRINCIPLES_SECTION: SourcedSectionData = {
  id: 'cia-quantum-threat',
  title: 'Confidentiality, integrity and availability and the quantum threat',
  lead: 'This section introduces confidentiality, integrity, availability, potential-impact categorization, and their relevance to the quantum threat.',
  nice: [
    {
      id: 'K0728',
      statement:
        'Knowledge of Confidentiality, Integrity and Availability (CIA) principles and practices',
    },
  ],
  blocks: [
    {
      heading: 'Defining confidentiality, integrity, and availability',
      sentences: [
        {
          id: 'K0728-01',
          text: 'FIPS 200 defines information security as protecting information and information systems from unauthorized access, use, disclosure, disruption, modification, or destruction in order to provide confidentiality, integrity, and availability.',
          sourceId: 'FIPS-200-Minimum-Security-Requirements-for-Federal-Informati',
          edition:
            'FIPS 200 — Minimum Security Requirements for Federal Information and Information Systems, 2006-03',
          locator: 'Appendix A Terms and Definitions, PDF page 13',
        },
        {
          id: 'K0728-02',
          text: 'FIPS 200 defines confidentiality as preserving authorized restrictions on information access and disclosure, including means for protecting personal privacy and proprietary information.',
          sourceId: 'FIPS-200-Minimum-Security-Requirements-for-Federal-Informati',
          edition:
            'FIPS 200 — Minimum Security Requirements for Federal Information and Information Systems, 2006-03',
          locator: 'Appendix A Terms and Definitions, PDF page 12',
        },
        {
          id: 'K0728-03',
          text: 'FIPS 200 defines integrity as guarding against improper information modification or destruction, which includes ensuring information non-repudiation and authenticity.',
          sourceId: 'FIPS-200-Minimum-Security-Requirements-for-Federal-Informati',
          edition:
            'FIPS 200 — Minimum Security Requirements for Federal Information and Information Systems, 2006-03',
          locator: 'Appendix A Terms and Definitions, PDF page 13',
        },
        {
          id: 'K0728-04',
          text: 'In Appendix A, FIPS 200 defines availability as ensuring timely and reliable access to and use of information.',
          sourceId: 'FIPS-200-Minimum-Security-Requirements-for-Federal-Informati',
          edition:
            'FIPS 200 — Minimum Security Requirements for Federal Information and Information Systems, 2006-03',
          locator: 'Appendix A Terms and Definitions, PDF page 12',
        },
      ],
    },
    {
      heading: 'Impact categorization and the quantum threat',
      bridge:
        'The next points cover how potential impact is categorized across these objectives and how authentication systems relate to the quantum threat.',
      sentences: [
        {
          id: 'K0728-05',
          text: 'As NIST SP 800-60 reports, FIPS 199 defines three potential impact levels for a loss of confidentiality, integrity, or availability: low for a limited adverse effect, moderate for a serious adverse effect, and high for a severe or catastrophic adverse effect.',
          sourceId: 'NIST-SP-800-60-Vol-1-Rev-1-Guide-for-Mapping-Types-of-Inform',
          edition:
            'NIST SP 800-60 Vol. 1 Rev. 1 — Guide for Mapping Types of Information and Information Systems to Security Categories, 2008-08',
          locator: 'Section 3.2 Impact Assessment, Table 2: Potential Impact Levels, PDF page 18',
        },
        {
          id: 'K0728-06',
          text: 'As reported in FIPS 200, FIPS 199 requires agencies to categorize their information systems as low-impact, moderate-impact, or high-impact for the security objectives of confidentiality, integrity, and availability.',
          sourceId: 'FIPS-200-Minimum-Security-Requirements-for-Federal-Informati',
          edition:
            'FIPS 200 — Minimum Security Requirements for Federal Information and Information Systems, 2006-03',
          locator: 'Section 2 Information System Impact Levels, PDF page 7',
        },
        {
          id: 'K0728-07',
          text: "FIPS 200 requires using the high water mark concept to determine a system's overall impact level before selecting security controls, making a system high-impact if at least one security objective is high.",
          sourceId: 'FIPS-200-Minimum-Security-Requirements-for-Federal-Informati',
          edition:
            'FIPS 200 — Minimum Security Requirements for Federal Information and Information Systems, 2006-03',
          locator: 'Section 2 Information System Impact Levels, PDF page 8',
        },
        {
          id: 'K0728-10',
          text: 'According to NIST IR 8547, unlike encryption, authentication has no HNDL threat: an authentication system stays secure while its algorithms and keys are secure when authentication is performed, and may use quantum-vulnerable algorithms until capable quantum computers exist, when it will need to transition immediately to quantum-resistant algorithms.',
          sourceId: 'NIST IR 8547',
          edition: 'Transition to Post-Quantum Cryptography Standards, 2026-10',
          locator: 'Section 3.1.2 User and Machine Authentication, PDF page 16',
        },
      ],
    },
  ],
}
