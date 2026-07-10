// SPDX-License-Identifier: GPL-3.0-only
/**
 * migrate-proof-rule.ts — MP-1 + MP-2 + MP-3
 *
 * Mirrors threats-proof-rule.ts (TP-1/2/3) for the migrate product catalog.
 * Added 2026-07-07 after an audit + remediation pass found that two of five
 * "authorized proof-less corrections" had silently reverted to disproven PQC
 * claims across two later catalog passes, with nothing catching it. See:
 * pqctoday-hub-migrate-data-remediation-plan-07072026.md
 *
 * MP-1  Every active row with pqc_status_canonical in {available, partial}
 *       MUST have its product_id present in public/migrate-proofs/manifest.json
 *       (a proof physically downloaded to disk). Rows lacking a downloaded
 *       proof should be pqc_status_canonical='pending' or 'roadmap' instead,
 *       or the row should be deprecated per the DS-series rule.
 *
 * MP-2  Every active row whose product_id is in manifest.json's `downloads`
 *       MUST have an archived file that actually exists on disk under
 *       public/migrate-proofs/ (catches the case where manifest.json is
 *       tracked in git but the large HTML/PDF blobs — which are gitignored —
 *       are missing on this machine).
 *
 * MP-3  Known-fragile rows (previously the subject of an authorized
 *       proof-less correction) must not silently regress back to the
 *       disproven claim. Unlike MP-1/MP-2 this is a pinned allowlist, not a
 *       generic proof check — it exists because this exact regression
 *       already happened twice (06-06 correction reverted by two later
 *       "global accuracy pass" runs before anyone noticed).
 *
 * MP-4  Every non-empty `trusted_source_id` on an active migrate or vendor
 *       row MUST resolve to an `id` in pqc_authoritative_sources_reference_*.csv.
 *       Added 2026-07-07 after finding 286 migrate rows + 9 vendor rows whose
 *       trusted_source_id was SET but pointed at nothing — worse than blank,
 *       since CM-AT-migrate/CM-AT-vendors only check for blank, so a dangling
 *       (non-resolving) value silently passed as "compliant". Mirrors TP-3
 *       (threats) and CM-T-02 (timeline), which already existed for their
 *       domains; migrate/vendors had no equivalent.
 *
 * Severity: ERROR for MP-1/MP-2/MP-4, ERROR for MP-3. A catalog row with an
 * unproven PQC claim is a public-facing correctness bug, not a warning.
 *
 * Wiring: invoked from scripts/validate-data-integrity.ts alongside the
 * other validator families.
 */

import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import crypto from 'crypto'

import type { CheckResult, Finding } from './types.js'

const dataDir = (): string => path.join(process.cwd(), 'src/data')
const proofsDir = (): string => path.join(process.cwd(), 'public/migrate-proofs')

interface CatalogRow {
  product_id?: string
  software_name?: string
  pqc_status_canonical?: string
  proof_url?: string
  status?: string
  correction_notes?: string
  trusted_source_id?: string
}

interface VendorRow {
  vendor_id?: string
  vendor_name?: string
  status?: string
  trusted_source_id?: string
}

interface AuthSourceRow {
  id?: string
}

interface ManifestEntry {
  product_id: string
  url: string
  ok?: boolean
  file?: string
}

// Rows previously the subject of an authorized proof-less correction.
// allowed = canonical statuses that are NOT the disproven claim.
// NOTE: the catalog's real pqc_status_canonical vocabulary is
// {available, none, roadmap, partial, unknown, planned} — 'no'/'pending'
// are NOT valid values here (a first draft of this rule used them and
// produced 3 false positives against legitimately re-validated rows).
const KNOWN_FRAGILE: Record<string, { allowed: string[]; disprovenClaim: string }> = {
  'futurex-vectera-plus': {
    allowed: ['none'],
    disprovenClaim: 'available (Vectera Plus PQC — conflates with CryptoHub)',
  },
  'renesas-veridify-pqc-for-ra-mcus': {
    allowed: ['unknown', 'none'],
    disprovenClaim: 'available (NIST ML-DSA/ML-KEM tied to Renesas RA MCUs — unconfirmed)',
  },
  'hyperledger-besu': {
    allowed: ['none', 'unknown'],
    disprovenClaim: 'available (PQC via JDK dependency only, not a Besu feature)',
  },
  'pfsense-community-edition': {
    allowed: ['none', 'unknown'],
    disprovenClaim: 'available (strongSwan 6.0/ML-KEM — not in release notes)',
  },
  opnsense: {
    allowed: ['none', 'partial', 'unknown'],
    disprovenClaim:
      'available (strongSwan 6.0/ML-KEM — not in release notes; OPNsense partial is legitimate via OpenSSH mgmt plane)',
  },
}

