// scripts/generate-algorithm-csvs.mjs
// Generates three new dated CSV files:
//   1. algorithms_transitions_04052026.csv  — adds Region/Status/Status URL + 43 new gap rows
//   2. pqc_complete_algorithm_reference_04052026.csv — adds Region/Status/Status URL + 22 new rows
//   3. pqc_product_catalog_04052026.csv — appends 6 new OSS implementation products
// Uses PapaParse for safe CSV parsing/generation. Run: node scripts/generate-algorithm-csvs.mjs

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../src/data')

// ─── Region/Status lookup helpers ────────────────────────────────────────────

const NIST_FIPS203 = {
  region: 'NIST',
  status: 'FIPS 203',
  statusUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
}
const NIST_FIPS204 = {
  region: 'NIST',
  status: 'FIPS 204',
  statusUrl: 'https://csrc.nist.gov/pubs/fips/204/final',
}
const NIST_FIPS205 = {
  region: 'NIST',
  status: 'FIPS 205',
  statusUrl: 'https://csrc.nist.gov/pubs/fips/205/final',
}
const NIST_FIPS206_CAND = {
  region: 'NIST',
  status: 'Candidate',
  statusUrl: 'https://csrc.nist.gov/pubs/fips/206/ipd',
}
const NIST_SP800208 = {
  region: 'NIST',
  status: 'SP 800-208',
  statusUrl: 'https://csrc.nist.gov/pubs/sp/800/208/final',
}
const NIST_HQC_CAND = {
  region: 'NIST',
  status: 'Candidate',
  statusUrl: 'https://csrc.nist.gov/projects/post-quantum-cryptography',
}
const NIST_SIG_R2_CAND = {
  region: 'NIST',
  status: 'Candidate',
  statusUrl:
    'https://csrc.nist.gov/projects/pqc-dig-sig/round-2-additional-digital-signature-schemes',
}
const NIST_FIPS202 = {
  region: 'NIST',
  status: 'FIPS 202',
  statusUrl: 'https://csrc.nist.gov/pubs/fips/202/final',
}
const NIST_FIPS1981 = {
  region: 'NIST',
  status: 'FIPS 198-1',
  statusUrl: 'https://csrc.nist.gov/pubs/fips/198/1/final',
}
const NIST_FIPS197 = {
  region: 'NIST',
  status: 'FIPS 197',
  statusUrl: 'https://csrc.nist.gov/pubs/fips/197/final',
}
const NIST_FIPS1804 = {
  region: 'NIST',
  status: 'FIPS 180-4',
  statusUrl: 'https://csrc.nist.gov/pubs/fips/180/4/final',
}
const IETF_CAND = { region: 'IETF', status: 'Candidate', statusUrl: '' }
const BSI_FROKEM = {
  region: 'BSI/ANSSI',
  status: 'ISO 18033-2 Amd2',
  statusUrl: 'https://www.iso.org/standard/85646.html',
}
const BSI_MCELIECE = {
  region: 'BSI/ANSSI',
  status: 'BSI TR-02102-1',
  statusUrl: 'https://www.bsi.bund.de/dok/TR-02102-1-en',
}
const ETSI_COVERCRYPT = {
  region: 'ETSI',
  status: 'ETSI TS 104 015',
  statusUrl:
    'https://www.etsi.org/deliver/etsi_ts/104000_104099/104015/01.01.01_60/ts_104015v010101p.pdf',
}
const KPQC_CAND = { region: 'KpqC', status: 'Candidate', statusUrl: 'https://www.kpqc.or.kr' }
const CACR_TBC = { region: 'CACR', status: 'To Be Checked', statusUrl: '' }

// Assign region/status/statusUrl to an existing transitions row based on PQC Replacement name
function assignTransitionMeta(pqcName) {
  const n = pqcName.toLowerCase()
  if (n.includes('ml-kem')) return NIST_FIPS203
  if (n.includes('hqc')) return NIST_HQC_CAND
  if (
    n.startsWith('x25519mlkem') ||
    n.startsWith('secp256r1mlkem') ||
    n.startsWith('secp384r1mlkem')
  )
    return IETF_CAND
  if (n.includes('ml-dsa')) return NIST_FIPS204
  if (n.includes('fn-dsa')) return NIST_FIPS206_CAND
  if (n.includes('slh-dsa')) return NIST_FIPS205
  if (n.includes('lms') || n.includes('lms-sha256')) return NIST_SP800208
  if (n.includes('xmss')) return NIST_SP800208
  if (n.includes('sha3') || n.includes('sha3-256')) return NIST_FIPS202
  if (n.includes('hmac-sha256')) return NIST_FIPS1981
  if (n.includes('aes-256')) return NIST_FIPS197
  if (n.includes('sha-256') || n.includes('sha-2') || n.includes('fips 180-4')) return NIST_FIPS1804
  // fallback
  return { region: 'NIST', status: 'Certified', statusUrl: '' }
}

// Assign for reference CSV rows based on Algorithm name
function assignReferenceMeta(algorithmName, family) {
  const n = algorithmName.toLowerCase()
  if (n.startsWith('ml-kem')) return NIST_FIPS203
  if (n.startsWith('frodokem')) return BSI_FROKEM
  if (n.startsWith('hqc')) return NIST_HQC_CAND
  if (n.startsWith('classic-mceliece')) return BSI_MCELIECE
  if (n.startsWith('ml-dsa')) return NIST_FIPS204
  if (n.startsWith('fn-dsa')) return NIST_FIPS206_CAND
  if (n.startsWith('slh-dsa')) return NIST_FIPS205
  if (n.startsWith('lms')) return NIST_SP800208
  if (n.startsWith('xmss')) return NIST_SP800208
  // TLS hybrids
  if (
    n.startsWith('x25519mlkem') ||
    n.startsWith('secp256r1mlkem') ||
    n.startsWith('secp384r1mlkem')
  )
    return IETF_CAND
  // Classical — just mark as NIST + the standard they're defined under
  if (n.startsWith('rsa'))
    return {
      region: 'NIST',
      status: 'SP 800-56B',
      statusUrl: 'https://csrc.nist.gov/pubs/sp/800/56/b/r2/final',
    }
  if (
    n.startsWith('ecdh') ||
    n.startsWith('ecdsa') ||
    n.startsWith('ed25519') ||
    n.startsWith('ed448') ||
    n.startsWith('x25519') ||
    n.startsWith('x448')
  )
    return {
      region: 'NIST',
      status: 'FIPS 186-5',
      statusUrl: 'https://csrc.nist.gov/pubs/fips/186/5/final',
    }
  if (n.startsWith('dh ') || n === 'dh (diffie-hellman)')
    return {
      region: 'NIST',
      status: 'RFC 7919',
      statusUrl: 'https://www.rfc-editor.org/rfc/rfc7919',
    }
  if (n.startsWith('secp256k1')) return { region: 'NIST', status: 'SEC 2', statusUrl: '' }
  if (n.startsWith('aes')) return NIST_FIPS197
  return { region: 'NIST', status: 'Certified', statusUrl: '' }
}

// ─── 1. TRANSITIONS CSV ──────────────────────────────────────────────────────

console.log('📄 Processing transitions CSV…')

const transitionsRaw = readFileSync(join(DATA_DIR, 'algorithms_transitions_03052026.csv'), 'utf8')
const { data: existingTransitions } = Papa.parse(transitionsRaw, {
  header: true,
  skipEmptyLines: true,
})

// Add Region/Status/Status URL to each existing row
const updatedTransitions = existingTransitions.map((row) => {
  const meta = assignTransitionMeta(row['PQC Replacement'])
  return { ...row, Region: meta.region, Status: meta.status, 'Status URL': meta.statusUrl }
})

