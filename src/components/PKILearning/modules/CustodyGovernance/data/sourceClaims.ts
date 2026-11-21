// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Primary-source claims and analysis/negative rows for Module C (CustodyGovernance, LM-086).
 * Every entry in SOURCE_CLAIMS binds strictly ONE Library reference_id (`sourceId`),
 * declared in `content.ts`. ANALYSIS and NEGATIVE rows live in `ANALYSIS_CLAIMS`
 * with explicit premiseIds and asOfDate rather than inventing a single sourceId.
 */

export interface SourceClaim {
  id: string
  text: string
  /** Library reference_id of the single document this claim rests on */
  sourceId: string
  /** Document edition or publication date as read */
  edition: string
  /** Section, article, or heading locator within the document */
  locator: string
  /** Binding force or document class label */
  force:
    | 'binding-statute'
    | 'binding-rts'
    | 'supervisory-guidance'
    | 'accounting-context'
    | 'permissibility-context'
    | 'international-policy'
    | 'industry-standard'
    | 'assurance-standard'
    | 'market-practice-broker'
    | 'technical-research'
}

export interface AnalysisClaim {
  id: string
  kind: 'ANALYSIS' | 'NEGATIVE'
  text: string
  /** Claim IDs or module cross-references this analysis/negative conclusion rests on */
  premiseIds: readonly string[]
  /** Explicit Rule G1 authority assumptions */
  g1Authorities: string
  /** As-of date for this analysis or negative verdict */
  asOfDate: string
}

