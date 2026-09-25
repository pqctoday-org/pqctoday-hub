// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/lib/threatsCorpus.ts
 *
 * The threats-specific rules `generate-rag-corpus.ts` applies, split out as
 * pure functions over parsed CSV rows so they can be unit-tested without
 * running the generator (or touching public/data/rag-corpus.json).
 *
 * Every rule defers to src/data/threatRowRules.ts — the same module the
 * Threats page's loader uses — so the corpus can never:
 *   - cite a threat the page will not open (retired or draft rows),
 *   - build an `&industry=` link with a raw CSV label the page merges away,
 *   - describe the page with counts or parameters that are no longer true.
 */
import {
  canonicalThreatIndustry,
  criticalityLevelsPresent,
  isPublishedThreatStatus,
} from '../../src/data/threatRowRules'

/** Parsed CSV as the generator reads it: header row first, then data rows. */
type CsvRows = readonly (readonly string[])[]

/** True when row `i` is a threats row the page does not show (deprecated,
 *  obsolete or draft). A file with no `status` column publishes every row. */
export function isUnpublishedThreatRow(rows: CsvRows, i: number): boolean {
  const statusIdx = rows[0]?.indexOf('status') ?? -1
  if (statusIdx === -1) return false
  return !isPublishedThreatStatus(rows[i]?.[statusIdx])
}

/** The published rows of a threats CSV as header-keyed records. */
export function publishedThreatRecords(rows: CsvRows): Record<string, string>[] {
  const header = rows[0] ?? []
  const out: Record<string, string>[] = []
  for (let i = 1; i < rows.length; i++) {
    if (isUnpublishedThreatRow(rows, i)) continue
    out.push(Object.fromEntries(header.map((h, c) => [h, (rows[i][c] ?? '').trim()])))
  }
  return out
}

/** Ids of the threats the page shows — the only ids a corpus chunk may link. */
export function publishedThreatIds(rows: CsvRows): Set<string> {
  return new Set(
    publishedThreatRecords(rows)
      .map((r) => r.threat_id)
      .filter(Boolean)
  )
}

/**
 * Deep link for one threat. `&industry=` carries the label the page shows —
 * an old label (e.g. "Energy / Critical Infrastructure", now "Critical
 * Infrastructure / OT" — ruling R3) is written as the page's current one.
 */
export function threatDeepLink(threatId: string, rawIndustry?: string): string {
  const id = `/threats?id=${encodeURIComponent(threatId.trim())}`
  const industry = rawIndustry?.trim() ? canonicalThreatIndustry(rawIndustry.trim()) : ''
  return industry ? `${id}&industry=${encodeURIComponent(industry)}` : id
}

/**
 * The Threats page-guide chunk's text, with every count and list derived from
 * the published rows and every URL parameter one the page actually reads
 * (ThreatsDashboard + threatsUrlParams). It used to be a hand-written string
 * ("80+ threats across 20 industries", no class/mode/tier/view, a severity
 * list including a level no row has) that drifted from the page.
 */
export function buildThreatsPageGuide(records: readonly Record<string, string>[]): string {
  const industries = [
    ...new Set(records.map((r) => canonicalThreatIndustry(r.industry ?? '')).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b))
  const levels = criticalityLevelsPresent(
    records.map((r) => ({ criticality: (r.criticality ?? '').trim() || 'Unrated' }))
  )
  const exampleId = records.find((r) => r.threat_id)?.threat_id ?? '<threatId>'
  const exampleIndustry = industries[0] ?? '<industry>'

  return [
    'Threats Page Overview',
    '',
    `The Threats dashboard lists ${records.length} quantum threat scenarios across ${industries.length} industries: ${industries.join(', ')}.`,
    '',
    `Criticality levels in use: ${levels.join(', ')}. A row whose criticality has not been assessed shows as Unrated.`,
    '',
    'Key concepts:',
    '- HNDL (Harvest Now, Decrypt Later): adversaries capture encrypted data today to decrypt once a cryptographically relevant quantum computer (CRQC) exists — a confidentiality threat.',
    '- HNFL / TNFL (Harvest/Tamper Now, Forge Later): adversaries plan to forge signatures (code signing, certificates, legal documents) once ECDSA/RSA fall — an authenticity threat.',
    '- Each threat carries a reviewed class — HNDL, HNFL/TNFL, or both — and a Shor-resource tier graded from its at-risk cryptography (Imminent, Near-term, Grover-weakened, PQC-safe, or Unscored when no algorithm is named).',
    '',
    'Each threat entry shows: threat ID, industry, description, criticality, cryptography at risk, recommended PQC replacement, source with its evidence (whether the cited document is confirmed to be the one named, how many of the entry’s claims it states, approved second sources, last verified), trust score, the SOC detection use cases and incident-response playbooks that apply to its class (Applied Quantum PQC Migration Framework v3.0), and related learning modules. The page also carries the CRQC Threat Horizon (the published CRQC expert forecast window, regulators’ migration deadlines shown separately as deadlines, and per-sector Mosca deadlines).',
    '',
    'URL parameters (all combinable):',
    `- ?id=<threatId> — open one threat's detail (e.g. /threats?id=${exampleId}); a retired id shows when and why it was retired`,
    `- ?industry=<name> — industry filter, comma-separated for several (e.g. /threats?industry=${encodeURIComponent(exampleIndustry)})`,
    `- ?criticality=<level> — ${levels.join(' | ')}`,
    '- ?class=<hndl|hnfl> — threat class; hndl shows threats classed HNDL or both, hnfl shows HNFL/TNFL or both',
    '- ?q=<text> — search threat IDs, descriptions, industries, cryptography at risk and PQC replacements',
    '- ?sort=<industry|threatId|criticality|evidence> — sort field (default industry; evidence = best-evidenced first: source confirmed, claims the cited document states)',
    '- ?dir=<asc|desc> — sort direction (default asc)',
    '- ?mode=<table|cards> — layout (default table)',
    '- ?tier=<Authoritative|High|Moderate|Low> — trust-tier filter, repeatable',
    '- ?view=horizon — open scrolled to the CRQC Threat Horizon section',
    '',
    `Example links: /threats?criticality=Critical&class=hndl (critical decrypt-later threats), /threats?id=${exampleId} (open one threat), /threats?sort=evidence&dir=desc (best-evidenced first), /threats?view=horizon (CRQC Threat Horizon).`,
  ].join('\n')
}