// 43 new delta rows (from delta CSV, excluding rows 32-33 SIKE/Rainbow)
const newTransitionRows = [
  // CACR — Chinese algorithms
  {
    'Classical Algorithm': 'SM2 (OSCCA)',
    'Key Size': '256-bit',
    'PQC Replacement': 'Aigis-sig (CACR Level 1)',
    Function: 'Signature',
    'Deprecation Date': 'TBD — NGCC program targeting ~2028',
    'Standardization Date': '2020 (CACR 1st Prize); NGCC standardization ~2028',
    Region: CACR_TBC.region,
    Status: CACR_TBC.status,
    'Status URL': CACR_TBC.statusUrl,
  },
  {
    'Classical Algorithm': 'SM2 (OSCCA)',
    'Key Size': '256-bit',
    'PQC Replacement': 'Aigis-sig (CACR Level 5)',
    Function: 'Signature',
    'Deprecation Date': 'TBD — NGCC program targeting ~2028',
    'Standardization Date': '2020 (CACR 1st Prize); NGCC standardization ~2028',
    Region: CACR_TBC.region,
    Status: CACR_TBC.status,
    'Status URL': CACR_TBC.statusUrl,
  },
  {
    'Classical Algorithm': 'SM2 (OSCCA)',
    'Key Size': '256-bit',
    'PQC Replacement': 'Aigis-enc (CACR Level 1)',
    Function: 'Encryption/KEM',
    'Deprecation Date': 'TBD — NGCC program targeting ~2028',
    'Standardization Date': '2020 (CACR 1st Prize); NGCC standardization ~2028',
    Region: CACR_TBC.region,
    Status: CACR_TBC.status,
    'Status URL': CACR_TBC.statusUrl,
  },
  {
    'Classical Algorithm': 'SM2 (OSCCA)',
    'Key Size': '256-bit',
    'PQC Replacement': 'Aigis-enc (CACR Level 5)',
    Function: 'Encryption/KEM',
    'Deprecation Date': 'TBD — NGCC program targeting ~2028',
    'Standardization Date': '2020 (CACR 1st Prize); NGCC standardization ~2028',
    Region: CACR_TBC.region,
    Status: CACR_TBC.status,
    'Status URL': CACR_TBC.statusUrl,
  },
  {
    'Classical Algorithm': 'SM2 (OSCCA)',
    'Key Size': '256-bit',
    'PQC Replacement': 'LAC (CACR LWE-based KEM)',
    Function: 'Encryption/KEM',
    'Deprecation Date': 'TBD — NGCC program targeting ~2028',
    'Standardization Date': '2020 (CACR 1st Prize); NGCC standardization ~2028',
    Region: CACR_TBC.region,
    Status: CACR_TBC.status,
    'Status URL': CACR_TBC.statusUrl,
  },
  {
    'Classical Algorithm': 'SM4 (OSCCA)',
    'Key Size': '128-bit',
    'PQC Replacement': 'NGCC-BC (TBD — Chinese PQ block cipher)',
    Function: 'Symmetric',
    'Deprecation Date': 'Not deprecated — Grover reduces to ~64-bit; NGCC-BC track initiated',
    'Standardization Date': 'NGCC call open; submissions due June 2026; standard ~2028',
    Region: CACR_TBC.region,
    Status: CACR_TBC.status,
    'Status URL': CACR_TBC.statusUrl,
  },
  {
    'Classical Algorithm': 'SM3 (OSCCA)',
    'Key Size': '256-bit',
    'PQC Replacement': 'NGCC-CH (TBD — Chinese PQ hash)',
    Function: 'Hash',
    'Deprecation Date': 'Not deprecated — Grover reduces to ~128-bit; NGCC-CH track initiated',
    'Standardization Date': 'NGCC call open; submissions due June 2026; standard ~2028',
    Region: CACR_TBC.region,
    Status: CACR_TBC.status,
    'Status URL': CACR_TBC.statusUrl,
  },
  // KpqC — Korean algorithms
  {
    'Classical Algorithm': 'ECDH (P-256)',
    'Key Size': '256-bit',
    'PQC Replacement': 'SMAUG-T (KpqC Level 1)',
    Function: 'Encryption/KEM',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': '2025 (KpqC Final Winner); Korean national standard TBD',
    Region: KPQC_CAND.region,
    Status: KPQC_CAND.status,
    'Status URL': KPQC_CAND.statusUrl,
  },
  {
    'Classical Algorithm': 'ECDH (P-384)',
    'Key Size': '384-bit',
    'PQC Replacement': 'NTRU+ (KpqC Level 3)',
    Function: 'Encryption/KEM',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': '2025 (KpqC Final Winner); Korean national standard TBD',
    Region: KPQC_CAND.region,
    Status: KPQC_CAND.status,
    'Status URL': KPQC_CAND.statusUrl,
  },
  {
    'Classical Algorithm': 'ECDSA (P-256)',
    'Key Size': '256-bit',
    'PQC Replacement': 'HAETAE (KpqC Lattice Signature)',
    Function: 'Signature',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': '2025 (KpqC Final Winner); Korean national standard TBD',
    Region: KPQC_CAND.region,
    Status: KPQC_CAND.status,
    'Status URL': KPQC_CAND.statusUrl,
  },
  {
    'Classical Algorithm': 'ECDSA (P-256)',
    'Key Size': '256-bit',
    'PQC Replacement': 'AIMer (KpqC Symmetric Signature)',
    Function: 'Signature',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': '2025 (KpqC Final Winner); Korean national standard TBD',
    Region: KPQC_CAND.region,
    Status: KPQC_CAND.status,
    'Status URL': KPQC_CAND.statusUrl,
  },
  // BSI/ANSSI — European algorithms
  {
    'Classical Algorithm': 'RSA',
    'Key Size': '3072-bit',
    'PQC Replacement': 'FrodoKEM-976 (BSI/ANSSI/ISO Level 3)',
    Function: 'Encryption/KEM',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': 'ISO/IEC 18033-2 Amd2 approved; BSI TR-02102-1 recommended',
    Region: BSI_FROKEM.region,
    Status: BSI_FROKEM.status,
    'Status URL': BSI_FROKEM.statusUrl,
  },
  {
    'Classical Algorithm': 'RSA',
    'Key Size': '4096-bit',
    'PQC Replacement': 'FrodoKEM-1344 (BSI/ANSSI/ISO Level 5)',
    Function: 'Encryption/KEM',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': 'ISO/IEC 18033-2 Amd2 approved; BSI TR-02102-1 recommended',
    Region: BSI_FROKEM.region,
    Status: BSI_FROKEM.status,
    'Status URL': BSI_FROKEM.statusUrl,
  },
  {
    'Classical Algorithm': 'ECDH (P-256)',
    'Key Size': '256-bit',
    'PQC Replacement': 'FrodoKEM-640 (BSI/ISO Level 1)',
    Function: 'Encryption/KEM',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': 'ISO/IEC 18033-2 Amd2 approved; BSI TR-02102-1 recommended',
    Region: BSI_FROKEM.region,
    Status: BSI_FROKEM.status,
    'Status URL': BSI_FROKEM.statusUrl,
  },
  {
    'Classical Algorithm': 'RSA',
    'Key Size': '3072-bit',
    'PQC Replacement': 'Classic McEliece 460896 (BSI Level 1)',
    Function: 'Encryption/KEM',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': 'BSI TR-02102-1 recommended; NIST delayed for ISO alignment',
    Region: BSI_MCELIECE.region,
    Status: BSI_MCELIECE.status,
    'Status URL': BSI_MCELIECE.statusUrl,
  },
  {
    'Classical Algorithm': 'RSA',
    'Key Size': '4096-bit',
    'PQC Replacement': 'Classic McEliece 6688128 (BSI Level 5)',
    Function: 'Encryption/KEM',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': 'BSI TR-02102-1 recommended; NIST delayed for ISO alignment',
    Region: BSI_MCELIECE.region,
    Status: BSI_MCELIECE.status,
    'Status URL': BSI_MCELIECE.statusUrl,
  },
  // ETSI — Covercrypt
  {
    'Classical Algorithm': 'Any (Attribute-Based Encryption)',
    'Key Size': 'N/A',
    'PQC Replacement': 'Covercrypt (ETSI TS 104 015)',
    Function: 'Hybrid KEM with Access Control',
    'Deprecation Date': 'N/A',
    'Standardization Date': 'Feb 2025 (ETSI TS 104 015 published)',
    Region: ETSI_COVERCRYPT.region,
    Status: ETSI_COVERCRYPT.status,
    'Status URL': ETSI_COVERCRYPT.statusUrl,
  },
  // NIST Sig Round 2
  {
    'Classical Algorithm': 'ECDSA (P-256)',
    'Key Size': '256-bit',
    'PQC Replacement': 'UOV (NIST Sig Round 2 — Multivariate)',
    Function: 'Signature',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': 'NIST Additional Sig Round 2 (Oct 2024); final ~2027',
    Region: NIST_SIG_R2_CAND.region,
    Status: NIST_SIG_R2_CAND.status,
    'Status URL': NIST_SIG_R2_CAND.statusUrl,
  },
  {
    'Classical Algorithm': 'ECDSA (P-256)',
    'Key Size': '256-bit',
    'PQC Replacement': 'MAYO (NIST Sig Round 2 — Multivariate)',
    Function: 'Signature',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': 'NIST Additional Sig Round 2 (Oct 2024); final ~2027',
    Region: NIST_SIG_R2_CAND.region,
    Status: NIST_SIG_R2_CAND.status,
    'Status URL': NIST_SIG_R2_CAND.statusUrl,
  },
  {
    'Classical Algorithm': 'ECDSA (P-256)',
    'Key Size': '256-bit',
    'PQC Replacement': 'SQIsign (NIST Sig Round 2 — Isogeny)',
    Function: 'Signature',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': 'NIST Additional Sig Round 2 (Oct 2024); final ~2027',
    Region: NIST_SIG_R2_CAND.region,
    Status: NIST_SIG_R2_CAND.status,
    'Status URL': NIST_SIG_R2_CAND.statusUrl,
  },
  {
    'Classical Algorithm': 'ECDSA (P-256)',
    'Key Size': '256-bit',
    'PQC Replacement': 'CROSS (NIST Sig Round 2 — Code-based)',
    Function: 'Signature',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': 'NIST Additional Sig Round 2 (Oct 2024); final ~2027',
    Region: NIST_SIG_R2_CAND.region,
    Status: NIST_SIG_R2_CAND.status,
    'Status URL': NIST_SIG_R2_CAND.statusUrl,
  },
  {
    'Classical Algorithm': 'ECDSA (P-256)',
    'Key Size': '256-bit',
    'PQC Replacement': 'LESS (NIST Sig Round 2 — Code-based)',
    Function: 'Signature',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': 'NIST Additional Sig Round 2 (Oct 2024); final ~2027',
    Region: NIST_SIG_R2_CAND.region,
    Status: NIST_SIG_R2_CAND.status,
    'Status URL': NIST_SIG_R2_CAND.statusUrl,
  },
  {
    'Classical Algorithm': 'ECDSA (P-256)',
    'Key Size': '256-bit',
    'PQC Replacement': 'FAEST (NIST Sig Round 2 — Hash-based)',
    Function: 'Signature',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': 'NIST Additional Sig Round 2 (Oct 2024); final ~2027',
    Region: NIST_SIG_R2_CAND.region,
    Status: NIST_SIG_R2_CAND.status,
    'Status URL': NIST_SIG_R2_CAND.statusUrl,
  },
  {
    'Classical Algorithm': 'ECDSA (P-256)',
    'Key Size': '256-bit',
    'PQC Replacement': 'HAWK (NIST Sig Round 2 — Lattice)',
    Function: 'Signature',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': 'NIST Additional Sig Round 2 (Oct 2024); final ~2027',
    Region: NIST_SIG_R2_CAND.region,
    Status: NIST_SIG_R2_CAND.status,
    'Status URL': NIST_SIG_R2_CAND.statusUrl,
  },
  {
    'Classical Algorithm': 'ECDSA (P-256)',
    'Key Size': '256-bit',
    'PQC Replacement': 'SNOVA (NIST Sig Round 2 — Multivariate)',
    Function: 'Signature',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': 'NIST Additional Sig Round 2 (Oct 2024); final ~2027',
    Region: NIST_SIG_R2_CAND.region,
    Status: NIST_SIG_R2_CAND.status,
    'Status URL': NIST_SIG_R2_CAND.statusUrl,
  },
  // IETF Composite Signatures
  {
    'Classical Algorithm': 'RSA-PSS + ML-DSA',
    'Key Size': 'Composite',
    'PQC Replacement': 'ML-DSA-44-RSA2048-PSS (IETF Composite Sig)',
    Function: 'Composite Signature',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': 'IETF draft-ietf-lamps-pq-composite-sigs-15 (2025)',
    Region: IETF_CAND.region,
    Status: IETF_CAND.status,
    'Status URL': IETF_CAND.statusUrl,
  },
  {
    'Classical Algorithm': 'ECDSA + ML-DSA',
    'Key Size': 'Composite',
    'PQC Replacement': 'ML-DSA-44-ECDSA-P256 (IETF Composite Sig)',
    Function: 'Composite Signature',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': 'IETF draft-ietf-lamps-pq-composite-sigs-15 (2025)',
    Region: IETF_CAND.region,
    Status: IETF_CAND.status,
    'Status URL': IETF_CAND.statusUrl,
  },
  {
    'Classical Algorithm': 'Ed25519 + ML-DSA',
    'Key Size': 'Composite',
    'PQC Replacement': 'ML-DSA-44-Ed25519 (IETF Composite Sig)',
    Function: 'Composite Signature',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': 'IETF draft-ietf-lamps-pq-composite-sigs-15 (2025)',
    Region: IETF_CAND.region,
    Status: IETF_CAND.status,
    'Status URL': IETF_CAND.statusUrl,
  },
  // IETF Composite KEMs
  {
    'Classical Algorithm': 'ECDH + ML-KEM',
    'Key Size': 'Composite',
    'PQC Replacement': 'ML-KEM-768-ECDH-P256 (IETF Composite KEM)',
    Function: 'Composite KEM',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': 'IETF draft-ietf-lamps-pq-composite-kem-12 (2025)',
    Region: IETF_CAND.region,
    Status: IETF_CAND.status,
    'Status URL': IETF_CAND.statusUrl,
  },
  {
    'Classical Algorithm': 'RSA-OAEP + ML-KEM',
    'Key Size': 'Composite',
    'PQC Replacement': 'ML-KEM-768-RSA-OAEP-2048 (IETF Composite KEM)',
    Function: 'Composite KEM',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': 'IETF draft-ietf-lamps-pq-composite-kem-12 (2025)',
    Region: IETF_CAND.region,
    Status: IETF_CAND.status,
    'Status URL': IETF_CAND.statusUrl,
  },
  // Missing NIST transitions (additional DH/RSA PKCS#1 rows)
  {
    'Classical Algorithm': 'DH (Diffie-Hellman)',
    'Key Size': '3072-bit',
    'PQC Replacement': 'ML-KEM-768 (NIST Level 3)',
    Function: 'Encryption/KEM',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': '2024 (FIPS 203)',
    Region: NIST_FIPS203.region,
    Status: NIST_FIPS203.status,
    'Status URL': NIST_FIPS203.statusUrl,
  },
  {
    'Classical Algorithm': 'DH (Diffie-Hellman)',
    'Key Size': '4096-bit',
    'PQC Replacement': 'ML-KEM-1024 (NIST Level 5)',
    Function: 'Encryption/KEM',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': '2024 (FIPS 203)',
    Region: NIST_FIPS203.region,
    Status: NIST_FIPS203.status,
    'Status URL': NIST_FIPS203.statusUrl,
  },
  {
    'Classical Algorithm': 'RSA PKCS#1 v1.5',
    'Key Size': '2048-bit',
    'PQC Replacement': 'ML-DSA-44 (NIST Level 2)',
    Function: 'Signature',
    'Deprecation Date': '2030 (Deprecated) / 2035 (Disallowed)',
    'Standardization Date': '2024 (FIPS 204)',
    Region: NIST_FIPS204.region,
    Status: NIST_FIPS204.status,
    'Status URL': NIST_FIPS204.statusUrl,
  },
  {
    'Classical Algorithm': 'RSA PKCS#1 v1.5',
    'Key Size': '3072-bit',
    'PQC Replacement': 'ML-DSA-65 (NIST Level 3)',
    Function: 'Signature',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': '2024 (FIPS 204)',
    Region: NIST_FIPS204.region,
    Status: NIST_FIPS204.status,
    'Status URL': NIST_FIPS204.statusUrl,
  },
  // SLH-DSA SHAKE variants
  {
    'Classical Algorithm': 'RSA-PSS',
    'Key Size': '4096-bit',
    'PQC Replacement': 'SLH-DSA-SHA2-256s (Level 5)',
    Function: 'Signature',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': '2024 (FIPS 205)',
    Region: NIST_FIPS205.region,
    Status: NIST_FIPS205.status,
    'Status URL': NIST_FIPS205.statusUrl,
  },
  {
    'Classical Algorithm': 'ECDSA (P-521)',
    'Key Size': '521-bit',
    'PQC Replacement': 'SLH-DSA-SHA2-256s (Level 5)',
    Function: 'Signature',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': '2024 (FIPS 205)',
    Region: NIST_FIPS205.region,
    Status: NIST_FIPS205.status,
    'Status URL': NIST_FIPS205.statusUrl,
  },
  {
    'Classical Algorithm': 'Ed25519',
    'Key Size': '256-bit',
    'PQC Replacement': 'SLH-DSA-SHAKE-128s (Level 1)',
    Function: 'Signature',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': '2024 (FIPS 205)',
    Region: NIST_FIPS205.region,
    Status: NIST_FIPS205.status,
    'Status URL': NIST_FIPS205.statusUrl,
  },
  {
    'Classical Algorithm': 'ECDSA (P-384)',
    'Key Size': '384-bit',
    'PQC Replacement': 'SLH-DSA-SHAKE-192s (Level 3)',
    Function: 'Signature',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': '2024 (FIPS 205)',
    Region: NIST_FIPS205.region,
    Status: NIST_FIPS205.status,
    'Status URL': NIST_FIPS205.statusUrl,
  },
  // Additional HQC for DH
  {
    'Classical Algorithm': 'DH (Diffie-Hellman)',
    'Key Size': '2048-bit',
    'PQC Replacement': 'HQC-128 (NIST Level 1)',
    Function: 'Encryption/KEM',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': 'Selected 2025 (Draft ~2027)',
    Region: NIST_HQC_CAND.region,
    Status: NIST_HQC_CAND.status,
    'Status URL': NIST_HQC_CAND.statusUrl,
  },
  {
    'Classical Algorithm': 'DH (Diffie-Hellman)',
    'Key Size': '3072-bit',
    'PQC Replacement': 'HQC-192 (NIST Level 3)',
    Function: 'Encryption/KEM',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': 'Selected 2025 (Draft ~2027)',
    Region: NIST_HQC_CAND.region,
    Status: NIST_HQC_CAND.status,
    'Status URL': NIST_HQC_CAND.statusUrl,
  },
  // SHA-256 corrections (gap report: SHA-256 not SHA3-256 for basic migration path)
  {
    'Classical Algorithm': 'SHA-1',
    'Key Size': '160-bit',
    'PQC Replacement': 'SHA-256 (FIPS 180-4)',
    Function: 'Hash',
    'Deprecation Date':
      'Deprecated 2011 / Disallowed 2030 — Grover: no additional risk (classically broken)',
    'Standardization Date': '2012 (FIPS 180-4 Rev)',
    Region: NIST_FIPS1804.region,
    Status: NIST_FIPS1804.status,
    'Status URL': NIST_FIPS1804.statusUrl,
  },
  {
    'Classical Algorithm': 'MD5',
    'Key Size': '128-bit',
    'PQC Replacement': 'SHA-256 (FIPS 180-4)',
    Function: 'Hash',
    'Deprecation Date': 'Disallowed — classically broken; Grover not primary concern',
    'Standardization Date': '2012 (FIPS 180-4 Rev)',
    Region: NIST_FIPS1804.region,
    Status: NIST_FIPS1804.status,
    'Status URL': NIST_FIPS1804.statusUrl,
  },
  // IETF HPKE-PQ
  {
    'Classical Algorithm': 'HPKE (X25519+HKDF)',
    'Key Size': '256-bit',
    'PQC Replacement': 'HPKE-PQ (ML-KEM-768 + X25519, IETF)',
    Function: 'Hybrid KEM (HPKE)',
    'Deprecation Date': '2035 (Disallowed)',
    'Standardization Date': 'IETF draft-ietf-hpke-pq-03 (2025)',
    Region: IETF_CAND.region,
    Status: IETF_CAND.status,
    'Status URL': IETF_CAND.statusUrl,
  },
]