export const SOURCE_CLAIMS = {
  'DA-18.1': {
    id: 'DA-18.1',
    text: 'Regulation (EU) 2023/1114 (MiCA) Article 75 requires CASPs providing custody and administration of crypto-assets on behalf of clients to establish a custody policy with internal rules and procedures to ensure safekeeping or control of means of access (such as cryptographic keys), segregate client holdings from the CASP’s own assets operationally and legally, and maintain a register of positions.',
    sourceId: 'MICA-REG-2023-1114',
    edition: 'Regulation (EU) 2023/1114 (MiCA, OJ 9 June 2023; CASP rules applicable 30 Dec 2024)',
    locator: 'Art. 75(1)–(7) & Art. 70 (safekeeping)',
    force: 'binding-statute',
  },
  'DA-18.2a': {
    id: 'DA-18.2a',
    text: 'Regulation (EU) 2022/2554 (DORA) applies to MiCA-authorised crypto-asset service providers (Art. 2(1)(f)), requiring an ICT risk-management framework, ICT-related incident classification and reporting (Arts. 17–19), digital operational resilience testing (Arts. 24–27), and ICT third-party risk management (Arts. 28–30).',
    sourceId: 'DORA-REG-2022-2554',
    edition: 'Regulation (EU) 2022/2554 (DORA, applicable 17 Jan 2025)',
    locator: 'Art. 2(1)(f), Arts. 17–19, Arts. 24–30',
    force: 'binding-statute',
  },
  'DA-18.2b': {
    id: 'DA-18.2b',
    text: 'Commission Delegated Regulation (EU) 2024/1774 (DORA ICT Risk Management RTS) requires policies on encryption and cryptographic controls (Art. 6) and cryptographic key management covering the full key lifecycle — generating, renewing, storing, backing up, archiving, retrieving, transmitting, retiring, revoking, and destroying cryptographic keys (Art. 7) — without naming a specific HSM certification scheme or algorithm.',
    sourceId: 'DORA-RTS-2024-1774',
    edition: 'Commission Delegated Regulation (EU) 2024/1774 (OJ 25 June 2024)',
    locator: 'Arts. 6–7 (Encryption and cryptographic key management)',
    force: 'binding-rts',
  },
  'DA-18.3': {
    id: 'DA-18.3',
    text: 'Hong Kong SFC Guidelines for Virtual Asset Trading Platform Operators state that, where practicable, seeds and private keys "should" be generated offline and kept in a secure environment such as an HSM with appropriate certification (§10.8(a)), and set the licensed-platform expectation that 98% of client virtual assets "should" be stored in cold storage except under limited SFC-approved circumstances (§10.6).',
    sourceId: 'SFC-VATP-Guidelines',
    edition: 'Hong Kong SFC Guidelines for VATP Operators (effective 1 June 2023)',
    locator: '§10.6 (cold-storage share) & §10.8(a) (key generation/storage)',
    force: 'supervisory-guidance',
  },
  'DA-18.4a': {
    id: 'DA-18.4a',
    text: 'Dubai VARA Custody Services Rulebook (Version 2) sets custody-specific governance, client-asset segregation, wallet architecture, and key-safekeeping obligations for licensed Custody VASPs without mandating FIPS 140-2/3 or Common Criteria by name.',
    sourceId: 'VARA-Custody-Rulebook',
    edition: 'VARA Custody Services Rulebook (Version 2, May 2025)',
    locator: 'Custody governance, segregation & key safekeeping parts',
    force: 'binding-statute',
  },
  'DA-18.4b': {
    id: 'DA-18.4b',
    text: 'Dubai VARA Technology and Information Rulebook (Version 2) establishes cryptographic key management, access control, incident reporting, and technology-risk governance rules for licensed VASPs, and contains zero occurrences of FIPS 140 or Common Criteria.',
    sourceId: 'VARA-Technology-Information-Rulebook',
    edition: 'VARA Technology and Information Rulebook (Version 2, May 2025)',
    locator: 'Cryptographic controls, access & incident governance parts',
    force: 'binding-statute',
  },
  'DA-18.5': {
    id: 'DA-18.5',
    text: 'NYDFS 23 NYCRR Part 500 (Amendment 2) requires covered entities to maintain a cybersecurity program, limit and review user access privileges (§500.7), enforce multi-factor authentication (§500.12), maintain audit trails (§500.6), conduct penetration testing and vulnerability assessments (§500.5), and notify the Superintendent within 72 hours of determining a covered cybersecurity event has occurred (§500.17).',
    sourceId: 'NY-DFS-23-NYCRR-500-A2',
    edition:
      'NYDFS 23 NYCRR Part 500 (Second Amendment, adopted 1 Nov 2023; phased compliance through Nov 2025)',
    locator: '§§500.5, 500.6, 500.7, 500.12, 500.17',
    force: 'binding-statute',
  },
  'DA-18.6': {
    id: 'DA-18.6',
    text: 'MAS Technology Risk Management Guidelines set supervisory expectations for Singapore financial institutions on cryptographic key management lifecycle controls, dual control / split knowledge for sensitive key operations, access controls, logging, and resilience testing.',
    sourceId: 'MAS-CIRCULAR-IT-RISK',
    edition: 'MAS Technology Risk Management Guidelines (January 2021)',
    locator: 'Section 10 (Cryptography) & Section 9 (Access Control)',
    force: 'supervisory-guidance',
  },
  'DA-18.7': {
    id: 'DA-18.7',
    text: 'NYDFS Updated Guidance on Custodial Structures for Customer Protection in the Event of Insolvency (30 September 2025, replacing the January 2023 guidance) sets supervisory expectations for Virtual Currency Entities on customer-asset segregation, separate on-chain or omnibus accounting records, sub-custodian due diligence, and clear disclosure of custody arrangements.',
    sourceId: 'NYDFS-Custodial-Structures-Guidance-2025',
    edition: 'NYDFS Industry Letter (effective 30 September 2025; supersedes 23 Jan 2023 guidance)',
    locator: 'Segregation, sub-custody due diligence & customer disclosure sections',
    force: 'supervisory-guidance',
  },
  'DA-18.7b': {
    id: 'DA-18.7b',
    text: 'NYDFS 23 NYCRR § 200.9 (BitLicense) requires licensees to hold virtual currency of the same type and amount owed to customers, maintain a surety bond or trust account for customer protection, and prohibits selling, transferring, assigning, lending, hypothecating, or pledging customer assets except at the customer’s direction.',
    sourceId: 'NY-DFS-23-NYCRR-Part-200-9',
    edition: 'N.Y. Comp. Codes R. & Regs. Tit. 23 § 200.9 (BitLicense)',
    locator: '§200.9(a)–(c)',
    force: 'binding-statute',
  },
  'DA-18.7c': {
    id: 'DA-18.7c',
    text: 'MAS Guidelines PS-G03 (19 September 2024) set supervisory guidance for Digital Payment Token (DPT) service providers on customer-asset segregation in statutory trusts, private-key storage expectations (including cold-storage practices), daily reconciliations, and operational controls — issued as guidelines alongside the binding Payment Services Regulations.',
    sourceId: 'MAS-PS-G03-Consumer-Protection-DPT',
    edition: 'MAS Guidelines PS-G03 (19 September 2024)',
    locator: 'Safeguarding, private-key storage & reconciliation guidance',
    force: 'supervisory-guidance',
  },
  'DA-18.7d': {
    id: 'DA-18.7d',
    text: 'Hong Kong SFC Circular 25EC44 (15 August 2025) sets expected minimum custody standards for licensed VATP operators, addressing senior-management accountability, cold-wallet isolation and infrastructure controls, HSM/key-management governance, transaction verification, monitoring/alerting (cross-referenced to Module A2 §5h), and third-party/supply-chain threats.',
    sourceId: 'SFC-Circular-25EC44-Custody-Virtual-Assets',
    edition: 'Hong Kong SFC Circular 25EC44 (15 August 2025)',
    locator: 'Minimum custody standards for licensed VATPs',
    force: 'supervisory-guidance',
  },
  'DA-18.8a': {
    id: 'DA-18.8a',
    text: 'Commission Delegated Regulation (EU) 2025/305 specifies the ICT security, custody policy, private-key management, and operational-resilience disclosures that CASP applicants must submit for MiCA authorisation.',
    sourceId: 'EU-MiCA-RTS-2025-305',
    edition: 'Commission Delegated Regulation (EU) 2025/305 (OJ 20 April 2025)',
    locator: 'CASP authorisation ICT & custody policy requirements',
    force: 'binding-rts',
  },
  'DA-18.8b': {
    id: 'DA-18.8b',
    text: 'ESMA’s Final Report on MiCA First-Package Draft Technical Standards (ESMA18-72330276-1634) documents the technical rationale behind CASP governance, custody-policy, and ICT-security authorisation disclosures.',
    sourceId: 'ESMA-MiCA-RTS-Final-Report-First-Package',
    edition: 'ESMA Final Report ESMA18-72330276-1634 (March 2024)',
    locator: 'CASP authorisation & custody-policy RTS feedback',
    force: 'supervisory-guidance',
  },
  'DA-18.8c': {
    id: 'DA-18.8c',
    text: 'EBA Final Report EBA/GL/2025/02 amends the EBA Guidelines on ICT and Security Risk Management (EBA/GL/2019/04) for payment service providers to align supervisory expectations with DORA application.',
    sourceId: 'EBA-GL-ICT-Security-Risk-Management',
    edition: 'EBA Final Report EBA/GL/2025/02 (2025)',
    locator: 'Alignment of PSP ICT & security guidelines with DORA',
    force: 'supervisory-guidance',
  },
  'DA-18.9a': {
    id: 'DA-18.9a',
    text: 'SEC Staff Accounting Bulletin No. 121 previously expressed staff views on recognizing a balance-sheet safeguarding liability for held crypto-assets, and was rescinded on 23 January 2025 by SAB 122; it was an accounting-reporting bulletin, not a cryptographic key-management rule.',
    sourceId: 'SEC-SAB-121',
    edition: 'SEC Staff Accounting Bulletin No. 121 (rescinded 23 January 2025)',
    locator: 'Topic 5.FF (rescinded)',
    force: 'accounting-context',
  },
  'DA-18.9b': {
    id: 'DA-18.9b',
    text: 'SEC Staff Accounting Bulletin No. 122 rescinds Topic 5.FF (SAB 121) and directs entities with crypto-asset safeguarding obligations to evaluate loss-contingency recognition under FASB ASC 450-20 or IAS 37 — an accounting framework rather than a custody key-management control specification.',
    sourceId: 'SEC-SAB-122',
    edition: 'SEC Staff Accounting Bulletin No. 122 (23 January 2025)',
    locator: 'Rescission of Topic 5.FF & ASC 450-20 / IAS 37 reference',
    force: 'accounting-context',
  },
  'DA-18.9c': {
    id: 'DA-18.9c',
    text: 'OCC Interpretive Letter 1170 concludes that national banks and federal savings associations have legal authority to provide cryptocurrency custody services, including holding cryptographic keys — a banking-permissibility determination rather than a key-management technical standard.',
    sourceId: 'OCC-Interpretive-Letter-1170',
    edition: 'OCC Interpretive Letter 1170 (22 July 2020)',
    locator: 'Legal authority conclusion for national bank crypto custody',
    force: 'permissibility-context',
  },
  'DA-18.9d': {
    id: 'DA-18.9d',
    text: 'OCC Interpretive Letter 1184 clarifies that national banks and federal savings associations may provide and outsource crypto-asset custody and execution services without prior supervisory non-objection, subject to safe-and-sound risk management — a permissibility text, not a technical key-control list.',
    sourceId: 'OCC-Interpretive-Letter-1184',
    edition: 'OCC Interpretive Letter 1184 (7 May 2025)',
    locator: 'Clarification on bank custody & sub-custodian outsourcing',
    force: 'permissibility-context',
  },
  'DA-18.10a': {
    id: 'DA-18.10a',
    text: 'Japan’s Payment Services Act (Act No. 59 of 2009, as amended) establishes registration, information security, and user-property management obligations for Cryptoasset Exchange Service Providers, requiring customer crypto-assets to be managed separately from proprietary assets using reliable methods specified by Cabinet Office Order.',
    sourceId: 'Japan-Payment-Services-Act',
    edition: 'Japan Payment Services Act (Act No. 59 of 2009, English translation as amended 2020)',
    locator: 'Art. 63-11 (Management of User Property)',
    force: 'binding-statute',
  },
  'DA-18.10b': {
    id: 'DA-18.10b',
    text: 'Japan’s Cabinet Office Order on Cryptoasset Exchange Service Providers (Order No. 7 of 2017, as amended) details cold-wallet segregation methods (offline management) for customer crypto-assets, requires matching proprietary crypto-assets held in cold storage for any customer assets kept in hot wallets to satisfy immediate transfer needs, and mandates external audit of segregated management.',
    sourceId: 'Japan-Cabinet-Office-Order-Cryptoasset',
    edition: 'Japan Cabinet Office Order No. 7 of 2017 (English translation as amended 2021)',
    locator: 'Cold-wallet management, hot-wallet matching & audit provisions',
    force: 'binding-statute',
  },
  'DA-18.11a': {
    id: 'DA-18.11a',
    text: 'Swiss Debt Enforcement and Bankruptcy Act (DEBA, SR 281.1) Article 242a provides for the segregation and surrender of crypto-based assets in bankruptcy where the custodian holds them in readiness for the beneficiary at all times (either individually attributed or in a community with identifiable shares).',
    sourceId: 'Swiss-DEBA-SR-281-1',
    edition:
      'Swiss Federal Act on Debt Enforcement and Bankruptcy (DEBA, SR 281.1, status 1 Jan 2026)',
    locator: 'Art. 242a (Surrender of crypto-based assets)',
    force: 'binding-statute',
  },
  'DA-18.11b': {
    id: 'DA-18.11b',
    text: 'Swiss Federal Act on Banks and Savings Banks (Banking Act / BankG, SR 952.0) Article 16(1bis) and Article 37d establish custody-asset classification and bankruptcy segregation for crypto-based assets held by banks.',
    sourceId: 'Swiss-Banking-Act-SR-952-0',
    edition: 'Swiss Banking Act (BankG, SR 952.0, status 1 Oct 2026)',
    locator: 'Art. 16(1bis) & Art. 37d',
    force: 'binding-statute',
  },
  'DA-18.11c': {
    id: 'DA-18.11c',
    text: 'FINMA Guidance 08/2023 addresses supervisory treatment of crypto-asset staking (insolvency segregation conditions for staked assets, validator operational risks, and risk disclosures) — it is scoped specifically to staking rather than general key-management custody rules.',
    sourceId: 'FINMA-Guidance-08-2023-Staking',
    edition: 'FINMA Guidance 08/2023: Staking (20 December 2023)',
    locator: 'Staking custody segregation & validator risk scope',
    force: 'supervisory-guidance',
  },
  'DA-18.12': {
    id: 'DA-18.12',
    text: 'IOSCO Final Report FR11/2023 issues 18 policy recommendations for crypto and digital asset markets, including custody recommendations covering legal and operational segregation of client assets, safeguarding of private keys, reconciliation, and disclosure of custody and sub-custody arrangements.',
    sourceId: 'IOSCO-FR11-2023-Crypto-Digital-Asset-Markets',
    edition: 'IOSCO Final Report FR11/2023 (November 2023)',
    locator: 'Chapter 5 — Custody & Client Asset Protection (Recommendations 12–15)',
    force: 'international-policy',
  },
  'DA-18.13': {
    id: 'DA-18.13',
    text: 'The CryptoCurrency Security Standard (CCSS v9.0, published by C4) is a voluntary industry standard — not a government regulation — defining Level I–III controls across key generation, wallet architecture, key storage, key compromise policies, backups, and third-party security audits.',
    sourceId: 'CCSS-v9-0',
    edition: 'CryptoCurrency Certification Consortium (C4) CCSS v9.0',
    locator: 'CCSS v9.0 Control Matrix (Levels I–III)',
    force: 'industry-standard',
  },
  'DA-18.16': {
    id: 'DA-18.16',
    text: 'IAASB ISAE 3000 (Revised) is an international standard for assurance engagements other than audits or reviews of historical financial information, supporting limited or reasonable assurance against any suitable criteria — it is a general assurance framework, not an "international SOC 2."',
    sourceId: 'IAASB-ISAE-3000-Revised',
    edition: 'IAASB ISAE 3000 (Revised)',
    locator: 'Scope & Limited vs Reasonable Assurance framework',
    force: 'assurance-standard',
  },
  'DA-18.17': {
    id: 'DA-18.17',
    text: 'Singapore Payment Services Regulations 2019 (binding subsidiary legislation) set statutory "shall" obligations for DPT service providers on safeguarding customer assets in statutory trust accounts (Regs. 18B–18C) and on security of DPT instruments, operational controls, and segregation of duties (Reg. 18G), distinct from the non-binding guidance in MAS PS-G03.',
    sourceId: 'Singapore-Payment-Services-Regulations-2019',
    edition: 'Singapore Payment Services Regulations 2019 (as amended for DPT safeguarding)',
    locator: 'Regs. 18B–18C (safeguarding) & Reg. 18G (security & segregation of duties)',
    force: 'binding-statute',
  },
  'DA-19.1': {
    id: 'DA-19.1',
    text: 'MiCA Article 75(8) makes a CASP providing custody liable to clients for the loss of crypto-assets or of the means of access to them as a result of an incident attributable to the CASP, capped at the market value of the lost crypto-assets at the time the loss occurred; Article 67 sets prudential safeguard requirements met by own funds or an insurance policy meeting minimum capital or fixed-overhead floors.',
    sourceId: 'MICA-REG-2023-1114',
    edition: 'Regulation (EU) 2023/1114 (MiCA, OJ 9 June 2023)',
    locator: 'Art. 75(8) (custodian liability cap) & Art. 67 (prudential own funds / insurance)',
    force: 'binding-statute',
  },
  'DA-19.2': {
    id: 'DA-19.2',
    text: 'Hong Kong SFC Guidelines for VATP Operators state that licensed platform operators "should" maintain an SFC-approved compensation arrangement (insurance, bank guarantee, or funds/virtual assets held on trust) covering at least 50% of client virtual assets held in cold storage and 100% of client virtual assets held in hot and other storages.',
    sourceId: 'SFC-VATP-Guidelines',
    edition: 'Hong Kong SFC Guidelines for VATP Operators (effective 1 June 2023)',
    locator: '§10.22–10.23 (Compensation arrangement: 50% cold / 100% hot)',
    force: 'supervisory-guidance',
  },
  'DA-19.3': {
    id: 'DA-19.3',
    text: 'Dubai VARA’s insurance requirements for Custody VASPs sit in the VARA Company Rulebook (Part VI.D — requiring professional indemnity, directors and officers, and commercial crime cover for virtual assets stored in hot wallets, as applicable under the rulebook), rather than inside the Custody Services Rulebook.',
    sourceId: 'VARA-Company-Rulebook',
    edition: 'VARA Company Rulebook (Version 2)',
    locator: 'Part VI.D (Insurance requirements)',
    force: 'binding-statute',
  },
  'DA-19.4a': {
    id: 'DA-19.4a',
    text: 'Aon’s Financial Services Group brief (2025, market-practice broker commentary) notes that digital-asset crime and specie underwriters scrutinise wallet architecture, hot-vs-cold storage splits, multi-party signing controls, and transaction-verification practices after high-profile exchange breaches — reflecting broker-reported underwriting questions rather than regulatory mandates.',
    sourceId: 'Aon-Recent-Digital-Asset-Breach-2024',
    edition: 'Aon Financial Services Group Brief (2025, broker document)',
    locator: 'Crime & specie underwriting considerations',
    force: 'market-practice-broker',
  },
  'DA-19.4b': {
    id: 'DA-19.4b',
    text: 'WTW’s industry commentary (2023, broker document) describes how financial-institution insurance markets distinguish cold-storage specie cover from hot-wallet crime and cyber cover, and highlights underwriting scrutiny of key generation, physical/logical segregation, quorum controls, insider-collusion exclusions, social-engineering/authorised-push boundaries, and hot-wallet sub-limits.',
    sourceId: 'WTW-Digital-Assets-Evolving-Insurance-2023',
    edition: 'WTW Industry Commentary (2023, broker document)',
    locator: 'Digital asset custody cover classes, underwriting & exclusions',
    force: 'market-practice-broker',
  },
  'DA-19.5a': {
    id: 'DA-19.5a',
    text: 'AICPA SOC 1 engagements report on internal controls at a service organization relevant to user entities’ internal control over financial reporting (ICFR); a Type II report covers operating effectiveness over a stated period, with system boundaries and control objectives scoped by the service organization.',
    sourceId: 'AICPA-SOC-1-ICFR',
    edition: 'AICPA & CIMA SOC 1 Overview',
    locator: 'SOC 1 ICFR scope & Type 1 / Type 2 distinction',
    force: 'assurance-standard',
  },
  'DA-19.5b': {
    id: 'DA-19.5b',
    text: 'IAASB ISAE 3402 is the international assurance standard parallel to SOC 1 for Type 1 and Type 2 reports on internal controls at a service organization relevant to user entities’ financial reporting — it does not inherently mandate cryptographic custody key-management tests unless included in the report scope.',
    sourceId: 'IAASB-ISAE-3402',
    edition: 'IAASB ISAE 3402 Staff Overview',
    locator: 'Controls at a service organization (financial reporting scope)',
    force: 'assurance-standard',
  },
  'DA-19.5c': {
    id: 'DA-19.5c',
    text: 'AICPA SOC 2 examinations evaluate controls against the Trust Services Criteria (Security, Availability, Processing Integrity, Confidentiality, Privacy); the service organization chooses which criteria and system boundaries are in scope, so a clean SOC 2 report does not automatically verify custody signing-boundary controls.',
    sourceId: 'AICPA-SOC-2-Trust-Services-Criteria',
    edition: 'AICPA & CIMA SOC 2 Trust Services Criteria Hub',
    locator: 'Trust Services Criteria & service-organization scoping',
    force: 'assurance-standard',
  },
  'DA-19.6': {
    id: 'DA-19.6',
    text: 'The PCAOB Office of the Investor Advocate advisory (8 March 2023) warns that third-party Proof-of-Reserve (PoR) reports are not audits, lack uniform standards, and may omit complete liabilities, legal ownership rights, borrowed or encumbered assets, and whether the custodian retains control after the snapshot timestamp.',
    sourceId: 'PCAOB-Investor-Advisory-Proof-of-Reserve-2023',
    edition: 'PCAOB Investor Advisory (8 March 2023)',
    locator: 'Proof-of-Reserve limitations vs financial statement audits',
    force: 'supervisory-guidance',
  },
  'DA-19.6b': {
    id: 'DA-19.6b',
    text: 'Dagher et al. ("Provisions", ACM CCS 2015 / IACR ePrint 2015/1008) formalize one privacy-preserving proof-of-solvency construction combining cryptographic asset proofs and liability commitments (such as Merkle-tree or Pedersen-commitment schemes), while noting that cryptographic proofs alone cannot prevent off-ledger liabilities or collusion outside the protocol.',
    sourceId: 'IACR-ePrint-2015-1008-Provisions',
    edition: 'Dagher et al., IACR ePrint 2015/1008 (ACM CCS 2015)',
    locator: '§1 Introduction & Security Model',
    force: 'technical-research',
  },
  'DA-19.8': {
    id: 'DA-19.8',
    text: 'Commission Delegated Regulation (EU) 2025/1190 (DORA TLPT RTS) sets the criteria under Article 2 for competent authorities to identify which financial entities must perform Threat-Led Penetration Testing (TLPT) based on impact, systemic character, and ICT-risk assessment, distinguishing CASPs from entity classes presumptively required to run TLPT under paragraph 2 (see also Recital 3).',
    sourceId: 'EU-DORA-TLPT-RTS-2025-1190',
    edition: 'Commission Delegated Regulation (EU) 2025/1190 (OJ 8 July 2025)',
    locator: 'Art. 2 (Identification criteria) & Recital 3',
    force: 'binding-rts',
  },
  'DA-20.2-erc7730': {
    id: 'DA-20.2-erc7730',
    text: 'Draft ERC-7730 defines a JSON clear-signing descriptor format so hardware and software wallets can display human-readable smart-contract fields, shifting part of the trust boundary to whoever publishes, reviews, and distributes the descriptor registry.',
    sourceId: 'ERC-7730-Structured-Data-Clear-Signing-Format',
    edition: 'Ethereum Draft ERC-7730',
    locator: 'Specification & Security Considerations (descriptor trust)',
    force: 'industry-standard',
  },
  'DA-18.14-pq-nist': {
    id: 'DA-18.14-pq-nist',
    text: 'Quantum-specific transition timelines such as NIST IR 8547 (deprecating quantum-vulnerable signatures after 2030 and disallowing them after 2035) are taught in Module B §8c (optional further reading) rather than appearing in today’s general digital-asset custody rulebooks.',
    sourceId: 'NIST IR 8547',
    edition: 'NIST IR 8547 (Final, 27 October 2026)',
    locator: 'Transition timeline summary (cross-ref Module B §8c)',
    force: 'supervisory-guidance',
  },
  'DA-18.14-pq-bis': {
    id: 'DA-18.14-pq-bis',
    text: 'BIS Paper 158 (July 2025) provides a global financial-system quantum-readiness roadmap (cryptographic inventory and migration governance), covered as optional further reading in Module B §8c.',
    sourceId: 'BIS-Paper-158',
    edition: 'BIS Paper 158 (July 2025)',
    locator: 'Quantum-readiness roadmap (cross-ref Module B §8c)',
    force: 'international-policy',
  },
  'DA-18.14-pq-mas': {
    id: 'DA-18.14-pq-mas',
    text: 'MAS Advisory on Addressing Cybersecurity Risks Associated with Quantum Computing (February 2024) addresses quantum risk governance for Singapore financial institutions, separate from MAS PS-G03 custody rules (see Module B §8c, optional further reading).',
    sourceId: 'SG-MAS-Quantum-Advisory-2024',
    edition: 'MAS Quantum Advisory (20 February 2024)',
    locator: 'Quantum risk management expectations (cross-ref Module B §8c)',
    force: 'supervisory-guidance',
  },
  'DA-18.14-pq-hkma': {
    id: 'DA-18.14-pq-hkma',
    text: 'HKMA Fintech Promotion Blueprint (February 2026) introduces a Quantum Preparedness Index for Hong Kong banks, distinct from SFC VATP custody rules (see Module B §8c, optional further reading).',
    sourceId: 'HKMA-Fintech-Blueprint-2026',
    edition: 'HKMA Fintech Promotion Blueprint (3 February 2026)',
    locator: 'Quantum Preparedness Index (cross-ref Module B §8c)',
    force: 'supervisory-guidance',
  },
} as const satisfies Record<string, SourceClaim>

