#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Generates src/data/accuracyReceiptsLedger.json mapping the 28 authoritative
 * standards & regulatory sources in /library to the Hub's canonical algorithm
 * parameter sizes, security levels, OIDs, and active CSV corpora.
 *
 * Dynamically resolves the latest dated CSV snapshots in src/data/ so it
 * automatically adapts across CSV revision bumps (e.g. 4.209 -> 4.210 -> 4.212).
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const DATA_DIR = path.join(ROOT_DIR, 'src/data')
const MODULES_DIR = path.join(ROOT_DIR, 'src/components/PKILearning/modules')
const INFOGRAPHICS_DIR = path.join(ROOT_DIR, 'public/images/infographics')
const OUTPUT_PATH = path.join(DATA_DIR, 'accuracyReceiptsLedger.json')

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

function countLines(text) {
  if (!text) return 0
  return text.split(/\r?\n/).length
}

function readImageDimensions(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2
    while (offset < buf.length - 8) {
      if (buf[offset] !== 0xff) {
        offset++
        continue
      }
      const marker = buf[offset + 1]
      if (marker >= 0xc0 && marker <= 0xc3) {
        return {
          width: buf.readUInt16BE(offset + 7),
          height: buf.readUInt16BE(offset + 5),
        }
      }
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2
      } else {
        offset += 2 + buf.readUInt16BE(offset + 2)
      }
    }
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

const INFOGRAPHIC_TARGETS = [
  {
    moduleId: 'pki-enrollment-protocols',
    standardsRefs: ['RFC 9810', 'RFC 7030', 'RFC 10073'],
    framingScope:
      'CMPv3 (RFC 9810), EST (RFC 7030), and ACME (RFC 8555) PKI enrollment & ML-KEM KemOtherInfo proof-of-possession',
  },
  {
    moduleId: 'tls-basics',
    standardsRefs: ['RFC 8446', 'FIPS 203'],
    framingScope:
      'TLS 1.3 (RFC 8446) 1-RTT key schedule & hybrid X25519MLKEM768 key exchange framing',
  },
  {
    moduleId: 'iot-pqc',
    standardsRefs: ['FIPS 203', 'NIST SP 800-208'],
    framingScope:
      'Constrained IoT post-quantum TLS/DTLS fragmentation & stateful/stateless firmware verification',
  },
  {
    moduleId: 'ot-pqc',
    standardsRefs: ['IEC 62443', 'NIST IR 8547'],
    framingScope:
      'Operational Technology (OT/ICS) passive-only discovery safety constraints & PQC conduit migration',
  },
  {
    moduleId: 'hsm-pqc',
    standardsRefs: ['PKCS#11 v3.2', 'FIPS 140-3'],
    framingScope:
      'OASIS PKCS#11 v3.2 C_EncapsulateKey / C_DecapsulateKey & FIPS 140-3 HSM cryptographic boundary',
  },
  {
    moduleId: 'migration-program',
    standardsRefs: ['NIST IR 8547', 'NSA CNSA 2.0'],
    framingScope:
      'NIST IR 8547 (2030 deprecation / 2035 disallowance) & CNSA 2.0 phased enterprise migration roadmap',
  },
  {
    moduleId: 'emv-payment-pqc',
    standardsRefs: ['PCI DSS v4.0.1', 'FIPS 203'],
    framingScope:
      'EMVCo payment kernel & PCI DSS v4.0.1 Req. 4.2.1 / 12.3.3 post-quantum transition architecture',
  },
  {
    moduleId: 'network-security-pqc',
    standardsRefs: ['RFC 8446', 'FIPS 204'],
    framingScope:
      'NGFW/SGW middlebox TLS double-handshake inspection & TCP MSS fragmentation overhead',
  },
  {
    moduleId: 'pqc-testing-validation',
    standardsRefs: ['FIPS 140-3', 'ISO/IEC 17825'],
    framingScope:
      'Layered PQC validation: passive TAP discovery, active probing, TVLA side-channel & ACVP KAT boundaries',
  },
  {
    moduleId: 'crypto-dev-apis',
    standardsRefs: ['FIPS 203', 'PKCS#11 v3.2'],
    framingScope:
      'JCA/JCE KEM, OpenSSL 3.5 EVP_KEM, Go crypto/mlkem, and PKCS#11 v3.2 developer API surfaces',
  },
  {
    moduleId: 'pqc-hw-acceleration',
    standardsRefs: ['FIPS 203', 'FIPS 204'],
    framingScope:
      'NTT/INTT polynomial hardware offload, Keccak/SHAKE accelerators & PCIe/SoC latency bounds',
  },
]