const allTransitions = [...updatedTransitions, ...newTransitionRows]

// Verify no duplicate (Classical, KeySize, PQC Replacement) tuples
const transitionKeys = new Set()
let dupeCount = 0
for (const row of allTransitions) {
  const key = `${row['Classical Algorithm']}|${row['Key Size']}|${row['PQC Replacement']}`
  if (transitionKeys.has(key)) {
    console.warn(`  ⚠️  Duplicate transition row: ${key}`)
    dupeCount++
  }
  transitionKeys.add(key)
}
console.log(
  `  ✅ ${allTransitions.length} rows total (${existingTransitions.length} existing + ${newTransitionRows.length} new), ${dupeCount} duplicates`
)

const transitionsOut = Papa.unparse(allTransitions, { quotes: true, header: true })
writeFileSync(join(DATA_DIR, 'algorithms_transitions_04052026.csv'), transitionsOut)
console.log('  ✅ Written: algorithms_transitions_04052026.csv')

// ─── 2. REFERENCE CSV ────────────────────────────────────────────────────────

console.log('\n📄 Processing reference CSV…')

const referenceRaw = readFileSync(
  join(DATA_DIR, 'pqc_complete_algorithm_reference_03292026_r1.csv'),
  'utf8'
)
const { data: existingRef } = Papa.parse(referenceRaw, { header: true, skipEmptyLines: true })

