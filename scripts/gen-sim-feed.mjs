// SPDX-License-Identifier: GPL-3.0-only
/**
 * gen-sim-feed — emit the Simulation's live-feed as a dated CSV with one or more
 * records for EVERY quarter from Q1 2026 to Q4 2040 (the end of the simulation).
 *
 * The feed is a scripted PQC-era timeline: curated milestones land on their real
 * quarters (NIST/CNSA/BSI deadlines, the 2029 first CRQC = Q-Day, 2035 broad
 * availability) and every other quarter gets an era-appropriate line so the
 * ticker always has something to show. Loaded latest-date-wins by simFeed.ts.
 *
 *     node scripts/gen-sim-feed.mjs 06142026
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const DATE = process.argv[2] || '06142026' // MMDDYYYY
const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'data',
  `sim_feed_${DATE}.csv`
)

// Curated milestones keyed `${year}Q${q}` — real PQC-era signposts.
const MILESTONES = {
  '2026Q1': [['info', 'NIST FIPS 203/204/205 adoption accelerating across vendors']],
  '2026Q2': [
    ['warning', 'Harvest-now-decrypt-later capture campaigns reported against classical TLS'],
  ],
  '2026Q4': [['info', 'PQC readiness questionnaires becoming standard in enterprise procurement']],
  '2027Q1': [['warning', 'Regulators publish quantum-readiness expectations; clock is ticking']],
  '2027Q3': [['info', 'Hybrid ML-KEM deployments reach mainstream browser and VPN support']],
  '2028Q1': [['warning', 'Q-Day forecasts converge on ~2029 — boards demand migration status']],
  '2028Q3': [['danger', 'Late-stage cryptanalysis breakthroughs narrow the safety margin']],
  '2029Q1': [
    ['danger', 'Q-DAY: first CRQC demonstrated — the most sensitive assets are now breakable'],
  ],
  '2029Q2': [
    [
      'danger',
      'Classical RSA/ECC key exchange must be considered compromised for long-lived secrets',
    ],
  ],
  '2030Q1': [['danger', 'CNSA 2.0 / BSI deadlines in force — non-PQC systems out of compliance']],
  '2031Q1': [
    ['warning', 'Quantum attack tooling commoditising; high-sensitivity assets broadly exposed'],
  ],
  '2032Q1': [['warning', 'Insurers reprice or exclude non-PQC cryptographic risk']],
  '2033Q1': [
    ['warning', 'Medium-sensitivity assets now within reach of available quantum capacity'],
  ],
  '2035Q1': [['danger', 'CRQC broadly available — EVERY sensitivity tier is at risk']],
  '2037Q1': [['info', 'Post-quantum baseline assumed; residual classical crypto is legacy debt']],
  '2040Q4': [['info', 'Simulation horizon reached — your program’s posture is locked in']],
}

// Per-era baseline line (rotated by quarter index) for quarters with no milestone.
const ERA = (year) => {
  if (year <= 2028)
    return [
      ['info', 'Discovery and inventory work continues across the estate'],
      ['warning', 'Long-shelf-life data keeps accruing harvest-now exposure'],
      ['info', 'Pilots and hybrid rollouts expand to more Tier-1 systems'],
      ['success', 'Another wave of systems migrated to hybrid PQC'],
    ]
  if (year === 2029 || year === 2030)
    return [
      ['danger', 'Active exploitation pressure on un-migrated critical assets'],
      ['warning', 'Compliance auditors flag remaining classical cryptography'],
      ['warning', 'Vendor delays threaten the migration critical path'],
      ['success', 'Critical systems cut over to PQC ahead of the wave'],
    ]
  if (year <= 2034)
    return [
      ['warning', 'Quantum capacity widens; more asset tiers become exposed'],
      ['danger', 'Forged-signature incidents reported in the wild'],
      ['success', 'Wave migration clears another tranche of Tier-2 systems'],
      ['info', 'Crypto-agility drills validate algorithm-swap readiness'],
    ]
  return [
    ['info', 'Post-quantum operations are business-as-usual'],
    ['success', 'Hybrid deployments transitioning to PQC-only'],
    ['warning', 'Long-tail legacy systems remain the residual risk'],
    ['info', 'Continuous monitoring sustains the quantum-safe posture'],
  ]
}

const esc = (s) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)
const rows = ['year,q,sev,txt']
for (let year = 2026; year <= 2040; year++) {
  for (let q = 1; q <= 4; q++) {
    const key = `${year}Q${q}`
    const milestone = MILESTONES[key] ?? []
    for (const [sev, txt] of milestone) rows.push(`${year},${q},${sev},${esc(txt)}`)
    // always add an era baseline line (rotated) so every quarter has ≥1 record
    const era = ERA(year)
    const [sev, txt] = era[(q - 1) % era.length]
    rows.push(`${year},${q},${sev},${esc(txt)}`)
  }
}
writeFileSync(OUT, rows.join('\n') + '\n')
console.log(`wrote ${OUT} — ${rows.length - 1} records across ${(2040 - 2026 + 1) * 4} quarters`)
