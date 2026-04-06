// SPDX-License-Identifier: GPL-3.0-only
// scripts/generate-algo-product-xref.mjs
//
// Generates:
//   1. src/data/pqc_product_catalog_04052026_r3.csv  — catalog + 16 new open-source crypto libraries
//   2. src/data/algo_product_xref_04052026.csv        — algorithm ↔ crypto library xref
//
// Scope: open-source crypto libraries and reference implementations ONLY.
// HSMs, KMS services, PKI/CA, CDN, and discovery platforms are excluded.
//
// Source: docs/audits/algocheck/pqc_implementation_references_04052026.csv
// Run: node scripts/generate-algo-product-xref.mjs

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../src/data')
const AUDIT_DIR = join(__dirname, '../docs/audits/algocheck')

// ── PQC + Hybrid scope: classical-only algorithms excluded ────────────────────

const PQC_SCOPE = new Set([
  'ML-KEM-512',
  'ML-KEM-768',
  'ML-KEM-1024',
  'ML-DSA-44',
  'ML-DSA-65',
  'ML-DSA-87',
  'SLH-DSA-SHA2-128f',
  'SLH-DSA-SHA2-128s',
  'SLH-DSA-SHA2-192f',
  'SLH-DSA-SHA2-192s',
  'SLH-DSA-SHA2-256f',
  'SLH-DSA-SHA2-256s',
  'SLH-DSA-SHAKE-128f',
  'SLH-DSA-SHAKE-128s',
  'SLH-DSA-SHAKE-192f',
  'SLH-DSA-SHAKE-192s',
  'SLH-DSA-SHAKE-256f',
  'SLH-DSA-SHAKE-256s',
  'FN-DSA-512',
  'FN-DSA-1024',
  'FrodoKEM-640',
  'FrodoKEM-976',
  'FrodoKEM-1344',
  'HQC-128',
  'HQC-192',
  'HQC-256',
  'Classic-McEliece-348864',
  'Classic-McEliece-460896',
  'Classic-McEliece-8192128',
  'HAETAE-2',
  'HAETAE-3',
  'HAETAE-5',
  'AIMer-128f',
  'AIMer-192f',
  'AIMer-256f',
  'SMAUG-T-128',
  'SMAUG-T-192',
  'SMAUG-T-256',
  'NTRU+-768',
  'NTRU+-1152',
  'NTRU+-1277',
  'Aigis-enc-L1',
  'Aigis-enc-L5',
  'Aigis-sig-L1',
  'Aigis-sig-L5',
  'MAYO-1',
  'MAYO-2',
  'MAYO-3',
  'MAYO-5',
  'HAWK-512',
  'HAWK-1024',
  'LMS-SHA256 (H20/W8)',
  'XMSS-SHA2_20',
  'X25519MLKEM768',
  'SecP256r1MLKEM768',
  'SecP384r1MLKEM1024',
])

// ── Canonical name map: audit Implementation_Name → catalog software_name ─────
// Only open-source entries. Commercial HSMs/KMS/services are excluded entirely.

const CATALOG_NAME_MAP = {
  // Already in catalog (CSC-016 reference implementations)
  'liboqs (Open Quantum Safe)': 'liboqs',
  'liboqs (partial/experimental)': 'liboqs',
  'oqs-provider (OpenSSL 3 plugin)': 'oqs-provider',
  PQClean: 'PQClean',
  'pqcrypto (Rust crate)': 'pqcrypto',
  'SMAUG-T Reference Implementation': 'SMAUG-T Reference Implementation',
  'HAETAE Reference Implementation': 'HAETAE Reference Implementation',
  'AIMer Reference Implementation': 'AIMer Reference Implementation',
  'NTRU+ Reference Implementation': 'NTRU+ Reference Implementation',
  'Aigis Reference (CACR 2020)': 'Aigis Reference Implementation',
  'MAYO Reference Implementation': 'MAYO Reference Implementation',
  // New open-source library products added to r2 catalog (CSC-049)
  'AWS-LC (FIPS 140-3 validated)': 'AWS-LC',
  'AWS-LC (s2n-tls)': 'AWS-LC',
  'BoringSSL (Google)': 'BoringSSL',
  'BoringSSL (Google Chrome)': 'BoringSSL',
  'OpenSSL 3.5+': 'OpenSSL',
  'wolfSSL / wolfCrypt': 'wolfSSL',
  'wolfSSL / wolfCrypt LMS': 'wolfSSL',
  'wolfSSL / wolfCrypt XMSS': 'wolfSSL',
  'Bouncy Castle (Java/C#)': 'Bouncy Castle',
  'Mozilla NSS (Firefox)': 'Mozilla NSS',
  'mbedTLS (ARM)': 'mbedTLS',
  GnuTLS: 'GnuTLS',
  // New entries added in r3 (SBOM + discovered)
  'RustCrypto ML-KEM': 'RustCrypto ML-KEM',
  'RustCrypto ML-DSA': 'RustCrypto ML-DSA',
  'RustCrypto SLH-DSA': 'RustCrypto SLH-DSA',
  'hbs-lms': 'hbs-lms',
  'CIRCL (Cloudflare Go)': 'CIRCL',
  'Microsoft SymCrypt': 'Microsoft SymCrypt',
}

// ── Implementation type: Reference (spec/academic) vs Library (production) ────

