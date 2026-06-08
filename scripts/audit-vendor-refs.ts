#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/audit-vendor-refs.ts
 *
 * Referential-integrity gate for the `vendor_id` column in the product
 * catalog CSV.
 *
 * Validations performed (only for products whose vendor_id resolves to an
 * entry in the vendor roadmap CSV; products with VND IDs that have no
 * roadmap entry yet are silently skipped — that is expected):
 *
 *  A) DEPRECATED (error) — vendor_id must not resolve to a roadmap row
 *     whose status is 'deprecated'. Deprecated vendors no longer have a
 *     live roadmap and the UI would display stale data.
 *
 *  B) NAME MISMATCH (warn) — when the vendor_id resolves in the roadmap CSV,
 *     the roadmap vendor's name tokens must overlap with either:
 *       · `vendor_name_original` (if populated), or
 *       · word-tokens extracted from `product_id`
 *     unless the pairing is listed in KNOWN_INDIRECT (products whose vendor
 *     is known under a different trading name than their product_id implies).
 *
 *     This specifically catches copy-paste VND-ID collisions such as the
 *     Jun-2026 incident where VND-355 (Trezor) was mistakenly assigned to
 *     A10 Networks rows.
 *
 * Usage:
 *   npx tsx scripts/audit-vendor-refs.ts          # human report
 *   npx tsx scripts/audit-vendor-refs.ts --json   # machine-readable
 *
 * Exit codes:
 *   0 — clean (errors = 0; warnings surface but do not fail CI)
 *   1 — one or more errors found
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'

// ---------------------------------------------------------------------------
// Repo paths
// ---------------------------------------------------------------------------

const REPO_ROOT = process.cwd()
const DATA_DIR = path.resolve(REPO_ROOT, 'src/data')

// ---------------------------------------------------------------------------
// Known-indirect mappings
//
// Products legitimately owned by a vendor whose name doesn't appear in the
// product_id. Format: product_id prefix → VND-* that should be mapped to it.
// Add entries here after human confirmation; this list is self-documenting.
// ---------------------------------------------------------------------------

