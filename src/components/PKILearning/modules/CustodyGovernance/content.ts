// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the CustodyGovernance module (LM-086).
 * lastReviewed is intentionally omitted until a formal content:review entry is recorded.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'custody-governance',
  version: '1.0.0',
  lastEdited: '2026-11-21',

  standards: [
    // EU: MiCA, DORA, RTS, ESMA/EBA
    getStandard('MICA-REG-2023-1114'),
    getStandard('DORA-REG-2022-2554'),
    getStandard('DORA-RTS-2024-1774'),
    getStandard('EU-DORA-TLPT-RTS-2025-1190'),
    getStandard('EU-MiCA-RTS-2025-305'),
    getStandard('ESMA-MiCA-RTS-Final-Report-First-Package'),
    getStandard('EBA-GL-ICT-Security-Risk-Management'),
    // Hong Kong: SFC
    getStandard('SFC-VATP-Guidelines'),
    getStandard('SFC-Circular-25EC44-Custody-Virtual-Assets'),
    // Dubai: VARA
    getStandard('VARA-Custody-Rulebook'),
    getStandard('VARA-Technology-Information-Rulebook'),
    getStandard('VARA-Company-Rulebook'),
    // New York: NYDFS
    getStandard('NY-DFS-23-NYCRR-500-A2'),
    getStandard('NY-DFS-23-NYCRR-Part-200-9'),
    getStandard('NYDFS-Custodial-Structures-Guidance-2025'),
    // Singapore: MAS & Payment Services Regulations
    getStandard('MAS-CIRCULAR-IT-RISK'),
    getStandard('MAS-PS-G03-Consumer-Protection-DPT'),
    getStandard('Singapore-Payment-Services-Regulations-2019'),
    // Japan: PSA & Cabinet Office Order
    getStandard('Japan-Payment-Services-Act'),
    getStandard('Japan-Cabinet-Office-Order-Cryptoasset'),
    // Switzerland: DEBA, Banking Act, FINMA
    getStandard('Swiss-DEBA-SR-281-1'),
    getStandard('Swiss-Banking-Act-SR-952-0'),
    getStandard('FINMA-Guidance-08-2023-Staking'),
    // US Federal Context Band (Accounting / Permissibility only)
    getStandard('SEC-SAB-121'),
    getStandard('SEC-SAB-122'),
    getStandard('OCC-Interpretive-Letter-1170'),
    getStandard('OCC-Interpretive-Letter-1184'),
    // International Policy & Industry Standards
    getStandard('IOSCO-FR11-2023-Crypto-Digital-Asset-Markets'),
    getStandard('CCSS-v9-0'),
    // Insurance / Broker Market-Practice Documents
    getStandard('Aon-Recent-Digital-Asset-Breach-2024'),
    getStandard('WTW-Digital-Assets-Evolving-Insurance-2023'),
    // Audit, Assurance & Proof of Reserves
    getStandard('AICPA-SOC-1-ICFR'),
    getStandard('AICPA-SOC-2-Trust-Services-Criteria'),
    getStandard('IAASB-ISAE-3402'),
    getStandard('IAASB-ISAE-3000-Revised'),
    getStandard('PCAOB-Investor-Advisory-Proof-of-Reserve-2023'),
    getStandard('IACR-ePrint-2015-1008-Provisions'),
    // Technical Cross-Reference & Optional Quantum Further Reading
    getStandard('ERC-7730-Structured-Data-Clear-Signing-Format'),
    getStandard('NIST IR 8547'),
    getStandard('BIS-Paper-158'),
    getStandard('SG-MAS-Quantum-Advisory-2024'),
    getStandard('HKMA-Fintech-Blueprint-2026'),
  ],

  algorithms: [getAlgorithm('ECDSA P-256'), getAlgorithm('Ed25519'), getAlgorithm('ML-DSA-65')],

  deadlines: [],

  narratives: {
    overview:
      'Intermediate digital-asset custody governance and assurance module answering how a custody design is evaluated, regulated, insured, and audited. It equips GRC leads, executives, and certification engineers with six structured custody-design evaluation questions under explicit Rule G1 authority assumptions, a jurisdiction-scoped regulatory control map across the EU, Hong Kong, Dubai, New York, Singapore, Japan, Switzerland, and international baselines, and a rigorous breakdown of custody insurance, SOC 1/ISAE 3402, SOC 2, ISAE 3000 (Revised), DORA TLPT scoping, and proof-of-reserves limitations.',
    keyConcepts:
      'Every regulatory, insurance, or audit cell is sourced with its article/section and edition date or explicitly marked "not stated" — educational guidance, never legal advice. Custody texts are largely algorithm-neutral (rarely mandating specific curves, MPC vs HSM, or PQC) yet several are not architecture-neutral (setting cold-storage expectations, wallet segregation, or statutory trust rules). US federal accounting and bank-permissibility texts (SEC SAB 121/122, OCC Interpretive Letters 1170/1184) sit in a separate context band rather than key-management control cells. Insurance caps or transfers post-incident loss without shrinking the attack surface; SOC 1/ISAE 3402, SOC 2, and ISAE 3000 (Revised) serve distinct assurance scopes; and proof-of-reserves snapshots are not financial audits.',
    workshopSummary:
      'One decision workshop (W11 — Regulation & Assurance Control Mapper): pick a built-in custody design preset (or map an existing design from Module A1 W4), apply applicability gates (entity type, licence, jurisdiction, effective version, exemptions, binding verb "shall" vs "should"), and compare multiple jurisdictions side by side — never as cumulative mandates — across key-management controls, a separate US federal context band, and market-practice "insurer asks" and "auditor tests" columns.',
    relatedStandards:
      'EU MiCA (2023/1114), MiCA RTS (2025/305), DORA (2022/2554), DORA ICT Risk RTS (2024/1774), DORA TLPT RTS (2025/1190), Hong Kong SFC VATP Guidelines & Circular 25EC44, Dubai VARA Custody/Technology/Company Rulebooks, NYDFS 23 NYCRR Parts 500 & 200.9 and Sept 2025 Custodial Structures Guidance, Singapore MAS TRM, PS-G03 & Payment Services Regulations 2019, Japan Payment Services Act & Cabinet Office Order, Swiss DEBA Art. 242a, Banking Act Art. 16(1bis) & FINMA Guidance 08/2023, SEC SAB 121/122, OCC Letters 1170/1184, IOSCO FR11/2023, CCSS v9.0, AICPA SOC 1/2, IAASB ISAE 3402 & ISAE 3000 (Revised), PCAOB 2023 Advisory, and Provisions (ePrint 2015/1008).',
  },
}
