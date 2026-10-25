// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Library publishers (release 4.180.1).
 *
 * Every active Library entry names the organisation that published its document, and the trust
 * score reads that publisher from the link file (trusted_source_xref_*.csv), not from the Library
 * column. These tests pin the three files together: the publishers registered for this release, the
 * entries that were linked to the wrong publisher, and the entries that had no publisher at all.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import Papa from 'papaparse'
import { trustedSources } from './trustedSourcesData'
import { trustedSourceXrefs, xrefsByResource, xrefsBySource } from './trustedSourceXrefData'

const DATA_DIR = path.join(process.cwd(), 'src', 'data')

/** Newest dated generation of a file family (MMDDYYYY, optional _rN), read straight from disk. */
function latestCsvRows(prefix: string): Record<string, string>[] {
  const re = new RegExp(`^${prefix}_(\\d{2})(\\d{2})(\\d{4})(?:_r(\\d+))?\\.csv$`)
  const newest = fs
    .readdirSync(DATA_DIR)
    .map((f) => {
      const m = f.match(re)
      return m ? { f, key: Number(m[3] + m[1] + m[2]) * 1000 + Number(m[4] ?? 0) } : null
    })
    .filter((c): c is { f: string; key: number } => c !== null)
    .sort((a, b) => b.key - a.key)[0]
  const raw = fs.readFileSync(path.join(DATA_DIR, newest.f), 'utf-8')
  return Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true }).data
}

const libraryRows = latestCsvRows('library')
const registryRows = latestCsvRows('trusted_sources')
const libraryById = new Map(libraryRows.map((r) => [r.reference_id, r]))
const registryById = new Map(registryRows.map((r) => [r.source_id, r]))
const isActive = (r: Record<string, string>) => (r.status?.trim() || 'active') === 'active'
const libraryLinks = (id: string) =>
  (xrefsByResource.get(id) ?? []).filter((x) => x.resourceType === 'library')

/** Publishers registered for this release: id, type, tier. */
const NEW_PUBLISHERS: [string, string, string][] = [
  ['afuzion', 'Vendor', '3_Supporting'],
  ['aps', 'Academic', '2_Core'],
  ['cert-manager', 'Open_Source_Project', '3_Supporting'],
  ['visa', 'Vendor', '3_Supporting'],
  ['university-of-waterloo', 'Academic', '2_Core'],
  ['springer', 'Academic', '2_Core'],
  ['thales-group', 'Vendor', '3_Supporting'],
  ['dev-community', 'Industry_Analyst', '4_Contextual'],
  ['ieee-xplore', 'Academic', '2_Core'],
  ['gaisler', 'Vendor', '3_Supporting'],
  ['wikipedia', 'Industry_Analyst', '4_Contextual'],
  ['enix', 'Vendor', '3_Supporting'],
  ['nasa', 'Government', '1_Authoritative'],
  ['openssl-corporation', 'Vendor', '3_Supporting'],
  ['ruscrypto', 'Academic', '3_Supporting'],
  ['sptel', 'Vendor', '3_Supporting'],
  ['thesai', 'Academic', '3_Supporting'],
  ['akeyless', 'Vendor', '3_Supporting'],
  ['anthropic', 'Vendor', '3_Supporting'],
  ['anza', 'Vendor', '3_Supporting'],
  ['bis-us', 'Government', '1_Authoritative'],
  ['fair-institute', 'Industry_Workgroup', '3_Supporting'],
  ['free-software-foundation', 'Open_Source_Project', '3_Supporting'],
  ['hl7', 'Standards_Body', '2_Core'],
  ['hse-uk', 'Government', '1_Authoritative'],
  ['icheme', 'Industry_Workgroup', '3_Supporting'],
  ['icrepq', 'Academic', '3_Supporting'],
  ['pearson-informit', 'Vendor', '4_Contextual'],
  ['iso', 'Standards_Body', '1_Authoritative'],
  ['open-group', 'Standards_Body', '2_Core'],
  ['doe-osti', 'Government', '1_Authoritative'],
  ['pablosec-solutions', 'Vendor', '3_Supporting'],
  ['pmi', 'Industry_Workgroup', '3_Supporting'],
  ['profibus-profinet-international', 'Industry_Workgroup', '3_Supporting'],
  ['texas-instruments', 'Vendor', '3_Supporting'],
  ['zcash', 'Open_Source_Project', '3_Supporting'],
  ['tec-india', 'Government', '1_Authoritative'],
  ['hsbc', 'Vendor', '3_Supporting'],
  ['invicti', 'Vendor', '3_Supporting'],
]

