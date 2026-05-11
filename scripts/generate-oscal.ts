#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * generate-oscal.ts — OSCAL 1.1.2 Assessment-Results Export
 *
 * Reads the latest compliance_*.csv and optional revisions.jsonl,
 * then writes public/data/pqctoday-oscal.json.
 *
 * Two results arrays are produced:
 *   1. Governance subset — records with non-empty cswp39_tags or governance body types
 *   2. Full inventory — all compliance records
 *
 * Usage: npx tsx scripts/generate-oscal.ts [--dry-run]
 */
import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import Papa from 'papaparse'
import { glob } from 'glob'

const DATA_DIR = path.resolve(process.cwd(), 'src/data')
const REVISIONS_PATH = path.resolve(process.cwd(), 'public/data/revisions.jsonl')
const OUT_PATH = path.resolve(process.cwd(), 'public/data/pqctoday-oscal.json')
// T13: per-tier split files for audit pipelines that want to opt into a single subset
const OUT_GOVERNANCE_PATH = path.resolve(
  process.cwd(),
  'public/data/pqctoday-oscal-governance.json'
)
const OUT_FULL_PATH = path.resolve(process.cwd(), 'public/data/pqctoday-oscal-full.json')
const DRY_RUN = process.argv.includes('--dry-run')

const GOVERNANCE_BODY_TYPES = new Set([
  'standardization_body',
  'compliance_framework',
  'certification_body',
])

interface RawComplianceRow {
  id: string
  label: string
  description: string
  industries: string
  countries: string
  requires_pqc: string
  deadline: string
  notes: string
  enforcement_body: string
  library_refs: string
  timeline_refs: string
  body_type: string
  website: string
  trusted_source_id: string
  peer_reviewed: string
  vetting_body: string
  website_url_quality: string
  confidence_score?: string
  cswp39_tags?: string
}

interface RevisionEntry {
  domain?: string
  record_id?: string
  record_ids?: string[]
  reviewer_display?: string
  timestamp?: string
}

// ── Deterministic UUID from SHA-256 ────────────────────────────────────────