export type SourceClaimId = keyof typeof SOURCE_CLAIMS

export const ANALYSIS_CLAIMS = {
  'DA-18.14': {
    id: 'DA-18.14',
    kind: 'NEGATIVE',
    text: 'Across the held custody regulations and standards (DA-18.1 through DA-18.13 and DA-18.17), texts are largely algorithm-neutral — they rarely mandate specific curves, MPC versus HSM, or post-quantum migration — but several are NOT architecture-neutral: explicit cold-storage shares (SFC §10.6, Japan Cabinet Office Order), wallet segregation / statutory trusts (MiCA Art. 75, NYDFS §200.9 & Sept 2025 guidance, Singapore PSR Regs. 18B–18C, Swiss DEBA Art. 242a), and SFC Circular 25EC44 cold-wallet isolation expectations constrain custody architecture.',
    premiseIds: [
      'DA-18.1',
      'DA-18.2b',
      'DA-18.3',
      'DA-18.4a',
      'DA-18.7',
      'DA-18.7c',
      'DA-18.7d',
      'DA-18.10b',
      'DA-18.11a',
      'DA-18.17',
    ],
    g1Authorities:
      'Regulatory silence on an algorithm or architecture does not validate a design; check who holds signing, policy-update, and recovery authority under Rule G1.',
    asOfDate: '2026-11-21',
  },
  'DA-19.11': {
    id: 'DA-19.11',
    kind: 'ANALYSIS',
    text: 'A clean SOC 1, SOC 2, ISAE 3402, ISAE 3000 (Revised), or proof-of-reserves report does not prevent custody compromise: assurance reports evaluate controls over a service-organization-chosen scope and historical period (or a single snapshot), and insurance transfers post-incident financial loss rather than shrinking the cryptographic signing attack surface.',
    premiseIds: ['DA-19.4a', 'DA-19.4b', 'DA-19.5a', 'DA-19.5b', 'DA-19.5c', 'DA-18.16', 'DA-19.6'],
    g1Authorities:
      'Assurance scope depends on management’s system description; verify whether frontend transaction builders, signing-service APIs, upgrade keys, and recovery quorums were actually inside the tested boundary.',
    asOfDate: '2026-11-21',
  },
  'DA-20.1': {
    id: 'DA-20.1',
    kind: 'ANALYSIS',
    text: 'Q1 (Where is policy checked?): Strong pattern — policy is evaluated inside the signing boundary (HSM/enclave/co-signer) before signing. Acceptable alternatives — enough indispensable threshold/multisig signers enforce it independently, or an on-chain verifier enforces it. Residual risk — a host broker sitting in front of a policy-free signer can be bypassed if compromised.',
    premiseIds: ['Module A1 §5', 'DA-18.2b'],
    g1Authorities:
      'Rule G1 check: Who can modify the policy-engine code, firmware, or configuration, and what quorum gates that change?',
    asOfDate: '2026-11-21',
  },
  'DA-20.2': {
    id: 'DA-20.2',
    kind: 'ANALYSIS',
    text: 'Q2 (Full transaction or hash only?): Strong pattern — the signing boundary parses the full transaction it signs, or verifies a decoded form cryptographically bound to the raw transaction bytes. Acceptable alternatives — independent verifier devices decode the raw calldata before co-signing. Residual risk — blind-signing a 32-byte digest allows UI/proxy substitution.',
    premiseIds: ['Module A1 §5', 'DA-20.2-erc7730'],
    g1Authorities:
      'Rule G1 check: Who controls the transaction parser, ABI metadata, and clear-signing descriptor registry (e.g., ERC-7730 registry trust)?',
    asOfDate: '2026-11-21',
  },
  'DA-20.3': {
    id: 'DA-20.3',
    kind: 'ANALYSIS',
    text: 'Q3 (Policy-change governance): Strong pattern — policy changes require at least the same or a higher quorum than spending, enforced inside the signing boundary with a time delay and out-of-band alerting (Module A2 §5h, §5i). Residual risk — a single admin or vendor support role that can lower thresholds or add allowlist entries collapses spending controls.',
    premiseIds: ['Module A1 §5', 'Module A2 §5h', 'Module A2 §5i'],
    g1Authorities:
      'Rule G1 check: Can a contract-upgrade key, smart-account module, vendor master key, or admin role bypass the policy-change quorum?',
    asOfDate: '2026-11-21',
  },
  'DA-20.4': {
    id: 'DA-20.4',
    kind: 'ANALYSIS',
    text: 'Q4 (Attested approver hardware & trusted display): Strong pattern — approver keys live in attested hardware checked by the signing boundary or an independent verifier, with approvals cryptographically bound to decoded transaction content and revocable cleanly (Module A2 §5e). Residual risk — device attestation alone proves neither display correctness nor that the approval matches the decoded content.',
    premiseIds: ['Module A1 §5', 'Module A2 §5e', 'Module A2 §5i'],
    g1Authorities:
      'Rule G1 check: Can a single operator, IT admin, or vendor enrol a new approver device or substitute attestation root certificates?',
    asOfDate: '2026-11-21',
  },
  'DA-20.5': {
    id: 'DA-20.5',
    kind: 'ANALYSIS',
    text: 'Q5 (State, replay, and expiry): Strong pattern — approvals carry fresh nonces and short expiries, with replay counters and rate limits held inside the signing boundary, in correctly bound on-chain state, or in distributed consensus state (Module A2 §5j); no long-lived pre-signed transactions. Residual risk — a stateless HSM cannot hold durable monotonic counters without authenticated external state, and host-stored state can be rolled back.',
    premiseIds: ['Module A1 §5', 'Module A2 §5j'],
    g1Authorities:
      'Rule G1 check: Who can reset replay counters, restore a VM snapshot to roll back rate-limit state, or extend approval expiry?',
    asOfDate: '2026-11-21',
  },
  'DA-20.6': {
    id: 'DA-20.6',
    kind: 'ANALYSIS',
    text: 'Q6 (Recovery, rotation, and time locks): Strong pattern — time locks and veto windows are enforced inside the signing boundary or on-chain; recovery uses an independently satisfiable trigger (Module A2 §5f); key rotation does not bypass the signing quorum (Module A2 §5e). Residual risk — an opaque recovery backdoor or unmonitored guardian set undermines day-to-day quorum controls.',
    premiseIds: ['Module A2 §5e', 'Module A2 §5f', 'Module A2 §5j', 'Module A2 §5k'],
    g1Authorities:
      'Rule G1 check: Who holds recovery shares, guardian keys, and upgrade authority, and could a subset collude to bypass the operational quorum?',
    asOfDate: '2026-11-21',
  },
} as const satisfies Record<string, AnalysisClaim>

export type AnalysisClaimId = keyof typeof ANALYSIS_CLAIMS

export function claimText(id: SourceClaimId): string {
  // eslint-disable-next-line security/detect-object-injection
  return SOURCE_CLAIMS[id].text
}

export function analysisText(id: AnalysisClaimId): string {
  // eslint-disable-next-line security/detect-object-injection
  return ANALYSIS_CLAIMS[id].text
}