function findLatestCsv(prefix: string): string | null {
  if (!fs.existsSync(dataDir())) return null
  const re = new RegExp(`^${prefix}(\\d{8})(?:_r(\\d+))?\\.csv$`)
  const files = fs.readdirSync(dataDir()).filter((f) => re.test(f))
  if (files.length === 0) return null
  files.sort((a, b) => {
    const parse = (name: string): number => {
      const m = name.match(re)
      if (!m) return 0
      const mm = m[1].slice(0, 2)
      const dd = m[1].slice(2, 4)
      const yyyy = m[1].slice(4, 8)
      const r = m[2] || '0'
      return Number(`${yyyy}${mm}${dd}${r.padStart(2, '0')}`)
    }
    return parse(b) - parse(a)
  })
  return path.join(dataDir(), files[0])
}

function findLatestCatalogCsv(): string | null {
  return findLatestCsv('pqc_product_catalog_')
}

function loadManifest(): { byProductId: Map<string, ManifestEntry>; name: string } {
  const p = path.join(proofsDir(), 'manifest.json')
  if (!fs.existsSync(p)) return { byProductId: new Map(), name: 'manifest.json (missing)' }
  const parsed = JSON.parse(fs.readFileSync(p, 'utf-8')) as { downloads: ManifestEntry[] }
  const byProductId = new Map<string, ManifestEntry>()
  for (const d of parsed.downloads || []) {
    if (d.ok !== false) byProductId.set(d.product_id, d)
  }
  return { byProductId, name: 'manifest.json' }
}

function urlHashFile(productId: string, url: string): string {
  const h = crypto.createHash('sha1').update(url).digest('hex').slice(0, 8)
  const ext = url.toLowerCase().endsWith('.pdf') ? 'pdf' : 'html'
  return `${productId}-${h}.${ext}`
}