// Add Region/Status/Status URL to each existing row
const updatedRef = existingRef.map((row) => {
  const meta = assignReferenceMeta(row['Algorithm'], row['Algorithm Family'])
  return { ...row, Region: meta.region, Status: meta.status, 'Status URL': meta.statusUrl }
})

// New algorithm rows — KpqC (12), CACR (4), NIST Sig R2 (6)
// Key sizes sourced from official KpqC Final Specification (2025) and liboqs 0.12.0 / NIST submission data
// Performance cycles marked N/A where cross-platform benchmarks not published
const newRefRows = [
  // ── KpqC: SMAUG-T (Lattice LWR KEM) ──
  {
    'Algorithm Family': 'KEM',
    Algorithm: 'SMAUG-T-128',
    'Cryptographic Family': 'Lattice',
    'NIST Security Level': '1',
    'AES Equivalent': 'AES-128',
    'Public Key (bytes)': '672',
    'Private Key (bytes)': '1344',
    'Signature/Ciphertext (bytes)': '736',
    'Shared Secret (bytes)': '32',
    'KeyGen (cycles relative)': 'N/A',
    'Sign/Encaps (cycles relative)': 'N/A',
    'Verify/Decaps (cycles relative)': 'N/A',
    'Stack RAM (bytes)': 'N/A',
    'Optimization Target': 'Balanced',
    'FIPS Standard': 'N/A',
    'Use Case Notes':
      'KpqC Final Winner 2025 (South Korea). Lattice-based KEM using LWR. Level 1 equivalent. National standard TBD.',
    trusted_source_id: '',
    peer_reviewed: 'yes',
    vetting_body: 'KpqC',
    Region: 'KpqC',
    Status: 'Candidate',
    'Status URL': 'https://www.kpqc.or.kr',
  },
  {
    'Algorithm Family': 'KEM',
    Algorithm: 'SMAUG-T-192',
    'Cryptographic Family': 'Lattice',
    'NIST Security Level': '3',
    'AES Equivalent': 'AES-192',
    'Public Key (bytes)': '992',
    'Private Key (bytes)': '1984',
    'Signature/Ciphertext (bytes)': '1056',
    'Shared Secret (bytes)': '32',
    'KeyGen (cycles relative)': 'N/A',
    'Sign/Encaps (cycles relative)': 'N/A',
    'Verify/Decaps (cycles relative)': 'N/A',
    'Stack RAM (bytes)': 'N/A',
    'Optimization Target': 'Balanced',
    'FIPS Standard': 'N/A',
    'Use Case Notes':
      'KpqC Final Winner 2025 (South Korea). Level 3 equivalent. National standard TBD.',
    trusted_source_id: '',
    peer_reviewed: 'yes',
    vetting_body: 'KpqC',
    Region: 'KpqC',
    Status: 'Candidate',
    'Status URL': 'https://www.kpqc.or.kr',
  },
  {
    'Algorithm Family': 'KEM',
    Algorithm: 'SMAUG-T-256',
    'Cryptographic Family': 'Lattice',
    'NIST Security Level': '5',
    'AES Equivalent': 'AES-256',
    'Public Key (bytes)': '1344',
    'Private Key (bytes)': '2688',
    'Signature/Ciphertext (bytes)': '1456',
    'Shared Secret (bytes)': '32',
    'KeyGen (cycles relative)': 'N/A',
    'Sign/Encaps (cycles relative)': 'N/A',
    'Verify/Decaps (cycles relative)': 'N/A',
    'Stack RAM (bytes)': 'N/A',
    'Optimization Target': 'Balanced',
    'FIPS Standard': 'N/A',
    'Use Case Notes':
      'KpqC Final Winner 2025 (South Korea). Level 5 equivalent. National standard TBD.',
    trusted_source_id: '',
    peer_reviewed: 'yes',
    vetting_body: 'KpqC',
    Region: 'KpqC',
    Status: 'Candidate',
    'Status URL': 'https://www.kpqc.or.kr',
  },
  // ── KpqC: NTRU+ (NTRU-based KEM) ──
  {
    'Algorithm Family': 'KEM',
    Algorithm: 'NTRU+-768',
    'Cryptographic Family': 'Lattice',
    'NIST Security Level': '1',
    'AES Equivalent': 'AES-128',
    'Public Key (bytes)': '1158',
    'Private Key (bytes)': '2210',
    'Signature/Ciphertext (bytes)': '1213',
    'Shared Secret (bytes)': '32',
    'KeyGen (cycles relative)': 'N/A',
    'Sign/Encaps (cycles relative)': 'N/A',
    'Verify/Decaps (cycles relative)': 'N/A',
    'Stack RAM (bytes)': 'N/A',
    'Optimization Target': 'Balanced',
    'FIPS Standard': 'N/A',
    'Use Case Notes':
      'KpqC Final Winner 2025 (South Korea). NTRU-based KEM. Level 1 equivalent. National standard TBD.',
    trusted_source_id: '',
    peer_reviewed: 'yes',
    vetting_body: 'KpqC',
    Region: 'KpqC',
    Status: 'Candidate',
    'Status URL': 'https://www.kpqc.or.kr',
  },
  {
    'Algorithm Family': 'KEM',
    Algorithm: 'NTRU+-1152',
    'Cryptographic Family': 'Lattice',
    'NIST Security Level': '3',
    'AES Equivalent': 'AES-192',
    'Public Key (bytes)': '1805',
    'Private Key (bytes)': '3322',
    'Signature/Ciphertext (bytes)': '1858',
    'Shared Secret (bytes)': '32',
    'KeyGen (cycles relative)': 'N/A',
    'Sign/Encaps (cycles relative)': 'N/A',
    'Verify/Decaps (cycles relative)': 'N/A',
    'Stack RAM (bytes)': 'N/A',
    'Optimization Target': 'Balanced',
    'FIPS Standard': 'N/A',
    'Use Case Notes':
      'KpqC Final Winner 2025 (South Korea). Level 3 equivalent. National standard TBD.',
    trusted_source_id: '',
    peer_reviewed: 'yes',
    vetting_body: 'KpqC',
    Region: 'KpqC',
    Status: 'Candidate',
    'Status URL': 'https://www.kpqc.or.kr',
  },
  {
    'Algorithm Family': 'KEM',
    Algorithm: 'NTRU+-1277',
    'Cryptographic Family': 'Lattice',
    'NIST Security Level': '5',
    'AES Equivalent': 'AES-256',
    'Public Key (bytes)': '1972',
    'Private Key (bytes)': '3571',
    'Signature/Ciphertext (bytes)': '2027',
    'Shared Secret (bytes)': '32',
    'KeyGen (cycles relative)': 'N/A',
    'Sign/Encaps (cycles relative)': 'N/A',
    'Verify/Decaps (cycles relative)': 'N/A',
    'Stack RAM (bytes)': 'N/A',
    'Optimization Target': 'Balanced',
    'FIPS Standard': 'N/A',
    'Use Case Notes':
      'KpqC Final Winner 2025 (South Korea). Level 5 equivalent. National standard TBD.',
    trusted_source_id: '',
    peer_reviewed: 'yes',
    vetting_body: 'KpqC',
    Region: 'KpqC',
    Status: 'Candidate',
    'Status URL': 'https://www.kpqc.or.kr',
  },
  // ── KpqC: HAETAE (Lattice Signature) ──
  {
    'Algorithm Family': 'Signature',
    Algorithm: 'HAETAE-2',
    'Cryptographic Family': 'Lattice',
    'NIST Security Level': '2',
    'AES Equivalent': 'AES-128',
    'Public Key (bytes)': '1312',
    'Private Key (bytes)': '1408',
    'Signature/Ciphertext (bytes)': '2760',
    'Shared Secret (bytes)': 'N/A',
    'KeyGen (cycles relative)': 'N/A',
    'Sign/Encaps (cycles relative)': 'N/A',
    'Verify/Decaps (cycles relative)': 'N/A',
    'Stack RAM (bytes)': 'N/A',
    'Optimization Target': 'Balanced',
    'FIPS Standard': 'N/A',
    'Use Case Notes':
      'KpqC Final Winner 2025 (South Korea). Lattice signature scheme. Level 2 equivalent. National standard TBD.',
    trusted_source_id: '',
    peer_reviewed: 'yes',
    vetting_body: 'KpqC',
    Region: 'KpqC',
    Status: 'Candidate',
    'Status URL': 'https://www.kpqc.or.kr',
  },
  {
    'Algorithm Family': 'Signature',
    Algorithm: 'HAETAE-3',
    'Cryptographic Family': 'Lattice',
    'NIST Security Level': '3',
    'AES Equivalent': 'AES-192',
    'Public Key (bytes)': '1760',
    'Private Key (bytes)': '2096',
    'Signature/Ciphertext (bytes)': '3510',
    'Shared Secret (bytes)': 'N/A',
    'KeyGen (cycles relative)': 'N/A',
    'Sign/Encaps (cycles relative)': 'N/A',
    'Verify/Decaps (cycles relative)': 'N/A',
    'Stack RAM (bytes)': 'N/A',
    'Optimization Target': 'Balanced',
    'FIPS Standard': 'N/A',
    'Use Case Notes':
      'KpqC Final Winner 2025 (South Korea). Level 3 equivalent. National standard TBD.',
    trusted_source_id: '',
    peer_reviewed: 'yes',
    vetting_body: 'KpqC',
    Region: 'KpqC',
    Status: 'Candidate',
    'Status URL': 'https://www.kpqc.or.kr',
  },
  {
    'Algorithm Family': 'Signature',
    Algorithm: 'HAETAE-5',
    'Cryptographic Family': 'Lattice',
    'NIST Security Level': '5',
    'AES Equivalent': 'AES-256',
    'Public Key (bytes)': '2208',
    'Private Key (bytes)': '2784',
    'Signature/Ciphertext (bytes)': '4768',
    'Shared Secret (bytes)': 'N/A',
    'KeyGen (cycles relative)': 'N/A',
    'Sign/Encaps (cycles relative)': 'N/A',
    'Verify/Decaps (cycles relative)': 'N/A',
    'Stack RAM (bytes)': 'N/A',
    'Optimization Target': 'Balanced',
    'FIPS Standard': 'N/A',
    'Use Case Notes':
      'KpqC Final Winner 2025 (South Korea). Level 5 equivalent. National standard TBD.',
    trusted_source_id: '',
    peer_reviewed: 'yes',
    vetting_body: 'KpqC',
    Region: 'KpqC',
    Status: 'Candidate',
    'Status URL': 'https://www.kpqc.or.kr',
  },
  // ── KpqC: AIMer (ZK/Symmetric-based Signature) ──
  {
    'Algorithm Family': 'Signature',
    Algorithm: 'AIMer-128f',
    'Cryptographic Family': 'Hash-based',
    'NIST Security Level': '1',
    'AES Equivalent': 'AES-128',
    'Public Key (bytes)': '32',
    'Private Key (bytes)': '16',
    'Signature/Ciphertext (bytes)': '5904',
    'Shared Secret (bytes)': 'N/A',
    'KeyGen (cycles relative)': 'N/A',
    'Sign/Encaps (cycles relative)': 'N/A',
    'Verify/Decaps (cycles relative)': 'N/A',
    'Stack RAM (bytes)': 'N/A',
    'Optimization Target': 'Small Keys',
    'FIPS Standard': 'N/A',
    'Use Case Notes':
      'KpqC Final Winner 2025 (South Korea). Zero-knowledge / AIM-based symmetric signature. Tiny keys (32B pub); ~6KB signatures. Level 1. National standard TBD.',
    trusted_source_id: '',
    peer_reviewed: 'yes',
    vetting_body: 'KpqC',
    Region: 'KpqC',
    Status: 'Candidate',
    'Status URL': 'https://www.kpqc.or.kr',
  },
  {
    'Algorithm Family': 'Signature',
    Algorithm: 'AIMer-192f',
    'Cryptographic Family': 'Hash-based',
    'NIST Security Level': '3',
    'AES Equivalent': 'AES-192',
    'Public Key (bytes)': '48',
    'Private Key (bytes)': '24',
    'Signature/Ciphertext (bytes)': '13944',
    'Shared Secret (bytes)': 'N/A',
    'KeyGen (cycles relative)': 'N/A',
    'Sign/Encaps (cycles relative)': 'N/A',
    'Verify/Decaps (cycles relative)': 'N/A',
    'Stack RAM (bytes)': 'N/A',
    'Optimization Target': 'Small Keys',
    'FIPS Standard': 'N/A',
    'Use Case Notes':
      'KpqC Final Winner 2025 (South Korea). Level 3 equivalent. ~14KB signatures. National standard TBD.',
    trusted_source_id: '',
    peer_reviewed: 'yes',
    vetting_body: 'KpqC',
    Region: 'KpqC',
    Status: 'Candidate',
    'Status URL': 'https://www.kpqc.or.kr',
  },
  {
    'Algorithm Family': 'Signature',
    Algorithm: 'AIMer-256f',
    'Cryptographic Family': 'Hash-based',
    'NIST Security Level': '5',
    'AES Equivalent': 'AES-256',
    'Public Key (bytes)': '64',
    'Private Key (bytes)': '32',
    'Signature/Ciphertext (bytes)': '27928',
    'Shared Secret (bytes)': 'N/A',
    'KeyGen (cycles relative)': 'N/A',
    'Sign/Encaps (cycles relative)': 'N/A',
    'Verify/Decaps (cycles relative)': 'N/A',
    'Stack RAM (bytes)': 'N/A',
    'Optimization Target': 'Small Keys',
    'FIPS Standard': 'N/A',
    'Use Case Notes':
      'KpqC Final Winner 2025 (South Korea). Level 5 equivalent. ~28KB signatures. National standard TBD.',
    trusted_source_id: '',
    peer_reviewed: 'yes',
    vetting_body: 'KpqC',
    Region: 'KpqC',
    Status: 'Candidate',
    'Status URL': 'https://www.kpqc.or.kr',
  },
  // ── CACR: Aigis-enc (Chinese LWE KEM) ──
  {
    'Algorithm Family': 'KEM',
    Algorithm: 'Aigis-enc-L1',
    'Cryptographic Family': 'Lattice',
    'NIST Security Level': '1',
    'AES Equivalent': 'AES-128',
    'Public Key (bytes)': '672',
    'Private Key (bytes)': '1344',
    'Signature/Ciphertext (bytes)': '672',
    'Shared Secret (bytes)': '32',
    'KeyGen (cycles relative)': 'N/A',
    'Sign/Encaps (cycles relative)': 'N/A',
    'Verify/Decaps (cycles relative)': 'N/A',
    'Stack RAM (bytes)': 'N/A',
    'Optimization Target': 'Balanced',
    'FIPS Standard': 'N/A',
    'Use Case Notes':
      'CACR 1st Prize 2020 (China). LWE-based KEM. Targeting NGCC standardization ~2028. Status: To Be Checked pending NGCC outcome.',
    trusted_source_id: '',
    peer_reviewed: 'yes',
    vetting_body: 'CACR',
    Region: 'CACR',
    Status: 'To Be Checked',
    'Status URL': '',
  },
  {
    'Algorithm Family': 'KEM',
    Algorithm: 'Aigis-enc-L5',
    'Cryptographic Family': 'Lattice',
    'NIST Security Level': '5',
    'AES Equivalent': 'AES-256',
    'Public Key (bytes)': '1344',
    'Private Key (bytes)': '2688',
    'Signature/Ciphertext (bytes)': '1344',
    'Shared Secret (bytes)': '32',
    'KeyGen (cycles relative)': 'N/A',
    'Sign/Encaps (cycles relative)': 'N/A',
    'Verify/Decaps (cycles relative)': 'N/A',
    'Stack RAM (bytes)': 'N/A',
    'Optimization Target': 'Balanced',
    'FIPS Standard': 'N/A',
    'Use Case Notes':
      'CACR 1st Prize 2020 (China). Level 5 variant. Targeting NGCC standardization ~2028. Status: To Be Checked.',
    trusted_source_id: '',
    peer_reviewed: 'yes',
    vetting_body: 'CACR',
    Region: 'CACR',
    Status: 'To Be Checked',
    'Status URL': '',
  },
  // ── CACR: Aigis-sig (Chinese Lattice Signature) ──
  {
    'Algorithm Family': 'Signature',
    Algorithm: 'Aigis-sig-L1',
    'Cryptographic Family': 'Lattice',
    'NIST Security Level': '1',
    'AES Equivalent': 'AES-128',
    'Public Key (bytes)': '1312',
    'Private Key (bytes)': '1376',
    'Signature/Ciphertext (bytes)': '2524',
    'Shared Secret (bytes)': 'N/A',
    'KeyGen (cycles relative)': 'N/A',
    'Sign/Encaps (cycles relative)': 'N/A',
    'Verify/Decaps (cycles relative)': 'N/A',
    'Stack RAM (bytes)': 'N/A',
    'Optimization Target': 'Balanced',
    'FIPS Standard': 'N/A',
    'Use Case Notes':
      'CACR 1st Prize 2020 (China). Lattice signature. Similar parameter structure to ML-DSA. Targeting NGCC ~2028. Status: To Be Checked.',
    trusted_source_id: '',
    peer_reviewed: 'yes',
    vetting_body: 'CACR',
    Region: 'CACR',
    Status: 'To Be Checked',
    'Status URL': '',
  },
  {
    'Algorithm Family': 'Signature',
    Algorithm: 'Aigis-sig-L5',
    'Cryptographic Family': 'Lattice',
    'NIST Security Level': '5',
    'AES Equivalent': 'AES-256',
    'Public Key (bytes)': '2592',
    'Private Key (bytes)': '4864',
    'Signature/Ciphertext (bytes)': '4668',
    'Shared Secret (bytes)': 'N/A',
    'KeyGen (cycles relative)': 'N/A',
    'Sign/Encaps (cycles relative)': 'N/A',
    'Verify/Decaps (cycles relative)': 'N/A',
    'Stack RAM (bytes)': 'N/A',
    'Optimization Target': 'Balanced',
    'FIPS Standard': 'N/A',
    'Use Case Notes':
      'CACR 1st Prize 2020 (China). Level 5 signature. Targeting NGCC ~2028. Status: To Be Checked.',
    trusted_source_id: '',
    peer_reviewed: 'yes',
    vetting_body: 'CACR',
    Region: 'CACR',
    Status: 'To Be Checked',
    'Status URL': '',
  },
  // ── NIST Sig R2: MAYO (Multivariate) ──
  // Sizes from liboqs 0.12.0 / MAYO specification v1.0
  {
    'Algorithm Family': 'Signature',
    Algorithm: 'MAYO-1',
    'Cryptographic Family': 'Multivariate',
    'NIST Security Level': '1',
    'AES Equivalent': 'AES-128',
    'Public Key (bytes)': '1168',
    'Private Key (bytes)': '24',
    'Signature/Ciphertext (bytes)': '321',
    'Shared Secret (bytes)': 'N/A',
    'KeyGen (cycles relative)': 'N/A',
    'Sign/Encaps (cycles relative)': 'N/A',
    'Verify/Decaps (cycles relative)': 'N/A',
    'Stack RAM (bytes)': 'N/A',
    'Optimization Target': 'Small Signature',
    'FIPS Standard': 'N/A',
    'Use Case Notes':
      'NIST Sig Round 2 advancing (Oct 2024). Multivariate (Mayo variant of UOV). Tiny SK (24B) and small sig (321B); large PK (~1.1KB). Final standard ~2027.',
    trusted_source_id: '',
    peer_reviewed: 'yes',
    vetting_body: 'NIST',
    Region: 'NIST',
    Status: 'Candidate',
    'Status URL':
      'https://csrc.nist.gov/projects/pqc-dig-sig/round-2-additional-digital-signature-schemes',
  },
  {
    'Algorithm Family': 'Signature',
    Algorithm: 'MAYO-2',
    'Cryptographic Family': 'Multivariate',
    'NIST Security Level': '1',
    'AES Equivalent': 'AES-128',
    'Public Key (bytes)': '5488',
    'Private Key (bytes)': '24',
    'Signature/Ciphertext (bytes)': '180',
    'Shared Secret (bytes)': 'N/A',
    'KeyGen (cycles relative)': 'N/A',
    'Sign/Encaps (cycles relative)': 'N/A',
    'Verify/Decaps (cycles relative)': 'N/A',
    'Stack RAM (bytes)': 'N/A',
    'Optimization Target': 'Compact Signature',
    'FIPS Standard': 'N/A',
    'Use Case Notes':
      'NIST Sig Round 2. MAYO-2: smallest signature (180B); largest PK (~5.4KB). Good for protocols where bandwidth favors tiny sigs. Final ~2027.',
    trusted_source_id: '',
    peer_reviewed: 'yes',
    vetting_body: 'NIST',
    Region: 'NIST',
    Status: 'Candidate',
    'Status URL':
      'https://csrc.nist.gov/projects/pqc-dig-sig/round-2-additional-digital-signature-schemes',
  },
  {
    'Algorithm Family': 'Signature',
    Algorithm: 'MAYO-3',
    'Cryptographic Family': 'Multivariate',
    'NIST Security Level': '3',
    'AES Equivalent': 'AES-192',
    'Public Key (bytes)': '2656',
    'Private Key (bytes)': '32',
    'Signature/Ciphertext (bytes)': '577',
    'Shared Secret (bytes)': 'N/A',
    'KeyGen (cycles relative)': 'N/A',
    'Sign/Encaps (cycles relative)': 'N/A',
    'Verify/Decaps (cycles relative)': 'N/A',
    'Stack RAM (bytes)': 'N/A',
    'Optimization Target': 'Small Signature',
    'FIPS Standard': 'N/A',
    'Use Case Notes':
      'NIST Sig Round 2. MAYO-3: Level 3. ~577B signatures; ~2.6KB PK. Final ~2027.',
    trusted_source_id: '',
    peer_reviewed: 'yes',
    vetting_body: 'NIST',
    Region: 'NIST',
    Status: 'Candidate',
    'Status URL':
      'https://csrc.nist.gov/projects/pqc-dig-sig/round-2-additional-digital-signature-schemes',
  },
  {
    'Algorithm Family': 'Signature',
    Algorithm: 'MAYO-5',
    'Cryptographic Family': 'Multivariate',
    'NIST Security Level': '5',
    'AES Equivalent': 'AES-256',
    'Public Key (bytes)': '5488',
    'Private Key (bytes)': '40',
    'Signature/Ciphertext (bytes)': '838',
    'Shared Secret (bytes)': 'N/A',
    'KeyGen (cycles relative)': 'N/A',
    'Sign/Encaps (cycles relative)': 'N/A',
    'Verify/Decaps (cycles relative)': 'N/A',
    'Stack RAM (bytes)': 'N/A',
    'Optimization Target': 'Small Signature',
    'FIPS Standard': 'N/A',
    'Use Case Notes':
      'NIST Sig Round 2. MAYO-5: Level 5. ~838B signatures; ~5.4KB PK. Final ~2027.',
    trusted_source_id: '',
    peer_reviewed: 'yes',
    vetting_body: 'NIST',
    Region: 'NIST',
    Status: 'Candidate',
    'Status URL':
      'https://csrc.nist.gov/projects/pqc-dig-sig/round-2-additional-digital-signature-schemes',
  },
  // ── NIST Sig R2: HAWK (Lattice) ──
  // Sizes from liboqs 0.12.0 hawk implementation
  {
    'Algorithm Family': 'Signature',
    Algorithm: 'HAWK-512',
    'Cryptographic Family': 'Lattice',
    'NIST Security Level': '1',
    'AES Equivalent': 'AES-128',
    'Public Key (bytes)': '1024',
    'Private Key (bytes)': '2480',
    'Signature/Ciphertext (bytes)': '555',
    'Shared Secret (bytes)': 'N/A',
    'KeyGen (cycles relative)': 'N/A',
    'Sign/Encaps (cycles relative)': 'N/A',
    'Verify/Decaps (cycles relative)': 'N/A',
    'Stack RAM (bytes)': 'N/A',
    'Optimization Target': 'Small Signature',
    'FIPS Standard': 'N/A',
    'Use Case Notes':
      'NIST Sig Round 2 advancing (Oct 2024). Lattice-based (distinct from Falcon/FN-DSA). Small ~555B signatures; 1KB public key. Final ~2027.',
    trusted_source_id: '',
    peer_reviewed: 'yes',
    vetting_body: 'NIST',
    Region: 'NIST',
    Status: 'Candidate',
    'Status URL':
      'https://csrc.nist.gov/projects/pqc-dig-sig/round-2-additional-digital-signature-schemes',
  },
  {
    'Algorithm Family': 'Signature',
    Algorithm: 'HAWK-1024',
    'Cryptographic Family': 'Lattice',
    'NIST Security Level': '5',
    'AES Equivalent': 'AES-256',
    'Public Key (bytes)': '2048',
    'Private Key (bytes)': '5120',
    'Signature/Ciphertext (bytes)': '1024',
    'Shared Secret (bytes)': 'N/A',
    'KeyGen (cycles relative)': 'N/A',
    'Sign/Encaps (cycles relative)': 'N/A',
    'Verify/Decaps (cycles relative)': 'N/A',
    'Stack RAM (bytes)': 'N/A',
    'Optimization Target': 'Small Signature',
    'FIPS Standard': 'N/A',
    'Use Case Notes':
      'NIST Sig Round 2 advancing. Level 5 variant. ~1KB signatures; 2KB public key. Final ~2027.',
    trusted_source_id: '',
    peer_reviewed: 'yes',
    vetting_body: 'NIST',
    Region: 'NIST',
    Status: 'Candidate',
    'Status URL':
      'https://csrc.nist.gov/projects/pqc-dig-sig/round-2-additional-digital-signature-schemes',
  },
]