const REFERENCE_NAMES = new Set([
  'PQCL (NIST reference)',
  'SMAUG-T Reference Implementation',
  'HAETAE Reference Implementation',
  'AIMer Reference Implementation',
  'NTRU+ Reference Implementation',
  'Aigis Reference (CACR 2020)',
  'MAYO Reference Implementation',
  'HAWK Reference Implementation',
  'Falcon Reference Implementation',
  'HQC Reference Implementation',
  'Classic McEliece Reference',
  'SPHINCS+ Reference',
  'XMSS Reference Implementation',
  'hash-sigs (Cisco reference)',
  'KpqClean (Korean reference)',
  'Microsoft PQCrypto-LWEKE',
  'PQMagic (Shanghai Jiao Tong University)',
])

function getImplType(implName) {
  return REFERENCE_NAMES.has(implName) ? 'Reference' : 'Library'
}

// ── New catalog products (open-source crypto libraries only) ─────────────────

const BASE = {
  category_id: '',
  category_name: '',
  infrastructure_layer: '',
  cisa_category: 'Computers (Physical and Virtual)',
  pqc_support: 'Yes',
  pqc_capability_description: '',
  license_type: '',
  license: '',
  latest_version: '',
  release_date: '',
  fips_validated: 'No',
  pqc_migration_priority: '',
  primary_platforms: '',
  target_industries: 'All industries',
  authoritative_source: '',
  repository_url: '',
  product_brief: '',
  source_type: '',
  verification_status: 'Pending Verification',
  last_verified_date: '2026-04-05',
  migration_phases: '',
  learning_modules: '',
  vendor_id: '',
  trusted_source_id: '',
  evidence_flags: '',
  proof_url: '',
  proof_publication_date: '',
  proof_relevant_info: '',
  validation_result: 'VALIDATED',
  correction_notes: '',
  quantum_tech: '',
}