export function runMigrateProofRule(): CheckResult[] {
  const csvPath = findLatestCatalogCsv()
  if (!csvPath) {
    return [
      {
        id: 'MP-1',
        category: 'local-resource',
        description: 'Every active available/partial catalog row has a downloaded proof',
        sourceA: 'pqc_product_catalog_*.csv',
        sourceB: 'public/migrate-proofs/',
        severity: 'ERROR',
        status: 'SKIP',
        findings: [
          {
            csv: '',
            row: null,
            field: '',
            value: '',
            message: 'No pqc_product_catalog_*.csv found in src/data/',
          },
        ],
      },
    ]
  }

  const raw = fs.readFileSync(csvPath, 'utf-8')
  const rows = Papa.parse<CatalogRow>(raw, { header: true, skipEmptyLines: true }).data
  const csvName = path.basename(csvPath)
  const { byProductId: manifest, name: manifestName } = loadManifest()

  const mp1: Finding[] = []
  const mp2: Finding[] = []
  const mp3: Finding[] = []
  const NEEDS_PROOF = new Set(['available', 'partial'])

  rows.forEach((r, idx) => {
    const status = (r.status || '').trim().toLowerCase()
    if (status === 'deprecated') return
    const pid = (r.product_id || '').trim()
    const canon = (r.pqc_status_canonical || '').trim().toLowerCase()
    const rowNum = idx + 2

    // MP-1
    if (NEEDS_PROOF.has(canon)) {
      const entry = manifest.get(pid)
      if (!entry) {
        mp1.push({
          csv: csvName,
          row: rowNum,
          field: 'pqc_status_canonical',
          value: canon,
          message: `Active product ${pid} claims '${canon}' but has no downloaded proof in ${manifestName} — set to 'pending' or download a proof`,
        })
      } else {
        // MP-2: the archived file must actually exist on disk (blobs are
        // gitignored, so this catches "manifest says downloaded, file is
        // missing on this machine/checkout").
        const fname = entry.file || urlHashFile(pid, entry.url)
        const fpath = path.join(proofsDir(), fname)
        if (!fs.existsSync(fpath)) {
          mp2.push({
            csv: csvName,
            row: rowNum,
            field: 'proof_url',
            value: entry.url,
            message: `Active product ${pid} manifest entry points at ${fname}, which does not exist on disk under public/migrate-proofs/`,
          })
        }
      }
    }

    // MP-3: known-fragile rows must not have regressed
    const fragile = KNOWN_FRAGILE[pid]
    if (fragile && !fragile.allowed.includes(canon)) {
      mp3.push({
        csv: csvName,
        row: rowNum,
        field: 'pqc_status_canonical',
        value: canon,
        message: `${pid} has regressed to a previously-disproven claim (canonical='${canon}', expected one of [${fragile.allowed.join(', ')}]). Disproven claim was: ${fragile.disprovenClaim}`,
      })
    }
  })

  // MP-4: trusted_source_id must resolve, for both migrate and vendors rows.
  const mp4: Finding[] = []
  const authPath = findLatestCsv('pqc_authoritative_sources_reference_')
  const authIds = authPath
    ? new Set(
        Papa.parse<AuthSourceRow>(fs.readFileSync(authPath, 'utf-8'), {
          header: true,
          skipEmptyLines: true,
        })
          .data.map((r) => (r.id || '').trim())
          .filter(Boolean)
      )
    : null
  const authName = authPath ? path.basename(authPath) : 'pqc_authoritative_sources_reference_*.csv'

  if (authIds) {
    rows.forEach((r, idx) => {
      const status = (r.status || '').trim().toLowerCase()
      if (status === 'deprecated') return
      const tsid = (r.trusted_source_id || '').trim()
      if (tsid && !authIds.has(tsid)) {
        mp4.push({
          csv: csvName,
          row: idx + 2,
          field: 'trusted_source_id',
          value: tsid,
          message: `Active product ${(r.product_id || '').trim()} trusted_source_id="${tsid}" does not resolve to any id in ${authName}`,
        })
      }
    })

    const vendorsPath = findLatestCsv('vendors_')
    if (vendorsPath) {
      const vendorRows = Papa.parse<VendorRow>(fs.readFileSync(vendorsPath, 'utf-8'), {
        header: true,
        skipEmptyLines: true,
      }).data
      const vendorsName = path.basename(vendorsPath)
      vendorRows.forEach((r, idx) => {
        const status = (r.status || '').trim().toLowerCase()
        if (status === 'deprecated') return
        const tsid = (r.trusted_source_id || '').trim()
        if (tsid && !authIds.has(tsid)) {
          mp4.push({
            csv: vendorsName,
            row: idx + 2,
            field: 'trusted_source_id',
            value: tsid,
            message: `Active vendor ${(r.vendor_id || '').trim()} trusted_source_id="${tsid}" does not resolve to any id in ${authName}`,
          })
        }
      })
    }
  }

  return [
    {
      id: 'MP-1',
      category: 'local-resource',
      description:
        "Every active 'available'/'partial' catalog row has a downloaded proof recorded in manifest.json",
      sourceA: csvName,
      sourceB: manifestName,
      severity: 'ERROR',
      status: mp1.length === 0 ? 'PASS' : 'FAIL',
      findings: mp1,
    },
    {
      id: 'MP-2',
      category: 'local-resource',
      description:
        'Every manifest-recorded proof file actually exists on disk under public/migrate-proofs/',
      sourceA: manifestName,
      sourceB: 'public/migrate-proofs/',
      severity: 'ERROR',
      status: mp2.length === 0 ? 'PASS' : 'FAIL',
      findings: mp2,
    },
    {
      id: 'MP-3',
      category: 'local-resource',
      description:
        'Known-fragile rows (prior authorized proof-less corrections) have not regressed',
      sourceA: csvName,
      sourceB: null,
      severity: 'ERROR',
      status: mp3.length === 0 ? 'PASS' : 'FAIL',
      findings: mp3,
    },
    {
      id: 'MP-4',
      category: 'cross-reference',
      description:
        'Every active migrate/vendor trusted_source_id resolves to the authoritative-sources catalog',
      sourceA: csvName,
      sourceB: authName,
      severity: 'ERROR',
      status: authIds === null ? 'SKIP' : mp4.length === 0 ? 'PASS' : 'FAIL',
      findings:
        authIds === null
          ? [
              {
                csv: '',
                row: null,
                field: '',
                value: '',
                message: 'No pqc_authoritative_sources_reference_*.csv found',
              },
            ]
          : mp4,
    },
  ]
}