/** Entries whose link named the wrong publisher: the Library column already had the right one. */
const CORRECTED_LINKS: [string, string][] = [
  ['CZ-NUKIB-Crypto-Requirements-2023', 'nukib'],
  ['USENIX-2024-HQC-Division-Timing', 'usenix-security'],
  ['ref-kim-ecdlp', 'iacr-eprint'],
  ['CC-2022-PART2', 'common-criteria-portal'],
  ['CC-2022-PART3', 'common-criteria-portal'],
  ['CC-2022-CEM', 'common-criteria-portal'],
  ['PCI-DSS-QRG', 'pci-ssc'],
  ['PQShield-4-Quantum-Threats-Enterprises-2026', 'quantum-zeitgeist'],
  ['EO-14028', 'the-white-house-executive-orde'],
  ['RFC-9345', 'ietf-rfc-series'],
  ['ISO-26262-Road-vehicles-Functional-safety', 'iso-tc-22-road-vehicles'],
  ['draft-ietf-lamps-pq-composite-kem-23', 'ietf'],
]

/** Entries that had no publisher in the Library column: the five that were linked to the European Commission by mistake and the three that were already right. */
const FILLED_FROM_LINK: [string, string][] = [
  ['CA-CFDIR-Quantum-Readiness-2023', 'ised-canada'],
  ['CA-TBS-SPIN-PQC-2025', 'tbs-canada'],
  ['IN-TEC-PQC-Migration-Report-2025', 'tec-india'],
  ['HSBC-InfoSecGlobal-Thales-CryptographicInventory-2025', 'hsbc'],
  ['Invicti-OWASP-CryptoFailures-2025', 'invicti'],
  ['ISO-IEC-27001-2022', 'iso-iec-sc27'],
  ['A-First-Look-at-Digital-Rights-Management-Systems-for-Secure', 'arxiv-crypto'],
  ['Ethereum-Foundation-Roadmap-Account-Abstraction', 'eth-foundation'],
]

/** Entries that named a publisher the registry did not have. */
const NAMED_UNREGISTERED: [string, string][] = [
  ['Samsung-Thales-ML-KEM-eSE-2026', 'thales-group'],
  ['Agile-Post-Quantum-Secure-Cryptography-in-Avionics', 'springer'],
  ['Evaluation-of-Time-Critical-Communications-for-IEC-61850-Sub', 'arxiv-crypto'],
]

