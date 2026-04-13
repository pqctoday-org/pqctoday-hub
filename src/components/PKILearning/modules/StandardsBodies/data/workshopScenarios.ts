// SPDX-License-Identifier: GPL-3.0-only

export interface ScenarioOption {
  id: string
  label: string
}

export interface WorkshopScenario {
  id: string
  situation: string
  question: string
  bodyTypeOptions: ScenarioOption[]
  orgOptions: ScenarioOption[]
  standardOptions: ScenarioOption[]
  correctBodyType: string
  correctOrg: string
  correctStandard: string
  briefFeedback: string
  detailedExplanation: string
}

export const WORKSHOP_SCENARIOS: WorkshopScenario[] = [
  {
    id: 'us-hsm',
    situation:
      'Your US federal agency is procuring a new HSM to store ML-KEM keys for classified communications. A vendor claims their product "supports FIPS 140-3". You need to verify this claim before signing the purchase order.',
    question: 'Which program certifies that an HSM correctly implements FIPS 140-3?',
    bodyTypeOptions: [
      { id: 'standards-body', label: 'Standards Body' },
      { id: 'certification-body', label: 'Certification Body' },
      { id: 'compliance-framework', label: 'Compliance Framework' },
      { id: 'regulatory-agency', label: 'Regulatory Agency' },
    ],
    orgOptions: [
      { id: 'nist', label: 'NIST' },
      { id: 'cmvp', label: 'CMVP (Cryptographic Module Validation Program)' },
      { id: 'enisa', label: 'ENISA' },
      { id: 'nsa', label: 'NSA' },
    ],
    standardOptions: [
      { id: 'fips-140-3', label: 'FIPS 140-3' },
      { id: 'cnsa-2', label: 'CNSA 2.0' },
      { id: 'etsi-103744', label: 'ETSI TS 103 744' },
      { id: 'common-criteria', label: 'Common Criteria ISO/IEC 15408' },
    ],
    correctBodyType: 'certification-body',
    correctOrg: 'cmvp',
    correctStandard: 'fips-140-3',
    briefFeedback:
      'CMVP is the certification body. FIPS 140-3 is the standard being validated. NIST wrote FIPS 140-3 (standards body), but CMVP administers the validation program.',
    detailedExplanation:
      'FIPS 140-3 is the NIST standard that defines security requirements for cryptographic modules — it specifies what a module must do. The CMVP (jointly run by NIST and Canada\'s CSE) is the certification body that validates whether a specific product actually meets those requirements through NVLAP-accredited testing labs. Always verify CMVP status on the official NIST CMVP database (csrc.nist.gov/projects/cmvp) using the exact certificate number, as vendors sometimes claim "FIPS compliance" without having an actual CMVP certificate. For US federal procurement under FISMA, you need a current CMVP certificate, not just a vendor claim.',
  },
  {
    id: 'france-bank',
    situation:
      "Your multinational bank's French subsidiary must deploy PQC for customer authentication. A colleague says you need ANSSI approval for your cryptographic choices. You need to understand what ANSSI requires and what type of organization it is.",
    question: 'What type of body is ANSSI, and what is its primary requirement for PQC?',
    bodyTypeOptions: [
      { id: 'standards-body', label: 'Standards Body (creates technical standards)' },
      { id: 'certification-body', label: 'Certification Body (certifies products)' },
      { id: 'regulatory-agency', label: 'Regulatory Agency (issues government mandates)' },
      { id: 'compliance-framework', label: 'Compliance Framework (a set of rules)' },
    ],
    orgOptions: [
      { id: 'anssi', label: 'ANSSI (France)' },
      { id: 'etsi', label: 'ETSI (EU)' },
      { id: 'enisa', label: 'ENISA (EU)' },
      { id: 'bsi', label: 'BSI (Germany)' },
    ],
    standardOptions: [
      { id: 'hybrid-pqc', label: 'Hybrid PQC (classical + PQC required for sensitive systems)' },
      { id: 'fips-203', label: 'FIPS 203 standalone (ML-KEM only)' },
      { id: 'etsi-ts', label: 'ETSI TS 103 744 (mandatory)' },
      { id: 'iso-27001', label: 'ISO 27001 (information security management)' },
    ],
    correctBodyType: 'regulatory-agency',
    correctOrg: 'anssi',
    correctStandard: 'hybrid-pqc',
    briefFeedback:
      'ANSSI is a governmental regulatory agency. Its key PQC requirement is hybrid cryptography — for sensitive systems, classical and PQC algorithms must be used together (not PQC standalone).',
    detailedExplanation:
      "ANSSI (Agence nationale de la sécurité des systèmes d'information) is France's national cybersecurity authority — a governmental regulatory agency whose guidance is binding for regulated French entities. Unlike ISO or IETF, ANSSI has government authority. ANSSI's distinctive PQC position (2022/2023 papers) requires hybrid cryptography for sensitive systems: you must combine a classical algorithm (e.g., ECDH) with a PQC algorithm (e.g., ML-KEM-768) in parallel, not replace classical cryptography outright. This is more conservative than NIST's approach. The rationale: if a PQC algorithm is broken, the classical component still provides protection. ANSSI does permit standalone SLH-DSA (hash-based signatures) because its security relies solely on hash function assumptions, which differ from lattice assumptions underlying ML-DSA.",
  },
  {
    id: 'eu-cc',
    situation:
      'Your software company wants to sell a secure communication product to an EU government ministry. The procurement specification requires a Common Criteria certification. You need to understand which EU body manages this certification and under which scheme.',
    question:
      'Which EU agency manages the EUCC (the EU version of Common Criteria), and under which framework?',
    bodyTypeOptions: [
      { id: 'standards-body', label: 'Standards Body' },
      { id: 'certification-body', label: 'Certification Body' },
      { id: 'regulatory-agency', label: 'Regulatory Agency' },
      { id: 'compliance-framework', label: 'Compliance Framework' },
    ],
    orgOptions: [
      { id: 'etsi', label: 'ETSI' },
      { id: 'enisa', label: 'ENISA' },
      { id: 'bsi', label: 'BSI (Germany only)' },
      { id: 'common-criteria', label: 'CCRA (international scheme)' },
    ],
    standardOptions: [
      { id: 'eucc', label: 'EUCC (EU Cybersecurity Certification Scheme)' },
      { id: 'nist-fips', label: 'NIST FIPS 140-3' },
      { id: 'etsi-ts', label: 'ETSI TS 103 744 certification' },
      { id: 'iso-15408', label: 'ISO/IEC 15408 (global CC, no EU-specific recognition)' },
    ],
    correctBodyType: 'certification-body',
    correctOrg: 'enisa',
    correctStandard: 'eucc',
    briefFeedback:
      'ENISA manages the EUCC (EU Cybersecurity Certification Scheme). The EUCC is the EU-specific adaptation of Common Criteria, valid across all EU member states.',
    detailedExplanation:
      "The EUCC (EU Cybersecurity Certification Scheme for CC-based evaluations) was established under the EU Cybersecurity Act (2019) and is managed by ENISA. It's an EU-wide adaptation of Common Criteria (ISO/IEC 15408) that creates a harmonized certification valid across all 27 EU member states, eliminating the previous need for separate national certifications in each country. ENISA maintains the scheme rules and the Agreed Cryptographic Mechanisms (ACM) list, which specifies which PQC algorithms are approved for products seeking EUCC certification. National Certification Authorities (e.g., BSI in Germany, ANSSI in France) can issue EUCC certificates, and these are mutually recognized across the EU. For your product, you'd work with an accredited lab (ITSEF) to evaluate it against a Protection Profile, then a National CA would issue the EUCC certificate.",
  },
  {
    id: 'tls-ietf',
    situation:
      "Your engineering team is adding PQC to your TLS 1.3 library for ML-KEM key exchange. They find references to both 'FIPS 203' (NIST) and 'X25519MLKEM768' (IETF draft). They ask: are these from the same organization? Which body do they follow for the TLS integration?",
    question:
      'Which body standardizes the hybrid X25519MLKEM768 key exchange for TLS 1.3, and what working group?',
    bodyTypeOptions: [
      { id: 'standards-body', label: 'Standards Body' },
      { id: 'certification-body', label: 'Certification Body' },
      { id: 'regulatory-agency', label: 'Regulatory Agency' },
      { id: 'compliance-framework', label: 'Compliance Framework' },
    ],
    orgOptions: [
      { id: 'nist', label: 'NIST (same body as FIPS 203)' },
      { id: 'ietf', label: 'IETF (TLS Working Group)' },
      { id: 'etsi', label: 'ETSI TC CYBER' },
      { id: 'iso-iec', label: 'ISO/IEC JTC 1/SC 27' },
    ],
    standardOptions: [
      { id: 'fips-203', label: 'FIPS 203 (ML-KEM algorithm spec)' },
      { id: 'tls-hybrid', label: 'draft-ietf-tls-hybrid-design (X25519MLKEM768)' },
      { id: 'cnsa-2', label: 'CNSA 2.0 (NSA mandate)' },
      { id: 'etsi-ts', label: 'ETSI TS 103 744 (TLS profile)' },
    ],
    correctBodyType: 'standards-body',
    correctOrg: 'ietf',
    correctStandard: 'tls-hybrid',
    briefFeedback:
      'IETF TLS WG standardizes X25519MLKEM768. NIST defined the ML-KEM algorithm (FIPS 203); IETF defines how to use it in TLS. These are complementary, not competing.',
    detailedExplanation:
      'FIPS 203 and X25519MLKEM768 come from different but complementary organizations. NIST (a standards body) published FIPS 203 defining the ML-KEM algorithm — what the math is, what the security levels are, how encapsulation/decapsulation work. The IETF TLS Working Group (also a standards body, but protocol-focused) published the hybrid key exchange draft defining how to combine X25519 (classical ECDH) with ML-KEM-768 in a TLS 1.3 handshake — specifically the NamedGroup identifier, the key_exchange format, and the key derivation. The IETF consumes NIST algorithm standards and integrates them into protocol standards. For your TLS library: implement ML-KEM per FIPS 203, then implement the hybrid key exchange per the IETF draft. Chrome and Firefox already ship X25519MLKEM768 in production.',
  },
  {
    id: 'dod-cnsa',
    situation:
      "Your company won a DoD contract requiring PQC for data at rest. The contract references 'CNSA 2.0 compliance' with a 2030 deadline for exclusive PQC use. You need to identify who authored CNSA 2.0 and what underlying algorithm standard it mandates.",
    question:
      'Who authored CNSA 2.0, and which NIST standard defines the required ML-KEM algorithm?',
    bodyTypeOptions: [
      { id: 'standards-body', label: 'Standards Body (created the algorithm spec)' },
      { id: 'regulatory-agency', label: 'Regulatory Agency (issued the mandate)' },
      { id: 'certification-body', label: 'Certification Body (certifies compliance)' },
      { id: 'compliance-framework', label: 'Compliance Framework (a ruleset)' },
    ],
    orgOptions: [
      { id: 'nist', label: 'NIST — authors of both CNSA 2.0 and FIPS 203' },
      { id: 'nsa', label: 'NSA — author of CNSA 2.0 (references NIST FIPS 203)' },
      { id: 'cisa', label: 'CISA — issues DoD procurement guidance' },
      { id: 'dod', label: 'DoD directly (no intermediary)' },
    ],
    standardOptions: [
      { id: 'fips-203-mlkem', label: 'FIPS 203 (ML-KEM-1024 required by CNSA 2.0)' },
      { id: 'fips-204', label: 'FIPS 204 (ML-DSA — for signatures)' },
      { id: 'cnsa-1', label: 'CNSA 1.0 (the previous version, classical algorithms)' },
      { id: 'nist-sp-800', label: 'NIST SP 800-227 (KEM guidance document)' },
    ],
    correctBodyType: 'regulatory-agency',
    correctOrg: 'nsa',
    correctStandard: 'fips-203-mlkem',
    briefFeedback:
      'NSA authored CNSA 2.0 (regulatory agency). It mandates ML-KEM-1024 from FIPS 203 (NIST standard). CNSA 2.0 is a mandate that references NIST standards — two different bodies, complementary roles.',
    detailedExplanation:
      'CNSA 2.0 (Commercial National Security Algorithm Suite 2.0) was published by the NSA in September 2022. NSA is a governmental regulatory agency whose mandates are binding for US National Security Systems (NSS) — all government systems that process classified or sensitive national security information. CNSA 2.0 mandates specific parameter sets: ML-KEM-1024 (not 512 or 768) for key establishment, ML-DSA-87 for signatures, and XMSS or LMS (stateful hash-based) for software/firmware signing. Note: SLH-DSA is not part of CNSA 2.0 — the NSA chose stateful hash-based schemes (LMS/XMSS) instead. The underlying algorithm definitions come from NIST (a different standards body): FIPS 203 defines ML-KEM, FIPS 204 defines ML-DSA, FIPS 205 defines SLH-DSA. DoD contractors must implement CMVP-validated modules (CMVP is the certification body) that implement these NIST algorithms at the specific parameter levels CNSA 2.0 requires. This chain — NIST standard → CMVP certification → NSA/CNSA mandate — is the full compliance picture.',
  },
]
