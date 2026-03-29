#!/usr/bin/env node
/**
 * Compliance CSV Audit Script
 *
 * Reads compliance_03282026_r1.csv, applies accuracy fixes, adds new records,
 * expands industry fields, and writes compliance_03282026_r2.csv using PapaParse.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'src', 'data')
const INPUT = path.join(DATA_DIR, 'compliance_03282026_r1.csv')
const OUTPUT = path.join(DATA_DIR, 'compliance_03282026_r2.csv')

// ── Read and parse ──────────────────────────────────────────────────────────
const raw = fs.readFileSync(INPUT, 'utf-8')
const { data: rows } = Papa.parse(raw, { header: true, skipEmptyLines: true })

console.log(`Read ${rows.length} records from r1`)

// ── Helper ──────────────────────────────────────────────────────────────────
function findRow(id) {
  return rows.find((r) => r.id === id)
}

function addIndustry(row, industry) {
  const industries = row.industries.split(';').map((s) => s.trim())
  if (!industries.includes(industry)) {
    industries.push(industry)
    row.industries = industries.join(';')
  }
}

function addLibraryRef(row, ref) {
  const refs = row.library_refs ? row.library_refs.split(';').map((s) => s.trim()) : []
  if (!refs.includes(ref)) {
    refs.push(ref)
    row.library_refs = refs.join(';')
  }
}

function addTimelineRef(row, ref) {
  const refs = row.timeline_refs ? row.timeline_refs.split(';').map((s) => s.trim()) : []
  if (!refs.includes(ref)) {
    refs.push(ref)
    row.timeline_refs = refs.join(';')
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PART 1: Accuracy Fixes
// ═══════════════════════════════════════════════════════════════════════════════

// 1.1 Fix FIPS 206 status in NIST record
const nist = findRow('NIST')
if (nist) {
  nist.notes = nist.notes.replace(
    'FN-DSA (FIPS 206, Falcon) is in final draft',
    'FN-DSA (FIPS 206) published March 2025'
  )
  addLibraryRef(nist, 'FIPS 206')
  console.log('  Fixed: NIST FIPS 206 status + added library_ref')
}

// 1.2 Fix EUCC effective date (Feb 27 not Jan 27 per Regulation 2024/482 Art 67(2))
const eucc = findRow('EUCC')
if (eucc) {
  eucc.notes = eucc.notes.replace(
    'applicable from January 27 2025',
    'applicable from February 27 2025'
  )
  eucc.deadline = eucc.deadline.replace(
    'applicable from January 27 2025',
    'applicable from February 27 2025'
  )
  console.log('  Fixed: EUCC effective date (Feb 27 not Jan 27)')
}

// 1.3 Fix CROSS-005 / FIPS 206 description in threats (compliance CSV doesn't have CROSS-005
// but the NIST record was already fixed above)

// 1.4 Add missing library_refs and timeline_refs
const hkma = findRow('HKMA-PQC')
if (hkma) {
  addLibraryRef(hkma, 'BIS-Paper-158')
  addTimelineRef(hkma, 'Hong Kong:HKMA')
  console.log('  Fixed: HKMA-PQC added library_ref BIS-Paper-158 + timeline_ref')
}

const isoIec = findRow('ISO-IEC')
if (isoIec) {
  addLibraryRef(isoIec, 'ISO/IEC 14888-4:2024')
  addLibraryRef(isoIec, 'ISO/IEC 18033-2:2006/AMD1:2017')
  console.log('  Fixed: ISO-IEC added library_refs')
}

const indiaDst = findRow('INDIA-DST-PQC')
if (indiaDst) {
  addTimelineRef(indiaDst, 'India:DST/NQM')
  console.log('  Fixed: INDIA-DST-PQC added timeline_ref')
}

const indiaCertin = findRow('INDIA-CERTIN-CBOM')
if (indiaCertin) {
  addTimelineRef(indiaCertin, 'India:CERT-In')
  console.log('  Fixed: INDIA-CERTIN-CBOM added timeline_ref')
}

const bahrain = findRow('BAHRAIN-NCSC-PQC')
if (bahrain) {
  addTimelineRef(bahrain, 'Bahrain:NCSC')
  console.log('  Fixed: BAHRAIN-NCSC-PQC added timeline_ref')
}

const jordan = findRow('JORDAN-CBJ-PQC')
if (jordan) {
  addTimelineRef(jordan, 'Jordan:CBJ')
  console.log('  Fixed: JORDAN-CBJ-PQC added timeline_ref')
}

// ═══════════════════════════════════════════════════════════════════════════════
// PART 6: Industry Field Expansion (do before adding new records)
// ═══════════════════════════════════════════════════════════════════════════════

const nis2 = findRow('NIS2')
if (nis2) {
  addIndustry(nis2, 'Automotive')
  console.log('  Expanded: NIS2 added Automotive')
}

const euCra = findRow('EU-CRA')
if (euCra) {
  addIndustry(euCra, 'Healthcare')
  console.log('  Expanded: EU-CRA added Healthcare')
}

const iec62443 = findRow('IEC-62443')
if (iec62443) {
  addIndustry(iec62443, 'Automotive')
  console.log('  Expanded: IEC-62443 added Automotive')
}

const nistIr8547 = findRow('NIST-IR-8547')
if (nistIr8547) {
  addIndustry(nistIr8547, 'Telecommunications')
  addIndustry(nistIr8547, 'Aerospace')
  console.log('  Expanded: NIST-IR-8547 added Telecommunications + Aerospace')
}

const iso27001 = findRow('ISO-27001')
if (iso27001) {
  addIndustry(iso27001, 'Government & Defense')
  console.log('  Expanded: ISO-27001 added Government & Defense')
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARTS 2-5: New Records
// ═══════════════════════════════════════════════════════════════════════════════

const COLUMNS = [
  'id',
  'label',
  'description',
  'industries',
  'countries',
  'requires_pqc',
  'deadline',
  'notes',
  'enforcement_body',
  'library_refs',
  'timeline_refs',
  'body_type',
  'website',
  'trusted_source_id',
]

const newRecords = [
  // ── Part 2: Standardization Bodies (+3) ──
  {
    id: 'PKI-CONSORTIUM',
    label: 'PKI Consortium',
    description:
      'Industry consortium coordinating PQC readiness for PKI operators and certificate authorities',
    industries: 'Technology;Finance & Banking',
    countries: 'Global',
    requires_pqc: 'yes',
    deadline: 'Ongoing',
    notes:
      'PKI Consortium (pkic.org) organizes annual PQC conferences and publishes PQC migration guidance for certificate authorities. Active since 2013; PQC focus accelerated since 2023. Members include DigiCert, Sectigo, Keyfactor, Entrust. Published hybrid certificate guidance and interoperability testing reports for ML-DSA and composite certificates.',
    enforcement_body: 'PKI Consortium',
    library_refs: 'PKI-Consortium-PQC-2025',
    timeline_refs: '',
    body_type: 'standardization_body',
    website: 'https://pkic.org/',
    trusted_source_id: 'pki-consortium',
  },
  {
    id: 'CSA-QSC',
    label: 'Cloud Security Alliance',
    description:
      'Cloud Security Alliance Quantum-Safe Working Group developing quantum security controls for cloud environments',
    industries: 'Technology',
    countries: 'Global',
    requires_pqc: 'no',
    deadline: 'Ongoing',
    notes:
      'CSA Quantum-Safe Security Working Group publishes guidance on quantum-safe cloud security controls. CCM v4 includes cryptographic governance controls applicable to PQC migration. CSA also maintains the Cloud Controls Matrix used by cloud providers for compliance attestation. Referenced by CSA quantum-safe guidelines cited in threat profiles CLOUD-001 through CLOUD-004.',
    enforcement_body: 'CSA',
    library_refs: '',
    timeline_refs: '',
    body_type: 'standardization_body',
    website: 'https://cloudsecurityalliance.org/',
    trusted_source_id: '',
  },
  {
    id: 'ITU-T-SG17',
    label: 'ITU-T SG17',
    description:
      'ITU Telecommunication Standardization Sector Study Group 17 on security standards for global telecom PQC transition',
    industries: 'Telecommunications',
    countries: 'Global',
    requires_pqc: 'yes',
    deadline: 'Ongoing',
    notes:
      'ITU-T Study Group 17 (Security) includes Question 14/17 studying PQC for telecommunications networks. Develops X-series security recommendations. Coordinates with 3GPP SA3 and ETSI QSC on telecom PQC standardization. Focus areas include 5G/6G security architecture with PQC integration and quantum-safe key management for network operators.',
    enforcement_body: 'ITU-T',
    library_refs: '',
    timeline_refs: '',
    body_type: 'standardization_body',
    website: 'https://www.itu.int/en/ITU-T/studygroups/2022-2024/17/Pages/default.aspx',
    trusted_source_id: '',
  },

  // ── Part 3: Technical Standards (+3) ──
  {
    id: 'NIST-SP800-208',
    label: 'NIST SP 800-208',
    description: 'NIST recommendation for stateful hash-based signature schemes (LMS and XMSS)',
    industries: 'Government & Defense;Technology',
    countries: 'United States;Global',
    requires_pqc: 'yes',
    deadline: 'Ongoing (published October 2020)',
    notes:
      'NIST SP 800-208 specifies the Leighton-Micali Signature (LMS) and eXtended Merkle Signature Scheme (XMSS) for firmware signing and other stateful signature applications. Referenced by CNSA 2.0 as an approved signature algorithm for national security systems. Critical for firmware signing and code signing where stateful signatures are acceptable. Requires careful state management to prevent one-time key reuse.',
    enforcement_body: 'NIST',
    library_refs: 'NIST SP 800-208',
    timeline_refs: 'United States:NIST',
    body_type: 'technical_standard',
    website: 'https://csrc.nist.gov/pubs/sp/800/208/final',
    trusted_source_id: 'nist-csrc',
  },
  {
    id: 'ISO-19790',
    label: 'ISO/IEC 19790:2024',
    description:
      'International standard for security requirements for cryptographic modules — equivalent of FIPS 140-3',
    industries: 'Government & Defense;Technology;Finance & Banking',
    countries: 'Global',
    requires_pqc: 'no',
    deadline: 'Ongoing (3rd edition published 2024)',
    notes:
      'ISO/IEC 19790:2024 (3rd edition) defines security requirements for cryptographic modules. International equivalent of NIST FIPS 140-3. Used by JCMVP (Japan), KCMVP (South Korea), and as the basis for EUCC cryptographic module evaluation. PQC algorithm testing requirements are being updated as ISO/IEC JTC 1/SC 27 publishes PQC standards. Organizations outside US jurisdiction often require ISO/IEC 19790 rather than FIPS 140-3.',
    enforcement_body: 'ISO/IEC JTC 1/SC 27',
    library_refs: '',
    timeline_refs: '',
    body_type: 'technical_standard',
    website: 'https://www.iso.org/standard/81624.html',
    trusted_source_id: 'iso-iec-sc27',
  },
  {
    id: 'ETSI-QKD-SERIES',
    label: 'ETSI GS QKD Series',
    description:
      'ETSI Group Specification series for Quantum Key Distribution covering protocols interfaces and network management',
    industries: 'Telecommunications;Government & Defense',
    countries: 'European Union;Global',
    requires_pqc: 'no',
    deadline: 'Ongoing',
    notes:
      'ETSI ISG QKD has published 18 specifications covering QKD protocol interfaces (GS QKD 004), key delivery APIs (GS QKD 014), network interoperability (GS QKD 018), and management. QKD complements PQC for defense-in-depth in high-assurance environments. India DST/NQM roadmap recommends hybrid PQC plus QKD. BSI and ANSSI have published joint position papers on QKD vs PQC trade-offs.',
    enforcement_body: 'ETSI ISG QKD',
    library_refs: 'ETSI-GS-QKD-002;ETSI-GS-QKD-004;ETSI-GS-QKD-014;ETSI-GS-QKD-018',
    timeline_refs: '',
    body_type: 'technical_standard',
    website: 'https://www.etsi.org/committee/1430-qkd',
    trusted_source_id: 'etsi-cyber',
  },

  // ── Part 4: Certification Schemes (+2) ──
  {
    id: 'ANSSI-CERT',
    label: 'ANSSI Security Certification',
    description:
      'French national cybersecurity certification scheme — issued world first PQC product certifications in 2025',
    industries: 'Government & Defense;Technology',
    countries: 'France',
    requires_pqc: 'yes',
    deadline: '2027 (mandatory PQC qualification)',
    notes:
      'ANSSI security certification scheme issued the world first PQC product certifications (Sept-Oct 2025): Thales Smartcard MultiApp 5.2 Premium PQC (EAL5+) and Samsung S3SSE2A. The qualification process will require PQC from 2027 for new product submissions. ANSSI operates under the EUCC scheme and the SOG-IS Mutual Recognition Agreement. Separate from ANSSI as a standardization body (ANSSI-BODY).',
    enforcement_body: 'ANSSI',
    library_refs: 'ANSSI PQC Position Paper;ANSSI PQC Follow-up Paper;ANSSI-PQC-FAQ-2025',
    timeline_refs: 'France:ANSSI',
    body_type: 'certification_body',
    website: 'https://www.ssi.gouv.fr/en/products/certified-products/',
    trusted_source_id: 'anssi',
  },
  {
    id: 'JCMVP',
    label: 'JCMVP',
    description:
      'Japanese Cryptographic Module Validation Program — Japan equivalent of NIST CMVP for government procurement',
    industries: 'Government & Defense;Technology',
    countries: 'Japan',
    requires_pqc: 'no',
    deadline: 'Ongoing (PQC integration pending CRYPTREC evaluation)',
    notes:
      'JCMVP (Japanese Cryptographic Module Validation Program) is run by IPA (Information-technology Promotion Agency Japan). Japan equivalent of NIST CMVP/FIPS 140-3 based on ISO/IEC 19790 and JIS X 19790. Mandatory for Japanese government cryptographic module procurement. PQC algorithm integration is expected after CRYPTREC completes its PQC evaluation and publishes updated cipher recommendations.',
    enforcement_body: 'IPA/METI',
    library_refs: 'Japan CRYPTREC Report 2024',
    timeline_refs: 'Japan:CRYPTREC',
    body_type: 'certification_body',
    website: 'https://www.ipa.go.jp/en/security/jcmvp/index.html',
    trusted_source_id: 'cryptrec',
  },

  // ── Part 5: Compliance Frameworks (+5) ──
  {
    id: 'SG-CSA-QUANTUM',
    label: 'Singapore CSA Quantum-Safe Handbook',
    description:
      'Singapore Cyber Security Agency national guidelines for quantum-safe transition across all sectors',
    industries: 'Government & Defense;Technology;Finance & Banking;Telecommunications',
    countries: 'Singapore',
    requires_pqc: 'yes',
    deadline: 'Ongoing (published 2024)',
    notes:
      'CSA Singapore published the National Quantum-Safe Handbook providing comprehensive PQC migration guidance for all sectors. Goes beyond MAS financial circular (MAS-CIRCULAR) to cover government, telecom, and technology sectors. Includes algorithm selection guidance aligned with NIST FIPS 203/204/205, migration planning templates, and industry-specific recommendations. Singapore also runs a QKD Sandbox program.',
    enforcement_body: 'CSA Singapore',
    library_refs: 'Singapore-CSA-Quantum-Safe-Handbook',
    timeline_refs: 'Singapore:CSA/MAS',
    body_type: 'compliance_framework',
    website: 'https://www.csa.gov.sg/',
    trusted_source_id: 'csa-singapore',
  },
  {
    id: 'BRAZIL-ANPD-PQC',
    label: 'Brazil LGPD/ANPD PQC Guidance',
    description:
      'Brazilian data protection authority ANPD guidance on cryptographic requirements under LGPD with PQC implications',
    industries: 'Government & Defense;Technology;Finance & Banking',
    countries: 'Brazil',
    requires_pqc: 'no',
    deadline: 'Ongoing',
    notes:
      'Brazil Lei Geral de Protecao de Dados (LGPD) requires appropriate technical measures including encryption for personal data protection. ANPD (Autoridade Nacional de Protecao de Dados) has published guidance on security measures. While no explicit PQC mandate exists, LGPD long data retention requirements (up to lifetime for health data) create HNDL risk. Brazil is Latin Americas largest economy and a major financial services market. Banco Central do Brasil participates in BIS quantum readiness initiatives.',
    enforcement_body: 'ANPD',
    library_refs: '',
    timeline_refs: '',
    body_type: 'compliance_framework',
    website: 'https://www.gov.br/anpd/pt-br',
    trusted_source_id: '',
  },
  {
    id: 'DENMARK-CFCS-PQC',
    label: 'Denmark CFCS PQC Guidance',
    description:
      'Danish Centre for Cyber Security post-quantum cryptography guidance for government and critical infrastructure',
    industries: 'Government & Defense;Technology',
    countries: 'Denmark',
    requires_pqc: 'yes',
    deadline: 'Ongoing (aligned with EU coordinated roadmap)',
    notes:
      'CFCS (Centre for Cybersikkerhed) published PQC migration guidance for Danish government entities and critical infrastructure operators. Denmark is a Five Eyes+ partner and aligns with EU NIS2 and the EU coordinated PQC roadmap (EU-REC-2024-1101) timelines: national roadmaps by Dec 2026, high-risk migration by Dec 2030, full transition by Dec 2035. CFCS is part of the Danish Defence Intelligence Service.',
    enforcement_body: 'CFCS',
    library_refs: '',
    timeline_refs: '',
    body_type: 'compliance_framework',
    website: 'https://cfcs.dk/',
    trusted_source_id: '',
  },
  {
    id: 'DFS-NYCRR-500',
    label: 'NY DFS 23 NYCRR 500',
    description:
      'New York Department of Financial Services cybersecurity regulation with explicit encryption and key management requirements',
    industries: 'Finance & Banking',
    countries: 'United States',
    requires_pqc: 'no',
    deadline: 'Ongoing (Second Amendment effective Nov 2025)',
    notes:
      'NY DFS 23 NYCRR Part 500 is one of the most prescriptive US financial cybersecurity regulations. Section 500.15 requires encryption of nonpublic information both in transit and at rest using controls identified by the CISO risk assessment. The Second Amendment (effective November 2025) added enhanced requirements for encryption, key management, and incident response. While no explicit PQC mandate, the encryption requirements create a compliance pathway for PQC adoption as NIST standards mature. Applies to all DFS-regulated entities including banks, insurers, and financial service companies operating in New York.',
    enforcement_body: 'NY DFS',
    library_refs: '',
    timeline_refs: '',
    body_type: 'compliance_framework',
    website: 'https://www.dfs.ny.gov/industry_guidance/cybersecurity',
    trusted_source_id: '',
  },
  {
    id: 'ETSI-EN-303645',
    label: 'ETSI EN 303 645 (IoT Security)',
    description:
      'ETSI baseline cybersecurity standard for consumer IoT products with cryptographic requirements affecting long-lived devices',
    industries: 'Technology;Energy & Utilities;Telecommunications',
    countries: 'European Union;Global',
    requires_pqc: 'no',
    deadline: 'Ongoing (mandatory under EU RED delegated act from August 2025)',
    notes:
      'ETSI EN 303 645 establishes baseline cybersecurity provisions for consumer IoT products. Provision 5.1 mandates that all cryptography used must follow best practice and be updateable. The EU Radio Equipment Directive (RED) delegated act makes compliance mandatory for wireless IoT devices sold in the EU from August 2025. PQC relevance: IoT devices with 10-15 year lifespans deployed today will operate well into the CRQC era. The crypto-agility requirement (updatable cryptography) supports future PQC migration. Covers smart home, wearables, connected appliances, and industrial IoT.',
    enforcement_body: 'ETSI/EU Commission',
    library_refs: '',
    timeline_refs: '',
    body_type: 'compliance_framework',
    website: 'https://www.etsi.org/deliver/etsi_en/303600_303699/303645/',
    trusted_source_id: 'etsi-cyber',
  },
]

// Add new records
for (const rec of newRecords) {
  // Ensure all columns are present
  const row = {}
  for (const col of COLUMNS) {
    row[col] = rec[col] ?? ''
  }
  rows.push(row)
}

console.log(`  Added ${newRecords.length} new records`)

// ═══════════════════════════════════════════════════════════════════════════════
// Write output with PapaParse unparse()
// ═══════════════════════════════════════════════════════════════════════════════

const csv = Papa.unparse(rows, {
  columns: COLUMNS,
  newline: '\n',
})

fs.writeFileSync(OUTPUT, csv + '\n', 'utf-8')
console.log(`\nWrote ${rows.length} records to ${path.basename(OUTPUT)}`)

// ── Validation ──────────────────────────────────────────────────────────────
const check = Papa.parse(fs.readFileSync(OUTPUT, 'utf-8'), { header: true, skipEmptyLines: true })
console.log(`Verification: parsed back ${check.data.length} records from output file`)

// Check for body_type distribution
const typeCounts = {}
for (const r of check.data) {
  typeCounts[r.body_type] = (typeCounts[r.body_type] || 0) + 1
}
console.log('Body type distribution:', typeCounts)