const KNOWN_INDIRECT: Array<{ prefix: string; vnd: string }> = [
  // Amazon / AWS
  { prefix: 'aws-', vnd: 'VND-001' },
  { prefix: 'freertos', vnd: 'VND-001' },
  { prefix: 'mls-rs', vnd: 'VND-001' },
  // Apple
  { prefix: 'ios-', vnd: 'VND-002' },
  { prefix: 'macos-', vnd: 'VND-002' },
  { prefix: 'filevault-', vnd: 'VND-002' },
  // Cisco
  { prefix: 'snort-', vnd: 'VND-008' },
  { prefix: 'mlspp', vnd: 'VND-008' },
  // DigiCert
  { prefix: 'digicert-', vnd: 'VND-012' },
  // F5 / NGINX
  { prefix: 'nginx', vnd: 'VND-014' },
  { prefix: 'f5-', vnd: 'VND-014' },
  // Google
  { prefix: 'android-', vnd: 'VND-018' },
  { prefix: 'boringssl', vnd: 'VND-018' },
  { prefix: 'chromeos', vnd: 'VND-018' },
  { prefix: 'go-jose-', vnd: 'VND-018' },
  { prefix: 'go-stdlib-', vnd: 'VND-018' },
  // IBM (covers ibm-* and lto tape)
  { prefix: 'ibm-', vnd: 'VND-019' },
  { prefix: 'lto-10-', vnd: 'VND-019' },
  // Keyfactor
  { prefix: 'ejbca', vnd: 'VND-024' },
  { prefix: 'signserver', vnd: 'VND-024' },
  // wolfSSL
  { prefix: 'wolfboot', vnd: 'VND-045' },
  { prefix: 'wolfssh', vnd: 'VND-045' },
  { prefix: 'wolftpm-', vnd: 'VND-045' },
  // Cloudflare
  { prefix: 'circl', vnd: 'VND-057' },
  // Okta / Auth0
  { prefix: 'jsonwebtoken-auth0', vnd: 'VND-060' },
  // ISRG (Let's Encrypt / rustls)
  { prefix: 'let-s-encrypt', vnd: 'VND-064' },
  { prefix: 'rustls', vnd: 'VND-064' },
  // Microsoft
  { prefix: 'azure-', vnd: 'VND-027' },
  { prefix: 'bitlocker-', vnd: 'VND-027' },
  { prefix: 'github-', vnd: 'VND-027' },
  { prefix: 'net-', vnd: 'VND-027' },
  { prefix: 'sql-server-', vnd: 'VND-027' },
  { prefix: 'windows-', vnd: 'VND-027' },
  // Oracle
  { prefix: 'java-', vnd: 'VND-029' },
  { prefix: 'mysql-', vnd: 'VND-029' },
  // Red Hat
  { prefix: 'centos-stream', vnd: 'VND-032' },
  { prefix: 'fedora-linux', vnd: 'VND-032' },
  { prefix: 'keycloak', vnd: 'VND-032' },
  { prefix: 'rpm-signing-', vnd: 'VND-032' },
  { prefix: 'sequoia-pgp-', vnd: 'VND-032' },
  // Arm
  { prefix: 'arm-', vnd: 'VND-149' },
  { prefix: 'mbed-tls', vnd: 'VND-149' },
  { prefix: 'mbedtls', vnd: 'VND-149' },
  // Broadcom / VMware
  { prefix: 'vmware-', vnd: 'VND-127' },
  // BTQ Technologies
  { prefix: 'btq-', vnd: 'VND-089' },
  // SWIFT
  { prefix: 'swift-', vnd: 'VND-322' },
  // Trezor hardware wallets (made by Trezor Company s.r.o.)
  { prefix: 'trezor-', vnd: 'VND-355' },
  // Adtran / ADVA
  { prefix: 'adva-', vnd: 'VND-152' },
  // European Commission
  { prefix: 'eu-pqc-', vnd: 'VND-300' },
  { prefix: 'eudi-', vnd: 'VND-220' },
  // Red Hat Dogtag
  { prefix: 'dogtag-', vnd: 'VND-371' },
  // IBM CBOMkit
  { prefix: 'ibm-cbomkit', vnd: 'VND-423' },
  // BlackBerry Certicom
  { prefix: 'certicom-', vnd: 'VND-005' },
  // SUSE LLC (openSUSE Leap is a SUSE product)
  { prefix: 'opensuse-', vnd: 'VND-040' },
  // Cisco (acquired Splunk)
  { prefix: 'splunk-', vnd: 'VND-008' },
  // Red Hat (Dogtag CA is a Red Hat project)
  { prefix: 'dogtag-', vnd: 'VND-032' },
  // Thales (acquired Imperva)
  { prefix: 'imperva-', vnd: 'VND-041' },
  // Canonical (Ubuntu)
  { prefix: 'ubuntu-', vnd: 'VND-006' },
  // Meta (WhatsApp)
  { prefix: 'whatsapp', vnd: 'VND-118' },
  // PQShield libraries
  { prefix: 'pqcryptolib-', vnd: 'VND-030' },
  { prefix: 'pqmicrolib-', vnd: 'VND-030' },
  // Hewlett Packard Enterprise
  { prefix: 'hpe-', vnd: 'VND-379' },
  // Nord Security (NordVPN)
  { prefix: 'nordvpn', vnd: 'VND-391' },
  // SatoshiLabs (Trezor parent company)
  { prefix: 'trezor-', vnd: 'VND-351' },
  // QANplatform (QAN xLink)
  { prefix: 'qan-', vnd: 'VND-318' },
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Finding {
  productId: string
  vendorId: string
  detail: string
  severity: 'error' | 'warn'
}

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

function latestCSV(pattern: RegExp, label: string): string {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => pattern.test(f))
    .map((f) => {
      const m = f.match(/(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
      if (!m) return null
      return {
        file: f,
        date: new Date(parseInt(m[3], 10), parseInt(m[1], 10) - 1, parseInt(m[2], 10)),
        rev: m[4] ? parseInt(m[4], 10) : 0,
      }
    })
    .filter((x): x is { file: string; date: Date; rev: number } => x !== null)
    .sort((a, b) => {
      const d = b.date.getTime() - a.date.getTime()
      return d !== 0 ? d : b.rev - a.rev
    })
  if (files.length === 0) throw new Error(`No ${label} CSV found in src/data/`)
  return path.join(DATA_DIR, files[0].file)
}

function parseCSV(filePath: string): Record<string, string>[] {
  const raw = fs.readFileSync(filePath, 'utf8')
  return Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true }).data
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nameTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[\s\-_.,()&/]+/)
      .filter((t) => t.length > 2)
  )
}

function isKnownIndirect(productId: string, vendorId: string): boolean {
  const pid = productId.toLowerCase()
  return KNOWN_INDIRECT.some((e) => vendorId === e.vnd && pid.startsWith(e.prefix))
}