/** Active Library entries that had no publisher and no link before this release. */
const PREVIOUSLY_UNPUBLISHED = [
  'DO-178C-Costs-vs-Benefits-Analysis',
  'A-Multifaceted-Look-at-Starlink-Performance',
  'A-Scenario-Based-Evaluation-of-CRQC-AI-Vulnerability-Spectru',
  'A-fast-quantum-mechanical-algorithm-for-database-search',
  'A-tweezer-array-with-6100-highly-coherent-atomic-qubits',
  'ARINC-429-Cyber-vulnerabilities-and-Voltage-Data-in-a-Hardwa',
  'Advanced-Physical-Layer-Technologies-in-VHF-Data-Link-for-Ae',
  'Architectural-mechanisms-of-a-universal-fault-tolerant-quant',
  'Deep-CNN-Face-Matchers-Inherently-Support-Revocable-Biometri',
  'Factoring-using-2n-2-qubits-with-Toffoli-based-modular-multi',
  'Layered-Performance-Analysis-of-TLS-1-3-Handshakes-Classical',
  'Logical-computation-demonstrated-with-a-neutral-atom-quantum',
  'Mapping-Quantum-Threats-An-Engineering-Inventory-of-Cryptogr',
  'Micius-quantum-experiments-in-space',
  'Polynomial-Time-Algorithms-for-Prime-Factorization-and-Discr',
  'Potential-Data-Link-Candidates-for-Civilian-Unmanned-Aircraf',
  'Quantum-Resource-Estimates-for-Computing-Elliptic-Curve-Disc',
  'Quantum-cryptography-Public-key-distribution-and-coin-tossin',
  'Satellite-Relayed-Intercontinental-Quantum-Network',
  'Signature-Correction-Attack-on-Dilithium-Signature-Scheme',
  'Starlink-Constellation-Deployment-Configuration-and-Dynamics',
  'System-Architecting-for-GEO-Communication-Satellite-Consider',
  'Toward-Quantum-Safe-6G-Experimental-Evaluation-of-Post-Quant',
  'Toward-Space-Based-Public-Key-Systems-Enabling-Secure-Space',
  'AWS-KMS-adds-support-for-post-quantum-ML-DSA-digital-signatu',
  'Amazon-CloudFront-launches-TLS-security-policy-with-post-qua',
  'A-look-at-the-latest-post-quantum-signature-standardization',
  'Simple-Proof-of-Security-of-the-BB84-Quantum-Key-Distributio',
  'Prometheus-Metrics-cert-manager-Documentation',
  'Visa-Token-Service',
  'A-Gentle-Introduction-to-Lattice-Based-Cryptography',
  'Falcon-Towards-FN-DSA-Technical-Overview',
  'NIST-CMVP-ESV-Announcements',
  'NIST-CMVP-ESV-Program',
  'NIST-CMVP-MIS-SP800-140B',
  'Alghamdi-Schukat-Cybersecurity-2021-4-12',
  'Luna-HSM-Firmware-v7-9-Release-NIST-Approved-PQC-Algorithms',
  'Anchors-Post-Quantum-Command-Provenance-for-Autonomous-Machi',
  'Concrete-Hybrid-PQ-T-Key-Encapsulation-Mechanisms',
  'FrodoKEM-key-encapsulation-from-learning-with-errors',
  'Post-Quantum-Cryptography-Recommendations-for-Key-Fragmentat',
  'Post-Quantum-Evidence-Records-with-Algorithm-Agility-Wathiqa',
  'The-Internet-Identity-Card-IIC-Credential-Format-A-Self-Cont',
  'draft-becker-cnsa2-smime-profile',
  'draft-fregly-research-agenda-for-pqc-dnssec-00',
  'RFC-2986-PKCS-10-Certification-Request-Syntax-Specification',
  'TLS-Termination-Models-SSL-Passthrough-vs-SSL-Termination-vs',
  'Crypto-getRandomValues-method-Web-APIs-MDN',
  'Ubuntu-24-04-LTS-release-notes',
  'Implementation-of-a-Hybrid-QKD-PQC-Network-and-Applications',
  'GR740-Radiation-Summary',
  'NIAP-cPP-DSC-Supporting-Document-Version-2-1',
  'Secondary-Signature-Algorithms',
  'RAD750',
  'A-Polynomial-Time-Quantum-Algorithm-for-the-Dihedral-Coset-P',
  'Cybersecurity-in-an-Era-with-Quantum-Computers-Will-We-Be-Re',
  'Intel-SGX-Explained',
  'Lattice-based-Signature-Schemes-for-Bitcoin',
  'Migration-to-Post-Quantum-Cryptography-From-ECDSA-to-ML-DSA',
  'Quasipolynomial-Cryptanalysis-of-the-McEliece-Cryptosystem-o',
  'Solving-the-supersingular-isogeny-problem-in-time-p-2-5-o-1',
  'Template-and-CPA-Side-Channel-Attacks-on-the-Kyber-ML-KEM-Pa',
  'The-supersingular-isogeny-problem-in-time-and-memory-p-1-3-o',
  'Commission-Delegated-Regulation-EU-2018-389-of-27-November-2',
  'oqs-provider-OpenSSL-3-provider-containing-post-quantum-algo',
  'shrincs-bip-SHRINCS-md-at-main-SHRINCS-shrincs-bip-GitHub',
  'specs-archive-dev-cryptographic-specs-falcon-deterministic-p',
  'usnistgov-ACVP-Automated-Cryptographic-Validation-Protocol-S',
  'usnistgov-ACVP-Server-Public-Reference-Sample-Vector-Sets',
  'x509-certificate-exporter',
  'IEEE-Std-802-3bp-2016-1000BASE-T1-PHY',
  'HAWK-n-Key-Recovery-Reduces-to-SVP-in-Dimension-n-2-1',
  'What-is-Azure-Dedicated-HSM',
  'Chosen-Ciphertext-Attacks-Against-Protocols-Based-on-the-RSA',
  'A-Public-Key-Cryptosystem-Based-On-Algebraic-Coding-Theory',
  'FIPS-200-Minimum-Security-Requirements-for-Federal-Informati',
  'NIST-SP-800-128-Guide-for-Security-Focused-Configuration-Man',
  'NIST-SP-800-161r1-upd1-Cybersecurity-Supply-Chain-Risk-Manag',
  'NIST-SP-800-207A-A-Zero-Trust-Architecture-Model-for-Access',
  'NIST-SP-800-38A-Recommendation-for-Block-Cipher-Modes-of-Ope',
  'NIST-SP-800-38B-Recommendation-for-Block-Cipher-Modes-of-Ope',
  'NIST-SP-800-38F-Recommendation-for-Block-Cipher-Modes-of-Ope',
  'NIST-SP-800-60-Vol-1-Rev-1-Guide-for-Mapping-Types-of-Inform',
  'NIST-SP-800-89-Recommendation-for-Obtaining-Assurances-for-D',
  'OpenSSL-1-1-1-End-Of-Life-Approaching',
  'NIST-ACMVP-Protocol-Workstream',
  'Trends-in-PKI-Security-A-Global-Study-of-Trends-Challenges-B',
  'Characteristics-of-the-Universal-Subscriber-Identity-Module',
  'The-Applied-Quantum-PQC-Migration-Framework-Universal-Versio',
  'PQShield-Leadership-Lounge-NIST-standards-the-PQC-turning-po',
  'DO-326A-Airworthiness-Security-Process-Specification',
  'The-early-days-of-experimental-quantum-cryptography',
  'Post-Quantum-Key-Encapsulation-Scheme-Kodiyum',
  'Resistance-Analysis-of-Post-Quantum-Signature-Scheme-Shipovn',
  '429P2-17-Digital-Information-Transfer-System-DITS-Part-2-Dis',
  '618-9-Air-Ground-Character-Oriented-Protocol-Specification',
  '664P7-1-Aircraft-Data-Network-Part-7-Avionics-Full-Duplex-Sw',
  'ARINC-653P0-4-Avionics-Application-Software-Standard-Interfa',
  'Singapore-National-Quantum-Safe-Network-Plus-NQSN',
  'IEEE-Standard-for-Smart-Energy-Profile-Application-Protocol',
  'IEEE-Standard-for-Wireless-Access-in-Vehicular-Environments',
  'tc26-Kodieum-Kryptonit-PQ-Mechanism',
  'The-Total-Economic-Impact-Of-DigiCert-ONE',
  'About-Updating-SafeNet-Network-HSM',
  'Post-Quantum-Algorithms-Luna-HSM',
  'Integrated-Methodology-for-Information-Security-Risk-Managem',
  'IEC-62056-5-3-2023-Electricity-metering-data-exchange-The-DL',
  'IEC-62351-6-2020-Power-systems-management-and-associated-inf',
  'IEC-62443-4-2-2019-Security-for-industrial-automation-and-co',
  '3GPP-TS-35-240-Specification-of-the-Snow-5G-based-256-bits-a',
  '3GPP-TS-35-246-Specification-of-the-ZUC-256-based-256-bits-a',
  'Secret-Zero-Tackling-the-Secret-Zero-Problem',
  'Discovering-cryptographic-weaknesses-with-Claude',
  'Quantumglow-Will-Solana-s-Performance-Survive-Quantum-Comput',
  'BIP-361-Post-Quantum-Migration-and-Legacy-Signature-Sunset',
  'CAR-2-CAR-Communication-Consortium-HSM-Protection-Profile',
  'Post-quantum-questions-to-ask-your-vendors-Cyber-gov-au',
  '15-CFR-740-13-Technology-and-software-unrestricted-TSU',
  '740-17-Encryption-commodities-software-and-technology-ENC',
  'F5-BIG-IP-v21-1-is-now-generally-available-bringing-PQC-and',
  'The-Importance-and-Effectiveness-of-Cyber-Risk-Quantificatio',
  'FDA-Drug-Supply-Chain-Security-Act-DSCSA',
  'GNU-General-Public-License',
  '15-CFR-742-15-Encryption-items',
  '21-CFR-312-62-Investigator-recordkeeping-and-record-retentio',
  'GSMA-PQ-06-Implementation-and-Prototype-Verification-PQC-Hyb',
  'GSMA-PQ-07-Post-Quantum-Cryptography-for-Non-Terrestrial-Net',
  'SMART-App-Launch',
  'HSE-ECI-Functional-Safety',
  'IBM-Quantum-Development-Roadmap',
  'Derbyshire-IChemE-Hazards26-2016',
  'Torres-ICREPQ-2024-341',
  'Introduction-to-the-IETF',
  'Use-of-FN-DSA-in-TLS-1-3',
  'The-Art-of-Computer-Programming-Volume-2-Seminumerical-Algor',
  'A-Q-A-with-Atsushi-Yamada-PQC-Addressing-Risk-Management-Nee',
  'Cards-and-security-devices-for-personal-identification-Conta',
  'Cards-and-security-devices-for-personal-identification-Conta-2',
  'Codes-for-the-representation-of-names-of-countries-and-their',
  'ISO-10681-1-2010-Road-vehicles-Communication-on-FlexRay-Part',
  'ISO-11898-1-2024-Road-vehicles-Controller-area-network-CAN-P',
  'ISO-21448-2022-Road-vehicles-Safety-of-the-intended-function',
  'ISO-31000-2018-Risk-management-Guidelines',
  'ISO-8583-2023-Financial-transaction-card-originated-messages',
  'ISO-IEC-11889-2015-Information-technology-Trusted-Platform-M',
  'ISO-IEC-15408-1-2022-Evaluation-criteria-for-IT-security-Com',
  'ISO-IEC-19790-2025',
  'ISO-IEC-19794-2-2011-Biometric-data-interchange-formats-Part',
  'ISO-IEC-20085-1-2019-Test-tool-requirements-and-test-tool-ca',
  'ISO-IEC-24759-2025-Test-requirements-for-cryptographic-modul',
  'ISO-IEC-27005-2022-Guidance-on-managing-information-security',
  'ISO-IEC-28033',
  'ISO-IEC-7816-4-2020-Identification-cards-Integrated-circuit',
  'ISO-SAE-21434-2021-Road-vehicles-Cybersecurity-engineering',
  'Road-vehicles-Vehicle-to-grid-communication-interface-Part-1',
  'Road-vehicles-Vehicle-to-grid-communication-interface-Part-2',
  'Summary-of-NATO-s-Quantum-Technologies-Strategy',
  'AI-models-collapse-when-trained-on-recursively-generated-dat',
  'Entanglement-based-secure-quantum-cryptography-over-1-120-ki',
  'NCCoE-Automation-of-the-CMVP',
  'Institute-of-Commercial-Cryptography-Standards',
  'The-Open-FAIR-Body-of-Knowledge',
  'OpenSSH-Post-Quantum-Cryptography',
  'PNNL-29313-RADIANCE',
  'SAND2022-1118',
  'MTU-and-Deep-SSL-Inspection-Essential-Insights-for-2026',
  'PCI-DSS-v4-0-1-Requirements-and-Testing-Procedures',
  'Understanding-Programs-and-Projects',
  'PI-PROFINET-Security-Whitepaper-V105-2019',
  'Industry-Today-Reports-Why-Cryptography-Needs-to-Change-QuSe',
  'Analysis-of-the-Codecov-Supply-Chain-Compromise',
  'RFC-3526-More-Modular-Exponential-MODP-Diffie-Hellman-groups',
  'RFC-4211-Internet-X-509-PKI-Certificate-Request-Message-Form',
  'RFC-5816-ESSCertIDv2-Update-for-RFC-3161',
  'RFC-6066-Transport-Layer-Security-TLS-Extensions-Extension-D',
  'RFC-7512-The-PKCS-11-URI-Scheme',
  'RFC-9360-CBOR-Object-Signing-and-Encryption-COSE-Header-Para',
  'RFC-9700-Best-Current-Practice-for-OAuth-2-0-Security',
  'SolarWinds-Corporation-Form-8-K-December-14-2020',
  'Root-Causes-626-TLS-1-3-Roadblock-Sectigo-Official',
  'Critical-Role-of-MACsec-in-Automotive-Security',
  'Quantum-Safe-Cryptography-Helping-customers-prepare-against',
  'IMO-Maritime-Cyber-Risk-Management-Guidelines',
  'ZIP-2005-Ironwood-Quantum-Recoverability',
]