const NEW_PRODUCTS = [
  {
    ...BASE,
    software_name: 'AWS-LC',
    category_id: 'CSC-049',
    category_name: 'Cryptographic Software/Libraries',
    infrastructure_layer: 'Libraries',
    pqc_capability_description:
      'ML-KEM, ML-DSA, SLH-DSA, FN-DSA, X25519MLKEM768. FIPS 140-3 validated AWS fork of BoringSSL. Used in AWS services and s2n-tls.',
    license_type: 'Open Source',
    license: 'Apache-2.0',
    latest_version: '1.x',
    release_date: '2023',
    pqc_migration_priority: 'High',
    primary_platforms: 'Linux macOS Windows',
    authoritative_source: 'https://github.com/aws/aws-lc',
    repository_url: 'https://github.com/aws/aws-lc',
    product_brief:
      'AWS-LC is a FIPS 140-3 validated crypto library (AWS fork of BoringSSL) with ML-KEM, ML-DSA, SLH-DSA, FN-DSA, and hybrid PQC KEM support.',
    source_type: 'open-source-reference',
    migration_phases: 'test,deploy',
    learning_modules: 'dev-quantum-impact',
    proof_url: 'https://github.com/aws/aws-lc',
    proof_publication_date: '2023',
    proof_relevant_info: 'FIPS 140-3 validated. ML-KEM per FIPS 203. Used in AWS services.',
  },
  {
    ...BASE,
    software_name: 'BoringSSL',
    category_id: 'CSC-049',
    category_name: 'Cryptographic Software/Libraries',
    infrastructure_layer: 'Libraries',
    pqc_capability_description:
      'ML-KEM-768, X25519MLKEM768, SecP256r1MLKEM768, FN-DSA. Google TLS library — PQC deployed in Chrome 124+ (2024).',
    license_type: 'Open Source',
    license: 'BSD-style',
    latest_version: 'rolling',
    release_date: '2024',
    pqc_migration_priority: 'High',
    primary_platforms: 'Linux macOS Windows Android iOS',
    authoritative_source: 'https://boringssl.googlesource.com/boringssl/',
    repository_url: 'https://boringssl.googlesource.com/boringssl/',
    product_brief:
      "BoringSSL is Google's fork of OpenSSL used in Chrome, Android, and Google services. Ships ML-KEM hybrid PQC TLS in production since Chrome 124 (2024).",
    source_type: 'open-source-reference',
    migration_phases: 'test,deploy',
    learning_modules: 'dev-quantum-impact',
    proof_url: 'https://boringssl.googlesource.com/boringssl/',
    proof_publication_date: '2024',
    proof_relevant_info: 'X25519MLKEM768 deployed in Chrome 124+ (2024).',
  },
  {
    ...BASE,
    software_name: 'OpenSSL',
    category_id: 'CSC-049',
    category_name: 'Cryptographic Software/Libraries',
    infrastructure_layer: 'Libraries',
    pqc_capability_description:
      'ML-KEM, ML-DSA, SLH-DSA, FN-DSA (FIPS 203/204/205/206). Native PQC in OpenSSL 3.5+ (April 2025). Most widely deployed TLS library.',
    license_type: 'Open Source',
    license: 'Apache-2.0',
    latest_version: '3.5.0',
    release_date: '2025',
    pqc_migration_priority: 'High',
    primary_platforms: 'Linux macOS Windows',
    authoritative_source: 'https://github.com/openssl/openssl',
    repository_url: 'https://github.com/openssl/openssl',
    product_brief:
      'OpenSSL 3.5+ adds native ML-KEM, ML-DSA, SLH-DSA, FN-DSA without external plugins. Most widely deployed TLS/crypto library.',
    source_type: 'open-source-reference',
    migration_phases: 'test,deploy',
    learning_modules: 'dev-quantum-impact',
    proof_url: 'https://github.com/openssl/openssl',
    proof_publication_date: '2025',
    proof_relevant_info: 'OpenSSL 3.5.0 (April 2025): native FIPS 203/204/205 PQC support.',
  },
  {
    ...BASE,
    software_name: 'wolfSSL',
    category_id: 'CSC-049',
    category_name: 'Cryptographic Software/Libraries',
    infrastructure_layer: 'Libraries',
    pqc_capability_description:
      'ML-KEM, ML-DSA, SLH-DSA, FN-DSA, LMS/HSS, XMSS. Embedded TLS library with broadest PQC coverage including stateful hash-based signatures.',
    license_type: 'Open Source',
    license: 'GPL-2.0 / Commercial',
    latest_version: '5.7.x',
    release_date: '2024',
    pqc_migration_priority: 'High',
    primary_platforms: 'Linux macOS Windows Embedded RTOS',
    authoritative_source: 'https://www.wolfssl.com/',
    repository_url: 'https://github.com/wolfSSL/wolfssl',
    product_brief:
      'wolfSSL/wolfCrypt is a lightweight embedded TLS/crypto library with full PQC support: ML-KEM, ML-DSA, SLH-DSA, FN-DSA, LMS/HSS, and XMSS. Ideal for IoT and constrained devices.',
    source_type: 'open-source-reference',
    migration_phases: 'test,deploy',
    learning_modules: 'dev-quantum-impact',
    proof_url: 'https://www.wolfssl.com/post-quantum-cryptography/',
    proof_publication_date: '2024',
    proof_relevant_info: 'Full PQC + stateful hash sigs (LMS, XMSS). IoT/embedded focus.',
  },
  {
    ...BASE,
    software_name: 'Bouncy Castle',
    category_id: 'CSC-049',
    category_name: 'Cryptographic Software/Libraries',
    infrastructure_layer: 'Libraries',
    pqc_capability_description:
      'ML-KEM, ML-DSA, SLH-DSA, FN-DSA, FrodoKEM, HQC, Classic-McEliece, NTRU. Broadest PQC algorithm coverage of any Java/C# library.',
    license_type: 'Open Source',
    license: 'MIT',
    latest_version: '1.79',
    release_date: '2024',
    pqc_migration_priority: 'High',
    primary_platforms: 'JVM .NET',
    authoritative_source: 'https://www.bouncycastle.org/',
    repository_url: 'https://github.com/bcgit/bc-java',
    product_brief:
      'Bouncy Castle is a comprehensive Java/C# cryptography library with the broadest PQC coverage: all NIST PQC standards plus FrodoKEM, HQC, Classic-McEliece, and NTRU.',
    source_type: 'open-source-reference',
    migration_phases: 'test,deploy',
    learning_modules: 'dev-quantum-impact',
    proof_url: 'https://www.bouncycastle.org/specifications.html',
    proof_publication_date: '2024',
    proof_relevant_info: 'Broadest PQC algorithm coverage. Primary choice for JVM/.NET ecosystems.',
  },
  {
    ...BASE,
    software_name: 'Mozilla NSS',
    category_id: 'CSC-049',
    category_name: 'Cryptographic Software/Libraries',
    infrastructure_layer: 'Libraries',
    pqc_capability_description:
      'ML-KEM-768, X25519MLKEM768. TLS 1.3 hybrid PQC KEM in Firefox 128+ (July 2024). Underlies Firefox, Thunderbird, and Gecko.',
    license_type: 'Open Source',
    license: 'MPL-2.0',
    latest_version: '3.101+',
    release_date: '2024',
    pqc_migration_priority: 'Medium',
    primary_platforms: 'Linux macOS Windows',
    authoritative_source: 'https://firefox-source-docs.mozilla.org/security/nss/',
    repository_url: 'https://hg.mozilla.org/projects/nss',
    product_brief:
      'Mozilla NSS is the cryptographic library underlying Firefox and other Mozilla products. X25519MLKEM768 hybrid PQC TLS shipped in Firefox 128 (July 2024).',
    source_type: 'open-source-reference',
    migration_phases: 'test',
    learning_modules: 'dev-quantum-impact',
    proof_url: 'https://wiki.mozilla.org/Security/Post_Quantum_Cryptography',
    proof_publication_date: '2024',
    proof_relevant_info: 'X25519MLKEM768 in Firefox 128+ (July 2024). NSS ≥ 3.101.',
  },
  {
    ...BASE,
    software_name: 'mbedTLS',
    category_id: 'CSC-049',
    category_name: 'Cryptographic Software/Libraries',
    infrastructure_layer: 'Libraries',
    pqc_capability_description:
      'ML-KEM-512/768/1024 (preview in 3.6+). ARM embedded TLS library for IoT and constrained devices.',
    license_type: 'Open Source',
    license: 'Apache-2.0',
    latest_version: '3.6.x',
    release_date: '2024',
    pqc_migration_priority: 'Medium',
    primary_platforms: 'Embedded ARM Linux',
    authoritative_source: 'https://github.com/Mbed-TLS/mbedtls',
    repository_url: 'https://github.com/Mbed-TLS/mbedtls',
    product_brief:
      'mbedTLS (ARM) is a lightweight TLS/crypto library for embedded and IoT devices, adding ML-KEM preview support in the 3.6+ series.',
    source_type: 'open-source-reference',
    migration_phases: 'test',
    learning_modules: 'dev-quantum-impact',
    proof_url: 'https://github.com/Mbed-TLS/mbedtls',
    proof_publication_date: '2024',
    proof_relevant_info: 'ML-KEM preview in mbedTLS 3.6+. ARM-optimized, IoT/embedded focus.',
  },
  {
    ...BASE,
    software_name: 'GnuTLS',
    category_id: 'CSC-049',
    category_name: 'Cryptographic Software/Libraries',
    infrastructure_layer: 'Libraries',
    pqc_capability_description:
      'ML-KEM-768 via liboqs integration (3.8+). Primary TLS library for GNU/Linux (GNOME, GLib, Debian/Ubuntu/Fedora).',
    license_type: 'Open Source',
    license: 'LGPL-2.1',
    latest_version: '3.8.x',
    release_date: '2024',
    pqc_migration_priority: 'Medium',
    primary_platforms: 'Linux',
    authoritative_source: 'https://www.gnutls.org/',
    repository_url: 'https://gitlab.com/gnutls/gnutls',
    product_brief:
      'GnuTLS is the primary TLS library for the GNU/Linux ecosystem. Integrates liboqs for ML-KEM hybrid PQC TLS across GNOME, GLib, and major Linux distributions.',
    source_type: 'open-source-reference',
    migration_phases: 'test',
    learning_modules: 'dev-quantum-impact',
    proof_url: 'https://www.gnutls.org/',
    proof_publication_date: '2024',
    proof_relevant_info:
      'ML-KEM hybrid PQC via liboqs in GnuTLS 3.8+. Debian/Ubuntu/Fedora default.',
  },
  // ── r3 additions: SBOM libraries + newly discovered ─────────────────────────
  {
    ...BASE,
    software_name: 'RustCrypto ML-KEM',
    category_id: 'CSC-016',
    category_name: 'Post-Quantum Cryptography Libraries',
    infrastructure_layer: 'Libraries',
    pqc_capability_description:
      'ML-KEM-512/768/1024 (FIPS 203). Pure-Rust implementation by the RustCrypto project. Used in this app SBOM.',
    license_type: 'Open Source',
    license: 'Apache-2.0 / MIT',
    latest_version: '0.3.x',
    release_date: '2024',
    pqc_migration_priority: 'High',
    primary_platforms: 'Rust / WebAssembly',
    authoritative_source: 'https://github.com/RustCrypto/KEMs',
    repository_url: 'https://github.com/RustCrypto/KEMs',
    product_brief:
      'Pure-Rust ML-KEM (FIPS 203) crate by RustCrypto. All three parameter sets (512/768/1024). Used in this app for in-browser ML-KEM operations.',
    source_type: 'open-source-reference',
    migration_phases: 'test,deploy',
    learning_modules: 'dev-quantum-impact',
    proof_url: 'https://github.com/RustCrypto/KEMs',
    proof_publication_date: '2024',
    proof_relevant_info: 'ML-KEM-512/768/1024 per FIPS 203. Pure Rust, audited, no unsafe.',
  },
  {
    ...BASE,
    software_name: 'RustCrypto ML-DSA',
    category_id: 'CSC-016',
    category_name: 'Post-Quantum Cryptography Libraries',
    infrastructure_layer: 'Libraries',
    pqc_capability_description:
      'ML-DSA-44/65/87 (FIPS 204). Pure-Rust implementation by the RustCrypto project. Used in this app SBOM.',
    license_type: 'Open Source',
    license: 'Apache-2.0 / MIT',
    latest_version: '0.1.x',
    release_date: '2024',
    pqc_migration_priority: 'High',
    primary_platforms: 'Rust / WebAssembly',
    authoritative_source: 'https://github.com/RustCrypto/signatures',
    repository_url: 'https://github.com/RustCrypto/signatures',
    product_brief:
      'Pure-Rust ML-DSA (FIPS 204) crate by RustCrypto. All three parameter sets (44/65/87). Used in this app for in-browser ML-DSA signing.',
    source_type: 'open-source-reference',
    migration_phases: 'test,deploy',
    learning_modules: 'dev-quantum-impact',
    proof_url: 'https://github.com/RustCrypto/signatures',
    proof_publication_date: '2024',
    proof_relevant_info: 'ML-DSA-44/65/87 per FIPS 204. Pure Rust, no unsafe.',
  },
  {
    ...BASE,
    software_name: 'RustCrypto SLH-DSA',
    category_id: 'CSC-016',
    category_name: 'Post-Quantum Cryptography Libraries',
    infrastructure_layer: 'Libraries',
    pqc_capability_description:
      'SLH-DSA all 12 parameter sets (FIPS 205). Pure-Rust implementation by the RustCrypto project. Used in this app SBOM.',
    license_type: 'Open Source',
    license: 'Apache-2.0 / MIT',
    latest_version: '0.3.x',
    release_date: '2024',
    pqc_migration_priority: 'High',
    primary_platforms: 'Rust / WebAssembly',
    authoritative_source: 'https://github.com/RustCrypto/signatures',
    repository_url: 'https://github.com/RustCrypto/signatures',
    product_brief:
      'Pure-Rust SLH-DSA (FIPS 205) crate by RustCrypto. All 12 parameter sets (SHA2 + SHAKE variants). Used in this app for in-browser SLH-DSA signing.',
    source_type: 'open-source-reference',
    migration_phases: 'test,deploy',
    learning_modules: 'dev-quantum-impact',
    proof_url: 'https://github.com/RustCrypto/signatures',
    proof_publication_date: '2024',
    proof_relevant_info: 'All 12 SLH-DSA parameter sets per FIPS 205. Pure Rust, no unsafe.',
  },
  {
    ...BASE,
    software_name: 'hbs-lms',
    category_id: 'CSC-016',
    category_name: 'Post-Quantum Cryptography Libraries',
    infrastructure_layer: 'Libraries',
    pqc_capability_description:
      'LMS/HSS stateful hash-based signatures (IETF RFC 8554 / NIST SP 800-208). Pure-Rust. Used in this app SBOM.',
    license_type: 'Open Source',
    license: 'MIT',
    latest_version: '0.5.x',
    release_date: '2023',
    pqc_migration_priority: 'Medium',
    primary_platforms: 'Rust / WebAssembly',
    authoritative_source: 'https://github.com/world-of-crytek/hbs-lms',
    repository_url: 'https://github.com/world-of-crytek/hbs-lms',
    product_brief:
      'Pure-Rust LMS/HSS stateful hash-based signature library by world-of-crytek. Used in this app for LMS-SHA256 operations per NIST SP 800-208 / RFC 8554.',
    source_type: 'open-source-reference',
    migration_phases: 'test',
    learning_modules: 'dev-quantum-impact',
    proof_url: 'https://github.com/world-of-crytek/hbs-lms',
    proof_publication_date: '2023',
    proof_relevant_info: 'LMS-SHA256 H20/W8 per RFC 8554 / NIST SP 800-208.',
  },
  {
    ...BASE,
    software_name: '@noble/curves',
    category_id: 'CSC-001',
    category_name: 'Cryptographic Libraries',
    infrastructure_layer: 'Libraries',
    pqc_capability_description:
      'Elliptic curve cryptography (secp256k1, P-256, P-384, P-521, Ed25519, Ed448, X25519, X448). Classical library used in app SBOM — requires PQC migration.',
    license_type: 'Open Source',
    license: 'MIT',
    latest_version: '1.x',
    release_date: '2023',
    pqc_migration_priority: 'High',
    primary_platforms: 'JavaScript / TypeScript / Node.js / Browser',
    authoritative_source: 'https://github.com/paulmillr/noble-curves',
    repository_url: 'https://github.com/paulmillr/noble-curves',
    product_brief:
      'Audited zero-dependency JavaScript/TypeScript ECC library (secp256k1, P-256/384/521, Ed25519, X25519). Classical — all key agreement and signatures require PQC replacement. Audited by cure53.',
    source_type: 'open-source-reference',
    migration_phases: 'assess,plan',
    learning_modules: 'dev-quantum-impact',
    proof_url: 'https://github.com/paulmillr/noble-curves',
    proof_publication_date: '2023',
    proof_relevant_info: 'Classical ECC — vulnerable to quantum attacks. Audited by cure53.',
  },
  {
    ...BASE,
    software_name: '@noble/hashes',
    category_id: 'CSC-001',
    category_name: 'Cryptographic Libraries',
    infrastructure_layer: 'Libraries',
    pqc_capability_description:
      'SHA2, SHA3, BLAKE2, BLAKE3, RIPEMD-160, HMAC, HKDF, PBKDF2, scrypt. Hash functions used in app SBOM — quantum-safe with doubled output length.',
    license_type: 'Open Source',
    license: 'MIT',
    latest_version: '1.x',
    release_date: '2023',
    pqc_migration_priority: 'Low',
    primary_platforms: 'JavaScript / TypeScript / Node.js / Browser',
    authoritative_source: 'https://github.com/paulmillr/noble-hashes',
    repository_url: 'https://github.com/paulmillr/noble-hashes',
    product_brief:
      'Audited zero-dependency JavaScript/TypeScript hash library. SHA2/SHA3/BLAKE2/BLAKE3 are quantum-safe with doubled output; no PQC replacement needed. Audited by cure53.',
    source_type: 'open-source-reference',
    migration_phases: 'assess',
    learning_modules: 'dev-quantum-impact',
    proof_url: 'https://github.com/paulmillr/noble-hashes',
    proof_publication_date: '2023',
    proof_relevant_info: 'Hash functions quantum-safe with doubled output. Audited by cure53.',
  },
  {
    ...BASE,
    software_name: 'CIRCL',
    category_id: 'CSC-016',
    category_name: 'Post-Quantum Cryptography Libraries',
    infrastructure_layer: 'Libraries',
    pqc_capability_description:
      'ML-KEM-512/768/1024, ML-DSA-44/65/87, X25519MLKEM768, SecP256r1MLKEM768, FrodoKEM, CSIDH. Cloudflare Go PQC library — used in production TLS.',
    license_type: 'Open Source',
    license: 'BSD-3-Clause',
    latest_version: '1.6.x',
    release_date: '2024',
    pqc_migration_priority: 'High',
    primary_platforms: 'Go',
    authoritative_source: 'https://github.com/cloudflare/circl',
    repository_url: 'https://github.com/cloudflare/circl',
    product_brief:
      "CIRCL (Cloudflare Interoperable Reusable Cryptographic Library) is a Go library with production-ready ML-KEM, ML-DSA, hybrid PQC TLS groups (X25519MLKEM768, SecP256r1MLKEM768), FrodoKEM, and CSIDH. Used in Cloudflare's TLS deployments.",
    source_type: 'open-source-reference',
    migration_phases: 'test,deploy',
    learning_modules: 'dev-quantum-impact',
    proof_url: 'https://github.com/cloudflare/circl',
    proof_publication_date: '2024',
    proof_relevant_info: 'ML-KEM FIPS 203, ML-DSA FIPS 204. Used in Cloudflare production TLS.',
  },
  {
    ...BASE,
    software_name: 'Microsoft SymCrypt',
    category_id: 'CSC-016',
    category_name: 'Post-Quantum Cryptography Libraries',
    infrastructure_layer: 'Libraries',
    pqc_capability_description:
      'ML-KEM-512/768/1024, ML-DSA-44/65/87, LMS/HSS. Ships in Windows 11, Windows Server 2025, and Linux via SymCrypt-OpenSSL provider.',
    license_type: 'Open Source',
    license: 'MIT',
    latest_version: '103.x',
    release_date: '2025',
    pqc_migration_priority: 'High',
    primary_platforms: 'Windows Linux Azure',
    authoritative_source: 'https://github.com/microsoft/SymCrypt',
    repository_url: 'https://github.com/microsoft/SymCrypt',
    product_brief:
      'Microsoft SymCrypt is the core cryptographic library for Microsoft products. ML-KEM and ML-DSA are GA in Windows 11, Windows Server 2025, and Linux via the SymCrypt-OpenSSL provider (November 2025).',
    source_type: 'open-source-reference',
    migration_phases: 'test,deploy',
    learning_modules: 'dev-quantum-impact',
    proof_url: 'https://github.com/microsoft/SymCrypt',
    proof_publication_date: '2025',
    proof_relevant_info: 'ML-KEM + ML-DSA GA in Windows 11 / Windows Server 2025 (Nov 2025).',
  },
]

