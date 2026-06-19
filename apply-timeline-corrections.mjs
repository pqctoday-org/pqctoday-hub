// One-shot timeline-CSV correction pass (run-1 audit findings, 2026-06-18).
// Reads timeline_06072026.csv → applies corrections → writes timeline_06182026.csv.
// Never deletes rows: fabricated/superseded rows get status='deprecated' (+reason),
// which the loader's filterActive() excludes. Re-runnable (idempotent).
import { readFileSync, writeFileSync } from 'fs'
import Papa from 'papaparse'

const SRC = 'src/data/timeline_06072026.csv'
const OUT = 'src/data/timeline_06192026.csv'
const TODAY = '2026-06-19'

// [Country, Title] → deprecation reason (fabricated / superseded / inverted)
const DEPRECATE = [
  [
    'European Union',
    'Cryptographic Inventory Mandate',
    'Fabricated: EU Recommendation 2024/1101 is non-binding; no "v1.1" nor a Dec-2026 inventory deadline exists (timeline audit 2026-06-18).',
  ],
  [
    'European Union',
    'High-Priority System Migration Begins',
    'Unsupported: no EU source sets 2027 as high-priority migration start; NIS CG roadmap milestones are 2026 plan / 2030 high-risk / 2035 full (audit 2026-06-18).',
  ],
  [
    'Singapore',
    'Financial Sector PQC Migration Plans Due',
    'Fabricated: MAS advisory MAS/TCRS/2024/01 is non-prescriptive and sets no 2028/2026 deadlines (audit 2026-06-18).',
  ],
  [
    'Hong Kong',
    'PQC Readiness Assessment Required',
    'Fabricated: cited HKMA 2026 release announces a Quantum Preparedness Index only — no 2027 mandate, CBOM requirement, or "Fintech 2030" framework (audit 2026-06-18).',
  ],
  [
    'Hong Kong',
    'Financial Sector PQC Migration Complete',
    'Fabricated: HKMA source sets no 2030 completion target (audit 2026-06-18).',
  ],
  [
    'Germany',
    'Full PQC Transition — Standalone Algorithms Required',
    'Superseded by TR-02102-1 2026-01 edition and inverted: BSI REQUIRES hybrid for key establishment/signatures and does NOT mandate standalone PQC by 2035 (audit 2026-06-18).',
  ],
]

// [Country, Title] → { field: newValue }
const FIX = [
  [
    'European Union',
    'Coordinated Roadmap v1.1',
    { trusted_source_id: 'ec', SourceDate: '2025-06-23' },
  ],
  ['European Union', 'Member State Strategy Initiation', { SourceDate: '2025-06-11' }],
  ['European Union', 'High-Risk Systems Secured', { SourceDate: '2025-06-11' }],
  ['European Union', 'Full EU PQC Transition', { SourceDate: '2025-06-11' }],
  ['France', 'PQC Position Paper Follow-up', { SourceDate: '2023-10-11' }],
  [
    'United States',
    'NIST IR 8547 Transition Guidance (Draft)',
    {
      Description:
        'NIST publishes the Initial Public Draft of IR 8547 (Nov 2024), proposing PQC deprecation timelines (comment period closed Jan 2025). It remains at Initial Public Draft as of mid-2026; no second public draft has been published.',
    },
  ],
  [
    'United States',
    'FIPS 206 (FN-DSA) Draft Submitted',
    {
      SourceUrl: 'https://csrc.nist.gov/projects/post-quantum-cryptography',
      source_url_quality: 'url_needs_review',
      Description:
        'FN-DSA (Falcon) is selected for standardization as FIPS 206; the standard is not yet finalized and no public draft is published as of mid-2026. Tracked via the NIST PQC project page.',
    },
  ],
  [
    'Saudi Arabia',
    'ECC-2:2024 Cybersecurity Controls',
    { SourceUrl: 'https://nca.gov.sa/en/', source_url_quality: 'url_needs_review' },
  ],
  [
    'Australia',
    'ISM June 2025 Cryptography Guidelines Update',
    {
      Description:
        'ASD releases the June 2025 revision of the ISM Guidelines for Cryptography with further PQC transition detail; reinforces the 2030 deprecation of traditional asymmetric cryptography. ASD does not recommend hybrid schemes — it permits adopting final PQC standards directly.',
    },
  ],
  [
    'Australia',
    'Commonwealth Cyber Security Posture in 2025',
    {
      SourceDate: '2026-02-01',
      Description:
        'Annual ASD assessment of cyber-security posture across Commonwealth entities (FY2024-25 report, tabled in Parliament Feb 2026). Tracks PQC transition planning and ISM-1917 readiness across Australian government agencies.',
    },
  ],
  [
    'Germany',
    'Hybrid TLS Required for Classified Communications',
    {
      SourceDate: '2025-12-27',
      Description:
        'BSI TR-02102-2 (2026-01 edition, 27.12.2025) recommends hybrid TLS combining classical (ECDH) and PQC (ML-KEM) for sensitive/classified communications; sole classical key agreement is acceptable only through end-2031.',
    },
  ],
  [
    'Germany',
    'Hybrid IPsec and SSH Required',
    {
      SourceDate: '2026-01-27',
      Description:
        'BSI TR-02102-3 (2026-01 edition, 27.01.2026) recommends hybrid IPsec (IKEv2 with ML-KEM) and hybrid SSH (with ML-KEM) for sensitive communications; sole classical key agreement is acceptable through end-2031 (a recommendation, not a hard 2026 mandate).',
    },
  ],
]