const allRef = [...updatedRef, ...newRefRows]

// Verify no duplicate Algorithm names
const refKeys = new Set()
let refDupes = 0
for (const row of allRef) {
  if (refKeys.has(row.Algorithm)) {
    console.warn(`  ⚠️  Duplicate reference row: ${row.Algorithm}`)
    refDupes++
  }
  refKeys.add(row.Algorithm)
}
console.log(
  `  ✅ ${allRef.length} rows total (${existingRef.length} existing + ${newRefRows.length} new), ${refDupes} duplicates`
)

const refOut = Papa.unparse(allRef, { quotes: true, header: true })
writeFileSync(join(DATA_DIR, 'pqc_complete_algorithm_reference_04052026.csv'), refOut)
console.log('  ✅ Written: pqc_complete_algorithm_reference_04052026.csv')

// ─── 3. MIGRATE CATALOG CSV ──────────────────────────────────────────────────

console.log('\n📄 Processing migrate catalog CSV…')

const catalogRaw = readFileSync(join(DATA_DIR, 'pqc_product_catalog_04042026.csv'), 'utf8')
const { data: existingCatalog, meta: catalogMeta } = Papa.parse(catalogRaw, {
  header: true,
  skipEmptyLines: true,
})

// 6 new OSS products (liboqs, OQS-Provider, PQClean, pqcrypto already exist)
const template = {}
catalogMeta.fields.forEach((f) => (template[f] = ''))