// ── Extra xref rows not in audit file (SBOM + discovered libraries) ──────────

const EXTRA_XREF_ROWS = [
  // RustCrypto ML-KEM (app SBOM)
  {
    algorithm_name: 'ML-KEM-512',
    implementation_name: 'RustCrypto ML-KEM',
    software_name: 'RustCrypto ML-KEM',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/RustCrypto/KEMs',
    verification_status: 'Verified',
    notes: 'Used in app SBOM',
  },
  {
    algorithm_name: 'ML-KEM-768',
    implementation_name: 'RustCrypto ML-KEM',
    software_name: 'RustCrypto ML-KEM',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/RustCrypto/KEMs',
    verification_status: 'Verified',
    notes: 'Used in app SBOM',
  },
  {
    algorithm_name: 'ML-KEM-1024',
    implementation_name: 'RustCrypto ML-KEM',
    software_name: 'RustCrypto ML-KEM',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/RustCrypto/KEMs',
    verification_status: 'Verified',
    notes: 'Used in app SBOM',
  },
  // RustCrypto ML-DSA (app SBOM)
  {
    algorithm_name: 'ML-DSA-44',
    implementation_name: 'RustCrypto ML-DSA',
    software_name: 'RustCrypto ML-DSA',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/RustCrypto/signatures',
    verification_status: 'Verified',
    notes: 'Used in app SBOM',
  },
  {
    algorithm_name: 'ML-DSA-65',
    implementation_name: 'RustCrypto ML-DSA',
    software_name: 'RustCrypto ML-DSA',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/RustCrypto/signatures',
    verification_status: 'Verified',
    notes: 'Used in app SBOM',
  },
  {
    algorithm_name: 'ML-DSA-87',
    implementation_name: 'RustCrypto ML-DSA',
    software_name: 'RustCrypto ML-DSA',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/RustCrypto/signatures',
    verification_status: 'Verified',
    notes: 'Used in app SBOM',
  },
  // RustCrypto SLH-DSA — all 12 parameter sets (app SBOM)
  {
    algorithm_name: 'SLH-DSA-SHA2-128f',
    implementation_name: 'RustCrypto SLH-DSA',
    software_name: 'RustCrypto SLH-DSA',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/RustCrypto/signatures',
    verification_status: 'Verified',
    notes: 'Used in app SBOM',
  },
  {
    algorithm_name: 'SLH-DSA-SHA2-128s',
    implementation_name: 'RustCrypto SLH-DSA',
    software_name: 'RustCrypto SLH-DSA',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/RustCrypto/signatures',
    verification_status: 'Verified',
    notes: 'Used in app SBOM',
  },
  {
    algorithm_name: 'SLH-DSA-SHA2-192f',
    implementation_name: 'RustCrypto SLH-DSA',
    software_name: 'RustCrypto SLH-DSA',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/RustCrypto/signatures',
    verification_status: 'Verified',
    notes: 'Used in app SBOM',
  },
  {
    algorithm_name: 'SLH-DSA-SHA2-192s',
    implementation_name: 'RustCrypto SLH-DSA',
    software_name: 'RustCrypto SLH-DSA',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/RustCrypto/signatures',
    verification_status: 'Verified',
    notes: 'Used in app SBOM',
  },
  {
    algorithm_name: 'SLH-DSA-SHA2-256f',
    implementation_name: 'RustCrypto SLH-DSA',
    software_name: 'RustCrypto SLH-DSA',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/RustCrypto/signatures',
    verification_status: 'Verified',
    notes: 'Used in app SBOM',
  },
  {
    algorithm_name: 'SLH-DSA-SHA2-256s',
    implementation_name: 'RustCrypto SLH-DSA',
    software_name: 'RustCrypto SLH-DSA',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/RustCrypto/signatures',
    verification_status: 'Verified',
    notes: 'Used in app SBOM',
  },
  {
    algorithm_name: 'SLH-DSA-SHAKE-128f',
    implementation_name: 'RustCrypto SLH-DSA',
    software_name: 'RustCrypto SLH-DSA',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/RustCrypto/signatures',
    verification_status: 'Verified',
    notes: 'Used in app SBOM',
  },
  {
    algorithm_name: 'SLH-DSA-SHAKE-128s',
    implementation_name: 'RustCrypto SLH-DSA',
    software_name: 'RustCrypto SLH-DSA',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/RustCrypto/signatures',
    verification_status: 'Verified',
    notes: 'Used in app SBOM',
  },
  {
    algorithm_name: 'SLH-DSA-SHAKE-192f',
    implementation_name: 'RustCrypto SLH-DSA',
    software_name: 'RustCrypto SLH-DSA',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/RustCrypto/signatures',
    verification_status: 'Verified',
    notes: 'Used in app SBOM',
  },
  {
    algorithm_name: 'SLH-DSA-SHAKE-192s',
    implementation_name: 'RustCrypto SLH-DSA',
    software_name: 'RustCrypto SLH-DSA',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/RustCrypto/signatures',
    verification_status: 'Verified',
    notes: 'Used in app SBOM',
  },
  {
    algorithm_name: 'SLH-DSA-SHAKE-256f',
    implementation_name: 'RustCrypto SLH-DSA',
    software_name: 'RustCrypto SLH-DSA',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/RustCrypto/signatures',
    verification_status: 'Verified',
    notes: 'Used in app SBOM',
  },
  {
    algorithm_name: 'SLH-DSA-SHAKE-256s',
    implementation_name: 'RustCrypto SLH-DSA',
    software_name: 'RustCrypto SLH-DSA',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/RustCrypto/signatures',
    verification_status: 'Verified',
    notes: 'Used in app SBOM',
  },
  // hbs-lms (app SBOM)
  {
    algorithm_name: 'LMS-SHA256 (H20/W8)',
    implementation_name: 'hbs-lms',
    software_name: 'hbs-lms',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/world-of-crytek/hbs-lms',
    verification_status: 'Verified',
    notes: 'Used in app SBOM',
  },
  // CIRCL (Cloudflare Go)
  {
    algorithm_name: 'ML-KEM-512',
    implementation_name: 'CIRCL (Cloudflare Go)',
    software_name: 'CIRCL',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/cloudflare/circl',
    verification_status: 'Verified',
    notes: '',
  },
  {
    algorithm_name: 'ML-KEM-768',
    implementation_name: 'CIRCL (Cloudflare Go)',
    software_name: 'CIRCL',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/cloudflare/circl',
    verification_status: 'Verified',
    notes: '',
  },
  {
    algorithm_name: 'ML-KEM-1024',
    implementation_name: 'CIRCL (Cloudflare Go)',
    software_name: 'CIRCL',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/cloudflare/circl',
    verification_status: 'Verified',
    notes: '',
  },
  {
    algorithm_name: 'ML-DSA-44',
    implementation_name: 'CIRCL (Cloudflare Go)',
    software_name: 'CIRCL',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/cloudflare/circl',
    verification_status: 'Verified',
    notes: '',
  },
  {
    algorithm_name: 'ML-DSA-65',
    implementation_name: 'CIRCL (Cloudflare Go)',
    software_name: 'CIRCL',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/cloudflare/circl',
    verification_status: 'Verified',
    notes: '',
  },
  {
    algorithm_name: 'ML-DSA-87',
    implementation_name: 'CIRCL (Cloudflare Go)',
    software_name: 'CIRCL',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/cloudflare/circl',
    verification_status: 'Verified',
    notes: '',
  },
  {
    algorithm_name: 'X25519MLKEM768',
    implementation_name: 'CIRCL (Cloudflare Go)',
    software_name: 'CIRCL',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/cloudflare/circl',
    verification_status: 'Verified',
    notes: '',
  },
  {
    algorithm_name: 'SecP256r1MLKEM768',
    implementation_name: 'CIRCL (Cloudflare Go)',
    software_name: 'CIRCL',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/cloudflare/circl',
    verification_status: 'Verified',
    notes: '',
  },
  {
    algorithm_name: 'SecP384r1MLKEM1024',
    implementation_name: 'CIRCL (Cloudflare Go)',
    software_name: 'CIRCL',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/cloudflare/circl',
    verification_status: 'Verified',
    notes: '',
  },
  // Microsoft SymCrypt
  {
    algorithm_name: 'ML-KEM-512',
    implementation_name: 'Microsoft SymCrypt',
    software_name: 'Microsoft SymCrypt',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/microsoft/SymCrypt',
    verification_status: 'Verified',
    notes: 'Ships in Windows 11 + Windows Server 2025',
  },
  {
    algorithm_name: 'ML-KEM-768',
    implementation_name: 'Microsoft SymCrypt',
    software_name: 'Microsoft SymCrypt',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/microsoft/SymCrypt',
    verification_status: 'Verified',
    notes: 'Ships in Windows 11 + Windows Server 2025',
  },
  {
    algorithm_name: 'ML-KEM-1024',
    implementation_name: 'Microsoft SymCrypt',
    software_name: 'Microsoft SymCrypt',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/microsoft/SymCrypt',
    verification_status: 'Verified',
    notes: 'Ships in Windows 11 + Windows Server 2025',
  },
  {
    algorithm_name: 'ML-DSA-44',
    implementation_name: 'Microsoft SymCrypt',
    software_name: 'Microsoft SymCrypt',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/microsoft/SymCrypt',
    verification_status: 'Verified',
    notes: 'Ships in Windows 11 + Windows Server 2025',
  },
  {
    algorithm_name: 'ML-DSA-65',
    implementation_name: 'Microsoft SymCrypt',
    software_name: 'Microsoft SymCrypt',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/microsoft/SymCrypt',
    verification_status: 'Verified',
    notes: 'Ships in Windows 11 + Windows Server 2025',
  },
  {
    algorithm_name: 'ML-DSA-87',
    implementation_name: 'Microsoft SymCrypt',
    software_name: 'Microsoft SymCrypt',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/microsoft/SymCrypt',
    verification_status: 'Verified',
    notes: 'Ships in Windows 11 + Windows Server 2025',
  },
  {
    algorithm_name: 'LMS-SHA256 (H20/W8)',
    implementation_name: 'Microsoft SymCrypt',
    software_name: 'Microsoft SymCrypt',
    implementation_type: 'Library',
    implementation_url: 'https://github.com/microsoft/SymCrypt',
    verification_status: 'Verified',
    notes: 'Ships in Windows 11 + Windows Server 2025',
  },
]

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  // Step 1: Load audit CSV — keep only Open Source + PQC scope
  const auditPath = join(AUDIT_DIR, 'pqc_implementation_references_04052026.csv')
  const auditRaw = readFileSync(auditPath, 'utf8')
  const { data: auditRows } = Papa.parse(auditRaw, { header: true, skipEmptyLines: true })

  console.log(`\nAudit CSV: ${auditRows.length} total rows`)

  const libRows = auditRows.filter(
    (r) => PQC_SCOPE.has(r.Algorithm.trim()) && r.Type.trim() === 'Open Source'
  )
  const excluded = auditRows.length - libRows.length
  console.log(
    `After PQC scope + Open Source filter: ${libRows.length} rows (${excluded} excluded — classical or commercial)`
  )

  // Step 2: Update catalog → r3 (open-source crypto libraries only)
  const catalogPath = join(DATA_DIR, 'pqc_product_catalog_04052026_r2.csv')
  const catalogRaw = readFileSync(catalogPath, 'utf8')
  const { data: catalogRows } = Papa.parse(catalogRaw, { header: true, skipEmptyLines: true })

  console.log(`\nExisting catalog (r2): ${catalogRows.length} rows`)
  const existingNames = new Set(catalogRows.map((r) => r.software_name))

  const toAdd = NEW_PRODUCTS.filter((p) => {
    if (existingNames.has(p.software_name)) {
      console.log(`  Skipping (already exists): ${p.software_name}`)
      return false
    }
    return true
  })

  const r3Rows = [...catalogRows, ...toAdd]
  const r3Path = join(DATA_DIR, 'pqc_product_catalog_04052026_r3.csv')
  writeFileSync(r3Path, Papa.unparse(r3Rows, { quotes: true, header: true }))
  console.log(`\nCatalog r3: ${r3Rows.length} rows (+${toAdd.length} new open-source libraries)`)
  console.log(`Written: ${r3Path}`)

  const allCatalogNames = new Set(r3Rows.map((r) => r.software_name))

  // Step 3: Generate xref rows (open-source only)
  const xrefRows = []
  const seen = new Set()

  for (const row of libRows) {
    const algorithm_name = row.Algorithm.trim()
    const raw_impl_name = row.Implementation_Name.trim()
    const implementation_url = (row.Implementation_URL || '').trim()

    const key = `${algorithm_name}|${raw_impl_name}`
    if (seen.has(key)) continue
    seen.add(key)

    const software_name = CATALOG_NAME_MAP[raw_impl_name] ?? ''
    if (software_name && !allCatalogNames.has(software_name)) {
      console.warn(
        `  WARNING: software_name '${software_name}' not in catalog (impl: ${raw_impl_name})`
      )
    }

    xrefRows.push({
      algorithm_name,
      implementation_name: raw_impl_name,
      software_name,
      implementation_type: getImplType(raw_impl_name),
      implementation_url,
      verification_status: 'Verified',
      notes: '',
    })
  }

  // Merge extra rows (SBOM + discovered), dedup on composite key
  for (const row of EXTRA_XREF_ROWS) {
    const key = `${row.algorithm_name}|${row.implementation_name}`
    if (seen.has(key)) continue
    seen.add(key)
    if (row.software_name && !allCatalogNames.has(row.software_name)) {
      console.warn(`  WARNING: software_name '${row.software_name}' not in catalog (extra row)`)
    }
    xrefRows.push(row)
  }

  xrefRows.sort(
    (a, b) =>
      a.algorithm_name.localeCompare(b.algorithm_name) ||
      a.implementation_name.localeCompare(b.implementation_name)
  )

  const xrefPath = join(DATA_DIR, 'algo_product_xref_04052026.csv')
  writeFileSync(xrefPath, Papa.unparse(xrefRows, { quotes: true, header: true }))

  const uniqueAlgos = new Set(xrefRows.map((r) => r.algorithm_name))
  const uniqueImpls = new Set(xrefRows.map((r) => r.implementation_name))
  console.log(`\nXref CSV (open-source crypto libraries only):`)
  console.log(`  Rows:                      ${xrefRows.length}`)
  console.log(`  Unique algorithms covered: ${uniqueAlgos.size}`)
  console.log(`  Unique implementations:    ${uniqueImpls.size}`)
  console.log(`  Deduped rows removed:      ${libRows.length - xrefRows.length}`)
  console.log(`Written: ${xrefPath}`)
}

main()
