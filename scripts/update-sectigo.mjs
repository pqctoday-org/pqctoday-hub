import Papa from 'papaparse'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..', 'antigravity', 'pqc-timeline-app')

const srcFile = 'pqc_product_catalog_04132026.csv'
const src = fs.readFileSync(path.join(root, 'src/data', srcFile), 'utf8')
const parsed = Papa.parse(src, { header: true, skipEmptyLines: true })

const row = parsed.data.find((r) => r.software_name === 'Sectigo Cert Manager 2026')
if (!row) {
  console.error('Row not found!')
  process.exit(1)
}

// Fill the 8 missing fields
row.repository_url = ''
row.fips_validated = 'No'
row.vendor_id = 'sectigo'
row.github_contribution_url = ''
row.latest_version = 'v26.1'
row.release_date = '2026-01-26'
row.license = 'Proprietary / Commercial SaaS'
row.license_type = 'Commercial'
row.quantum_tech = 'ML-DSA-44; ML-DSA-65; ML-DSA-87'

// Upgrade status based on Private PQC launch (April 14, 2026)
row.pqc_support = 'Available'
row.pqc_capability_description =
  'Sectigo Certificate Manager (SCM) v26.1 launched "Private PQC" on April 14, 2026 — native private PQC SSL/TLS certificate issuance using ML-DSA-44, ML-DSA-65, and ML-DSA-87 (FIPS 204). Broader roadmap includes ML-KEM (FIPS 203) and SLH-DSA (FIPS 205). Also offers PQC Labs sandbox and Q.U.A.N.T. strategic framework for enterprise quantum readiness.'
row.verification_status = 'Verified'
row.last_verified_date = '2026-04-14'
row.evidence_flags = 'vendor-announcement-2026-04-14'
row.proof_relevant_info =
  'Private PQC feature launched April 14, 2026: ML-DSA-44/65/87 private SSL/TLS cert issuance in SCM. SCM v26.1 released Jan 26, 2026. No FIPS 140 CMVP certificate for Sectigo. Broader PQC roadmap covers ML-KEM + SLH-DSA.'
row.correction_notes =
  'Upgraded from Planned to Available based on Private PQC launch (2026-04-14). ML-DSA algorithms confirmed via vendor press release and industry coverage.'
row.product_brief =
  'Cloud-native certificate lifecycle management platform supporting automated issuance, renewal, and revocation of public and private SSL/TLS, S/MIME, and code-signing certificates across enterprise PKI.'
row.primary_platforms = 'Cloud SaaS; On-Premises'
row.target_industries = 'Enterprise; Finance; Government; Healthcare'
row.change_status = 'Updated'

const out = Papa.unparse(parsed.data, { columns: parsed.meta.fields })
const outFile = 'pqc_product_catalog_04142026.csv'
fs.writeFileSync(path.join(root, 'src/data', outFile), out + '\n')
console.log(`Written: ${parsed.data.length} rows → ${outFile}`)
console.log(
  `Updated: ${row.software_name} → pqc_support=${row.pqc_support}, quantum_tech=${row.quantum_tech}`
)