describe('Library publishers: registry', () => {
  it('registers the 39 new publishers with the approved type and tier', () => {
    expect(NEW_PUBLISHERS).toHaveLength(39)
    for (const [id, type, tier] of NEW_PUBLISHERS) {
      const row = registryById.get(id)
      expect(row, `${id} is missing from the registry`).toBeDefined()
      expect(row?.source_type).toBe(type)
      expect(row?.trust_tier).toBe(tier)
      expect(row && isActive(row)).toBe(true)
      expect(trustedSources.find((s) => s.sourceId === id)?.trustTier).toBe(tier)
    }
  })

  it('keeps the choices made for the shared publishers', () => {
    const pick = (id: string) => registryById.get(id)
    expect(pick('iso')?.trust_tier).toBe('1_Authoritative')
    expect(pick('springer')?.trust_tier).toBe('2_Core')
    expect(pick('thales-group')?.source_type).toBe('Vendor')
    expect(pick('bis-us')?.source_type).toBe('Government')
    expect(pick('doe-osti')?.source_type).toBe('Government')
    expect(pick('wikipedia')?.trust_tier).toBe('4_Contextual')
  })

  it('links every new publisher to at least one Library entry', () => {
    for (const [id] of NEW_PUBLISHERS) {
      const links = (xrefsBySource.get(id) ?? []).filter((x) => x.resourceType === 'library')
      expect(links.length, `${id} has no Library link`).toBeGreaterThan(0)
    }
  })
})