function buildModuleClauseReceipts() {
  const dirs = fs
    .readdirSync(MODULES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b))

  const receipts = []
  for (const dirName of dirs) {
    const modPath = path.join(MODULES_DIR, dirName)
    const manifestPath = path.join(modPath, 'manifest.ts')
    const manifestRaw = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, 'utf8') : ''
    const idMatch = manifestRaw.match(/\bid:\s*['"]([^'"]+)['"]/)
    const moduleId = idMatch ? idMatch[1] : dirName.toLowerCase()

    const trackedSingleFiles = [
      'content.ts',
      'data.ts',
      'constants.ts',
      'curious-summary.md',
      'rag-summary.md',
    ]

    const fileEntries = []
    for (const rel of trackedSingleFiles) {
      const fp = path.join(modPath, rel)
      if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
        const text = fs.readFileSync(fp, 'utf8')
        fileEntries.push({
          relativePath: rel,
          sha256: sha256Hex(text),
          lineCount: countLines(text),
          text,
        })
      }
    }

    const dataSubdir = path.join(modPath, 'data')
    let hasDataSubdirFiles = false
    let hasDataSubdirConstants = false
    if (fs.existsSync(dataSubdir) && fs.statSync(dataSubdir).isDirectory()) {
      const subFiles = fs
        .readdirSync(dataSubdir)
        .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts') && !f.endsWith('.test.tsx'))
        .sort((a, b) => a.localeCompare(b))
      for (const sf of subFiles) {
        hasDataSubdirFiles = true
        if (/constants/i.test(sf)) hasDataSubdirConstants = true
        const rel = `data/${sf}`
        const text = fs.readFileSync(path.join(dataSubdir, sf), 'utf8')
        fileEntries.push({
          relativePath: rel,
          sha256: sha256Hex(text),
          lineCount: countLines(text),
          text,
        })
      }
    }

    // For Quiz (which has manifest.ts + roleScope.ts + types.ts instead of content.ts), include manifest.ts so sha256/lineCount are non-empty
    if (fileEntries.length === 0 && manifestRaw) {
      fileEntries.push({
        relativePath: 'manifest.ts',
        sha256: sha256Hex(manifestRaw),
        lineCount: countLines(manifestRaw),
        text: manifestRaw,
      })
    }

    const combinedPayload = fileEntries
      .map((e) => `${e.relativePath}:${e.sha256}:${e.lineCount}`)
      .join('\n')
    const totalLineCount = fileEntries.reduce((sum, e) => sum + e.lineCount, 0)

    const contentPath = path.join(modPath, 'content.ts')
    const contentRaw = fs.existsSync(contentPath) ? fs.readFileSync(contentPath, 'utf8') : ''
    const stdSet = new Set()
    for (const m of contentRaw.matchAll(/getStandard\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      stdSet.add(m[1])
    }
    const taxMatch = manifestRaw.match(/standards:\s*\[([^\]]*)\]/s)
    if (taxMatch) {
      for (const m of taxMatch[1].matchAll(/['"]([^'"]+)['"]/g)) {
        stdSet.add(m[1])
      }
    }
    if (stdSet.size === 0 && moduleId === 'quiz') {
      stdSet.add('FIPS 203')
      stdSet.add('FIPS 204')
      stdSet.add('FIPS 205')
    }

    const filesMap = {}
    for (const e of fileEntries) {
      filesMap[e.relativePath] = {
        sha256: e.sha256,
        lineCount: e.lineCount,
      }
    }

    receipts.push({
      moduleId,
      directory: dirName,
      sha256: sha256Hex(combinedPayload),
      lineCount: totalLineCount,
      referencedStandards: [...stdSet],
      hasDataFile: fs.existsSync(path.join(modPath, 'data.ts')) || hasDataSubdirFiles,
      hasConstantsFile: fs.existsSync(path.join(modPath, 'constants.ts')) || hasDataSubdirConstants,
      hasCuriousSummary: fs.existsSync(path.join(modPath, 'curious-summary.md')),
      hasRagSummary: fs.existsSync(path.join(modPath, 'rag-summary.md')),
      files: filesMap,
    })
  }

  return receipts
}

