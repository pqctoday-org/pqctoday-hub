/**
 * Adds Cosmian KMS and SOPS entries to the product catalog.
 * Run: node scripts/add-catalog-entries-04162026.mjs
 */
import { createRequire } from 'module'
import { readFileSync, writeFileSync, copyFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const require = createRequire(import.meta.url)
const Papa = require('papaparse')

const SRC = 'src/data/pqc_product_catalog_04142026.csv'
const DEST = 'src/data/pqc_product_catalog_04162026.csv'

// 1. Copy to new dated file
copyFileSync(SRC, DEST)
console.log(`Copied ${SRC} → ${DEST}`)

// 2. Parse
const raw = readFileSync(DEST, 'utf-8')
const parsed = Papa.parse(raw, { header: true, skipEmptyLines: true })
const headers = parsed.meta.fields
console.log(`Parsed ${parsed.data.length} rows, ${headers.length} columns`)

// 3. New records
const newRows = [
  {
    product_id: 'cosmian-kms',
    software_name: 'Cosmian KMS',
    category_id: 'CSC-003',
    category_name: 'Key Management Systems (KMS)',
    infrastructure_layer: 'Security Stack',
    cisa_category: 'Enterprise Security',
    pqc_support: 'Yes',
    pqc_capability_description:
      'Full ML-KEM-512/768/1024 (FIPS 203) ML-DSA-44/65/87 (FIPS 204) and SLH-DSA (FIPS 205) in production since v5.12+. KMIP 2.1 server. Hybrid KEM combiner (classical + PQC via SHA-256). Covercrypt attribute-based encryption. Only open-source KMIP server with full NIST PQC algorithm suite shipping today.',
    license_type: 'Open Source',
    license: 'BSL-1.1',
    latest_version: '5.19.0',
    release_date: '2025',
    fips_validated: 'No',
    pqc_migration_priority: 'High',
    primary_platforms: 'Linux Cloud Docker AWS',
    target_industries: 'All industries',
    authoritative_source: 'https://docs.cosmian.com/key_management_system/',
    repository_url: 'https://github.com/Cosmian/kms',
    product_brief:
      'Open-source KMIP 2.1 key management server with native ML-KEM ML-DSA and SLH-DSA support. Only open-source KMS with full NIST PQC algorithm suite in production. Supports PKCS#11 via OpenSSL 3 provider. BSL-1.1 license allows free testing; commercial agreement required for production deployments.',
    source_type: 'Trusted Vendor',
    verification_status: 'Verified',
    last_verified_date: '2026-04-16',
    migration_phases: 'migrate,launch,rampup',
    learning_modules: 'kms-pqc;secrets-management-pqc;hybrid-crypto',
    vendor_id: 'VND-085',
    trusted_source_id: 'nist-csrc',
    evidence_flags: 'no-cert-backing',
    proof_url: 'https://docs.cosmian.com/key_management_system/kmip/',
    proof_publication_date: '2025',
    proof_relevant_info:
      'ML-KEM ML-DSA SLH-DSA production in KMIP 2.1 since v5.12. Hybrid KEM combiner. Same vendor as Cosmian Covercrypt (already in catalog).',
    validation_result: 'VALIDATED',
    correction_notes: 'PQC support validated with authoritative source.',
    quantum_tech: '',
    wip: 'false',
    github_contribution_url: 'https://github.com/Cosmian/kms',
  },
  {
    product_id: 'getsops-sops',
    software_name: 'SOPS (Secrets OPerationS)',
    category_id: 'CSC-053',
    category_name: 'Secrets Management',
    infrastructure_layer: 'Security Stack',
    cisa_category: 'Enterprise Security',
    pqc_support: 'Yes (with details)',
    pqc_capability_description:
      'PQC-capable via age encryption backend with -pq flag (hybrid X25519+Kyber768 key encapsulation). SOPS is encryption-backend agnostic; age v1.3+ post-quantum hybrid keys encrypt secrets at rest. Additional PQC KEMs available via age plugin system (age-plugin-sntrup761x25519). Supports AWS KMS Google Cloud KMS Azure Key Vault age and PGP backends.',
    license_type: 'Open Source',
    license: 'MPL-2.0',
    latest_version: '3.9.x',
    release_date: '2025',
    fips_validated: 'No',
    pqc_migration_priority: 'High',
    primary_platforms: 'Linux macOS Windows Cloud Kubernetes',
    target_industries: 'All industries',
    authoritative_source: 'https://github.com/getsops/sops',
    repository_url: 'https://github.com/getsops/sops',
    product_brief:
      'CNCF Sandbox project for encrypted file-based secrets management in GitOps workflows. PQC-capable today via age -pq backend (hybrid X25519+Kyber768). Encrypts YAML JSON ENV INI and binary files. Most deployable open-source PQC secret encryption for Kubernetes and CI/CD pipelines.',
    source_type: 'Trusted Vendor',
    verification_status: 'Verified',
    last_verified_date: '2026-04-16',
    migration_phases: 'migrate,launch,rampup',
    learning_modules: 'secrets-management-pqc;kms-pqc;hybrid-crypto',
    vendor_id: 'VND-301',
    trusted_source_id: 'mozilla',
    evidence_flags: 'no-cert-backing',
    proof_url: 'https://github.com/getsops/sops',
    proof_publication_date: '2024',
    proof_relevant_info:
      'PQC via age -pq flag (hybrid X25519+Kyber768). CNCF Sandbox since 2024. Originally created by Mozilla. age plugin system supports additional PQC KEMs including age-plugin-sntrup761x25519.',
    validation_result: 'VALIDATED',
    correction_notes: 'PQC support validated via age -pq integration.',
    quantum_tech: '',
    wip: 'false',
    github_contribution_url: 'https://github.com/getsops/sops',
  },
]

// 4. Verify product_ids don't already exist
const existingIds = new Set(parsed.data.map((r) => r.product_id))
for (const row of newRows) {
  if (existingIds.has(row.product_id)) {
    console.error(`ERROR: product_id '${row.product_id}' already exists — aborting`)
    process.exit(1)
  }
}

// 5. Append using PapaParse (correct quoting)
const appendCsv = Papa.unparse(newRows, { header: false, columns: headers })
const current = readFileSync(DEST, 'utf-8')
const separator = current.endsWith('\n') ? '' : '\n'
writeFileSync(DEST, current + separator + appendCsv + '\n')

// 6. Verify
const verify = Papa.parse(readFileSync(DEST, 'utf-8'), { header: true, skipEmptyLines: true })
const expectedCount = parsed.data.length + newRows.length
if (verify.data.length !== expectedCount) {
  console.error(`ERROR: expected ${expectedCount} rows, got ${verify.data.length}`)
  process.exit(1)
}
if (verify.errors.length > 0) {
  console.error('Parse errors:', verify.errors)
  process.exit(1)
}

console.log(`\nSuccess: ${verify.data.length} total rows (added ${newRows.length})`)
console.log(`Parse errors: ${verify.errors.length}`)
console.log('New entries:')
for (const row of newRows) {
  const added = verify.data.find((r) => r.product_id === row.product_id)
  console.log(` - ${added.product_id}: ${added.software_name} (${added.category_name})`)
}