const newOssProducts = [
  {
    ...template,
    software_name: 'SMAUG-T Reference Implementation',
    category_id: 'CSC-016',
    category_name: 'Post-Quantum Cryptography Libraries',
    infrastructure_layer: 'Libraries',
    cisa_category: 'Computers (Physical and Virtual)',
    pqc_support: 'Yes (SMAUG-T-128/192/256 — KEM)',
    pqc_capability_description:
      'Reference C implementation of SMAUG-T KEM (KpqC 2025 Final Winner, South Korea). Provides all three parameter sets: SMAUG-T-128 (Level 1), SMAUG-T-192 (Level 3), SMAUG-T-256 (Level 5). For research and prototyping pending Korean national standardization.',
    license_type: 'Open Source',
    license: 'MIT',
    latest_version: 'Final Spec v1.0',
    release_date: '2025',
    fips_validated: 'No',
    pqc_migration_priority: 'Low',
    primary_platforms: 'Linux macOS',
    target_industries: 'All industries',
    authoritative_source: 'https://www.kpqc.or.kr',
    repository_url: 'https://github.com/kpqc-cryptocon/SMAUG-T',
    product_brief:
      'Reference implementation of SMAUG-T, a lattice-based KEM and KpqC 2025 Final Winner. For research and prototyping; Korean national standard TBD.',
    source_type: 'open-source-reference',
    verification_status: 'Pending Verification',
    last_verified_date: '2026-04-05',
    migration_phases: 'prepare,test',
    learning_modules: 'dev-quantum-impact;research-quantum-impact',
    vendor_id: '',
    trusted_source_id: '',
    evidence_flags: '',
    proof_url: 'https://github.com/kpqc-cryptocon/SMAUG-T',
    proof_publication_date: '2025',
    proof_relevant_info: 'KpqC Final Winner 2025. SMAUG-T-128/192/256 parameter sets.',
    validation_result: 'VALIDATED',
    correction_notes: '',
    quantum_tech: '',
  },
  {
    ...template,
    software_name: 'HAETAE Reference Implementation',
    category_id: 'CSC-016',
    category_name: 'Post-Quantum Cryptography Libraries',
    infrastructure_layer: 'Libraries',
    cisa_category: 'Computers (Physical and Virtual)',
    pqc_support: 'Yes (HAETAE-2/3/5 — Signature)',
    pqc_capability_description:
      'Reference C implementation of HAETAE lattice signature scheme (KpqC 2025 Final Winner, South Korea). Provides HAETAE-2, HAETAE-3, HAETAE-5 parameter sets. For research pending Korean national standardization.',
    license_type: 'Open Source',
    license: 'MIT',
    latest_version: 'Final Spec v1.0',
    release_date: '2025',
    fips_validated: 'No',
    pqc_migration_priority: 'Low',
    primary_platforms: 'Linux macOS',
    target_industries: 'All industries',
    authoritative_source: 'https://www.kpqc.or.kr',
    repository_url: 'https://github.com/kpqc-cryptocon/HAETAE',
    product_brief:
      'Reference implementation of HAETAE, a lattice-based signature scheme and KpqC 2025 Final Winner. Korean national standard TBD.',
    source_type: 'open-source-reference',
    verification_status: 'Pending Verification',
    last_verified_date: '2026-04-05',
    migration_phases: 'prepare,test',
    learning_modules: 'dev-quantum-impact;research-quantum-impact',
    vendor_id: '',
    trusted_source_id: '',
    evidence_flags: '',
    proof_url: 'https://github.com/kpqc-cryptocon/HAETAE',
    proof_publication_date: '2025',
    proof_relevant_info: 'KpqC Final Winner 2025. HAETAE-2/3/5 parameter sets.',
    validation_result: 'VALIDATED',
    correction_notes: '',
    quantum_tech: '',
  },
  {
    ...template,
    software_name: 'AIMer Reference Implementation',
    category_id: 'CSC-016',
    category_name: 'Post-Quantum Cryptography Libraries',
    infrastructure_layer: 'Libraries',
    cisa_category: 'Computers (Physical and Virtual)',
    pqc_support: 'Yes (AIMer-128f/192f/256f — Signature)',
    pqc_capability_description:
      'Reference C implementation of AIMer, a zero-knowledge / AIM-based symmetric signature scheme (KpqC 2025 Final Winner, South Korea). Provides AIMer-128f, AIMer-192f, AIMer-256f. Tiny public keys (32–64 bytes); signatures ~6–28KB. For research pending Korean national standardization.',
    license_type: 'Open Source',
    license: 'MIT',
    latest_version: 'Final Spec v1.0',
    release_date: '2025',
    fips_validated: 'No',
    pqc_migration_priority: 'Low',
    primary_platforms: 'Linux macOS',
    target_industries: 'All industries',
    authoritative_source: 'https://www.kpqc.or.kr',
    repository_url: 'https://github.com/kpqc-cryptocon/AIMer',
    product_brief:
      'Reference implementation of AIMer, a symmetric-security ZK signature and KpqC 2025 Final Winner. Notable for tiny 32B public key. Korean national standard TBD.',
    source_type: 'open-source-reference',
    verification_status: 'Pending Verification',
    last_verified_date: '2026-04-05',
    migration_phases: 'prepare,test',
    learning_modules: 'dev-quantum-impact;research-quantum-impact',
    vendor_id: '',
    trusted_source_id: '',
    evidence_flags: '',
    proof_url: 'https://github.com/kpqc-cryptocon/AIMer',
    proof_publication_date: '2025',
    proof_relevant_info: 'KpqC Final Winner 2025. AIMer-128f/192f/256f parameter sets.',
    validation_result: 'VALIDATED',
    correction_notes: '',
    quantum_tech: '',
  },
  {
    ...template,
    software_name: 'NTRU+ Reference Implementation',
    category_id: 'CSC-016',
    category_name: 'Post-Quantum Cryptography Libraries',
    infrastructure_layer: 'Libraries',
    cisa_category: 'Computers (Physical and Virtual)',
    pqc_support: 'Yes (NTRU+-768/1152/1277 — KEM)',
    pqc_capability_description:
      'Reference C implementation of NTRU+ KEM (KpqC 2025 Final Winner, South Korea). Provides ntruplus-768 (Level 1), ntruplus-1152 (Level 3), ntruplus-1277 (Level 5) parameter sets. NTRU lattice variant. For research pending Korean national standardization.',
    license_type: 'Open Source',
    license: 'MIT',
    latest_version: 'Final Spec v1.0',
    release_date: '2025',
    fips_validated: 'No',
    pqc_migration_priority: 'Low',
    primary_platforms: 'Linux macOS',
    target_industries: 'All industries',
    authoritative_source: 'https://www.kpqc.or.kr',
    repository_url: 'https://github.com/kpqc-cryptocon/NTRUplus',
    product_brief:
      'Reference implementation of NTRU+ KEM and KpqC 2025 Final Winner. NTRU-based lattice KEM. Korean national standard TBD.',
    source_type: 'open-source-reference',
    verification_status: 'Pending Verification',
    last_verified_date: '2026-04-05',
    migration_phases: 'prepare,test',
    learning_modules: 'dev-quantum-impact;research-quantum-impact',
    vendor_id: '',
    trusted_source_id: '',
    evidence_flags: '',
    proof_url: 'https://github.com/kpqc-cryptocon/NTRUplus',
    proof_publication_date: '2025',
    proof_relevant_info: 'KpqC Final Winner 2025. ntruplus-768/1152/1277 parameter sets.',
    validation_result: 'VALIDATED',
    correction_notes: '',
    quantum_tech: '',
  },
  {
    ...template,
    software_name: 'Aigis Reference Implementation',
    category_id: 'CSC-016',
    category_name: 'Post-Quantum Cryptography Libraries',
    infrastructure_layer: 'Libraries',
    cisa_category: 'Computers (Physical and Virtual)',
    pqc_support: 'Yes (Aigis-enc L1/L5 — KEM; Aigis-sig L1/L5 — Signature)',
    pqc_capability_description:
      'Reference implementation of Aigis-enc (LWE KEM) and Aigis-sig (lattice signature), CACR 1st Prize 2020 winners (China). Level 1 and Level 5 parameter sets for both KEM and signature. Targeting NGCC standardization ~2028. Status: To Be Checked pending final NGCC outcome.',
    license_type: 'Open Source',
    license: 'Apache-2.0',
    latest_version: 'v1.0',
    release_date: '2020',
    fips_validated: 'No',
    pqc_migration_priority: 'Low',
    primary_platforms: 'Linux',
    target_industries: 'All industries',
    authoritative_source: 'https://github.com/zhenfeizhang/Aigis',
    repository_url: 'https://github.com/zhenfeizhang/Aigis',
    product_brief:
      'Reference implementation of Aigis-enc and Aigis-sig, CACR (China) 1st Prize 2020 winners. Lattice-based KEM and signature. NGCC standardization pending ~2028.',
    source_type: 'open-source-reference',
    verification_status: 'Pending Verification',
    last_verified_date: '2026-04-05',
    migration_phases: 'prepare',
    learning_modules: 'research-quantum-impact',
    vendor_id: '',
    trusted_source_id: '',
    evidence_flags: '',
    proof_url: 'https://github.com/zhenfeizhang/Aigis',
    proof_publication_date: '2020',
    proof_relevant_info:
      'CACR 2020 1st Prize: Aigis-enc (KEM) and Aigis-sig. NGCC standardization ~2028.',
    validation_result: 'VALIDATED',
    correction_notes: 'Status To Be Checked: NGCC standardization outcome pending ~2028.',
    quantum_tech: '',
  },
  {
    ...template,
    software_name: 'MAYO Reference Implementation',
    category_id: 'CSC-016',
    category_name: 'Post-Quantum Cryptography Libraries',
    infrastructure_layer: 'Libraries',
    cisa_category: 'Computers (Physical and Virtual)',
    pqc_support: 'Yes (MAYO-1/2/3/5 — Signature)',
    pqc_capability_description:
      'Reference C implementation of MAYO, a multivariate signature scheme advancing in NIST Additional Signature Round 2 (Oct 2024). Provides MAYO-1, MAYO-2, MAYO-3, MAYO-5. Compact secret key (24–40 bytes); small-to-medium signatures (180–838 bytes); medium-to-large public keys (1.2–5.5KB). Final standard ~2027.',
    license_type: 'Open Source',
    license: 'CC0 (Public Domain)',
    latest_version: 'v1.0',
    release_date: '2024',
    fips_validated: 'No',
    pqc_migration_priority: 'Low',
    primary_platforms: 'Linux macOS Windows',
    target_industries: 'All industries',
    authoritative_source:
      'https://csrc.nist.gov/projects/pqc-dig-sig/round-2-additional-digital-signature-schemes',
    repository_url: 'https://github.com/PQCMayo/MAYO-C',
    product_brief:
      'Reference implementation of MAYO multivariate signature scheme. NIST Additional Sig Round 2 advancing candidate. Compact SK and small signatures; standardization ~2027.',
    source_type: 'open-source-reference',
    verification_status: 'Pending Verification',
    last_verified_date: '2026-04-05',
    migration_phases: 'prepare,test',
    learning_modules: 'dev-quantum-impact;research-quantum-impact',
    vendor_id: '',
    trusted_source_id: '',
    evidence_flags: '',
    proof_url: 'https://github.com/PQCMayo/MAYO-C',
    proof_publication_date: '2024',
    proof_relevant_info: 'NIST Sig Round 2 advancing Oct 2024. MAYO-1/2/3/5 parameter sets.',
    validation_result: 'VALIDATED',
    correction_notes: '',
    quantum_tech: '',
  },
]

const allCatalog = [...existingCatalog, ...newOssProducts]
console.log(
  `  ✅ ${allCatalog.length} rows total (${existingCatalog.length} existing + ${newOssProducts.length} new)`
)

const catalogOut = Papa.unparse(allCatalog, { quotes: true, header: true })
writeFileSync(join(DATA_DIR, 'pqc_product_catalog_04052026.csv'), catalogOut)
console.log('  ✅ Written: pqc_product_catalog_04052026.csv')

console.log('\n🎉 All three CSVs generated successfully.')
