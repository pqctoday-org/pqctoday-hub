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
  // QNu Labs — 'qverse' is a product name/brand, not a QNu Labs name token;
  // genuine QNu Labs product (see correction_notes on the qverse row).
  // Added 2026-07-07 after retagging qverse off a duplicate vendor row.
  { prefix: 'qverse', vnd: 'VND-319' },
  // HP Inc. — 'hp' is filtered by nameTokens() (length > 2), so
  // hp-enterprise-printers-pqc never token-matches "HP Inc." even though
  // it's a genuine HP product. Added 2026-07-07 after this false positive
  // surfaced once a VND-244 vendor-roadmap row was added in the same pass.
  { prefix: 'hp-enterprise-printers-pqc', vnd: 'VND-244' },
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
  { prefix: 'gcp-', vnd: 'VND-018' },
  // Ping Identity (acquired ForgeRock in Aug 2023)
  { prefix: 'forgerock-', vnd: 'VND-178' },
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
  // Open Quantum Safe Project — 'liboqs'/'oqs-' don't token-match "Open
  // Quantum Safe Project" but are genuinely OQS's own repos.
  { prefix: 'liboqs', vnd: 'VND-048' },
  { prefix: 'oqs-', vnd: 'VND-048' },
  // Giesecke+Devrient GmbH — 'g-d-'/'giesecke-devrient-' don't token-match
  // "Giesecke+Devrient GmbH" (the '+' breaks tokenization) but are genuine.
  { prefix: 'g-d-', vnd: 'VND-159' },
  { prefix: 'giesecke-devrient-', vnd: 'VND-159' },
  // KiviCore Oy — 'cast-kivipqc-kem' embeds 'kivi' mid-token
  // ('kivipqc'), so the tokenizer never isolates it. vendor_id corrected
  // from VND-247 (ANSSI) to VND-256 (KiviCore) 2026-07-27; still needs
  // this entry since the name still doesn't token-match.
  { prefix: 'cast-kivipqc-', vnd: 'VND-256' },
  // Hamad Bin Khalifa University (HBKU) — 'qatar-qc2-quantum-center' is the
  // product/center name (QC2), which shares no tokens with "Hamad Bin
  // Khalifa University (HBKU)". Genuine: the row's authoritative_source is
  // https://www.hbku.edu.qa/en/cse/qc2, on HBKU's own domain. Added
  // 2026-08-29 after N/A-audit-vendor-refs flagged it as a likely mismatch.
  { prefix: 'qatar-qc2-', vnd: 'VND-278' },
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
  const registryPath = latestCSV(/^vendors_\d{8}(?:_r\d+)?\.csv$/, 'vendor registry')

  const catalog = parseCSV(catalogPath)
  const roadmap = parseCSV(roadmapPath)
  const registry = parseCSV(registryPath)

  // Build roadmap lookup: VND-* → all of that vendor's roadmap rows (a
  // vendor can carry more than one concurrently-active row since 2026-09-13
  // — CHANGED from a single {name, status} value, which silently kept only
  // the last-iterated row per vendor and could evaluate the checks below
  // against an arbitrary row instead of "does ANY of this vendor's rows
  // match / is ANY of them active").
  const roadmapById = new Map<string, Array<{ name: string; status: string }>>()
  for (const row of roadmap) {
    const id = row['vendor_id']?.trim()
    if (id?.startsWith('VND-')) {
      const entry = {
        name: row['vendor_name']?.trim() ?? '',
        status: row['status']?.trim() ?? 'active',
      }
      const list = roadmapById.get(id)
      if (list) list.push(entry)
      else roadmapById.set(id, [entry])
    }
  }

  // Build registry lookup: VND-* → status. The vendor REGISTRY (vendors_*.csv)
  // is the authoritative product↔vendor entity link; the roadmap CSV is a
  // SEPARATE dataset (which vendors have a published PQC roadmap). A vendor can
  // be active as an entity while its roadmap entry is deprecated ("no published
  // PQC roadmap") — that is not a wrong vendor_id, and the roadmap UI already
  // filters deprecated roadmaps at load, so it cannot surface stale data.
  const registryStatusById = new Map<string, string>()
  for (const row of registry) {
    const id = row['vendor_id']?.trim()
    if (id?.startsWith('VND-')) {
      registryStatusById.set(id, row['status']?.trim() ?? 'active')
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
    const roadmapEntries = roadmapById.get(vendorId)
    if (!roadmapEntries || roadmapEntries.length === 0) continue

    const activeEntries = roadmapEntries.filter((e) => e.status !== 'deprecated')
    // For messaging, prefer an active row's name; fall back to the first
    // entry so a fully-deprecated vendor's finding still names a vendor.
    const roadmapName = (activeEntries[0] ?? roadmapEntries[0]).name

    // A) Deprecated vendor — only an error if ALL of this vendor's roadmap
    //    rows are deprecated (an active row elsewhere means the vendor DOES
    //    have a published, current roadmap — a stray deprecated row
    //    alongside it is not an error) AND the vendor ENTITY is deprecated
    //    in the registry (the authoritative product↔vendor link). A
    //    deprecated ROADMAP for an entity still active in the registry just
    //    means "this active vendor has no published PQC roadmap"; the
    //    product is correctly attributed and the roadmap UI filters
    //    deprecated rows, so it is not a wrong/stale vendor_id.
    const registryStatus = registryStatusById.get(vendorId)
    if (activeEntries.length === 0 && registryStatus !== 'active') {
      findings.push({
        productId,
        vendorId,
        detail:
          `points to '${roadmapName}' whose roadmap is deprecated AND which is ` +
          `${registryStatus ? 'deprecated' : 'absent'} in the vendor registry — clear or remap to an active vendor`,
        severity: 'error',
      })
      continue
    }
    if (activeEntries.length === 0) {
      // active registry entity, deprecated roadmap → fine, skip name/other checks
      continue
    }

    // B) Name mismatch — skip if this is a known-good indirect mapping.
    if (isKnownIndirect(productId, vendorId)) continue

    // A vendor can have more than one active roadmap row (2026-09-13+) —
    // match against ANY of them; only flag when NONE share a token, so a
    // second, differently-titled announcement never produces a false
    // positive against a product correctly attributed via the first.
    const roadmapTokensList = activeEntries.map((e) => nameTokens(e.name))
    const roadmapNamesJoined = activeEntries.map((e) => e.name).join(' / ')

    // Check vendor_name_original first (explicit name → strongest signal).
    if (vendorNameOrig) {
      const origTokens = [...nameTokens(vendorNameOrig)]
      const overlap = roadmapTokensList.some((tokens) => origTokens.some((t) => tokens.has(t)))
      if (!overlap) {
        findings.push({
          productId,
          vendorId,
          detail:
            `vendor_name_original '${vendorNameOrig}' shares no tokens with ` +
            `roadmap vendor(s) '${roadmapNamesJoined}' — likely wrong VND assignment. ` +
            `If intentional, add to KNOWN_INDIRECT in scripts/audit-vendor-refs.ts`,
          severity: 'warn',
        })
      }
      continue
    }

    // Fall back to product_id tokens when vendor_name_original is absent.
    const productTokens = [...nameTokens(productId)]
    const overlap = roadmapTokensList.some((tokens) => productTokens.some((t) => tokens.has(t)))
    if (!overlap) {
      findings.push({
        productId,
        vendorId,
        detail:
          `product_id '${productId}' shares no tokens with ` +
          `roadmap vendor(s) '${roadmapNamesJoined}' (${vendorId}) — likely wrong VND assignment. ` +
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