function buildInfographicVisualReceipts() {
  return INFOGRAPHIC_TARGETS.map((item) => {
    const fileName = `pqcstd_${item.moduleId}.png`
    const filePath = path.join(INFOGRAPHICS_DIR, fileName)
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing infographic PNG for ${item.moduleId}: ${filePath}`)
    }
    const buf = fs.readFileSync(filePath)
    const { width, height } = readImageDimensions(buf)
    return {
      moduleId: item.moduleId,
      fileName,
      width,
      height,
      byteSize: buf.length,
      sha256: sha256Hex(buf),
      standardsRefs: item.standardsRefs,
      framingScope: item.framingScope,
    }
  })
}

/**
 * Find the latest CSV matching `<prefix>_MMDDYYYY(_rN)?.csv` in `src/data/`.
 */
function findLatestCsv(prefix) {
  const regex = new RegExp(`^${prefix}_(\\d{2})(\\d{2})(\\d{4})(?:_r(\\d+))?\\.csv$`)
  const entries = fs
    .readdirSync(DATA_DIR)
    .map((filename) => {
      const m = filename.match(regex)
      if (!m) return null
      const month = Number(m[1])
      const day = Number(m[2])
      const year = Number(m[3])
      const rev = m[4] ? Number(m[4]) : 0
      return {
        filename,
        fullPath: path.join(DATA_DIR, filename),
        timestamp: Date.UTC(year, month - 1, day),
        rev,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.timestamp - a.timestamp || b.rev - a.rev)

  if (entries.length === 0) {
    throw new Error(`No CSV found in ${DATA_DIR} for prefix "${prefix}"`)
  }
  return entries[0]
}

function readCsvRows(fullPath) {
  const raw = fs.readFileSync(fullPath, 'utf8')
  const parsed = Papa.parse(raw.trim(), { header: true, skipEmptyLines: true })
  return parsed.data
}

const AUTHORITATIVE_28_SOURCES = [
  {
    sourceIndex: 1,
    referenceId: 'FIPS 203',
    authority: 'NIST',
    clausePin: 'FIPS 203 §6–§7, Table 2 (ML-KEM-512/768/1024 Parameter Sets & Key/Ciphertext Sizes)',
    domain: 'Key Encapsulation Mechanism (ML-KEM)',
    canonicalParameters: {
      'ML-KEM-512': { publicKeyBytes: 800, privateKeyBytes: 1632, ciphertextBytes: 768, sharedSecretBytes: 32, securityLevel: 1 },
      'ML-KEM-768': { publicKeyBytes: 1184, privateKeyBytes: 2400, ciphertextBytes: 1088, sharedSecretBytes: 32, securityLevel: 3 },
      'ML-KEM-1024': { publicKeyBytes: 1568, privateKeyBytes: 3168, ciphertextBytes: 1568, sharedSecretBytes: 32, securityLevel: 5 },
    },
  },
  {
    sourceIndex: 2,
    referenceId: 'FIPS 204',
    authority: 'NIST',
    clausePin: 'FIPS 204 §4, Table 1 & Table 2 (ML-DSA-44/65/87 Parameter Sets & Key/Signature Sizes)',
    domain: 'Digital Signature Algorithm (ML-DSA)',
    canonicalParameters: {
      'ML-DSA-44': { publicKeyBytes: 1312, privateKeyBytes: 2560, signatureBytes: 2420, securityLevel: 2 },
      'ML-DSA-65': { publicKeyBytes: 1952, privateKeyBytes: 4032, signatureBytes: 3309, securityLevel: 3 },
      'ML-DSA-87': { publicKeyBytes: 2592, privateKeyBytes: 4896, signatureBytes: 4627, securityLevel: 5 },
    },
  },
  {
    sourceIndex: 3,
    referenceId: 'FIPS 205',
    authority: 'NIST',
    clausePin: 'FIPS 205 §11, Table 2 (SLH-DSA SHA2/SHAKE 128s/128f/192s/192f/256s/256f Parameter Sets)',
    domain: 'Stateless Hash-Based Digital Signature Algorithm (SLH-DSA)',
    canonicalParameters: {
      'SLH-DSA-SHA2-128s': { publicKeyBytes: 32, privateKeyBytes: 64, signatureBytes: 7856, securityLevel: 1 },
      'SLH-DSA-SHA2-128f': { publicKeyBytes: 32, privateKeyBytes: 64, signatureBytes: 17088, securityLevel: 1 },
      'SLH-DSA-SHA2-192s': { publicKeyBytes: 48, privateKeyBytes: 96, signatureBytes: 16224, securityLevel: 3 },
      'SLH-DSA-SHA2-192f': { publicKeyBytes: 48, privateKeyBytes: 96, signatureBytes: 35664, securityLevel: 3 },
      'SLH-DSA-SHA2-256s': { publicKeyBytes: 64, privateKeyBytes: 128, signatureBytes: 29792, securityLevel: 5 },
      'SLH-DSA-SHA2-256f': { publicKeyBytes: 64, privateKeyBytes: 128, signatureBytes: 49856, securityLevel: 5 },
    },
  },
  {
    sourceIndex: 4,
    referenceId: 'NIST SP 800-208',
    authority: 'NIST',
    clausePin: 'SP 800-208 §4–§5 (LMS / HSS & XMSS / XMSS^MT Stateful Hash-Based Signatures)',
    domain: 'Stateful Hash-Based Signatures (HSS/LMS, XMSS)',
  },
  {
    sourceIndex: 5,
    referenceId: 'NIST SP 800-227',
    authority: 'NIST',
    clausePin: 'SP 800-227 (Recommendations for Key-Encapsulation Mechanisms & Hybrid KEM Combiners)',
    domain: 'KEM Implementation & Hybrid Combiner Guidance',
  },
  {
    sourceIndex: 6,
    referenceId: 'NIST IR 8547',
    authority: 'NIST',
    clausePin: 'NIST IR 8547 (Transition to Post-Quantum Cryptography Standards: 2030 Deprecation / 2035 Disallowance)',
    domain: 'Federal & Enterprise PQC Deprecation Schedule (2030/2035)',
  },
  {
    sourceIndex: 7,
    referenceId: 'NIST-SP-800-131A-Rev3',
    authority: 'NIST',
    clausePin: 'SP 800-131A Rev. 3 (Transitioning the Use of Cryptographic Algorithms and Key Lengths)',
    domain: 'Cryptographic Algorithm Transition & Legacy Deprecation',
  },
  {
    sourceIndex: 8,
    referenceId: 'NSA CNSA 2.0',
    authority: 'NSA',
    clausePin: 'CNSA 2.0 Advisory (ML-KEM-1024, ML-DSA-87, LMS/XMSS, AES-256, SHA-384/512; 2025–2033 NSS Timelines)',
    domain: 'National Security Systems (NSS) Post-Quantum Suite',
  },
  {
    sourceIndex: 9,
    referenceId: 'BSI TR-02102-1',
    authority: 'BSI (Germany)',
    clausePin: 'BSI TR-02102-1 §3.6 (Cryptographic Mechanisms: Hybrid PQC + Classical Recommendations)',
    domain: 'European Cryptographic Guideline & Hybrid Mandate',
  },
  {
    sourceIndex: 10,
    referenceId: 'ANSSI PQC Position Paper',
    authority: 'ANSSI (France)',
    clausePin: 'ANSSI PQC Transition Views (Defense-in-Depth Hybridization & Phased PQC Deployment)',
    domain: 'French National PQC Transition & Hybridization Policy',
  },
  {
    sourceIndex: 11,
    referenceId: 'UK-NCSC-Migration-Timelines-2025',
    authority: 'UK NCSC',
    clausePin: 'NCSC PQC Migration Timelines (2028 Discovery/Plan, 2031 Priority Migration, 2035 Full Completion)',
    domain: 'UK National Three-Phase PQC Migration Roadmap',
  },
  {
    sourceIndex: 12,
    referenceId: 'AU-ASD-ISM-Crypto-2024',
    authority: 'ASD / ACSC (Australia)',
    clausePin: 'ASD Information Security Manual (ISM) Cryptographic Guidelines (2030 Classical Asymmetric Phase-Out)',
    domain: 'Australian ISM Post-Quantum Cryptographic Controls',
  },
  {
    sourceIndex: 13,
    referenceId: 'RFC 9370',
    authority: 'IETF',
    clausePin: 'RFC 9370 §2–§5 (Multiple Key Exchanges in IKEv2: AdditionalKeyExchange ADDKE1..ADDKE7)',
    domain: 'IPsec IKEv2 Hybrid Post-Quantum Key Exchange',
  },
  {
    sourceIndex: 14,
    referenceId: 'RFC 9629',
    authority: 'IETF',
    clausePin: 'RFC 9629 §3–§6 (Using Key Encapsulation Mechanism (KEM) Algorithms in the Cryptographic Message Syntax (CMS) — KEMRecipientInfo)',
    domain: 'CMS KEMRecipientInfo EnvelopedData Architecture',
  },
  {
    sourceIndex: 15,
    referenceId: 'RFC 9794',
    authority: 'IETF',
    clausePin: 'RFC 9794 §2–§4 (Terminology for Post-Quantum Traditional Hybrid Schemes)',
    domain: 'Standardized PQ/T Hybrid Cryptography Terminology',
  },
  {
    sourceIndex: 16,
    referenceId: 'RFC 9810',
    authority: 'IETF',
    clausePin: 'RFC 9810 §5.1.3 & §5.2.8 (Certificate Management Protocol (CMP) v3 — Obsoletes RFC 4210 & RFC 9480; encrCert & KemOtherInfo POP)',
    domain: 'PKI Enrollment & KEM Proof-of-Possession (CMPv3)',
  },
  {
    sourceIndex: 17,
    referenceId: 'RFC 9881',
    authority: 'IETF',
    clausePin: 'RFC 9881 §2–§4 (Internet X.509 Public Key Infrastructure — Algorithm Identifiers for ML-DSA: 2.16.840.1.101.3.4.3.17/18/19)',
    domain: 'X.509 OIDs & ASN.1 Encoding for ML-DSA-44/65/87',
    canonicalOids: {
      'id-ml-dsa-44': '2.16.840.1.101.3.4.3.17',
      'id-ml-dsa-65': '2.16.840.1.101.3.4.3.18',
      'id-ml-dsa-87': '2.16.840.1.101.3.4.3.19',
    },
  },
  {
    sourceIndex: 18,
    referenceId: 'RFC-9935',
    authority: 'IETF',
    clausePin: 'RFC 9935 §2–§4 (Internet X.509 Public Key Infrastructure — Algorithm Identifiers for ML-KEM: 2.16.840.1.101.3.4.4.1/2/3)',
    domain: 'X.509 SubjectPublicKeyInfo OIDs for ML-KEM-512/768/1024',
    canonicalOids: {
      'id-alg-ml-kem-512': '2.16.840.1.101.3.4.4.1',
      'id-alg-ml-kem-768': '2.16.840.1.101.3.4.4.2',
      'id-alg-ml-kem-1024': '2.16.840.1.101.3.4.4.3',
    },
  },
  {
    sourceIndex: 19,
    referenceId: 'RFC-9909',
    authority: 'IETF',
    clausePin: 'RFC 9909 §2–§4 (Internet X.509 Public Key Infrastructure — Algorithm Identifiers for SLH-DSA: 2.16.840.1.101.3.4.3.20..31)',
    domain: 'X.509 OIDs & ASN.1 Encoding for SLH-DSA',
  },
  {
    sourceIndex: 20,
    referenceId: 'RFC-9936',
    authority: 'IETF',
    clausePin: 'RFC 9936 §2–§5 (Use of ML-KEM in the Cryptographic Message Syntax (CMS) & S/MIME)',
    domain: 'S/MIME & CMS EnvelopedData with ML-KEM',
  },
  {
    sourceIndex: 21,
    referenceId: 'RFC-10073-Composite-ML-DSA-for-Use-in-X-509-Public-Key-Infra',
    authority: 'IETF',
    clausePin: 'RFC 10073 (Composite ML-DSA for Use in X.509 Public Key Infrastructure and CMS)',
    domain: 'Composite Dual-Algorithm X.509 Certificates & Signatures',
  },
  {
    sourceIndex: 22,
    referenceId: 'IETF-RFC-7030-EST',
    authority: 'IETF',
    clausePin: 'RFC 7030 §4.2 (Enrollment over Secure Transport (EST) — /.well-known/est/simpleenroll PKCS#10 & PKCS#7)',
    domain: 'Automated PKI Enrollment over HTTPS (EST)',
  },
  {
    sourceIndex: 23,
    referenceId: 'ETSI TS 103 744',
    authority: 'ETSI',
    clausePin: 'ETSI TS 103 744 (Quantum-Safe Hybrid Key Exchanges — CatKDF & CascadeKDF Combiners)',
    domain: 'Telecom & Enterprise Hybrid Key Exchange Combiners',
  },
  {
    sourceIndex: 24,
    referenceId: '3GPP TS 33.501 Rel-19',
    authority: '3GPP',
    clausePin: '3GPP TS 33.501 Rel-19 & 3GPP-PQC-Study-2025 (5G Security Architecture SUCI Concealment & Post-Quantum Study)',
    domain: '5G Core & USIM Subscriber Privacy (SUCI) PQC Evolution',
  },
  {
    sourceIndex: 25,
    referenceId: 'ISO/IEC 14888-4:2024',
    authority: 'ISO/IEC JTC 1/SC 27',
    clausePin: 'ISO/IEC 14888-4:2024 (IT Security Techniques — Digital Signatures with Appendix — Part 4: Stateful Hash-Based Mechanisms)',
    domain: 'International Standard for Stateful Hash-Based Signatures',
  },
  {
    sourceIndex: 26,
    referenceId: 'PKCS11-V32-OASIS',
    authority: 'OASIS',
    clausePin: 'OASIS PKCS#11 v3.2 §5.21 & §6.68–6.70 (C_EncapsulateKey, C_DecapsulateKey, CKM_ML_KEM, CKM_ML_DSA, CKM_SLH_DSA)',
    domain: 'HSM Cryptographic Token Interface for PQC',
  },
  {
    sourceIndex: 27,
    referenceId: 'PCI-DSS-v4-0-1-Requirements-and-Testing-Procedures',
    authority: 'PCI SSC',
    clausePin: 'PCI DSS v4.0.1 Req. 4.2.1 & 12.3.3 (Strong Cryptography in Transit & Annual Cryptographic Cipher Suite Inventory)',
    domain: 'Payment Card Industry Cryptographic Inventory & Governance',
  },
  {
    sourceIndex: 28,
    referenceId: 'DORA-REG-2022-2554',
    authority: 'European Union',
    clausePin: 'Regulation (EU) 2022/2554 (DORA Art. 9) & RTS (EU) 2024/1774 Art. 6 (Cryptographic Key Management & Crypto-Agility Policy)',
    domain: 'EU Financial Sector Digital Operational Resilience & Crypto-Agility Mandate',
  },
]

function main() {
  const librarySnap = findLatestCsv('library')
  const algoSnap = findLatestCsv('pqc_complete_algorithm_reference')
  const timelineSnap = findLatestCsv('timeline')
  const threatsSnap = findLatestCsv('quantum_threats_hsm_industries')
  const complianceSnap = findLatestCsv('compliance')
  const migrateSnap = findLatestCsv('pqc_product_catalog')
  const leadersSnap = findLatestCsv('leaders')
  const patentsSnap = findLatestCsv('patents')

  const libraryRows = readCsvRows(librarySnap.fullPath)
  const algoRows = readCsvRows(algoSnap.fullPath)
  const timelineRows = readCsvRows(timelineSnap.fullPath)
  const threatsRows = readCsvRows(threatsSnap.fullPath)
  const complianceRows = readCsvRows(complianceSnap.fullPath)
  const migrateRows = readCsvRows(migrateSnap.fullPath)
  const leadersRows = readCsvRows(leadersSnap.fullPath)
  const patentsRows = readCsvRows(patentsSnap.fullPath)

  const libraryById = new Map(libraryRows.map((r) => [r.reference_id, r]))

  const verifiedSources = AUTHORITATIVE_28_SOURCES.map((src) => {
    const libRow = libraryById.get(src.referenceId)
    if (!libRow) {
      throw new Error(`Authoritative source "${src.referenceId}" not found in ${librarySnap.filename}`)
    }
    return {
      ...src,
      documentTitle: libRow.document_title,
      documentStatus: libRow.document_status,
      documentType: libRow.document_type,
      organization: libRow.authors_or_organization,
      verifiedInLibraryCsv: true,
    }
  })

  // Extract canonical FIPS 203 / 204 / 205 / SP 800-208 rows from the algorithm CSV
  const algoByName = new Map(algoRows.map((r) => [r.algorithm, r]))
  const canonicalAlgorithms = {}
  for (const name of [
    'ML-KEM-512',
    'ML-KEM-768',
    'ML-KEM-1024',
    'ML-DSA-44',
    'ML-DSA-65',
    'ML-DSA-87',
    'SLH-DSA-SHA2-128s',
    'SLH-DSA-SHA2-128f',
    'SLH-DSA-SHA2-192s',
    'SLH-DSA-SHA2-192f',
    'SLH-DSA-SHA2-256s',
    'SLH-DSA-SHA2-256f',
  ]) {
    const row = algoByName.get(name)
    if (!row) {
      throw new Error(`Missing canonical algorithm "${name}" in ${algoSnap.filename}`)
    }
    canonicalAlgorithms[name] = {
      family: row.algorithm_family,
      securityLevel: Number(row.nist_security_level),
      publicKeyBytes: Number(row.public_key_bytes),
      privateKeyBytes: Number(row.private_key_bytes),
      signatureOrCiphertextBytes: Number(row.signature_ciphertext_bytes),
      sharedSecretBytes:
        row.shared_secret_bytes && row.shared_secret_bytes !== 'N/A'
          ? Number(row.shared_secret_bytes)
          : null,
      fipsStandard: row.fips_standard,
    }
  }

  const moduleClauseReceipts = buildModuleClauseReceipts()
  const infographicVisualReceipts = buildInfographicVisualReceipts()

  const ledger = {
    schemaVersion: '4.213.0',
    generatedAt: '2026-11-15T16:15:00Z',
    totalAuthoritativeSources: verifiedSources.length,
    hubItemCoverage: {
      pages: 34,
      learningModules: 76,
      playgroundTools: 34,
      businessTools: 37,
      totalGradedItems: 181,
    },
    csvCorporaSnapshots: {
      library: { rowCount: libraryRows.length },
      algorithms: { rowCount: algoRows.length },
      timeline: { rowCount: timelineRows.length },
      threats: { rowCount: threatsRows.length },
      compliance: { rowCount: complianceRows.length },
      migrate: { rowCount: migrateRows.length },
      leaders: { rowCount: leadersRows.length },
      patents: { rowCount: patentsRows.length },
    },
    canonicalAlgorithms,
    canonicalOids: {
      'ML-KEM-512': '2.16.840.1.101.3.4.4.1',
      'ML-KEM-768': '2.16.840.1.101.3.4.4.2',
      'ML-KEM-1024': '2.16.840.1.101.3.4.4.3',
      'ML-DSA-44': '2.16.840.1.101.3.4.3.17',
      'ML-DSA-65': '2.16.840.1.101.3.4.3.18',
      'ML-DSA-87': '2.16.840.1.101.3.4.3.19',
    },
    authoritativeSources: verifiedSources,
    moduleClauseReceipts,
    infographicVisualReceipts,
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(ledger, null, 2) + '\n', 'utf8')
  console.log(
    `[generate_28_source_receipts] Wrote ${verifiedSources.length} verified sources, ${moduleClauseReceipts.length} module receipts, and ${infographicVisualReceipts.length} infographic receipts to ${path.relative(ROOT_DIR, OUTPUT_PATH)}`
  )
}

main()