// ---------------------------------------------------------------------------
// Core audit
// ---------------------------------------------------------------------------

export function audit(): Finding[] {
  const catalogPath = latestCSV(/^pqc_product_catalog_\d{8}(?:_r\d+)?\.csv$/, 'product catalog')
  const roadmapPath = latestCSV(/^migrate_vendor_roadmap_\d{8}(?:_r\d+)?\.csv$/, 'vendor roadmap')

  const catalog = parseCSV(catalogPath)
  const roadmap = parseCSV(roadmapPath)

  // Build roadmap lookup: VND-* → { name, status }
  const roadmapById = new Map<string, { name: string; status: string }>()
  for (const row of roadmap) {
    const id = row['vendor_id']?.trim()
    if (id?.startsWith('VND-')) {
      roadmapById.set(id, {
        name: row['vendor_name']?.trim() ?? '',
        status: row['status']?.trim() ?? 'active',
      })
    }
  }

  const findings: Finding[] = []

  for (const row of catalog) {
    const productId = row['product_id']?.trim() ?? ''
    const vendorId = row['vendor_id']?.trim() ?? ''
    const vendorNameOrig = row['vendor_name_original']?.trim() ?? ''
    const status = row['status']?.trim() ?? 'active'

    // Deprecated products are intentionally frozen — skip.
    if (status === 'deprecated') continue
    if (!vendorId) continue

    // Only validate vendor_ids that actually resolve in the roadmap CSV.
    // A VND-* with no roadmap entry means the vendor has no published
    // roadmap yet — that is expected and not an error.
    const roadmapEntry = roadmapById.get(vendorId)
    if (!roadmapEntry) continue

    const { name: roadmapName, status: roadmapStatus } = roadmapEntry

    // A) Deprecated vendor
    if (roadmapStatus === 'deprecated') {
      findings.push({
        productId,
        vendorId,
        detail: `points to deprecated roadmap vendor '${roadmapName}' — clear or remap to active vendor`,
        severity: 'error',
      })
      continue
    }

    // B) Name mismatch — skip if this is a known-good indirect mapping.
    if (isKnownIndirect(productId, vendorId)) continue

    const roadmapTokens = nameTokens(roadmapName)

    // Check vendor_name_original first (explicit name → strongest signal).
    if (vendorNameOrig) {
      const origTokens = nameTokens(vendorNameOrig)
      const overlap = [...origTokens].some((t) => roadmapTokens.has(t))
      if (!overlap) {
        findings.push({
          productId,
          vendorId,
          detail:
            `vendor_name_original '${vendorNameOrig}' shares no tokens with ` +
            `roadmap vendor '${roadmapName}' — likely wrong VND assignment. ` +
            `If intentional, add to KNOWN_INDIRECT in scripts/audit-vendor-refs.ts`,
          severity: 'warn',
        })
      }
      continue
    }

    // Fall back to product_id tokens when vendor_name_original is absent.
    const productTokens = nameTokens(productId)
    const overlap = [...productTokens].some((t) => roadmapTokens.has(t))
    if (!overlap) {
      findings.push({
        productId,
        vendorId,
        detail:
          `product_id '${productId}' shares no tokens with ` +
          `roadmap vendor '${roadmapName}' (${vendorId}) — likely wrong VND assignment. ` +
          `If intentional, add to KNOWN_INDIRECT in scripts/audit-vendor-refs.ts`,
        severity: 'warn',
      })
    }
  }

  return findings
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function main(): void {
  const wantJson = process.argv.includes('--json')
  const findings = audit()

  if (wantJson) {
    process.stdout.write(JSON.stringify({ findings }, null, 2) + '\n')
    process.exit(findings.some((f) => f.severity === 'error') ? 1 : 0)
  }

  const errors = findings.filter((f) => f.severity === 'error')
  const warns = findings.filter((f) => f.severity === 'warn')

  if (errors.length === 0 && warns.length === 0) {
    console.log('PASS Vendor-ref audit clean.')
    process.exit(0)
  }

  if (errors.length > 0) {
    console.log(`FAIL ${errors.length} vendor-ref error(s):\n`)
    for (const f of errors) {
      console.log(`  [${f.productId}] ${f.vendorId}: ${f.detail}`)
    }
    console.log()
  }

  if (warns.length > 0) {
    console.log(`WARN ${warns.length} vendor-ref warning(s):\n`)
    for (const f of warns) {
      console.log(`  [${f.productId}] ${f.vendorId}: ${f.detail}`)
    }
    console.log()
  }

  process.exit(errors.length > 0 ? 1 : 0)
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