function deterministicUuid(input: string): string {
  const hash = createHash('sha256').update(input).digest('hex')
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`
}

// ── Reviewer map from revisions.jsonl ──────────────────────────────────────

function loadReviewerMap(): Map<string, string> {
  const map = new Map<string, string>()
  if (!fs.existsSync(REVISIONS_PATH)) {
    console.warn(
      '[generate-oscal] revisions.jsonl not found — reviewer_display will be "unreviewed"'
    )
    return map
  }
  const lines = fs
    .readFileSync(REVISIONS_PATH, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
  for (const line of lines) {
    try {
      const entry: RevisionEntry = JSON.parse(line)
      const display = entry.reviewer_display
      if (!display) continue
      const ids = entry.record_ids ?? (entry.record_id ? [entry.record_id] : [])
      for (const id of ids) {
        map.set(`${entry.domain ?? ''}:${id}`, display)
      }
    } catch {
      // skip malformed lines
    }
  }
  return map
}

// ── OSCAL finding state from record fields ─────────────────────────────────

function findingState(
  requiresPqc: string,
  deadline: string
): 'satisfied' | 'not-satisfied' | 'not-applicable' {
  const d = deadline.toLowerCase()
  if (d.includes('deprecated') || d.includes('removed')) return 'not-satisfied'
  if (requiresPqc.toLowerCase() === 'yes') return 'satisfied'
  return 'not-applicable'
}

// ── Build a single OSCAL result object for a compliance record ─────────────

function buildResult(row: RawComplianceRow, reviewerMap: Map<string, string>) {
  const controlId = row.id.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const confidenceScore = row.confidence_score?.trim() || 'unknown'
  const reviewerDisplay = reviewerMap.get(`compliance:${row.id}`) ?? 'unreviewed'
  const cswp39Tags = row.cswp39_tags?.trim()
    ? row.cswp39_tags
        .split(';')
        .map((t) => t.trim())
        .filter(Boolean)
        .join(';')
    : ''

  const observationUuid = deterministicUuid(`obs:${row.id}`)
  const findingUuid = deterministicUuid(`finding:${row.id}`)

  const observation = {
    uuid: observationUuid,
    description: row.description || row.label,
    'relevant-evidence': row.website
      ? [
          {
            href: row.website,
            description: `Authoritative source${row.website_url_quality ? ` (${row.website_url_quality.replace(/_/g, ' ')})` : ''}`,
          },
        ]
      : [],
    props: [
      {
        name: 'confidence-score',
        value: confidenceScore,
        class: 'trust-engine',
      },
      {
        name: 'reviewer-display',
        value: reviewerDisplay,
        class: 'trust-engine',
      },
      {
        name: 'cswp39-tags',
        value: cswp39Tags,
        class: 'trust-engine',
      },
    ],
  }

  const finding = {
    uuid: findingUuid,
    title: row.label,
    target: {
      type: 'objective-id',
      'target-id': row.id,
      status: {
        state: findingState(row.requires_pqc, row.deadline),
      },
    },
    'related-observations': [{ 'observation-uuid': observationUuid }],
  }

  return {
    uuid: deterministicUuid(`result:${row.id}`),
    title: row.label,
    description: row.description || row.label,
    start: new Date().toISOString().slice(0, 10),
    'reviewed-controls': {
      'control-selections': [
        {
          'include-controls': [
            {
              'control-id': controlId,
            },
          ],
        },
      ],
    },
    findings: [finding],
    observations: [observation],
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Locate latest compliance CSV
  const files = await glob('compliance_*.csv', { cwd: DATA_DIR })
  files.sort()
  const latest = files.at(-1)
  if (!latest) {
    console.error('[generate-oscal] No compliance CSV found in src/data/')
    process.exit(1)
  }
  console.log(`[generate-oscal] Using ${latest}`)

  // 2. Parse CSV
  const raw = fs.readFileSync(path.join(DATA_DIR, latest), 'utf8')
  const parsed = Papa.parse<RawComplianceRow>(raw, { header: true, skipEmptyLines: true })
  const rows = parsed.data

  // 3. Build reviewer map
  const reviewerMap = loadReviewerMap()

  // 4. Partition into governance subset and full inventory
  const governanceRows = rows.filter((r) => {
    const hasCswp39Tags = r.cswp39_tags?.trim() && r.cswp39_tags.trim() !== ''
    const isGovernanceBodyType = GOVERNANCE_BODY_TYPES.has(r.body_type)
    return hasCswp39Tags || isGovernanceBodyType
  })

  // 5. Build OSCAL result objects
  const governanceResults = governanceRows.map((r) => buildResult(r, reviewerMap))
  const fullInventoryResults = rows.map((r) => buildResult(r, reviewerMap))

  // 6. Read package.json version
  const pkgJson = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8')
  ) as { version: string }

  // 7. Assemble OSCAL document
  const oscalDoc = {
    'assessment-results': {
      uuid: deterministicUuid('pqctoday-compliance'),
      metadata: {
        title: 'PQCToday Compliance Assessment Results',
        'last-modified': new Date().toISOString(),
        version: pkgJson.version,
        'oscal-version': '1.1.2',
        remarks: 'Generated by pqctoday-hub scripts/generate-oscal.ts',
      },
      // T14 — points at the real assessment-plan companion produced by
      // generate-oscal-assessment-plan.ts. The relative href works for
      // consumers fetching both documents from public/data/.
      'import-ap': {
        href: './pqctoday-oscal-assessment-plan.json',
      },
      results: [
        {
          uuid: deterministicUuid('pqctoday-governance-subset'),
          title: 'PQCToday Governance Compliance Subset',
          description:
            'Compliance records with CSWP 39 alignment tags or governance body type classification',
          start: new Date().toISOString().slice(0, 10),
          'reviewed-controls': {
            'control-selections': [
              {
                'include-all': {},
              },
            ],
          },
          findings: governanceResults.flatMap((r) => r.findings),
          observations: governanceResults.flatMap((r) => r.observations),
        },
        {
          uuid: deterministicUuid('pqctoday-full-inventory'),
          title: 'PQCToday Full Compliance Inventory',
          description: 'Complete inventory of all tracked compliance frameworks and standards',
          start: new Date().toISOString().slice(0, 10),
          'reviewed-controls': {
            'control-selections': [
              {
                'include-all': {},
              },
            ],
          },
          findings: fullInventoryResults.flatMap((r) => r.findings),
          observations: fullInventoryResults.flatMap((r) => r.observations),
        },
      ],
    },
  }

  if (DRY_RUN) {
    const ar = oscalDoc['assessment-results']
    console.log('[dry-run] OSCAL document summary:')
    console.log(`  governance subset findings: ${ar.results[0].findings.length}`)
    console.log(`  full inventory findings: ${ar.results[1].findings.length}`)
    console.log(`  doc uuid: ${ar.uuid}`)
    console.log(
      `  first observation props: ${JSON.stringify(ar.results[0].observations[0]?.props ?? [])}`
    )
  } else {
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
    fs.writeFileSync(OUT_PATH, JSON.stringify(oscalDoc, null, 2), 'utf8')

    // T13: per-tier split files. Same metadata + import-ap, but each contains
    // exactly one entry in results[]. Lets a downstream OSCAL consumer ingest
    // just the governance subset without parsing past it, or just the full
    // inventory without filtering on body_type/cswp39_tags themselves.
    const ar = oscalDoc['assessment-results']
    const split = (subset: 'governance' | 'full', resultIdx: number) => ({
      'assessment-results': {
        ...ar,
        uuid: deterministicUuid(`pqctoday-${subset}-only`),
        metadata: {
          ...ar.metadata,
          remarks: `${ar.metadata.remarks} — ${subset === 'governance' ? 'governance subset only' : 'full inventory only'}`,
        },
        results: [ar.results[resultIdx]],
      },
    })
    const govDoc = split('governance', 0)
    const fullDoc = split('full', 1)
    fs.writeFileSync(OUT_GOVERNANCE_PATH, JSON.stringify(govDoc, null, 2), 'utf8')
    fs.writeFileSync(OUT_FULL_PATH, JSON.stringify(fullDoc, null, 2), 'utf8')

    console.log(`[generate-oscal] Wrote → ${OUT_PATH}`)
    console.log(`  governance subset: ${ar.results[0].findings.length} findings`)
    console.log(`  full inventory: ${ar.results[1].findings.length} findings`)
    console.log(`[generate-oscal] Wrote → ${OUT_GOVERNANCE_PATH}`)
    console.log(`[generate-oscal] Wrote → ${OUT_FULL_PATH}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