describe('Library publishers: entries linked to the wrong publisher', () => {
  it.each(CORRECTED_LINKS)('%s links to %s and the Library column agrees', (id, publisher) => {
    const links = libraryLinks(id)
    expect(links).toHaveLength(1)
    expect(links[0].sourceId).toBe(publisher)
    expect(links[0].matchMethod).toBe('direct')
    expect(libraryById.get(id)?.trusted_source_id).toBe(publisher)
  })

  it('no longer attributes documents from other countries to the European Commission', () => {
    const wrong = [
      'CZ-NUKIB-Crypto-Requirements-2023',
      'USENIX-2024-HQC-Division-Timing',
      'CC-2022-PART2',
      'CC-2022-PART3',
      'CC-2022-CEM',
      'PCI-DSS-QRG',
      'CA-CFDIR-Quantum-Readiness-2023',
      'CA-TBS-SPIN-PQC-2025',
      'IN-TEC-PQC-Migration-Report-2025',
      'HSBC-InfoSecGlobal-Thales-CryptographicInventory-2025',
      'Invicti-OWASP-CryptoFailures-2025',
    ]
    for (const id of wrong) {
      expect(
        libraryLinks(id).map((x) => x.sourceId),
        id
      ).not.toContain('ec')
    }
  })

  it('CI Plus specification: the Library column names CI Plus LLP, not the DVB Project', () => {
    const row = libraryById.get('CI-Plus-Spec-v1.3.2')
    expect(row?.trusted_source_id).toBe('ci-plus-llp')
    expect(libraryLinks('CI-Plus-Spec-v1.3.2').map((x) => x.sourceId)).toEqual(['ci-plus-llp'])
  })

  it('composite KEM draft: the link names the IETF Datatracker entry the Library column uses', () => {
    const id = 'draft-ietf-lamps-pq-composite-kem-23'
    expect(libraryById.get(id)?.trusted_source_id).toBe('ietf')
    expect(libraryLinks(id).map((x) => x.sourceId)).toEqual(['ietf'])
  })
})

