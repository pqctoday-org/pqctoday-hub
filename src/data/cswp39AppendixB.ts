// SPDX-License-Identifier: GPL-3.0-only
//
// NIST CSWP 39 (Considerations for Achieving Crypto Agility, Dec 19 2025) - primary
// crypto-agility definition plus the alternative definitions catalogued in Appendix B
// (p.41 of the published PDF). Definitions are verbatim from the source document with
// only ASCII sanitisation (smart quotes / em-dashes converted) so that the strings can
// be safely embedded in source code and exported assets without encoding surprises.
//
// Source PDF: public/library/NIST_CSWP_39.pdf
// Primary definition: Section 1 (Introduction), p.2
// Alternative definitions: Appendix B "Definition of Crypto Agility in Other Literature", p.41

export interface CryptoAgilityDefinition {
  /** Short label used in the UI (e.g., "NIST CSWP 39", "FS-ISAC", "ATIS"). */
  source: string
  /** Full citation, including authors / year / publication where applicable. */
  citation: string
  /** Verbatim definition text, ASCII-sanitised. */
  definition: string
  /** Optional external URL pointing to the authoritative document. */
  url?: string
}

export const CSWP39_PRIMARY_DEFINITION: CryptoAgilityDefinition = {
  source: 'NIST CSWP 39',
  citation: 'Considerations for Achieving Crypto Agility, Dec 19 2025, Section 1 / Exec Summary',
  definition:
    'Cryptographic (crypto) agility describes the capabilities needed to replace and adapt cryptographic algorithms in protocols, applications, software, hardware, firmware, and infrastructures while preserving security and ongoing operations.',
  url: 'https://doi.org/10.6028/NIST.CSWP.39',
}

export const CSWP39_APPENDIX_B_DEFINITIONS: CryptoAgilityDefinition[] = [
  {
    source: 'NIST (2016 workshop)',
    citation:
      'National Academies of Sciences, Engineering, and Medicine (2016), Cryptographic Agility and Interoperability: Proceedings of a Workshop, NIST CSWP 39 ref [48]',
    definition:
      'Crypto agility is described as: (1) the ability for implementations to select from the available security algorithms in real time and based on their combined security functions; (2) the ability to add new cryptographic features or algorithms to existing hardware or software, resulting in new, stronger security features; and (3) the ability to gracefully retire cryptographic systems that have become either vulnerable or obsolete.',
    url: 'https://doi.org/10.17226/24636',
  },
  {
    source: 'FS-ISAC (financial sector)',
    citation:
      'FS-ISAC (2024), Building Cryptographic Agility in the Financial Sector, NIST CSWP 39 ref [32]',
    definition:
      "Cryptographic agility is a measure of an organization's ability to adapt cryptographic solutions or algorithms (including their parameters and keys) quickly and efficiently in response to developments in cryptanalysis, emerging threats, technological advances, and/or vulnerabilities. It is a design principle for implementing, updating, replacing, running, and adapting cryptography and related business processes and policies with no significant architectural changes, minimal disruption to business operations, and short transition time.",
    url: 'https://www.fsisac.com/hubfs/Knowledge/PQC/BuildingCryptographicAgilityInTheFinancialSector.pdf',
  },
  {
    source: 'ATIS',
    citation:
      'Alliance for Telecommunications Industry Solutions (2024), Strategic Framework for Crypto Agility and Quantum Risk Assessment, NIST CSWP 39 ref [46]',
    definition:
      'Crypto agility is the ability of a system or organization to adapt and switch to different cryptographic primitives, algorithms, or protocols easily and efficiently with limited impact on operations and with low overhead.',
    url: 'https://atis.org/resources/strategic-framework-for-crypto-agility-and-quantum-risk-assessment/',
  },
  {
    source: 'ETSI',
    citation:
      'ETSI TR 103 619 V1.1.1, Cyber; Migration strategies and recommendations to Quantum Safe schemes, NIST CSWP 39 ref [49]',
    definition:
      'Crypto agility is a property that permits changing or upgrading cryptographic algorithms or parameters.',
    url: 'https://www.etsi.org/deliver/etsi_tr/103600_103699/103619/01.01.01_60/tr_103619v010101p.pdf',
  },
  {
    source: 'CARAF (Hohm et al.)',
    citation:
      'Hohm J, Heinemann A, Wiesmaier A (2022), Towards a Maturity Model for Crypto-Agility Assessment; CARAF: Crypto Agility Risk Assessment Framework, NIST CSWP 39 refs [38] and [44]',
    definition:
      'CARAF (Cryptographic Agility Risk Assessment Framework) frames crypto-agility as a risk-management capability: the organisational and technical readiness to identify cryptographic assets at risk, assess the impact and likelihood of cryptographic compromise, and execute timely migration to alternative algorithms or parameters as part of an ongoing maturity programme.',
    url: 'https://doi.org/10.1093/cybsec/tyab013',
  },
]