// [FlagCode, Title] → the ONE row that IS each country's canonical PQC migration
// deadline for the sim (the first HARD gate; skips legacy CNSA 1.0, soft
// strategy/plan milestones, and protocol-specific rows). AU/JP/SG have no
// suitable Deadline row → untagged → the sim falls back to the Q-Day anchor.
const SIM_DEADLINE = [
  ['US', 'CNSA 2.0 Exclusive - Network/Signing'], // 2030
  ['DE', 'Critical Applications PQC — Hybrid No Longer Required'], // 2030
  ['FR', 'PQC Qualification Requirement'], // 2027
  ['GB', 'Full PQC Compliance'], // 2035 (UK)
  ['EU', 'High-Risk Systems Secured'], // 2030
  ['CA', 'High Priority Systems Complete'], // 2031
  ['KR', 'Full PQC Roadmap Complete'], // 2035
  ['JP', 'Government PQC Transition Deadline'], // 2035 — reinstated via R2_REINSTATE
]

// ── run-2 audit corrections (matched by FlagCode + Title; the auditor's line
// numbers drifted, so we match on content). ───────────────────────────────────
// Reinstate (un-deprecate) + apply changes — used for Japan's 2035 NCO deadline.
const R2_REINSTATE = [
  // JP was deprecated in the source CSV; NCO Nov-2025 interim report confirms 2035 target.
  [
    'JP',
    'Government PQC Transition Deadline',
    {
      source_url_quality: 'url_needs_review',
      data_quality_notes:
        'Reinstated 2026-06-19 per re-audit: Japan NCO Nov-2025 interim report sets a 2035 national PQC target. Verify the exact NCO source URL.',
    },
  ],
]
const R2_FIX = [
  [
    'OpenSSL 3.5.0 Native PQC Release',
    {
      SourceDate: '2025-04-08',
      SourceUrl: 'https://openssl-library.org/news/openssl-3.5-notes/',
      Description:
        'OpenSSL 3.5.0 (8 Apr 2025) ships native ML-KEM, ML-DSA and SLH-DSA support — the first stable OpenSSL release with built-in PQC, no external provider required.',
    },
  ],
  [
    'PQC Guideline GL-2004-2022',
    {
      StartYear: '2023',
      EndYear: '2023',
      SourceUrl: 'https://www.cryptrec.go.jp/report/cryptrec-gl-2004-2022.pdf',
    },
  ],
]
const R2_DEPRECATE = [
  [
    'OpenSSL 3.6.1 PQC Release',
    'Inaccurate: OpenSSL 3.6.1 (Jan 2026) is a CVE bugfix release with no PQC content; native ML-KEM/ML-DSA/SLH-DSA landed in 3.5 (Apr 2025), captured in the "OpenSSL 3.5.0 Native PQC Release" row (audit 2026-06-18).',
  ],
]

const { data, meta } = Papa.parse(readFileSync(SRC, 'utf8'), { header: true, skipEmptyLines: true })
const find = (country, title) => data.find((r) => r.Country === country && r.Title === title)
const findT = (title) => data.find((r) => r.Title === title)

let dep = 0
let fix = 0
const misses = []
for (const [c, t, reason] of DEPRECATE) {
  const r = find(c, t)
  if (!r) {
    misses.push(`DEP ${c}/${t}`)
    continue
  }
  r.status = 'deprecated'
  r.deprecated_at = TODAY
  r.deprecated_reason = reason
  dep++
}
for (const [c, t, changes] of FIX) {
  const r = find(c, t)
  if (!r) {
    misses.push(`FIX ${c}/${t}`)
    continue
  }
  Object.assign(r, changes)
  fix++
}

// ── run-2 corrections (must run before SIM_DEADLINE tagging — R2_REINSTATE
// un-deprecates JP so the tagger can find it) ────────────────────────────────
let r2dep = 0,
  r2fix = 0,
  r2reinstate = 0
for (const [t, reason] of R2_DEPRECATE) {
  const r = findT(t)
  if (!r) {
    misses.push(`R2DEP ${t}`)
    continue
  }
  r.status = 'deprecated'
  r.deprecated_at = TODAY
  r.deprecated_reason = reason
  r2dep++
}
for (const [t, changes] of R2_FIX) {
  const r = findT(t)
  if (!r) {
    misses.push(`R2FIX ${t}`)
    continue
  }
  Object.assign(r, changes)
  r2fix++
}
for (const [flag, title, changes] of R2_REINSTATE) {
  const r = data.find((x) => x.FlagCode === flag && x.Title === title)
  if (!r) {
    misses.push(`R2REINSTATE ${flag}/${title}`)
    continue
  }
  r.status = 'active'
  r.deprecated_at = ''
  r.deprecated_reason = ''
  Object.assign(r, changes)
  r2reinstate++
}

// New column: tag each country's canonical sim deadline (empty for all others).
// Runs AFTER all deprecate/reinstate passes so status is final.
for (const r of data) r.is_sim_deadline = ''
let tag = 0
for (const [flag, title] of SIM_DEADLINE) {
  const r = data.find((x) => x.FlagCode === flag && x.Title === title && x.status !== 'deprecated')
  if (!r) {
    misses.push(`TAG ${flag}/${title}`)
    continue
  }
  r.is_sim_deadline = 'true'
  tag++
}

if (misses.length) {
  console.error('UNMATCHED:\n  ' + misses.join('\n  '))
  process.exit(1)
}

const columns = [...meta.fields, 'is_sim_deadline']
writeFileSync(OUT, Papa.unparse(data, { columns }) + '\n')
console.log(
  `wrote ${OUT}: ${data.length} rows, ` +
    `${dep + r2dep} deprecated (+${r2dep} run-2), ` +
    `${fix + r2fix} field-fixed (+${r2fix} run-2), ` +
    `${r2reinstate} reinstated, ` +
    `${tag} sim-deadline-tagged`
)