describe('Library publishers: entries that had no publisher', () => {
  it.each(FILLED_FROM_LINK)(
    '%s names %s in both the Library column and the link',
    (id, publisher) => {
      expect(libraryById.get(id)?.trusted_source_id).toBe(publisher)
      expect(libraryLinks(id).map((x) => x.sourceId)).toEqual([publisher])
    }
  )

  it.each(NAMED_UNREGISTERED)('%s is linked to %s', (id, publisher) => {
    expect(libraryLinks(id).map((x) => x.sourceId)).toEqual([publisher])
    expect(libraryById.get(id)?.trusted_source_id).toBe(publisher)
  })

  it('has no active entry from the previously unpublished group without a publisher', () => {
    expect(PREVIOUSLY_UNPUBLISHED).toHaveLength(184)
    const missing = PREVIOUSLY_UNPUBLISHED.filter((id) => !libraryById.has(id))
    expect(missing, 'entries removed from the Library').toEqual([])
    for (const id of PREVIOUSLY_UNPUBLISHED) {
      const row = libraryById.get(id)
      if (!row || !isActive(row)) continue
      const publisher = row.trusted_source_id?.trim()
      expect(publisher, `${id} has no publisher`).toBeTruthy()
      expect(registryById.get(publisher)?.status || 'active', `${id}: ${publisher}`).toBe('active')
      expect(
        libraryLinks(id).map((x) => x.sourceId),
        `${id} is not linked to ${publisher}`
      ).toEqual([publisher])
    }
  })
})

describe('Library publishers: all active entries', () => {
  it('no active entry names a publisher the registry does not have or has retired', () => {
    const bad = libraryRows
      .filter(isActive)
      .filter((r) => r.trusted_source_id?.trim())
      .filter((r) => {
        const reg = registryById.get(r.trusted_source_id.trim())
        return !reg || !isActive(reg)
      })
      .map((r) => `${r.reference_id} -> ${r.trusted_source_id}`)
    expect(bad).toEqual([])
  })

  it('every link names a registered publisher', () => {
    const dangling = trustedSourceXrefs
      .filter((x) => !registryById.has(x.sourceId))
      .map((x) => `${x.resourceId} -> ${x.sourceId}`)
    expect(dangling).toEqual([])
  })
})
